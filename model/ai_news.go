package model

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

// =====================================================================
// AI News source — admin-configured discovery sources
// =====================================================================

const (
	AINewsSourceTypeRSS    = "rss"
	AINewsSourceTypeSearch = "search"
)

// AINewsSource is one configured discovery source.
//   - rss:    Value is the feed URL
//   - search: Value is a keyword query (queried via Jina s.jina.ai)
type AINewsSource struct {
	Id        int    `json:"id" gorm:"primaryKey"`
	Type      string `json:"type" gorm:"type:varchar(16);not null;index"`
	Value     string `json:"value" gorm:"type:varchar(512);not null"`
	Enabled   bool   `json:"enabled" gorm:"default:true;index"`
	CreatedAt int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt int64  `json:"updated_at" gorm:"bigint"`
}

func (AINewsSource) TableName() string { return "ai_news_sources" }

func (s *AINewsSource) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

func (s *AINewsSource) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = time.Now().Unix()
	return nil
}

func ListAINewsSources(enabledOnly bool) ([]AINewsSource, error) {
	var out []AINewsSource
	q := DB.Order("id desc")
	if enabledOnly {
		q = q.Where("enabled = ?", true)
	}
	err := q.Find(&out).Error
	return out, err
}

func GetAINewsSource(id int) (*AINewsSource, error) {
	var s AINewsSource
	if err := DB.First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func CreateAINewsSource(s *AINewsSource) error {
	if s.Type == "" {
		return errors.New("type is required")
	}
	if s.Type != AINewsSourceTypeRSS && s.Type != AINewsSourceTypeSearch {
		return errors.New("invalid source type")
	}
	if s.Value == "" {
		return errors.New("value is required")
	}
	return DB.Create(s).Error
}

func UpdateAINewsSource(id int, updates map[string]any) error {
	return DB.Model(&AINewsSource{}).Where("id = ?", id).Updates(updates).Error
}

func DeleteAINewsSource(id int) error {
	return DB.Delete(&AINewsSource{}, id).Error
}

// =====================================================================
// AI News briefing — one generated piece (deep or simple)
// =====================================================================

const (
	AINewsBriefingTypeDeep   = "deep"
	AINewsBriefingTypeSimple = "simple"

	AINewsBriefingStatusDraft    = "draft"
	AINewsBriefingStatusApproved = "approved"
	AINewsBriefingStatusSent     = "sent"
	AINewsBriefingStatusArchived = "archived"
)

// AINewsBriefing is one LLM-generated piece. Plan gating is via PlanIdsJSON
// (a JSON array of ints). Empty array means visible to all paying users.
type AINewsBriefing struct {
	Id           int    `json:"id" gorm:"primaryKey"`
	Type         string `json:"type" gorm:"type:varchar(16);not null;index"`
	Title        string `json:"title" gorm:"type:varchar(512);not null"`
	Summary      string `json:"summary" gorm:"type:text"`
	Content      string `json:"content" gorm:"type:longtext"`
	SourcesJSON  string `json:"sources_json" gorm:"column:sources_json;type:text"`
	PlanIdsJSON  string `json:"plan_ids_json" gorm:"column:plan_ids_json;type:text;default:'[]'"`
	Status       string `json:"status" gorm:"type:varchar(16);not null;index;default:'draft'"`
	GeneratedAt  int64  `json:"generated_at" gorm:"bigint;index"`
	SentAt       int64  `json:"sent_at" gorm:"bigint"`
	CreatedBy    int    `json:"created_by" gorm:"index;default:0"`
	UpdatedAt    int64  `json:"updated_at" gorm:"bigint"`
}

func (AINewsBriefing) TableName() string { return "ai_news_briefings" }

func (b *AINewsBriefing) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	if b.GeneratedAt == 0 {
		b.GeneratedAt = now
	}
	b.UpdatedAt = now
	if b.Status == "" {
		b.Status = AINewsBriefingStatusDraft
	}
	if b.PlanIdsJSON == "" {
		b.PlanIdsJSON = "[]"
	}
	return nil
}

func (b *AINewsBriefing) BeforeUpdate(tx *gorm.DB) error {
	b.UpdatedAt = time.Now().Unix()
	return nil
}

type ListAINewsBriefingsParams struct {
	Type     string // "" or deep / simple
	Status   string // "" or status
	Page     int    // 1-based
	PageSize int
}

func ListAINewsBriefings(p ListAINewsBriefingsParams) ([]AINewsBriefing, int64, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize <= 0 {
		p.PageSize = 20
	}
	q := DB.Model(&AINewsBriefing{})
	if p.Type != "" {
		q = q.Where("type = ?", p.Type)
	}
	if p.Status != "" {
		q = q.Where("status = ?", p.Status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var out []AINewsBriefing
	err := q.Order("generated_at desc, id desc").
		Offset((p.Page - 1) * p.PageSize).
		Limit(p.PageSize).
		Find(&out).Error
	return out, total, err
}

func GetAINewsBriefing(id int) (*AINewsBriefing, error) {
	var b AINewsBriefing
	if err := DB.First(&b, id).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

func CreateAINewsBriefing(b *AINewsBriefing) error {
	if b.Type != AINewsBriefingTypeDeep && b.Type != AINewsBriefingTypeSimple {
		return errors.New("invalid briefing type")
	}
	if b.Title == "" {
		return errors.New("title is required")
	}
	return DB.Create(b).Error
}

func UpdateAINewsBriefing(id int, updates map[string]any) error {
	return DB.Model(&AINewsBriefing{}).Where("id = ?", id).Updates(updates).Error
}

func DeleteAINewsBriefing(id int) error {
	return DB.Delete(&AINewsBriefing{}, id).Error
}

// =====================================================================
// AI News send log — per-user delivery audit trail
// =====================================================================

type AINewsSendLog struct {
	Id          int    `json:"id" gorm:"primaryKey"`
	BriefingId  int    `json:"briefing_id" gorm:"not null;index;index:ux_briefing_user,unique"`
	UserId      int    `json:"user_id" gorm:"not null;index;index:ux_briefing_user,unique"`
	Email       string `json:"email" gorm:"type:varchar(256)"`
	SentAt      int64  `json:"sent_at" gorm:"bigint"`
	ErrorMsg    string `json:"error_msg" gorm:"column:error_msg;type:varchar(512)"`
}

func (AINewsSendLog) TableName() string { return "ai_news_send_logs" }

// HasUserReceivedBriefing returns true if a successful (no error) send log exists.
func HasUserReceivedBriefing(briefingId, userId int) (bool, error) {
	var count int64
	err := DB.Model(&AINewsSendLog{}).
		Where("briefing_id = ? AND user_id = ? AND error_msg = ?", briefingId, userId, "").
		Count(&count).Error
	return count > 0, err
}

func RecordAINewsSendLog(log *AINewsSendLog) error {
	if log.SentAt == 0 {
		log.SentAt = time.Now().Unix()
	}
	return DB.Create(log).Error
}

func CountAINewsSendLogs(briefingId int) (success int64, failed int64, err error) {
	if err = DB.Model(&AINewsSendLog{}).Where("briefing_id = ? AND error_msg = ?", briefingId, "").Count(&success).Error; err != nil {
		return
	}
	err = DB.Model(&AINewsSendLog{}).Where("briefing_id = ? AND error_msg <> ?", briefingId, "").Count(&failed).Error
	return
}
