/*
Copyright (C) 2025 QuantumNous

Mobile-only sources view. Card list instead of table; sticky add button;
inline toggle.
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
  Tag,
} from '@douyinfe/semi-ui';
import { IconPlusCircle, IconDelete } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../../helpers';

const MobileSourcesTab = () => {
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
      if (res?.data?.success) setSources(res.data.data || []);
      else showError(res?.data?.message || t('加载失败'));
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
      if (res?.data?.success) await load();
      else showError(res?.data?.message || t('更新失败'));
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

  return (
    <div style={{ paddingBottom: 100 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {t('共 {{n}} 个源', { n: sources.length })}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : sources.length === 0 ? (
        <Empty
          image={<img src='/NoDataillustration.svg' style={{ width: 120, height: 120 }} />}
          darkModeImage={<img src='/NoDataillustration.svg' style={{ width: 120, height: 120 }} />}
          title={t('暂无源')}
          description={t('点击下方“添加源”创建第一个 RSS 或搜索关键词')}
          style={{ padding: 24 }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sources.map((s) => (
            <SourceCard
              key={s.id}
              source={s}
              onToggle={onToggle}
              onDelete={onDelete}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Sticky add button */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 12px max(12px, env(safe-area-inset-bottom))',
          background: 'var(--surface, #fff)',
          borderTop: '1px solid var(--border-subtle)',
          zIndex: 10,
        }}
      >
        <Button
          theme='solid'
          type='primary'
          icon={<IconPlusCircle />}
          onClick={() => setShowAdd(true)}
          size='large'
          block
        >
          {t('添加源')}
        </Button>
      </div>

      <Modal
        title={t('添加新闻源')}
        visible={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={onAdd}
        confirmLoading={creating}
        okText={t('添加')}
        fullScreen
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500 }}>{t('类型')}</label>
            <Select
              value={newType}
              onChange={setNewType}
              style={{ width: '100%', marginTop: 6 }}
              size='large'
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
              size='large'
              style={{ marginTop: 6 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

const SourceCard = ({ source, onToggle, onDelete, t }) => (
  <div
    style={{
      background: 'var(--surface, #fff)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: 14,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Tag color={source.type === 'rss' ? 'blue' : 'green'} size='small'>
        {source.type === 'rss' ? 'RSS' : t('搜索')}
      </Tag>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{source.id}</span>
      <div style={{ flex: 1 }} />
      <Switch
        checked={!!source.enabled}
        onChange={(b) => onToggle(source.id, b)}
        size='small'
      />
    </div>
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-primary)',
        wordBreak: 'break-all',
        marginBottom: 10,
        lineHeight: 1.5,
      }}
    >
      {source.value}
    </div>
    <Popconfirm
      title={t('确认删除该源?')}
      onConfirm={() => onDelete(source.id)}
    >
      <Button
        size='small'
        type='danger'
        theme='borderless'
        icon={<IconDelete />}
      >
        {t('删除')}
      </Button>
    </Popconfirm>
  </div>
);

export default MobileSourcesTab;
