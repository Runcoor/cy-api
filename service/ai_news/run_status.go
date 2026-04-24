package ai_news

import (
	"fmt"
	"sync"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
)

const (
	RunPhaseIdle       = "idle"
	RunPhaseDiscover   = "discovering"
	RunPhaseDedup      = "dedup"
	RunPhaseFetch      = "fetching"
	RunPhaseGenerate   = "generating"
	RunPhasePreview    = "preview"
	RunPhaseDone       = "done"
	RunPhaseFailed     = "failed"

	runStatusOptionKey = "AINewsLastRunStatus"
)

// RunStatus is the visible state of the most recent agent run.
// Persisted to options so it survives restarts and shows up in the admin UI.
type RunStatus struct {
	Phase                string   `json:"phase"`
	TriggeredBy          int      `json:"triggered_by"` // 0 = cron, otherwise admin user id
	StartedAt            int64    `json:"started_at"`
	FinishedAt           int64    `json:"finished_at"`
	SourcesEnabled       int      `json:"sources_enabled"`
	CandidatesFound      int      `json:"candidates_found"`
	CandidatesAfterDedup int      `json:"candidates_after_dedup"`
	BodiesFetched        int      `json:"bodies_fetched"`
	DeepBriefingId       int      `json:"deep_briefing_id"`
	SimpleBriefingId     int      `json:"simple_briefing_id"`
	ErrorMsg             string   `json:"error_msg"`
	Notes                []string `json:"notes"`
}

var (
	runStatusMu    sync.RWMutex
	runStatusCache *RunStatus
)

// GetLastRunStatus returns a copy of the latest run status. Empty struct
// (Phase=="") if the agent has never run.
func GetLastRunStatus() RunStatus {
	runStatusMu.RLock()
	if runStatusCache != nil {
		out := *runStatusCache
		runStatusMu.RUnlock()
		return out
	}
	runStatusMu.RUnlock()

	common.OptionMapRWMutex.RLock()
	raw := common.OptionMap[runStatusOptionKey]
	common.OptionMapRWMutex.RUnlock()

	var out RunStatus
	if raw != "" {
		_ = common.UnmarshalJsonStr(raw, &out)
	}
	runStatusMu.Lock()
	cp := out
	runStatusCache = &cp
	runStatusMu.Unlock()
	return out
}

// IsRunning returns true if a run is currently in flight.
func IsRunning() bool {
	s := GetLastRunStatus()
	if s.Phase == "" || s.Phase == RunPhaseIdle ||
		s.Phase == RunPhaseDone || s.Phase == RunPhaseFailed {
		return false
	}
	return true
}

func saveRunStatus(s *RunStatus) {
	runStatusMu.Lock()
	cp := *s
	runStatusCache = &cp
	runStatusMu.Unlock()

	data, err := common.Marshal(s)
	if err != nil {
		common.SysLog("[ai-news] marshal run status failed: " + err.Error())
		return
	}
	if err := model.UpdateOption(runStatusOptionKey, string(data)); err != nil {
		common.SysLog("[ai-news] persist run status failed: " + err.Error())
	}
}

// runRecorder is a lightweight wrapper used by the agent to update the persisted
// status at each phase. All methods are safe to call from any goroutine.
type runRecorder struct {
	mu sync.Mutex
	s  *RunStatus
}

func newRecorder(triggeredBy int) *runRecorder {
	r := &runRecorder{
		s: &RunStatus{
			Phase:       RunPhaseDiscover,
			TriggeredBy: triggeredBy,
			StartedAt:   time.Now().Unix(),
		},
	}
	saveRunStatus(r.s)
	return r
}

func (r *runRecorder) phase(p string) {
	r.mu.Lock()
	r.s.Phase = p
	cp := *r.s
	r.mu.Unlock()
	saveRunStatus(&cp)
}

func (r *runRecorder) note(format string, args ...any) {
	r.mu.Lock()
	if format != "" {
		msg := format
		if len(args) > 0 {
			msg = fmt.Sprintf(format, args...)
		}
		r.s.Notes = append(r.s.Notes, msg)
		// Cap at 50 notes to keep options row small.
		if len(r.s.Notes) > 50 {
			r.s.Notes = r.s.Notes[len(r.s.Notes)-50:]
		}
	}
	cp := *r.s
	r.mu.Unlock()
	saveRunStatus(&cp)
}

func (r *runRecorder) update(mut func(*RunStatus)) {
	r.mu.Lock()
	mut(r.s)
	cp := *r.s
	r.mu.Unlock()
	saveRunStatus(&cp)
}

func (r *runRecorder) finishOK() {
	r.mu.Lock()
	r.s.Phase = RunPhaseDone
	r.s.FinishedAt = time.Now().Unix()
	cp := *r.s
	r.mu.Unlock()
	saveRunStatus(&cp)
}

func (r *runRecorder) finishFail(err error) {
	r.mu.Lock()
	r.s.Phase = RunPhaseFailed
	r.s.FinishedAt = time.Now().Unix()
	if err != nil {
		r.s.ErrorMsg = truncate(err.Error(), 1000)
	}
	cp := *r.s
	r.mu.Unlock()
	saveRunStatus(&cp)
}

