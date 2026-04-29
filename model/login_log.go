package model

import (
	"strings"

	"github.com/runcoor/aggre-api/pkg/geoip"
)

const (
	LoginTypePassword = "password"
	LoginTypeOAuth     = "oauth"
	LoginTypePasskey   = "passkey"
	LoginType2FA       = "2fa"
)

const (
	LoginStatusSuccess = 1
	LoginStatusFailed  = 0
)

type LoginLog struct {
	Id            int    `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId        int    `json:"user_id" gorm:"index"`
	Username      string `json:"username" gorm:"type:varchar(64);index"`
	LoginType     string `json:"login_type" gorm:"type:varchar(32)"`
	OauthProvider string `json:"oauth_provider" gorm:"type:varchar(32)"`
	LoginIp       string `json:"login_ip" gorm:"type:varchar(64)"`
	Country       string `json:"country" gorm:"type:varchar(8)"`
	UserAgent     string `json:"user_agent" gorm:"type:text"`
	Platform      string `json:"platform" gorm:"type:varchar(64)"`
	Browser       string `json:"browser" gorm:"type:varchar(64)"`
	Os            string `json:"os" gorm:"type:varchar(64)"`
	Status        int    `json:"status" gorm:"default:1"`
	FailReason    string `json:"fail_reason" gorm:"type:varchar(255)"`
	CreatedAt     int64  `json:"created_at" gorm:"autoCreateTime"`
}

func (LoginLog) TableName() string {
	return "login_logs"
}

func RecordLoginLog(log *LoginLog) {
	if log.UserAgent != "" {
		log.Platform, log.Browser, log.Os = parseUserAgent(log.UserAgent)
	}
	// Split "oauth:github" -> LoginType=oauth, OauthProvider=github while
	// keeping the original LoginType string untouched for backward compatibility
	// with existing rows and the admin-side filter dropdown.
	if log.OauthProvider == "" && strings.HasPrefix(log.LoginType, LoginTypeOAuth+":") {
		log.OauthProvider = strings.TrimPrefix(log.LoginType, LoginTypeOAuth+":")
	}
	if log.Country == "" {
		log.Country = geoip.Country(log.LoginIp)
	}
	DB.Create(log)
}

func GetAllLoginLogs(startIdx, pageSize int, userId int, username string, loginType string, loginIp string) ([]*LoginLog, int64, error) {
	var logs []*LoginLog
	var total int64

	tx := DB.Model(&LoginLog{})

	if userId > 0 {
		tx = tx.Where("user_id = ?", userId)
	}
	if username != "" {
		tx = tx.Where("username = ?", username)
	}
	if loginType != "" {
		tx = tx.Where("login_type = ?", loginType)
	}
	if loginIp != "" {
		tx = tx.Where("login_ip = ?", loginIp)
	}

	err := tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = tx.Order("id DESC").Offset(startIdx).Limit(pageSize).Find(&logs).Error
	return logs, total, err
}

// parseUserAgent extracts platform, browser, and OS from a User-Agent string.
func parseUserAgent(ua string) (platform, browser, os string) {
	ua = strings.ToLower(ua)

	// Detect OS
	switch {
	case strings.Contains(ua, "windows"):
		os = "Windows"
		platform = "Desktop"
	case strings.Contains(ua, "macintosh") || strings.Contains(ua, "mac os"):
		os = "macOS"
		platform = "Desktop"
	case strings.Contains(ua, "iphone"):
		os = "iOS"
		platform = "Mobile"
	case strings.Contains(ua, "ipad"):
		os = "iPadOS"
		platform = "Tablet"
	case strings.Contains(ua, "android"):
		os = "Android"
		if strings.Contains(ua, "mobile") {
			platform = "Mobile"
		} else {
			platform = "Tablet"
		}
	case strings.Contains(ua, "linux"):
		os = "Linux"
		platform = "Desktop"
	case strings.Contains(ua, "cros"):
		os = "ChromeOS"
		platform = "Desktop"
	default:
		os = "Unknown"
		platform = "Unknown"
	}

	// Detect Browser (order matters: more specific first)
	switch {
	case strings.Contains(ua, "edg/") || strings.Contains(ua, "edga/") || strings.Contains(ua, "edgios/"):
		browser = "Edge"
	case strings.Contains(ua, "opr/") || strings.Contains(ua, "opera"):
		browser = "Opera"
	case strings.Contains(ua, "brave"):
		browser = "Brave"
	case strings.Contains(ua, "vivaldi"):
		browser = "Vivaldi"
	case strings.Contains(ua, "firefox") || strings.Contains(ua, "fxios"):
		browser = "Firefox"
	case strings.Contains(ua, "crios"):
		browser = "Chrome"
	case strings.Contains(ua, "safari") && !strings.Contains(ua, "chrome") && !strings.Contains(ua, "chromium"):
		browser = "Safari"
	case strings.Contains(ua, "chrome") || strings.Contains(ua, "chromium"):
		browser = "Chrome"
	default:
		browser = "Unknown"
	}

	// Override platform for API/CLI clients
	if strings.Contains(ua, "curl") || strings.Contains(ua, "python") || strings.Contains(ua, "go-http") || strings.Contains(ua, "axios") || strings.Contains(ua, "node") {
		platform = "API"
		browser = "CLI/SDK"
	}

	return
}
