/*
Copyright (C) 2025 QuantumNous

Mobile-only briefing editor. Fullscreen modal with sticky header (back +
title + save) and tabs (edit / preview / recipients). Replaces the
desktop's "sheet" UX with native-feeling fullscreen navigation.
*/

import React, { useEffect, useState } from 'react';
import {
  Button,
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
import { IconClose, IconSend, IconRefresh } from '@douyinfe/semi-icons';
import { API, showError, showSuccess } from '../../../helpers';

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

const MobileBriefingEditor = ({ editing, onClose, onSaved, t }) => {
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('edit');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Preview tab
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');

  // Recipients tab
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientsPage, setRecipientsPage] = useState(1);
  const [recipientsSearch, setRecipientsSearch] = useState('');
  const [recipientsDiag, setRecipientsDiag] = useState(null);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || '',
        summary: editing.summary || '',
        content: editing.content || '',
        plan_ids_json: editing.plan_ids_json || '[]',
        status: editing.status || 'draft',
      });
      setActiveTab('edit');
      setPreviewHtml('');
      setPreviewSubject('');
      setRecipients([]);
      setRecipientsTotal(0);
      setRecipientsPage(1);
      setRecipientsSearch('');
      setRecipientsDiag(null);
    }
  }, [editing]);

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

  useEffect(() => {
    if (!editing) return;
    if (activeTab === 'preview' && !previewHtml) loadPreview();
    if (activeTab === 'recipients' && recipients.length === 0 && !recipientsLoading) {
      loadRecipients(1);
      setRecipientsPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, editing]);

  const onSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await API.put(`/api/ai-news/admin/briefings/${editing.id}`, form);
      if (res?.data?.success) {
        showSuccess(t('已保存'));
        setPreviewHtml('');
        if (activeTab === 'preview') loadPreview();
        if (activeTab === 'recipients') {
          loadRecipients(1);
          setRecipientsPage(1);
        }
        onSaved && onSaved();
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
      const res = await API.post(`/api/ai-news/admin/briefings/${editing.id}/send`);
      if (res?.data?.success) {
        const { sent, failed } = res.data.data || {};
        showSuccess(t('已发送 {{s}} 成功,{{f}} 失败', { s: sent, f: failed }));
        onClose();
        onSaved && onSaved();
      } else {
        showError(res?.data?.message || t('发送失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={!!editing}
      onCancel={onClose}
      fullScreen
      footer={null}
      header={null}
      title={null}
      bodyStyle={{ padding: 0, height: '100%', overflow: 'hidden' }}
    >
      {!editing ? null : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--surface, #fff)',
          }}
        >
          {/* Sticky header */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Button
                icon={<IconClose />}
                theme='borderless'
                size='small'
                onClick={onClose}
              />
              <Tag color={editing.type === 'deep' ? 'violet' : 'cyan'} size='small'>
                {t(TYPE_LABELS[editing.type] || editing.type)}
              </Tag>
              <Tag color={STATUS_COLORS[editing.status] || 'grey'} size='small'>
                {editing.status}
              </Tag>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                #{editing.id}
              </span>
              <div style={{ flex: 1 }} />
              <Button size='small' onClick={onSave} loading={saving}>
                {t('保存')}
              </Button>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {form.title || editing.title}
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            type='line'
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
            contentStyle={{ flex: 1, overflow: 'hidden', minHeight: 0 }}
          >
            <TabPane tab={t('编辑')} itemKey='edit'>
              <EditPane form={form} setForm={setForm} t={t} />
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
                  ? t('收件人 ({{n}})', { n: recipientsTotal })
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
                diag={recipientsDiag}
                onSearch={setRecipientsSearch}
                onSubmitSearch={() => {
                  setRecipientsPage(1);
                  loadRecipients(1);
                }}
                onPage={(p) => {
                  setRecipientsPage(p);
                  loadRecipients(p);
                }}
                t={t}
              />
            </TabPane>
          </Tabs>

          {/* Sticky send bar */}
          <div
            style={{
              padding: '10px 12px max(10px, env(safe-area-inset-bottom))',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--surface, #fff)',
            }}
          >
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
                size='large'
                block
              >
                {recipientsTotal > 0
                  ? t('发送给 {{n}} 位用户', { n: recipientsTotal })
                  : t('发送给用户')}
              </Button>
            </Popconfirm>
          </div>
        </div>
      )}
    </Modal>
  );
};

const EditPane = ({ form, setForm, t }) => (
  <div style={{ height: '100%', overflowY: 'auto', padding: '14px 12px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label={t('标题')}>
        <Input
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          size='large'
        />
      </Field>
      <Field label={t('摘要')}>
        <TextArea
          value={form.summary}
          onChange={(v) => setForm({ ...form, summary: v })}
          autosize={{ minRows: 2, maxRows: 5 }}
        />
      </Field>
      <Field label={t('正文 (markdown)')}>
        <TextArea
          value={form.content}
          onChange={(v) => setForm({ ...form, content: v })}
          autosize={{ minRows: 10, maxRows: 30 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
      </Field>
      <Field
        label={t('Plan IDs JSON')}
        hint={t('JSON 数组,例 [1,2]; 留空 [] 表示所有活跃订阅用户')}
      >
        <Input
          value={form.plan_ids_json}
          onChange={(v) => setForm({ ...form, plan_ids_json: v })}
          placeholder='[]'
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </Field>
      <Field label={t('状态')}>
        <Select
          value={form.status}
          onChange={(v) => setForm({ ...form, status: v })}
          style={{ width: '100%' }}
          size='large'
        >
          <Select.Option value='draft'>draft</Select.Option>
          <Select.Option value='approved'>approved</Select.Option>
          <Select.Option value='sent'>sent</Select.Option>
          <Select.Option value='archived'>archived</Select.Option>
        </Select>
      </Field>
    </div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label
      style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-primary)',
        marginBottom: 6,
      }}
    >
      {label}
    </label>
    {children}
    {hint ? (
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>
    ) : null}
  </div>
);

const PreviewPane = ({ loading, html, subject, onRefresh, t }) => (
  <div
    style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-subtle, #fafafa)',
    }}
  >
    <div
      style={{
        padding: '8px 12px',
        background: 'var(--surface, #fff)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('主题')}:</span>
      <span
        style={{
          flex: 1,
          fontSize: 12,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {subject || '-'}
      </span>
      <Button
        size='small'
        icon={<IconRefresh />}
        theme='borderless'
        onClick={onRefresh}
      />
    </div>
    <div style={{ flex: 1, overflow: 'hidden' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <Spin />
        </div>
      ) : (
        <iframe
          title='preview'
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          sandbox=''
        />
      )}
    </div>
  </div>
);

const FAILING_FILTER_LABELS = {
  no_plan_match: '没有用户订阅 plan_ids 里指定的任何套餐',
  no_active_status: '所有匹配的订阅都不是 active 状态',
  all_expired: '所有匹配的订阅都已过期',
  all_users_disabled: '所有匹配的用户账号被禁用',
  no_email_addresses: '所有匹配的用户都没有填邮箱',
};

const RecipientsPane = ({
  loading,
  items,
  total,
  page,
  search,
  diag,
  onSearch,
  onSubmitSearch,
  onPage,
  t,
}) => (
  <div
    style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
      <Input
        value={search}
        onChange={onSearch}
        onEnterPress={onSubmitSearch}
        placeholder={t('按用户名 / 邮箱搜索')}
        size='large'
        suffix={
          <Button
            size='small'
            theme='borderless'
            onClick={onSubmitSearch}
          >
            {t('搜索')}
          </Button>
        }
      />
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <RecipientsEmpty diag={diag} t={t} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((r) => (
            <div
              key={r.user_id}
              style={{
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {r.display_name || r.username}
                </span>
                <div style={{ flex: 1 }} />
                {r.already_sent ? (
                  <Tag color='green' size='small'>{t('已发')}</Tag>
                ) : null}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                  wordBreak: 'break-all',
                }}
              >
                {r.email || t('(无邮箱)')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {r.plan_name || `plan #${r.plan_id}`}
                {r.end_time
                  ? ` · ${t('到期')} ${new Date(r.end_time * 1000).toLocaleDateString()}`
                  : ''}
              </div>
            </div>
          ))}
          {total > 20 ? (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                total={total}
                currentPage={page}
                pageSize={20}
                onPageChange={onPage}
                size='small'
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  </div>
);

const RecipientsEmpty = ({ diag, t }) => {
  if (!diag) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        {t('暂无收件人')}
      </div>
    );
  }
  const stages = [
    { label: t('总订阅数'), value: diag.total_subscriptions },
    { label: t('状态 = active'), value: diag.after_status_active },
    { label: t('未过期'), value: diag.after_not_expired },
    { label: t('用户启用'), value: diag.after_user_enabled },
    { label: t('有邮箱'), value: diag.after_has_email },
  ];
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>
        {t('过滤漏斗')}
      </div>
      <div
        style={{
          background: 'var(--surface, #fff)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {stages.map((s, i) => {
          const dropped = i > 0 && stages[i - 1].value > 0 && s.value === 0;
          return (
            <div
              key={s.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 12px',
                fontSize: 12,
                background: dropped ? 'rgba(239,68,68,.06)' : undefined,
                borderTop: i > 0 ? '1px solid var(--border-subtle)' : undefined,
                color: dropped ? '#dc2626' : 'var(--text-primary)',
              }}
            >
              <span>{s.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{s.value}</span>
            </div>
          );
        })}
      </div>
      {diag.first_failing_filter && FAILING_FILTER_LABELS[diag.first_failing_filter] ? (
        <div
          style={{
            padding: 12,
            background: 'rgba(239,68,68,.06)',
            border: '1px solid rgba(239,68,68,.2)',
            borderRadius: 8,
            fontSize: 12,
            color: '#dc2626',
            lineHeight: 1.6,
          }}
        >
          {t(FAILING_FILTER_LABELS[diag.first_failing_filter])}
        </div>
      ) : null}
    </div>
  );
};

export default MobileBriefingEditor;
