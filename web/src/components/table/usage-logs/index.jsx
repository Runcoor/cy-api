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
import {
  renderQuota,
  renderNumber,
  stringToColor,
  getLogOther,
  copy,
  showSuccess,
} from '../../../helpers';
import { useLogsData } from '../../../hooks/usage-logs/useUsageLogsData';
import UserInfoModal from './modals/UserInfoModal';
import ChannelAffinityUsageCacheModal from './modals/ChannelAffinityUsageCacheModal';
import ParamOverrideModal from './modals/ParamOverrideModal';
import { LOG_PAGE_STYLES, LogIcons as I } from '../_shared/LogPageStyles';

/* ───────── helpers ───────── */

// log.type → 'consume' | 'system' | 'error'
const TYPE_TO_KIND = {
  1: 'system', // 充值
  2: 'consume',
  3: 'system', // 管理
  4: 'system',
  5: 'error',
  6: 'system', // 退款
};
const TYPE_LABEL = {
  1: '充值',
  2: '消费',
  3: '管理',
  4: '系统',
  5: '错误',
  6: '退款',
};

const PROVIDER_FROM_MODEL = (model) => {
  if (!model) return 'generic';
  const m = model.toLowerCase();
  if (
    m.includes('gpt') ||
    m.includes('openai') ||
    m.includes('o3') ||
    m.includes('o4')
  )
    return 'openai';
  if (m.includes('claude') || m.includes('anthropic')) return 'anthropic';
  if (m.includes('gemini') || m.includes('google')) return 'google';
  if (m.includes('azure')) return 'azure';
  return 'generic';
};

const PROVIDER_GLYPHS = {
  openai: (
    <svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor'>
      <circle cx='12' cy='12' r='9' />
    </svg>
  ),
  anthropic: (
    <svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M14 4 22 20h-4l-1.5-3.5h-9L6 20H2L10 4h4z' />
    </svg>
  ),
  google: (
    <svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M12 3 14 10 21 12 14 14 12 21 10 14 3 12 10 10z' />
    </svg>
  ),
  azure: (
    <svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M12 2 2 22h20L12 2zm0 6 6 12H6l6-12z' />
    </svg>
  ),
  generic: (
    <svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor'>
      <circle cx='12' cy='12' r='5' />
    </svg>
  ),
};

const splitTime = (s) => {
  if (!s) return ['', ''];
  const idx = s.indexOf(' ');
  if (idx < 0) return [s, ''];
  return [s.slice(0, idx), s.slice(idx + 1)];
};

const fmtNum = (n) =>
  (typeof n === 'number' ? n : parseInt(n) || 0).toLocaleString('en-US');

/* ───────── small reusable components ───────── */

const FilterPillMenu = ({
  label,
  value,
  options,
  onChange,
  allLabel = '全部',
}) => {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = (e) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  };

  const active = value && value !== 'all' && value !== '0' && value !== '';
  const sel = options.find((o) => String(o.value) === String(value));
  const allOpts = [{ value: 'all', label: allLabel }, ...options];

  return (
    <div
      ref={wrapRef}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      <button
        type='button'
        className={`alog-pill ${active ? 'active' : ''}`}
        onClick={toggle}
      >
        <span className='pill-key'>{label}:</span>
        <span>{active ? sel?.label || value : allLabel}</span>
        {active ? (
          <span
            className='pill-clear'
            onClick={(e) => {
              e.stopPropagation();
              onChange('all');
            }}
          >
            <I.Close />
          </span>
        ) : (
          <I.Chevron />
        )}
      </button>
      {open &&
        pos &&
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
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}{' '}
                <span className='check'>
                  <I.Check />
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

const QuickRanges = ({ onPick, current }) => {
  const items = [
    ['today', '今日'],
    ['7d', '7 天'],
    ['30d', '30 天'],
  ];
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

const setDensityOnRoot = (dense) => {
  const root = document.querySelector('.alog-root');
  if (!root) return;
  if (dense) root.classList.add('dense');
  else root.classList.remove('dense');
};

/* ───────── Row ───────── */

const Row = ({
  record,
  expanded,
  onToggle,
  expandRows,
  isAdminUser,
  t,
  copyText,
}) => {
  const kind = TYPE_TO_KIND[record.type] || 'system';
  const isConsume = kind === 'consume';
  const isError = kind === 'error';
  const isSystem = kind === 'system';
  const other = getLogOther(record.other);
  const [date, time] = splitTime(record.timestamp2string);
  const provider = PROVIDER_FROM_MODEL(record.model_name);

  const inputTokens = parseInt(record.prompt_tokens) || 0;
  const outputTokens = parseInt(record.completion_tokens) || 0;
  const cacheTokens = parseInt(other?.cache_tokens) || 0;
  const totalTokens = inputTokens + outputTokens;
  const totalWithCache = totalTokens + cacheTokens;
  const useTimeSec = parseInt(record.use_time) || 0;
  const ttftSec = other?.frt ? (parseFloat(other.frt) / 1000).toFixed(1) : null;

  const requestId = record.request_id || other?.request_id || '';
  const channelLabel =
    record.channel_name || (record.channel ? `#${record.channel}` : '');
  const failReason = isError
    ? record.content || other?.reject_reason || ''
    : '';

  const onCopyReq = (e) => {
    e.stopPropagation();
    if (requestId) copyText(e, requestId);
  };

  return (
    <>
      <tr className={expanded ? 'expanded' : ''} onClick={onToggle}>
        <td>
          <div className='alog-type-cell'>
            <span className={`alog-type-dot ${kind}`} />
            <div className='alog-time-stack'>
              <span className='time mono'>{time}</span>
              <span className='date mono'>{date}</span>
            </div>
          </div>
        </td>
        <td>
          <span className={`alog-type-label ${kind}`}>
            {t(TYPE_LABEL[record.type] || '系统')}
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
          {record.model_name ? (
            <span className='alog-model-pill'>
              <span className={`alog-provider-icon ${provider}`}>
                {PROVIDER_GLYPHS[provider]}
              </span>
              {record.model_name}
            </span>
          ) : (
            <span style={{ color: 'var(--alog-ink-300)' }}>—</span>
          )}
        </td>
        <td>
          {record.token_name ? (
            <span className='alog-token-pill' title={record.token_name}>
              {record.token_name}
            </span>
          ) : (
            <span style={{ color: 'var(--alog-ink-300)' }}>—</span>
          )}
        </td>
        <td>
          {isConsume && (
            <div className='alog-metrics-cell'>
              {useTimeSec > 0 && (
                <span className='alog-metric-chip duration'>
                  {useTimeSec}
                  <span className='unit'>s</span>
                </span>
              )}
              {ttftSec && (
                <span className='alog-metric-chip ttft'>
                  {ttftSec}
                  <span className='unit'>s</span>
                </span>
              )}
              <span
                className={`alog-metric-chip ${record.is_stream ? 'stream' : 'nostream'}`}
              >
                {record.is_stream ? t('流') : t('非流')}
              </span>
            </div>
          )}
          {isSystem && (
            <span className='alog-detail-cell'>
              <span className='text' title={record.content}>
                {record.content || '—'}
              </span>
              {record.quota > 0 && (
                <span className='gain'>+{renderQuota(record.quota, 6)}</span>
              )}
            </span>
          )}
          {isError && (
            <span className='alog-detail-cell'>
              <span className='err text' title={failReason}>
                {failReason || t('请求失败')}
              </span>
            </span>
          )}
        </td>
        <td>
          {totalTokens > 0 ? (
            <span className='alog-metric-chip tokens'>
              {fmtNum(totalTokens)}
            </span>
          ) : (
            <span style={{ color: 'var(--alog-ink-300)' }}>—</span>
          )}
        </td>
        <td className='num'>
          {isConsume ? (
            <span className='alog-cost'>{renderQuota(record.quota, 6)}</span>
          ) : isSystem && record.quota > 0 ? (
            <span className='alog-cost gain'>
              +{renderQuota(record.quota, 6)}
            </span>
          ) : (
            <span className='alog-cost zero'>—</span>
          )}
        </td>
        <td>
          <div
            className='alog-row-actions'
            onClick={(e) => e.stopPropagation()}
          >
            <button type='button' title={t('查看详情')} onClick={onToggle}>
              <I.Eye />
            </button>
            {requestId && (
              <button
                type='button'
                title={t('复制 Request ID')}
                onClick={onCopyReq}
              >
                <I.Copy />
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className='alog-detail-panel'>
          <td colSpan={isAdminUser ? 9 : 8} style={{ padding: 0 }}>
            <div className={`inner ${isConsume ? 'col-3' : 'col-2'}`}>
              <div className='alog-detail-section'>
                <h4>{t('请求信息')}</h4>
                <dl className='alog-detail-kv'>
                  {requestId && (
                    <>
                      <dt>Request ID</dt>
                      <dd className='mono'>{requestId}</dd>
                    </>
                  )}
                  {record.ip && (
                    <>
                      <dt>{t('来源 IP')}</dt>
                      <dd className='mono'>{record.ip}</dd>
                    </>
                  )}
                  {record.group && (
                    <>
                      <dt>{t('分组')}</dt>
                      <dd>{record.group}</dd>
                    </>
                  )}
                  {isAdminUser && channelLabel && (
                    <>
                      <dt>{t('渠道')}</dt>
                      <dd className='mono'>{channelLabel}</dd>
                    </>
                  )}
                  <dt>{t('时间戳')}</dt>
                  <dd className='mono'>{record.timestamp2string}</dd>
                </dl>
              </div>
              {isConsume && (
                <>
                  <div className='alog-detail-section'>
                    <h4>{t('Token 用量')}</h4>
                    <dl className='alog-detail-kv'>
                      <dt>{t('输入')}</dt>
                      <dd className='mono'>{fmtNum(inputTokens)}</dd>
                      <dt>{t('输出')}</dt>
                      <dd className='mono'>{fmtNum(outputTokens)}</dd>
                      {cacheTokens > 0 && (
                        <>
                          <dt>{t('缓存读取')}</dt>
                          <dd className='mono'>{fmtNum(cacheTokens)}</dd>
                        </>
                      )}
                      <dt>{t('合计')}</dt>
                      <dd className='mono'>{fmtNum(totalWithCache)}</dd>
                    </dl>
                    {totalWithCache > 0 && (
                      <>
                        <div className='alog-token-bar'>
                          <div
                            className='seg input'
                            style={{
                              width: `${(inputTokens / totalWithCache) * 100}%`,
                            }}
                          />
                          <div
                            className='seg output'
                            style={{
                              width: `${(outputTokens / totalWithCache) * 100}%`,
                            }}
                          />
                          <div
                            className='seg cache'
                            style={{
                              width: `${(cacheTokens / totalWithCache) * 100}%`,
                            }}
                          />
                        </div>
                        <div className='alog-token-legend'>
                          <span className='input'>{t('输入')}</span>
                          <span className='output'>{t('输出')}</span>
                          {cacheTokens > 0 && (
                            <span className='cache'>{t('缓存')}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className='alog-detail-section'>
                    <h4>{t('性能 & 计费')}</h4>
                    <dl className='alog-detail-kv'>
                      {useTimeSec > 0 && (
                        <>
                          <dt>{t('总耗时')}</dt>
                          <dd className='mono'>{useTimeSec} s</dd>
                        </>
                      )}
                      {ttftSec && (
                        <>
                          <dt>{t('首 token 延迟')}</dt>
                          <dd className='mono'>{ttftSec} s</dd>
                        </>
                      )}
                      <dt>{t('响应模式')}</dt>
                      <dd>{record.is_stream ? t('流式') : t('非流式')}</dd>
                      <dt>{t('本次花费')}</dt>
                      <dd
                        className='mono'
                        style={{ color: 'var(--alog-blue-1)', fontWeight: 600 }}
                      >
                        {renderQuota(record.quota, 6)}
                      </dd>
                    </dl>
                  </div>
                </>
              )}
              {!isConsume && (
                <div className='alog-detail-section'>
                  <h4>{isError ? t('错误详情') : t('事件详情')}</h4>
                  <dl className='alog-detail-kv'>
                    {record.content && (
                      <>
                        <dt>{t('描述')}</dt>
                        <dd>{record.content}</dd>
                      </>
                    )}
                    {record.quota > 0 && (
                      <>
                        <dt>{t('金额')}</dt>
                        <dd
                          className='mono'
                          style={{
                            color: isError
                              ? 'var(--alog-red)'
                              : 'var(--alog-green)',
                            fontWeight: 600,
                          }}
                        >
                          {isSystem ? '+' : ''}
                          {renderQuota(record.quota, 6)}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              )}

              {expandRows && expandRows.length > 0 && (
                <div
                  className='alog-detail-section'
                  style={{ gridColumn: '1 / -1', marginTop: 4 }}
                >
                  <h4>{t('扩展信息')}</h4>
                  <dl className='alog-detail-kv alog-detail-kv-extra'>
                    {expandRows.map((row, idx) => {
                      const isMono =
                        typeof row.value === 'string' &&
                        (/^[\w-]{12,}$/.test(row.value) ||
                          /^\$[\d.]/.test(row.value) ||
                          row.key === 'Request ID');
                      const isMulti =
                        typeof row.value === 'string' &&
                        row.value.includes('\n');
                      return (
                        <React.Fragment key={`${row.key}-${idx}`}>
                          <dt>{row.key}</dt>
                          <dd
                            className={`${isMono ? 'mono' : ''} ${isMulti ? 'multi' : ''}`}
                          >
                            {row.value}
                          </dd>
                        </React.Fragment>
                      );
                    })}
                  </dl>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

/* ───────── Page ───────── */

const LogsPage = () => {
  const logsData = useLogsData();
  const {
    logs,
    expandData,
    loading,
    activePage,
    logCount,
    pageSize,
    handlePageChange,
    refresh,
    isAdminUser,
    stat,
    showStat,
    handleEyeClick,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    selectedLogType,
    setSelectedLogType,
    copyText,
    t,
  } = logsData;

  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [expanded, setExpanded] = useState(null);
  const searchInputRef = useRef(null);

  // Inject styles + auto-load stats once
  useEffect(() => {
    handleEyeClick && handleEyeClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSearchInput(searchQuery || '');
  }, [searchQuery]);

  // Re-fetch when filters change
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dateRange, selectedLogType]);

  // ⌘K / Ctrl+K → focus search
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

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleQuickRange = (key) => {
    const now = new Date();
    let start;
    if (key === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (key === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setDateRange([fmt(start), fmt(end)]);
  };

  // Active filter chips
  const activeFilters = [];
  if (selectedLogType && selectedLogType !== '0') {
    activeFilters.push({
      key: t('类型'),
      value: t(TYPE_LABEL[parseInt(selectedLogType)] || ''),
      onClear: () => setSelectedLogType('0'),
    });
  }
  if (searchQuery) {
    activeFilters.push({
      key: t('搜索'),
      value: searchQuery,
      onClear: () => {
        setSearchInput('');
        setSearchQuery('');
      },
    });
  }

  // Type pill options
  const typeOptions = [
    { value: '1', label: t('充值') },
    { value: '2', label: t('消费') },
    { value: '3', label: t('管理') },
    { value: '4', label: t('系统') },
    { value: '5', label: t('错误') },
    { value: '6', label: t('退款') },
  ];

  // KPI numbers (from stat endpoint)
  const totalCost = showStat && stat ? stat.quota : null;
  const totalRequests = showStat && stat ? stat.rpm : null;
  const totalTokens = showStat && stat ? stat.tpm : null;
  const avgPerRequest = totalRequests ? totalCost / totalRequests : null;

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(logCount / (pageSize || 1)));
  const renderPageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (activePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (activePage >= totalPages - 3)
      return [
        1,
        '…',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      '…',
      activePage - 1,
      activePage,
      activePage + 1,
      '…',
      totalPages,
    ];
  };

  // Detect quick-range key from current dateRange
  const detectRangeKey = () => {
    if (!Array.isArray(dateRange) || dateRange.length !== 2) return null;
    const start = new Date(dateRange[0]);
    const now = new Date();
    const diffDays = Math.round((now - start) / (24 * 60 * 60 * 1000));
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    if (Math.abs(start - startOfToday) < 60000) return 'today';
    if (Math.abs(diffDays - 7) <= 1) return '7d';
    if (Math.abs(diffDays - 30) <= 1) return '30d';
    return null;
  };

  // CSV export — current page only (no extra backend hop)
  const exportCsv = async () => {
    const headers = [
      '时间',
      '类型',
      '用户',
      '模型',
      '令牌',
      'Request ID',
      'Tokens(in)',
      'Tokens(out)',
      '耗时(s)',
      '是否流',
      '花费',
    ];
    const lines = [headers.join(',')];
    logs.forEach((r) => {
      const other = getLogOther(r.other);
      const row = [
        r.timestamp2string,
        TYPE_LABEL[r.type] || '',
        r.username || '',
        r.model_name || '',
        r.token_name || '',
        r.request_id || '',
        r.prompt_tokens || 0,
        r.completion_tokens || 0,
        r.use_time || 0,
        r.is_stream ? '流' : '非流',
        renderQuota(r.quota, 6),
      ].map((v) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      });
      lines.push(row.join(','));
    });
    const csv = lines.join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-logs-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess(t('已导出当前页 CSV'));
  };

  return (
    <>
      <UserInfoModal {...logsData} />
      <ChannelAffinityUsageCacheModal {...logsData} />
      <ParamOverrideModal {...logsData} />

      <div className='alog-root'>
        <style>{LOG_PAGE_STYLES}</style>
        <div className='alog-page'>
          <header className='alog-head'>
            <div>
              <h1 className='alog-title'>
                {t('使用记录')}
                <span className='alog-livedot'>{t('实时')}</span>
              </h1>
              <div className='alog-sub'>
                {t('每条 API 请求与系统事件的明细记录 · 默认显示最近 7 天')}
              </div>
            </div>
            <div className='alog-head-actions'>
              <button
                type='button'
                className='alog-btn'
                onClick={exportCsv}
                disabled={logs.length === 0}
              >
                <I.Download /> {t('导出')}
              </button>
              <button
                type='button'
                className='alog-iconbtn'
                onClick={() => {
                  refresh();
                  handleEyeClick && handleEyeClick();
                }}
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
              <div className='alog-kpi-label'>{t('累计花费')}</div>
              <div className='alog-kpi-value mono'>
                {totalCost !== null ? renderQuota(totalCost, 4) : '—'}
              </div>
              <div className='alog-kpi-foot'>
                <span>{t('在选中时间范围内')}</span>
              </div>
            </div>
            <div className='alog-kpi'>
              <div className='alog-kpi-label'>{t('总请求数')}</div>
              <div className='alog-kpi-value mono alog-kpi-grad-text'>
                {totalRequests !== null ? renderNumber(totalRequests) : '—'}
              </div>
              <div className='alog-kpi-foot'>
                <span>{t('成功 + 失败的全部调用')}</span>
              </div>
            </div>
            <div className='alog-kpi'>
              <div className='alog-kpi-label'>{t('Token 用量')}</div>
              <div className='alog-kpi-value mono alog-kpi-grad-text'>
                {totalTokens !== null
                  ? totalTokens >= 1000
                    ? `${(totalTokens / 1000).toFixed(1)}K`
                    : renderNumber(totalTokens)
                  : '—'}
              </div>
              <div className='alog-kpi-foot'>
                <span>{t('输入 + 输出 token 合计')}</span>
              </div>
            </div>
            <div className='alog-kpi'>
              <div className='alog-kpi-label'>{t('平均花费 / 请求')}</div>
              <div className='alog-kpi-value mono'>
                {avgPerRequest !== null && totalRequests > 0
                  ? renderQuota(avgPerRequest, 6)
                  : '—'}
              </div>
              <div className='alog-kpi-foot'>
                <span>{t('累计花费 / 总请求数')}</span>
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
                    ? t('搜索 Request ID / 模型 / 用户 / 令牌 / 分组 / 渠道…')
                    : t('搜索 Request ID / 模型 / 令牌 / 分组…')
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type='button'
                  className='alog-search-clear'
                  onClick={handleClearSearch}
                  aria-label={t('清除')}
                >
                  <I.Close />
                </button>
              )}
              <kbd
                style={{
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'var(--alog-line-soft)',
                  color: 'var(--alog-ink-500)',
                  border: '1px solid var(--alog-line)',
                  fontFamily: 'inherit',
                }}
              >
                ⌘K
              </kbd>
            </div>

            <div className='alog-toolbar-divider' />

            <FilterPillMenu
              label={t('类型')}
              value={selectedLogType || '0'}
              options={typeOptions}
              onChange={(v) => setSelectedLogType(v === 'all' ? '0' : v)}
              allLabel={t('全部')}
            />

            <div className='alog-toolbar-divider' />

            <QuickRanges current={detectRangeKey()} onPick={handleQuickRange} />

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px 4px 10px',
                borderRadius: 8,
                border: '1px solid var(--alog-line)',
                background: 'white',
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
                style={{
                  border: 'none',
                  background: 'transparent',
                  minWidth: 240,
                  padding: 0,
                }}
              />
            </div>
          </form>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className='alog-active-filters'>
              <span className='label'>{t('筛选条件')}</span>
              {activeFilters.map((f, i) => (
                <span key={i} className='alog-filter-tag'>
                  <span className='key'>{f.key}:</span>
                  {f.value}
                  <button type='button' className='x' onClick={f.onClear}>
                    <I.Close />
                  </button>
                </span>
              ))}
              <button
                type='button'
                className='alog-clear-all'
                onClick={() => {
                  setSelectedLogType('0');
                  setSearchInput('');
                  setSearchQuery('');
                }}
              >
                {t('清除全部')}
              </button>
            </div>
          )}

          {/* Table */}
          <div
            className={`alog-table-wrap ${activeFilters.length > 0 ? 'with-active-filters' : ''}`}
          >
            <div className='alog-table-scroll'>
              <table className='alog-table'>
                <thead>
                  <tr>
                    <th style={{ width: 155 }}>{t('时间')}</th>
                    <th style={{ width: 60 }}>{t('类型')}</th>
                    {isAdminUser && <th style={{ width: 140 }}>{t('用户')}</th>}
                    <th style={{ width: 180 }}>{t('模型')}</th>
                    <th style={{ width: 110 }}>{t('令牌')}</th>
                    <th>{t('详情 / 性能')}</th>
                    <th style={{ width: 90 }}>Tokens</th>
                    <th className='num' style={{ width: 110 }}>
                      {t('花费')}
                    </th>
                    <th style={{ width: 70 }} />
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={isAdminUser ? 9 : 8} className='alog-empty'>
                        {t('没有匹配的记录')}
                      </td>
                    </tr>
                  )}
                  {logs.map((record) => (
                    <Row
                      key={record.key || record.id}
                      record={record}
                      expanded={expanded === (record.key || record.id)}
                      onToggle={() => {
                        const k = record.key || record.id;
                        setExpanded(expanded === k ? null : k);
                      }}
                      expandRows={expandData[record.key || record.id]}
                      isAdminUser={isAdminUser}
                      t={t}
                      copyText={copyText}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {logCount > 0 && (
              <div className='alog-table-foot'>
                <div>
                  {t('共')}{' '}
                  <strong style={{ color: 'var(--alog-ink-900)' }}>
                    {logCount}
                  </strong>{' '}
                  {t('条')}
                  {' · '}
                  {t('第')} {activePage} / {totalPages} {t('页')}
                </div>
                <div className='alog-pager'>
                  <button
                    type='button'
                    disabled={activePage <= 1}
                    onClick={() =>
                      handlePageChange(Math.max(1, activePage - 1))
                    }
                  >
                    <I.ChevronL />
                  </button>
                  {renderPageNumbers().map((p, i) =>
                    p === '…' ? (
                      <span key={`e-${i}`} className='ellipsis'>
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type='button'
                        className={p === activePage ? 'active' : ''}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type='button'
                    disabled={activePage >= totalPages}
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, activePage + 1))
                    }
                  >
                    <I.ChevronR />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LogsPage;
