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
  SideSheet,
  Spin,
  Table,
  Tag,
  TextArea,
} from '@douyinfe/semi-ui';
import { IconRefresh, IconSend } from '@douyinfe/semi-icons';
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
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

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

  const onTrigger = async () => {
    setTriggering(true);
    try {
      const res = await API.post('/api/ai-news/admin/trigger');
      if (res?.data?.success) {
        showSuccess(t('已触发,Agent 在后台运行,请稍后刷新'));
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
        setSheetVisible(true);
      } else {
        showError(res?.data?.message || t('加载失败'));
      }
    } catch (e) {
      showError(e);
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
          loading={triggering}
          onClick={onTrigger}
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

      <SideSheet
        visible={sheetVisible}
        onCancel={() => setSheetVisible(false)}
        width={720}
        title={
          editing
            ? `#${editing.id} · ${t(TYPE_LABELS[editing.type] || editing.type)}`
            : t('编辑简报')
        }
      >
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
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
              <label style={{ fontSize: 13, fontWeight: 500 }}>{t('正文 (Markdown)')}</label>
              <TextArea
                value={editForm.content}
                onChange={(v) => setEditForm({ ...editForm, content: v })}
                autosize={{ minRows: 12, maxRows: 30 }}
                style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>
                {t('Plan IDs JSON')}
              </label>
              <Input
                value={editForm.plan_ids_json}
                onChange={(v) =>
                  setEditForm({ ...editForm, plan_ids_json: v })
                }
                placeholder='[] (空 = 所有有活跃订阅的用户)'
                style={{ marginTop: 6, fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>{t('状态')}</label>
              <Select
                value={editForm.status}
                onChange={(v) => setEditForm({ ...editForm, status: v })}
                style={{ width: '100%', marginTop: 6 }}
              >
                <Select.Option value='draft'>draft</Select.Option>
                <Select.Option value='approved'>approved</Select.Option>
                <Select.Option value='archived'>archived</Select.Option>
              </Select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
                  {t('发送给用户')}
                </Button>
              </Popconfirm>
            </div>
            {editing.sources_json ? (
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>{t('来源')}</label>
                <SourcesPreview json={editing.sources_json} />
              </div>
            ) : null}
          </div>
        ) : null}
      </SideSheet>
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
