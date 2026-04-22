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

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Tag,
  Input,
  Select,
  Button,
  Typography,
  Space,
} from '@douyinfe/semi-ui';
import { IconSearch, IconRefresh } from '@douyinfe/semi-icons';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Terminal,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const { Text } = Typography;

const LOGIN_TYPE_COLORS = {
  password: 'blue',
  '2fa': 'purple',
  passkey: 'cyan',
};

const platformIcon = (platform) => {
  switch (platform) {
    case 'Desktop':
      return <Monitor size={14} />;
    case 'Mobile':
      return <Smartphone size={14} />;
    case 'Tablet':
      return <Tablet size={14} />;
    case 'API':
      return <Terminal size={14} />;
    default:
      return <Globe size={14} />;
  }
};

const LoginLogPage = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [username, setUsername] = useState('');
  const [loginType, setLoginType] = useState('');
  const [loginIp, setLoginIp] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('p', page);
      params.set('page_size', pageSize);
      if (username) params.set('username', username);
      if (loginType) params.set('login_type', loginType);
      if (loginIp) params.set('login_ip', loginIp);

      const res = await API.get(`/api/user/login-logs?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data?.items || []);
        setTotal(res.data.data?.total || 0);
      } else {
        showError(res.data?.message || t('获取数据失败'));
      }
    } catch {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, username, loginType, loginIp, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setUsername('');
    setLoginType('');
    setLoginIp('');
    setPage(1);
  };

  const formatTime = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts * 1000);
    return d.toLocaleString();
  };

  const formatLoginType = (type) => {
    if (!type) return '-';
    if (type.startsWith('oauth:')) {
      const provider = type.replace('oauth:', '');
      return (
        <Tag color="green" size="small">
          OAuth:{provider}
        </Tag>
      );
    }
    return (
      <Tag color={LOGIN_TYPE_COLORS[type] || 'grey'} size="small">
        {type}
      </Tag>
    );
  };

  const columns = [
    {
      title: t('用户'),
      dataIndex: 'username',
      width: 120,
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{text}</Text>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            ID: {record.user_id || '-'}
          </div>
        </div>
      ),
    },
    {
      title: t('登录方式'),
      dataIndex: 'login_type',
      width: 120,
      render: formatLoginType,
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 80,
      render: (status, record) =>
        status === 1 ? (
          <Tag color="green" size="small" prefixIcon={<ShieldCheck size={12} />}>
            {t('成功')}
          </Tag>
        ) : (
          <Tag color="red" size="small" prefixIcon={<ShieldX size={12} />}>
            {t('失败')}
          </Tag>
        ),
    },
    {
      title: t('IP地址'),
      dataIndex: 'login_ip',
      width: 140,
      render: (ip) => <Text copyable={{ content: ip }} style={{ fontSize: 13 }}>{ip || '-'}</Text>,
    },
    {
      title: t('平台 / 浏览器'),
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {platformIcon(record.platform)}
          <div>
            <div style={{ fontSize: 13 }}>{record.browser || '-'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {record.os || '-'} · {record.platform || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t('失败原因'),
      dataIndex: 'fail_reason',
      width: 160,
      render: (text) => text ? <Text type="danger" style={{ fontSize: 12 }}>{text}</Text> : '-',
    },
    {
      title: t('时间'),
      dataIndex: 'created_at',
      width: 170,
      render: formatTime,
    },
  ];

  const loginTypeOptions = [
    { value: '', label: t('全部') },
    { value: 'password', label: t('密码登录') },
    { value: '2fa', label: '2FA' },
    { value: 'passkey', label: 'Passkey' },
    { value: 'oauth:github', label: 'OAuth:GitHub' },
    { value: 'oauth:discord', label: 'OAuth:Discord' },
    { value: 'oauth:oidc', label: 'OAuth:OIDC' },
    { value: 'oauth:linuxdo', label: 'OAuth:LinuxDO' },
    { value: 'oauth:wechat', label: 'OAuth:WeChat' },
    { value: 'oauth:telegram', label: 'OAuth:Telegram' },
  ];

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 22, fontWeight: 700, margin: 0,
          fontFamily: 'var(--font-serif)', color: 'var(--text-primary)',
        }}>
          {t('登录日志')}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          {t('查看所有用户的登录记录，包括登录方式、设备信息和IP地址。')}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12,
        marginBottom: 20, alignItems: 'flex-end',
      }}>
        <Input
          prefix={<IconSearch />}
          placeholder={t('用户名')}
          value={username}
          onChange={setUsername}
          onEnterPress={handleSearch}
          style={{ width: 160 }}
          showClear
        />
        <Select
          placeholder={t('登录方式')}
          value={loginType}
          onChange={setLoginType}
          optionList={loginTypeOptions}
          style={{ width: 160 }}
        />
        <Input
          prefix={<IconSearch />}
          placeholder={t('IP地址')}
          value={loginIp}
          onChange={setLoginIp}
          onEnterPress={handleSearch}
          style={{ width: 160 }}
          showClear
        />
        <Space>
          <Button icon={<IconSearch />} theme="solid" type="primary" onClick={handleSearch}>
            {t('搜索')}
          </Button>
          <Button icon={<IconRefresh />} type="tertiary" onClick={handleReset}>
            {t('重置')}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
        pagination={{
          currentPage: page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: (size) => { setPageSize(size); setPage(1); },
          pageSizeOpts: [10, 20, 50],
          showSizeChanger: true,
          showTotal: true,
          formatShowTotal: (total) => `${t('共')} ${total} ${t('条')}`,
        }}
        scroll={{ x: isMobile ? 900 : undefined }}
        size="small"
        style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
      />
    </div>
  );
};

export default LoginLogPage;
