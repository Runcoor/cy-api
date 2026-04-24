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
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
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
// maxTokens controls the upstream response cap. Pass 0 to omit (some providers
// like Anthropic require a non-zero value, so callers should always supply one).
func ChatComplete(ctx context.Context, model string, messages []ChatMessage, maxTokens int) (string, error) {
	settings := system_setting.GetAINewsSettings()
	baseURL, apiKey, err := resolveLLMEndpoint(settings)
	if err != nil {
		return "", err
	}
	if model == "" {
		return "", fmt.Errorf("model is required")
	}

	reqStruct := chatRequest{
		Model:    model,
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
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(reqBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := llmHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 4*1024*1024))
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
		// Some providers/adaptors return only thinking blocks or stop early
		// when max_tokens is missing. Fall back to scanning for an alternate
		// shape (Claude-native content blocks).
		alt := extractAltContent(body)
		if strings.TrimSpace(alt) != "" {
			return alt, nil
		}
		return "", fmt.Errorf("LLM returned empty content (status %d, body=%s)", resp.StatusCode, truncate(string(body), 512))
	}
	return content, nil
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
	return ""
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
