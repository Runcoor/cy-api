package setting

// Dodo Payments 支付配置
//
// 文档:
//   https://docs.dodopayments.com/developer-resources/integration-guide
//   https://docs.dodopayments.com/developer-resources/subscription-integration-guide
//   https://docs.dodopayments.com/developer-resources/webhooks
//
// 关键点：
//   - 测试 / 生产环境分别用 https://test.dodopayments.com / https://live.dodopayments.com
//   - 充值 (Top-up) 需要在 Dashboard 预先创建一个 "Pay What You Want" 一次性产品，
//     把它的 product_id 填到 DodoPaymentsTopUpProductId；后端在 /checkouts 里通过
//     product_cart[].amount (单位 = 最小货币单位 / cents) 传入实际金额。
//   - 订阅每个套餐对应 Dashboard 上一个 Subscription 产品，product_id 存到 plan.dodo_product_id。
//   - Webhook 走 Standard Webhooks v1 规范：
//       headers: webhook-id / webhook-timestamp / webhook-signature
//       payload to sign: "{webhook-id}.{webhook-timestamp}.{raw_body}"
//       algorithm:       HMAC-SHA256 → base64
//       header value:    "v1,<base64sig>"  (允许多个空格分隔的 v1,xxx 备份签名)
//       secret:          可能以 "whsec_" 前缀给出，签名前去掉前缀再 base64 decode
var (
	// DodoPaymentsEnabled 是否启用 Dodo Payments 支付
	DodoPaymentsEnabled bool

	// DodoPaymentsApiKey API Key（Dashboard → Developer → API）
	// 测试 Key 和生产 Key 是分开的，记得跟 DodoPaymentsSandbox 一起切换。
	DodoPaymentsApiKey string

	// DodoPaymentsWebhookSecret Webhook signing secret，用于 Standard Webhooks 校验。
	// 在 Dashboard → Developer → Webhooks 创建 endpoint 后获取，可能以 whsec_ 开头。
	DodoPaymentsWebhookSecret string

	// DodoPaymentsSandbox 是否使用测试环境 (test.dodopayments.com)
	DodoPaymentsSandbox bool

	// DodoPaymentsTopUpProductId 用于钱包充值的 Pay-What-You-Want 产品 ID。
	// 留空时充值入口不可用（订阅仍可用，订阅用的是各 plan 的 dodo_product_id）。
	DodoPaymentsTopUpProductId string

	// DodoPaymentsNotifyUrl 自定义 webhook 回调地址，留空时用 {server}/api/dodopayments/webhook
	DodoPaymentsNotifyUrl string

	// DodoPaymentsReturnUrl 支付完成后跳转地址
	DodoPaymentsReturnUrl string

	// DodoPaymentsCancelUrl 用户取消支付时的跳转地址（暂未在 checkouts API 中作为独立字段，
	// 留作前端兜底；实际只有 return_url 一个字段，成功/取消都会回到该地址）。
	DodoPaymentsCancelUrl string

	// DodoPaymentsUnitPrice 一单位（美元）兑现的单价，默认 1.0（与 NowPayments 对齐）
	DodoPaymentsUnitPrice float64 = 1.0

	// DodoPaymentsMinTopUp 最小充值单位数量（USD）
	DodoPaymentsMinTopUp int = 1
)

// DodoPaymentsBaseURL 根据沙盒开关返回 Dodo API 基础地址
func DodoPaymentsBaseURL() string {
	if DodoPaymentsSandbox {
		return "https://test.dodopayments.com"
	}
	return "https://live.dodopayments.com"
}
