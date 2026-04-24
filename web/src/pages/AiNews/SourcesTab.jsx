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

import React, { useEffect, useState } from 'react';
import {
  Button,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
  Table,
  Tag,
} from '@douyinfe/semi-ui';
import { IconPlusCircle } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';

const SourcesTab = () => {
  const { t } = useTranslation();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState('rss');
  const [newValue, setNewValue] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/ai-news/admin/sources');
      if (res?.data?.success) {
        setSources(res.data.data || []);
      } else {
        showError(res?.data?.message || t('加载失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAdd = async () => {
    if (!newValue.trim()) {
      showError(t('请填写值'));
      return;
    }
    setCreating(true);
    try {
      const res = await API.post('/api/ai-news/admin/sources', {
        type: newType,
        value: newValue.trim(),
        enabled: true,
      });
      if (res?.data?.success) {
        showSuccess(t('已添加'));
        setShowAdd(false);
        setNewValue('');
        await load();
      } else {
        showError(res?.data?.message || t('添加失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setCreating(false);
    }
  };

  const onToggle = async (id, enabled) => {
    try {
      const res = await API.put(`/api/ai-news/admin/sources/${id}`, { enabled });
      if (res?.data?.success) {
        await load();
      } else {
        showError(res?.data?.message || t('更新失败'));
      }
    } catch (e) {
      showError(e);
    }
  };

  const onDelete = async (id) => {
    try {
      const res = await API.delete(`/api/ai-news/admin/sources/${id}`);
      if (res?.data?.success) {
        showSuccess(t('已删除'));
        await load();
      } else {
        showError(res?.data?.message || t('删除失败'));
      }
    } catch (e) {
      showError(e);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: t('类型'),
      dataIndex: 'type',
      width: 100,
      render: (v) => (
        <Tag color={v === 'rss' ? 'blue' : 'green'} size='small'>
          {v === 'rss' ? 'RSS' : t('搜索')}
        </Tag>
      ),
    },
    {
      title: t('值'),
      dataIndex: 'value',
      render: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: t('启用'),
      dataIndex: 'enabled',
      width: 80,
      render: (v, record) => (
        <Switch
          checked={!!v}
          onChange={(b) => onToggle(record.id, b)}
          size='small'
        />
      ),
    },
    {
      title: '',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title={t('确认删除该源?')}
          onConfirm={() => onDelete(record.id)}
        >
          <Button size='small' type='danger'>
            {t('删除')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {t('共 {{n}} 个源', { n: sources.length })}
        </span>
        <Button
          theme='solid'
          type='primary'
          icon={<IconPlusCircle />}
          onClick={() => setShowAdd(true)}
        >
          {t('添加源')}
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : sources.length === 0 ? (
        <Empty
          image={
            <img src='/NoDataillustration.svg' style={{ width: 150, height: 150 }} />
          }
          darkModeImage={
            <img src='/NoDataillustration.svg' style={{ width: 150, height: 150 }} />
          }
          title={t('暂无源')}
          description={t('点击右上角“添加源”创建第一个 RSS 或搜索关键词')}
          style={{ padding: 30 }}
        />
      ) : (
        <Table columns={columns} dataSource={sources} rowKey='id' pagination={false} />
      )}

      <Modal
        title={t('添加新闻源')}
        visible={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={onAdd}
        confirmLoading={creating}
        okText={t('添加')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500 }}>{t('类型')}</label>
            <Select
              value={newType}
              onChange={setNewType}
              style={{ width: '100%', marginTop: 6 }}
            >
              <Select.Option value='rss'>RSS feed</Select.Option>
              <Select.Option value='search'>{t('搜索关键词 (Jina)')}</Select.Option>
            </Select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              {newType === 'rss' ? t('Feed URL') : t('搜索关键词')}
            </label>
            <Input
              value={newValue}
              onChange={setNewValue}
              placeholder={
                newType === 'rss'
                  ? 'https://example.com/feed.xml'
                  : 'AI agent latest news'
              }
              style={{ marginTop: 6 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SourcesTab;
