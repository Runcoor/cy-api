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

import React, { useCallback, useEffect, useState } from 'react';
import { Table, Tag, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../../helpers';

const { Text } = Typography;

function fmtTs(ts) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
}

const LoginLogsTab = ({ userId }) => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(
    async (p, ps) => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await API.get('/api/user/login-logs', {
          params: { p, page_size: ps, user_id: userId },
        });
        if (res?.data?.success) {
          const payload = res.data.data || {};
          setData(payload.items || []);
          setTotal(payload.total || 0);
        } else {
          showError(res?.data?.message || t('获取数据失败'));
        }
      } catch (e) {
        showError(e);
      } finally {
        setLoading(false);
      }
    },
    [userId, t],
  );

  useEffect(() => {
    fetchPage(page, pageSize);
  }, [fetchPage, page, pageSize]);

  const columns = [
    {
      title: t('时间'),
      dataIndex: 'created_at',
      render: fmtTs,
      width: 170,
    },
    {
      title: t('登录方式'),
      dataIndex: 'login_type',
      width: 140,
      render: (v, record) => {
        if (!v) return '-';
        if (v.startsWith('oauth:') || v === 'oauth') {
          const provider =
            record?.oauth_provider ||
            (v.startsWith('oauth:') ? v.replace('oauth:', '') : '');
          return (
            <Tag color='green' size='small'>
              {provider ? `OAuth:${provider}` : 'OAuth'}
            </Tag>
          );
        }
        return v;
      },
    },
    {
      title: t('结果'),
      dataIndex: 'status',
      width: 90,
      render: (v) => (
        <Tag color={v === 1 ? 'green' : 'red'}>
          {v === 1 ? t('成功') : t('失败')}
        </Tag>
      ),
    },
    {
      title: t('IP'),
      dataIndex: 'login_ip',
      width: 140,
      render: (v) => v || '-',
    },
    {
      title: t('国家'),
      dataIndex: 'country',
      width: 90,
      render: (v) => {
        if (!v) return '-';
        const upper = String(v).toUpperCase();
        if (!/^[A-Z]{2}$/.test(upper)) return upper;
        const flag = String.fromCodePoint(
          ...upper.split('').map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
        );
        return (
          <span style={{ fontSize: 13 }}>
            <span style={{ marginRight: 6 }}>{flag}</span>
            {upper}
          </span>
        );
      },
    },
    {
      title: t('平台 / 浏览器'),
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 13 }}>{record.browser || '-'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {record.os || '-'} · {record.platform || '-'}
          </div>
        </div>
      ),
    },
    {
      title: t('失败原因'),
      dataIndex: 'fail_reason',
      width: 160,
      render: (text) =>
        text ? (
          <Text type='danger' style={{ fontSize: 12 }}>
            {text}
          </Text>
        ) : (
          '-'
        ),
    },
    {
      title: 'User-Agent',
      dataIndex: 'user_agent',
      render: (v) => v || '-',
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey='id'
      loading={loading}
      pagination={{
        currentPage: page,
        pageSize,
        total,
        showSizeChanger: true,
        onChange: (p, ps) => {
          setPage(p);
          setPageSize(ps);
        },
      }}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default LoginLogsTab;
