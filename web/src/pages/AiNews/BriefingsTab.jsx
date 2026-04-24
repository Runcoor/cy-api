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
  Pagination,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tabs,
  TabPane,
  Tag,
  TextArea,
} from '@douyinfe/semi-ui';
import { IconRefresh, IconSend, IconPlusCircle, IconDelete, IconClose, IconImage, IconDownload } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';

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

const fmtDuration = (start, end) => {
  if (!start) return '-';
  const finish = end || Math.floor(Date.now() / 1000);
  const sec = Math.max(0, finish - start);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
};

const BriefingsTab = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [briefings, setBriefings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [runStatus, setRunStatus] = useState(null);
  const [showNotes, setShowNotes] = useState(false);

  const [editing, setEditing] = useState(null); // briefing object
  const [editForm, setEditForm] = useState({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('edit');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Preview tab state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');

  // Recipients tab state
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientsPage, setRecipientsPage] = useState(1);
  const [recipientsSearch, setRecipientsSearch] = useState('');
  const [recipientsDiag, setRecipientsDiag] = useState(null);

  // Trigger modal state
  const [triggerVisible, setTriggerVisible] = useState(false);
  const [triggerMode, setTriggerMode] = useState('auto');
  const [triggerUrls, setTriggerUrls] = useState('');
  const [triggerArticles, setTriggerArticles] = useState([
    { title: '', url: '', content: '' },
  ]);

  // Social-publish modal state
  const [socialVisible, setSocialVisible] = useState(false);
  const [socialBriefing, setSocialBriefing] = useState(null);
  const [socialPost, setSocialPost] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialGenerating, setSocialGenerating] = useState(false);

  const loadRunStatus = async () => {
    try {
      const res = await API.get('/api/ai-news/admin/run-status');
      if (res?.data?.success) {
        setRunStatus(res.data.data);
      }
    } catch (e) {
      // silent — status panel is best-effort
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

  // Refresh briefings list once a run finishes (so newly created drafts show up)
  const prevRunningRef = React.useRef(false);
  useEffect(() => {
    const isRunning = !!runStatus?.running;
    if (prevRunningRef.current && !isRunning) {
      load();
    }
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
      const urls = triggerUrls
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
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
        showSuccess(t('已触发,Agent 在后台运行,请关注下方状态'));
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

  const updateArticle = (idx, patch) => {
    setTriggerArticles((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    );
  };
  const addArticle = () => {
    setTriggerArticles((prev) => [...prev, { title: '', url: '', content: '' }]);
  };
  const removeArticle = (idx) => {
    setTriggerArticles((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== idx),
    );
  };

  const openEdit = async (id) => {
    try {
      const res = await API.get(`/api/ai-news/admin/briefings/${id}`);
      if (res?.data?.success) {
        const b = res.data.data;
        setEditing(b);
        setEditForm({
          title: b.title || '',
          summary: b.summary || '',
          content: b.content || '',
          plan_ids_json: b.plan_ids_json || '[]',
          status: b.status || 'draft',
        });
        setActiveEditTab('edit');
        setPreviewHtml('');
        setPreviewSubject('');
        setRecipients([]);
        setRecipientsTotal(0);
        setRecipientsPage(1);
        setRecipientsSearch('');
        setSheetVisible(true);
      } else {
        showError(res?.data?.message || t('加载失败'));
      }
    } catch (e) {
      showError(e);
    }
  };

  const loadPreview = async () => {
    if (!editing) return;
    setPreviewLoading(true);
    try {
      const res = await API.get(`/api/ai-news/admin/briefings/${editing.id}/preview`);
      if (res?.data?.success) {
        setPreviewHtml(res.data.data?.html || '');
        setPreviewSubject(res.data.data?.subject || '');
      } else {
        showError(res?.data?.message || t('加载预览失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadRecipients = async (pageOverride) => {
    if (!editing) return;
    const page = pageOverride || recipientsPage;
    setRecipientsLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: 20 });
      if (recipientsSearch.trim()) params.set('search', recipientsSearch.trim());
      const res = await API.get(
        `/api/ai-news/admin/briefings/${editing.id}/recipients?${params}`,
      );
      if (res?.data?.success) {
        setRecipients(res.data.data?.items || []);
        setRecipientsTotal(res.data.data?.total || 0);
        setRecipientsDiag(res.data.data?.diagnostic || null);
      } else {
        showError(res?.data?.message || t('加载收件人失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setRecipientsLoading(false);
    }
  };

  // Auto-load each tab's data when it becomes active.
  useEffect(() => {
    if (!sheetVisible || !editing) return;
    if (activeEditTab === 'preview' && !previewHtml) {
      loadPreview();
    }
    if (activeEditTab === 'recipients' && recipients.length === 0 && !recipientsLoading) {
      loadRecipients(1);
      setRecipientsPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditTab, sheetVisible]);

  // Refresh preview if user just saved while preview tab was open.
  const refreshPreview = () => {
    setPreviewHtml('');
    if (activeEditTab === 'preview') {
      loadPreview();
    }
  };

  const onSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await API.put(
        `/api/ai-news/admin/briefings/${editing.id}`,
        editForm,
      );
      if (res?.data?.success) {
        showSuccess(t('已保存'));
        await load();
        refreshPreview();
        // Plan-id changes affect recipient list; refresh if user is on that tab.
        if (activeEditTab === 'recipients') {
          loadRecipients(1);
          setRecipientsPage(1);
        }
      } else {
        showError(res?.data?.message || t('保存失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const onSend = async () => {
    if (!editing) return;
    setSending(true);
    try {
      const res = await API.post(
        `/api/ai-news/admin/briefings/${editing.id}/send`,
      );
      if (res?.data?.success) {
        const { sent, failed } = res.data.data || {};
        showSuccess(t('已发送 {{s}} 成功,{{f}} 失败', { s: sent, f: failed }));
        setSheetVisible(false);
        await load();
      } else {
        showError(res?.data?.message || t('发送失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setSending(false);
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

  const openSocial = async (record) => {
    setSocialBriefing(record);
    setSocialPost(null);
    setSocialVisible(true);
    setSocialLoading(true);
    try {
      const res = await API.get(`/api/ai-news/admin/briefings/${record.id}/social`);
      if (res?.data?.success) {
        setSocialPost(res.data.data?.exists ? res.data.data.post : null);
      }
    } catch (e) {
      // first-time open: no row yet — fine
    } finally {
      setSocialLoading(false);
    }
  };

  const generateSocialPost = async () => {
    if (!socialBriefing) return;
    setSocialGenerating(true);
    try {
      const res = await API.post(
        `/api/ai-news/admin/briefings/${socialBriefing.id}/social`,
      );
      if (res?.data?.success) {
        setSocialPost(res.data.data);
        showSuccess(t('生成完成'));
      } else {
        showError(res?.data?.message || t('生成失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setSocialGenerating(false);
    }
  };

  const downloadSocialZip = () => {
    if (!socialBriefing) return;
    window.open(
      `/api/ai-news/admin/briefings/${socialBriefing.id}/social/zip`,
      '_blank',
    );
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: t('类型'),
      dataIndex: 'type',
      width: 100,
      render: (v) => (
        <Tag color={v === 'deep' ? 'violet' : 'cyan'} size='small'>
          {t(TYPE_LABELS[v] || v)}
        </Tag>
      ),
    },
    {
      title: t('标题'),
      dataIndex: 'title',
      render: (v, record) => (
        <a
          onClick={() => openEdit(record.id)}
          style={{ color: 'var(--accent)', cursor: 'pointer' }}
        >
          {v}
        </a>
      ),
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 100,
      render: (v) => (
        <Tag color={STATUS_COLORS[v] || 'grey'} size='small'>
          {v}
        </Tag>
      ),
    },
    {
      title: t('生成时间'),
      dataIndex: 'generated_at',
      width: 170,
      render: (v) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {fmtTs(v)}
        </span>
      ),
    },
    {
      title: t('发送时间'),
      dataIndex: 'sent_at',
      width: 170,
      render: (v) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {fmtTs(v)}
        </span>
      ),
    },
    {
      title: '',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {record.type === 'deep' ? (
            <Button
              size='small'
              icon={<IconImage />}
              onClick={() => openSocial(record)}
            >
              {t('发布')}
            </Button>
          ) : null}
          <Popconfirm
            title={t('确认删除?')}
            onConfirm={() => onDelete(record.id)}
          >
            <Button size='small' type='danger'>
              {t('删除')}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 12 }}>
      <RunStatusPanel
        data={runStatus}
        onToggleNotes={() => setShowNotes((v) => !v)}
        showNotes={showNotes}
        t={t}
      />
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Select
          value={filterType}
          onChange={(v) => {
            setPage(1);
            setFilterType(v);
          }}
          placeholder={t('类型')}
          style={{ width: 140 }}
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
          style={{ width: 140 }}
        >
          <Select.Option value=''>{t('全部状态')}</Select.Option>
          <Select.Option value='draft'>draft</Select.Option>
          <Select.Option value='approved'>approved</Select.Option>
          <Select.Option value='sent'>sent</Select.Option>
          <Select.Option value='archived'>archived</Select.Option>
        </Select>
        <div style={{ flex: 1 }} />
        <Button
          theme='solid'
          type='primary'
          icon={<IconRefresh />}
          onClick={openTrigger}
        >
          {t('立即触发 Agent')}
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : briefings.length === 0 ? (
        <Empty
          image={
            <img src='/NoDataillustration.svg' style={{ width: 150, height: 150 }} />
          }
          darkModeImage={
            <img src='/NoDataillustration.svg' style={{ width: 150, height: 150 }} />
          }
          title={t('暂无简报')}
          description={t('点击右上角“立即触发 Agent”生成第一份简报')}
          style={{ padding: 30 }}
        />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={briefings}
            rowKey='id'
            pagination={false}
            scroll={{ x: 760 }}
          />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              total={total}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <Modal
        visible={sheetVisible}
        onCancel={() => setSheetVisible(false)}
        fullScreen={isMobile}
        width={isMobile ? undefined : 'min(1200px, 92vw)'}
        height={isMobile ? undefined : '85vh'}
        footer={null}
        closeOnEsc
        title={null}
        header={null}
        bodyStyle={{
          padding: 0,
          height: isMobile ? '100%' : '85vh',
          overflow: 'hidden',
        }}
        style={isMobile ? undefined : { borderRadius: 12, overflow: 'hidden' }}
      >
        {editing ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              background: 'var(--surface, #fff)',
            }}
          >
            {/* Header bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '10px 12px' : '14px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}
            >
              <Tag color={editing.type === 'deep' ? 'violet' : 'cyan'} size='small'>
                {t(TYPE_LABELS[editing.type] || editing.type)}
              </Tag>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                #{editing.id}
              </span>
              <Tag color={STATUS_COLORS[editing.status] || 'grey'} size='small'>
                {editing.status}
              </Tag>
              {!isMobile ? (
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    marginLeft: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 320,
                  }}
                >
                  {editForm.title || editing.title}
                </span>
              ) : null}
              <div style={{ flex: 1 }} />
              <Button size={isMobile ? 'small' : 'default'} onClick={onSave} loading={saving}>
                {t('保存')}
              </Button>
              <Popconfirm
                title={t('确认发送给所有匹配的活跃订阅用户?')}
                onConfirm={onSend}
              >
                <Button
                  size={isMobile ? 'small' : 'default'}
                  theme='solid'
                  type='primary'
                  icon={<IconSend />}
                  loading={sending}
                  disabled={editing.status === 'sent'}
                >
                  {recipientsTotal > 0
                    ? isMobile
                      ? t('发送 ({{n}})', { n: recipientsTotal })
                      : t('发送给 {{n}} 位用户', { n: recipientsTotal })
                    : t('发送')}
                </Button>
              </Popconfirm>
              <Button
                size={isMobile ? 'small' : 'default'}
                icon={<IconClose />}
                theme='borderless'
                onClick={() => setSheetVisible(false)}
              />
            </div>

            {/* Tabs */}
            <Tabs
              type='line'
              activeKey={activeEditTab}
              onChange={setActiveEditTab}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
              contentStyle={{ flex: 1, overflow: 'hidden', minHeight: 0 }}
            >
              <TabPane tab={t('编辑')} itemKey='edit'>
                <EditForm
                  editForm={editForm}
                  setEditForm={setEditForm}
                  editing={editing}
                  t={t}
                />
              </TabPane>
              <TabPane tab={t('邮件预览')} itemKey='preview'>
                <PreviewPane
                  loading={previewLoading}
                  html={previewHtml}
                  subject={previewSubject}
                  onRefresh={loadPreview}
                  t={t}
                />
              </TabPane>
              <TabPane
                tab={
                  recipientsTotal > 0
                    ? `${t('收件人')} (${recipientsTotal})`
                    : t('收件人')
                }
                itemKey='recipients'
              >
                <RecipientsPane
                  loading={recipientsLoading}
                  items={recipients}
                  total={recipientsTotal}
                  diagnostic={recipientsDiag}
                  page={recipientsPage}
                  search={recipientsSearch}
                  onSearchChange={setRecipientsSearch}
                  onSearchSubmit={() => {
                    setRecipientsPage(1);
                    loadRecipients(1);
                  }}
                  onPageChange={(p) => {
                    setRecipientsPage(p);
                    loadRecipients(p);
                  }}
                  onRefresh={() => loadRecipients(recipientsPage)}
                  briefing={editing}
                  t={t}
                />
              </TabPane>
            </Tabs>
          </div>
        ) : null}
      </Modal>

      <Modal
        title={t('触发 AI 前沿 Agent')}
        visible={triggerVisible}
        onCancel={() => setTriggerVisible(false)}
        onOk={submitTrigger}
        confirmLoading={triggering}
        okText={t('开始生成')}
        cancelText={t('取消')}
        width={720}
      >
        <Tabs
          type='line'
          activeKey={triggerMode}
          onChange={setTriggerMode}
        >
          <TabPane tab={t('自动 (默认)')} itemKey='auto'>
            <div style={{ padding: '12px 4px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {t('使用“信息源”页配置的 RSS / 搜索词,自动收集候选,经 Jina 抓取正文后交给 LLM 生成深度 + 简单两份简报。')}
              <br />
              {t('适合日常使用 / 定时任务。')}
            </div>
          </TabPane>

          <TabPane tab={t('手动 URLs')} itemKey='urls'>
            <div style={{ padding: '12px 4px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {t('每行一条 http(s) 链接。Agent 会跳过去重,通过 Jina 抓取正文后生成简报。')}
              </div>
              <TextArea
                value={triggerUrls}
                onChange={setTriggerUrls}
                placeholder={'https://example.com/article-1\nhttps://example.com/article-2'}
                autosize={{ minRows: 8, maxRows: 16 }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>
          </TabPane>

          <TabPane tab={t('手动正文')} itemKey='content'>
            <div style={{ padding: '12px 4px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {t('粘贴文章正文,Agent 会跳过抓取,直接用这些内容交给 LLM 生成简报。URL 选填(用于来源引用)。')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {triggerArticles.map((a, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      background: 'var(--bg-subtle, #fafafa)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {t('文章')} #{idx + 1}
                      </span>
                      <div style={{ flex: 1 }} />
                      {triggerArticles.length > 1 ? (
                        <Button
                          size='small'
                          icon={<IconDelete />}
                          type='danger'
                          theme='borderless'
                          onClick={() => removeArticle(idx)}
                        >
                          {t('移除')}
                        </Button>
                      ) : null}
                    </div>
                    <Input
                      value={a.title}
                      onChange={(v) => updateArticle(idx, { title: v })}
                      placeholder={t('标题(选填)')}
                      style={{ marginBottom: 8 }}
                    />
                    <Input
                      value={a.url}
                      onChange={(v) => updateArticle(idx, { url: v })}
                      placeholder={t('URL(选填,用于来源引用)')}
                      style={{ marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    />
                    <TextArea
                      value={a.content}
                      onChange={(v) => updateArticle(idx, { content: v })}
                      placeholder={t('正文(必填,Markdown 或纯文本均可)')}
                      autosize={{ minRows: 6, maxRows: 14 }}
                    />
                  </div>
                ))}
                <Button
                  icon={<IconPlusCircle />}
                  onClick={addArticle}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {t('添加一篇')}
                </Button>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Modal>

      <SocialPostModal
        visible={socialVisible}
        briefing={socialBriefing}
        post={socialPost}
        loading={socialLoading}
        generating={socialGenerating}
        onClose={() => setSocialVisible(false)}
        onGenerate={generateSocialPost}
        onDownload={downloadSocialZip}
        isMobile={isMobile}
        t={t}
      />
    </div>
  );
};

const EditForm = ({ editForm, setEditForm, editing, t }) => (
  <div
    style={{
      height: '100%',
      overflowY: 'auto',
      padding: '20px 24px',
    }}
  >
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500 }}>{t('标题')}</label>
        <Input
          value={editForm.title}
          onChange={(v) => setEditForm({ ...editForm, title: v })}
          style={{ marginTop: 6 }}
        />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500 }}>{t('摘要')}</label>
        <TextArea
          value={editForm.summary}
          onChange={(v) => setEditForm({ ...editForm, summary: v })}
          autosize={{ minRows: 2, maxRows: 4 }}
          style={{ marginTop: 6 }}
        />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500 }}>
          {t('正文 (Markdown)')}
        </label>
        <TextArea
          value={editForm.content}
          onChange={(v) => setEditForm({ ...editForm, content: v })}
          autosize={{ minRows: 18, maxRows: 40 }}
          style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500 }}>
            {t('推送范围 (Plan IDs)')}
          </label>
          <Input
            value={editForm.plan_ids_json}
            onChange={(v) => setEditForm({ ...editForm, plan_ids_json: v })}
            placeholder='[] 或 [1,2,3]'
            style={{ marginTop: 6, fontFamily: 'var(--font-mono)' }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>
            {t('空 [] = 所有有活跃订阅的用户;[1,2,3] = 仅指定 plan。改完保存后切到“收件人”页查看实际推送列表。')}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500 }}>{t('状态')}</label>
          <Select
            value={editForm.status}
            onChange={(v) => setEditForm({ ...editForm, status: v })}
            style={{ width: '100%', marginTop: 6 }}
          >
            <Select.Option value='draft'>draft · {t('草稿(待审核)')}</Select.Option>
            <Select.Option value='approved'>approved · {t('已审核(可发送)')}</Select.Option>
            <Select.Option value='archived'>archived · {t('归档(URL 可重新抓取)')}</Select.Option>
          </Select>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>
            {t('archived 状态下 dedup 不会拦同一批 URL,可以重跑生成新草稿。')}
          </div>
        </div>
      </div>
      {editing.sources_json ? (
        <div>
          <label style={{ fontSize: 13, fontWeight: 500 }}>{t('来源')}</label>
          <SourcesPreview json={editing.sources_json} />
        </div>
      ) : null}
    </div>
  </div>
);

const PreviewPane = ({ loading, html, subject, onRefresh, t }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('邮件主题')}:</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
        {subject || '-'}
      </span>
      <div style={{ flex: 1 }} />
      <Button size='small' icon={<IconRefresh />} onClick={onRefresh} loading={loading}>
        {t('刷新预览')}
      </Button>
    </div>
    <div style={{ flex: 1, overflow: 'hidden', background: '#f5f5f7', padding: 16 }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : html ? (
        <iframe
          title='email preview'
          srcDoc={html}
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            background: '#fff',
          }}
          sandbox=''
        />
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
          {t('点击“刷新预览”加载邮件渲染结果')}
        </div>
      )}
    </div>
  </div>
);

const RecipientsPane = ({
  loading,
  items,
  total,
  diagnostic,
  page,
  search,
  onSearchChange,
  onSearchSubmit,
  onPageChange,
  onRefresh,
  briefing,
  t,
}) => {
  const cols = [
    {
      title: t('用户'),
      dataIndex: 'username',
      render: (v, r) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>
            {r.display_name || v || `#${r.user_id}`}
          </span>
          {r.display_name && v ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{v}</span>
          ) : null}
        </div>
      ),
    },
    {
      title: t('邮箱'),
      dataIndex: 'email',
      render: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: t('套餐'),
      dataIndex: 'plan_name',
      render: (v, r) => (
        <Tag size='small'>
          {v || `#${r.plan_id}`}
        </Tag>
      ),
    },
    {
      title: t('到期时间'),
      dataIndex: 'end_time',
      render: (v) =>
        v ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date(v * 1000).toLocaleDateString()}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('永不')}</span>
        ),
    },
    {
      title: t('状态'),
      dataIndex: 'already_sent',
      width: 100,
      render: (v) =>
        v ? (
          <Tag color='green' size='small'>
            {t('已收到')}
          </Tag>
        ) : (
          <Tag color='blue' size='small'>
            {t('待发送')}
          </Tag>
        ),
    },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {t('共匹配')} <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> {t('位用户')}
          {briefing?.plan_ids_json && briefing.plan_ids_json !== '[]' ? (
            <span style={{ marginLeft: 6 }}>
              · {t('plan_ids')}: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{briefing.plan_ids_json}</code>
            </span>
          ) : (
            <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>· {t('所有活跃订阅')}</span>
          )}
        </span>
        <div style={{ flex: 1 }} />
        <Input
          value={search}
          onChange={onSearchChange}
          onEnterPress={onSearchSubmit}
          placeholder={t('搜索用户名 / 邮箱 / 显示名')}
          style={{ width: 280 }}
          showClear
          onClear={() => {
            onSearchChange('');
            setTimeout(onSearchSubmit, 0);
          }}
        />
        <Button size='small' icon={<IconRefresh />} onClick={onRefresh} loading={loading}>
          {t('刷新')}
        </Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <RecipientsEmpty diagnostic={diagnostic} t={t} />
        ) : (
          <>
            <Table
              columns={cols}
              dataSource={items}
              rowKey='user_id'
              pagination={false}
              size='middle'
            />
            {total > 20 ? (
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination
                  total={total}
                  currentPage={page}
                  pageSize={20}
                  onPageChange={onPageChange}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

const FAILING_FILTER_LABELS = {
  no_plan_match: '该 plan_ids 下完全没有任何用户订阅记录(连过期/取消的都没有)。可能 plan_id 写错了。',
  no_active_status: '有订阅记录但没有 status=active 的(全是 expired / cancelled)。让用户重新订阅或在订阅管理里把状态调整为 active。',
  all_expired: '有 active 订阅,但都已经过期(end_time 在过去)。续费或调整 end_time。',
  all_users_disabled: '订阅都是 active 且未过期,但对应的用户账号被禁用(users.status != 1)。检查用户管理页。',
  no_email_addresses: '订阅、用户都正常,但用户没有填邮箱(users.email 为空)。引导用户绑定邮箱。',
};

const RecipientsEmpty = ({ diagnostic, t }) => {
  if (!diagnostic) {
    return (
      <Empty
        image={
          <img src='/NoDataillustration.svg' style={{ width: 150, height: 150 }} />
        }
        darkModeImage={
          <img src='/NoDataillustration.svg' style={{ width: 150, height: 150 }} />
        }
        title={t('没有匹配的收件人')}
        description={t('当前的 plan_ids 没有匹配到任何活跃订阅用户。改一下推送范围或检查订阅状态。')}
        style={{ padding: 30 }}
      />
    );
  }
  const stages = [
    { label: t('该 plan_ids 下的所有订阅记录'), count: diagnostic.total_subscriptions },
    { label: t('+ status = active'), count: diagnostic.after_status_active },
    { label: t('+ 未过期 (end_time = 0 或 > now)'), count: diagnostic.after_not_expired },
    { label: t('+ 用户启用 (users.status = 1)'), count: diagnostic.after_user_enabled },
    { label: t('+ 邮箱非空'), count: diagnostic.after_has_email },
    { label: t('= 去重后的最终收件人数'), count: diagnostic.distinct_users, highlight: true },
  ];
  const breakdown = diagnostic.status_breakdown || {};
  const breakdownKeys = Object.keys(breakdown);
  const hint = diagnostic.first_failing_filter
    ? t(FAILING_FILTER_LABELS[diagnostic.first_failing_filter] || diagnostic.first_failing_filter)
    : '';
  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 24px' }}>
      <div
        style={{
          padding: 20,
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          background: 'var(--surface, #fff)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
          {t('当前 plan_ids 没有匹配到收件人')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          plan_ids: <code style={{ fontFamily: 'var(--font-mono)' }}>
            {JSON.stringify(diagnostic.plan_ids || [])}
          </code>
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{t('过滤过程')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {stages.map((s, i) => {
            const dropped = i > 0 && stages[i - 1].count > s.count;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: s.highlight
                    ? 'var(--semi-color-primary-light-default, #eff6ff)'
                    : dropped && s.count === 0
                      ? 'var(--semi-color-danger-light-default, #fef2f2)'
                      : 'transparent',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{ flex: 1, color: dropped && s.count === 0 ? 'var(--semi-color-danger, #dc2626)' : 'var(--text-primary)' }}>
                  {s.label}
                </span>
                <strong style={{ color: dropped && s.count === 0 ? 'var(--semi-color-danger, #dc2626)' : 'var(--text-primary)' }}>
                  {s.count}
                </strong>
                {dropped ? (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>
                    -{stages[i - 1].count - s.count}
                  </span>
                ) : (
                  <span style={{ minWidth: 60 }}></span>
                )}
              </div>
            );
          })}
        </div>

        {breakdownKeys.length > 0 ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              {t('该 plan_ids 下的订阅状态分布')}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {breakdownKeys.map((k) => (
                <Tag key={k} size='small' color={k === 'active' ? 'green' : 'grey'}>
                  {k}: {breakdown[k]}
                </Tag>
              ))}
            </div>
          </>
        ) : null}

        {hint ? (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'var(--semi-color-warning-light-default, #fffbeb)',
              border: '1px solid var(--semi-color-warning-light-active, #fde68a)',
              fontSize: 13,
              color: 'var(--text-primary)',
              lineHeight: 1.6,
            }}
          >
            <strong>{t('诊断')}:</strong> {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const RunStatusPanel = ({ data, onToggleNotes, showNotes, t }) => {
  const status = data?.status;
  if (!status || !status.phase) {
    return null;
  }
  const running = !!data?.running;
  const phase = status.phase;
  const phaseLabel = t(PHASE_LABELS[phase] || phase);
  const color = PHASE_COLORS[phase] || 'grey';
  const stats = [];
  if (status.sources_enabled) stats.push(`${t('启用源')} ${status.sources_enabled}`);
  if (status.candidates_found) stats.push(`${t('候选')} ${status.candidates_found}`);
  if (status.candidates_after_dedup) stats.push(`${t('去重后')} ${status.candidates_after_dedup}`);
  if (status.bodies_fetched) stats.push(`${t('已抓取')} ${status.bodies_fetched}`);
  if (status.deep_briefing_id) stats.push(`${t('深度')} #${status.deep_briefing_id}`);
  if (status.simple_briefing_id) stats.push(`${t('简单')} #${status.simple_briefing_id}`);

  return (
    <div
      style={{
        marginBottom: 16,
        padding: '12px 16px',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        background: 'var(--bg-subtle, #fafafa)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {t('上次运行')}:
        </span>
        <Tag color={color} size='small'>
          {phaseLabel}
          {running ? ' …' : ''}
        </Tag>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {t('开始')} {fmtTs(status.started_at)} · {t('耗时')} {fmtDuration(status.started_at, status.finished_at)}
        </span>
        {status.triggered_by ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            · {t('管理员触发')} #{status.triggered_by}
          </span>
        ) : status.started_at ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {t('定时任务')}</span>
        ) : null}
        <div style={{ flex: 1 }} />
        {status.notes && status.notes.length > 0 ? (
          <Button size='small' onClick={onToggleNotes}>
            {showNotes ? t('隐藏日志') : t('查看日志')} ({status.notes.length})
          </Button>
        ) : null}
      </div>
      {stats.length > 0 ? (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
      ) : null}
      {status.error_msg ? (
        <div
          style={{
            marginTop: 8,
            padding: '8px 10px',
            border: '1px solid var(--semi-color-danger-light-default, #fecaca)',
            background: 'var(--semi-color-danger-light-default, #fef2f2)',
            color: 'var(--semi-color-danger, #dc2626)',
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: 'pre-wrap',
          }}
        >
          <strong>{t('错误')}:</strong> {status.error_msg}
        </div>
      ) : null}
      {showNotes && status.notes && status.notes.length > 0 ? (
        <pre
          style={{
            marginTop: 8,
            padding: 10,
            background: 'var(--surface-secondary, #f5f5f7)',
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            maxHeight: 240,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {status.notes.join('\n')}
        </pre>
      ) : null}
    </div>
  );
};

const SourcesPreview = ({ json }) => {
  let items = [];
  try {
    items = JSON.parse(json) || [];
  } catch (e) {
    return <span style={{ color: 'var(--text-muted)' }}>(invalid)</span>;
  }
  if (items.length === 0) {
    return <span style={{ color: 'var(--text-muted)' }}>(none)</span>;
  }
  return (
    <ol
      style={{
        marginTop: 6,
        paddingLeft: 20,
        fontSize: 12,
        color: 'var(--text-secondary)',
      }}
    >
      {items.map((s, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          <a href={s.url} target='_blank' rel='noreferrer' style={{ color: 'var(--accent)' }}>
            {s.title || s.url}
          </a>
        </li>
      ))}
    </ol>
  );
};

const SOCIAL_KIND_LABELS = {
  image_only: '纯图卡片',
  text_image: '图文笔记',
};

const SocialPostModal = ({
  visible,
  briefing,
  post,
  loading,
  generating,
  onClose,
  onGenerate,
  onDownload,
  isMobile,
  t,
}) => {
  const hasPost = !!post;
  const isBusy = loading || generating;
  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      fullScreen={isMobile}
      width={isMobile ? undefined : 'min(960px, 92vw)'}
      height={isMobile ? undefined : '85vh'}
      footer={null}
      closeOnEsc
      title={null}
      header={null}
      bodyStyle={{
        padding: 0,
        height: isMobile ? '100%' : '85vh',
        overflow: 'hidden',
      }}
      style={isMobile ? undefined : { borderRadius: 12, overflow: 'hidden' }}
    >
      {!briefing ? null : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--surface, #fff)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: isMobile ? '10px 12px' : '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            <Tag color='violet' size='small'>
              {t('社交发布')}
            </Tag>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              #{briefing.id}
            </span>
            {!isMobile ? (
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  marginLeft: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 360,
                }}
              >
                {briefing.title}
              </span>
            ) : null}
            <div style={{ flex: 1 }} />
            {hasPost ? (
              <>
                <Button
                  size={isMobile ? 'small' : 'default'}
                  icon={<IconDownload />}
                  theme='solid'
                  type='primary'
                  onClick={onDownload}
                >
                  {isMobile ? 'ZIP' : t('下载 ZIP')}
                </Button>
                <Popconfirm
                  title={t('重新生成会替换现有图片,是否继续?')}
                  onConfirm={onGenerate}
                >
                  <Button
                    size={isMobile ? 'small' : 'default'}
                    icon={<IconRefresh />}
                    loading={generating}
                  >
                    {isMobile ? t('重生') : t('重新生成')}
                  </Button>
                </Popconfirm>
              </>
            ) : null}
            <Button
              size={isMobile ? 'small' : 'default'}
              icon={<IconClose />}
              theme='borderless'
              onClick={onClose}
            />
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {isBusy ? (
              <SocialLoadingPane generating={generating} t={t} />
            ) : !hasPost ? (
              <SocialEmptyPane onGenerate={onGenerate} t={t} />
            ) : (
              <SocialReadyPane post={post} t={t} />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

const SocialLoadingPane = ({ generating, t }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 60,
      color: 'var(--text-muted)',
    }}
  >
    <Spin size='large' />
    <div style={{ fontSize: 14 }}>
      {generating
        ? t('正在调用 LLM 改写 + 生成配图,大约 30 秒到 3 分钟...')
        : t('加载中...')}
    </div>
    {generating ? (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 480, textAlign: 'center', lineHeight: 1.6 }}>
        {t('每条最多 3 张图。完成后可在此预览,并下载 ZIP 包(包含图片 + 文案 + 元信息),手动上传至小红书。')}
      </div>
    ) : null}
  </div>
);

const SocialEmptyPane = ({ onGenerate, t }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      padding: 60,
    }}
  >
    <IconImage size='extra-large' style={{ color: 'var(--text-muted)' }} />
    <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
      {t('尚未生成社交帖')}
    </div>
    <div
      style={{
        fontSize: 13,
        color: 'var(--text-muted)',
        maxWidth: 520,
        textAlign: 'center',
        lineHeight: 1.7,
      }}
    >
      {t('点击下方按钮:LLM 会判断这条简报适合"图文笔记"还是"纯图卡片",改写为小红书风格文案,并通过你配置的图像生成接口生成至少 2 张配图。')}
    </div>
    <Button
      theme='solid'
      type='primary'
      icon={<IconImage />}
      onClick={onGenerate}
      size='large'
    >
      {t('生成')}
    </Button>
    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
      {t('未配置图像生成接口?去 设置 tab 填写 Base URL / API Key / 模型')}
    </div>
  </div>
);

const SocialReadyPane = ({ post, t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
    {/* Meta strip */}
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Tag color={post.kind === 'image_only' ? 'orange' : 'cyan'} size='small'>
        {t(SOCIAL_KIND_LABELS[post.kind] || post.kind)}
      </Tag>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {(post.images || []).length} {t('张图')}
      </span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {t('生成于')} {new Date((post.updated_at || post.created_at) * 1000).toLocaleString()}
      </span>
    </div>

    {/* Title */}
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        {t('标题')}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          padding: '12px 14px',
          background: 'var(--bg-subtle, #fafafa)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
        }}
      >
        {post.title}
      </div>
    </div>

    {/* Body */}
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        {t('正文')}
      </div>
      <div
        style={{
          padding: '14px 16px',
          background: 'var(--bg-subtle, #fafafa)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          whiteSpace: 'pre-wrap',
          fontSize: 13,
          lineHeight: 1.7,
          color: 'var(--text-primary)',
        }}
      >
        {post.body}
      </div>
    </div>

    {/* Tags */}
    {(post.tags || []).length > 0 ? (
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          {t('话题标签')}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {post.tags.map((tag, i) => (
            <Tag key={i} color='blue' size='small'>
              #{tag.replace(/^#/, '')}
            </Tag>
          ))}
        </div>
      </div>
    ) : null}

    {/* Images */}
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {t('配图')} ({(post.images || []).length})
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        {(post.images || []).map((img) => (
          <SocialImageCard key={img.position} img={img} t={t} />
        ))}
      </div>
    </div>
  </div>
);

const SocialImageCard = ({ img, t }) => {
  const src = `/api/ai-news/admin/social/images/${img.rel_path}`;
  return (
    <div
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--surface, #fff)',
      }}
    >
      <div style={{ aspectRatio: '1 / 1', background: '#f5f5f5' }}>
        <img
          src={src}
          alt={img.caption || `image ${img.position}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
          {img.position}. {img.caption || t('未命名')}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          title={img.prompt}
        >
          {img.prompt}
        </div>
      </div>
    </div>
  );
};

export default BriefingsTab;
