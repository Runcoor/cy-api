package controller

import (
	"strconv"
	"strings"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

// checkTeamFeaturePermission verifies if the user has the required subscription to manage teams.
// Returns true if allowed, false if not (and sends error response).
func checkTeamFeaturePermission(c *gin.Context) bool {
	planId := operation_setting.TeamRequiredPlanId
	if planId == 0 {
		common.ApiErrorMsg(c, "团队功能未启用")
		return false
	}
	if planId == -1 {
		// Open to all users
		return true
	}
	userId := c.GetInt("id")
	// Admin/root users bypass subscription check
	role := c.GetInt("role")
	if role >= common.RoleAdminUser {
		return true
	}
	has, err := model.HasActiveSubscriptionForPlan(userId, planId)
	if err != nil || !has {
		common.ApiErrorMsg(c, "需要订阅指定套餐才能使用团队功能")
		return false
	}
	return true
}

// ─── Helpers ───

func getTeamAndVerifyRole(c *gin.Context, minRole int) (*model.Team, *model.TeamMember, bool) {
	teamId, _ := strconv.Atoi(c.Param("id"))
	if teamId <= 0 {
		common.ApiErrorMsg(c, "无效的团队ID")
		return nil, nil, false
	}
	team, err := model.GetTeamById(teamId)
	if err != nil {
		common.ApiErrorMsg(c, "团队不存在")
		return nil, nil, false
	}
	userId := c.GetInt("id")
	member, err := model.GetTeamMemberByUserAndTeam(userId, teamId)
	if err != nil || member == nil {
		common.ApiErrorMsg(c, "你不是该团队的成员")
		return nil, nil, false
	}
	if member.Role < minRole {
		common.ApiErrorMsg(c, "权限不足")
		return nil, nil, false
	}
	return team, member, true
}

// ─── Team CRUD ───

type CreateTeamRequest struct {
	Name string `json:"name"`
}

func CreateTeam(c *gin.Context) {
	if !checkTeamFeaturePermission(c) {
		return
	}
	var req CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		common.ApiErrorMsg(c, "团队名称不能为空")
		return
	}
	userId := c.GetInt("id")

	team := &model.Team{
		Name:    name,
		OwnerId: userId,
		Status:  model.TeamStatusActive,
	}
	if err := model.CreateTeam(team); err != nil {
		common.ApiError(c, err)
		return
	}
	// Add creator as owner member
	if err := model.AddTeamMember(&model.TeamMember{
		TeamId: team.Id,
		UserId: userId,
		Role:   model.TeamRoleOwner,
		Status: model.TeamStatusActive,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	// Auto-sync subscription remaining quota to team
	planId := operation_setting.TeamRequiredPlanId
	if planId > 0 {
		remaining, err := model.GetActiveSubscriptionRemainingQuota(userId, planId)
		if err == nil && remaining > 0 {
			_ = model.IncreaseTeamQuota(team.Id, int(remaining))
			team.Quota = int(remaining)
		}
	}
	common.ApiSuccess(c, team)
}

func GetTeamPermission(c *gin.Context) {
	planId := operation_setting.TeamRequiredPlanId
	if planId == 0 {
		common.ApiSuccess(c, gin.H{"enabled": false, "can_create": false, "is_member": false})
		return
	}
	userId := c.GetInt("id")
	canCreate := false
	if planId == -1 {
		canCreate = true
	} else {
		role := c.GetInt("role")
		if role >= common.RoleAdminUser {
			canCreate = true
		} else {
			has, _ := model.HasActiveSubscriptionForPlan(userId, planId)
			canCreate = has
		}
	}
	// Check if user is a member of any team
	teams, _ := model.GetUserTeams(userId)
	isMember := len(teams) > 0
	common.ApiSuccess(c, gin.H{"enabled": true, "can_create": canCreate, "is_member": isMember})
}

func GetUserTeams(c *gin.Context) {
	userId := c.GetInt("id")
	teams, err := model.GetUserTeams(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, teams)
}

func GetTeam(c *gin.Context) {
	team, member, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	memberCount, _ := model.GetTeamMemberCount(team.Id)
	common.ApiSuccess(c, gin.H{
		"team":         team,
		"role":         member.Role,
		"member_count": memberCount,
	})
}

func UpdateTeam(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	var req CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		common.ApiErrorMsg(c, "团队名称不能为空")
		return
	}
	if err := model.UpdateTeamName(team.Id, name); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func DeleteTeam(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	if err := model.DeleteTeam(team.Id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Members ───

type AddMemberRequest struct {
	UserId int `json:"user_id"`
}

func AddTeamMember(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	var req AddMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.UserId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	// Check user exists
	targetUser, err := model.GetUserById(req.UserId, false)
	if err != nil || targetUser == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}
	// Check not already a member
	existing, _ := model.GetTeamMemberByUserAndTeam(req.UserId, team.Id)
	if existing != nil {
		common.ApiErrorMsg(c, "该用户已是团队成员")
		return
	}
	if err := model.AddTeamMember(&model.TeamMember{
		TeamId: team.Id,
		UserId: req.UserId,
		Role:   model.TeamRoleMember,
		Status: model.TeamStatusActive,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func GetTeamMembers(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	members, err := model.GetTeamMembers(team.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, members)
}

type UpdateMemberRequest struct {
	QuotaLimit int `json:"quota_limit"`
}

func UpdateTeamMember(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	targetUserId, _ := strconv.Atoi(c.Param("user_id"))
	if targetUserId <= 0 {
		common.ApiErrorMsg(c, "无效的用户ID")
		return
	}
	var req UpdateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.UpdateTeamMemberQuotaLimit(team.Id, targetUserId, req.QuotaLimit); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func RemoveTeamMember(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	targetUserId, _ := strconv.Atoi(c.Param("user_id"))
	if targetUserId <= 0 {
		common.ApiErrorMsg(c, "无效的用户ID")
		return
	}
	if targetUserId == team.OwnerId {
		common.ApiErrorMsg(c, "不能移除团队创建者")
		return
	}
	if err := model.RemoveTeamMember(team.Id, targetUserId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Quota ───

type TopUpTeamQuotaRequest struct {
	Quota int `json:"quota"`
}

func TopUpTeamQuota(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	var req TopUpTeamQuotaRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Quota <= 0 {
		common.ApiErrorMsg(c, "充值额度必须大于0")
		return
	}
	userId := c.GetInt("id")
	// Deduct from owner's personal quota
	userQuota, err := model.GetUserQuota(userId, true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if userQuota < req.Quota {
		common.ApiErrorMsg(c, "个人额度不足")
		return
	}
	if err := model.DecreaseUserQuota(userId, req.Quota); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.IncreaseTeamQuota(team.Id, req.Quota); err != nil {
		// Rollback
		_ = model.IncreaseUserQuota(userId, req.Quota, true)
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Token linking ───

func GetAvailableTokensForTeam(c *gin.Context) {
	_, _, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	userId := c.GetInt("id")
	tokens, err := model.GetUserAvailableTokensForTeam(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, tokens)
}

func LinkTokenToTeam(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	tokenId, _ := strconv.Atoi(c.Param("token_id"))
	if tokenId <= 0 {
		common.ApiErrorMsg(c, "无效的令牌ID")
		return
	}
	userId := c.GetInt("id")
	if err := model.LinkTokenToTeam(tokenId, team.Id, userId); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}

func UnlinkTokenFromTeam(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	tokenId, _ := strconv.Atoi(c.Param("token_id"))
	if tokenId <= 0 {
		common.ApiErrorMsg(c, "无效的令牌ID")
		return
	}
	userId := c.GetInt("id")
	if err := model.UnlinkTokenFromTeam(tokenId, team.Id, userId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func GetTeamTokens(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	tokens, err := model.GetTeamTokens(team.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, tokens)
}

// ─── Usage ───

func GetTeamUsageStats(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleAdmin)
	if !ok {
		return
	}
	members, err := model.GetTeamMembers(team.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"team":    team,
		"members": members,
	})
}

// ─── Invite ───

func RegenerateInviteCode(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	code, err := model.RegenerateTeamInviteCode(team.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"invite_code": code})
}

func JoinTeamByInvite(c *gin.Context) {
	code := c.Param("invite_code")
	if code == "" {
		common.ApiErrorMsg(c, "邀请码不能为空")
		return
	}
	team, err := model.GetTeamByInviteCode(code)
	if err != nil {
		common.ApiErrorMsg(c, "邀请码无效或团队已停用")
		return
	}
	userId := c.GetInt("id")
	existing, _ := model.GetTeamMemberByUserAndTeam(userId, team.Id)
	if existing != nil {
		common.ApiErrorMsg(c, "你已是该团队的成员")
		return
	}
	if err := model.AddTeamMember(&model.TeamMember{
		TeamId: team.Id,
		UserId: userId,
		Role:   model.TeamRoleMember,
		Status: model.TeamStatusActive,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"team_id":   team.Id,
		"team_name": team.Name,
	})
}
