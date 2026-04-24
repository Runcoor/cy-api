package ai_news

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/system_setting"
)

// ChatMessage is one OpenAI-format chat message.
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// chatRequest / chatResponse mirror the minimal OpenAI chat completions schema.
type chatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	// Most providers accept these; we keep them optional via pointers so the
	// admin can configure conservative defaults via the prompt rather than
	// the API surface (avoids hitting the claude-opus-4-7 deprecation issue).
	Temperature *float64 `json:"temperature,omitempty"`
	MaxTokens   *int     `json:"max_tokens,omitempty"`
}

type chatResponse struct {
	Model   string `json:"model"`
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
	Usage *struct {
		PromptTokens             int `json:"prompt_tokens"`
		CompletionTokens         int `json:"completion_tokens"`
		CompletionTokensDetails *struct {
			ReasoningTokens int `json:"reasoning_tokens"`
		} `json:"completion_tokens_details"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error"`
}

// responsesRequest / responsesResponse mirror the minimal OpenAI Responses API
// schema (https://platform.openai.com/docs/api-reference/responses). Used for
// reasoning models (gpt-5*, o1*, o3*, o4*) where /v1/chat/completions loses
// content during response conversion.
type responsesRequest struct {
	Model           string              `json:"model"`
	Input           []responsesInputMsg `json:"input"`
	MaxOutputTokens *int                `json:"max_output_tokens,omitempty"`
	Reasoning       *responsesReasoning `json:"reasoning,omitempty"`
}

type responsesReasoning struct {
	Effort string `json:"effort,omitempty"` // minimal | low | medium | high
}

type responsesInputMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type responsesResponse struct {
	Id     string `json:"id"`
	Model  string `json:"model"`
	Output []struct {
		Type    string `json:"type"`
		Role    string `json:"role"`
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	} `json:"output"`
	Usage *struct {
		InputTokens            int `json:"input_tokens"`
		OutputTokens           int `json:"output_tokens"`
		TotalTokens            int `json:"total_tokens"`
		OutputTokensDetails *struct {
			ReasoningTokens int `json:"reasoning_tokens"`
		} `json:"output_tokens_details"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error"`
}

// ChatComplete dispatches a chat completion using the configured AI news LLM.
//   - settings.LLMSource == "custom":  POST {LLMCustomBaseURL}/v1/chat/completions
//   - settings.LLMSource == "channel": resolve the channel by id and use its
//     base URL + key the same way.
//
// Strategy: tries the preferred endpoint (chat or responses) per LLMAPIMode +
// model-name auto-detect. If that returns an empty string (most common cause
// of "successful but empty briefing"), automatically falls back to the other
// endpoint before giving up. maxTokens caps the upstream response.
func ChatComplete(ctx context.Context, modelName string, messages []ChatMessage, maxTokens int) (string, error) {
	settings := system_setting.GetAINewsSettings()
	baseURL, apiKey, err := resolveLLMEndpoint(settings)
	if err != nil {
		return "", err
	}
	if modelName == "" {
		return "", fmt.Errorf("model is required")
	}

	preferred := pickAPIMode(settings.LLMAPIMode, modelName)
	allowFallback := strings.EqualFold(strings.TrimSpace(settings.LLMAPIMode), "") ||
		strings.EqualFold(strings.TrimSpace(settings.LLMAPIMode), system_setting.AINewsAPIModeAuto)

	first, firstErr := callOne(ctx, preferred, baseURL, apiKey, modelName, messages, maxTokens)
	if firstErr == nil && strings.TrimSpace(first) != "" {
		return first, nil
	}
	if !allowFallback {
		if firstErr != nil {
			return "", firstErr
		}
		return "", fmt.Errorf("LLM returned empty content via %s (no fallback because LLMAPIMode is fixed to %q)", preferred, settings.LLMAPIMode)
	}

	other := system_setting.AINewsAPIModeChat
	if preferred == system_setting.AINewsAPIModeChat {
		other = system_setting.AINewsAPIModeResponses
	}
	second, secondErr := callOne(ctx, other, baseURL, apiKey, modelName, messages, maxTokens)
	if secondErr == nil && strings.TrimSpace(second) != "" {
		return second, nil
	}
	combined := fmt.Errorf("both endpoints failed: [%s] %v ; [%s] %v",
		preferred, formatErr(firstErr, first),
		other, formatErr(secondErr, second),
	)
	return "", combined
}

func formatErr(err error, body string) string {
	if err != nil {
		return err.Error()
	}
	return "empty content (" + truncate(strings.TrimSpace(body), 200) + ")"
}

func callOne(ctx context.Context, mode, baseURL, apiKey, modelName string, messages []ChatMessage, maxTokens int) (string, error) {
	switch mode {
	case system_setting.AINewsAPIModeResponses:
		return chatViaResponsesAPI(ctx, baseURL, apiKey, modelName, messages, maxTokens)
	default:
		return chatViaChatCompletions(ctx, baseURL, apiKey, modelName, messages, maxTokens)
	}
}

func chatViaChatCompletions(ctx context.Context, baseURL, apiKey, modelName string, messages []ChatMessage, maxTokens int) (string, error) {
	reqStruct := chatRequest{
		Model:    modelName,
		Messages: messages,
	}
	if maxTokens > 0 {
		reqStruct.MaxTokens = &maxTokens
	}
	reqBody, err := common.Marshal(reqStruct)
	if err != nil {
		return "", err
	}

	endpoint := strings.TrimRight(baseURL, "/") + "/v1/chat/completions"
	resp, body, err := doLLMHTTP(ctx, endpoint, apiKey, reqBody)
	if err != nil {
		return "", err
	}
	if resp.StatusCode/100 != 2 {
		return "", fmt.Errorf("LLM HTTP %d: %s", resp.StatusCode, truncate(string(body), 512))
	}
	var parsed chatResponse
	if err := common.Unmarshal(body, &parsed); err != nil {
		return "", fmt.Errorf("parse LLM response: %w (body=%s)", err, truncate(string(body), 256))
	}
	if parsed.Error != nil {
		return "", fmt.Errorf("LLM error: %s", parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("LLM returned no choices (body=%s)", truncate(string(body), 512))
	}
	content := parsed.Choices[0].Message.Content
	if strings.TrimSpace(content) == "" {
		// Try alternate shapes first.
		if alt := extractAltContent(body); strings.TrimSpace(alt) != "" {
			return alt, nil
		}
		return "", emptyContentError(resp.StatusCode, parsed, body, modelName)
	}
	return content, nil
}

func chatViaResponsesAPI(ctx context.Context, baseURL, apiKey, modelName string, messages []ChatMessage, maxTokens int) (string, error) {
	input := make([]responsesInputMsg, 0, len(messages))
	for _, m := range messages {
		input = append(input, responsesInputMsg{Role: m.Role, Content: m.Content})
	}
	reqStruct := responsesRequest{
		Model: modelName,
		Input: input,
	}
	// Bump max_output_tokens to leave room for both reasoning AND text output.
	// Reasoning models can spend most of the budget thinking; if we cap too
	// low the model "completes" with output: [].
	effective := maxTokens
	if isReasoningModel(modelName) && effective > 0 {
		effective = effective * 4
	}
	if effective > 0 {
		reqStruct.MaxOutputTokens = &effective
	}
	if isReasoningModel(modelName) {
		// "low" lets the model spend most of the budget on actual output text
		// instead of internal reasoning, which is what we want for summarizing
		// already-curated content.
		reqStruct.Reasoning = &responsesReasoning{Effort: "low"}
	}
	reqBody, err := common.Marshal(reqStruct)
	if err != nil {
		return "", err
	}

	endpoint := strings.TrimRight(baseURL, "/") + "/v1/responses"
	resp, body, err := doLLMHTTP(ctx, endpoint, apiKey, reqBody)
	if err != nil {
		return "", err
	}
	if resp.StatusCode/100 != 2 {
		return "", fmt.Errorf("LLM /v1/responses HTTP %d: %s", resp.StatusCode, truncate(string(body), 1500))
	}
	var parsed responsesResponse
	if err := common.Unmarshal(body, &parsed); err != nil {
		return "", fmt.Errorf("parse /v1/responses body: %w (body=%s)", err, truncate(string(body), 512))
	}
	if parsed.Error != nil {
		return "", fmt.Errorf("LLM error: %s", parsed.Error.Message)
	}
	var sb strings.Builder
	for _, out := range parsed.Output {
		if out.Type != "message" {
			continue
		}
		if out.Role != "" && out.Role != "assistant" {
			continue
		}
		for _, c := range out.Content {
			if c.Type == "output_text" && c.Text != "" {
				sb.WriteString(c.Text)
			}
		}
	}
	if sb.Len() == 0 {
		// Fallback: concatenate any text found anywhere in output[].
		for _, out := range parsed.Output {
			for _, c := range out.Content {
				if c.Text != "" {
					sb.WriteString(c.Text)
				}
			}
		}
	}
	text := strings.TrimSpace(sb.String())
	if text == "" {
		return "", responsesEmptyError(parsed, body, modelName)
	}
	return text, nil
}

// responsesEmptyError builds a clear error when /v1/responses returns
// status=completed with output: []. The most common cause is reasoning
// consuming the entire output budget.
func responsesEmptyError(parsed responsesResponse, body []byte, modelName string) error {
	bodyTail := truncate(string(body), 1500)
	hint := ""
	if parsed.Usage != nil {
		out := parsed.Usage.OutputTokens
		reasoning := 0
		if parsed.Usage.OutputTokensDetails != nil {
			reasoning = parsed.Usage.OutputTokensDetails.ReasoningTokens
		}
		if out > 0 && reasoning >= out-50 {
			hint = fmt.Sprintf(" — output_tokens=%d 几乎全部用于 reasoning (%d),没留给文本输出。模型 %s 可能不接受 reasoning.effort 参数,或者 max_output_tokens 太小。试试在 AI 前沿设置里把模型换成非 reasoning 模型。", out, reasoning, modelName)
		}
	}
	return fmt.Errorf("LLM /v1/responses returned no output_text%s (body=%s)", hint, bodyTail)
}

func doLLMHTTP(ctx context.Context, endpoint, apiKey string, reqBody []byte) (*http.Response, []byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(reqBody))
	if err != nil {
		return nil, nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	resp, err := llmHTTPClient.Do(req)
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 4*1024*1024))
	if err != nil {
		return resp, nil, err
	}
	return resp, body, nil
}

// pickAPIMode resolves the effective API mode from the admin setting + model
// name. Empty / "auto" delegates to isReasoningModel; explicit values win.
func pickAPIMode(configured string, modelName string) string {
	switch strings.ToLower(strings.TrimSpace(configured)) {
	case system_setting.AINewsAPIModeChat:
		return system_setting.AINewsAPIModeChat
	case system_setting.AINewsAPIModeResponses:
		return system_setting.AINewsAPIModeResponses
	}
	if isReasoningModel(modelName) {
		return system_setting.AINewsAPIModeResponses
	}
	return system_setting.AINewsAPIModeChat
}

// isReasoningModel returns true for OpenAI-family reasoning model names.
// These models use the Responses API and have no usable chat.completions path
// (content ends up null because the non-reasoning tokens are returned as
// output_text items, not chat content strings).
func isReasoningModel(modelName string) bool {
	m := strings.ToLower(strings.TrimSpace(modelName))
	if m == "" {
		return false
	}
	// o1, o1-mini, o1-preview, o1-pro, o3, o3-mini, o4-mini, etc.
	for _, prefix := range []string{"o1", "o3", "o4", "gpt-5"} {
		if m == prefix || strings.HasPrefix(m, prefix+"-") || strings.HasPrefix(m, prefix+".") {
			return true
		}
	}
	return false
}

// extractAltContent looks for Claude-native content blocks in the raw response
// body in case the upstream returned native shape instead of OpenAI shape.
func extractAltContent(body []byte) string {
	type block struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	// Try Claude native shape first.
	var native struct {
		Content []block `json:"content"`
	}
	if err := common.Unmarshal(body, &native); err == nil && len(native.Content) > 0 {
		var sb strings.Builder
		for _, b := range native.Content {
			if b.Type == "text" && b.Text != "" {
				sb.WriteString(b.Text)
				sb.WriteString("\n")
			}
		}
		if sb.Len() > 0 {
			return strings.TrimSpace(sb.String())
		}
	}
	// Try OpenAI shape with content as array of blocks (some adaptors do this).
	var openaiBlocks struct {
		Choices []struct {
			Message struct {
				Content []block `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := common.Unmarshal(body, &openaiBlocks); err == nil && len(openaiBlocks.Choices) > 0 {
		var sb strings.Builder
		for _, b := range openaiBlocks.Choices[0].Message.Content {
			if b.Type == "text" && b.Text != "" {
				sb.WriteString(b.Text)
				sb.WriteString("\n")
			}
		}
		if sb.Len() > 0 {
			return strings.TrimSpace(sb.String())
		}
	}
	// Try the response-already-has-output-field shape (channel leaked the raw
	// Responses API shape through chat.completions).
	var withOutput struct {
		Output []struct {
			Type    string `json:"type"`
			Role    string `json:"role"`
			Content []struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"content"`
		} `json:"output"`
	}
	if err := common.Unmarshal(body, &withOutput); err == nil && len(withOutput.Output) > 0 {
		var sb strings.Builder
		for _, out := range withOutput.Output {
			if out.Type != "message" {
				continue
			}
			if out.Role != "" && out.Role != "assistant" {
				continue
			}
			for _, c := range out.Content {
				if c.Type == "output_text" && c.Text != "" {
					sb.WriteString(c.Text)
				}
			}
		}
		if sb.Len() > 0 {
			return strings.TrimSpace(sb.String())
		}
	}
	return ""
}

// emptyContentError builds a human-readable error when content is null/empty.
// Detects the "reasoning model with lost output" case (completion_tokens
// significantly larger than reasoning_tokens) and points the user at the real
// fix: switch to the /v1/responses API mode.
func emptyContentError(statusCode int, parsed chatResponse, body []byte, requestedModel string) error {
	bodyTail := truncate(string(body), 512)
	if parsed.Usage != nil {
		comp := parsed.Usage.CompletionTokens
		reasoning := 0
		if parsed.Usage.CompletionTokensDetails != nil {
			reasoning = parsed.Usage.CompletionTokensDetails.ReasoningTokens
		}
		if comp > reasoning+50 {
			actual := requestedModel
			if parsed.Model != "" && parsed.Model != requestedModel {
				actual = fmt.Sprintf("%s (channel mapped to %s)", requestedModel, parsed.Model)
			}
			return fmt.Errorf(
				"上游返回 content=null 但 completion_tokens=%d (其中 reasoning=%d) — "+
					"模型 %s 实际生成了 %d tokens,但 chat.completions 丢了 content。"+
					"修法:在 AI 前沿设置里把“LLM API 模式”改为 responses(/v1/responses),"+
					"或给模型名换个不以 gpt-5 / o1 / o3 / o4 开头的别名自动启用。"+
					"原始响应: %s",
				comp, reasoning, actual, comp-reasoning, bodyTail,
			)
		}
	}
	return fmt.Errorf("LLM returned empty content (status %d, body=%s)", statusCode, bodyTail)
}

func resolveLLMEndpoint(s system_setting.AINewsSettings) (baseURL, apiKey string, err error) {
	switch s.LLMSource {
	case system_setting.AINewsLLMSourceCustom:
		if s.LLMCustomBaseURL == "" || s.LLMCustomAPIKey == "" {
			return "", "", fmt.Errorf("custom LLM mode requires base_url and api_key in AI news settings")
		}
		return s.LLMCustomBaseURL, s.LLMCustomAPIKey, nil
	case system_setting.AINewsLLMSourceChannel:
		if s.LLMChannelId <= 0 {
			return "", "", fmt.Errorf("channel LLM mode requires llm_channel_id in AI news settings")
		}
		ch, gerr := getChannelById(s.LLMChannelId)
		if gerr != nil {
			return "", "", fmt.Errorf("resolve channel #%d: %w", s.LLMChannelId, gerr)
		}
		return ch.GetBaseURL(), ch.Key, nil
	default:
		return "", "", fmt.Errorf("unknown LLM source: %q", s.LLMSource)
	}
}

func getChannelById(id int) (*model.Channel, error) {
	var ch model.Channel
	if err := model.DB.First(&ch, id).Error; err != nil {
		return nil, err
	}
	return &ch, nil
}

var llmHTTPClient = &http.Client{Timeout: 5 * time.Minute}
