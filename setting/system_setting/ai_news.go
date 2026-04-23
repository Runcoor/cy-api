package system_setting

import (
	"sync"

	"github.com/runcoor/aggre-api/common"
)

const (
	AINewsLLMSourceCustom  = "custom"
	AINewsLLMSourceChannel = "channel"
)

// AINewsSettings is the persisted configuration for the AI news agent.
// Stored in the options table under key "AINewsSettings" as a JSON blob.
type AINewsSettings struct {
	JinaAPIKey string `json:"jina_api_key"` // optional; empty means use Jina free tier

	// LLM config
	LLMSource         string `json:"llm_source"`           // "custom" | "channel"
	LLMCustomBaseURL  string `json:"llm_custom_base_url"`  // OpenAI-compatible endpoint base (no trailing /v1)
	LLMCustomAPIKey   string `json:"llm_custom_api_key"`
	LLMDeepModel      string `json:"llm_deep_model"`       // e.g. "claude-opus-4-7"
	LLMSimpleModel    string `json:"llm_simple_model"`     // e.g. "claude-haiku-4-5"
	LLMChannelId      int    `json:"llm_channel_id"`       // when LLMSource == "channel"

	// Preview/admin
	AdminPreviewEmails []string `json:"admin_preview_emails"`

	// Cron
	CronEnabled bool `json:"cron_enabled"`
	CronHour    int  `json:"cron_hour"`   // 0-23, server-local time
	CronMinute  int  `json:"cron_minute"` // 0-59
}

const aiNewsSettingsKey = "AINewsSettings"

var (
	aiNewsCache    *AINewsSettings
	aiNewsCacheMu  sync.RWMutex
	aiNewsDefaults = AINewsSettings{
		LLMSource:      AINewsLLMSourceChannel,
		LLMDeepModel:   "claude-opus-4-7",
		LLMSimpleModel: "claude-haiku-4-5",
		CronEnabled:    false,
		CronHour:       9,
		CronMinute:     0,
	}
)

// GetAINewsSettings returns the current settings (cached).
func GetAINewsSettings() AINewsSettings {
	aiNewsCacheMu.RLock()
	if aiNewsCache != nil {
		out := *aiNewsCache
		aiNewsCacheMu.RUnlock()
		return out
	}
	aiNewsCacheMu.RUnlock()

	// Cache miss — load from OptionMap
	common.OptionMapRWMutex.RLock()
	raw := common.OptionMap[aiNewsSettingsKey]
	common.OptionMapRWMutex.RUnlock()

	out := aiNewsDefaults
	if raw != "" {
		_ = common.UnmarshalJsonStr(raw, &out)
		// Re-apply defaults for fields still empty
		if out.LLMSource == "" {
			out.LLMSource = aiNewsDefaults.LLMSource
		}
		if out.LLMDeepModel == "" {
			out.LLMDeepModel = aiNewsDefaults.LLMDeepModel
		}
		if out.LLMSimpleModel == "" {
			out.LLMSimpleModel = aiNewsDefaults.LLMSimpleModel
		}
	}

	aiNewsCacheMu.Lock()
	aiNewsCache = &out
	aiNewsCacheMu.Unlock()
	return out
}

// SetAINewsSettings persists settings. Returns the marshaled JSON for the
// caller to push into the options table via model.UpdateOption.
func SetAINewsSettings(s AINewsSettings) (string, error) {
	data, err := common.Marshal(s)
	if err != nil {
		return "", err
	}
	aiNewsCacheMu.Lock()
	cp := s
	aiNewsCache = &cp
	aiNewsCacheMu.Unlock()
	return string(data), nil
}

// InvalidateAINewsCache clears the in-memory cache; safe to call on option-map sync.
func InvalidateAINewsCache() {
	aiNewsCacheMu.Lock()
	aiNewsCache = nil
	aiNewsCacheMu.Unlock()
}

// AINewsSettingsKey returns the option key (for the options table).
func AINewsSettingsKey() string { return aiNewsSettingsKey }
