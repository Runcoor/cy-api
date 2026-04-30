package controller

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/service"
	"github.com/runcoor/aggre-api/setting"
	"github.com/runcoor/aggre-api/setting/system_setting"

	"github.com/gin-gonic/gin"
	"github.com/thanhpk/randstr"
)

// SubscriptionNowPaymentsPayRequest 订阅购买请求体
type SubscriptionNowPaymentsPayRequest struct {
	PlanId      int    `json:"plan_id"`
	PayCurrency string `json:"pay_currency,omitempty"`
}

// SubscriptionRequestNowPaymentsPay POST /api/subscription/nowpayments/pay
//
// 用户在 /plans 选定套餐后调用，后端创建一张 NowPayments 托管发票，
// 订单号前缀为 SUB-NP- 以便 webhook 时把回调路由到 SubscriptionOrder 流程。
//
// 同一份 API Key / IPN Secret 与钱包充值共用，无需重复配置。
func SubscriptionRequestNowPaymentsPay(c *gin.Context) {
	if !nowPaymentsEnabled() {
		common.ApiErrorMsg(c, "NowPayments 支付未启用")
		return
	}

	var req SubscriptionNowPaymentsPayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	plan, err := model.GetSubscriptionPlanById(req.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if !plan.Enabled {
		common.ApiErrorMsg(c, "套餐未启用")
		return
	}

	userId := c.GetInt("id")
	user, err := model.GetUserById(userId, false)
	if err != nil || user == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}

	// 复用与 Stripe / Creem 相同的购买上限逻辑
	if plan.MaxPurchasePerUser > 0 {
		count, err := model.CountUserSubscriptionsByPlan(userId, plan.Id)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		if count >= int64(plan.MaxPurchasePerUser) {
			common.ApiErrorMsg(c, "已达到该套餐购买上限")
			return
		}
	}

	// 套餐价格直接以 USD 报价（NowPayments 是加密货币网关，不需要按 Price/USDExchangeRate 换算）
	payMoney := plan.PriceAmount
	if payMoney < 1.0 {
		// NowPayments 最低发票金额一般 ~$1 USD
		common.ApiErrorMsg(c, "套餐金额过低，无法使用加密货币支付")
		return
	}

	// 订阅订单号前缀 SUB-NP-，回调按此前缀路由到订阅完成逻辑
	tradeNo := fmt.Sprintf("SUB-NP-%d-%d-%d-%s", userId, plan.Id, time.Now().UnixMilli(), randstr.String(6))

	order := &model.SubscriptionOrder{
		UserId:        userId,
		PlanId:        plan.Id,
		Money:         payMoney,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodNowPayments,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		log.Printf("NowPayments 订阅创建订单失败: %v", err)
		common.ApiErrorMsg(c, "创建订单失败")
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
	cancelURL := system_setting.ServerAddress + "/plans"
	if setting.NowPaymentsCancelUrl != "" {
		cancelURL = setting.NowPaymentsCancelUrl
	}
	payCurrency := setting.NowPaymentsPayCurrency
	if req.PayCurrency != "" {
		payCurrency = req.PayCurrency
	}

	desc := fmt.Sprintf("Subscription: %s ($%.2f)", plan.Title, payMoney)

	invoiceURL, invoiceID, err := createNowPaymentsInvoice(
		c.Request.Context(), tradeNo, payMoney, desc,
		successURL, cancelURL, notifyURL, payCurrency,
	)
	if err != nil {
		log.Printf("NowPayments 订阅下单失败 - 订单: %s, err: %v", tradeNo, err)
		_ = model.ExpireSubscriptionOrder(tradeNo)
		common.ApiErrorMsg(c, "拉起支付失败")
		return
	}

	log.Printf("NowPayments 订阅订单创建成功 - 用户: %d, 套餐: %s, 订单: %s, 金额: %.2f USD, invoice_id=%d",
		userId, plan.Title, tradeNo, payMoney, invoiceID)

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link":   invoiceURL,
			"trade_no":   tradeNo,
			"order_id":   tradeNo,
			"invoice_id": invoiceID,
		},
	})
}
