/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import {
  Banner,
  Modal,
  Button,
  Select,
} from '@douyinfe/semi-ui';
import { Crown, CalendarClock, Package, Coins } from 'lucide-react';
import { SiStripe } from 'react-icons/si';
import { IconCreditCard } from '@douyinfe/semi-icons';
import { getCurrencyConfig } from '../../../helpers/render';
import {
  formatSubscriptionDuration,
  formatSubscriptionResetPeriod,
} from '../../../helpers/subscriptionFormat';

const SubscriptionPurchaseModal = ({
  t,
  visible,
  onCancel,
  selectedPlan,
  paying,
  selectedEpayMethod,
  setSelectedEpayMethod,
  epayMethods = [],
  enableOnlineTopUp = false,
  enableStripeTopUp = false,
  enableCreemTopUp = false,
  enableNowPaymentsTopUp = false,
  purchaseLimitInfo = null,
  onPayStripe,
  onPayCreem,
  onPayEpay,
  onPayNowPayments,
}) => {
  const plan = selectedPlan?.plan;
  const { symbol, rate } = getCurrencyConfig();
  const price = plan ? Number(plan.price_amount || 0) : 0;
  const convertedPrice = price * rate;
  const displayPrice = convertedPrice.toFixed(
    Number.isInteger(convertedPrice) ? 0 : 2,
  );
  const originalPrice = plan ? Number(plan.original_price_amount || 0) : 0;
  const hasOriginalPrice = originalPrice > 0 && originalPrice !== price;
  const convertedOriginalPrice = originalPrice * rate;
  const displayOriginalPrice = convertedOriginalPrice.toFixed(
    Number.isInteger(convertedOriginalPrice) ? 0 : 2,
  );
  // 只有当管理员开启支付网关 AND 套餐配置了对应的支付ID时才显示
  const hasStripe = enableStripeTopUp && !!plan?.stripe_price_id;
  const hasCreem = enableCreemTopUp && !!plan?.creem_product_id;
  const hasEpay = enableOnlineTopUp && epayMethods.length > 0;
  // NowPayments 不需要套餐侧的额外配置 — 只要管理员开启网关就可用，直接按 plan.price_amount 报价
  const hasNowPayments = enableNowPaymentsTopUp;
  const hasAnyPayment = hasStripe || hasCreem || hasEpay || hasNowPayments;
  const purchaseLimit = Number(purchaseLimitInfo?.limit || 0);
  const purchaseCount = Number(purchaseLimitInfo?.count || 0);
  const purchaseLimitReached =
    purchaseLimit > 0 && purchaseCount >= purchaseLimit;

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span className='w-6 h-6 flex items-center justify-center' style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', color: 'var(--accent)' }}>
            <Crown size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('购买订阅套餐')}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      size='small'
      centered
    >
      {plan ? (
        <div className='space-y-4 pb-10'>
          {/* 套餐信息 */}
          <div
            className='rounded-[var(--radius-lg)] p-4'
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
                  {t('套餐名称')}
                </span>
                <span className='text-sm truncate max-w-[200px]' style={{ color: 'var(--text-primary)' }}>
                  {plan.title}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
                  {t('有效期')}
                </span>
                <div className='flex items-center'>
                  <CalendarClock size={14} className='mr-1' style={{ color: 'var(--text-muted)' }} />
                  <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                    {formatSubscriptionDuration(plan, t)}
                  </span>
                </div>
              </div>
              {formatSubscriptionResetPeriod(plan, t) !== t('不重置') && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
                    {t('重置周期')}
                  </span>
                  <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                    {formatSubscriptionResetPeriod(plan, t)}
                  </span>
                </div>
              )}
              {plan?.quota_description ? (
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
                    {t('总额度')}
                  </span>
                  <div className='flex items-center'>
                    <Package size={14} className='mr-1' style={{ color: 'var(--text-muted)' }} />
                    <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                      {plan.quota_description}
                    </span>
                  </div>
                </div>
              ) : null}
              {plan?.upgrade_group ? (
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
                    {t('升级分组')}
                  </span>
                  <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                    {plan.upgrade_group}
                  </span>
                </div>
              ) : null}
              <div className='my-2' style={{ borderTop: '1px solid var(--border-subtle)' }} />
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium' style={{ color: 'var(--text-secondary)' }}>
                  {t('应付金额')}
                </span>
                <div className='flex items-baseline gap-2'>
                  {hasOriginalPrice && (
                    <span
                      className='text-sm'
                      style={{
                        color: 'var(--text-muted)',
                        textDecoration: 'line-through',
                        fontFamily: 'var(--font-serif)',
                      }}
                    >
                      {symbol}{displayOriginalPrice}
                    </span>
                  )}
                  <span
                    className='text-xl font-bold'
                    style={{
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-serif)',
                    }}
                  >
                    {symbol}
                    {displayPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 支付方式 */}
          {purchaseLimitReached && (
            <Banner
              type='warning'
              description={`${t('已达到购买上限')} (${purchaseCount}/${purchaseLimit})`}
              style={{ borderRadius: 'var(--radius-lg)' }}
              closeIcon={null}
            />
          )}

          {hasAnyPayment ? (
            <div className='space-y-3'>
              <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                {t('选择支付方式')}
              </span>

              {/* Stripe / Creem */}
              {(hasStripe || hasCreem) && (
                <div className='flex gap-2'>
                  {hasStripe && (
                    <Button
                      theme='light'
                      className='flex-1'
                      icon={<SiStripe size={14} color='#635BFF' />}
                      onClick={onPayStripe}
                      loading={paying}
                      disabled={purchaseLimitReached}
                    >
                      Stripe
                    </Button>
                  )}
                  {hasCreem && (
                    <Button
                      theme='light'
                      className='flex-1'
                      icon={<IconCreditCard />}
                      onClick={onPayCreem}
                      loading={paying}
                      disabled={purchaseLimitReached}
                    >
                      Creem
                    </Button>
                  )}
                </div>
              )}

              {/* NowPayments — 加密货币支付 */}
              {hasNowPayments && (
                <div className='flex gap-2'>
                  <Button
                    theme='light'
                    className='flex-1'
                    icon={<Coins size={14} color='#26B2A8' />}
                    onClick={onPayNowPayments}
                    loading={paying}
                    disabled={purchaseLimitReached}
                  >
                    {t('USDT / 加密货币')}
                  </Button>
                </div>
              )}

              {/* 易支付 */}
              {hasEpay && (
                <div className='flex gap-2'>
                  <Select
                    value={selectedEpayMethod}
                    onChange={setSelectedEpayMethod}
                    style={{ flex: 1 }}
                    size='default'
                    placeholder={t('选择支付方式')}
                    optionList={epayMethods.map((m) => ({
                      value: m.type,
                      label: m.name || m.type,
                    }))}
                    disabled={purchaseLimitReached}
                  />
                  <Button
                    theme='solid'
                    type='primary'
                    onClick={onPayEpay}
                    loading={paying}
                    disabled={!selectedEpayMethod || purchaseLimitReached}
                  >
                    {t('支付')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Banner
              type='info'
              description={t('管理员未开启在线支付功能，请联系管理员配置。')}
              style={{ borderRadius: 'var(--radius-lg)' }}
              closeIcon={null}
            />
          )}
        </div>
      ) : null}
    </Modal>
  );
};

export default SubscriptionPurchaseModal;
