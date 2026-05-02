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

import React, { useMemo, useState } from 'react';
import { Button, Skeleton, Tooltip } from '@douyinfe/semi-ui';
import { API, showError, showSuccess, renderQuota } from '../../helpers';
import { getCurrencyConfig } from '../../helpers/render';
import { RefreshCw, Sparkles } from 'lucide-react';
import SubscriptionPurchaseModal from './modals/SubscriptionPurchaseModal';
import {
  formatSubscriptionDuration,
  formatSubscriptionResetPeriod,
} from '../../helpers/subscriptionFormat';

// 过滤易支付方式
function getEpayMethods(payMethods = []) {
  return (payMethods || []).filter(
    (m) => m?.type && m.type !== 'stripe' && m.type !== 'creem',
  );
}

// 提交易支付表单
function submitEpayForm({ url, params }) {
  const form = document.createElement('form');
  form.action = url;
  form.method = 'POST';
  const isSafari =
    navigator.userAgent.indexOf('Safari') > -1 &&
    navigator.userAgent.indexOf('Chrome') < 1;
  if (!isSafari) form.target = '_blank';
  Object.keys(params || {}).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

const SubscriptionPlansCard = ({
  t,
  loading = false,
  plans = [],
  payMethods = [],
  enableOnlineTopUp = false,
  enableStripeTopUp = false,
  enableCreemTopUp = false,
  billingPreference,
  onChangeBillingPreference,
  activeSubscriptions = [],
  allSubscriptions = [],
  reloadSubscriptionSelf,
  withCard = true,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paying, setPaying] = useState(false);
  const [selectedEpayMethod, setSelectedEpayMethod] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const epayMethods = useMemo(() => getEpayMethods(payMethods), [payMethods]);

  const openBuy = (p) => {
    setSelectedPlan(p);
    setSelectedEpayMethod(epayMethods?.[0]?.type || '');
    setOpen(true);
  };

  const closeBuy = () => {
    setOpen(false);
    setSelectedPlan(null);
    setPaying(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadSubscriptionSelf?.();
    } finally {
      setRefreshing(false);
    }
  };

  const payStripe = async () => {
    if (!selectedPlan?.plan?.stripe_price_id) {
      showError(t('该套餐未配置 Stripe'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/stripe/pay', {
        plan_id: selectedPlan.plan.id,
      });
      if (res.data?.message === 'success') {
        window.open(res.data.data?.pay_link, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuy();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string'
            ? res.data.data
            : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch (e) {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payCreem = async () => {
    if (!selectedPlan?.plan?.creem_product_id) {
      showError(t('该套餐未配置 Creem'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/creem/pay', {
        plan_id: selectedPlan.plan.id,
      });
      if (res.data?.message === 'success') {
        window.open(res.data.data?.checkout_url, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuy();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string'
            ? res.data.data
            : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch (e) {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payNowPayments = async () => {
    if (!selectedPlan?.plan?.id) return;
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/nowpayments/pay', {
        plan_id: selectedPlan.plan.id,
      });
      if (res.data?.message === 'success' && res.data.data?.pay_link) {
        window.open(res.data.data.pay_link, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuy();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string'
            ? res.data.data
            : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payDodoPayments = async () => {
    if (!selectedPlan?.plan?.id) return;
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/dodopayments/pay', {
        plan_id: selectedPlan.plan.id,
      });
      if (res.data?.message === 'success' && res.data.data?.pay_link) {
        window.open(res.data.data.pay_link, '_blank');
        showSuccess(t('已打开支付页面'));
        closeBuy();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string'
            ? res.data.data
            : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  const payEpay = async () => {
    if (!selectedEpayMethod) {
      showError(t('请选择支付方式'));
      return;
    }
    setPaying(true);
    try {
      const res = await API.post('/api/subscription/epay/pay', {
        plan_id: selectedPlan.plan.id,
        payment_method: selectedEpayMethod,
      });
      if (res.data?.message === 'success') {
        submitEpayForm({ url: res.data.url, params: res.data.data });
        showSuccess(t('已发起支付'));
        closeBuy();
      } else {
        const errorMsg =
          typeof res.data?.data === 'string'
            ? res.data.data
            : res.data?.message || t('支付失败');
        showError(errorMsg);
      }
    } catch (e) {
      showError(t('支付请求失败'));
    } finally {
      setPaying(false);
    }
  };

  // 当前订阅信息 - 支持多个订阅
  const hasActiveSubscription = activeSubscriptions.length > 0;
  const hasAnySubscription = allSubscriptions.length > 0;
  const disableSubscriptionPreference = !hasActiveSubscription;
  const isSubscriptionPreference =
    billingPreference === 'subscription_first' ||
    billingPreference === 'subscription_only';
  const displayBillingPreference =
    disableSubscriptionPreference && isSubscriptionPreference
      ? 'wallet_first'
      : billingPreference;
  const subscriptionPreferenceLabel =
    billingPreference === 'subscription_only' ? t('仅用订阅') : t('优先订阅');

  const planPurchaseCountMap = useMemo(() => {
    const map = new Map();
    (allSubscriptions || []).forEach((sub) => {
      const planId = sub?.subscription?.plan_id;
      if (!planId) return;
      map.set(planId, (map.get(planId) || 0) + 1);
    });
    return map;
  }, [allSubscriptions]);

  const planTitleMap = useMemo(() => {
    const map = new Map();
    (plans || []).forEach((p) => {
      const plan = p?.plan;
      if (!plan?.id) return;
      map.set(plan.id, plan.title ? t(plan.title) : '');
    });
    return map;
  }, [plans, t]);

  const getPlanPurchaseCount = (planId) =>
    planPurchaseCountMap.get(planId) || 0;

  // 计算单个订阅的剩余天数
  const getRemainingDays = (sub) => {
    if (!sub?.subscription?.end_time) return 0;
    const now = Date.now() / 1000;
    const remaining = sub.subscription.end_time - now;
    return Math.max(0, Math.ceil(remaining / 86400));
  };

  // 计算单个订阅的使用进度
  const getUsagePercent = (sub) => {
    const total = Number(sub?.subscription?.amount_total || 0);
    const used = Number(sub?.subscription?.amount_used || 0);
    if (total <= 0) return 0;
    return Math.round((used / total) * 100);
  };

  const cardContent = (
    <>
      {/* 卡片头部 */}
      {loading ? (
        <div className='space-y-4'>
          {/* 我的订阅骨架屏 */}
          <div
            className='rounded-[var(--radius-lg)] p-3'
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className='flex items-center justify-between mb-3'>
              <Skeleton.Title active style={{ width: 100, height: 20 }} />
              <Skeleton.Button active style={{ width: 24, height: 24 }} />
            </div>
            <div className='space-y-2'>
              <Skeleton.Paragraph active rows={2} />
            </div>
          </div>
          {/* 套餐列表骨架屏 */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 w-full px-1'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='rounded-[var(--radius-lg)] p-4'
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <Skeleton.Title
                  active
                  style={{ width: '60%', height: 24, marginBottom: 8 }}
                />
                <Skeleton.Paragraph
                  active
                  rows={1}
                  style={{ marginBottom: 12 }}
                />
                <div className='text-center py-4'>
                  <Skeleton.Title
                    active
                    style={{ width: '40%', height: 32, margin: '0 auto' }}
                  />
                </div>
                <Skeleton.Paragraph active rows={3} style={{ marginTop: 12 }} />
                <Skeleton.Button
                  active
                  block
                  style={{ marginTop: 16, height: 32 }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='space-y-6 w-full'>
          {/* ─── 我的订阅 — card-per-subscription ─── */}
          <div>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <h3
                  className='text-lg font-bold m-0'
                  style={{
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {t('我的订阅')}
                </h3>
                {hasActiveSubscription ? (
                  <span
                    className='inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1'
                    style={{
                      borderRadius: 9999,
                      background: 'rgba(52, 199, 89, 0.12)',
                      color: 'var(--success)',
                    }}
                  >
                    <span
                      className='w-1.5 h-1.5 rounded-full'
                      style={{ background: 'var(--success)' }}
                    />
                    {activeSubscriptions.length} {t('个生效中')}
                  </span>
                ) : (
                  <span
                    className='inline-flex items-center text-xs font-medium px-2.5 py-1'
                    style={{
                      borderRadius: 9999,
                      background: 'var(--surface-active)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {t('无生效')}
                  </span>
                )}
              </div>
              <Button
                size='small'
                theme='borderless'
                type='tertiary'
                icon={
                  <RefreshCw
                    size={13}
                    className={refreshing ? 'animate-spin' : ''}
                  />
                }
                onClick={handleRefresh}
                loading={refreshing}
                style={{ borderRadius: 'var(--radius-md)' }}
              />
            </div>

            {hasAnySubscription ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                {allSubscriptions.map((sub, subIndex) => {
                  const subscription = sub.subscription;
                  const totalAmount = Number(subscription?.amount_total || 0);
                  const usedAmount = Number(subscription?.amount_used || 0);
                  const remainAmount =
                    totalAmount > 0 ? Math.max(0, totalAmount - usedAmount) : 0;
                  const planTitle =
                    planTitleMap.get(subscription?.plan_id) || '';
                  const remainDays = getRemainingDays(sub);
                  const usagePercent = getUsagePercent(sub);
                  const now = Date.now() / 1000;
                  const isExpired = (subscription?.end_time || 0) < now;
                  const isCancelled = subscription?.status === 'cancelled';
                  const isActive =
                    subscription?.status === 'active' && !isExpired;

                  return (
                    <div
                      key={subscription?.id || subIndex}
                      className='rounded-[var(--radius-lg)] p-4'
                      style={{
                        background: 'var(--surface)',
                        border: isActive
                          ? '1px solid rgba(52, 199, 89, 0.3)'
                          : '1px solid var(--border-default)',
                        boxShadow: isActive
                          ? '0 4px 16px rgba(52, 199, 89, 0.06)'
                          : 'none',
                      }}
                    >
                      <div className='flex items-center justify-between gap-2 mb-3'>
                        <span
                          className='text-sm font-bold truncate'
                          style={{ color: 'var(--text-primary)', minWidth: 0 }}
                        >
                          {planTitle || `${t('订阅')} #${subscription?.id}`}
                        </span>
                        {isActive ? (
                          <span
                            className='inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap flex-shrink-0'
                            style={{
                              borderRadius: 9999,
                              background: 'rgba(52, 199, 89, 0.12)',
                              color: 'var(--success)',
                            }}
                          >
                            <span
                              className='w-1.5 h-1.5 rounded-full flex-shrink-0'
                              style={{ background: 'var(--success)' }}
                            />
                            {t('生效')}
                          </span>
                        ) : isCancelled ? (
                          <span
                            className='text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap flex-shrink-0'
                            style={{
                              borderRadius: 9999,
                              background: 'rgba(255, 59, 48, 0.1)',
                              color: 'var(--error)',
                            }}
                          >
                            {t('已作废')}
                          </span>
                        ) : (
                          <span
                            className='text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap flex-shrink-0'
                            style={{
                              borderRadius: 9999,
                              background: 'var(--surface-active)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {t('已过期')}
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {totalAmount > 0 && (
                        <div className='mb-3'>
                          <div className='flex justify-between text-[11px] mb-1.5'>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {renderQuota(usedAmount)} /{' '}
                              {renderQuota(totalAmount)}
                            </span>
                            <span
                              style={{
                                color: isActive
                                  ? 'var(--accent)'
                                  : 'var(--text-muted)',
                                fontWeight: 600,
                              }}
                            >
                              {usagePercent}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: 6,
                              borderRadius: 9999,
                              background: 'var(--surface-active)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(usagePercent, 100)}%`,
                                background: isActive
                                  ? 'var(--accent-gradient)'
                                  : 'var(--text-muted)',
                                borderRadius: 9999,
                                transition: 'width 0.6s ease',
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div
                        className='flex justify-between text-[11px]'
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span>
                          {isActive
                            ? `${t('剩余')} ${remainDays} ${t('天')}`
                            : isExpired
                              ? t('已过期')
                              : t('已作废')}
                        </span>
                        <span>
                          {new Date(
                            (subscription?.end_time || 0) * 1000,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className='text-sm py-6 text-center rounded-[var(--radius-lg)]'
                style={{
                  color: 'var(--text-muted)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {t('购买套餐后即可享受模型权益')}
              </div>
            )}
          </div>

          {/* ─── 可购买套餐 — design-spec cards ─── */}
          {plans.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 w-full items-center'>
              {plans.map((p, index) => {
                const plan = p?.plan;
                const { symbol, rate } = getCurrencyConfig();
                const price = Number(plan?.price_amount || 0);
                const convertedPrice = price * rate;
                const displayPrice = convertedPrice.toFixed(
                  Number.isInteger(convertedPrice) ? 0 : 2,
                );
                const originalPrice = Number(plan?.original_price_amount || 0);
                const hasOriginalPrice =
                  originalPrice > 0 && originalPrice !== price;
                const convertedOriginalPrice = originalPrice * rate;
                const displayOriginalPrice = convertedOriginalPrice.toFixed(
                  Number.isInteger(convertedOriginalPrice) ? 0 : 2,
                );
                const isPopular = index === 0 && plans.length > 1;
                const limit = Number(plan?.max_purchase_per_user || 0);
                const quotaDescription = plan?.quota_description || '';
                const planBenefits = [
                  `${t('有效期')}: ${formatSubscriptionDuration(plan, t)}`,
                  formatSubscriptionResetPeriod(plan, t) !== t('不重置')
                    ? `${t('额度重置')}: ${formatSubscriptionResetPeriod(plan, t)}`
                    : null,
                  quotaDescription
                    ? `${t('总额度')}: ${quotaDescription}`
                    : null,
                  limit > 0 ? `${t('限购')} ${limit}` : null,
                  plan?.upgrade_group
                    ? `${t('升级分组')}: ${plan.upgrade_group}`
                    : null,
                ].filter(Boolean);

                return (
                  <div
                    key={plan?.id}
                    className='w-full h-full rounded-[var(--radius-lg)] relative overflow-hidden flex flex-col'
                    style={{
                      background: 'var(--surface)',
                      border: isPopular
                        ? 'none'
                        : '1px solid var(--border-default)',
                      boxShadow: isPopular
                        ? '0 12px 32px rgba(0,114,255,0.12)'
                        : '0 4px 16px rgba(0,0,0,0.03)',
                      minHeight: isPopular ? 420 : 380,
                    }}
                  >
                    {/* Accent top bar for popular */}
                    {isPopular && (
                      <div
                        style={{
                          height: 3,
                          background: 'var(--accent-gradient)',
                        }}
                      />
                    )}
                    <div className='p-6 flex flex-col flex-1'>
                      {/* Plan label */}
                      <div className='mb-4'>
                        {isPopular ? (
                          <span
                            className='inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1'
                            style={{
                              borderRadius: 9999,
                              background: 'var(--accent-gradient)',
                              color: '#fff',
                            }}
                          >
                            <Sparkles size={10} />
                            {t('推荐')}
                          </span>
                        ) : (
                          <span
                            className='inline-flex text-xs font-bold uppercase tracking-wider px-2.5 py-1'
                            style={{
                              borderRadius: 9999,
                              background: 'var(--surface-active)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {plan?.title ? t(plan.title) : t('订阅套餐')}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className='mb-2'>
                        <div className='flex items-baseline gap-1'>
                          <span
                            style={{
                              fontSize: isPopular ? 36 : 28,
                              fontWeight: 800,
                              fontFamily: 'var(--font-serif)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {symbol}
                            {displayPrice}
                          </span>
                          <span
                            className='text-sm'
                            style={{ color: 'var(--text-muted)' }}
                          >
                            /{formatSubscriptionDuration(plan, t)}
                          </span>
                        </div>
                        {hasOriginalPrice && (
                          <span
                            className='text-sm'
                            style={{
                              color: 'var(--text-muted)',
                              textDecoration: 'line-through',
                            }}
                          >
                            {symbol}
                            {displayOriginalPrice}
                          </span>
                        )}
                      </div>
                      {plan?.subtitle && (
                        <p
                          className='text-sm mb-4'
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {t(plan.subtitle)}
                        </p>
                      )}
                      {isPopular && plan?.title && (
                        <p
                          className='text-sm font-bold mb-4'
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {t(plan.title)}
                        </p>
                      )}

                      {/* Benefits with check icons */}
                      <ul className='flex flex-col gap-2.5 mb-auto flex-grow'>
                        {planBenefits.map((label) => (
                          <li
                            key={label}
                            className='flex items-start gap-2.5 text-sm'
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <span
                              className='flex-shrink-0 mt-0.5'
                              style={{
                                color: isPopular
                                  ? 'var(--accent)'
                                  : 'var(--success)',
                              }}
                            >
                              <svg
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='currentColor'
                              >
                                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                              </svg>
                            </span>
                            <span style={{ fontWeight: isPopular ? 500 : 400 }}>
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA button */}
                      <div className='mt-6'>
                        {(() => {
                          const count = getPlanPurchaseCount(p?.plan?.id);
                          const reached = limit > 0 && count >= limit;
                          const btn = (
                            <Button
                              block
                              disabled={reached}
                              onClick={() => {
                                if (!reached) openBuy(p);
                              }}
                              theme={isPopular ? 'solid' : 'light'}
                              type='primary'
                              style={{
                                height: 44,
                                borderRadius: 'var(--radius-lg)',
                                fontWeight: 700,
                                ...(isPopular
                                  ? {
                                      background: 'var(--accent-gradient)',
                                      border: 'none',
                                      boxShadow:
                                        '0 4px 12px rgba(0,114,255,0.2)',
                                    }
                                  : {}),
                              }}
                            >
                              {reached ? t('已达上限') : t('立即订阅')}
                            </Button>
                          );
                          return reached ? (
                            <Tooltip
                              content={`${t('已达到购买上限')} (${count}/${limit})`}
                              position='top'
                            >
                              {btn}
                            </Tooltip>
                          ) : (
                            btn
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className='text-center text-sm py-4'
              style={{ color: 'var(--text-muted)' }}
            >
              {t('暂无可购买套餐')}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {withCard ? (
        <div
          className='rounded-[var(--radius-lg)] p-5'
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          {cardContent}
        </div>
      ) : (
        <div className='space-y-3'>{cardContent}</div>
      )}

      {/* 购买确认弹窗 */}
      <SubscriptionPurchaseModal
        t={t}
        visible={open}
        onCancel={closeBuy}
        selectedPlan={selectedPlan}
        paying={paying}
        selectedEpayMethod={selectedEpayMethod}
        setSelectedEpayMethod={setSelectedEpayMethod}
        epayMethods={epayMethods}
        enableOnlineTopUp={enableOnlineTopUp}
        enableStripeTopUp={enableStripeTopUp}
        enableCreemTopUp={enableCreemTopUp}
        purchaseLimitInfo={
          selectedPlan?.plan?.id
            ? {
                limit: Number(selectedPlan?.plan?.max_purchase_per_user || 0),
                count: getPlanPurchaseCount(selectedPlan?.plan?.id),
              }
            : null
        }
        onPayStripe={payStripe}
        onPayCreem={payCreem}
        onPayEpay={payEpay}
        onPayNowPayments={payNowPayments}
        onPayDodoPayments={payDodoPayments}
      />
    </>
  );
};

export default SubscriptionPlansCard;
