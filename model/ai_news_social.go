package model

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

const (
	AINewsSocialKindImageOnly = "image_only"
	AINewsSocialKindTextImage = "text_image"

	AINewsSocialStatusGenerating = "generating"
	AINewsSocialStatusReady      = "ready"
	AINewsSocialStatusFailed     = "failed"
)

// AINewsSocialPost is the LLM-rewritten + LLM-illustrated version of a
// briefing, packaged for posting to social platforms (e.g. Xiaohongshu).
// One row per briefing — regenerate replaces the row.
type AINewsSocialPost struct {
	Id         int    `json:"id" gorm:"primaryKey"`
	BriefingId int    `json:"briefing_id" gorm:"not null;uniqueIndex"`
	Kind       string `json:"kind" gorm:"type:varchar(16);not null"`
	Title      string `json:"title" gorm:"type:varchar(512)"`
	Body       string `json:"body" gorm:"type:text"`
	TagsJSON   string `json:"tags_json" gorm:"column:tags_json;type:text;default:'[]'"`
	ImagesJSON string `json:"images_json" gorm:"column:images_json;type:text;default:'[]'"`
	Status     string `json:"status" gorm:"type:varchar(16);default:'generating'"`
	ErrorMsg   string `json:"error_msg" gorm:"column:error_msg;type:varchar(1024)"`
	CreatedAt  int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt  int64  `json:"updated_at" gorm:"bigint"`
}

func (AINewsSocialPost) TableName() string { return "ai_news_social_posts" }

func (p *AINewsSocialPost) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	if p.CreatedAt == 0 {
		p.CreatedAt = now
	}
	p.UpdatedAt = now
	if p.TagsJSON == "" {
		p.TagsJSON = "[]"
	}
	if p.ImagesJSON == "" {
		p.ImagesJSON = "[]"
	}
	return nil
}

func (p *AINewsSocialPost) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = time.Now().Unix()
	return nil
}

func GetAINewsSocialPostByBriefing(briefingId int) (*AINewsSocialPost, error) {
	var p AINewsSocialPost
	if err := DB.Where("briefing_id = ?", briefingId).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func IsAINewsSocialPostNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}

func CreateAINewsSocialPost(p *AINewsSocialPost) error {
	if p.BriefingId <= 0 {
		return errors.New("briefing_id required")
	}
	return DB.Create(p).Error
}

func UpdateAINewsSocialPost(id int, updates map[string]any) error {
	return DB.Model(&AINewsSocialPost{}).Where("id = ?", id).Updates(updates).Error
}

func DeleteAINewsSocialPostByBriefing(briefingId int) error {
	return DB.Where("briefing_id = ?", briefingId).Delete(&AINewsSocialPost{}).Error
}

// ListAINewsSocialPostsOlderThan returns posts whose UpdatedAt is older than
// the given unix timestamp. Used by the weekly cleanup task.
func ListAINewsSocialPostsOlderThan(unixCutoff int64) ([]AINewsSocialPost, error) {
	var out []AINewsSocialPost
	err := DB.Where("updated_at < ?", unixCutoff).Find(&out).Error
	return out, err
}

func DeleteAINewsSocialPost(id int) error {
	return DB.Delete(&AINewsSocialPost{}, id).Error
}
