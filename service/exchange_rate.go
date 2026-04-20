package service

import (
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/operation_setting"
)

var (
	exchangeRateMu        sync.Mutex
	lastExchangeRateFetch time.Time
	// Cache for 10 minutes to avoid hammering the API
	exchangeRateCacheDuration = 10 * time.Minute
)

type frankfurterResponse struct {
	Rate float64 `json:"rate"`
}

// RefreshUSDExchangeRate fetches the latest USD→CNY rate from Frankfurter API,
// updates the in-memory Price and USDExchangeRate settings, and persists to DB.
// Returns the rate on success, or the current fallback rate on failure.
func RefreshUSDExchangeRate() (float64, error) {
	exchangeRateMu.Lock()
	defer exchangeRateMu.Unlock()

	// If fetched recently, return cached value
	if time.Since(lastExchangeRateFetch) < exchangeRateCacheDuration {
		return operation_setting.USDExchangeRate, nil
	}

	rate, err := fetchFrankfurterRate()
	if err != nil {
		common.SysLog(fmt.Sprintf("failed to fetch exchange rate from Frankfurter: %v, using fallback %.4f", err, operation_setting.USDExchangeRate))
		return operation_setting.USDExchangeRate, err
	}

	// Update in-memory settings
	operation_setting.Price = rate
	operation_setting.USDExchangeRate = rate

	// Persist to database
	_ = model.UpdateOption("Price", fmt.Sprintf("%.4f", rate))
	_ = model.UpdateOption("USDExchangeRate", fmt.Sprintf("%.4f", rate))

	lastExchangeRateFetch = time.Now()
	common.SysLog(fmt.Sprintf("exchange rate updated: 1 USD = %.4f CNY", rate))

	return rate, nil
}

func fetchFrankfurterRate() (float64, error) {
	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Get("https://api.frankfurter.dev/v2/rate/USD/CNY")
	if err != nil {
		return 0, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}

	var result frankfurterResponse
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("read body failed: %w", err)
	}
	if err := common.Unmarshal(body, &result); err != nil {
		return 0, fmt.Errorf("unmarshal failed: %w", err)
	}

	if result.Rate <= 0 {
		return 0, fmt.Errorf("invalid rate: %.4f", result.Rate)
	}

	return result.Rate, nil
}
