package ai_news

import (
	"fmt"
	"html"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
)

// sendPreviewEmails fires preview emails to admins for a freshly generated
// pair of briefings. Errors are logged, never returned (caller is in a
// background goroutine and there's no one to surface to).
func sendPreviewEmails(adminEmails []string, deep, simple *model.AINewsBriefing) {
	if len(adminEmails) == 0 {
		return
	}
	subject := "[AI 前沿] 今日草稿已生成 · " + time.Now().Format("2006-01-02")
	body := buildPreviewHTML(deep, simple)
	for _, addr := range adminEmails {
		if addr = strings.TrimSpace(addr); addr == "" {
			continue
		}
		if err := common.SendEmail(subject, addr, body); err != nil {
			common.SysLog(fmt.Sprintf("[ai-news] preview email to %s failed: %v", addr, err))
		}
	}
}

func buildPreviewHTML(deep, simple *model.AINewsBriefing) string {
	var sb strings.Builder
	sb.WriteString(`<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#1d1d1f;">`)
	sb.WriteString(`<h2 style="margin-top:0;">AI 前沿信息 · 今日草稿</h2>`)
	sb.WriteString(`<p style="color:#86868b;">两份草稿已生成,请登录管理后台审核 / 编辑 / 发送。</p>`)

	sb.WriteString(briefingPreviewBlock("深度分析", deep))
	sb.WriteString(briefingPreviewBlock("简单总结", simple))

	sb.WriteString(`<hr style="border:none;border-top:1px solid #e5e5ea;margin:24px 0;">`)
	sb.WriteString(`<p style="color:#86868b;font-size:13px;">`)
	sb.WriteString(`管理后台: <a href="/console/admin/ai-news/briefings">/console/admin/ai-news/briefings</a><br>`)
	sb.WriteString(`这封邮件由 aggre-api AI 前沿 Agent 自动生成。`)
	sb.WriteString(`</p></div>`)
	return sb.String()
}

func briefingPreviewBlock(label string, b *model.AINewsBriefing) string {
	if b == nil {
		return fmt.Sprintf(`<div style="margin:16px 0;padding:16px;border:1px solid #ffcccc;border-radius:8px;background:#fff5f5;">
<strong>%s — 生成失败</strong><br>请查看后端日志。</div>`, html.EscapeString(label))
	}
	var srcs []SourceItem
	_ = common.UnmarshalJsonStr(b.SourcesJSON, &srcs)

	var sb strings.Builder
	fmt.Fprintf(&sb, `<div style="margin:16px 0;padding:16px;border:1px solid #e5e5ea;border-radius:8px;">`)
	fmt.Fprintf(&sb, `<div style="font-size:12px;color:#86868b;margin-bottom:6px;">%s · briefing #%d · status: %s</div>`,
		html.EscapeString(label), b.Id, html.EscapeString(b.Status))
	fmt.Fprintf(&sb, `<h3 style="margin:6px 0 12px;font-size:18px;">%s</h3>`, html.EscapeString(b.Title))
	if b.Summary != "" {
		fmt.Fprintf(&sb, `<p style="color:#3a3a3c;font-size:14px;font-style:italic;margin:8px 0 12px;">%s</p>`, html.EscapeString(b.Summary))
	}
	sb.WriteString(`<div style="background:#f5f5f7;padding:12px;border-radius:6px;margin-top:8px;">`)
	sb.WriteString(RenderMarkdownEmail(b.Content, srcs))
	sb.WriteString(`</div>`)
	sb.WriteString(`</div>`)
	return sb.String()
}
