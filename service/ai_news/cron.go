package ai_news

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/system_setting"
)

var (
	cronLastRunDay = ""
	cronMu         sync.Mutex

	// Social posts and their images are cleaned up after this many days.
	// 90 days lets admins re-export an old briefing if needed; older state
	// usually loses relevance and chews up disk under the docker volume.
	socialPostRetentionDays = 90
)

// StartCron launches the AI news cron loop. Safe to call once from main.
// The loop ticks every minute. When the clock matches the configured
// (hour, minute) AND the agent hasn't already run today, it fires.
func StartCron() {
	go cronLoop()
	common.SysLog("[ai-news] cron started")
}

func cronLoop() {
	for {
		// Sleep to the top of the next minute to keep ticks aligned.
		now := time.Now()
		next := now.Truncate(time.Minute).Add(time.Minute)
		time.Sleep(time.Until(next))

		cronTick()
	}
}

func cronTick() {
	settings := system_setting.GetAINewsSettings()
	if !settings.CronEnabled {
		return
	}
	now := time.Now()
	if now.Hour() != settings.CronHour || now.Minute() != settings.CronMinute {
		return
	}
	today := now.Format("2006-01-02")

	cronMu.Lock()
	if cronLastRunDay == today {
		cronMu.Unlock()
		return
	}
	cronLastRunDay = today
	cronMu.Unlock()

	common.SysLog("[ai-news] cron firing for " + today)
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		if _, err := RunAgent(ctx, 0, RunOptions{Mode: RunModeAuto}); err != nil {
			common.SysLog("[ai-news] cron run error: " + err.Error())
		}
	}()
}

// StartCleanup launches a background loop that periodically removes social-post
// rows + on-disk images older than socialPostRetentionDays. Runs once at
// startup (after a short delay so the app finishes booting) then once per day.
func StartCleanup() {
	go cleanupLoop()
	common.SysLog("[ai-news] social-post cleanup started (retention=" + fmt.Sprintf("%dd", socialPostRetentionDays) + ")")
}

func cleanupLoop() {
	// Wait a few minutes after boot — gives DB connections time to settle and
	// avoids piling work onto the startup window.
	time.Sleep(5 * time.Minute)
	for {
		runSocialPostCleanup()
		time.Sleep(24 * time.Hour)
	}
}

func runSocialPostCleanup() {
	cutoff := time.Now().Add(-time.Duration(socialPostRetentionDays) * 24 * time.Hour).Unix()
	rows, err := model.ListAINewsSocialPostsOlderThan(cutoff)
	if err != nil {
		common.SysLog("[ai-news] cleanup list error: " + err.Error())
		return
	}
	if len(rows) == 0 {
		return
	}
	deleted := 0
	for _, row := range rows {
		if err := DeleteBriefingImageDir(row.BriefingId); err != nil {
			common.SysLog(fmt.Sprintf("[ai-news] cleanup briefing #%d image dir: %v", row.BriefingId, err))
		}
		if err := model.DeleteAINewsSocialPost(row.Id); err != nil {
			common.SysLog(fmt.Sprintf("[ai-news] cleanup briefing #%d row: %v", row.BriefingId, err))
			continue
		}
		deleted++
	}
	common.SysLog(fmt.Sprintf("[ai-news] cleanup done: removed %d social posts older than %d days", deleted, socialPostRetentionDays))
}
