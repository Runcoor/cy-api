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

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Empty,
  Modal,
  Select,
  SideSheet,
} from '@douyinfe/semi-ui';
import { IconPlusCircle, IconCreditCard } from '@douyinfe/semi-icons';
import { API, showError, showSuccess } from '../../../../helpers';
import { convertUSDToCurrency } from '../../../../helpers/render';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import CardTable from '../../../common/ui/CardTable';

function formatTs(ts) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
}

function renderStatusBadge(sub, t) {
  const now = Date.now() / 1000;
  const end = sub?.end_time || 0;
  const status = sub?.status || '';

  const isExpiredByTime = end > 0 && end < now;
  const isActive = status === 'active' && !isExpiredByTime;

  let label, color, bg;
  if (isActive) {
    label = t('生效');
    color = 'var(--success)';
    bg = 'rgba(52, 199, 89, 0.12)';
  } else if (status === 'cancelled') {
    label = t('已作废');
    color = 'var(--text-muted)';
    bg = 'var(--surface-active)';
  } else {
    label = t('已过期');
    color = 'var(--text-muted)';
    bg = 'var(--surface-active)';
  }

  return (
    <span
      className='inline-flex items-center text-xs px-2 py-0.5 font-medium'
      style={{ borderRadius: 'var(--radius-sm)', background: bg, color }}
    >
      {label}
    </span>
  );
}

const UserSubscriptionsModal = ({ visible, onCancel, user, t, onSuccess }) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const [subs, setSubs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const planTitleMap = useMemo(() => {
    const map = new Map();
    (plans || []).forEach((p) => {
      const id = p?.plan?.id;
      const title = p?.plan?.title;
      if (id) map.set(id, title || `#${id}`);
    });
    return map;
  }, [plans]);

  const pagedSubs = useMemo(() => {
    const start = Math.max(0, (Number(currentPage || 1) - 1) * pageSize);
    const end = start + pageSize;
    return (subs || []).slice(start, end);
  }, [subs, currentPage]);

  const planOptions = useMemo(() => {
    return (plans || []).map((p) => ({
      label: `${p?.plan?.title || ''} (${convertUSDToCurrency(
        Number(p?.plan?.price_amount || 0),
        2,
      )})`,
      value: p?.plan?.id,
    }));
  }, [plans]);

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await API.get('/api/subscription/admin/plans');
      if (res.data?.success) {
        setPlans(res.data.data || []);
      } else {
        showError(res.data?.message || t('加载失败'));
      }
    } catch (e) {
      showError(t('请求失败'));
    } finally {
      setPlansLoading(false);
    }
  };

  const loadUserSubscriptions = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await API.get(
        `/api/subscription/admin/users/${user.id}/subscriptions`,
      );
      if (res.data?.success) {
        const next = res.data.data || [];
        setSubs(next);
        setCurrentPage(1);
      } else {
        showError(res.data?.message || t('加载失败'));
      }
    } catch (e) {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    setSelectedPlanId(null);
    setCurrentPage(1);
    loadPlans();
    loadUserSubscriptions();
  }, [visible]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const createSubscription = async () => {
    if (!user?.id) {
      showError(t('用户信息缺失'));
      return;
    }
    if (!selectedPlanId) {
      showError(t('请选择订阅套餐'));
      return;
    }
    setCreating(true);
    try {
      const res = await API.post(
        `/api/subscription/admin/users/${user.id}/subscriptions`,
        {
          plan_id: selectedPlanId,
        },
      );
      if (res.data?.success) {
        const msg = res.data?.data?.message;
        showSuccess(msg ? msg : t('新增成功'));
        setSelectedPlanId(null);
        await loadUserSubscriptions();
        onSuccess?.();
      } else {
        showError(res.data?.message || t('新增失败'));
      }
    } catch (e) {
      showError(t('请求失败'));
    } finally {
      setCreating(false);
    }
  };

  const invalidateSubscription = (subId) => {
    Modal.confirm({
      title: t('确认作废'),
      content: t('作废后该订阅将立即失效，历史记录不受影响。是否继续？'),
      centered: true,
      onOk: async () => {
        try {
          const res = await API.post(
            `/api/subscription/admin/user_subscriptions/${subId}/invalidate`,
          );
          if (res.data?.success) {
            const msg = res.data?.data?.message;
            showSuccess(msg ? msg : t('已作废'));
            await loadUserSubscriptions();
            onSuccess?.();
          } else {
            showError(res.data?.message || t('操作失败'));
          }
        } catch (e) {
          showError(t('请求失败'));
        }
      },
    });
  };

  const deleteSubscription = (subId) => {
    Modal.confirm({
      title: t('确认删除'),
      content: t('删除会彻底移除该订阅记录（含权益明细）。是否继续？'),
      centered: true,
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await API.delete(
            `/api/subscription/admin/user_subscriptions/${subId}`,
          );
          if (res.data?.success) {
            const msg = res.data?.data?.message;
            showSuccess(msg ? msg : t('已删除'));
            await loadUserSubscriptions();
            onSuccess?.();
          } else {
            showError(res.data?.message || t('删除失败'));
          }
        } catch (e) {
          showError(t('请求失败'));
        }
      },
    });
  };

  const columns = useMemo(() => {
    return [
      {
        title: 'ID',
        dataIndex: ['subscription', 'id'],
        key: 'id',
        width: 70,
      },
      {
        title: t('套餐'),
        key: 'plan',
        width: 180,
        render: (_, record) => {
          const sub = record?.subscription;
          const planId = sub?.plan_id;
          const title =
            planTitleMap.get(planId) || (planId ? `#${planId}` : '-');
          return (
            <div className='min-w-0'>
              <div className='font-medium truncate'>{title}</div>
              <div className='text-xs text-mv-text-muted'>
                {t('来源')}: {sub?.source || '-'}
              </div>
            </div>
          );
        },
      },
      {
        title: t('状态'),
        key: 'status',
        width: 90,
        render: (_, record) => renderStatusBadge(record?.subscription, t),
      },
      {
        title: t('有效期'),
        key: 'validity',
        width: 200,
        render: (_, record) => {
          const sub = record?.subscription;
          return (
            <div className='text-xs text-mv-text-secondary'>
              <div>
                {t('开始')}: {formatTs(sub?.start_time)}
              </div>
              <div>
                {t('结束')}: {formatTs(sub?.end_time)}
              </div>
            </div>
          );
        },
      },
      {
        title: t('总额度'),
        key: 'total',
        width: 120,
        render: (_, record) => {
          const sub = record?.subscription;
          const total = Number(sub?.amount_total || 0);
          const used = Number(sub?.amount_used || 0);
          return (
            <span
              className='text-xs'
              style={{
                color: total > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {total > 0 ? `${used}/${total}` : t('不限')}
            </span>
          );
        },
      },
      {
        title: '',
        key: 'operate',
        width: 140,
        fixed: 'right',
        render: (_, record) => {
          const sub = record?.subscription;
          const now = Date.now() / 1000;
          const isExpired =
            (sub?.end_time || 0) > 0 && (sub?.end_time || 0) < now;
          const isActive = sub?.status === 'active' && !isExpired;
          const isCancelled = sub?.status === 'cancelled';
          return (
            <div className='flex items-center gap-1.5'>
              <button
                className='text-xs px-2 py-1 transition-colors duration-150'
                disabled={!isActive || isCancelled}
                onClick={() => invalidateSubscription(sub?.id)}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 149, 0, 0.10)',
                  color: (!isActive || isCancelled) ? 'var(--text-muted)' : 'var(--warning)',
                  border: 'none',
                  cursor: (!isActive || isCancelled) ? 'not-allowed' : 'pointer',
                  opacity: (!isActive || isCancelled) ? 0.5 : 1,
                }}
              >
                {t('作废')}
              </button>
              <button
                className='text-xs px-2 py-1 transition-colors duration-150'
                onClick={() => deleteSubscription(sub?.id)}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 59, 48, 0.10)',
                  color: 'var(--error)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('删除')}
              </button>
            </div>
          );
        },
      },
    ];
  }, [t, planTitleMap]);

  return (
    <SideSheet
      visible={visible}
      placement='right'
      width={isMobile ? '100%' : 920}
      bodyStyle={{ padding: 0 }}
      onCancel={onCancel}
      title={
        <div className='flex items-center gap-2.5'>
          <span
            className='w-7 h-7 flex items-center justify-center'
            style={{
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
            }}
          >
            <IconCreditCard size={16} />
          </span>
          <div>
            <span
              className='text-base font-semibold'
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
            >
              {t('用户订阅管理')}
            </span>
            <span className='text-xs ml-2' style={{ color: 'var(--text-muted)' }}>
              {user?.username || '-'} (ID: {user?.id || '-'})
            </span>
          </div>
        </div>
      }
    >
      <div className='p-4'>
        {/* 顶部操作栏：新增订阅 */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4'>
          <div className='flex gap-2 flex-1'>
            <Select
              placeholder={t('选择订阅套餐')}
              optionList={planOptions}
              value={selectedPlanId}
              onChange={setSelectedPlanId}
              loading={plansLoading}
              filter
              style={{ minWidth: isMobile ? undefined : 300, flex: 1 }}
            />
            <Button
              theme='solid'
              icon={<IconPlusCircle />}
              loading={creating}
              onClick={createSubscription}
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                color: '#fff',
                border: 'none',
              }}
            >
              {t('新增订阅')}
            </Button>
          </div>
        </div>

        {/* 订阅列表 */}
        <CardTable
          columns={columns}
          dataSource={pagedSubs}
          rowKey={(row) => row?.subscription?.id}
          loading={loading}
          scroll={{ x: 'max-content' }}
          hidePagination={false}
          pagination={{
            currentPage,
            pageSize,
            total: subs.length,
            pageSizeOpts: [10, 20, 50],
            showSizeChanger: false,
            onPageChange: handlePageChange,
          }}
          empty={
            <Empty
              image={
                <img src="/NoDataillustration.svg" style={{ width: 150, height: 150 }} />
              }
              darkModeImage={
                <img src="/NoDataillustration.svg" style={{ width: 150, height: 150 }} />
              }
              description={t('暂无订阅记录')}
              style={{ padding: 30 }}
            />
          }
          size='middle'
        />
      </div>
    </SideSheet>
  );
};

export default UserSubscriptionsModal;
