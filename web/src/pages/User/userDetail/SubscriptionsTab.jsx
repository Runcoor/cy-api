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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Modal, Popconfirm, Progress, Spin } from '@douyinfe/semi-ui';
import { IconPlusCircle } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API, renderQuota, showError, showSuccess } from '../../../helpers';

function fmtTs(ts) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
}

function statusBadge(sub, t) {
  const now = Date.now() / 1000;
  const expired = sub.end_time > 0 && sub.end_time < now;
  if (sub.status === 'active' && !expired) {
    return { label: t('生效'), color: 'var(--success)', bg: 'rgba(52,199,89,0.12)' };
  }
  if (sub.status === 'cancelled') {
    return { label: t('已作废'), color: 'var(--text-muted)', bg: 'var(--surface-active)' };
  }
  return { label: t('已过期'), color: 'var(--text-muted)', bg: 'var(--surface-active)' };
}

const SubCard = ({ sub, planTitle, t, onInvalidate, onDelete }) => {
  const badge = statusBadge(sub, t);
  const total = Number(sub.amount_total || 0);
  const used = Number(sub.amount_used || 0);
  const remain = Math.max(0, total - used);
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          {planTitle || `#${sub.plan_id}`}
        </span>
        <span
          className='inline-flex items-center text-xs px-2 py-0.5 font-medium'
          style={{ borderRadius: 'var(--radius-sm)', background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
        {sub.upgrade_group ? (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {t('分组')}: {sub.upgrade_group}
          </span>
        ) : null}
      </div>
      <div style={{ marginTop: 12 }}>
        <Progress percent={percent} stroke='var(--accent)' />
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          {t('已用')}: {renderQuota(used)} · {t('剩余')}: {renderQuota(remain)} · {t('总额')}: {renderQuota(total)}
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        {t('开始')}: {fmtTs(sub.start_time)} · {t('结束')}: {fmtTs(sub.end_time)}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {sub.status === 'active' ? (
          <Popconfirm
            title={t('确认作废该套餐？')}
            onConfirm={() => onInvalidate(sub.id)}
          >
            <Button size='small'>{t('作废')}</Button>
          </Popconfirm>
        ) : null}
        <Popconfirm
          title={t('确认删除该套餐记录？此操作不可恢复')}
          onConfirm={() => onDelete(sub.id)}
        >
          <Button size='small' type='danger'>{t('删除')}</Button>
        </Popconfirm>
      </div>
    </div>
  );
};

const SubscriptionsTab = ({ userId, onChanged }) => {
  const { t } = useTranslation();
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [picking, setPicking] = useState(null);
  const [creating, setCreating] = useState(false);

  const planMap = useMemo(() => {
    const m = {};
    (plans || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [plans]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await API.get('/api/subscription/admin/plans');
      if (res?.data?.success) {
        // Backend returns []SubscriptionPlanDTO => [{plan: {...}}]
        const list = (res.data.data || [])
          .map((item) => item?.plan)
          .filter(Boolean);
        setPlans(list);
      }
    } catch (e) {
      // non-fatal: plan titles will fall back to plan_id
    }
  }, []);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/subscription/admin/users/${userId}/subscriptions`);
      if (res?.data?.success) {
        // Backend returns []SubscriptionSummary => [{subscription: {...}}]
        const list = (res.data.data || [])
          .map((item) => item?.subscription)
          .filter(Boolean);
        setSubs(list);
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
    fetchPlans();
  }, [refetch, fetchPlans]);

  const openGift = async () => {
    // Plans are eagerly loaded; refresh in case they changed.
    try {
      const res = await API.get('/api/subscription/admin/plans');
      if (res?.data?.success) {
        const list = (res.data.data || [])
          .map((item) => item?.plan)
          .filter(Boolean);
        setPlans(list);
        setGiftOpen(true);
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    }
  };

  const onGiftConfirm = async () => {
    if (!picking) return;
    setCreating(true);
    try {
      const res = await API.post(
        `/api/subscription/admin/users/${userId}/subscriptions`,
        { plan_id: picking },
      );
      if (res?.data?.success) {
        showSuccess(t('赠送成功'));
        setGiftOpen(false);
        setPicking(null);
        await refetch();
        onChanged && onChanged();
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    } finally {
      setCreating(false);
    }
  };

  const onInvalidate = async (id) => {
    try {
      const res = await API.post(`/api/subscription/admin/user_subscriptions/${id}/invalidate`);
      if (res?.data?.success) {
        showSuccess(t('已作废'));
        await refetch();
        onChanged && onChanged();
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    }
  };

  const onDelete = async (id) => {
    try {
      const res = await API.delete(`/api/subscription/admin/user_subscriptions/${id}`);
      if (res?.data?.success) {
        showSuccess(t('已删除'));
        await refetch();
        onChanged && onChanged();
      } else {
        showError(res?.data?.message || 'failed');
      }
    } catch (e) {
      showError(e);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button icon={<IconPlusCircle />} onClick={openGift} type='primary'>
          {t('赠送套餐')}
        </Button>
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : subs.length === 0 ? (
        <Empty title={t('暂无套餐')} />
      ) : (
        subs.map((s) => (
          <SubCard
            key={s.id}
            sub={s}
            planTitle={planMap[s.plan_id]?.title}
            t={t}
            onInvalidate={onInvalidate}
            onDelete={onDelete}
          />
        ))
      )}

      <Modal
        title={t('赠送套餐')}
        visible={giftOpen}
        onCancel={() => {
          setGiftOpen(false);
          setPicking(null);
        }}
        onOk={onGiftConfirm}
        confirmLoading={creating}
        okText={t('赠送')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plans.length === 0 ? (
            <Empty title={t('暂无可用套餐')} />
          ) : (
            plans.map((p) => (
              <label
                key={p.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  type='radio'
                  name='plan'
                  checked={picking === p.id}
                  onChange={() => setPicking(p.id)}
                />
                <span>
                  {p.title || `#${p.id}`} · {p.upgrade_group || '-'} ·{' '}
                  {renderQuota(p.total_amount || 0)}
                </span>
              </label>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionsTab;
