package controller

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting"
	"github.com/runcoor/aggre-api/setting/system_setting"

	"github.com/gin-gonic/gin"
	"github.com/thanhpk/randstr"
)

// SubscriptionDodoPaymentsPayRequest 订阅购买请求体
type SubscriptionDodoPaymentsPayRequest struct {
	PlanId int `json:"plan_id"`
}

// SubscriptionRequestDodoPaymentsPay POST /api/subscription/dodopayments/pay
//
// 用户在 /plans 选择套餐后调用，后端创建一张 Dodo Payments hosted subscription link，
// 订单号前缀 SUB-DODO- 让 webhook 路由到订阅完成逻辑（与 nowpayments 模式一致）。
func SubscriptionRequestDodoPaymentsPay(c *gin.Context) {
	if !dodoPaymentsEnabled() {
		common.ApiErrorMsg(c, "Dodo Payments 支付未启用")
		return
	}

	var req SubscriptionDodoPaymentsPayRequest
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
	if plan.DodoProductId == "" {
		common.ApiErrorMsg(c, "该套餐未配置 Dodo Payments 产品")
		return
	}

	userId := c.GetInt("id")
	user, err := model.GetUserById(userId, false)
	if err != nil || user == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}

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

	payMoney := plan.PriceAmount

	tradeNo := fmt.Sprintf("SUB-DODO-%d-%d-%d-%s",
		userId, plan.Id, time.Now().UnixMilli(), randstr.String(6))

	order := &model.SubscriptionOrder{
		UserId:        userId,
		PlanId:        plan.Id,
		Money:         payMoney,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodDodoPayments,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		log.Printf("Dodo Payments 订阅创建订单失败: %v", err)
		common.ApiErrorMsg(c, "创建订单失败")
		return
	}

	returnURL := system_setting.ServerAddress + "/console/topup?show_history=true"
	if setting.DodoPaymentsReturnUrl != "" {
		returnURL = setting.DodoPaymentsReturnUrl
	}

	paymentLink, subID, paymentID, err := createDodoSubscription(
		c.Request.Context(), tradeNo, plan.DodoProductId,
		user.Email, user.Username, returnURL,
	)
	if err != nil {
		log.Printf("Dodo Payments 订阅下单失败 - 订单: %s, err: %v", tradeNo, err)
		_ = model.ExpireSubscriptionOrder(tradeNo)
		common.ApiErrorMsg(c, "拉起支付失败")
		return
	}

	log.Printf("Dodo Payments 订阅订单创建成功 - 用户: %d, 套餐: %s, 订单: %s, 金额: %.2f USD, sub_id=%s payment_id=%s",
		userId, plan.Title, tradeNo, payMoney, subID, paymentID)

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link":         paymentLink,
			"trade_no":         tradeNo,
			"order_id":         tradeNo,
			"subscription_id":  subID,
			"payment_id":       paymentID,
		},
	})
}
