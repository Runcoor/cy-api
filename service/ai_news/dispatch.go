package ai_news

import (
	"context"
	"fmt"
	"html"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
)

// SendBriefingToUsers delivers a briefing by email to every user with at least
// one ACTIVE subscription whose plan_id is in the briefing's PlanIdsJSON
// (empty plan_ids = "send to anyone with any active subscription").
//
// Updates the briefing's status → "sent" on success.
// Per-user successes / failures are written to ai_news_send_logs.
//
// Runs synchronously; caller can wrap in a goroutine if desired.
func SendBriefingToUsers(ctx context.Context, briefingId int) (sent int, failed int, err error) {
	br, err := model.GetAINewsBriefing(briefingId)
	if err != nil {
		return 0, 0, fmt.Errorf("load briefing: %w", err)
	}

	planIds, _ := parsePlanIds(br.PlanIdsJSON)

	users, err := findEligibleUsers(planIds)
	if err != nil {
		return 0, 0, fmt.Errorf("find recipients: %w", err)
	}
	if len(users) == 0 {
		return 0, 0, nil
	}

	subject := emailSubjectFor(br)
	bodyHTML := buildUserEmailHTML(br)

	for _, u := range users {
		if u.Email == "" {
			continue
		}
		// Skip if already successfully sent (defensive — caller should also check)
		already, _ := model.HasUserReceivedBriefing(briefingId, u.Id)
		if already {
			continue
		}
		serr := common.SendEmail(subject, u.Email, bodyHTML)
		log := &model.AINewsSendLog{
			BriefingId: briefingId,
			UserId:     u.Id,
			Email:      u.Email,
			SentAt:     time.Now().Unix(),
		}
		if serr != nil {
			log.ErrorMsg = truncate(serr.Error(), 500)
			failed++
		} else {
			sent++
		}
		_ = model.RecordAINewsSendLog(log)
	}

	if sent > 0 {
		_ = model.UpdateAINewsBriefing(briefingId, map[string]any{
			"status":  model.AINewsBriefingStatusSent,
			"sent_at": time.Now().Unix(),
		})
	}
	return sent, failed, nil
}

type recipientUser struct {
	Id    int
	Email string
}

// findEligibleUsers returns users with at least one active subscription matching
// the given plan_ids. Empty planIds means "any active subscription qualifies".
func findEligibleUsers(planIds []int) ([]recipientUser, error) {
	q := model.DB.Table("user_subscriptions us").
		Joins("JOIN users u ON u.id = us.user_id").
		Where("us.status = ?", "active").
		Where("us.end_time = 0 OR us.end_time > ?", time.Now().Unix()).
		Where("u.email <> ''").
		Where("u.status = ?", 1) // 1 = enabled
	if len(planIds) > 0 {
		q = q.Where("us.plan_id IN ?", planIds)
	}

	type row struct {
		UserId int
		Email  string
	}
	var rows []row
	if err := q.Distinct("us.user_id, u.email").
		Select("us.user_id as user_id, u.email as email").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]recipientUser, 0, len(rows))
	for _, r := range rows {
		out = append(out, recipientUser{Id: r.UserId, Email: r.Email})
	}
	return out, nil
}

func parsePlanIds(jsonStr string) ([]int, error) {
	jsonStr = strings.TrimSpace(jsonStr)
	if jsonStr == "" || jsonStr == "[]" {
		return nil, nil
	}
	var out []int
	if err := common.UnmarshalJsonStr(jsonStr, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func emailSubjectFor(b *model.AINewsBriefing) string {
	prefix := "[AI 前沿]"
	if b.Type == model.AINewsBriefingTypeDeep {
		prefix = "[AI 前沿·深度]"
	}
	return fmt.Sprintf("%s %s", prefix, b.Title)
}

func buildUserEmailHTML(b *model.AINewsBriefing) string {
	var srcs []SourceItem
	_ = common.UnmarshalJsonStr(b.SourcesJSON, &srcs)

	var sb strings.Builder
	sb.WriteString(`<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#1d1d1f;">`)
	fmt.Fprintf(&sb, `<h2 style="margin-top:0;font-size:22px;">%s</h2>`, html.EscapeString(b.Title))
	if b.Summary != "" {
		fmt.Fprintf(&sb, `<p style="font-size:15px;color:#3a3a3c;font-style:italic;margin:8px 0 16px;">%s</p>`, html.EscapeString(b.Summary))
	}
	sb.WriteString(`<hr style="border:none;border-top:1px solid #e5e5ea;margin:16px 0;">`)
	sb.WriteString(RenderMarkdownEmail(b.Content, srcs))

	// Sources block — anchored so [n] superscripts can jump here.
	if len(srcs) > 0 {
		sb.WriteString(`<hr style="border:none;border-top:1px solid #e5e5ea;margin:24px 0 12px;">`)
		sb.WriteString(`<h4 style="margin:0 0 8px;color:#86868b;font-size:13px;font-weight:600;">来源</h4>`)
		sb.WriteString(`<ol style="font-size:13px;color:#3a3a3c;padding-left:20px;margin:0;line-height:1.7;">`)
		for i, s := range srcs {
			title := s.Title
			if strings.TrimSpace(title) == "" {
				title = s.URL
			}
			fmt.Fprintf(&sb,
				`<li id="ai-news-source-%d" style="margin-bottom:4px;"><a href="%s" style="color:#0066cc;text-decoration:none;">%s</a></li>`,
				i+1, html.EscapeString(s.URL), html.EscapeString(title),
			)
		}
		sb.WriteString(`</ol>`)
	}

	sb.WriteString(`<hr style="border:none;border-top:1px solid #e5e5ea;margin:16px 0;">`)
	sb.WriteString(`<p style="font-size:12px;color:#86868b;">您订阅的 AI 前沿信息推送。如不希望继续接收,请联系管理员。</p>`)
	sb.WriteString(`</div>`)
	return sb.String()
}
