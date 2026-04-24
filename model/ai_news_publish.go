package model

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

// AINewsSocialPlatform identifies which external platform a publish record
// targets. Keep these stable strings — they're stored in the DB and used as
// adapter keys in service/ai_news.
const (
	AINewsSocialPlatformXiaohongshu = "xiaohongshu"
	AINewsSocialPlatformDouyin      = "douyin"
	AINewsSocialPlatformBilibili    = "bilibili"
	AINewsSocialPlatformWeibo       = "weibo"
)

// AINewsSocialPlatformOrder is the canonical UI display order.
var AINewsSocialPlatformOrder = []string{
	AINewsSocialPlatformXiaohongshu,
	AINewsSocialPlatformDouyin,
	AINewsSocialPlatformBilibili,
	AINewsSocialPlatformWeibo,
}

const (
	AINewsPublishStatusPending     = "pending"
	AINewsPublishStatusPublishing  = "publishing"
	AINewsPublishStatusPublished   = "published"
	AINewsPublishStatusFailed      = "failed"
	AINewsPublishStatusUnsupported = "unsupported"
)

// AINewsSocialPublish records one publish attempt of a social post to one
// platform. (briefing_id, platform) is unique — a re-publish updates the
// existing row in place rather than appending history (history would make
// the UI noisy and we have no real auditing requirement).
type AINewsSocialPublish struct {
	Id          int    `json:"id" gorm:"primaryKey"`
	BriefingId  int    `json:"briefing_id" gorm:"not null;uniqueIndex:uniq_briefing_platform,priority:1"`
	Platform    string `json:"platform" gorm:"type:varchar(32);not null;uniqueIndex:uniq_briefing_platform,priority:2"`
	Status      string `json:"status" gorm:"type:varchar(16);default:'pending'"`
	ExternalURL string `json:"external_url" gorm:"column:external_url;type:varchar(512)"`
	Notes       string `json:"notes" gorm:"type:varchar(1024)"`
	ErrorMsg    string `json:"error_msg" gorm:"column:error_msg;type:varchar(2048)"`
	CreatedAt   int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt   int64  `json:"updated_at" gorm:"bigint"`
}

func (AINewsSocialPublish) TableName() string { return "ai_news_social_publishes" }

func (p *AINewsSocialPublish) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	if p.CreatedAt == 0 {
		p.CreatedAt = now
	}
	p.UpdatedAt = now
	return nil
}

func (p *AINewsSocialPublish) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = time.Now().Unix()
	return nil
}

// ListAINewsSocialPublishes returns all publish rows for one briefing,
// ordered by platform's UI position.
func ListAINewsSocialPublishes(briefingId int) ([]AINewsSocialPublish, error) {
	var out []AINewsSocialPublish
	if err := DB.Where("briefing_id = ?", briefingId).Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

// GetAINewsSocialPublish returns one row keyed by (briefing, platform), or
// gorm.ErrRecordNotFound.
func GetAINewsSocialPublish(briefingId int, platform string) (*AINewsSocialPublish, error) {
	var p AINewsSocialPublish
	if err := DB.Where("briefing_id = ? AND platform = ?", briefingId, platform).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func IsAINewsSocialPublishNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}

// UpsertAINewsSocialPublish creates or updates a row keyed by
// (briefing_id, platform). Returns the resulting row id.
func UpsertAINewsSocialPublish(p *AINewsSocialPublish) error {
	existing, err := GetAINewsSocialPublish(p.BriefingId, p.Platform)
	if err != nil && !IsAINewsSocialPublishNotFound(err) {
		return err
	}
	if existing == nil {
		return DB.Create(p).Error
	}
	return DB.Model(&AINewsSocialPublish{}).
		Where("id = ?", existing.Id).
		Updates(map[string]any{
			"status":       p.Status,
			"external_url": p.ExternalURL,
			"notes":        p.Notes,
			"error_msg":    p.ErrorMsg,
		}).Error
}

// DeleteAINewsSocialPublishesByBriefing wipes all platform rows for a
// briefing — used when the briefing itself is deleted.
func DeleteAINewsSocialPublishesByBriefing(briefingId int) error {
	return DB.Where("briefing_id = ?", briefingId).Delete(&AINewsSocialPublish{}).Error
}
