package ai_news

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/system_setting"
)

// =====================================================================
// SocialPost — admin-facing in-memory shape (DB row + parsed JSON fields)
// =====================================================================

type SocialPost struct {
	Id         int           `json:"id"`
	BriefingId int           `json:"briefing_id"`
	Kind       string        `json:"kind"`
	Title      string        `json:"title"`
	Body       string        `json:"body"`
	Tags       []string      `json:"tags"`
	Images     []StoredImage `json:"images"`
	Status     string        `json:"status"`
	ErrorMsg   string        `json:"error_msg,omitempty"`
	CreatedAt  int64         `json:"created_at"`
	UpdatedAt  int64         `json:"updated_at"`
}

func socialPostFromRow(p *model.AINewsSocialPost) *SocialPost {
	out := &SocialPost{
		Id:         p.Id,
		BriefingId: p.BriefingId,
		Kind:       p.Kind,
		Title:      p.Title,
		Body:       p.Body,
		Status:     p.Status,
		ErrorMsg:   p.ErrorMsg,
		CreatedAt:  p.CreatedAt,
		UpdatedAt:  p.UpdatedAt,
	}
	if strings.TrimSpace(p.TagsJSON) != "" {
		_ = common.UnmarshalJsonStr(p.TagsJSON, &out.Tags)
	}
	if strings.TrimSpace(p.ImagesJSON) != "" {
		_ = common.UnmarshalJsonStr(p.ImagesJSON, &out.Images)
	}
	return out
}

// GetSocialPostForBriefing returns the existing social post or nil if none yet.
func GetSocialPostForBriefing(briefingId int) (*SocialPost, error) {
	row, err := model.GetAINewsSocialPostByBriefing(briefingId)
	if err != nil {
		if model.IsAINewsSocialPostNotFound(err) {
			return nil, nil
		}
		return nil, err
	}
	return socialPostFromRow(row), nil
}

// =====================================================================
// LLM analysis — turn briefing → social-platform copy + image prompts
// =====================================================================

// maxSocialImages is the hard ceiling on images per generated post. Set to 3
// because: (a) 小红书 covers usually have 1-3 images anyway, (b) 3 × ~30s upstream
// keeps total generation under our 8-min request budget, (c) image-gen calls
// are paid per image — accidental 9-image runs add up fast.
const maxSocialImages = 3

type socialAnalysis struct {
	Kind         string                 `json:"kind"`
	Title        string                 `json:"title"`
	Body         string                 `json:"body"`
	Tags         []string               `json:"tags"`
	ImagePrompts []socialAnalysisImgReq `json:"image_prompts"`
}

type socialAnalysisImgReq struct {
	Caption string `json:"caption"`
	Prompt  string `json:"prompt"`
}

const socialSystemPrompt = `你是小红书 / 微博内容编辑,擅长把 AI 行业的技术深度文章改写成适合社交平台的笔记。
严格输出 JSON,不要 Markdown 围栏,不要任何解释文字。`

const socialUserPromptTpl = `请把下面这篇 AI 行业深度分析改写成一篇适合小红书发布的笔记,并设计配图。

---
原文标题: %s
原文摘要: %s
原文正文(markdown):
%s
---

输出 JSON 结构(严格):
{
  "kind": "image_only" | "text_image",
  "title": string,
  "body": string,
  "tags": [string, ...],
  "image_prompts": [
    {"caption": string, "prompt": string}
  ]
}

字段约束:
- title: 中文,<= 25 个汉字,可加 1-2 个 emoji,要勾人想点开
- body:
  - 如果 kind = "image_only": 30-100 字,只是引子,价值在图里
  - 如果 kind = "text_image": 300-600 字,markdown,段落空行分隔,可用 ## 小标题、列表、**加粗**;不要代码块、不要外链
- tags: 3-6 个中文话题词,**不带 # 号**,例 ["AI", "GPT", "OpenAI"]
- image_prompts:
  - **必须 2 或 3 张,不要更多**
  - kind = "image_only": 建议 3 张 (封面 + 2 个核心要点)
  - kind = "text_image": 建议 2 张 (封面 + 1 个补充)
  - caption: 中文,这张图代表什么(<= 12 字),只给人看
  - prompt: **英文** DALL-E 风格描述,统一以 "modern flat illustration, soft gradient background, clean minimal aesthetic, premium tech magazine style, 1:1 square composition" 起手,后续追加该图具体内容

kind 判断:
- 内容是榜单 / 速览 / 对比 / 数据 → image_only
- 内容是叙事 / 分析 / 故事 / 教程 → text_image

只输出 JSON,从 { 开始 } 结束。`

func buildSocialAnalysisMessages(b *model.AINewsBriefing) []ChatMessage {
	user := fmt.Sprintf(
		socialUserPromptTpl,
		b.Title,
		nonEmpty(b.Summary, "(无摘要)"),
		truncateForLLM(b.Content, 12000),
	)
	return []ChatMessage{
		{Role: "system", Content: socialSystemPrompt},
		{Role: "user", Content: user},
	}
}

// extractFirstJSONObject finds the outermost { ... } in s. Some upstream
// models still wrap their JSON in stray prose despite instructions.
func extractFirstJSONObject(s string) string {
	s = strings.TrimSpace(s)
	// Strip ```json fences if present
	if strings.HasPrefix(s, "```") {
		if idx := strings.Index(s, "\n"); idx > 0 {
			s = s[idx+1:]
		}
		if idx := strings.LastIndex(s, "```"); idx > 0 {
			s = s[:idx]
		}
		s = strings.TrimSpace(s)
	}
	start := strings.Index(s, "{")
	if start < 0 {
		return ""
	}
	depth := 0
	inStr := false
	esc := false
	for i := start; i < len(s); i++ {
		c := s[i]
		if esc {
			esc = false
			continue
		}
		if inStr {
			if c == '\\' {
				esc = true
			} else if c == '"' {
				inStr = false
			}
			continue
		}
		switch c {
		case '"':
			inStr = true
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return s[start : i+1]
			}
		}
	}
	return ""
}

func parseSocialAnalysis(raw string) (*socialAnalysis, error) {
	js := extractFirstJSONObject(raw)
	if js == "" {
		return nil, fmt.Errorf("LLM did not return JSON: %s", truncate(raw, 200))
	}
	var out socialAnalysis
	if err := common.UnmarshalJsonStr(js, &out); err != nil {
		return nil, fmt.Errorf("parse JSON: %w (got=%s)", err, truncate(js, 200))
	}
	out.Kind = strings.TrimSpace(out.Kind)
	if out.Kind != model.AINewsSocialKindImageOnly && out.Kind != model.AINewsSocialKindTextImage {
		// Be forgiving — default to text_image if model returned something weird
		out.Kind = model.AINewsSocialKindTextImage
	}
	if strings.TrimSpace(out.Title) == "" {
		return nil, fmt.Errorf("LLM returned empty title")
	}
	if len(out.ImagePrompts) < 2 {
		return nil, fmt.Errorf("LLM returned %d image prompts, need at least 2", len(out.ImagePrompts))
	}
	// Hard cap at 3 — keeps generation under ~2min, controls upstream cost,
	// and matches the typical Xiaohongshu cover-image pattern.
	if len(out.ImagePrompts) > maxSocialImages {
		out.ImagePrompts = out.ImagePrompts[:maxSocialImages]
	}
	return &out, nil
}

// =====================================================================
// Main entry point — async generate (or regenerate) the social post
// =====================================================================

// generationLockTTL is the window during which we treat an existing
// status='generating' row as a live job and refuse to start a duplicate.
// Generous because the worker has its own 8-min budget and we don't want
// concurrent admin clicks racing on the same briefing's image dir.
const generationLockTTL = 10 * time.Minute

// EnqueueSocialPostGeneration validates inputs, creates a placeholder row
// with status='generating', and kicks off the slow LLM + image pipeline
// in a background goroutine. Returns the placeholder so the caller can
// respond immediately and the UI can start polling.
func EnqueueSocialPostGeneration(briefingId int) (*SocialPost, error) {
	if err := PreflightCheckImageGen(); err != nil {
		return nil, err
	}
	br, err := model.GetAINewsBriefing(briefingId)
	if err != nil {
		return nil, err
	}
	if br.Type != model.AINewsBriefingTypeDeep {
		return nil, fmt.Errorf("社交发布只支持深度分析类型的简报")
	}

	// If a job is already in flight for this briefing (same admin double-clicked,
	// or two admins clicked together), return the existing placeholder rather
	// than spawning a second worker that races on the same image dir.
	if existing, err := model.GetAINewsSocialPostByBriefing(briefingId); err == nil {
		if existing.Status == model.AINewsSocialStatusGenerating &&
			time.Since(time.Unix(existing.UpdatedAt, 0)) < generationLockTTL {
			return socialPostFromRow(existing), nil
		}
	}

	// Clear prior state so the worker starts clean. Failures here are
	// non-fatal — worst case we leave a stale image dir to be cleaned by cron.
	if err := DeleteBriefingImageDir(briefingId); err != nil {
		common.SysLog(fmt.Sprintf("[ai-news/social] briefing #%d: clear old image dir: %v", briefingId, err))
	}
	_ = model.DeleteAINewsSocialPostByBriefing(briefingId)

	row := &model.AINewsSocialPost{
		BriefingId: briefingId,
		Kind:       model.AINewsSocialKindTextImage, // placeholder; real kind set by worker
		Status:     model.AINewsSocialStatusGenerating,
	}
	if err := model.CreateAINewsSocialPost(row); err != nil {
		return nil, fmt.Errorf("create placeholder: %w", err)
	}

	go runSocialPostGeneration(row.Id, briefingId)
	return socialPostFromRow(row), nil
}

// runSocialPostGeneration is the goroutine body. It owns its own context
// (request context died as soon as the HTTP handler returned) and writes
// the final ready/failed status back to the placeholder row.
func runSocialPostGeneration(postId, briefingId int) {
	defer func() {
		if r := recover(); r != nil {
			msg := fmt.Sprintf("panic: %v", r)
			common.SysError(fmt.Sprintf("[ai-news/social] briefing #%d worker panic: %v", briefingId, r))
			_ = model.UpdateAINewsSocialPost(postId, map[string]any{
				"status":    model.AINewsSocialStatusFailed,
				"error_msg": truncate(msg, 1000),
			})
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Minute)
	defer cancel()

	if err := generateSocialPostInto(ctx, postId, briefingId); err != nil {
		common.SysLog(fmt.Sprintf("[ai-news/social] briefing #%d: failed: %v", briefingId, err))
		_ = model.UpdateAINewsSocialPost(postId, map[string]any{
			"status":    model.AINewsSocialStatusFailed,
			"error_msg": truncate(err.Error(), 1000),
		})
	}
}

// generateSocialPostInto runs the actual pipeline and writes results into
// the existing placeholder row. Returns error on any failure; caller marks
// the row failed.
func generateSocialPostInto(ctx context.Context, postId, briefingId int) error {
	settings := system_setting.GetAINewsSettings()
	br, err := model.GetAINewsBriefing(briefingId)
	if err != nil {
		return err
	}

	// Step 1: LLM analysis
	common.SysLog(fmt.Sprintf("[ai-news/social] briefing #%d: requesting LLM rewrite", briefingId))
	rawJSON, err := ChatComplete(ctx, settings.LLMDeepModel, buildSocialAnalysisMessages(br), 4096)
	if err != nil {
		return fmt.Errorf("LLM rewrite: %w", err)
	}
	analysis, err := parseSocialAnalysis(rawJSON)
	if err != nil {
		return err
	}

	// Step 2: generate + download each image, sequentially.
	stored := make([]StoredImage, 0, len(analysis.ImagePrompts))
	for i, p := range analysis.ImagePrompts {
		caption := strings.TrimSpace(p.Caption)
		prompt := strings.TrimSpace(p.Prompt)
		if prompt == "" {
			common.SysLog(fmt.Sprintf("[ai-news/social] briefing #%d: skip image %d (empty prompt)", briefingId, i))
			continue
		}
		results, err := GenerateImage(ctx, GenImageOptions{Prompt: prompt, N: 1, Size: "1024x1024"})
		if err != nil {
			return fmt.Errorf("image %d gen: %w", i+1, err)
		}
		if len(results) == 0 {
			return fmt.Errorf("image %d gen: empty result", i+1)
		}
		img, err := DownloadAndStoreImage(ctx, briefingId, i+1, results[0].URL, results[0].B64)
		if err != nil {
			return fmt.Errorf("image %d download: %w", i+1, err)
		}
		img.Prompt = prompt
		img.Caption = caption
		stored = append(stored, img)
	}
	if len(stored) < 2 {
		return fmt.Errorf("生成图片数量不足 (%d), 至少需要 2 张", len(stored))
	}

	// Step 3: write final state into the placeholder row.
	tagsJSON, _ := common.Marshal(analysis.Tags)
	imagesJSON, _ := common.Marshal(stored)
	if err := model.UpdateAINewsSocialPost(postId, map[string]any{
		"kind":        analysis.Kind,
		"title":       analysis.Title,
		"body":        analysis.Body,
		"tags_json":   string(tagsJSON),
		"images_json": string(imagesJSON),
		"status":      model.AINewsSocialStatusReady,
		"error_msg":   "",
	}); err != nil {
		return fmt.Errorf("persist social post: %w", err)
	}

	common.SysLog(fmt.Sprintf("[ai-news/social] briefing #%d: generated %d images, kind=%s", briefingId, len(stored), analysis.Kind))
	return nil
}

// =====================================================================
// ZIP packaging for download
// =====================================================================

// BuildSocialPostZIP packages caption.txt + meta.json + images/*.png into a
// single zip blob the admin can download and upload to 小红书 manually.
func BuildSocialPostZIP(briefingId int) ([]byte, string, error) {
	post, err := GetSocialPostForBriefing(briefingId)
	if err != nil {
		return nil, "", err
	}
	if post == nil {
		return nil, "", fmt.Errorf("社交帖未生成")
	}

	buf := &bytes.Buffer{}
	zw := zip.NewWriter(buf)

	// caption.txt — what the user pastes into the platform's text box.
	caption := buildCaptionText(post)
	cf, err := zw.Create("caption.txt")
	if err != nil {
		return nil, "", err
	}
	if _, err := cf.Write([]byte(caption)); err != nil {
		return nil, "", err
	}

	// meta.json — full record for traceability
	if metaBytes, err := common.Marshal(post); err == nil {
		mf, _ := zw.Create("meta.json")
		_, _ = mf.Write(metaBytes)
	}

	// images/01.png …
	for _, img := range post.Images {
		abs, err := ResolveStoredImagePath(img.RelPath)
		if err != nil {
			continue
		}
		data, err := os.ReadFile(abs)
		if err != nil {
			continue
		}
		ext := filepath.Ext(img.RelPath)
		if ext == "" {
			ext = ".png"
		}
		zfName := fmt.Sprintf("images/%02d%s", img.Position, ext)
		zf, err := zw.Create(zfName)
		if err != nil {
			continue
		}
		_, _ = zf.Write(data)
	}

	if err := zw.Close(); err != nil {
		return nil, "", err
	}
	filename := fmt.Sprintf("xhs-briefing-%d-%s.zip", briefingId, time.Now().Format("20060102-150405"))
	return buf.Bytes(), filename, nil
}

func buildCaptionText(p *SocialPost) string {
	var sb strings.Builder
	sb.WriteString(p.Title)
	sb.WriteString("\n\n")
	sb.WriteString(p.Body)
	if len(p.Tags) > 0 {
		sb.WriteString("\n\n")
		for i, tag := range p.Tags {
			if i > 0 {
				sb.WriteString(" ")
			}
			sb.WriteString("#")
			sb.WriteString(strings.TrimPrefix(tag, "#"))
		}
	}
	return sb.String()
}

// =====================================================================
// Helpers
// =====================================================================

func nonEmpty(s, fallback string) string {
	if strings.TrimSpace(s) == "" {
		return fallback
	}
	return s
}

func truncateForLLM(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "\n\n[...内容已截断...]"
}
