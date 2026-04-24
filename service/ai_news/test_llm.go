package ai_news

import (
	"context"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/setting/system_setting"
)

// LLMTestResult holds per-endpoint test results.
type LLMTestResult struct {
	Model         string         `json:"model"`
	BaseURL       string         `json:"base_url"`
	IsReasoning   bool           `json:"is_reasoning"`
	PreferredMode string         `json:"preferred_mode"`
	Chat          LLMTestOneShot `json:"chat"`
	Responses     LLMTestOneShot `json:"responses"`
}

// LLMTestOneShot holds the result of one endpoint test.
type LLMTestOneShot struct {
	Tried    bool   `json:"tried"`
	OK       bool   `json:"ok"`
	Endpoint string `json:"endpoint"`
	Reply    string `json:"reply,omitempty"`
	Error    string `json:"error,omitempty"`
	Duration string `json:"duration"`
}

// TestLLM hits both endpoints with a tiny prompt and reports what each one
// returned. Used by the settings UI to diagnose configuration issues without
// running a full agent cycle.
//
// modelOverride: if non-empty, used instead of LLMDeepModel; useful for the
// admin to test arbitrary model names against the same channel.
func TestLLM(ctx context.Context, modelOverride string) LLMTestResult {
	settings := system_setting.GetAINewsSettings()
	modelName := strings.TrimSpace(modelOverride)
	if modelName == "" {
		modelName = strings.TrimSpace(settings.LLMDeepModel)
	}
	if modelName == "" {
		modelName = strings.TrimSpace(settings.LLMSimpleModel)
	}

	out := LLMTestResult{
		Model:       modelName,
		IsReasoning: isReasoningModel(modelName),
	}

	baseURL, apiKey, err := resolveLLMEndpoint(settings)
	if err != nil {
		out.Chat.Error = err.Error()
		out.Responses.Error = err.Error()
		return out
	}
	out.BaseURL = baseURL
	out.PreferredMode = pickAPIMode(settings.LLMAPIMode, modelName)

	if modelName == "" {
		out.Chat.Error = "no model configured"
		out.Responses.Error = "no model configured"
		return out
	}

	messages := []ChatMessage{
		{Role: "user", Content: "回复一个字: ok"},
	}

	// Apply per-call timeout so the test doesn't hang the request.
	tctx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	out.Chat.Tried = true
	out.Chat.Endpoint = strings.TrimRight(baseURL, "/") + "/v1/chat/completions"
	chatStart := time.Now()
	chatReply, chatErr := chatViaChatCompletions(tctx, baseURL, apiKey, modelName, messages, 50)
	out.Chat.Duration = time.Since(chatStart).Truncate(time.Millisecond).String()
	if chatErr != nil {
		out.Chat.Error = chatErr.Error()
	} else if strings.TrimSpace(chatReply) == "" {
		out.Chat.Error = "empty content"
	} else {
		out.Chat.OK = true
		out.Chat.Reply = truncate(chatReply, 200)
	}

	out.Responses.Tried = true
	out.Responses.Endpoint = strings.TrimRight(baseURL, "/") + "/v1/responses"
	respStart := time.Now()
	respReply, respErr := chatViaResponsesAPI(tctx, baseURL, apiKey, modelName, messages, 50)
	out.Responses.Duration = time.Since(respStart).Truncate(time.Millisecond).String()
	if respErr != nil {
		out.Responses.Error = respErr.Error()
	} else if strings.TrimSpace(respReply) == "" {
		out.Responses.Error = "empty content"
	} else {
		out.Responses.OK = true
		out.Responses.Reply = truncate(respReply, 200)
	}

	return out
}
