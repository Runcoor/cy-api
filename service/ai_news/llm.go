package ai_news

import (
	"bufio"
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

// newSSEScanner returns a bufio.Scanner with a buffer large enough to hold
// long SSE lines (default 64KB is too small for big chunks).
func newSSEScanner(r io.Reader) *bufio.Scanner {
	s := bufio.NewScanner(r)
	s.Buffer(make([]byte, 64*1024), 4*1024*1024)
	return s
}

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
	Stream      *bool    `json:"stream,omitempty"`
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
	Stream          *bool               `json:"stream,omitempty"`
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
	stream := true
	reqStruct := chatRequest{
		Model:    modelName,
		Messages: messages,
		Stream:   &stream,
	}
	if maxTokens > 0 {
		reqStruct.MaxTokens = &maxTokens
	}
	reqBody, err := common.Marshal(reqStruct)
	if err != nil {
		return "", err
	}

	endpoint := strings.TrimRight(baseURL, "/") + "/v1/chat/completions"
	text, raw, status, err := streamLLMHTTP(ctx, endpoint, apiKey, reqBody, parseChatStreamChunk)
	if err != nil {
		return "", err
	}
	if status/100 != 2 {
		return "", fmt.Errorf("LLM HTTP %d: %s", status, truncate(raw, 1500))
	}
	if strings.TrimSpace(text) != "" {
		return text, nil
	}
	// Stream produced nothing visible — try parsing the accumulated body as a
	// non-stream response (some proxies return a single non-SSE JSON when
	// stream=true is unsupported) and fall back to the alt-shape parser.
	if alt := extractAltContent([]byte(raw)); strings.TrimSpace(alt) != "" {
		return alt, nil
	}
	var parsed chatResponse
	if jerr := common.Unmarshal([]byte(raw), &parsed); jerr == nil {
		if parsed.Error != nil {
			return "", fmt.Errorf("LLM error: %s", parsed.Error.Message)
		}
		if len(parsed.Choices) > 0 {
			c := parsed.Choices[0].Message.Content
			if strings.TrimSpace(c) != "" {
				return c, nil
			}
			return "", emptyContentError(status, parsed, []byte(raw), modelName)
		}
	}
	return "", fmt.Errorf("LLM /v1/chat/completions stream returned no text (body=%s)", truncate(raw, 1500))
}

func chatViaResponsesAPI(ctx context.Context, baseURL, apiKey, modelName string, messages []ChatMessage, maxTokens int) (string, error) {
	input := make([]responsesInputMsg, 0, len(messages))
	for _, m := range messages {
		input = append(input, responsesInputMsg{Role: m.Role, Content: m.Content})
	}
	stream := true
	reqStruct := responsesRequest{
		Model:  modelName,
		Input:  input,
		Stream: &stream,
	}
	effective := maxTokens
	if isReasoningModel(modelName) && effective > 0 {
		effective = effective * 4
	}
	if effective > 0 {
		reqStruct.MaxOutputTokens = &effective
	}
	if isReasoningModel(modelName) {
		reqStruct.Reasoning = &responsesReasoning{Effort: "low"}
	}
	reqBody, err := common.Marshal(reqStruct)
	if err != nil {
		return "", err
	}

	endpoint := strings.TrimRight(baseURL, "/") + "/v1/responses"
	text, raw, status, err := streamLLMHTTP(ctx, endpoint, apiKey, reqBody, parseResponsesStreamChunk)
	if err != nil {
		return "", err
	}
	if status/100 != 2 {
		return "", fmt.Errorf("LLM /v1/responses HTTP %d: %s", status, truncate(raw, 1500))
	}
	if strings.TrimSpace(text) != "" {
		return text, nil
	}
	// Stream produced nothing visible. Try parsing accumulated body as a
	// non-stream Responses-API response and walk output[] one more time.
	if alt := extractAltContent([]byte(raw)); strings.TrimSpace(alt) != "" {
		return alt, nil
	}
	var parsed responsesResponse
	if jerr := common.Unmarshal([]byte(raw), &parsed); jerr == nil {
		if parsed.Error != nil {
			return "", fmt.Errorf("LLM error: %s", parsed.Error.Message)
		}
		var sb strings.Builder
		for _, out := range parsed.Output {
			for _, c := range out.Content {
				if c.Text != "" {
					sb.WriteString(c.Text)
				}
			}
		}
		if t := strings.TrimSpace(sb.String()); t != "" {
			return t, nil
		}
		return "", responsesEmptyError(parsed, []byte(raw), modelName)
	}
	return "", fmt.Errorf("LLM /v1/responses stream returned no text (body=%s)", truncate(raw, 1500))
}

// responsesEmptyError builds a clear error when /v1/responses returns
// status=completed with output: []. Two common causes:
//   1. reasoning consumed the entire output budget
//   2. an intermediate proxy (CLIProxyAPI / new-api / etc.) lost the
//      output_text blocks during conversion — the model wrote tokens but they
//      never made it back to us.
func responsesEmptyError(parsed responsesResponse, body []byte, modelName string) error {
	bodyTail := truncate(string(body), 1500)
	hint := ""
	if parsed.Usage != nil {
		out := parsed.Usage.OutputTokens
		reasoning := 0
		if parsed.Usage.OutputTokensDetails != nil {
			reasoning = parsed.Usage.OutputTokensDetails.ReasoningTokens
		}
		nonReasoning := out - reasoning
		switch {
		case out > 0 && nonReasoning > 0:
			hint = fmt.Sprintf(
				" — 模型实际产了 %d tokens 的非 reasoning 输出 (output_tokens=%d, reasoning=%d),"+
					"但 output[] 是空的,说明中间代理 (CLIProxyAPI / new-api 等) 在转换响应时把 output_text blocks 丢了。"+
					"换一个该代理能正确转换的模型(可在“测试 LLM”里输入模型名快速试)。",
				nonReasoning, out, reasoning,
			)
		case out > 0 && reasoning >= out:
			hint = fmt.Sprintf(
				" — output_tokens=%d 全部用于 reasoning,模型 %s 没有产出任何文本 token,"+
					"可能 reasoning.effort 没生效,或这个模型对短 prompt 仍偏好深度思考。换个非 reasoning 模型试试。",
				out, modelName,
			)
		}
	}
	return fmt.Errorf("LLM /v1/responses returned no output_text%s (body=%s)", hint, bodyTail)
}

// streamLLMHTTP POSTs reqBody to endpoint with SSE Accept and walks the
// response body line by line, calling extract on each `data: ` payload.
// extract returns the text snippet (or "") to accumulate.
//
// Returns:
//   - text:   the accumulated text from all chunks
//   - rawLog: a truncated copy of the raw stream (for error messages)
//   - status: HTTP status code
//   - err:    transport / read error (NOT empty-content; that's caller's job)
func streamLLMHTTP(ctx context.Context, endpoint, apiKey string, reqBody []byte, extract func(payload []byte) string) (string, string, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(reqBody))
	if err != nil {
		return "", "", 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	resp, err := llmHTTPClient.Do(req)
	if err != nil {
		return "", "", 0, err
	}
	defer resp.Body.Close()

	var (
		text   strings.Builder
		rawLog strings.Builder
	)
	const rawCap = 8 * 1024 // keep enough raw to surface in errors

	// SSE frames are line-delimited; payload follows `data: ` prefix and ends
	// at a blank line. Some proxies omit the blank line — treat each `data: `
	// line as one event.
	scanner := newSSEScanner(io.LimitReader(resp.Body, 8*1024*1024))
	for scanner.Scan() {
		line := scanner.Text()
		if rawLog.Len() < rawCap {
			rawLog.WriteString(line)
			rawLog.WriteByte('\n')
		}
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if payload == "" || payload == "[DONE]" {
			continue
		}
		snippet := extract([]byte(payload))
		if snippet != "" {
			text.WriteString(snippet)
		}
	}
	if serr := scanner.Err(); serr != nil {
		return text.String(), rawLog.String(), resp.StatusCode, serr
	}
	return text.String(), rawLog.String(), resp.StatusCode, nil
}

// parseChatStreamChunk extracts content from a single SSE payload of a
// /v1/chat/completions stream. Returns "" if no usable text is present.
func parseChatStreamChunk(payload []byte) string {
	type chunkChoice struct {
		Delta struct {
			Content *string `json:"content"`
		} `json:"delta"`
	}
	var chunk struct {
		Choices []chunkChoice `json:"choices"`
		Error   *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := common.Unmarshal(payload, &chunk); err != nil {
		return ""
	}
	if chunk.Error != nil {
		// Errors are returned in raw log; we don't accumulate them here.
		return ""
	}
	var sb strings.Builder
	for _, c := range chunk.Choices {
		if c.Delta.Content != nil {
			sb.WriteString(*c.Delta.Content)
		}
	}
	return sb.String()
}

// parseResponsesStreamChunk extracts text from a /v1/responses SSE payload.
// The OpenAI Responses streaming protocol emits typed events; we care about
// `response.output_text.delta` (incremental text tokens) and the final
// `response.completed` (which carries the full output[] for safety net).
func parseResponsesStreamChunk(payload []byte) string {
	var typed struct {
		Type     string `json:"type"`
		Delta    string `json:"delta"`
		Response *struct {
			Output []struct {
				Type    string `json:"type"`
				Role    string `json:"role"`
				Content []struct {
					Type string `json:"type"`
					Text string `json:"text"`
				} `json:"content"`
			} `json:"output"`
		} `json:"response"`
	}
	if err := common.Unmarshal(payload, &typed); err != nil {
		return ""
	}
	switch typed.Type {
	case "response.output_text.delta":
		return typed.Delta
	case "response.completed":
		if typed.Response == nil {
			return ""
		}
		var sb strings.Builder
		for _, out := range typed.Response.Output {
			if out.Type != "message" || (out.Role != "" && out.Role != "assistant") {
				continue
			}
			for _, c := range out.Content {
				if c.Type == "output_text" && c.Text != "" {
					sb.WriteString(c.Text)
				}
			}
		}
		// Don't return this if we already streamed deltas; the caller's
		// accumulator would double-count. For now return only when no deltas
		// were streamed — but we don't track that here, so leave empty and
		// rely on output_text.delta events being authoritative.
		_ = sb
		return ""
	}
	return ""
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
