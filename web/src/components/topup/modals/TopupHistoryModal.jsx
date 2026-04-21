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
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Table,
  Toast,
  Empty,
  Button,
  Input,
} from '@douyinfe/semi-ui';
import { Coins, FileText } from 'lucide-react';
import { IconSearch } from '@douyinfe/semi-icons';
import { API, timestamp2string } from '../../../helpers';
import { isAdmin } from '../../../helpers/utils';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import BillDetailModal from './BillDetailModal';
// 状态映射配置
const STATUS_CONFIG = {
  success: { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)', key: '成功' },
  pending: { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', key: '待支付' },
  failed: { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)', key: '失败' },
  expired: { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)', key: '已过期' },
};

// 支付方式映射
const PAYMENT_METHOD_MAP = {
  stripe: 'Stripe',
  creem: 'Creem',
  waffo: 'Waffo',
  alipay: '支付宝',
  wxpay: '微信',
};

const TopupHistoryModal = ({ visible, onCancel, t, userInfo }) => {
  const [loading, setLoading] = useState(false);
  const [topups, setTopups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const isMobile = useIsMobile();
  const [billVisible, setBillVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadTopups = async (currentPage, currentPageSize) => {
    setLoading(true);
    try {
      const base = isAdmin() ? '/api/user/topup' : '/api/user/topup/self';
      const qs =
        `p=${currentPage}&page_size=${currentPageSize}` +
        (keyword ? `&keyword=${encodeURIComponent(keyword)}` : '');
      const endpoint = `${base}?${qs}`;
      const res = await API.get(endpoint);
      const { success, message, data } = res.data;
      if (success) {
        setTopups(data.items || []);
        setTotal(data.total || 0);
      } else {
        Toast.error({ content: message || t('加载失败') });
      }
    } catch (error) {
      Toast.error({ content: t('加载账单失败') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadTopups(page, pageSize);
    }
  }, [visible, page, pageSize, keyword]);

  const handlePageChange = (currentPage) => {
    setPage(currentPage);
  };

  const handlePageSizeChange = (currentPageSize) => {
    setPageSize(currentPageSize);
    setPage(1);
  };

  const handleKeywordChange = (value) => {
    setKeyword(value);
    setPage(1);
  };

  // 管理员补单
  const handleAdminComplete = async (tradeNo) => {
    try {
      const res = await API.post('/api/user/topup/complete', {
        trade_no: tradeNo,
      });
      const { success, message } = res.data;
      if (success) {
        Toast.success({ content: t('补单成功') });
        await loadTopups(page, pageSize);
      } else {
        Toast.error({ content: message || t('补单失败') });
      }
    } catch (e) {
      Toast.error({ content: t('补单失败') });
    }
  };

  const confirmAdminComplete = (tradeNo) => {
    Modal.confirm({
      title: t('确认补单'),
      content: t('是否将该订单标记为成功并为用户入账？'),
      onOk: () => handleAdminComplete(tradeNo),
    });
  };

  // 渲染状态徽章
  const renderStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', key: status };
    return (
      <span
        className='inline-flex items-center gap-1.5 text-xs px-2 py-0.5 font-medium'
        style={{ borderRadius: 'var(--radius-sm)', background: config.bg, color: config.color }}
      >
        <span className='w-1.5 h-1.5 rounded-full' style={{ background: config.color }} />
        {t(config.key)}
      </span>
    );
  };

  // 渲染支付方式
  const renderPaymentMethod = (pm) => {
    const displayName = PAYMENT_METHOD_MAP[pm];
    return <span className='text-sm' style={{ color: 'var(--text-primary)' }}>{displayName ? t(displayName) : pm || '-'}</span>;
  };

  const isSubscriptionTopup = (record) => {
    const tradeNo = (record?.trade_no || '').toLowerCase();
    return Number(record?.amount || 0) === 0 && tradeNo.startsWith('sub');
  };

  // 检查是否为管理员
  const userIsAdmin = useMemo(() => isAdmin(), []);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: t('订单号'),
        dataIndex: 'trade_no',
        key: 'trade_no',
        render: (text) => <span className='text-xs' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{text}</span>,
      },
      {
        title: t('支付方式'),
        dataIndex: 'payment_method',
        key: 'payment_method',
        render: renderPaymentMethod,
      },
      {
        title: t('充值额度'),
        dataIndex: 'amount',
        key: 'amount',
        render: (amount, record) => {
          if (isSubscriptionTopup(record)) {
            return (
              <span className='inline-flex items-center text-xs px-1.5 py-0.5 font-medium' style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(175, 82, 222, 0.12)', color: '#AF52DE' }}>
                {t('订阅套餐')}
              </span>
            );
          }
          return (
            <span className='flex items-center gap-1'>
              <Coins size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{amount}</span>
            </span>
          );
        },
      },
      {
        title: t('支付金额'),
        dataIndex: 'money',
        key: 'money',
        render: (money) => <span className='text-sm font-medium' style={{ color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>¥{money.toFixed(2)}</span>,
      },
      {
        title: t('状态'),
        dataIndex: 'status',
        key: 'status',
        render: renderStatusBadge,
      },
    ];

    // 管理员才显示操作列
    if (userIsAdmin) {
      baseColumns.push({
        title: t('操作'),
        key: 'action',
        render: (_, record) => {
          const actions = [];
          if (record.status === 'pending') {
            actions.push(
              <Button
                key="complete"
                size='small'
                type='primary'
                theme='outline'
                onClick={() => confirmAdminComplete(record.trade_no)}
              >
                {t('补单')}
              </Button>
            );
          }
          return actions.length > 0 ? <>{actions}</> : null;
        },
      });
    }

    baseColumns.push({
      title: t('创建时间'),
      dataIndex: 'create_time',
      key: 'create_time',
      render: (time) => timestamp2string(time),
    });

    baseColumns.push({
      title: '',
      key: 'detail',
      width: 80,
      render: (_, record) => (
        <Button
          size='small'
          theme='borderless'
          type='tertiary'
          icon={<FileText size={14} />}
          onClick={() => {
            setSelectedRecord(record);
            setBillVisible(true);
          }}
        >
          {t('bill.detail')}
        </Button>
      ),
    });

    return baseColumns;
  }, [t, userIsAdmin]);

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span className='w-6 h-6 flex items-center justify-center' style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', color: 'var(--accent)' }}>
            <Coins size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('充值账单')}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      size={isMobile ? 'full-width' : 'large'}
    >
      <div className='mb-3'>
        <Input
          prefix={<IconSearch />}
          placeholder={t('订单号')}
          value={keyword}
          onChange={handleKeywordChange}
          showClear
        />
      </div>
      <Table
        columns={columns}
        dataSource={topups}
        loading={loading}
        rowKey='id'
        pagination={{
          currentPage: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOpts: [10, 20, 50, 100],
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
        size='small'
        empty={
          <Empty
            image={<img src="/NoDataillustration.svg" style={{ width: 150, height: 150 }} />}
            darkModeImage={
              <img src="/NoDataillustration.svg" style={{ width: 150, height: 150 }} />
            }
            description={t('暂无充值记录')}
            style={{ padding: 30 }}
          />
        }
      />
      <BillDetailModal
        visible={billVisible}
        onCancel={() => {
          setBillVisible(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        userInfo={userInfo}
        t={t}
      />
    </Modal>
  );
};

export default TopupHistoryModal;
