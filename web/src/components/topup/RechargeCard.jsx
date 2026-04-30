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

import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Banner,
  Skeleton,
  Form,
  Row,
  Col,
  Tooltip,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import { SiAlipay, SiWechat, SiStripe } from 'react-icons/si';
import {
  CreditCard,
  Coins,
  Wallet,
  Sparkles,
  AlertCircle,
  TicketCheck,
} from 'lucide-react';
import { useMinimumLoadingTime } from '../../hooks/common/useMinimumLoadingTime';
import { getCurrencyConfig } from '../../helpers/render';
import SubscriptionPlansCard from './SubscriptionPlansCard';
import MacSpinner from '../common/ui/MacSpinner';

const RechargeCard = ({
  t,
  enableOnlineTopUp,
  enableStripeTopUp,
  enableCreemTopUp,
  enableNowPaymentsTopUp,
  creemProducts,
  creemPreTopUp,
  presetAmounts,
  selectedPreset,
  selectPresetAmount,
  formatLargeNumber,
  priceRatio,
  topUpCount,
  minTopUp,
  renderQuotaWithAmount,
  getAmount,
  setTopUpCount,
  setSelectedPreset,
  renderAmount,
  amountLoading,
  payMethods,
  preTopUp,
  paymentLoading,
  payWay,
  redemptionCode,
  setRedemptionCode,
  topUp,
  isSubmitting,
  topUpLink,
  openTopUpLink,
  userState,
  renderQuota,
  statusLoading,
  topupInfo,
  onOpenHistory,
  enableWaffoTopUp,
  waffoTopUp,
  waffoPayMethods,
  subscriptionLoading = false,
  subscriptionPlans = [],
  billingPreference,
  onChangeBillingPreference,
  activeSubscriptions = [],
  allSubscriptions = [],
  reloadSubscriptionSelf,
}) => {
  const onlineFormApiRef = useRef(null);
  const redeemFormApiRef = useRef(null);
  const initialTabSetRef = useRef(false);
  const showAmountSkeleton = useMinimumLoadingTime(amountLoading);
  const [activeTab, setActiveTab] = useState('topup');
  const shouldShowSubscription =
    !subscriptionLoading && subscriptionPlans.length > 0;

  useEffect(() => {
    if (initialTabSetRef.current) return;
    if (subscriptionLoading) return;
    setActiveTab(shouldShowSubscription ? 'subscription' : 'topup');
    initialTabSetRef.current = true;
  }, [shouldShowSubscription, subscriptionLoading]);

  useEffect(() => {
    if (!shouldShowSubscription && activeTab !== 'topup') {
      setActiveTab('topup');
    }
  }, [shouldShowSubscription, activeTab]);

  const hasOnlinePay = enableOnlineTopUp || enableStripeTopUp || enableCreemTopUp || enableWaffoTopUp;

  const topupContent = (
    <div className='space-y-6'>
      {/* 在线充值表单 */}
      {statusLoading ? (
        <div className='py-8 flex justify-center'>
          <MacSpinner size='large' />
        </div>
      ) : hasOnlinePay ? (
        <Form
          getFormApi={(api) => (onlineFormApiRef.current = api)}
          initValues={{ topUpCount: topUpCount }}
        >
          <div className='space-y-5'>
            {(enableOnlineTopUp || enableStripeTopUp || enableWaffoTopUp) && (
              <Row gutter={12}>
                <Col xs={24} sm={24} md={24} lg={10} xl={10}>
                  <Form.InputNumber
                    field='topUpCount'
                    label={t('充值数量')}
                    disabled={!enableOnlineTopUp && !enableStripeTopUp && !enableWaffoTopUp}
                    placeholder={
                      t('充值数量，最低 ') + renderQuotaWithAmount(minTopUp)
                    }
                    value={topUpCount}
                    min={minTopUp}
                    max={999999999}
                    step={1}
                    precision={0}
                    onChange={async (value) => {
                      if (value && value >= 1) {
                        setTopUpCount(value);
                        setSelectedPreset(null);
                        await getAmount(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      if (!value || value < 1) {
                        setTopUpCount(1);
                        getAmount(1);
                      }
                    }}
                    formatter={(value) => (value ? `${value}` : '')}
                    parser={(value) =>
                      value ? parseInt(value.replace(/[^\d]/g, '')) : 0
                    }
                    extraText={
                      <Skeleton
                        loading={showAmountSkeleton}
                        active
                        placeholder={
                          <Skeleton.Title
                            style={{
                              width: 120,
                              height: 20,
                              borderRadius: 6,
                            }}
                          />
                        }
                      >
                        <span className='text-xs font-medium' style={{ color: 'var(--error)' }}>
                          {t('实付金额：')}
                          <span style={{ color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>
                            {renderAmount()}
                          </span>
                        </span>
                      </Skeleton>
                    }
                    style={{ width: '100%' }}
                  />
                </Col>
                {payMethods && payMethods.filter(m => m.type !== 'waffo').length > 0 && (
                <Col xs={24} sm={24} md={24} lg={14} xl={14}>
                  <Form.Slot label={t('选择支付方式')}>
                      <div className='flex flex-wrap gap-2'>
                        {payMethods.filter(m => m.type !== 'waffo').map((payMethod) => {
                          const minTopupVal = Number(payMethod.min_topup) || 0;
                          const isStripe = payMethod.type === 'stripe';
                          const disabled =
                            (!enableOnlineTopUp && !isStripe) ||
                            (!enableStripeTopUp && isStripe) ||
                            minTopupVal > Number(topUpCount || 0);

                          const buttonEl = (
                            <Button
                              key={payMethod.type}
                              theme='outline'
                              type='tertiary'
                              onClick={() => preTopUp(payMethod.type)}
                              disabled={disabled}
                              loading={
                                paymentLoading && payWay === payMethod.type
                              }
                              icon={
                                payMethod.type === 'alipay' ? (
                                  <SiAlipay size={18} color='#1677FF' />
                                ) : payMethod.type === 'wxpay' ? (
                                  <SiWechat size={18} color='#07C160' />
                                ) : payMethod.type === 'stripe' ? (
                                  <SiStripe size={18} color='#635BFF' />
                                ) : (
                                  <CreditCard
                                    size={18}
                                    style={{ color: 'var(--text-muted)' }}
                                  />
                                )
                              }
                              className='!rounded-[var(--radius-md)] !px-4 !py-2'
                            >
                              {payMethod.name}
                            </Button>
                          );

                          return disabled &&
                            minTopupVal > Number(topUpCount || 0) ? (
                            <Tooltip
                              content={
                                t('此支付方式最低充值金额为') +
                                ' ' +
                                minTopupVal
                              }
                              key={payMethod.type}
                            >
                              {buttonEl}
                            </Tooltip>
                          ) : (
                            <React.Fragment key={payMethod.type}>
                              {buttonEl}
                            </React.Fragment>
                          );
                        })}
                      </div>
                  </Form.Slot>
                </Col>
                )}
              </Row>
            )}

            {(enableOnlineTopUp || enableStripeTopUp || enableWaffoTopUp) && (
              <Form.Slot
                label={
                  <div className='flex items-center gap-2'>
                    <span>{t('选择充值额度')}</span>
                    {(() => {
                      const { symbol, rate, type } = getCurrencyConfig();
                      if (type === 'USD') return null;

                      return (
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                            fontWeight: 'normal',
                          }}
                        >
                          (1 $ = {rate.toFixed(2)} {symbol})
                        </span>
                      );
                    })()}
                  </div>
                }
              >
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
                  {presetAmounts.map((preset, index) => {
                    const discount =
                      preset.discount || topupInfo?.discount?.[preset.value] || 1.0;
                    const originalPrice = preset.value * priceRatio;
                    const discountedPrice = originalPrice * discount;
                    const hasDiscount = discount < 1.0;
                    const actualPay = discountedPrice;
                    const save = originalPrice - discountedPrice;
                    const isSelected = selectedPreset === preset.value;

                    const { symbol, rate, type } = getCurrencyConfig();
                    const statusStr = localStorage.getItem('status');
                    let usdRate = 7;
                    try {
                      if (statusStr) {
                        const s = JSON.parse(statusStr);
                        usdRate = s?.usd_exchange_rate || 7;
                      }
                    } catch (e) { }

                    let displayValue = preset.value;
                    let displayActualPay = actualPay;
                    let displaySave = save;

                    if (type === 'USD') {
                      displayActualPay = actualPay / usdRate;
                      displaySave = save / usdRate;
                    } else if (type === 'CNY') {
                      displayValue = preset.value * usdRate;
                    } else if (type === 'CUSTOM') {
                      displayValue = preset.value * rate;
                      displayActualPay = (actualPay / usdRate) * rate;
                      displaySave = (save / usdRate) * rate;
                    }

                    return (
                      <div
                        key={index}
                        className='cursor-pointer transition-all duration-150'
                        style={{
                          borderRadius: 'var(--radius-md)',
                          border: isSelected
                            ? '1.5px solid var(--accent)'
                            : '1px solid var(--border-default)',
                          background: isSelected
                            ? 'var(--accent-light)'
                            : 'var(--surface)',
                          padding: '12px',
                        }}
                        onClick={() => {
                          selectPresetAmount(preset);
                          onlineFormApiRef.current?.setValue(
                            'topUpCount',
                            preset.value,
                          );
                        }}
                      >
                        <div className='text-center'>
                          <div className='flex items-center justify-center gap-1 mb-1'>
                            <Coins size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }} />
                            <span
                              className='text-sm font-semibold'
                              style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}
                            >
                              {formatLargeNumber(displayValue)} {symbol}
                            </span>
                            {hasDiscount && (
                              <span
                                style={{
                                  marginLeft: 2,
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(52, 199, 89, 0.15)',
                                  color: 'var(--success)',
                                  border: 'none',
                                  fontSize: '10px',
                                  padding: '1px 5px',
                                  lineHeight: '16px',
                                  fontWeight: 600,
                                }}
                              >
                                {t('折').includes('off')
                                  ? ((1 - parseFloat(discount)) * 100).toFixed(1)
                                  : (discount * 10).toFixed(1)}
                                {t('折')}
                              </span>
                            )}
                          </div>
                          <div
                            className='text-xs'
                            style={{
                              color: 'var(--text-muted)',
                            }}
                          >
                            {t('实付')} {symbol}
                            {displayActualPay.toFixed(2)}
                            {hasDiscount
                              ? ` ${t('节省')} ${symbol}${displaySave.toFixed(2)}`
                              : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Form.Slot>
            )}

            {/* Waffo */}
            {enableWaffoTopUp &&
              waffoPayMethods &&
              waffoPayMethods.length > 0 && (
                <Form.Slot label={t('Waffo 充值')}>
                  <div className='flex flex-wrap gap-2'>
                    {waffoPayMethods.map((method, index) => (
                      <Button
                        key={index}
                        theme='outline'
                        type='tertiary'
                        onClick={() => waffoTopUp(index)}
                        loading={paymentLoading}
                        icon={
                          method.icon ? (
                            <img
                              src={method.icon}
                              alt={method.name}
                              style={{
                                width: 36,
                                height: 36,
                                objectFit: 'contain',
                              }}
                            />
                          ) : (
                            <CreditCard
                              size={18}
                              style={{ color: 'var(--text-muted)' }}
                            />
                          )
                        }
                        className='!rounded-[var(--radius-md)] !px-4 !py-2'
                      >
                        {method.name}
                      </Button>
                    ))}
                  </div>
                </Form.Slot>
              )}

            {/* Creem */}
            {enableCreemTopUp && creemProducts.length > 0 && (
              <Form.Slot label={t('Creem 充值')}>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                  {creemProducts.map((product, index) => (
                    <div
                      key={index}
                      onClick={() => creemPreTopUp(product)}
                      className='cursor-pointer transition-all duration-150'
                      style={{
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-default)',
                        background: 'var(--surface)',
                        padding: '16px',
                        textAlign: 'center',
                      }}
                    >
                      <div className='font-medium text-base mb-2' style={{ color: 'var(--text-primary)' }}>
                        {product.name}
                      </div>
                      <div className='text-sm mb-2' style={{ color: 'var(--text-secondary)' }}>
                        {t('充值额度')}: {product.quota}
                      </div>
                      <div
                        className='text-lg font-semibold'
                        style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
                      >
                        {product.currency === 'EUR' ? '\u20AC' : '$'}
                        {product.price}
                      </div>
                    </div>
                  ))}
                </div>
              </Form.Slot>
            )}
          </div>
        </Form>
      ) : (
        <div
          className='flex items-center gap-3 px-5 py-4'
          style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-light)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
            {t('管理员未开启在线充值功能，请联系管理员开启或使用兑换码充值。')}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* 状态横幅 — 在线充值提示 */}
      {hasOnlinePay && !statusLoading && (
        <div
          className='flex items-center justify-between gap-4 px-5 py-4'
          style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-light)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          <div className='flex items-center gap-3'>
            <span
              className='flex items-center justify-center flex-shrink-0'
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(var(--accent-rgb, 0,114,255), 0.1)' }}
            >
              <AlertCircle size={16} style={{ color: 'var(--accent)' }} />
            </span>
            <div>
              <h4 className='text-sm font-bold leading-tight' style={{ color: 'var(--text-primary)' }}>{t('wallet.rechargeStatus')}</h4>
              <p className='text-xs mt-0.5' style={{ color: 'var(--accent)' }}>{t('wallet.rechargeStatusDesc')}</p>
            </div>
          </div>
          <Button
            theme='borderless'
            type='primary'
            size='small'
            onClick={onOpenHistory}
            className='!text-sm !font-bold flex-shrink-0'
          >
            {t('wallet.viewLogs')}
          </Button>
        </div>
      )}

      {/* 兑换码区域 — 全宽行 */}
      <section className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-center'>
        <div className='lg:col-span-4'>
          <h2 className='text-xl sm:text-2xl font-extrabold tracking-tight' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{t('wallet.redemptionCenter')}</h2>
          <p className='text-sm mt-1' style={{ color: 'var(--text-secondary)' }}>
            {t('wallet.redemptionDesc')}
            {topUpLink && (
              <>
                {' '}
                <a
                  className='cursor-pointer'
                  style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                  onClick={openTopUpLink}
                >
                  {t('购买兑换码')}
                </a>
              </>
            )}
          </p>
        </div>
        <div className='lg:col-span-8'>
          <div
            className='flex items-center transition-all'
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '4px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            }}
          >
            <div className='pl-4 flex-shrink-0' style={{ color: 'var(--text-muted)' }}>
              <TicketCheck size={18} />
            </div>
            <input
              type='text'
              className='flex-grow bg-transparent border-none focus:outline-none px-3 py-3 text-sm font-medium'
              style={{ color: 'var(--text-primary)' }}
              placeholder={t('请输入兑换码')}
              value={redemptionCode}
              onChange={(e) => setRedemptionCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && topUp()}
            />
            <Button
              type='primary'
              theme='solid'
              onClick={topUp}
              loading={isSubmitting}
              className='!px-6 !py-3 flex-shrink-0'
              style={{
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
              }}
            >
              {t('兑换额度')}
            </Button>
          </div>
        </div>
      </section>

      {/* 充值/订阅内容 */}
      {shouldShowSubscription ? (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div className='px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3'>
            <span
              className='flex items-center justify-center'
              style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--accent-light)' }}
            >
              <CreditCard size={16} style={{ color: 'var(--accent)' }} />
            </span>
            <h3 className='text-base font-semibold' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
              {t('账户充值')}
            </h3>
          </div>
          <div className='p-5'>
            <Tabs type='card' activeKey={activeTab} onChange={setActiveTab}>
              <TabPane
                tab={
                  <div className='flex items-center gap-2'>
                    <Sparkles size={14} />
                    {t('订阅套餐')}
                  </div>
                }
                itemKey='subscription'
              >
                <div className='py-2'>
                  <SubscriptionPlansCard
                    t={t}
                    loading={subscriptionLoading}
                    plans={subscriptionPlans}
                    payMethods={payMethods}
                    enableOnlineTopUp={enableOnlineTopUp}
                    enableStripeTopUp={enableStripeTopUp}
                    enableCreemTopUp={enableCreemTopUp}
                    enableNowPaymentsTopUp={enableNowPaymentsTopUp}
                    billingPreference={billingPreference}
                    onChangeBillingPreference={onChangeBillingPreference}
                    activeSubscriptions={activeSubscriptions}
                    allSubscriptions={allSubscriptions}
                    reloadSubscriptionSelf={reloadSubscriptionSelf}
                    withCard={false}
                  />
                </div>
              </TabPane>
              <TabPane
                tab={
                  <div className='flex items-center gap-2'>
                    <Wallet size={14} />
                    {t('额度充值')}
                  </div>
                }
                itemKey='topup'
              >
                <div className='py-2'>{topupContent}</div>
              </TabPane>
            </Tabs>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div className='px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3'>
            <span
              className='flex items-center justify-center'
              style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--accent-light)' }}
            >
              <CreditCard size={16} style={{ color: 'var(--accent)' }} />
            </span>
            <div>
              <h3 className='text-base font-semibold leading-tight' style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                {t('账户充值')}
              </h3>
              <p className='text-xs mt-0.5' style={{ color: 'var(--text-muted)' }}>
                {t('多种充值方式，安全便捷')}
              </p>
            </div>
          </div>
          <div className='p-5'>
            {topupContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default RechargeCard;
