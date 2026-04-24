/*
Copyright (C) 2025 QuantumNous

Mobile-only briefings tab. Card list + sticky FAB-style trigger button +
fullscreen modals for trigger / edit / social-publish. Independent state
from the desktop component — no prop drilling.
*/

import React, { useEffect, useState, useRef } from 'react';
import {
  Button,
  Empty,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Spin,
  Tabs,
  TabPane,
  Tag,
  TextArea,
} from '@douyinfe/semi-ui';
import {
  IconRefresh,
  IconImage,
  IconDelete,
  IconPlusCircle,
  IconChevronRight,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../../helpers';
import MobileBriefingEditor from './MobileBriefingEditor';
import MobileSocialPostModal from './MobileSocialPostModal';

const STATUS_COLORS = {
  draft: 'grey',
  approved: 'orange',
  sent: 'green',
  archived: 'pink',
};

const TYPE_LABELS = {
  deep: '深度分析',
  simple: '简单总结',
};

const PHASE_LABELS = {
  idle: '空闲',
  discovering: '正在收集候选',
  dedup: '正在去重',
  fetching: '正在抓取正文',
  generating: '正在生成简报',
  preview: '正在发送预览邮件',
  done: '已完成',
  failed: '失败',
};

const PHASE_COLORS = {
  discovering: 'blue',
  dedup: 'blue',
  fetching: 'blue',
  generating: 'blue',
  preview: 'cyan',
  done: 'green',
  failed: 'red',
  idle: 'grey',
};

const fmtTs = (ts) => (ts ? new Date(ts * 1000).toLocaleString() : '-');
const fmtDate = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const MobileBriefingsTab = () => {
  const { t } = useTranslation();
  const [briefings, setBriefings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [runStatus, setRunStatus] = useState(null);

  // edit modal
  const [editing, setEditing] = useState(null);

  // social modal
  const [socialBriefing, setSocialBriefing] = useState(null);

  // trigger modal
  const [triggerVisible, setTriggerVisible] = useState(false);
  const [triggerMode, setTriggerMode] = useState('auto');
  const [triggerUrls, setTriggerUrls] = useState('');
  const [triggerArticles, setTriggerArticles] = useState([
    { title: '', url: '', content: '' },
  ]);

  const loadRunStatus = async () => {
    try {
      const res = await API.get('/api/ai-news/admin/run-status');
      if (res?.data?.success) setRunStatus(res.data.data);
    } catch (e) {
      // best effort
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: pageSize });
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const res = await API.get(`/api/ai-news/admin/briefings?${params}`);
      if (res?.data?.success) {
        setBriefings(res.data.data?.items || []);
        setTotal(res.data.data?.total || 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterType, filterStatus]);

  useEffect(() => {
    loadRunStatus();
    const id = setInterval(loadRunStatus, 5000);
    return () => clearInterval(id);
  }, []);

  const prevRunningRef = useRef(false);
  useEffect(() => {
    const isRunning = !!runStatus?.running;
    if (prevRunningRef.current && !isRunning) load();
    prevRunningRef.current = isRunning;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStatus?.running]);

  const openTrigger = () => {
    setTriggerMode('auto');
    setTriggerUrls('');
    setTriggerArticles([{ title: '', url: '', content: '' }]);
    setTriggerVisible(true);
  };

  const submitTrigger = async () => {
    let body = { mode: triggerMode };
    if (triggerMode === 'urls') {
      const urls = triggerUrls.split('\n').map((s) => s.trim()).filter(Boolean);
      if (urls.length === 0) {
        showError(t('请至少粘贴一条 URL'));
        return;
      }
      body.urls = urls;
    } else if (triggerMode === 'content') {
      const articles = triggerArticles
        .map((a) => ({
          title: (a.title || '').trim(),
          url: (a.url || '').trim(),
          content: (a.content || '').trim(),
        }))
        .filter((a) => a.content.length > 0);
      if (articles.length === 0) {
        showError(t('请至少填写一篇带正文的文章'));
        return;
      }
      body.articles = articles;
    }
    setTriggering(true);
    try {
      const res = await API.post('/api/ai-news/admin/trigger', body);
      if (res?.data?.success) {
        showSuccess(t('已触发,Agent 在后台运行'));
        setTriggerVisible(false);
        loadRunStatus();
      } else {
        showError(res?.data?.message || t('触发失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setTriggering(false);
    }
  };

  const openEdit = async (id) => {
    try {
      const res = await API.get(`/api/ai-news/admin/briefings/${id}`);
      if (res?.data?.success) setEditing(res.data.data);
      else showError(res?.data?.message || t('加载失败'));
    } catch (e) {
      showError(e);
    }
  };

  const onDelete = async (id) => {
    try {
      const res = await API.delete(`/api/ai-news/admin/briefings/${id}`);
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
      <RunStatusPanel data={runStatus} t={t} />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Select
          value={filterType}
          onChange={(v) => {
            setPage(1);
            setFilterType(v);
          }}
          placeholder={t('类型')}
          style={{ flex: 1 }}
          size='large'
        >
          <Select.Option value=''>{t('全部类型')}</Select.Option>
          <Select.Option value='deep'>{t('深度分析')}</Select.Option>
          <Select.Option value='simple'>{t('简单总结')}</Select.Option>
        </Select>
        <Select
          value={filterStatus}
          onChange={(v) => {
            setPage(1);
            setFilterStatus(v);
          }}
          placeholder={t('状态')}
          style={{ flex: 1 }}
          size='large'
        >
          <Select.Option value=''>{t('全部状态')}</Select.Option>
          <Select.Option value='draft'>draft</Select.Option>
          <Select.Option value='approved'>approved</Select.Option>
          <Select.Option value='sent'>sent</Select.Option>
          <Select.Option value='archived'>archived</Select.Option>
        </Select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : briefings.length === 0 ? (
        <Empty
          image={<img src='/NoDataillustration.svg' style={{ width: 120, height: 120 }} />}
          darkModeImage={<img src='/NoDataillustration.svg' style={{ width: 120, height: 120 }} />}
          title={t('暂无简报')}
          description={t('点击下方按钮生成第一份')}
          style={{ padding: 24 }}
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {briefings.map((b) => (
              <BriefingCard
                key={b.id}
                briefing={b}
                onOpen={() => openEdit(b.id)}
                onPublish={() => setSocialBriefing(b)}
                onDelete={() => onDelete(b.id)}
                t={t}
              />
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              total={total}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              size='small'
            />
          </div>
        </>
      )}

      {/* Sticky trigger button */}
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
          icon={<IconRefresh />}
          onClick={openTrigger}
          size='large'
          block
        >
          {t('立即触发 Agent')}
        </Button>
      </div>

      {/* Trigger modal — fullscreen */}
      <Modal
        title={t('触发 AI 前沿 Agent')}
        visible={triggerVisible}
        onCancel={() => setTriggerVisible(false)}
        onOk={submitTrigger}
        confirmLoading={triggering}
        okText={t('开始生成')}
        cancelText={t('取消')}
        fullScreen
      >
        <Tabs type='line' activeKey={triggerMode} onChange={setTriggerMode}>
          <TabPane tab={t('自动')} itemKey='auto'>
            <div style={{ padding: '12px 4px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {t('使用"信息源"页配置的 RSS / 搜索词,自动收集候选,经 Jina 抓取正文后交给 LLM 生成深度 + 简单两份简报。')}
            </div>
          </TabPane>
          <TabPane tab={t('手动 URLs')} itemKey='urls'>
            <div style={{ padding: '12px 4px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {t('每行一条链接')}
              </div>
              <TextArea
                value={triggerUrls}
                onChange={setTriggerUrls}
                placeholder={'https://example.com/article-1\nhttps://example.com/article-2'}
                autosize={{ minRows: 6, maxRows: 12 }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>
          </TabPane>
          <TabPane tab={t('手动正文')} itemKey='content'>
            <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {triggerArticles.map((a, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 10,
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    background: 'var(--bg-subtle, #fafafa)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      {t('文章')} #{idx + 1}
                    </span>
                    <div style={{ flex: 1 }} />
                    {triggerArticles.length > 1 ? (
                      <Button
                        size='small'
                        icon={<IconDelete />}
                        type='danger'
                        theme='borderless'
                        onClick={() =>
                          setTriggerArticles((prev) => prev.filter((_, i) => i !== idx))
                        }
                      />
                    ) : null}
                  </div>
                  <Input
                    value={a.title}
                    onChange={(v) =>
                      setTriggerArticles((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                      )
                    }
                    placeholder={t('标题(选填)')}
                    style={{ marginBottom: 8 }}
                  />
                  <Input
                    value={a.url}
                    onChange={(v) =>
                      setTriggerArticles((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, url: v } : x)),
                      )
                    }
                    placeholder={t('URL(选填)')}
                    style={{ marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  />
                  <TextArea
                    value={a.content}
                    onChange={(v) =>
                      setTriggerArticles((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, content: v } : x)),
                      )
                    }
                    placeholder={t('正文(必填)')}
                    autosize={{ minRows: 4, maxRows: 10 }}
                  />
                </div>
              ))}
              <Button
                icon={<IconPlusCircle />}
                onClick={() =>
                  setTriggerArticles((prev) => [...prev, { title: '', url: '', content: '' }])
                }
                block
              >
                {t('添加一篇')}
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </Modal>

      {/* Edit modal */}
      <MobileBriefingEditor
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          await load();
        }}
        t={t}
      />

      {/* Social-publish modal */}
      <MobileSocialPostModal
        briefing={socialBriefing}
        onClose={() => setSocialBriefing(null)}
        t={t}
      />
    </div>
  );
};

const BriefingCard = ({ briefing, onOpen, onPublish, onDelete, t }) => (
  <div
    style={{
      background: 'var(--surface, #fff)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: 14,
    }}
  >
    {/* meta strip */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <Tag color={briefing.type === 'deep' ? 'violet' : 'cyan'} size='small'>
        {t(TYPE_LABELS[briefing.type] || briefing.type)}
      </Tag>
      <Tag color={STATUS_COLORS[briefing.status] || 'grey'} size='small'>
        {briefing.status}
      </Tag>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{briefing.id}</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {fmtDate(briefing.generated_at)}
      </span>
    </div>

    {/* title — primary tap target */}
    <div
      onClick={onOpen}
      role='button'
      style={{
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--text-primary)',
        marginBottom: 4,
        lineHeight: 1.45,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
      }}
    >
      <span style={{ flex: 1 }}>{briefing.title}</span>
      <IconChevronRight style={{ marginTop: 2, color: 'var(--text-muted)' }} />
    </div>
    {briefing.summary ? (
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: 12,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {briefing.summary}
      </div>
    ) : null}

    {/* actions */}
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {briefing.sent_at ? (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {t('已发送')} · {fmtDate(briefing.sent_at)}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('未发送')}</span>
      )}
      <div style={{ flex: 1 }} />
      {briefing.type === 'deep' ? (
        <Button
          size='small'
          icon={<IconImage />}
          onClick={onPublish}
        >
          {t('发布')}
        </Button>
      ) : null}
      <Popconfirm title={t('确认删除?')} onConfirm={onDelete}>
        <Button size='small' type='danger' theme='borderless' icon={<IconDelete />} />
      </Popconfirm>
    </div>
  </div>
);

const RunStatusPanel = ({ data, t }) => {
  if (!data) return null;
  const status = data.status || {};
  const isRunning = !!data.running;
  const phase = status.phase || 'idle';
  const dim = !isRunning && phase === 'idle';
  if (dim && !status.last_run_at) return null;

  return (
    <div
      style={{
        background: 'var(--bg-subtle, #fafafa)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag color={PHASE_COLORS[phase] || 'grey'} size='small'>
          {t(PHASE_LABELS[phase] || phase)}
        </Tag>
        {isRunning ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {status.note || ''}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {status.last_run_at ? `${t('上次运行')}: ${fmtTs(status.last_run_at)}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default MobileBriefingsTab;
