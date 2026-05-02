package controller

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting"
	"github.com/runcoor/aggre-api/setting/operation_setting"
	"github.com/runcoor/aggre-api/setting/system_setting"

	"github.com/gin-gonic/gin"
	"github.com/thanhpk/randstr"
)

const (
	PaymentMethodDodoPayments = "dodopayments"

	dodoCreatePaymentPath      = "/payments"
	dodoCreateSubscriptionPath = "/subscriptions"

	dodoHeaderWebhookID        = "webhook-id"
	dodoHeaderWebhookTimestamp = "webhook-timestamp"
	dodoHeaderWebhookSignature = "webhook-signature"

	// Standard Webhooks 推荐 5 分钟 timestamp 容差
	dodoWebhookTimestampTolerance = 5 * 60

	dodoMetadataTradeNoKey = "trade_no"
)

// DodoPaymentsPayRequest 用户发起 Dodo Payments 充值的请求体
type DodoPaymentsPayRequest struct {
	Amount int64 `json:"amount"`
}

// dodoCustomer 客户对象（创建支付时只用 email + 可选 name）
type dodoCustomer struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

// dodoBilling 必填的 billing 对象，country 是 ISO 3166-1 alpha-2 必填
type dodoBilling struct {
	City    string `json:"city,omitempty"`
	Country string `json:"country"`
	State   string `json:"state,omitempty"`
	Street  string `json:"street,omitempty"`
	Zipcode string `json:"zipcode,omitempty"`
}

// dodoProductCartItem 订购的商品；amount 单位为最小货币单位 (cents) —— 仅 PWYW 产品支持
type dodoProductCartItem struct {
	ProductId string `json:"product_id"`
	Quantity  int    `json:"quantity"`
	Amount    *int64 `json:"amount,omitempty"`
}

// dodoCreatePaymentPayload POST /payments 请求体（一次性支付 / 钱包充值）
type dodoCreatePaymentPayload struct {
	Customer        dodoCustomer          `json:"customer"`
	Billing         dodoBilling           `json:"billing"`
	ProductCart     []dodoProductCartItem `json:"product_cart"`
	PaymentLink     bool                  `json:"payment_link"`
	ReturnURL       string                `json:"return_url,omitempty"`
	Metadata        map[string]string     `json:"metadata,omitempty"`
	BillingCurrency string                `json:"billing_currency,omitempty"`
}

// dodoCreateSubscriptionPayload POST /subscriptions 请求体
type dodoCreateSubscriptionPayload struct {
	Customer    dodoCustomer      `json:"customer"`
	Billing     dodoBilling       `json:"billing"`
	ProductId   string            `json:"product_id"`
	Quantity    int               `json:"quantity"`
	PaymentLink bool              `json:"payment_link"`
	ReturnURL   string            `json:"return_url,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// dodoCreatePaymentResponse 通用的创建响应（payments 和 subscriptions 字段大致一致）
type dodoCreatePaymentResponse struct {
	PaymentID      string `json:"payment_id"`
	SubscriptionID string `json:"subscription_id"`
	PaymentLink    string `json:"payment_link"`
	ClientSecret   string `json:"client_secret"`
	TotalAmount    int64  `json:"total_amount"`
	ExpiresOn      string `json:"expires_on"`

	// 错误响应（Dodo 4xx 时返回 error/message 字段）
	Code    int    `json:"code"`
	Error   string `json:"error"`
	Message string `json:"message"`
}

// dodoWebhookEvent webhook envelope（Standard Webhooks 标准结构）
type dodoWebhookEvent struct {
	BusinessID string             `json:"business_id"`
	Type       string             `json:"type"`
	Timestamp  string             `json:"timestamp"`
	Data       dodoWebhookEventData `json:"data"`
}

type dodoWebhookEventData struct {
	PayloadType    string            `json:"payload_type"`
	PaymentID      string            `json:"payment_id"`
	SubscriptionID string            `json:"subscription_id"`
	Status         string            `json:"status"`
	TotalAmount    int64             `json:"total_amount"`
	Currency       string            `json:"currency"`
	Customer       json.RawMessage   `json:"customer"`
	Metadata       map[string]string `json:"metadata"`
}

// dodoPaymentsEnabled 返回是否完整启用 Dodo Payments
func dodoPaymentsEnabled() bool {
	return setting.DodoPaymentsEnabled &&
		setting.DodoPaymentsApiKey != "" &&
		setting.DodoPaymentsWebhookSecret != ""
}

// dodoPaymentsTopUpEnabled 充值还需要配置 PWYW 产品 ID
func dodoPaymentsTopUpEnabled() bool {
	return dodoPaymentsEnabled() && setting.DodoPaymentsTopUpProductId != ""
}

// getDodoPaymentsPayMoney 折算 USD 金额（与 NowPayments 相同口径）
func getDodoPaymentsPayMoney(amount float64, group string) float64 {
	originalAmount := amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = amount / common.QuotaPerUnit
	}
	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	discount := 1.0
	if ds, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(originalAmount)]; ok {
		if ds > 0 {
			discount = ds
		}
	}
	return amount * setting.DodoPaymentsUnitPrice * topupGroupRatio * discount
}

// dodoBillingCountryDefault Dodo 必填 billing.country；用 US 兜底，
// Dashboard 在 hosted page 会让用户实际填写。
const dodoBillingCountryDefault = "US"

// callDodoCreate 向 Dodo Payments 发起 POST 请求并解析响应
func callDodoCreate(ctx context.Context, path string, body []byte) (*dodoCreatePaymentResponse, error) {
	url := setting.DodoPaymentsBaseURL() + path
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+setting.DodoPaymentsApiKey)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var parsed dodoCreatePaymentResponse
	if err := common.Unmarshal(respBody, &parsed); err != nil {
		return nil, fmt.Errorf("decode response: %w (status=%d body=%s)", err, resp.StatusCode, string(respBody))
	}

	if resp.StatusCode >= 400 || parsed.PaymentLink == "" {
		errMsg := parsed.Message
		if errMsg == "" {
			errMsg = parsed.Error
		}
		if errMsg == "" {
			errMsg = fmt.Sprintf("http %d", resp.StatusCode)
		}
		return nil, fmt.Errorf("dodo payments error: %s (body=%s)", errMsg, string(respBody))
	}
	return &parsed, nil
}

// createDodoTopUpPayment 创建一次性充值的 hosted payment link
func createDodoTopUpPayment(ctx context.Context, tradeNo string, payMoneyUSD float64,
	customerEmail, customerName, returnURL string) (paymentLink, paymentID string, err error) {

	if setting.DodoPaymentsTopUpProductId == "" {
		return "", "", errors.New("Dodo Payments 充值产品未配置")
	}

	// 金额单位换成最小货币单位 (cents)；四舍五入避免浮点误差
	amountCents := int64(payMoneyUSD*100 + 0.5)
	if amountCents <= 0 {
		return "", "", errors.New("invalid amount")
	}

	payload := dodoCreatePaymentPayload{
		Customer: dodoCustomer{Email: customerEmail, Name: customerName},
		Billing:  dodoBilling{Country: dodoBillingCountryDefault},
		ProductCart: []dodoProductCartItem{{
			ProductId: setting.DodoPaymentsTopUpProductId,
			Quantity:  1,
			Amount:    &amountCents,
		}},
		PaymentLink:     true,
		ReturnURL:       returnURL,
		BillingCurrency: "USD",
		Metadata:        map[string]string{dodoMetadataTradeNoKey: tradeNo},
	}
	body, err := common.Marshal(payload)
	if err != nil {
		return "", "", fmt.Errorf("marshal payload: %w", err)
	}
	resp, err := callDodoCreate(ctx, dodoCreatePaymentPath, body)
	if err != nil {
		return "", "", err
	}
	return resp.PaymentLink, resp.PaymentID, nil
}

// createDodoSubscription 创建订阅 hosted payment link
func createDodoSubscription(ctx context.Context, tradeNo, productId string,
	customerEmail, customerName, returnURL string) (paymentLink, subscriptionID, paymentID string, err error) {

	if productId == "" {
		return "", "", "", errors.New("订阅套餐未配置 Dodo product_id")
	}
	payload := dodoCreateSubscriptionPayload{
		Customer:    dodoCustomer{Email: customerEmail, Name: customerName},
		Billing:     dodoBilling{Country: dodoBillingCountryDefault},
		ProductId:   productId,
		Quantity:    1,
		PaymentLink: true,
		ReturnURL:   returnURL,
		Metadata:    map[string]string{dodoMetadataTradeNoKey: tradeNo},
	}
	body, err := common.Marshal(payload)
	if err != nil {
		return "", "", "", fmt.Errorf("marshal payload: %w", err)
	}
	resp, err := callDodoCreate(ctx, dodoCreateSubscriptionPath, body)
	if err != nil {
		return "", "", "", err
	}
	return resp.PaymentLink, resp.SubscriptionID, resp.PaymentID, nil
}

// dodoDecodeSecret 把 Dashboard 给的 webhook secret（可能 whsec_ 前缀）解码成 raw key
//
// Standard Webhooks 规范：secret 字符串去掉 whsec_ 前缀后是 base64 编码的 raw key。
// 但部分实现允许把整个 secret（含/不含前缀）当作 raw bytes —— 这里两种都尝试。
func dodoDecodeSecret(secret string) []byte {
	s := strings.TrimSpace(secret)
	s = strings.TrimPrefix(s, "whsec_")
	if decoded, err := base64.StdEncoding.DecodeString(s); err == nil && len(decoded) > 0 {
		return decoded
	}
	return []byte(s)
}

// dodoVerifyWebhookSignature 校验 Standard Webhooks v1 签名
//
// 步骤：
//  1. 检查 webhook-timestamp 与当前时间相差 <= dodoWebhookTimestampTolerance（防重放）
//  2. 用 webhook secret 计算 HMAC-SHA256({webhook-id}.{webhook-timestamp}.{rawbody})
//     base64 编码，得到 expected
//  3. webhook-signature 头里可能含多个 "v1,sig" 用空格分隔，常量时间比对任一匹配即可
func dodoVerifyWebhookSignature(secret, webhookID, webhookTimestamp, signatureHeader string, body []byte) error {
	if webhookID == "" || webhookTimestamp == "" || signatureHeader == "" {
		return errors.New("missing webhook signature headers")
	}

	tsInt, err := strconv.ParseInt(webhookTimestamp, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid webhook-timestamp: %w", err)
	}
	now := time.Now().Unix()
	if diff := now - tsInt; diff > dodoWebhookTimestampTolerance || diff < -dodoWebhookTimestampTolerance {
		return fmt.Errorf("webhook-timestamp out of tolerance (delta=%d)", diff)
	}

	signedPayload := webhookID + "." + webhookTimestamp + "."
	mac := hmac.New(sha256.New, dodoDecodeSecret(secret))
	mac.Write([]byte(signedPayload))
	mac.Write(body)
	expected := base64.StdEncoding.EncodeToString(mac.Sum(nil))
	expectedBytes := []byte(expected)

	for _, part := range strings.Split(signatureHeader, " ") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		// Standard Webhooks 头格式 "v1,<sig>"；也兼容只有 sig 的实现
		if idx := strings.Index(part, ","); idx >= 0 {
			part = part[idx+1:]
		}
		if hmac.Equal([]byte(part), expectedBytes) {
			return nil
		}
	}
	return errors.New("webhook signature mismatch")
}

// RequestDodoPaymentsPay POST /api/user/dodopayments/pay —— 创建钱包充值订单
func RequestDodoPaymentsPay(c *gin.Context) {
	if !dodoPaymentsTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Dodo Payments 充值未启用"})
		return
	}

	var req DodoPaymentsPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	userId := c.GetInt("id")
	minTopup := getMinTopupForUser(userId)
	dpMin := int64(setting.DodoPaymentsMinTopUp)
	if dpMin < minTopup {
		dpMin = minTopup
	}
	if req.Amount < dpMin {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", dpMin)})
		return
	}
	if req.Amount > 10000 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值数量过大"})
		return
	}

	user, err := model.GetUserById(userId, false)
	if err != nil || user == nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "用户不存在"})
		return
	}

	group, _ := model.GetUserGroup(userId, true)
	payMoney := getDodoPaymentsPayMoney(float64(req.Amount), group)
	if payMoney < 0.5 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	// Token 模式下归一化 amount（与 RechargeDodoPayments 入账保持一致）
	amount := req.Amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = int64(float64(req.Amount) / common.QuotaPerUnit)
		if amount < 1 {
			amount = 1
		}
	}

	tradeNo := fmt.Sprintf("DODO-%d-%d-%s", userId, time.Now().UnixMilli(), randstr.String(6))

	topUp := &model.TopUp{
		UserId:        userId,
		Amount:        amount,
		Money:         payMoney,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodDodoPayments,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		log.Printf("Dodo Payments 创建本地订单失败: %v", err)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	returnURL := system_setting.ServerAddress + "/console/topup?show_history=true"
	if setting.DodoPaymentsReturnUrl != "" {
		returnURL = setting.DodoPaymentsReturnUrl
	}

	paymentLink, paymentID, err := createDodoTopUpPayment(
		c.Request.Context(), tradeNo, payMoney, user.Email, user.Username, returnURL,
	)
	if err != nil {
		log.Printf("Dodo Payments 充值下单失败 - 订单: %s, err: %v", tradeNo, err)
		_ = markDodoTopUpFailed(topUp)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	log.Printf("Dodo Payments 订单创建成功 - 用户: %d, 订单: %s, 金额: %.2f USD, payment_id=%s",
		userId, tradeNo, payMoney, paymentID)

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link":    paymentLink,
			"trade_no":    tradeNo,
			"payment_id":  paymentID,
		},
	})
}

func markDodoTopUpFailed(topUp *model.TopUp) error {
	topUp.Status = common.TopUpStatusFailed
	return topUp.Update()
}

// DodoPaymentsWebhook POST /api/dodopayments/webhook
//
// 处理 Dodo Payments webhook（Standard Webhooks v1 签名），按 event.type 分发处理。
// 路由按订单号前缀走 topup / subscription —— 与 nowpayments 保持一致的模式。
func DodoPaymentsWebhook(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Dodo Payments webhook 读取 body 失败: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	if !dodoPaymentsEnabled() {
		log.Printf("Dodo Payments webhook: 未启用")
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	webhookID := c.GetHeader(dodoHeaderWebhookID)
	webhookTS := c.GetHeader(dodoHeaderWebhookTimestamp)
	webhookSig := c.GetHeader(dodoHeaderWebhookSignature)

	if err := dodoVerifyWebhookSignature(setting.DodoPaymentsWebhookSecret, webhookID, webhookTS, webhookSig, bodyBytes); err != nil {
		log.Printf("Dodo Payments webhook 签名验证失败: %v, id=%s ts=%s", err, webhookID, webhookTS)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	var event dodoWebhookEvent
	if err := common.Unmarshal(bodyBytes, &event); err != nil {
		log.Printf("Dodo Payments webhook 解析失败: %v, body=%s", err, string(bodyBytes))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	tradeNo := ""
	if event.Data.Metadata != nil {
		tradeNo = event.Data.Metadata[dodoMetadataTradeNoKey]
	}

	log.Printf("Dodo Payments webhook 收到事件: type=%s trade_no=%s payment_id=%s sub_id=%s",
		event.Type, tradeNo, event.Data.PaymentID, event.Data.SubscriptionID)

	switch event.Type {
	case "payment.succeeded":
		dodoHandlePaymentSucceeded(c, &event, tradeNo)
		return
	case "payment.failed", "payment.cancelled":
		dodoHandlePaymentFailed(c, &event, tradeNo)
		return
	case "subscription.active":
		dodoHandleSubscriptionActive(c, &event, tradeNo, bodyBytes)
		return
	case "subscription.failed", "subscription.cancelled", "subscription.on_hold":
		dodoHandleSubscriptionFailed(c, &event, tradeNo)
		return
	case "subscription.renewed", "subscription.updated":
		// 当前业务模型里 SubscriptionOrder 是一次性下单，不处理续期 —— 续期建议走单独流程
		log.Printf("Dodo Payments webhook %s 暂不处理: trade_no=%s sub_id=%s",
			event.Type, tradeNo, event.Data.SubscriptionID)
		c.Status(http.StatusOK)
		return
	case "refund.succeeded", "dispute.opened", "dispute.accepted", "dispute.challenged":
		log.Printf("Dodo Payments webhook %s（已记录，不自动处理）: payment_id=%s",
			event.Type, event.Data.PaymentID)
		c.Status(http.StatusOK)
		return
	default:
		log.Printf("Dodo Payments webhook 未知事件类型: %s", event.Type)
		c.Status(http.StatusOK)
		return
	}
}

// dodoHandlePaymentSucceeded 处理 payment.succeeded（一次性充值成功）
func dodoHandlePaymentSucceeded(c *gin.Context, event *dodoWebhookEvent, tradeNo string) {
	if tradeNo == "" {
		log.Printf("Dodo Payments payment.succeeded 缺少 trade_no, payment_id=%s", event.Data.PaymentID)
		c.Status(http.StatusOK)
		return
	}

	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	// 订阅订单的首次付款也会触发 payment.succeeded —— 但订阅入账由 subscription.active 处理，
	// 这里只处理钱包充值（DODO- 前缀）订单。
	if !strings.HasPrefix(tradeNo, "DODO-") {
		log.Printf("Dodo Payments payment.succeeded 跳过非充值订单: %s", tradeNo)
		c.Status(http.StatusOK)
		return
	}

	topUp := model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil {
		log.Printf("Dodo Payments webhook 未找到充值订单: %s", tradeNo)
		c.Status(http.StatusOK)
		return
	}
	if topUp.Status == common.TopUpStatusSuccess {
		c.Status(http.StatusOK)
		return
	}
	if err := model.RechargeDodoPayments(tradeNo); err != nil {
		log.Printf("Dodo Payments 充值入账失败: %v, 订单: %s", err, tradeNo)
		c.Status(http.StatusInternalServerError)
		return
	}
	log.Printf("Dodo Payments 充值成功 - 订单: %s, payment_id=%s", tradeNo, event.Data.PaymentID)
	c.Status(http.StatusOK)
}

// dodoHandlePaymentFailed 处理 payment.failed / payment.cancelled
func dodoHandlePaymentFailed(c *gin.Context, event *dodoWebhookEvent, tradeNo string) {
	if tradeNo == "" {
		c.Status(http.StatusOK)
		return
	}
	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	if strings.HasPrefix(tradeNo, "DODO-") {
		topUp := model.GetTopUpByTradeNo(tradeNo)
		if topUp != nil && topUp.Status == common.TopUpStatusPending {
			topUp.Status = common.TopUpStatusFailed
			_ = topUp.Update()
		}
	} else if strings.HasPrefix(tradeNo, "SUB-DODO-") {
		_ = model.ExpireSubscriptionOrder(tradeNo)
	}
	log.Printf("Dodo Payments 订单终态失败 - 订单: %s, type: %s", tradeNo, event.Type)
	c.Status(http.StatusOK)
}

// dodoHandleSubscriptionActive 处理 subscription.active —— 订阅首次激活
func dodoHandleSubscriptionActive(c *gin.Context, event *dodoWebhookEvent, tradeNo string, raw []byte) {
	if tradeNo == "" || !strings.HasPrefix(tradeNo, "SUB-DODO-") {
		log.Printf("Dodo Payments subscription.active 缺少有效 trade_no, sub_id=%s", event.Data.SubscriptionID)
		c.Status(http.StatusOK)
		return
	}

	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	order := model.GetSubscriptionOrderByTradeNo(tradeNo)
	if order == nil {
		log.Printf("Dodo Payments webhook 未找到订阅订单: %s", tradeNo)
		c.Status(http.StatusOK)
		return
	}
	if order.Status == common.TopUpStatusSuccess {
		c.Status(http.StatusOK)
		return
	}
	if err := model.CompleteSubscriptionOrder(tradeNo, string(raw)); err != nil {
		log.Printf("Dodo Payments 订阅入账失败: %v, 订单: %s", err, tradeNo)
		c.Status(http.StatusInternalServerError)
		return
	}
	log.Printf("Dodo Payments 订阅开通成功 - 订单: %s, sub_id=%s", tradeNo, event.Data.SubscriptionID)
	c.Status(http.StatusOK)
}

// dodoHandleSubscriptionFailed 处理 subscription.failed / cancelled / on_hold
func dodoHandleSubscriptionFailed(c *gin.Context, event *dodoWebhookEvent, tradeNo string) {
	if tradeNo == "" || !strings.HasPrefix(tradeNo, "SUB-DODO-") {
		c.Status(http.StatusOK)
		return
	}
	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	if err := model.ExpireSubscriptionOrder(tradeNo); err != nil {
		log.Printf("Dodo Payments 订阅订单标记失败: %v, 订单: %s", err, tradeNo)
	}
	log.Printf("Dodo Payments 订阅订单终态失败 - 订单: %s, type: %s", tradeNo, event.Type)
	c.Status(http.StatusOK)
}
