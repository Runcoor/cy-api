package model

import (
	"errors"
	"fmt"

	"github.com/runcoor/aggre-api/common"
	"gorm.io/gorm"
)

// ─── Team roles ───
const (
	TeamRoleMember = 1
	TeamRoleAdmin  = 10
	TeamRoleOwner  = 100
)

// ─── Team status ───
const (
	TeamStatusActive   = 1
	TeamStatusDisabled = 2
)

// ─── Team ───

type Team struct {
	Id           int            `json:"id" gorm:"primaryKey"`
	Name         string         `json:"name" gorm:"type:varchar(128);not null"`
	OwnerId      int            `json:"owner_id" gorm:"index;not null"`
	Quota        int            `json:"quota" gorm:"type:int;default:0"`
	UsedQuota    int            `json:"used_quota" gorm:"type:int;default:0"`
	RequestCount int            `json:"request_count" gorm:"type:int;default:0"`
	Status       int            `json:"status" gorm:"type:int;default:1"`
	InviteCode   string         `json:"invite_code" gorm:"type:varchar(32);uniqueIndex"`
	CreatedAt    int64          `json:"created_at" gorm:"bigint"`
	UpdatedAt    int64          `json:"updated_at" gorm:"bigint"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

func (t *Team) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	t.CreatedAt = now
	t.UpdatedAt = now
	if t.InviteCode == "" {
		t.InviteCode = common.GetRandomString(8)
	}
	return nil
}

func (t *Team) BeforeUpdate(tx *gorm.DB) error {
	t.UpdatedAt = common.GetTimestamp()
	return nil
}

func CreateTeam(team *Team) error {
	return DB.Create(team).Error
}

func GetTeamById(id int) (*Team, error) {
	var team Team
	err := DB.Where("id = ?", id).First(&team).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func GetUserTeams(userId int) ([]map[string]interface{}, error) {
	var members []TeamMember
	err := DB.Where("user_id = ? AND status = ?", userId, TeamStatusActive).Find(&members).Error
	if err != nil {
		return nil, err
	}
	if len(members) == 0 {
		return []map[string]interface{}{}, nil
	}

	teamIds := make([]int, 0, len(members))
	memberRoleMap := make(map[int]int)
	for _, m := range members {
		teamIds = append(teamIds, m.TeamId)
		memberRoleMap[m.TeamId] = m.Role
	}

	var teams []Team
	err = DB.Where("id IN ? AND status = ?", teamIds, TeamStatusActive).Find(&teams).Error
	if err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, 0, len(teams))
	for _, t := range teams {
		memberCount, _ := GetTeamMemberCount(t.Id)
		result = append(result, map[string]interface{}{
			"team":         t,
			"role":         memberRoleMap[t.Id],
			"member_count": memberCount,
		})
	}
	return result, nil
}

func UpdateTeamName(id int, name string) error {
	return DB.Model(&Team{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":       name,
		"updated_at": common.GetTimestamp(),
	}).Error
}

func DeleteTeam(id int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("team_id = ?", id).Delete(&TeamMember{}).Error; err != nil {
			return err
		}
		if err := tx.Where("team_id = ?", id).Delete(&TeamToken{}).Error; err != nil {
			return err
		}
		return tx.Delete(&Team{}, id).Error
	})
}

func GetTeamByInviteCode(code string) (*Team, error) {
	var team Team
	err := DB.Where("invite_code = ? AND status = ?", code, TeamStatusActive).First(&team).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func RegenerateTeamInviteCode(teamId int) (string, error) {
	code := common.GetRandomString(8)
	err := DB.Model(&Team{}).Where("id = ?", teamId).Updates(map[string]interface{}{
		"invite_code": code,
		"updated_at":  common.GetTimestamp(),
	}).Error
	return code, err
}

// ─── Team Quota ───

func GetTeamQuota(teamId int) (int, error) {
	var team Team
	err := DB.Select("quota").Where("id = ?", teamId).First(&team).Error
	return team.Quota, err
}

func IncreaseTeamQuota(teamId int, quota int) error {
	if quota < 0 {
		return errors.New("quota 不能为负数")
	}
	if common.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeTeamQuota, teamId, quota)
		return nil
	}
	return increaseTeamQuota(teamId, quota)
}

func increaseTeamQuota(teamId int, quota int) error {
	return DB.Model(&Team{}).Where("id = ?", teamId).Update("quota", gorm.Expr("quota + ?", quota)).Error
}

func DecreaseTeamQuota(teamId int, quota int) error {
	if quota < 0 {
		return errors.New("quota 不能为负数")
	}
	if common.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeTeamQuota, teamId, -quota)
		return nil
	}
	return decreaseTeamQuota(teamId, quota)
}

func decreaseTeamQuota(teamId int, quota int) error {
	return DB.Model(&Team{}).Where("id = ?", teamId).Update("quota", gorm.Expr("quota - ?", quota)).Error
}

func UpdateTeamUsedQuotaAndRequestCount(teamId int, quota int) {
	if common.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeTeamUsedQuota, teamId, quota)
		addNewRecord(BatchUpdateTypeTeamRequestCount, teamId, 1)
		return
	}
	updateTeamUsedQuotaAndRequestCount(teamId, quota, 1)
}

func updateTeamUsedQuotaAndRequestCount(teamId int, quota int, count int) {
	DB.Model(&Team{}).Where("id = ?", teamId).Updates(map[string]interface{}{
		"used_quota":    gorm.Expr("used_quota + ?", quota),
		"request_count": gorm.Expr("request_count + ?", count),
	})
}

// ─── TeamMember ───

type TeamMember struct {
	Id           int            `json:"id" gorm:"primaryKey"`
	TeamId       int            `json:"team_id" gorm:"uniqueIndex:idx_team_user;not null"`
	UserId       int            `json:"user_id" gorm:"uniqueIndex:idx_team_user;not null;index"`
	Role         int            `json:"role" gorm:"type:int;default:1"`
	QuotaLimit   int            `json:"quota_limit" gorm:"type:int;default:-1"`
	UsedQuota    int            `json:"used_quota" gorm:"type:int;default:0"`
	RequestCount int            `json:"request_count" gorm:"type:int;default:0"`
	Status       int            `json:"status" gorm:"type:int;default:1"`
	JoinedAt     int64          `json:"joined_at" gorm:"bigint"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

func AddTeamMember(member *TeamMember) error {
	if member.JoinedAt == 0 {
		member.JoinedAt = common.GetTimestamp()
	}
	return DB.Create(member).Error
}

func GetTeamMembers(teamId int) ([]map[string]interface{}, error) {
	var members []TeamMember
	err := DB.Where("team_id = ?", teamId).Find(&members).Error
	if err != nil {
		return nil, err
	}

	userIds := make([]int, 0, len(members))
	for _, m := range members {
		userIds = append(userIds, m.UserId)
	}

	var users []User
	if len(userIds) > 0 {
		DB.Select("id, username, display_name, email, status").Where("id IN ?", userIds).Find(&users)
	}
	userMap := make(map[int]User)
	for _, u := range users {
		userMap[u.Id] = u
	}

	result := make([]map[string]interface{}, 0, len(members))
	for _, m := range members {
		u := userMap[m.UserId]
		result = append(result, map[string]interface{}{
			"member":       m,
			"username":     u.Username,
			"display_name": u.DisplayName,
			"email":        u.Email,
		})
	}
	return result, nil
}

func GetTeamMemberByUserAndTeam(userId int, teamId int) (*TeamMember, error) {
	var member TeamMember
	err := DB.Where("user_id = ? AND team_id = ?", userId, teamId).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func GetTeamMemberCount(teamId int) (int64, error) {
	var count int64
	err := DB.Model(&TeamMember{}).Where("team_id = ? AND status = ?", teamId, TeamStatusActive).Count(&count).Error
	return count, err
}

func RemoveTeamMember(teamId int, userId int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("team_id = ? AND user_id = ?", teamId, userId).Delete(&TeamMember{}).Error; err != nil {
			return err
		}
		return tx.Where("team_id = ? AND user_id = ?", teamId, userId).Delete(&TeamToken{}).Error
	})
}

func UpdateTeamMemberQuotaLimit(teamId int, userId int, quotaLimit int) error {
	return DB.Model(&TeamMember{}).Where("team_id = ? AND user_id = ?", teamId, userId).Update("quota_limit", quotaLimit).Error
}

func GetTeamMemberUsedQuota(memberId int) (int, error) {
	var member TeamMember
	err := DB.Select("used_quota").Where("id = ?", memberId).First(&member).Error
	return member.UsedQuota, err
}

func UpdateTeamMemberUsedQuotaAndRequestCount(memberId int, quota int) {
	if common.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeMemberUsedQuota, memberId, quota)
		addNewRecord(BatchUpdateTypeMemberRequestCount, memberId, 1)
		return
	}
	updateTeamMemberUsedQuotaAndRequestCount(memberId, quota, 1)
}

func updateTeamMemberUsedQuotaAndRequestCount(memberId int, quota int, count int) {
	DB.Model(&TeamMember{}).Where("id = ?", memberId).Updates(map[string]interface{}{
		"used_quota":    gorm.Expr("used_quota + ?", quota),
		"request_count": gorm.Expr("request_count + ?", count),
	})
}

// ─── TeamToken ───

type TeamToken struct {
	Id      int `json:"id" gorm:"primaryKey"`
	TokenId int `json:"token_id" gorm:"uniqueIndex;not null"`
	TeamId  int `json:"team_id" gorm:"index;not null"`
	UserId  int `json:"user_id" gorm:"index;not null"`
}

func LinkTokenToTeam(tokenId int, teamId int, userId int) error {
	// Verify token belongs to user
	var token Token
	if err := DB.Select("id, user_id").Where("id = ?", tokenId).First(&token).Error; err != nil {
		return fmt.Errorf("令牌不存在")
	}
	if token.UserId != userId {
		return fmt.Errorf("只能关联自己的令牌")
	}
	// Check not already linked
	var existing TeamToken
	if err := DB.Where("token_id = ?", tokenId).First(&existing).Error; err == nil {
		if existing.TeamId == teamId {
			return nil // already linked to this team
		}
		return fmt.Errorf("该令牌已关联到其他团队")
	}
	return DB.Create(&TeamToken{
		TokenId: tokenId,
		TeamId:  teamId,
		UserId:  userId,
	}).Error
}

func UnlinkTokenFromTeam(tokenId int, teamId int, userId int) error {
	return DB.Where("token_id = ? AND team_id = ? AND user_id = ?", tokenId, teamId, userId).Delete(&TeamToken{}).Error
}

func GetTeamByTokenId(tokenId int) (*TeamToken, error) {
	var tt TeamToken
	err := DB.Where("token_id = ?", tokenId).First(&tt).Error
	if err != nil {
		return nil, err
	}
	return &tt, nil
}

func GetTeamTokens(teamId int) ([]map[string]interface{}, error) {
	var teamTokens []TeamToken
	if err := DB.Where("team_id = ?", teamId).Find(&teamTokens).Error; err != nil {
		return nil, err
	}
	if len(teamTokens) == 0 {
		return []map[string]interface{}{}, nil
	}

	tokenIds := make([]int, 0, len(teamTokens))
	for _, tt := range teamTokens {
		tokenIds = append(tokenIds, tt.TokenId)
	}

	var tokens []Token
	DB.Select("id, name, status, user_id, remain_quota, unlimited_quota, used_quota").
		Where("id IN ?", tokenIds).Find(&tokens)
	tokenMap := make(map[int]Token)
	for _, t := range tokens {
		tokenMap[t.Id] = t
	}

	// Get usernames
	userIds := make(map[int]bool)
	for _, tt := range teamTokens {
		userIds[tt.UserId] = true
	}
	userIdList := make([]int, 0, len(userIds))
	for uid := range userIds {
		userIdList = append(userIdList, uid)
	}
	var users []User
	if len(userIdList) > 0 {
		DB.Select("id, username, display_name").Where("id IN ?", userIdList).Find(&users)
	}
	userMap := make(map[int]User)
	for _, u := range users {
		userMap[u.Id] = u
	}

	result := make([]map[string]interface{}, 0, len(teamTokens))
	for _, tt := range teamTokens {
		t := tokenMap[tt.TokenId]
		u := userMap[tt.UserId]
		result = append(result, map[string]interface{}{
			"team_token":   tt,
			"token_name":   t.Name,
			"token_status": t.Status,
			"token_used":   t.UsedQuota,
			"username":     u.Username,
			"display_name": u.DisplayName,
		})
	}
	return result, nil
}

func GetUserAvailableTokensForTeam(userId int) ([]Token, error) {
	var tokens []Token
	err := DB.Select("id, name, status, "+commonGroupCol+", remain_quota, used_quota, unlimited_quota").
		Where("user_id = ? AND id NOT IN (SELECT token_id FROM team_tokens)", userId).
		Order("id desc").
		Find(&tokens).Error
	return tokens, err
}
