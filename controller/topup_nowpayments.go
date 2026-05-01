package controller

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/service"
	"github.com/runcoor/aggre-api/setting"
	"github.com/runcoor/aggre-api/setting/operation_setting"
	"github.com/runcoor/aggre-api/setting/system_setting"

	"github.com/gin-gonic/gin"
	"github.com/thanhpk/randstr"
)

const (
	PaymentMethodNowPayments      = "nowpayments"
	nowPaymentsProductionBaseURL  = "https://api.nowpayments.io/v1"
	nowPaymentsSandboxBaseURL     = "https://api-sandbox.nowpayments.io/v1"
	nowPaymentsCreateInvoicePath  = "/invoice"
	nowPaymentsSignatureHeaderKey = "x-nowpayments-sig"
)

// NowPaymentsPayRequest 用户发起 NowPayments 支付请求体
type NowPaymentsPayRequest struct {
	Amount     int64  `json:"amount"`
	PayCurrency string `json:"pay_currency,omitempty"` // 可选，覆盖默认收款币种
}

// nowPaymentsCreateInvoicePayload 调 NowPayments POST /v1/invoice 的请求体
// 文档: https://documenter.getpostman.com/view/7907941/2s93JusNJt
type nowPaymentsCreateInvoicePayload struct {
	PriceAmount      float64 `json:"price_amount"`
	PriceCurrency    string  `json:"price_currency"`
	PayCurrency      string  `json:"pay_currency,omitempty"`
	IpnCallbackURL   string  `json:"ipn_callback_url,omitempty"`
	OrderID          string  `json:"order_id"`
	OrderDescription string  `json:"order_description,omitempty"`
	SuccessURL       string  `json:"success_url,omitempty"`
	CancelURL        string  `json:"cancel_url,omitempty"`
}

// nowPaymentsIpnPayload IPN 回调 body 结构。
// "All strings" webhook 格式下数字字段会以字符串送达，所以用 any 兼容。
type nowPaymentsIpnPayload struct {
	PaymentID        any    `json:"payment_id"`
	PaymentStatus    string `json:"payment_status"`
	PayAddress       string `json:"pay_address"`
	PriceAmount      any    `json:"price_amount"`
	PriceCurrency    string `json:"price_currency"`
	PayAmount        any    `json:"pay_amount"`
	ActuallyPaid     any    `json:"actually_paid"`
	PayCurrency      string `json:"pay_currency"`
	OrderID          string `json:"order_id"`
	OrderDescription string `json:"order_description"`
	PurchaseID       any    `json:"purchase_id"`
	OutcomeAmount    any    `json:"outcome_amount"`
	OutcomeCurrency  string `json:"outcome_currency"`
}

// nowPaymentsCreateInvoiceResponse NowPayments 创建发票响应
//
// 注意：NowPayments 实际响应里 id 和 price_amount 是 *字符串*（虽然文档示意是数字），
// 用 string 接才能稳定 unmarshal —— 之前用 int64/float64 会直接 type mismatch。
type nowPaymentsCreateInvoiceResponse struct {
	ID               string `json:"id"`
	OrderID          string `json:"order_id"`
	OrderDescription string `json:"order_description"`
	PriceAmount      string `json:"price_amount"`
	PriceCurrency    string `json:"price_currency"`
	PayCurrency      string `json:"pay_currency"`
	IpnCallbackURL   string `json:"ipn_callback_url"`
	InvoiceURL       string `json:"invoice_url"`
	SuccessURL       string `json:"success_url"`
	CancelURL        string `json:"cancel_url"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`

	// 错误响应字段（NowPayments 错误时返回 statusCode + message）
	Code    int    `json:"statusCode"`
	Message string `json:"message"`
}

// nowPaymentsBaseURL 根据沙盒开关返回对应的 API 基础地址
func nowPaymentsBaseURL() string {
	if setting.NowPaymentsSandbox {
		return nowPaymentsSandboxBaseURL
	}
	return nowPaymentsProductionBaseURL
}

// nowPaymentsEnabled 返回 NowPayments 是否可用
func nowPaymentsEnabled() bool {
	return setting.NowPaymentsEnabled &&
		setting.NowPaymentsApiKey != "" &&
		setting.NowPaymentsIpnSecret != ""
}

// getNowPaymentsPayMoney 按现有结算体系折算出 USD 金额（参考 getCryptomusPayMoney）
func getNowPaymentsPayMoney(amount float64, group string) float64 {
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
	return amount * setting.NowPaymentsUnitPrice * topupGroupRatio * discount
}

// createNowPaymentsInvoice 调用 NowPayments POST /v1/invoice 创建一张托管发票，
// 返回托管页 URL（用户跳转去付款的地址）。
//
// 参数：
//   - orderID: 订单号，作为 NowPayments 的 order_id 字段，回调里用它来定位本地订单。
//   - payMoney: USD 金额。
//   - orderDesc: 订单描述（展示在 NowPayments 托管页上）。
//   - successURL / cancelURL: 完成或取消付款后跳转的目标地址。
//   - notifyURL: IPN 回调地址。
//   - payCurrency: 默认收款币种，传空让用户在托管页自选。
//
// 调用方需要负责：在调用前已 Insert 一条 pending 状态的订单（topUp 或 subscriptionOrder），
// 失败时把订单状态置为 failed。
func createNowPaymentsInvoice(ctx context.Context, orderID string, payMoney float64,
	orderDesc, successURL, cancelURL, notifyURL, payCurrency string) (invoiceURL, invoiceID string, err error) {

	orderCurrency := setting.NowPaymentsOrderCurrency
	if orderCurrency == "" {
		orderCurrency = "USD"
	}

	payload := nowPaymentsCreateInvoicePayload{
		PriceAmount:      payMoney,
		PriceCurrency:    orderCurrency,
		PayCurrency:      payCurrency,
		IpnCallbackURL:   notifyURL,
		OrderID:          orderID,
		OrderDescription: orderDesc,
		SuccessURL:       successURL,
		CancelURL:        cancelURL,
	}
	body, err := common.Marshal(payload)
	if err != nil {
		return "", "", fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, nowPaymentsBaseURL()+nowPaymentsCreateInvoicePath, bytes.NewReader(body))
	if err != nil {
		return "", "", fmt.Errorf("build request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", setting.NowPaymentsApiKey)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", "", fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("read response: %w", err)
	}

	var createResp nowPaymentsCreateInvoiceResponse
	if err := common.Unmarshal(respBody, &createResp); err != nil {
		return "", "", fmt.Errorf("decode response: %w (body=%s)", err, string(respBody))
	}

	if resp.StatusCode >= 400 || createResp.InvoiceURL == "" {
		errMsg := createResp.Message
		if errMsg == "" {
			errMsg = fmt.Sprintf("http %d", resp.StatusCode)
		}
		return "", "", fmt.Errorf("nowpayments error: %s (body=%s)", errMsg, string(respBody))
	}

	return createResp.InvoiceURL, createResp.ID, nil
}

// nowPaymentsSign 计算 NowPayments IPN 签名
//
// 算法（参考 NowPayments 官方 JS SDK 与文档）：
//  1. 把 body 解析成 map
//  2. 递归按 key 字典序排序（Go 的 json.Marshal 对 map[string]any 自动按 key 字典序输出，
//     等价于 JS 端的 sortObject 递归）
//  3. JSON.Marshal 得到稳定的字符串
//  4. HMAC-SHA512(sortedJSON, IPN_SECRET).hex()
func nowPaymentsSign(body []byte, ipnSecret string) (string, error) {
	var m map[string]any
	if err := common.Unmarshal(body, &m); err != nil {
		return "", err
	}
	sorted, err := common.Marshal(m)
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha512.New, []byte(ipnSecret))
	mac.Write(sorted)
	return hex.EncodeToString(mac.Sum(nil)), nil
}

// RequestNowPaymentsPay POST /api/user/nowpayments/pay
// 创建一张 NowPayments 托管发票，前端拿到 invoice_url 后跳转到 NowPayments 托管页面付款
func RequestNowPaymentsPay(c *gin.Context) {
	if !nowPaymentsEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "NowPayments 支付未启用"})
		return
	}

	var req NowPaymentsPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	userId := c.GetInt("id")
	minTopup := getMinTopupForUser(userId)
	npMin := int64(setting.NowPaymentsMinTopUp)
	if npMin < minTopup {
		npMin = minTopup
	}
	if req.Amount < npMin {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", npMin)})
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
	payMoney := getNowPaymentsPayMoney(float64(req.Amount), group)
	if payMoney < 1.0 {
		// NowPayments 最低发票金额一般 ~$1 USD
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	// Token 模式下归一化 Amount（存美元等价数量），与 RechargeNowPayments 入账保持一致
	amount := req.Amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = int64(float64(req.Amount) / common.QuotaPerUnit)
		if amount < 1 {
			amount = 1
		}
	}

	tradeNo := fmt.Sprintf("NP-%d-%d-%s", userId, time.Now().UnixMilli(), randstr.String(6))

	topUp := &model.TopUp{
		UserId:        userId,
		Amount:        amount,
		Money:         payMoney,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodNowPayments,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		log.Printf("NowPayments 创建本地订单失败: %v", err)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	callbackAddr := service.GetCallbackAddress()
	notifyURL := callbackAddr + "/api/nowpayments/webhook"
	if setting.NowPaymentsNotifyUrl != "" {
		notifyURL = setting.NowPaymentsNotifyUrl
	}
	successURL := system_setting.ServerAddress + "/console/topup?show_history=true"
	if setting.NowPaymentsReturnUrl != "" {
		successURL = setting.NowPaymentsReturnUrl
	}
	cancelURL := system_setting.ServerAddress + "/console/topup"
	if setting.NowPaymentsCancelUrl != "" {
		cancelURL = setting.NowPaymentsCancelUrl
	}
	payCurrency := setting.NowPaymentsPayCurrency
	if req.PayCurrency != "" {
		payCurrency = req.PayCurrency
	}

	orderCurrency := setting.NowPaymentsOrderCurrency
	if orderCurrency == "" {
		orderCurrency = "USD"
	}
	desc := fmt.Sprintf("Top up %.2f %s", payMoney, orderCurrency)

	invoiceURL, invoiceID, err := createNowPaymentsInvoice(
		c.Request.Context(), tradeNo, payMoney, desc,
		successURL, cancelURL, notifyURL, payCurrency,
	)
	if err != nil {
		log.Printf("NowPayments 充值下单失败 - 订单: %s, err: %v", tradeNo, err)
		_ = markNowPaymentsTopUpFailed(topUp)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	log.Printf("NowPayments 订单创建成功 - 用户: %d, 订单: %s, 金额: %.2f USD, invoice_id=%s",
		userId, tradeNo, payMoney, invoiceID)

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link":   invoiceURL,
			"trade_no":   tradeNo,
			"invoice_id": invoiceID,
		},
	})
}

func markNowPaymentsTopUpFailed(topUp *model.TopUp) error {
	topUp.Status = common.TopUpStatusFailed
	return topUp.Update()
}

// NowPaymentsWebhook 处理 NowPayments IPN 回调
// POST /api/nowpayments/webhook
//
// NowPayments 在交易状态变更时回调此地址，body 是 JSON，签名放在
// `x-nowpayments-sig` 头中，算法见 nowPaymentsSign。
func NowPaymentsWebhook(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("NowPayments Webhook 读取 body 失败: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	if !nowPaymentsEnabled() {
		log.Printf("NowPayments Webhook: 未启用")
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	receivedSig := c.GetHeader(nowPaymentsSignatureHeaderKey)
	if receivedSig == "" {
		log.Printf("NowPayments Webhook 缺少签名头 %s", nowPaymentsSignatureHeaderKey)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	expectedSig, err := nowPaymentsSign(bodyBytes, setting.NowPaymentsIpnSecret)
	if err != nil {
		log.Printf("NowPayments Webhook 签名计算失败: %v, body=%s", err, string(bodyBytes))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	// 常量时间比较，防侧信道
	if !hmac.Equal([]byte(expectedSig), []byte(receivedSig)) {
		log.Printf("NowPayments Webhook 签名验证失败: expected=%s got=%s", expectedSig, receivedSig)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	var payload nowPaymentsIpnPayload
	if err := common.Unmarshal(bodyBytes, &payload); err != nil {
		log.Printf("NowPayments Webhook 解析失败: %v, body=%s", err, string(bodyBytes))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if payload.OrderID == "" {
		log.Printf("NowPayments Webhook 缺少 order_id, body=%s", string(bodyBytes))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	LockOrder(payload.OrderID)
	defer UnlockOrder(payload.OrderID)

	// 通过订单号前缀分发：
	//   "SUB-NP-..." → 订阅订单（SubscriptionOrder 表）
	//   "NP-..."     → 钱包充值（TopUp 表）
	if strings.HasPrefix(payload.OrderID, "SUB-NP-") {
		nowPaymentsHandleSubscriptionWebhook(c, &payload, bodyBytes)
		return
	}
	nowPaymentsHandleTopUpWebhook(c, &payload)
}

// nowPaymentsHandleTopUpWebhook 处理钱包充值订单的 IPN 回调（order_id 前缀 NP-）
func nowPaymentsHandleTopUpWebhook(c *gin.Context, payload *nowPaymentsIpnPayload) {
	topUp := model.GetTopUpByTradeNo(payload.OrderID)
	if topUp == nil {
		log.Printf("NowPayments Webhook 未找到充值订单: %s", payload.OrderID)
		c.Status(http.StatusOK)
		return
	}

	// 已成功 → 幂等返回
	if topUp.Status == common.TopUpStatusSuccess {
		c.Status(http.StatusOK)
		return
	}

	switch payload.PaymentStatus {
	case "finished":
		// 实际入账：金额校验 + 入账
		actuallyPaid := parseAnyToFloat(payload.ActuallyPaid)
		payAmount := parseAnyToFloat(payload.PayAmount)
		if actuallyPaid > 0 && payAmount > 0 && actuallyPaid+0.001 < payAmount {
			log.Printf("NowPayments Webhook 实付不足: 订单=%s, 期望=%v %s, 实付=%v",
				payload.OrderID, payload.PayAmount, payload.PayCurrency, payload.ActuallyPaid)
			c.Status(http.StatusOK)
			return
		}
		if err := model.RechargeNowPayments(payload.OrderID); err != nil {
			log.Printf("NowPayments 充值入账失败: %v, 订单: %s", err, payload.OrderID)
			c.Status(http.StatusInternalServerError)
			return
		}
		log.Printf("NowPayments 充值成功 - 订单: %s, 实付: %v %s",
			payload.OrderID, payload.ActuallyPaid, payload.PayCurrency)
		c.Status(http.StatusOK)
		return

	case "failed", "expired", "refunded":
		if topUp.Status == common.TopUpStatusPending {
			topUp.Status = common.TopUpStatusFailed
			_ = topUp.Update()
		}
		log.Printf("NowPayments 充值订单终态失败 - 订单: %s, 状态: %s",
			payload.OrderID, payload.PaymentStatus)
		c.Status(http.StatusOK)
		return

	case "partially_paid":
		log.Printf("NowPayments 充值部分支付 - 订单: %s, 期望: %v %s, 实付: %v %s（保留 pending，待人工处理）",
			payload.OrderID, payload.PayAmount, payload.PayCurrency,
			payload.ActuallyPaid, payload.PayCurrency)
		c.Status(http.StatusOK)
		return

	default:
		// waiting / confirming / confirmed / sending — 中间态，不处理
		log.Printf("NowPayments 充值中间态 - 订单: %s, 状态: %s", payload.OrderID, payload.PaymentStatus)
		c.Status(http.StatusOK)
		return
	}
}

// nowPaymentsHandleSubscriptionWebhook 处理订阅订单的 IPN 回调（order_id 前缀 SUB-NP-）
func nowPaymentsHandleSubscriptionWebhook(c *gin.Context, payload *nowPaymentsIpnPayload, rawBody []byte) {
	order := model.GetSubscriptionOrderByTradeNo(payload.OrderID)
	if order == nil {
		log.Printf("NowPayments Webhook 未找到订阅订单: %s", payload.OrderID)
		c.Status(http.StatusOK)
		return
	}

	if order.Status == common.TopUpStatusSuccess {
		c.Status(http.StatusOK)
		return
	}

	switch payload.PaymentStatus {
	case "finished":
		actuallyPaid := parseAnyToFloat(payload.ActuallyPaid)
		payAmount := parseAnyToFloat(payload.PayAmount)
		if actuallyPaid > 0 && payAmount > 0 && actuallyPaid+0.001 < payAmount {
			log.Printf("NowPayments Webhook 订阅实付不足: 订单=%s, 期望=%v %s, 实付=%v",
				payload.OrderID, payload.PayAmount, payload.PayCurrency, payload.ActuallyPaid)
			c.Status(http.StatusOK)
			return
		}
		if err := model.CompleteSubscriptionOrder(payload.OrderID, string(rawBody)); err != nil {
			log.Printf("NowPayments 订阅入账失败: %v, 订单: %s", err, payload.OrderID)
			c.Status(http.StatusInternalServerError)
			return
		}
		log.Printf("NowPayments 订阅开通成功 - 订单: %s, 实付: %v %s",
			payload.OrderID, payload.ActuallyPaid, payload.PayCurrency)
		c.Status(http.StatusOK)
		return

	case "failed", "expired", "refunded":
		if err := model.ExpireSubscriptionOrder(payload.OrderID); err != nil {
			log.Printf("NowPayments 订阅订单标记失败: %v, 订单: %s", err, payload.OrderID)
		}
		log.Printf("NowPayments 订阅订单终态失败 - 订单: %s, 状态: %s",
			payload.OrderID, payload.PaymentStatus)
		c.Status(http.StatusOK)
		return

	case "partially_paid":
		log.Printf("NowPayments 订阅部分支付 - 订单: %s, 期望: %v %s, 实付: %v %s（保留 pending，待人工处理）",
			payload.OrderID, payload.PayAmount, payload.PayCurrency,
			payload.ActuallyPaid, payload.PayCurrency)
		c.Status(http.StatusOK)
		return

	default:
		log.Printf("NowPayments 订阅中间态 - 订单: %s, 状态: %s", payload.OrderID, payload.PaymentStatus)
		c.Status(http.StatusOK)
		return
	}
}

// parseAnyToFloat 把 IPN 中可能是 string / float64 的数字字段转成 float64
// "All strings" 模式下是 string，"Classic" 模式下可能是数字
func parseAnyToFloat(v any) float64 {
	switch x := v.(type) {
	case nil:
		return 0
	case string:
		f, _ := strconv.ParseFloat(x, 64)
		return f
	case float64:
		return x
	case float32:
		return float64(x)
	case int:
		return float64(x)
	case int64:
		return float64(x)
	default:
		return 0
	}
}
