package setting

// NowPayments 加密货币支付配置
// 文档:
//   https://documenter.getpostman.com/view/7907941/2s93JusNJt
//   https://nowpayments.zendesk.com/hc/en-us/articles/21395546303389-IPN-and-how-to-setup
//
// 关键点：
//   - IPN 签名头: x-nowpayments-sig
//   - 签名算法: HMAC-SHA512(JSON.stringify(sortKeysRecursive(body)), IPN_SECRET).hex()
//   - 推荐 webhook 格式选 “All strings” 以避免数字精度差异
var (
	// NowPaymentsEnabled 是否启用 NowPayments 支付
	NowPaymentsEnabled bool

	// NowPaymentsApiKey API Key（NowPayments 后台 → Store Settings → API Keys）
	NowPaymentsApiKey string

	// NowPaymentsIpnSecret IPN Secret Key，用于回调签名校验
	NowPaymentsIpnSecret string

	// NowPaymentsSandbox 是否使用沙盒环境（api-sandbox.nowpayments.io）
	NowPaymentsSandbox bool

	// NowPaymentsPayCurrency 默认收款币种，留空则用户在托管页面自选
	// 常用值: usdttrc20 / usdterc20 / usdcerc20 / btc / eth
	NowPaymentsPayCurrency string

	// NowPaymentsOrderCurrency 报价币种，默认 USD
	NowPaymentsOrderCurrency string = "USD"

	// NowPaymentsNotifyUrl 自定义 IPN 回调地址
	// 为空时自动拼接 {server_address}/api/nowpayments/webhook
	NowPaymentsNotifyUrl string

	// NowPaymentsReturnUrl 支付完成后跳转地址
	NowPaymentsReturnUrl string

	// NowPaymentsCancelUrl 用户取消支付时的跳转地址
	NowPaymentsCancelUrl string

	// NowPaymentsUnitPrice 1 单位（美元）报价，默认 1.0
	NowPaymentsUnitPrice float64 = 1.0

	// NowPaymentsMinTopUp 最小充值单位数量
	NowPaymentsMinTopUp int = 1
)
