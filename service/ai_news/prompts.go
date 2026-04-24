package ai_news

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
)

// generateBriefing dispatches one type of briefing (deep | simple) to the LLM
// and persists the result as a draft.
func generateBriefing(ctx context.Context, candidates []candidate, briefingType, modelName string, triggeredBy int) (*model.AINewsBriefing, error) {
	if modelName == "" {
		return nil, fmt.Errorf("model name not configured for %s briefing", briefingType)
	}

	systemPrompt, userPrompt, err := buildPrompt(briefingType, candidates)
	if err != nil {
		return nil, err
	}

	maxTokens := 8000
	if briefingType == model.AINewsBriefingTypeSimple {
		maxTokens = 2000
	}
	out, err := ChatComplete(ctx, modelName, []ChatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}, maxTokens)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(out) == "" {
		return nil, fmt.Errorf("LLM returned empty content for %s briefing", briefingType)
	}
	title, summary, content := splitLLMOutput(out, briefingType)
	if strings.TrimSpace(content) == "" {
		return nil, fmt.Errorf("parsed content is empty after splitting %s briefing output", briefingType)
	}

	sourceItems := make([]SourceItem, 0, len(candidates))
	for _, c := range candidates {
		sourceItems = append(sourceItems, SourceItem{Title: c.Title, URL: c.URL})
	}
	srcJSON, _ := common.Marshal(sourceItems)

	br := &model.AINewsBriefing{
		Type:        briefingType,
		Title:       title,
		Summary:     summary,
		Content:     content,
		SourcesJSON: string(srcJSON),
		PlanIdsJSON: "[]",
		Status:      model.AINewsBriefingStatusDraft,
		GeneratedAt: time.Now().Unix(),
		CreatedBy:   triggeredBy,
	}
	if err := model.CreateAINewsBriefing(br); err != nil {
		return nil, err
	}
	common.SysLog(fmt.Sprintf("[ai-news] wrote %s briefing #%d (%s)", briefingType, br.Id, br.Title))
	return br, nil
}

func buildPrompt(briefingType string, candidates []candidate) (system, user string, err error) {
	if len(candidates) == 0 {
		return "", "", fmt.Errorf("no candidates")
	}

	var sb strings.Builder
	for i, c := range candidates {
		fmt.Fprintf(&sb, "## Source %d\nTitle: %s\nURL: %s\n\n%s\n\n---\n\n",
			i+1, c.Title, c.URL, c.Body)
	}

	today := time.Now().Format("2006-01-02")

	switch briefingType {
	case model.AINewsBriefingTypeDeep:
		system = `You are a senior AI industry analyst writing a daily deep-dive briefing.
Your audience is paid subscribers — engineers, founders, and investors who already
know the basics. They want actionable insight, not headlines. Write in clear Chinese
(简体中文). When you cite a source, use [n] referring to the Source numbers below.

Output strict format:
TITLE: <one-line title, no markdown>
SUMMARY: <2-3 sentence executive summary>
CONTENT:
<the full briefing in Markdown — multiple sections with ## headings, prose paragraphs,
inline [n] citations, and a final "## 关键 takeaway" section listing 3-5 bullets>`
		user = fmt.Sprintf("日期: %s\n\n请基于以下 %d 个来源,产出一份深度分析:\n\n%s",
			today, len(candidates), sb.String())

	case model.AINewsBriefingTypeSimple:
		system = `You are an AI news editor producing a quick daily digest for paid subscribers.
Audience: busy professionals who want the gist in under 3 minutes. Write in clear
Chinese (简体中文). Cite sources as [n] referencing the Source numbers below.

Output strict format:
TITLE: <one-line title, no markdown>
SUMMARY: <one sentence, the single most important takeaway of the day>
CONTENT:
<5-8 bullet points in Markdown, each one sentence, ending with [n] citation(s).
No headings, no preamble, just bullets.>`
		user = fmt.Sprintf("日期: %s\n\n请基于以下 %d 个来源,产出今日 AI 简报:\n\n%s",
			today, len(candidates), sb.String())

	default:
		return "", "", fmt.Errorf("unknown briefing type %q", briefingType)
	}
	return
}

// splitLLMOutput extracts TITLE / SUMMARY / CONTENT sections from a model
// response that follows the prompt format. Falls back gracefully if the model
// drifts.
func splitLLMOutput(raw, briefingType string) (title, summary, content string) {
	raw = strings.TrimSpace(raw)
	lines := strings.Split(raw, "\n")
	mode := ""
	var titleSB, summarySB, contentSB strings.Builder
	for _, ln := range lines {
		trimmed := strings.TrimSpace(ln)
		switch {
		case strings.HasPrefix(trimmed, "TITLE:"):
			mode = "title"
			titleSB.WriteString(strings.TrimSpace(strings.TrimPrefix(trimmed, "TITLE:")))
		case strings.HasPrefix(trimmed, "SUMMARY:"):
			mode = "summary"
			summarySB.WriteString(strings.TrimSpace(strings.TrimPrefix(trimmed, "SUMMARY:")))
		case strings.HasPrefix(trimmed, "CONTENT:"):
			mode = "content"
			rest := strings.TrimSpace(strings.TrimPrefix(trimmed, "CONTENT:"))
			if rest != "" {
				contentSB.WriteString(rest)
				contentSB.WriteString("\n")
			}
		default:
			switch mode {
			case "title":
				// title is single-line; ignore continuations
			case "summary":
				if trimmed != "" {
					summarySB.WriteString(" ")
					summarySB.WriteString(trimmed)
				}
			case "content":
				contentSB.WriteString(ln)
				contentSB.WriteString("\n")
			}
		}
	}
	title = strings.TrimSpace(titleSB.String())
	summary = strings.TrimSpace(summarySB.String())
	content = strings.TrimSpace(contentSB.String())

	// Fallbacks
	if title == "" {
		switch briefingType {
		case model.AINewsBriefingTypeDeep:
			title = "AI 前沿深度分析 · " + time.Now().Format("2006-01-02")
		default:
			title = "AI 前沿日报 · " + time.Now().Format("2006-01-02")
		}
	}
	if content == "" {
		// Model didn't follow format — store the whole raw output as content
		content = raw
	}
	return
}
