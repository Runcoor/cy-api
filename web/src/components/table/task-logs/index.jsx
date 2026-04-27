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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DatePicker, Avatar } from '@douyinfe/semi-ui';
import { renderNumber, stringToColor, showSuccess } from '../../../helpers';
import { useTaskLogsData } from '../../../hooks/task-logs/useTaskLogsData';
import ContentModal from './modals/ContentModal';
import AudioPreviewModal from './modals/AudioPreviewModal';
import { LOG_PAGE_STYLES, LogIcons as I } from '../_shared/LogPageStyles';
import { CHANNEL_OPTIONS } from '../../../constants/channel.constants';
import {
  TASK_ACTION_FIRST_TAIL_GENERATE,
  TASK_ACTION_GENERATE,
  TASK_ACTION_REFERENCE_GENERATE,
  TASK_ACTION_REMIX_GENERATE,
  TASK_ACTION_TEXT_GENERATE,
} from '../../../constants/common.constant';

/* ───────── helpers ───────── */

const STATUS_META = {
  SUCCESS: { kind: 'success', label: '成功' },
  NOT_START: { kind: 'muted', label: '未启动' },
  SUBMITTED: { kind: 'queued', label: '队列中' },
  QUEUED: { kind: 'queued', label: '排队中' },
  IN_PROGRESS: { kind: 'running', label: '执行中' },
  FAILURE: { kind: 'failure', label: '失败' },
  UNKNOWN: { kind: 'muted', label: '未知' },
  '': { kind: 'muted', label: '正在提交' },
};

const TYPE_LABEL = {
  MUSIC: '生成音乐',
  LYRICS: '生成歌词',
  [TASK_ACTION_GENERATE]: '图生视频',
  [TASK_ACTION_TEXT_GENERATE]: '文生视频',
  [TASK_ACTION_FIRST_TAIL_GENERATE]: '首尾生视频',
  [TASK_ACTION_REFERENCE_GENERATE]: '参照生视频',
  [TASK_ACTION_REMIX_GENERATE]: '视频Remix',
};

const fmtTime = (sec) => {
  if (!sec) return ['', ''];
  const d = new Date(sec * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return [date, time];
};

const platformLabel = (p) => {
  const opt = CHANNEL_OPTIONS.find((o) => String(o.value) === String(p));
  if (opt) return opt.label;
  if (p === 'suno') return 'Suno';
  return p || '—';
};

/* ───────── small reusable components ───────── */

const FilterPillMenu = ({ label, value, options, onChange, allLabel = '全部' }) => {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = (e) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  };

  const active = value && value !== 'all';
  const sel = options.find((o) => String(o.value) === String(value));
  const allOpts = [{ value: 'all', label: allLabel }, ...options];

  return (
    <div ref={wrapRef} style={{ display: 'inline-block', position: 'relative' }}>
      <button type='button' className={`alog-pill ${active ? 'active' : ''}`} onClick={toggle}>
        <span className='pill-key'>{label}:</span>
        <span>{active ? sel?.label || value : allLabel}</span>
        {active ? (
          <span className='pill-clear' onClick={(e) => { e.stopPropagation(); onChange('all'); }}>
            <I.Close />
          </span>
        ) : (
          <I.Chevron />
        )}
      </button>
      {open && pos &&
        createPortal(
          <div
            className='alog-menu-portal'
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {allOpts.map((o) => (
              <button
                key={o.value}
                type='button'
                className={`alog-menu-item ${String(value) === String(o.value) ? 'selected' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.label} <span className='check'><I.Check /></span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

const QuickRanges = ({ onPick, current }) => {
  const items = [['today', '今日'], ['7d', '7 天'], ['30d', '30 天']];
  return (
    <div className='alog-quick-ranges'>
      {items.map(([k, label]) => (
        <button
          key={k}
          type='button'
          className={current === k ? 'active' : ''}
          onClick={() => onPick(k)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

/* ───────── Row ───────── */

const Row = ({ record, expanded, onToggle, isAdminUser, t, openVideoModal, openAudioModal, openContentModal }) => {
  const meta = STATUS_META[record.status] || STATUS_META.UNKNOWN;
  const [date, time] = fmtTime(record.submit_time);
  const percent = record.progress ? parseInt(String(record.progress).replace('%', '')) || 0 : 0;
  const durationSec =
    record.finish_time && record.submit_time
      ? Math.max(0, record.finish_time - record.submit_time)
      : null;

  // Detect preview availability
  const resultUrl = record.result_url || record.data?.result_url || '';
  const isVideoTask =
    record.action === TASK_ACTION_GENERATE ||
    record.action === TASK_ACTION_TEXT_GENERATE ||
    record.action === TASK_ACTION_FIRST_TAIL_GENERATE ||
    record.action === TASK_ACTION_REFERENCE_GENERATE ||
    record.action === TASK_ACTION_REMIX_GENERATE;
  const hasVideo =
    record.status === 'SUCCESS' &&
    isVideoTask &&
    typeof resultUrl === 'string' &&
    /^https?:\/\//.test(resultUrl);
  const sunoClips =
    record.platform === 'suno' && record.status === 'SUCCESS' && Array.isArray(record.data)
      ? record.data.filter((c) => c?.audio_url)
      : [];
  const hasAudio = sunoClips.length > 0;

  const truncatedTaskId = record.task_id
    ? record.task_id.length > 20
      ? `${record.task_id.slice(0, 8)}…${record.task_id.slice(-8)}`
      : record.task_id
    : '—';

  return (
    <>
      <tr className={expanded ? 'expanded' : ''} onClick={onToggle}>
        <td>
          <div className='alog-type-cell'>
            <span className={`alog-type-dot ${meta.kind}`} />
            <div className='alog-time-stack'>
              <span className='time mono'>{time}</span>
              <span className='date mono'>{date}</span>
            </div>
          </div>
        </td>
        <td>
          <span className='alog-token-pill' title={record.platform}>{platformLabel(record.platform)}</span>
        </td>
        <td>
          <span className='alog-model-pill'>
            {t(TYPE_LABEL[record.action] || record.action || '未知')}
          </span>
        </td>
        {isAdminUser && (
          <td>
            {record.username ? (
              <div className='alog-user-cell'>
                <Avatar
                  size='extra-extra-small'
                  color={stringToColor(record.username)}
                  style={{ width: 22, height: 22, fontSize: 11 }}
                >
                  {String(record.username).slice(0, 1)}
                </Avatar>
                <span className='name'>{record.username}</span>
              </div>
            ) : (
              <span style={{ color: 'var(--alog-ink-300)' }}>—</span>
            )}
          </td>
        )}
        <td>
          <span className='alog-token-pill mono' title={record.task_id} style={{ maxWidth: 160 }}>
            {truncatedTaskId}
          </span>
        </td>
        <td>
          <span className={`alog-type-label ${meta.kind}`}>{t(meta.label)}</span>
        </td>
        <td>
          <div className='alog-progress'>
            <div className='alog-progress-bar'>
              <div
                className={`alog-progress-fill ${record.status === 'FAILURE' ? 'failure' : record.status === 'SUCCESS' ? 'success' : ''}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className='alog-progress-foot'>
              {percent}%{durationSec !== null ? ` · ${durationSec}s` : ''}
            </span>
          </div>
        </td>
        <td>
          <div className='alog-row-actions' onClick={(e) => e.stopPropagation()}>
            {hasVideo && (
              <button type='button' title={t('预览视频')} onClick={() => openVideoModal && openVideoModal(resultUrl)}>
                <I.Film />
              </button>
            )}
            {hasAudio && (
              <button type='button' title={t('预览音频')} onClick={() => openAudioModal && openAudioModal(sunoClips)}>
                <I.Volume />
              </button>
            )}
            <button type='button' title={t('查看详情')} onClick={onToggle}><I.Eye /></button>
            <button
              type='button'
              title={t('完整 JSON')}
              onClick={() => openContentModal && openContentModal(JSON.stringify(record, null, 2))}
            ><I.More /></button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className='alog-detail-panel'>
          <td colSpan={isAdminUser ? 8 : 7} style={{ padding: 0 }}>
            <div className='inner col-2'>
              <div className='alog-detail-section'>
                <h4>{t('任务信息')}</h4>
                <dl className='alog-detail-kv'>
                  <dt>{t('任务 ID')}</dt><dd className='mono'>{record.task_id || '—'}</dd>
                  <dt>{t('平台')}</dt><dd>{platformLabel(record.platform)}</dd>
                  <dt>{t('动作')}</dt><dd className='mono'>{record.action || '—'}</dd>
                  {isAdminUser && record.channel_id !== undefined && (
                    <><dt>{t('渠道')}</dt><dd className='mono'>#{record.channel_id}</dd></>
                  )}
                  <dt>{t('状态')}</dt><dd>{t(meta.label)}</dd>
                </dl>
              </div>
              <div className='alog-detail-section'>
                <h4>{t('时间 & 进度')}</h4>
                <dl className='alog-detail-kv'>
                  <dt>{t('提交时间')}</dt><dd className='mono'>{date} {time}</dd>
                  {record.finish_time && (() => {
                    const [d2, t2] = fmtTime(record.finish_time);
                    return <><dt>{t('结束时间')}</dt><dd className='mono'>{d2} {t2}</dd></>;
                  })()}
                  {durationSec !== null && (
                    <><dt>{t('总耗时')}</dt><dd className='mono'>{durationSec} s</dd></>
                  )}
                  <dt>{t('进度')}</dt><dd className='mono'>{percent}%</dd>
                  {record.fail_reason && (
                    <><dt>{t('失败原因')}</dt>
                      <dd style={{ color: 'var(--alog-red)', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                        {record.fail_reason}
                      </dd>
                    </>
                  )}
                  {resultUrl && /^https?:\/\//.test(resultUrl) && (
                    <><dt>{t('结果链接')}</dt>
                      <dd className='mono' style={{ wordBreak: 'break-all' }}>
                        <a href={resultUrl} target='_blank' rel='noreferrer' style={{ color: 'var(--alog-blue-1)' }}>
                          {resultUrl}
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

/* ───────── Page ───────── */

const TaskLogsPage = () => {
  const taskLogsData = useTaskLogsData();
  const {
    logs,
    loading,
    activePage,
    logCount,
    pageSize,
    handlePageChange,
    refresh,
    isAdminUser,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    openContentModal,
    openVideoModal,
    openAudioModal,
    t,
  } = taskLogsData;

  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setSearchInput(searchQuery || '');
  }, [searchQuery]);

  // Re-fetch when filters change
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dateRange]);

  // ⌘K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };
  const handleClearSearch = () => { setSearchInput(''); setSearchQuery(''); };

  const handleQuickRange = (key) => {
    const now = new Date();
    let start;
    if (key === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (key === '7d') start = new Date(now.getTime() - 7 * 86400_000);
    else start = new Date(now.getTime() - 30 * 86400_000);
    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    setDateRange([fmt(start), fmt(new Date(now.getTime() + 3600_000))]);
  };

  const detectRangeKey = () => {
    if (!Array.isArray(dateRange) || dateRange.length !== 2) return null;
    const start = new Date(dateRange[0]);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (Math.abs(start - startOfToday) < 60_000) return 'today';
    const diffDays = Math.round((now - start) / 86400_000);
    if (Math.abs(diffDays - 7) <= 1) return '7d';
    if (Math.abs(diffDays - 30) <= 1) return '30d';
    return null;
  };

  // Client-side filter on current page (status + platform)
  const visibleLogs = useMemo(() => {
    return logs.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (platformFilter !== 'all' && String(r.platform) !== String(platformFilter)) return false;
      return true;
    });
  }, [logs, statusFilter, platformFilter]);

  // KPI numbers — computed from current page (best effort)
  const counts = useMemo(() => {
    const c = { total: logs.length, success: 0, running: 0, failure: 0 };
    logs.forEach((r) => {
      if (r.status === 'SUCCESS') c.success++;
      else if (r.status === 'IN_PROGRESS') c.running++;
      else if (r.status === 'FAILURE') c.failure++;
    });
    return c;
  }, [logs]);

  const successRate = counts.total > 0 ? Math.round((counts.success / counts.total) * 100) : null;

  // Filter pill options derived from current page
  const platformOptions = useMemo(() => {
    const set = new Set();
    logs.forEach((r) => r.platform && set.add(String(r.platform)));
    return Array.from(set).map((p) => ({ value: p, label: platformLabel(p) }));
  }, [logs]);

  const statusOptions = [
    { value: 'SUCCESS', label: t('成功') },
    { value: 'IN_PROGRESS', label: t('执行中') },
    { value: 'SUBMITTED', label: t('队列中') },
    { value: 'QUEUED', label: t('排队中') },
    { value: 'FAILURE', label: t('失败') },
    { value: 'NOT_START', label: t('未启动') },
  ];

  const activeFilters = [];
  if (statusFilter !== 'all') {
    activeFilters.push({
      key: t('状态'),
      value: t(STATUS_META[statusFilter]?.label || statusFilter),
      onClear: () => setStatusFilter('all'),
    });
  }
  if (platformFilter !== 'all') {
    activeFilters.push({
      key: t('平台'),
      value: platformLabel(platformFilter),
      onClear: () => setPlatformFilter('all'),
    });
  }
  if (searchQuery) {
    activeFilters.push({
      key: t('搜索'),
      value: searchQuery,
      onClear: () => { setSearchInput(''); setSearchQuery(''); },
    });
  }

  const totalPages = Math.max(1, Math.ceil(logCount / (pageSize || 1)));
  const renderPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (activePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (activePage >= totalPages - 3)
      return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', activePage - 1, activePage, activePage + 1, '…', totalPages];
  };

  return (
    <>
      <ContentModal {...taskLogsData} isVideo={false} />
      <ContentModal
        isModalOpen={taskLogsData.isVideoModalOpen}
        setIsModalOpen={taskLogsData.setIsVideoModalOpen}
        modalContent={taskLogsData.videoUrl}
        isVideo={true}
      />
      <AudioPreviewModal
        isModalOpen={taskLogsData.isAudioModalOpen}
        setIsModalOpen={taskLogsData.setIsAudioModalOpen}
        audioClips={taskLogsData.audioClips}
      />

      <div className='alog-root'>
        <style>{LOG_PAGE_STYLES}</style>
        <div className='alog-page'>
          <header className='alog-head'>
            <div>
              <h1 className='alog-title'>
                {t('任务记录')}
                <span className='alog-livedot'>{t('实时')}</span>
              </h1>
              <div className='alog-sub'>
                {t('异步任务（视频 / 音乐 / Suno 等）的提交、进度与结果记录')}
              </div>
            </div>
            <div className='alog-head-actions'>
              <button
                type='button'
                className='alog-iconbtn'
                onClick={() => refresh()}
                disabled={loading}
                title={t('刷新')}
              >
                <I.Refresh />
              </button>
            </div>
          </header>

          {/* KPI strip */}
          <div className='alog-kpis cols-4'>
            <div className='alog-kpi hero'>
              <div className='alog-kpi-label'>{t('总任务数')}</div>
              <div className='alog-kpi-value mono'>{renderNumber(logCount || 0)}</div>
              <div className='alog-kpi-foot'>
                <span>{t('在选中时间范围内')}</span>
              </div>
            </div>
            <div className='alog-kpi'>
              <div className='alog-kpi-label'>{t('成功')}</div>
              <div className='alog-kpi-value mono' style={{ color: 'var(--alog-green)' }}>
                {renderNumber(counts.success)}
              </div>
              <div className='alog-kpi-foot'>
                <span>{successRate !== null ? `${successRate}% ${t('成功率（当前页）')}` : t('当前页统计')}</span>
              </div>
            </div>
            <div className='alog-kpi'>
              <div className='alog-kpi-label'>{t('执行中')}</div>
              <div className='alog-kpi-value mono alog-kpi-grad-text'>{renderNumber(counts.running)}</div>
              <div className='alog-kpi-foot'>
                <span>{t('正在排队或运行的任务')}</span>
              </div>
            </div>
            <div className='alog-kpi'>
              <div className='alog-kpi-label'>{t('失败')}</div>
              <div className='alog-kpi-value mono' style={{ color: 'var(--alog-red)' }}>
                {renderNumber(counts.failure)}
              </div>
              <div className='alog-kpi-foot'>
                <span>{t('需要关注的任务')}</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <form className='alog-toolbar' onSubmit={handleSubmit}>
            <div className='alog-search'>
              <I.Search />
              <input
                ref={searchInputRef}
                placeholder={
                  isAdminUser
                    ? t('搜索任务 ID / 渠道 / 用户…')
                    : t('搜索任务 ID…')
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button type='button' className='alog-search-clear' onClick={handleClearSearch} aria-label={t('清除')}>
                  <I.Close />
                </button>
              )}
              <kbd
                style={{
                  fontSize: 10, padding: '1px 5px', borderRadius: 4,
                  background: 'var(--alog-line-soft)', color: 'var(--alog-ink-500)',
                  border: '1px solid var(--alog-line)', fontFamily: 'inherit',
                }}
              >⌘K</kbd>
            </div>

            <div className='alog-toolbar-divider' />

            <FilterPillMenu
              label={t('状态')}
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              allLabel={t('全部')}
            />
            <FilterPillMenu
              label={t('平台')}
              value={platformFilter}
              options={platformOptions}
              onChange={setPlatformFilter}
              allLabel={t('全部')}
            />

            <div className='alog-toolbar-divider' />

            <QuickRanges current={detectRangeKey()} onPick={handleQuickRange} />

            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 8px 4px 10px', borderRadius: 8,
                border: '1px solid var(--alog-line)', background: 'var(--alog-card)',
              }}
            >
              <I.Calendar />
              <DatePicker
                type='dateTimeRange'
                value={dateRange}
                onChange={(v) => setDateRange(v || [])}
                placeholder={[t('开始时间'), t('结束时间')]}
                size='small'
                density='compact'
                showClear
                style={{ border: 'none', background: 'transparent', minWidth: 240, padding: 0 }}
              />
            </div>
          </form>

          {activeFilters.length > 0 && (
            <div className='alog-active-filters'>
              <span className='label'>{t('筛选条件')}</span>
              {activeFilters.map((f, i) => (
                <span key={i} className='alog-filter-tag'>
                  <span className='key'>{f.key}:</span>{f.value}
                  <button type='button' className='x' onClick={f.onClear}><I.Close /></button>
                </span>
              ))}
              <button
                type='button'
                className='alog-clear-all'
                onClick={() => {
                  setStatusFilter('all');
                  setPlatformFilter('all');
                  setSearchInput('');
                  setSearchQuery('');
                }}
              >
                {t('清除全部')}
              </button>
            </div>
          )}

          <div className={`alog-table-wrap ${activeFilters.length > 0 ? 'with-active-filters' : ''}`}>
            <div className='alog-table-scroll'>
              <table className='alog-table'>
                <thead>
                  <tr>
                    <th style={{ width: 155 }}>{t('提交时间')}</th>
                    <th style={{ width: 90 }}>{t('平台')}</th>
                    <th style={{ width: 110 }}>{t('类型')}</th>
                    {isAdminUser && <th style={{ width: 140 }}>{t('用户')}</th>}
                    <th style={{ width: 180 }}>{t('任务 ID')}</th>
                    <th style={{ width: 80 }}>{t('状态')}</th>
                    <th>{t('进度')}</th>
                    <th style={{ width: 110 }} />
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={isAdminUser ? 8 : 7} className='alog-empty'>
                        {logs.length === 0 ? t('没有匹配的记录') : t('当前筛选下没有任务')}
                      </td>
                    </tr>
                  )}
                  {visibleLogs.map((record) => (
                    <Row
                      key={record.key || record.id}
                      record={record}
                      expanded={expanded === (record.key || record.id)}
                      onToggle={() => {
                        const k = record.key || record.id;
                        setExpanded(expanded === k ? null : k);
                      }}
                      isAdminUser={isAdminUser}
                      t={t}
                      openVideoModal={openVideoModal}
                      openAudioModal={openAudioModal}
                      openContentModal={openContentModal}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {logCount > 0 && (
              <div className='alog-table-foot'>
                <div>
                  {t('共')} <strong style={{ color: 'var(--alog-ink-900)' }}>{logCount}</strong> {t('个任务')}
                  {' · '}{t('第')} {activePage} / {totalPages} {t('页')}
                </div>
                <div className='alog-pager'>
                  <button
                    type='button'
                    disabled={activePage <= 1}
                    onClick={() => handlePageChange(Math.max(1, activePage - 1))}
                  ><I.ChevronL /></button>
                  {renderPageNumbers().map((p, i) =>
                    p === '…' ? (
                      <span key={`e-${i}`} className='ellipsis'>…</span>
                    ) : (
                      <button
                        key={p}
                        type='button'
                        className={p === activePage ? 'active' : ''}
                        onClick={() => handlePageChange(p)}
                      >{p}</button>
                    ),
                  )}
                  <button
                    type='button'
                    disabled={activePage >= totalPages}
                    onClick={() => handlePageChange(Math.min(totalPages, activePage + 1))}
                  ><I.ChevronR /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskLogsPage;
