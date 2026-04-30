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

import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  API,
  showError,
  showInfo,
  showSuccess,
  renderQuota,
  renderQuotaWithAmount,
  getQuotaPerUnit,
} from '../../helpers';
import { Modal, Toast, Skeleton, InputNumber, Input, Button, Banner, Tooltip } from '@douyinfe/semi-ui';
import { IconTick } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { SiAlipay, SiWechat, SiStripe } from 'react-icons/si';
import {
  CreditCard,
  TicketCheck,
  Minus,
  Plus,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import SubscriptionPlansCard from '../../components/topup/SubscriptionPlansCard';
import PaymentConfirmModal from '../../components/topup/modals/PaymentConfirmModal';

/* ─── Scoped styles ─── */
const STYLES = `
@keyframes rc-fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.rc-animate { animation: rc-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both; }

.rc-preset-card {
  position: relative;
  text-align: left;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
  overflow: hidden;
  outline: none;
}
.rc-preset-card:hover {
  border-color: var(--accent);
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  transform: translateY(-2px);
}
.rc-preset-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light), 0 8px 24px rgba(0,0,0,0.04);
}
.rc-preset-card.selected::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent-gradient);
  opacity: 0.04;
}

.rc-pay-method {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  width: 100%;
}
.rc-pay-method:hover { border-color: var(--accent); }
.rc-pay-method.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.rc-tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 9999px;
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
  border: none;
  outline: none;
  position: relative;
  z-index: 1;
}
.rc-tab.active {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0,114,255,0.2);
}
.rc-tab:not(.active) {
  background: transparent;
  color: var(--text-secondary);
}
.rc-tab:not(.active):hover { color: var(--text-primary); }

/* Hide Semi InputNumber native stepper buttons */
.rc-custom-amount .semi-input-number-suffix { display: none !important; }
.rc-custom-amount input[type=number]::-webkit-inner-spin-button,
.rc-custom-amount input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.rc-custom-amount input[type=number] { -moz-appearance: textfield; }

.rc-summary {
  border-radius: var(--radius-lg);
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(20px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.04);
}
`;

/* ─── Epay form submit ─── */
function submitEpayForm({ url, params }) {
  const form = document.createElement('form');
  form.action = url;
  form.method = 'POST';
  const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') < 1;
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

const RechargePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);

  const [activeTab, setActiveTab] = useState('subscription');

  /* ─── Topup state (mirrored from topup/index.jsx) ─── */
  const [topupLoading, setTopupLoading] = useState(true);
  const [topupInfo, setTopupInfo] = useState({ amount_options: [], discount: {} });
  const [payMethods, setPayMethods] = useState([]);
  const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(false);
  const [enableStripeTopUp, setEnableStripeTopUp] = useState(false);
  const [enableCreemTopUp, setEnableCreemTopUp] = useState(false);
  const [creemProducts, setCreemProducts] = useState([]);
  const [enableWaffoTopUp, setEnableWaffoTopUp] = useState(false);
  const [waffoPayMethods, setWaffoPayMethods] = useState([]);
  const [waffoMinTopUp, setWaffoMinTopUp] = useState(1);
  const [enableCryptomusTopUp, setEnableCryptomusTopUp] = useState(false);
  const [cryptomusMinTopUp, setCryptomusMinTopUp] = useState(1);
  const [enableNowPaymentsTopUp, setEnableNowPaymentsTopUp] = useState(false);
  const [nowpaymentsMinTopUp, setNowpaymentsMinTopUp] = useState(1);
  const [priceRatio, setPriceRatio] = useState(statusState?.status?.price || 1);
  const [minTopUp, setMinTopUp] = useState(1);
  const [topUpCount, setTopUpCount] = useState(1);
  const [presetAmounts, setPresetAmounts] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('');
  const [amount, setAmount] = useState(0);
  const [amountLoading, setAmountLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payWay, setPayWay] = useState('');
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topUpLink, setTopUpLink] = useState('');
  const [statusLoading, setStatusLoading] = useState(true);

  /* ─── Subscription state ─── */
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [billingPreference, setBillingPreference] = useState('subscription_first');
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);

  /* ─── Creem modal ─── */
  const [creemOpen, setCreemOpen] = useState(false);
  const [selectedCreemProduct, setSelectedCreemProduct] = useState(null);

  /* ─── Data loading ─── */
  useEffect(() => {
    getTopupInfo();
    getSubscriptionPlans();
    getSubscriptionSelf();
    getUserQuota();
  }, []);

  useEffect(() => {
    if (statusState?.status) {
      setPriceRatio(statusState.status.price || 1);
      setTopUpLink(statusState.status.top_up_link || '');
      setStatusLoading(false);
    }
  }, [statusState?.status]);

  // Auto-select tab based on subscription availability
  useEffect(() => {
    if (!subscriptionLoading && subscriptionPlans.length === 0) {
      setActiveTab('topup');
    }
  }, [subscriptionLoading, subscriptionPlans]);

  const getUserQuota = async () => {
    try {
      const res = await API.get('/api/user/self');
      if (res.data?.success) userDispatch({ type: 'login', payload: res.data.data });
    } catch {}
  };

  const getSubscriptionPlans = async () => {
    setSubscriptionLoading(true);
    try {
      const res = await API.get('/api/subscription/plans');
      if (res.data?.success) setSubscriptionPlans(res.data.data || []);
    } catch {} finally { setSubscriptionLoading(false); }
  };

  const getSubscriptionSelf = async () => {
    try {
      const res = await API.get('/api/subscription/self');
      if (res.data?.success) {
        setBillingPreference(res.data.data?.billing_preference || 'subscription_first');
        setActiveSubscriptions(res.data.data?.subscriptions || []);
        setAllSubscriptions(res.data.data?.all_subscriptions || []);
      }
    } catch {}
  };

  const updateBillingPreference = async (pref) => {
    const prev = billingPreference;
    setBillingPreference(pref);
    try {
      const res = await API.put('/api/subscription/self/preference', { billing_preference: pref });
      if (res.data?.success) {
        showSuccess(t('更新成功'));
        setBillingPreference(res.data.data?.billing_preference || pref);
      } else { showError(res.data?.message || t('更新失败')); setBillingPreference(prev); }
    } catch { showError(t('请求失败')); setBillingPreference(prev); }
  };

  const getTopupInfo = async () => {
    setTopupLoading(true);
    try {
      const res = await API.get('/api/user/topup/info');
      const { success, data } = res.data;
      if (success && data) {
        setTopupInfo({ amount_options: data.amount_options || [], discount: data.discount || {} });
        let methods = data.pay_methods || [];
        if (typeof methods === 'string') methods = JSON.parse(methods);
        methods = (methods || []).filter((m) => m.name && m.type).map((m) => {
          m.min_topup = Number(m.min_topup) || 0;
          if (m.type === 'stripe' && !m.min_topup) m.min_topup = Number(data.stripe_min_topup) || 0;
          return m;
        });
        setPayMethods(methods);
        setEnableOnlineTopUp(!!data.enable_online_topup);
        setEnableStripeTopUp(!!data.enable_stripe_topup);
        setEnableCreemTopUp(!!data.enable_creem_topup);
        setEnableWaffoTopUp(!!data.enable_waffo_topup);
        setWaffoPayMethods(data.waffo_pay_methods || []);
        setWaffoMinTopUp(data.waffo_min_topup || 1);
        setEnableCryptomusTopUp(!!data.enable_cryptomus_topup);
        setCryptomusMinTopUp(data.cryptomus_min_topup || 1);
        setEnableNowPaymentsTopUp(!!data.enable_nowpayments_topup);
        setNowpaymentsMinTopUp(data.nowpayments_min_topup || 1);
        const min = data.enable_online_topup ? data.min_topup : data.enable_stripe_topup ? data.stripe_min_topup : data.enable_waffo_topup ? data.waffo_min_topup : 1;
        setMinTopUp(min);
        setTopUpCount(min);
        try { setCreemProducts(JSON.parse(data.creem_products || '[]')); } catch { setCreemProducts([]); }
        // Presets
        const opts = data.amount_options || [];
        const disc = data.discount || {};
        if (opts.length > 0) {
          setPresetAmounts(opts.map((v) => ({ value: v, discount: disc[v] || 1.0 })));
        } else {
          setPresetAmounts([1, 5, 10, 30, 50, 100].map((m) => ({ value: min * m, discount: disc[min * m] || 1.0 })));
        }
        getAmountFn(min);
      }
    } catch {} finally { setTopupLoading(false); }
  };

  /* ─── Amount calculation ─── */
  const getAmountFn = async (value) => {
    if (value === undefined) value = topUpCount;
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/amount', { amount: parseFloat(value) });
      if (res.data?.message === 'success') setAmount(parseFloat(res.data.data));
      else setAmount(0);
    } catch {} finally { setAmountLoading(false); }
  };

  const getStripeAmountFn = async (value) => {
    if (value === undefined) value = topUpCount;
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/stripe/amount', { amount: parseFloat(value) });
      if (res.data?.message === 'success') setAmount(parseFloat(res.data.data));
      else setAmount(0);
    } catch {} finally { setAmountLoading(false); }
  };

  const renderAmount = () => amount + ' ' + t('元');

  /* ─── Payment handlers ─── */
  const preTopUp = async (payment) => {
    setPayWay(payment);
    setPaymentLoading(true);
    try {
      if (payment === 'stripe') await getStripeAmountFn();
      else await getAmountFn();
      if (topUpCount < minTopUp) { showError(t('充值数量不能小于') + minTopUp); return; }
      setOpen(true);
    } catch { showError(t('获取金额失败')); }
    finally { setPaymentLoading(false); }
  };

  const onlineTopUp = async () => {
    if (topUpCount < minTopUp) { showError(t('充值数量不能小于') + minTopUp); return; }
    setConfirmLoading(true);
    try {
      let res;
      if (payWay === 'stripe') {
        res = await API.post('/api/user/stripe/pay', { amount: parseInt(topUpCount), payment_method: 'stripe' });
      } else {
        res = await API.post('/api/user/pay', { amount: parseInt(topUpCount), payment_method: payWay });
      }
      if (res?.data?.message === 'success') {
        if (payWay === 'stripe') { window.open(res.data.data.pay_link, '_blank'); }
        else { submitEpayForm({ url: res.data.url, params: res.data.data }); }
      } else { showError(res?.data?.data || res?.data?.message || t('支付失败')); }
    } catch { showError(t('支付请求失败')); }
    finally { setOpen(false); setConfirmLoading(false); }
  };

  const topUp = async () => {
    if (!redemptionCode) { showInfo(t('请输入兑换码！')); return; }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', { key: redemptionCode });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('兑换成功！'));
        Modal.success({ title: t('兑换成功！'), content: t('成功兑换额度：') + renderQuota(data), centered: true });
        if (userState.user) userDispatch({ type: 'login', payload: { ...userState.user, quota: userState.user.quota + data } });
        setRedemptionCode('');
      } else showError(message);
    } catch { showError(t('请求失败')); }
    finally { setIsSubmitting(false); }
  };

  const cryptomusTopUp = async () => {
    const min = Math.max(cryptomusMinTopUp || 1, minTopUp || 1);
    if (topUpCount < min) {
      showError(t('充值数量不能小于') + min);
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await API.post('/api/user/cryptomus/pay', {
        amount: parseInt(topUpCount),
      });
      if (res.data?.message === 'success' && res.data.data?.pay_link) {
        window.open(res.data.data.pay_link, '_blank');
      } else {
        showError(res.data?.data || res.data?.message || t('支付请求失败'));
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const nowpaymentsTopUp = async () => {
    const min = Math.max(nowpaymentsMinTopUp || 1, minTopUp || 1);
    if (topUpCount < min) {
      showError(t('充值数量不能小于') + min);
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await API.post('/api/user/nowpayments/pay', {
        amount: parseInt(topUpCount),
      });
      if (res.data?.message === 'success' && res.data.data?.pay_link) {
        window.open(res.data.data.pay_link, '_blank');
      } else {
        showError(res.data?.data || res.data?.message || t('支付请求失败'));
      }
    } catch {
      showError(t('支付请求失败'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const waffoTopUp = async (idx) => {
    if (topUpCount < waffoMinTopUp) { showError(t('充值数量不能小于') + waffoMinTopUp); return; }
    setPaymentLoading(true);
    try {
      const body = { amount: parseInt(topUpCount) };
      if (idx != null) body.pay_method_index = idx;
      const res = await API.post('/api/user/waffo/pay', body);
      if (res.data?.message === 'success' && res.data.data?.payment_url) window.open(res.data.data.payment_url, '_blank');
      else showError(res.data?.data || t('支付请求失败'));
    } catch { showError(t('支付请求失败')); }
    finally { setPaymentLoading(false); }
  };

  const creemPreTopUp = (product) => { setSelectedCreemProduct(product); setCreemOpen(true); };
  const onlineCreemTopUp = async () => {
    if (!selectedCreemProduct?.productId) { showError(t('产品配置错误，请联系管理员')); return; }
    setConfirmLoading(true);
    try {
      const res = await API.post('/api/user/creem/pay', { product_id: selectedCreemProduct.productId, payment_method: 'creem' });
      if (res.data?.message === 'success') window.open(res.data.data.checkout_url, '_blank');
      else showError(res.data?.data || res.data?.message || t('支付失败'));
    } catch { showError(t('支付请求失败')); }
    finally { setCreemOpen(false); setConfirmLoading(false); }
  };

  const selectPresetAmount = (preset) => {
    setTopUpCount(preset.value);
    setSelectedPreset(preset.value);
    const discount = preset.discount || topupInfo.discount[preset.value] || 1.0;
    setAmount(preset.value * priceRatio * discount);
  };

  /* ─── Derived ─── */
  const epayMethods = payMethods.filter((m) => m.type !== 'stripe' && m.type !== 'creem' && m.type !== 'waffo' && m.type !== 'cryptomus' && m.type !== 'nowpayments');
  const hasOnlinePay = enableOnlineTopUp || enableStripeTopUp || enableWaffoTopUp || enableCryptomusTopUp || enableNowPaymentsTopUp;
  const currentDiscount = topupInfo?.discount?.[topUpCount] || 1.0;
  const actualPay = topUpCount * priceRatio * currentDiscount;
  const hasDiscount = currentDiscount < 1.0;
  const showSubscriptionTab = !subscriptionLoading && subscriptionPlans.length > 0;

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: 'calc(100vh - var(--header-height))', background: 'var(--bg-base)', padding: isMobile ? '24px 16px 48px' : '40px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* ─── Header ─── */}
          <div className='rc-animate' style={{ marginBottom: 32 }}>
            <Button theme='borderless' type='tertiary' icon={<ArrowLeft size={16} />}
              onClick={() => navigate('/console/topup')}
              style={{ marginBottom: 16, borderRadius: 'var(--radius-md)' }}
            >
              {t('返回钱包')}
            </Button>
            <h1 style={{
              fontSize: isMobile ? 32 : 42, fontWeight: 800, margin: 0, lineHeight: 1.1,
              fontFamily: 'var(--font-serif)', color: 'var(--text-primary)',
            }}>
              {t('升级体验')}
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 600 }}>
              {t('选择适合你的套餐，或充值余额按需使用。')}
            </p>
          </div>

          {/* ─── Tab switcher (design-doc style pill) ─── */}
          {showSubscriptionTab && (
            <div className='rc-animate' style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
              <div style={{
                display: 'flex', gap: 4, padding: 5,
                background: 'var(--surface-active)', borderRadius: 9999,
                maxWidth: 400, width: '100%',
              }}>
                <button className={`rc-tab${activeTab === 'subscription' ? ' active' : ''}`} onClick={() => setActiveTab('subscription')}>
                  {t('订阅套餐')}
                </button>
                <button className={`rc-tab${activeTab === 'topup' ? ' active' : ''}`} onClick={() => setActiveTab('topup')}>
                  {t('额度充值')}
                </button>
              </div>
            </div>
          )}

          {/* ─── Tab content ─── */}
          {activeTab === 'subscription' && showSubscriptionTab ? (
            <div className='rc-animate' key='sub'>
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
                onChangeBillingPreference={updateBillingPreference}
                activeSubscriptions={activeSubscriptions}
                allSubscriptions={allSubscriptions}
                reloadSubscriptionSelf={getSubscriptionSelf}
                withCard={false}
              />
            </div>
          ) : (
            <div className='rc-animate' key='topup'>
              {topupLoading ? (
                <Skeleton.Paragraph active rows={6} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 32, alignItems: 'start' }}>
                  {/* ─── Left: presets + custom + payment ─── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

                    {/* Preset grid */}
                    {hasOnlinePay && (
                      <section>
                        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 16 }}>
                          {t('选择充值额度')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 12 }}>
                          {presetAmounts.map((p) => {
                            const disc = p.discount || topupInfo?.discount?.[p.value] || 1.0;
                            const origPay = p.value * priceRatio;
                            const actPay = origPay * disc;
                            const hasDsc = disc < 1.0;
                            const isSelected = selectedPreset === p.value;
                            return (
                              <button key={p.value}
                                className={`rc-preset-card${isSelected ? ' selected' : ''}`}
                                onClick={() => selectPresetAmount(p)}
                              >
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-serif)', color: isSelected ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 4 }}>
                                    ${p.value}
                                  </div>
                                  {hasDsc && (
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                      ¥{origPay.toFixed(0)}
                                    </div>
                                  )}
                                  {!hasDsc && (
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                      ¥{actPay.toFixed(0)}
                                    </div>
                                  )}
                                </div>
                                {hasDsc && (
                                  <span style={{
                                    position: 'absolute', top: 12, right: 12,
                                    display: 'inline-flex', alignItems: 'center',
                                    padding: '2px 8px', borderRadius: 9999,
                                    fontSize: 11, fontWeight: 700,
                                    background: 'var(--accent-gradient)', color: '#fff',
                                  }}>
                                    {(disc * 10).toFixed(1)}{t('折')}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Custom amount */}
                    {hasOnlinePay && (
                      <section>
                        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 16 }}>
                          {t('自定义金额')}
                        </h2>
                        <div className='rc-custom-amount' style={{
                          display: 'flex', alignItems: 'center', gap: 16, padding: 24,
                          borderRadius: 'var(--radius-lg)', background: 'var(--surface-active)',
                        }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <span style={{
                              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                              fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)',
                            }}>$</span>
                            <InputNumber
                              value={topUpCount}
                              onChange={(v) => { setTopUpCount(v || 0); setSelectedPreset(null); getAmountFn(v || 0); }}
                              min={minTopUp} max={999999999} step={1} precision={0}
                              style={{
                                width: '100%', borderRadius: 'var(--radius-lg)',
                                height: 64, fontSize: 28, fontWeight: 700, paddingLeft: 48,
                              }}
                              innerButtons={false}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { const v = Math.max(minTopUp, topUpCount - 1); setTopUpCount(v); setSelectedPreset(null); getAmountFn(v); }}
                              style={{
                                width: 48, height: 48, borderRadius: '50%', border: 'none',
                                background: 'var(--surface)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-secondary)', transition: 'all 0.2s',
                              }}>
                              <Minus size={18} />
                            </button>
                            <button onClick={() => { const v = topUpCount + 1; setTopUpCount(v); setSelectedPreset(null); getAmountFn(v); }}
                              style={{
                                width: 48, height: 48, borderRadius: '50%', border: 'none',
                                background: 'var(--surface)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-secondary)', transition: 'all 0.2s',
                              }}>
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Payment methods */}
                    {hasOnlinePay && (
                      <section>
                        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 16 }}>
                          {t('选择支付方式')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
                          {/* Stripe */}
                          {enableStripeTopUp && payMethods.filter((m) => m.type === 'stripe').map((m) => (
                            <button key='stripe' className={`rc-pay-method${selectedPayMethod === 'stripe' ? ' selected' : ''}`}
                              onClick={() => setSelectedPayMethod('stripe')}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(99,91,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                                <SiStripe size={22} color='#635BFF' />
                              </div>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Stripe</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('国际支付')}</div>
                              </div>
                              {selectedPayMethod === 'stripe' && (
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check size={12} color='#fff' />
                                </div>
                              )}
                            </button>
                          ))}
                          {/* Epay methods */}
                          {enableOnlineTopUp && epayMethods.map((m) => (
                            <button key={m.type} className={`rc-pay-method${selectedPayMethod === m.type ? ' selected' : ''}`}
                              onClick={() => setSelectedPayMethod(m.type)}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: m.type === 'alipay' ? 'rgba(22,119,255,0.08)' : m.type === 'wxpay' ? 'rgba(7,193,96,0.08)' : 'var(--surface-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                                {m.type === 'alipay' ? <SiAlipay size={22} color='#1677FF' /> : m.type === 'wxpay' ? <SiWechat size={22} color='#07C160' /> : <CreditCard size={20} style={{ color: 'var(--text-muted)' }} />}
                              </div>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('即时到账')}</div>
                              </div>
                              {selectedPayMethod === m.type && (
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check size={12} color='#fff' />
                                </div>
                              )}
                            </button>
                          ))}
                          {/* Cryptomus */}
                          {enableCryptomusTopUp && (
                            <button key='cryptomus' className={`rc-pay-method${selectedPayMethod === 'cryptomus' ? ' selected' : ''}`}
                              onClick={() => setSelectedPayMethod('cryptomus')}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(247,147,26,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0, fontSize: 18, fontWeight: 800, color: '#F7931A', fontFamily: 'var(--font-mono)' }}>
                                ₮
                              </div>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{t('USDT / 加密货币')}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('链上到账，低手续费')}</div>
                              </div>
                              {selectedPayMethod === 'cryptomus' && (
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check size={12} color='#fff' />
                                </div>
                              )}
                            </button>
                          )}
                          {/* NowPayments */}
                          {enableNowPaymentsTopUp && (
                            <button key='nowpayments' className={`rc-pay-method${selectedPayMethod === 'nowpayments' ? ' selected' : ''}`}
                              onClick={() => setSelectedPayMethod('nowpayments')}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(38,178,168,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0, fontSize: 18, fontWeight: 800, color: '#26B2A8', fontFamily: 'var(--font-mono)' }}>
                                ₮
                              </div>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{t('NowPayments (USDT / Crypto)')}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('支持 USDT/USDC 等多链，托管页面付款')}</div>
                              </div>
                              {selectedPayMethod === 'nowpayments' && (
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check size={12} color='#fff' />
                                </div>
                              )}
                            </button>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Redemption code */}
                    <section>
                      <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: 16 }}>
                        {t('兑换充值码')}
                      </h2>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Input
                          value={redemptionCode} onChange={setRedemptionCode}
                          placeholder={t('输入充值码')}
                          prefix={<TicketCheck size={14} style={{ color: 'var(--text-muted)', marginLeft: 4, marginRight: 4 }} />}
                          showClear
                          style={{ flex: 1, borderRadius: 'var(--radius-lg)', height: 44 }}
                          onEnterPress={topUp}
                        />
                        <Button theme='solid' type='primary' loading={isSubmitting} onClick={topUp}
                          style={{ borderRadius: 'var(--radius-lg)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 44, padding: '0 24px' }}
                        >
                          {t('兑换')}
                        </Button>
                      </div>
                    </section>
                  </div>

                  {/* ─── Right: Summary panel (sticky, aligned with preset grid) ─── */}
                  {hasOnlinePay && (
                    <div style={{ position: 'sticky', top: 80, marginTop: 40 }}>
                      <div className='rc-summary'>
                        <div style={{ marginBottom: 16 }}>
                          <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0 }}>
                            {t('订单摘要')}
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                            {t('确认你的充值详情')}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{t('充值数量')}</span>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>${topUpCount}</span>
                          </div>
                          {hasDiscount && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{t('折扣')} ({(currentDiscount * 10).toFixed(1)}{t('折')})</span>
                              <span style={{ fontWeight: 500, color: 'var(--error)' }}>-¥{(topUpCount * priceRatio * (1 - currentDiscount)).toFixed(2)}</span>
                            </div>
                          )}
                          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                              {t('实付金额')}
                            </span>
                            <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>
                              ¥{actualPay.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {selectedPayMethod && (
                          <Button theme='solid' type='primary' block loading={paymentLoading}
                            onClick={() => {
                              if (selectedPayMethod === 'cryptomus') {
                                cryptomusTopUp();
                              } else if (selectedPayMethod === 'nowpayments') {
                                nowpaymentsTopUp();
                              } else {
                                preTopUp(selectedPayMethod);
                              }
                            }}
                            style={{
                              marginTop: 20, height: 48, borderRadius: 'var(--radius-lg)',
                              background: 'var(--accent-gradient)', border: 'none',
                              fontWeight: 700, fontSize: 15,
                            }}
                          >
                            {t('确认充值')}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ─── Modals ─── */}
      <PaymentConfirmModal
        t={t} open={open} onlineTopUp={onlineTopUp} handleCancel={() => setOpen(false)}
        confirmLoading={confirmLoading} topUpCount={topUpCount}
        renderQuotaWithAmount={renderQuotaWithAmount}
        amountLoading={amountLoading} renderAmount={renderAmount}
        payWay={payWay} payMethods={payMethods} amountNumber={amount}
        discountRate={topupInfo?.discount?.[topUpCount] || 1.0}
      />
      <Modal
        title={t('确定要充值 $')} visible={creemOpen}
        onOk={onlineCreemTopUp} onCancel={() => { setCreemOpen(false); setSelectedCreemProduct(null); }}
        maskClosable={false} size='small' centered confirmLoading={confirmLoading}
      >
        {selectedCreemProduct && (
          <div className='space-y-2'>
            <div className='flex justify-between py-1.5' style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('产品名称')}</span>
              <span style={{ color: 'var(--text-primary)' }}>{selectedCreemProduct.name}</span>
            </div>
            <div className='flex justify-between py-1.5' style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('价格')}</span>
              <span style={{ color: 'var(--text-primary)' }}>${selectedCreemProduct.price}</span>
            </div>
            <p className='text-sm pt-2' style={{ color: 'var(--text-secondary)' }}>{t('是否确认充值？')}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default RechargePage;
