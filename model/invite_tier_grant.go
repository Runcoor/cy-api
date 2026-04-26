package model

import (
	"sort"
	"time"

	"github.com/runcoor/aggre-api/common"
)

// InviteTierGrant 邀请阶梯奖励发放记录。
// 每个 (user_id, tier_count) 唯一，确保同一档位只发放一次。
type InviteTierGrant struct {
	Id        int   `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId    int   `json:"user_id" gorm:"not null;uniqueIndex:idx_user_tier;index"`
	TierCount int   `json:"tier_count" gorm:"not null;uniqueIndex:idx_user_tier"`
	Bonus     int   `json:"bonus" gorm:"not null"`
	GrantedAt int64 `json:"granted_at" gorm:"not null"`
}

// AffTier 单档奖励配置。
type AffTier struct {
	Count int `json:"count"`
	Bonus int `json:"bonus"` // quota 单位
}

// parseAffTiers 解析 common.AffTiers 字符串。无效或空则返回空切片。
func parseAffTiers(raw string) ([]AffTier, error) {
	if raw == "" {
		return nil, nil
	}
	var tiers []AffTier
	if err := common.UnmarshalJsonStr(raw, &tiers); err != nil {
		return nil, err
	}
	// 过滤非法档位，按 Count 升序排序。
	clean := make([]AffTier, 0, len(tiers))
	for _, t := range tiers {
		if t.Count > 0 && t.Bonus > 0 {
			clean = append(clean, t)
		}
	}
	sort.Slice(clean, func(i, j int) bool { return clean[i].Count < clean[j].Count })
	return clean, nil
}

// GetAffTiers 解析当前 AffTiers 配置，便于上层调用。
func GetAffTiers() []AffTier {
	tiers, _ := parseAffTiers(common.AffTiers)
	return tiers
}

// HasInviteTierGrant 用户是否已发放某档位奖励。
func HasInviteTierGrant(userId, tierCount int) (bool, error) {
	var n int64
	err := DB.Model(&InviteTierGrant{}).
		Where("user_id = ? AND tier_count = ?", userId, tierCount).
		Count(&n).Error
	return n > 0, err
}

// RecordInviteTierGrant 写入一条阶梯奖励发放记录。
// 唯一索引保证并发下不会重复发放。
func RecordInviteTierGrant(userId, tierCount, bonus int) error {
	g := InviteTierGrant{
		UserId:    userId,
		TierCount: tierCount,
		Bonus:     bonus,
		GrantedAt: time.Now().Unix(),
	}
	return DB.Create(&g).Error
}

// ListInviteTierGrants 返回某用户所有已发放的阶梯奖励，按发放时间升序。
func ListInviteTierGrants(userId int) ([]InviteTierGrant, error) {
	var rows []InviteTierGrant
	err := DB.Where("user_id = ?", userId).
		Order("tier_count ASC").
		Find(&rows).Error
	return rows, err
}
