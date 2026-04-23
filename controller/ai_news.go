package controller

import (
	"strconv"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/system_setting"

	"github.com/gin-gonic/gin"
)

// =====================================================================
// Settings
// =====================================================================

// GetAINewsSettings returns the current AI news agent configuration.
func GetAINewsSettings(c *gin.Context) {
	common.ApiSuccess(c, system_setting.GetAINewsSettings())
}

// UpdateAINewsSettings persists the AI news agent configuration.
func UpdateAINewsSettings(c *gin.Context) {
	var req system_setting.AINewsSettings
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	if req.LLMSource != system_setting.AINewsLLMSourceCustom &&
		req.LLMSource != system_setting.AINewsLLMSourceChannel {
		common.ApiErrorMsg(c, "llm_source must be \"custom\" or \"channel\"")
		return
	}
	if req.LLMSource == system_setting.AINewsLLMSourceCustom {
		if req.LLMCustomBaseURL == "" || req.LLMCustomAPIKey == "" {
			common.ApiErrorMsg(c, "custom mode requires llm_custom_base_url and llm_custom_api_key")
			return
		}
	}
	if req.CronHour < 0 || req.CronHour > 23 {
		common.ApiErrorMsg(c, "cron_hour must be 0-23")
		return
	}
	if req.CronMinute < 0 || req.CronMinute > 59 {
		common.ApiErrorMsg(c, "cron_minute must be 0-59")
		return
	}

	jsonStr, err := system_setting.SetAINewsSettings(req)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.UpdateOption(system_setting.AINewsSettingsKey(), jsonStr); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, system_setting.GetAINewsSettings())
}

// =====================================================================
// Sources
// =====================================================================

func ListAINewsSources(c *gin.Context) {
	enabledOnly := c.Query("enabled_only") == "true"
	sources, err := model.ListAINewsSources(enabledOnly)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, sources)
}

func CreateAINewsSource(c *gin.Context) {
	var s model.AINewsSource
	if err := c.ShouldBindJSON(&s); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	if err := model.CreateAINewsSource(&s); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, s)
}

func UpdateAINewsSource(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	var body struct {
		Type    *string `json:"type"`
		Value   *string `json:"value"`
		Enabled *bool   `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	updates := map[string]any{}
	if body.Type != nil {
		updates["type"] = *body.Type
	}
	if body.Value != nil {
		updates["value"] = *body.Value
	}
	if body.Enabled != nil {
		updates["enabled"] = *body.Enabled
	}
	if len(updates) == 0 {
		common.ApiErrorMsg(c, "no updatable fields")
		return
	}
	if err := model.UpdateAINewsSource(id, updates); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"message": "ok"})
}

func DeleteAINewsSource(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	if err := model.DeleteAINewsSource(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"message": "ok"})
}

// =====================================================================
// Briefings
// =====================================================================

func ListAINewsBriefings(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	briefings, total, err := model.ListAINewsBriefings(model.ListAINewsBriefingsParams{
		Type:     c.Query("type"),
		Status:   c.Query("status"),
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"items":     briefings,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetAINewsBriefing(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	b, err := model.GetAINewsBriefing(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, b)
}

func UpdateAINewsBriefing(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	var body struct {
		Title       *string `json:"title"`
		Summary     *string `json:"summary"`
		Content     *string `json:"content"`
		PlanIdsJSON *string `json:"plan_ids_json"`
		Status      *string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	updates := map[string]any{}
	if body.Title != nil {
		updates["title"] = *body.Title
	}
	if body.Summary != nil {
		updates["summary"] = *body.Summary
	}
	if body.Content != nil {
		updates["content"] = *body.Content
	}
	if body.PlanIdsJSON != nil {
		updates["plan_ids_json"] = *body.PlanIdsJSON
	}
	if body.Status != nil {
		updates["status"] = *body.Status
	}
	if len(updates) == 0 {
		common.ApiErrorMsg(c, "no updatable fields")
		return
	}
	if err := model.UpdateAINewsBriefing(id, updates); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"message": "ok"})
}

func DeleteAINewsBriefing(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := model.DeleteAINewsBriefing(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"message": "ok"})
}

// TriggerAINewsRun and SendAINewsBriefing are defined in ai_news_actions.go (Phase 2/5).
