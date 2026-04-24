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
import { IconRefresh, IconSend, IconPlusCircle, IconDelete, IconClose } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';

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

  // Trigger modal state
  const [triggerVisible, setTriggerVisible] = useState(false);
  const [triggerMode, setTriggerMode] = useState('auto');
  const [triggerUrls, setTriggerUrls] = useState('');
  const [triggerArticles, setTriggerArticles] = useState([
    { title: '', url: '', content: '' },
  ]);

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
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title={t('确认删除?')}
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
        fullScreen
        footer={null}
        closeOnEsc
        title={null}
        header={null}
        bodyStyle={{ padding: 0, height: '100vh' }}
      >
        {editing ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              background: 'var(--surface, #fff)',
            }}
          >
            {/* Header bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle, #fafafa)',
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
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginLeft: 8 }}>
                {editForm.title || editing.title}
              </span>
              <div style={{ flex: 1 }} />
              <Button onClick={onSave} loading={saving}>
                {t('保存')}
              </Button>
              <Popconfirm
                title={t('确认发送给所有匹配的活跃订阅用户?')}
                onConfirm={onSend}
              >
                <Button
                  theme='solid'
                  type='primary'
                  icon={<IconSend />}
                  loading={sending}
                  disabled={editing.status === 'sent'}
                >
                  {recipientsTotal > 0
                    ? t('发送给 {{n}} 位用户', { n: recipientsTotal })
                    : t('发送给用户')}
                </Button>
              </Popconfirm>
              <Button
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
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-subtle, #fafafa)',
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
          background: 'var(--bg-subtle, #fafafa)',
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

export default BriefingsTab;
