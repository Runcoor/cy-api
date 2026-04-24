package controller

import (
	"context"
	"strconv"
	"strings"
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

// PreviewAINewsBriefing returns the rendered HTML email body that subscribers
// will receive for the given briefing. Used by the admin UI for live preview.
func PreviewAINewsBriefing(c *gin.Context) {
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
	subject := ai_news.EmailSubjectFor(br)
	bodyHTML := ai_news.BuildUserEmailHTML(br)
	common.ApiSuccess(c, gin.H{
		"subject": subject,
		"html":    bodyHTML,
	})
}

// ListAINewsRecipients returns the paginated list of users who would receive
// the briefing (matching its plan_ids), with name + email + plan info +
// already-sent flag. Used by the admin UI before clicking Send.
func ListAINewsRecipients(c *gin.Context) {
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
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	planIds, _ := ai_news.ParsePlanIds(br.PlanIdsJSON)

	items, total, err := ai_news.FindRecipientDetails(id, planIds, search, page, pageSize)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	resp := gin.H{
		"items":     items,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
		"plan_ids":  planIds,
	}
	// When the search box is empty and we matched nobody, attach the diagnostic
	// so the admin can see exactly which filter eliminated everyone.
	if total == 0 && strings.TrimSpace(search) == "" {
		if diag, derr := ai_news.DiagnoseRecipients(planIds); derr == nil {
			resp["diagnostic"] = diag
		}
	}
	common.ApiSuccess(c, resp)
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

// GetAINewsSocialPost returns the existing social-post draft for a briefing
// or {exists: false} if it hasn't been generated yet.
func GetAINewsSocialPost(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	post, err := ai_news.GetSocialPostForBriefing(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if post == nil {
		common.ApiSuccess(c, gin.H{"exists": false})
		return
	}
	common.ApiSuccess(c, gin.H{"exists": true, "post": post})
}

// GenerateAINewsSocialPost runs the LLM rewrite + image generation pipeline
// synchronously. Slow (~30s-3min). UI should show a spinner.
func GenerateAINewsSocialPost(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	if err := ai_news.PreflightCheckImageGen(); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Minute)
	defer cancel()
	post, err := ai_news.GenerateSocialPost(ctx, id)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, post)
}

// DownloadAINewsSocialPostZIP streams the packaged ZIP (caption + meta + images).
func DownloadAINewsSocialPostZIP(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	data, filename, err := ai_news.BuildSocialPostZIP(id)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Header("Content-Length", strconv.Itoa(len(data)))
	c.Data(200, "application/zip", data)
}

// ServeAINewsSocialImage serves one stored image for the admin preview UI.
// Path is the rel_path stored in DB. Path-traversal is blocked by
// ai_news.ResolveStoredImagePath.
func ServeAINewsSocialImage(c *gin.Context) {
	rel := strings.TrimPrefix(c.Param("filepath"), "/")
	if rel == "" {
		common.ApiErrorMsg(c, "invalid path")
		return
	}
	abs, err := ai_news.ResolveStoredImagePath(rel)
	if err != nil {
		common.ApiErrorMsg(c, "invalid path")
		return
	}
	c.File(abs)
}
