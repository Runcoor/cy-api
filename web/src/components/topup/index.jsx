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

import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  API,
  copy,
  showError,
  showSuccess,
  renderQuota,
  getQuotaPerUnit,
} from '../../helpers';
import { UserContext } from '../../context/User';

import InvitationCard from './InvitationCard';
import TransferModal from './modals/TransferModal';
import TopupHistoryModal from './modals/TopupHistoryModal';

import BalanceHero from './parts/BalanceHero';
import HealthCard from './parts/HealthCard';
import BillingPreference from './parts/BillingPreference';
import EarningsCard from './parts/EarningsCard';
import SpendTrend from './parts/SpendTrend';
import { WalIcons as I, WalletPageStyles } from './_shared/WalletPageStyles';

const QUOTA_PER_USD = 500000; // mirror backend QuotaPerUnit
const quotaToUsd = (q) => (Number(q) || 0) / QUOTA_PER_USD;

const startOfMonthTs = () => {
  const d = new Date();
  return Math.floor(
    new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000,
  );
};
const startOfPrevMonthTs = () => {
  const d = new Date();
  return Math.floor(
    new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime() / 1000,
  );
};

const TopUp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userState, userDispatch] = useContext(UserContext);

  const [openTransfer, setOpenTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const [openHistory, setOpenHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const [affLink, setAffLink] = useState('');
  const affFetchedRef = useRef(false);

  const [billingPreference, setBillingPreference] =
    useState('subscription_first');
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);

  const [totalTopupUsd, setTotalTopupUsd] = useState(0);
  const [topupCount, setTopupCount] = useState(0);
  const [monthTopupUsd, setMonthTopupUsd] = useState(0);
  const [monthConsumeUsd, setMonthConsumeUsd] = useState(0);
  const [prevMonthConsumeUsd, setPrevMonthConsumeUsd] = useState(0);
  const [totalUsedUsd, setTotalUsedUsd] = useState(0);

  const [range, setRange] = useState('30d');
  const [spendByDay, setSpendByDay] = useState([]);

  const [tierData, setTierData] = useState({
    enabled: false,
    current_count: 0,
    tiers: [],
  });

  const notificationThresholdLabel = useMemo(() => {
    try {
      const setting = userState?.user?.setting
        ? JSON.parse(userState.user.setting)
        : {};
      const v = setting.quota_warning_threshold;
      if (!v) return null;
      return `$${(Number(v) / QUOTA_PER_USD).toFixed(2)}`;
    } catch {
      return null;
    }
  }, [userState?.user?.setting]);

  const monthDelta = monthTopupUsd - monthConsumeUsd;
  const monthDeltaPct =
    prevMonthConsumeUsd > 0
      ? ((monthConsumeUsd - prevMonthConsumeUsd) / prevMonthConsumeUsd) * 100
      : null;

  // ---- data fetches ----

  const getUserQuota = async () => {
    try {
      const res = await API.get(`/api/user/self`);
      const { success, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        setTotalUsedUsd(quotaToUsd(data?.used_quota));
      }
    } catch {
      /* ignore */
    }
  };

  const getAffLink = async () => {
    try {
      const res = await API.get('/api/user/aff');
      const { success, data, message } = res.data;
      if (success) {
        setAffLink(`${window.location.origin}/register?aff=${data}`);
      } else if (message) {
        showError(message);
      }
    } catch {
      /* ignore */
    }
  };

  const getSubscriptionSelf = async () => {
    try {
      const res = await API.get('/api/subscription/self');
      if (res.data?.success) {
        setBillingPreference(
          res.data.data?.billing_preference || 'subscription_first',
        );
        setActiveSubscriptions(res.data.data?.subscriptions || []);
      }
    } catch {
      /* ignore */
    }
  };

  const getAffTiers = async () => {
    try {
      const res = await API.get('/api/user/aff/tiers');
      if (res.data?.success && res.data.data) {
        setTierData(res.data.data);
      }
    } catch {
      /* ignore */
    }
  };

  // Sum successful top-ups + count + this-month topup amount
  // (one /api/user/topup/self call, paged-large)
  const getTopupAggregates = async () => {
    try {
      const res = await API.get('/api/user/topup/self?p=1&page_size=200');
      if (!res.data?.success) return;
      const items = res.data.data?.items || [];
      const monthStart = startOfMonthTs();
      let total = 0,
        count = 0,
        monthSum = 0;
      items.forEach((it) => {
        if (it.status !== 'success') return;
        const amt = Number(it.amount) || 0;
        total += amt;
        count += 1;
        const ts =
          Number(it.complete_time) ||
          Number(it.created_time) ||
          Number(it.create_time) ||
          0;
        if (ts >= monthStart) monthSum += amt;
      });
      setTotalTopupUsd(total);
      setTopupCount(count);
      setMonthTopupUsd(monthSum);
    } catch {
      /* ignore */
    }
  };

  const getMonthConsume = async () => {
    try {
      const ts = startOfMonthTs();
      const res = await API.get(
        `/api/log/self/stat?type=2&start_timestamp=${ts}`,
      );
      if (res.data?.success) {
        setMonthConsumeUsd(quotaToUsd(res.data.data?.quota || 0));
      }
    } catch {
      /* ignore */
    }
  };

  const getPrevMonthConsume = async () => {
    try {
      const start = startOfPrevMonthTs();
      const end = startOfMonthTs();
      const res = await API.get(
        `/api/log/self/stat?type=2&start_timestamp=${start}&end_timestamp=${end}`,
      );
      if (res.data?.success) {
        setPrevMonthConsumeUsd(quotaToUsd(res.data.data?.quota || 0));
      }
    } catch {
      /* ignore */
    }
  };

  const getSpendByDay = async (rangeKey = range) => {
    const days = rangeKey === '7d' ? 7 : rangeKey === '90d' ? 90 : 30;
    try {
      const res = await API.get(`/api/log/self/stat-by-day?days=${days}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSpendByDay(
          res.data.data.map((p) => ({
            date: p.date,
            usd: quotaToUsd(p.quota || 0),
          })),
        );
      }
    } catch {
      setSpendByDay([]);
    }
  };

  const updateBillingPreference = async (pref) => {
    const previous = billingPreference;
    setBillingPreference(pref);
    try {
      const res = await API.put('/api/subscription/self/preference', {
        billing_preference: pref,
      });
      if (res.data?.success) {
        showSuccess(t('更新成功'));
        const normalized =
          res.data?.data?.billing_preference || pref || previous;
        setBillingPreference(normalized);
      } else {
        showError(res.data?.message || t('更新失败'));
        setBillingPreference(previous);
      }
    } catch {
      showError(t('请求失败'));
      setBillingPreference(previous);
    }
  };

  const transfer = async () => {
    if (transferAmount < getQuotaPerUnit()) {
      showError(t('划转金额最低为') + ' ' + renderQuota(getQuotaPerUnit()));
      return;
    }
    try {
      const res = await API.post(`/api/user/aff_transfer`, {
        quota: transferAmount,
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(message);
        setOpenTransfer(false);
        getUserQuota();
      } else {
        showError(message);
      }
    } catch {
      showError(t('请求失败'));
    }
  };

  const onCopyAffLink = async () => {
    if (!affLink) return;
    if (await copy(affLink)) {
      setCopied(true);
      showSuccess(t('邀请链接已复制到剪切板'));
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // ---- effects ----

  useEffect(() => {
    if (searchParams.get('show_history') === 'true') {
      setOpenHistory(true);
      searchParams.delete('show_history');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    getUserQuota();
    setTransferAmount(getQuotaPerUnit());
  }, []);

  useEffect(() => {
    if (affFetchedRef.current) return;
    affFetchedRef.current = true;
    getAffLink();
  }, []);

  useEffect(() => {
    getSubscriptionSelf();
    getTopupAggregates();
    getMonthConsume();
    getPrevMonthConsume();
    getAffTiers();
  }, []);

  useEffect(() => {
    getSpendByDay(range);
  }, [range]);

  // ---- derived presentational props ----

  const trendStats = useMemo(() => {
    const series = spendByDay.map((p) => p.usd);
    const total = series.reduce((s, v) => s + v, 0);
    const avg = series.length ? total / series.length : 0;
    const peak = series.length ? Math.max(...series) : 0;
    return { series, total, avg, peak };
  }, [spendByDay]);

  const activeSubLabel = useMemo(() => {
    if (!activeSubscriptions.length) return null;
    const first = activeSubscriptions[0];
    return first?.plan_name || first?.plan_title || t('订阅生效中');
  }, [activeSubscriptions, t]);

  // base reward in USD per invite (read from server-set QuotaForInviter — not
  // in user payload; fall back to a polite "邀请奖励" headline if unknown).
  // We don't have a getter, so just derive headline amount from history when
  // possible: if user has at least 1 invite + history, average it out.
  const baseRewardUsd = useMemo(() => {
    if (!userState?.user) return null;
    const cnt = userState.user.aff_count || 0;
    const hist = quotaToUsd(userState.user.aff_history_quota || 0);
    if (cnt > 0 && hist > 0) {
      return Math.round((hist / cnt) * 100) / 100;
    }
    return null;
  }, [userState?.user]);

  return (
    <div className='wal-root'>
      <WalletPageStyles />

      <TransferModal
        t={t}
        openTransfer={openTransfer}
        transfer={transfer}
        handleTransferCancel={() => setOpenTransfer(false)}
        userState={userState}
        renderQuota={renderQuota}
        getQuotaPerUnit={getQuotaPerUnit}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
      />
      <TopupHistoryModal
        visible={openHistory}
        onCancel={() => setOpenHistory(false)}
        t={t}
        userInfo={userState?.user}
      />

      <div className='wal-page'>
        <div className='wal-page-head'>
          <div>
            <h1 className='wal-page-title'>{t('钱包')}</h1>
            <div className='wal-page-sub'>
              {t('账户余额、充值、收益与交易明细')}
            </div>
          </div>
          <div className='wal-head-actions'>
            <button
              className='wal-btn'
              onClick={() => {
                getTopupAggregates();
                getMonthConsume();
                getPrevMonthConsume();
                getSpendByDay(range);
                getAffTiers();
                getUserQuota();
              }}
              title={t('刷新')}
            >
              <I.Refresh /> {t('刷新')}
            </button>
            <button className='wal-btn' onClick={() => setOpenHistory(true)}>
              <I.Receipt /> {t('账单')}
            </button>
          </div>
        </div>

        {/* ROW 1: Balance + Health */}
        <div className='wal-grid-12'>
          <div className='wal-col-8'>
            <BalanceHero
              t={t}
              user={userState?.user}
              monthDelta={monthDelta}
              totalTopupUsd={totalTopupUsd}
              topupCount={topupCount}
              totalUsedUsd={totalUsedUsd}
              monthDeltaPct={monthDeltaPct}
              onOpenHistory={() => setOpenHistory(true)}
              onRecharge={() => navigate('/console/recharge')}
            />
          </div>
          <div className='wal-col-4'>
            <HealthCard
              t={t}
              warningEnabled={!!notificationThresholdLabel}
              warningThresholdLabel={notificationThresholdLabel}
            />
          </div>
        </div>

        {/* ROW 2: Billing Preference + Earnings */}
        <div className='wal-grid-12'>
          <div className='wal-col-7'>
            <BillingPreference
              t={t}
              value={billingPreference}
              onChange={updateBillingPreference}
              activeSubscription={activeSubLabel}
            />
          </div>
          <div className='wal-col-5'>
            <EarningsCard
              t={t}
              affQuotaUsd={quotaToUsd(userState?.user?.aff_quota || 0)}
              affHistoryUsd={quotaToUsd(
                userState?.user?.aff_history_quota || 0,
              )}
              onTransfer={() => setOpenTransfer(true)}
            />
          </div>
        </div>

        {/* ROW 3: Spend Trend */}
        <div className='wal-grid-12'>
          <div className='wal-col-12'>
            <SpendTrend
              t={t}
              range={range}
              setRange={setRange}
              data={trendStats.series}
              totalUsd={trendStats.total}
              avgUsd={trendStats.avg}
              peakUsd={trendStats.peak}
              prevPeriodDeltaPct={null}
            />
          </div>
        </div>

        {/* ROW 4: Invite */}
        <div className='wal-grid-12'>
          <div className='wal-col-12'>
            <InvitationCard
              t={t}
              affLink={affLink}
              copied={copied}
              onCopy={onCopyAffLink}
              affCount={userState?.user?.aff_count || 0}
              monthEarningsUsd={quotaToUsd(
                userState?.user?.aff_history_quota || 0,
              )}
              baseRewardUsd={baseRewardUsd}
              tierData={tierData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUp;
