package ai_news

import (
	"context"
	"sync"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/setting/system_setting"
)

var (
	cronLastRunDay = ""
	cronMu         sync.Mutex
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
		if _, err := RunAgent(ctx, 0); err != nil {
			common.SysLog("[ai-news] cron run error: " + err.Error())
		}
	}()
}
