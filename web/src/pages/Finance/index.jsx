import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Tag, Tabs, TabPane, Input, Select, Pagination } from '@douyinfe/semi-ui';
import { VChart } from '@visactor/react-vchart';
import { DollarSign, CheckCircle, Ticket, Users, RefreshCw, Search } from 'lucide-react';
import { useFinanceData } from '../../hooks/dashboard/useFinanceData';
import { renderQuota, API, showError } from '../../helpers';

const CHART_CONFIG = { mode: 'desktop-browser' };

const KpiCard = ({ icon: Icon, iconColor, label, value, sub, trend }) => (
  <div
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          background: iconColor + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={iconColor} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
        {label}
      </span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
    )}
    {trend && trend.length > 0 && (
      <div style={{ height: 32, marginTop: 4 }}>
        <VChart
          spec={{
            type: 'line',
            data: [{ id: 'spark', values: trend.map((v, i) => ({ x: i, y: v })) }],
            xField: 'x',
            yField: 'y',
            height: 32,
            width: 120,
            axes: [{ orient: 'bottom', visible: false }, { orient: 'left', visible: false }],
            padding: 0,
            autoFit: false,
            legends: { visible: false },
            tooltip: { visible: false },
            crosshair: { visible: false },
            line: { style: { stroke: iconColor, lineWidth: 2 } },
            point: { visible: false },
            background: { fill: 'transparent' },
          }}
          option={CHART_CONFIG}
        />
      </div>
    )}
  </div>
);

const TopUpRecordsTab = ({ t, formatMoney }) => {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/user/topup?p=${page}&page_size=${pageSize}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await API.get(url);
      const { success, data, message } = res.data;
      if (success) {
        setRecords(data?.items || []);
        setTotal(data?.total || 0);
      } else {
        showError(message);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSearch = (val) => {
    setKeyword(val);
    setPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val || '');
    setPage(1);
  };

  const statusTagMap = {
    success: { color: 'green', label: t('成功') },
    pending: { color: 'orange', label: t('待支付') },
    failed: { color: 'red', label: t('失败') },
    expired: { color: 'grey', label: t('已过期') },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: t('用户ID'),
      dataIndex: 'user_id',
      width: 80,
    },
    {
      title: t('金额'),
      dataIndex: 'money',
      width: 100,
      render: (v) => formatMoney(v),
    },
    {
      title: t('额度'),
      dataIndex: 'amount',
      width: 120,
      render: (v) => renderQuota(v, 2),
    },
    {
      title: t('订单号'),
      dataIndex: 'trade_no',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('支付方式'),
      dataIndex: 'payment_method',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 90,
      render: (v) => {
        const info = statusTagMap[v] || { color: 'grey', label: v };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: t('创建时间'),
      dataIndex: 'create_time',
      width: 170,
      render: (v) => (v ? new Date(v * 1000).toLocaleString() : '-'),
    },
    {
      title: t('完成时间'),
      dataIndex: 'complete_time',
      width: 170,
      render: (v) => (v ? new Date(v * 1000).toLocaleString() : '-'),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Input
          prefix={<Search size={14} />}
          placeholder={t('搜索订单号')}
          style={{ width: 240 }}
          showClear
          onEnterPress={(e) => handleSearch(e.target.value)}
          onChange={(val) => { if (!val) handleSearch(''); }}
        />
        <Select
          placeholder={t('状态筛选')}
          style={{ width: 140 }}
          showClear
          onChange={handleStatusChange}
          optionList={[
            { value: 'success', label: t('成功') },
            { value: 'pending', label: t('待支付') },
            { value: 'failed', label: t('失败') },
            { value: 'expired', label: t('已过期') },
          ]}
        />
      </div>
      <Table
        columns={columns}
        dataSource={records}
        pagination={false}
        size='small'
        empty={t('暂无数据')}
        loading={loading}
        rowKey='id'
        scroll={{ x: 1100 }}
      />
      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Pagination
            total={total}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            pageSizeOpts={[10, 20, 50, 100]}
            showSizeChanger
            showTotal
          />
        </div>
      )}
    </div>
  );
};

const Finance = () => {
  const { t } = useTranslation();
  const { loading, data, timeRange, fetchData, changeTimeRange } = useFinanceData();
  const [activeTab, setActiveTab] = useState('topup_records');

  useEffect(() => {
    fetchData();
  }, []);

  const kpi = data?.kpi;

  const formatMoney = (v) => {
    if (v == null) return '¥0.00';
    return '¥' + Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercent = (a, b) => {
    if (!b || b === 0) return '0%';
    return ((a / b) * 100).toFixed(1) + '%';
  };

  const timeRangeOptions = [
    { value: '7d', label: t('近7天') },
    { value: '30d', label: t('近30天') },
    { value: '90d', label: t('近90天') },
    { value: 'all', label: t('全部') },
  ];

  const revenueTrendSpec = {
    type: 'area',
    data: [{ id: 'trend', values: data?.revenue_trend || [] }],
    xField: 'date',
    yField: 'revenue',
    line: { style: { lineWidth: 2, curveType: 'monotone' } },
    area: { style: { fillOpacity: 0.08, curveType: 'monotone' } },
    point: { style: { size: 4, stroke: '#fff', lineWidth: 2 } },
    axes: [
      { orient: 'bottom', domainLine: { visible: false }, tick: { visible: false }, label: { style: { fontSize: 10 } } },
      { orient: 'left', domainLine: { visible: false }, tick: { visible: false }, grid: { style: { lineDash: [3, 3], stroke: 'rgba(128,128,128,0.15)' } }, label: { style: { fontSize: 10 } } },
    ],
    crosshair: { xField: { visible: true, line: { style: { stroke: 'rgba(128,128,128,0.3)', lineDash: [3, 3] } } } },
    legends: { visible: false },
    title: { visible: true, text: t('收入趋势') },
    tooltip: {
      mark: { content: [{ key: () => t('收入'), value: (datum) => '¥' + Number(datum.revenue).toFixed(2) }] },
    },
  };

  const paymentPieSpec = {
    type: 'pie',
    data: [{ id: 'pie', values: (data?.payment_distribution || []).map((d) => ({ type: d.method, value: d.amount })) }],
    outerRadius: 0.8,
    innerRadius: 0.5,
    padAngle: 0.6,
    valueField: 'value',
    categoryField: 'type',
    pie: { style: { cornerRadius: 10 }, state: { hover: { outerRadius: 0.85, stroke: 'rgba(128,128,128,0.2)', lineWidth: 1 } } },
    title: { visible: true, text: t('支付方式分布') },
    legends: { visible: true, orient: 'left' },
    label: { visible: true },
    tooltip: { mark: { content: [{ key: (datum) => datum.type, value: (datum) => '¥' + Number(datum.value).toFixed(2) }] } },
  };

  const badOrderColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: t('用户'), dataIndex: 'username', width: 120 },
    { title: t('金额'), dataIndex: 'money', width: 100, render: (v) => formatMoney(v) },
    { title: t('订单号'), dataIndex: 'trade_no', width: 200, ellipsis: true },
    { title: t('支付方式'), dataIndex: 'payment_method', width: 100 },
    {
      title: t('创建时间'),
      dataIndex: 'create_time',
      width: 180,
      render: (v) => v ? new Date(v * 1000).toLocaleString() : '-',
    },
  ];

  const topUserColumns = [
    { title: '#', dataIndex: '_rank', width: 50, render: (_, __, i) => i + 1 },
    { title: t('用户'), dataIndex: 'username', width: 150 },
    { title: t('总消费'), dataIndex: 'total_money', width: 120, render: (v) => formatMoney(v) },
    { title: t('订单数'), dataIndex: 'order_count', width: 100 },
  ];

  const redemptionColumns = [
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 100,
      render: (v) => {
        const map = { used: t('已核销'), enabled: t('未使用'), expired: t('已过期'), disabled: t('已禁用') };
        const colorMap = { used: 'green', enabled: 'blue', expired: 'orange', disabled: 'grey' };
        return <Tag color={colorMap[v] || 'grey'}>{map[v] || v}</Tag>;
      },
    },
    { title: t('数量'), dataIndex: 'count', width: 100 },
    { title: t('总额度'), dataIndex: 'total_quota', width: 150, render: (v) => renderQuota(v, 2) },
  ];

  return (
    <div style={{ padding: '0 24px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
            {t('财务报表')}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {t('收入概览与订单分析')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)' }}>
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => changeTimeRange(opt.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  fontWeight: timeRange === opt.value ? 700 : 500,
                  color: timeRange === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                  background: timeRange === opt.value ? 'var(--surface)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: timeRange === opt.value ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
              borderRadius: 'var(--radius-md)', background: 'var(--bg-base)',
              color: 'var(--text-secondary)', border: '1px solid var(--border-default)',
              fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={11} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
            {t('刷新')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard
          icon={DollarSign}
          iconColor='#10b981'
          label={t('总收入')}
          value={formatMoney(kpi?.total_revenue)}
          trend={kpi?.total_revenue_trend}
        />
        <KpiCard
          icon={CheckCircle}
          iconColor='#3b82f6'
          label={t('订单成功率')}
          value={formatPercent(kpi?.order_success, kpi?.order_total)}
          sub={`${kpi?.order_success || 0} ${t('成功')} / ${kpi?.order_pending || 0} ${t('待支付')} / ${kpi?.order_failed || 0} ${t('失败')}`}
        />
        <KpiCard
          icon={Ticket}
          iconColor='#f59e0b'
          label={t('兑换码核销率')}
          value={formatPercent(kpi?.redemption_used_count, kpi?.redemption_total_count)}
          sub={`${renderQuota(kpi?.redemption_used_quota || 0, 2)} / ${renderQuota(kpi?.redemption_total_quota || 0, 2)}`}
        />
        <KpiCard
          icon={Users}
          iconColor='#8b5cf6'
          label={t('活跃订阅数')}
          value={kpi?.active_subscriptions || 0}
          sub={`+${kpi?.new_subscriptions_period || 0} ${t('本期新增')}`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 16, height: 350 }}>
          <VChart spec={revenueTrendSpec} option={CHART_CONFIG} />
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 16, height: 350 }}>
          <VChart spec={paymentPieSpec} option={CHART_CONFIG} />
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ padding: '16px 16px 0' }}>
          <TabPane tab={t('充值记录')} itemKey='topup_records'>
            <TopUpRecordsTab t={t} formatMoney={formatMoney} />
          </TabPane>
          <TabPane tab={t('坏单列表')} itemKey='bad_orders'>
            <Table
              columns={badOrderColumns}
              dataSource={data?.bad_orders || []}
              pagination={false}
              size='small'
              empty={t('暂无坏单')}
              loading={loading}
              rowKey='id'
            />
          </TabPane>
          <TabPane tab={t('充值排行')} itemKey='top_users'>
            <Table
              columns={topUserColumns}
              dataSource={data?.top_users || []}
              pagination={false}
              size='small'
              empty={t('暂无数据')}
              loading={loading}
              rowKey='user_id'
            />
          </TabPane>
          <TabPane tab={t('兑换码损耗')} itemKey='redemption'>
            <Table
              columns={redemptionColumns}
              dataSource={data?.redemption_summary || []}
              pagination={false}
              size='small'
              empty={t('暂无数据')}
              loading={loading}
              rowKey='status'
            />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default Finance;
