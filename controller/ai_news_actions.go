package controller

import (
	"context"
	"strconv"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/service/ai_news"

	"github.com/gin-gonic/gin"
)

// TriggerAINewsRun fires the agent in a background goroutine and returns 202.
// Performs synchronous pre-flight validation so misconfigured triggers fail
// immediately with a useful message instead of dropping the failure into a log.
//
// Body (all fields optional):
//
//	{
//	  "mode": "auto" | "urls" | "content",   // default "auto"
//	  "urls": ["https://...", ...],          // when mode == "urls"
//	  "articles": [{title, url, content}, ...] // when mode == "content"
//	}
func TriggerAINewsRun(c *gin.Context) {
	if ai_news.IsRunning() {
		common.ApiErrorMsg(c, "agent 正在运行中,请稍后再试")
		return
	}
	var opts ai_news.RunOptions
	// Body is optional; ignore decode errors so an empty POST means auto mode.
	_ = c.ShouldBindJSON(&opts)
	if opts.Mode == "" {
		opts.Mode = ai_news.RunModeAuto
	}
	if err := ai_news.PreflightCheckSettings(opts); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	adminId := c.GetInt("id")
	ai_news.RunAgentManually(adminId, opts)
	common.ApiSuccess(c, gin.H{"message": "agent triggered (running in background)"})
}

// GetAINewsRunStatus returns the latest run status (in-flight or last run).
// Used by the admin UI to surface progress / errors.
func GetAINewsRunStatus(c *gin.Context) {
	status := ai_news.GetLastRunStatus()
	common.ApiSuccess(c, gin.H{
		"running": ai_news.IsRunning(),
		"status":  status,
	})
}

// TestAINewsLLM fires a tiny LLM request to validate the configuration before
// running a full agent cycle. Returns per-mode result so the admin can see
// which endpoint(s) actually work for the configured model.
//
// Body (optional):
//
//	{ "model": "..." }    // overrides settings.LLMDeepModel for the test
func TestAINewsLLM(c *gin.Context) {
	var req struct {
		Model string `json:"model"`
	}
	_ = c.ShouldBindJSON(&req)
	result := ai_news.TestLLM(c.Request.Context(), req.Model)
	common.ApiSuccess(c, result)
}

// SendAINewsBriefing dispatches a briefing by email to all eligible subscribers.
// Synchronous so the admin gets immediate feedback on count.
func SendAINewsBriefing(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	br, err := model.GetAINewsBriefing(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if br.Status != model.AINewsBriefingStatusApproved &&
		br.Status != model.AINewsBriefingStatusDraft {
		common.ApiErrorMsg(c, "briefing must be in draft or approved status to send")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()
	sent, failed, err := ai_news.SendBriefingToUsers(ctx, id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"sent":   sent,
		"failed": failed,
	})
}
