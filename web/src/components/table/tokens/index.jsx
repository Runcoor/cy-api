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
import {
  Notification,
  Button,
  Space,
  Toast,
  Select,
  Modal,
  Popover,
  Typography,
} from '@douyinfe/semi-ui';
import {
  API,
  showError,
  getModelCategories,
  selectFilter,
  renderQuota,
  timestamp2string,
  getRelativeTime,
} from '../../../helpers';
import { useTokensData } from '../../../hooks/tokens/useTokensData';
import EditTokenModal from './modals/EditTokenModal';
import CopyTokensModal from './modals/CopyTokensModal';
import DeleteTokensModal from './modals/DeleteTokensModal';
import CCSwitchModal from './modals/CCSwitchModal';

const { Paragraph } = Typography;

/* ───────── Inline icons (small, scoped to this page) ───────── */
const I = {
  Search: (p) => (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' {...p}>
      <circle cx='11' cy='11' r='7' /><path d='m20 20-3.5-3.5' />
    </svg>
  ),
  Plus: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' {...p}>
      <path d='M12 5v14M5 12h14' />
    </svg>
  ),
  Refresh: (p) => (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='M21 12a9 9 0 1 1-3-6.7L21 8' /><path d='M21 3v5h-5' />
    </svg>
  ),
  Eye: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' /><circle cx='12' cy='12' r='3' />
    </svg>
  ),
  EyeOff: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='M9.88 5.09A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.65 3.65M6.61 6.61A18 18 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 4.4-.92M2 2l20 20' />
    </svg>
  ),
  Copy: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <rect x='9' y='9' width='12' height='12' rx='2' /><path d='M5 15V5a2 2 0 0 1 2-2h10' />
    </svg>
  ),
  More: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <circle cx='5' cy='12' r='1.6' /><circle cx='12' cy='12' r='1.6' /><circle cx='19' cy='12' r='1.6' />
    </svg>
  ),
  Check: (p) => (
    <svg width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3.5' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='m4 12 5 5L20 6' />
    </svg>
  ),
  Chevron: (p) => (
    <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='m6 9 6 6 6-6' />
    </svg>
  ),
  ChevronR: (p) => (
    <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='m9 6 6 6-6 6' />
    </svg>
  ),
  ChevronL: (p) => (
    <svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='m15 6-6 6 6 6' />
    </svg>
  ),
  Close: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='M6 6l12 12M18 6 6 18' />
    </svg>
  ),
  Key: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <circle cx='8' cy='15' r='4' /><path d='m11 12 9-9 2 2-2 2 2 2-3 3-3-3' />
    </svg>
  ),
  Pulse: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='M3 12h4l3-9 4 18 3-9h4' />
    </svg>
  ),
  Wallet: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3' /><path d='M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3' />
      <path d='M21 12h-5a2 2 0 1 0 0 4h5' />
    </svg>
  ),
  Alert: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' />
      <path d='M12 9v4M12 17h.01' />
    </svg>
  ),
  Rows: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' {...p}>
      <rect x='3' y='4' width='18' height='6' rx='1.5' />
      <rect x='3' y='14' width='18' height='6' rx='1.5' />
    </svg>
  ),
  RowsDense: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' {...p}>
      <path d='M3 6h18M3 10h18M3 14h18M3 18h18' />
    </svg>
  ),
  Trash: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6' />
    </svg>
  ),
  Power: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='M12 2v10' /><path d='M18.4 6.6a9 9 0 1 1-12.8 0' />
    </svg>
  ),
  Edit: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='M12 20h9' /><path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z' />
    </svg>
  ),
  Comment: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
    </svg>
  ),
};

/* ───────── Helpers ───────── */
const STATUS_META = {
  1: { key: 'active', label: '已启用', cls: 'active' },
  2: { key: 'disabled', label: '已禁用', cls: 'disabled' },
  3: { key: 'expired', label: '已过期', cls: 'expired' },
  4: { key: 'exhausted', label: '已耗尽', cls: 'exhausted' },
};

const isExpiredByTime = (record) => {
  if (!record) return false;
  if (record.expired_time === -1 || record.expired_time === undefined) return false;
  return record.expired_time * 1000 <= Date.now();
};

const effectiveStatus = (record) => {
  if (!record) return 4;
  if (record.status === 1 && isExpiredByTime(record)) return 3;
  return record.status;
};

const isWarning = (record) => {
  if (effectiveStatus(record) !== 1) return false;
  if (record.unlimited_quota) return false;
  const used = parseInt(record.used_quota) || 0;
  const remain = parseInt(record.remain_quota) || 0;
  const total = used + remain;
  if (total <= 0) return false;
  return remain * 100 < total * 15;
};

const formatRelative = (timestamp) => {
  if (!timestamp || timestamp <= 0) return '从未使用';
  return getRelativeTime(timestamp * 1000);
};

const isFreshAccess = (timestamp) => {
  if (!timestamp || timestamp <= 0) return false;
  return Date.now() - timestamp * 1000 < 5 * 60 * 1000;
};

/* ───────── Page CSS (scoped to .aks-root) ───────── */
const PAGE_STYLES = `
.aks-root {
  --aks-blue-1: #0072ff;
  --aks-blue-2: #00c6ff;
  --aks-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --aks-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --aks-grad-softer: linear-gradient(135deg, rgba(0,114,255,0.04) 0%, rgba(0,198,255,0.04) 100%);
  --aks-ink-900: #0b1a2b;
  --aks-ink-700: #2a3a4d;
  --aks-ink-500: #5b6878;
  --aks-ink-400: #8593a3;
  --aks-ink-300: #b6bfca;
  --aks-line: #e8edf3;
  --aks-line-soft: #f1f4f8;
  --aks-bg: #f6f8fc;
  --aks-card: #ffffff;
  --aks-radius: 12px;
  --aks-radius-sm: 8px;
  --aks-ok: #14b86c;
  --aks-warn: #f5a623;
  --aks-danger: #ef5b5b;
  font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 13px;
  line-height: 1.45;
  color: var(--aks-ink-900);
  background: var(--aks-bg);
  min-height: 100%;
}
.aks-root *, .aks-root *::before, .aks-root *::after { box-sizing: border-box; }
.aks-root .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
.aks-root button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.aks-root input { font-family: inherit; }

.aks-page { max-width: 1320px; margin: 0 auto; padding: 24px 28px 60px; }

/* header */
.aks-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 18px; flex-wrap: wrap; }
.aks-title { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; margin: 0; display: flex; align-items: center; gap: 10px; color: var(--aks-ink-900); }
.aks-badge-pro {
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
  background: var(--aks-grad); color: white; letter-spacing: 0.04em;
}
.aks-sub { font-size: 12px; color: var(--aks-ink-500); margin-top: 4px; }

/* buttons */
.aks-btn {
  height: 32px; padding: 0 14px; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all .12s; white-space: nowrap;
}
.aks-btn.primary { background: var(--aks-grad); color: white; box-shadow: 0 2px 8px rgba(0,114,255,0.25); }
.aks-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,114,255,0.35); }
.aks-btn.ghost { background: var(--aks-card); color: var(--aks-ink-700); border: 1px solid var(--aks-line); }
.aks-btn.ghost:hover { color: var(--aks-blue-1); border-color: rgba(0,114,255,0.3); }
.aks-icon-btn {
  width: 30px; height: 30px; border-radius: 7px;
  background: var(--aks-card); border: 1px solid var(--aks-line);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--aks-ink-500); transition: all .12s;
}
.aks-icon-btn:hover { color: var(--aks-blue-1); border-color: rgba(0,114,255,0.3); }
.aks-icon-btn.flat { background: transparent; border-color: transparent; }
.aks-icon-btn.flat:hover { background: var(--aks-line-soft); }
.aks-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* metric strip */
.aks-metrics {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
  background: var(--aks-line); border: 1px solid var(--aks-line);
  border-radius: var(--aks-radius); overflow: hidden; margin-bottom: 16px;
}
.aks-metric {
  background: var(--aks-card); padding: 14px 18px;
  display: flex; align-items: center; gap: 14px;
  position: relative; min-width: 0;
}
.aks-metric-icon {
  width: 36px; height: 36px; border-radius: 9px;
  background: var(--aks-grad-soft); color: var(--aks-blue-1);
  display: inline-flex; align-items: center; justify-content: center;
  flex: none;
}
.aks-metric-icon.ok { background: rgba(20,184,108,0.1); color: var(--aks-ok); }
.aks-metric-icon.warn { background: rgba(245,166,35,0.1); color: var(--aks-warn); }
.aks-metric-body { flex: 1; min-width: 0; }
.aks-metric-label { font-size: 11px; color: var(--aks-ink-500); font-weight: 500; }
.aks-metric-value { font-size: 20px; font-weight: 700; font-family: 'JetBrains Mono', ui-monospace, monospace; line-height: 1.1; margin-top: 4px; letter-spacing: -0.01em; word-break: break-all; }
.aks-metric-foot { font-size: 11px; color: var(--aks-ink-400); margin-top: 2px; display: flex; gap: 6px; align-items: center; }

/* tabs */
.aks-tabs { display: flex; align-items: center; gap: 4px; border-bottom: 1px solid var(--aks-line); margin-bottom: 14px; padding: 0 4px; flex-wrap: wrap; }
.aks-tab {
  padding: 10px 14px; font-size: 13px; font-weight: 500; color: var(--aks-ink-500);
  cursor: pointer; position: relative; display: inline-flex; align-items: center; gap: 6px;
  border: none; background: transparent;
}
.aks-tab .count {
  font-size: 10px; padding: 1px 6px; border-radius: 999px;
  background: var(--aks-line-soft); color: var(--aks-ink-500); font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.aks-tab:hover { color: var(--aks-ink-900); }
.aks-tab.active { color: var(--aks-blue-1); font-weight: 600; }
.aks-tab.active .count { background: var(--aks-grad-soft); color: var(--aks-blue-1); }
.aks-tab.active::after {
  content: ''; position: absolute; left: 12px; right: 12px; bottom: -1px; height: 2px;
  background: var(--aks-grad); border-radius: 2px;
}

/* toolbar */
.aks-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.aks-search {
  display: flex; align-items: center; gap: 8px;
  background: var(--aks-card); border: 1px solid var(--aks-line);
  border-radius: 8px; padding: 0 10px;
  height: 32px; flex: 1; min-width: 220px; max-width: 360px;
  transition: all .12s;
}
.aks-search:focus-within { border-color: rgba(0,114,255,0.4); box-shadow: 0 0 0 3px rgba(0,114,255,0.08); }
.aks-search svg { color: var(--aks-ink-400); flex: none; }
.aks-search input { border: none; outline: none; background: transparent; flex: 1; font-size: 12px; color: var(--aks-ink-900); }
.aks-search input::placeholder { color: var(--aks-ink-400); }
.aks-search kbd { font-size: 10px; padding: 1px 5px; border-radius: 4px; background: var(--aks-line-soft); color: var(--aks-ink-500); border: 1px solid var(--aks-line); font-family: inherit; }

.aks-pill {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 12px;
  background: var(--aks-card); border: 1px solid var(--aks-line);
  border-radius: 8px; font-size: 12px; color: var(--aks-ink-700); font-weight: 500;
  cursor: pointer; transition: all .12s;
}
.aks-pill:hover { border-color: rgba(0,114,255,0.3); color: var(--aks-blue-1); }
.aks-pill.has-value { border-color: rgba(0,114,255,0.3); color: var(--aks-blue-1); background: var(--aks-grad-soft); }
.aks-pill .key { color: var(--aks-ink-500); font-weight: 500; }
.aks-pill .val { font-weight: 600; }

.aks-toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.aks-density { display: inline-flex; padding: 2px; background: var(--aks-card); border: 1px solid var(--aks-line); border-radius: 7px; height: 32px; }
.aks-density button { padding: 0 8px; border-radius: 5px; color: var(--aks-ink-500); display: inline-flex; align-items: center; }
.aks-density button.active { background: var(--aks-grad-soft); color: var(--aks-blue-1); }

/* dropdown menu (shared by filter pills and row actions) */
.aks-dd-wrap { position: relative; display: inline-block; }
.aks-menu {
  position: absolute; top: calc(100% + 4px); right: 0;
  min-width: 180px; background: white;
  border: 1px solid var(--aks-line); border-radius: 8px;
  box-shadow: 0 8px 24px -6px rgba(11,26,43,0.15);
  padding: 4px; z-index: 30;
  font-size: 12px;
}
.aks-menu.left { right: auto; left: 0; }
/* portal-rendered row menu — escapes table-card overflow:hidden */
.aks-menu-portal {
  position: fixed;
  min-width: 180px; background: white;
  border: 1px solid var(--aks-line); border-radius: 8px;
  box-shadow: 0 8px 24px -6px rgba(11,26,43,0.15);
  padding: 4px; z-index: 1100;
  font-size: 12px;
  font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  --aks-blue-1: #0072ff;
  --aks-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --aks-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --aks-ink-700: #2a3a4d;
  --aks-ink-400: #8593a3;
  --aks-line: #e8edf3;
  --aks-danger: #ef5b5b;
}
.aks-menu-portal .aks-menu-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 5px; cursor: pointer; color: var(--aks-ink-700);
  user-select: none;
}
.aks-menu-portal .aks-menu-item:hover { background: var(--aks-grad-soft); color: var(--aks-blue-1); }
.aks-menu-portal .aks-menu-item.danger { color: var(--aks-danger); }
.aks-menu-portal .aks-menu-item.danger:hover { background: rgba(239,91,91,0.06); }
.aks-menu-portal .aks-menu-divider { height: 1px; background: var(--aks-line); margin: 4px 2px; }
.aks-menu-portal .aks-menu-section-label { font-size: 10px; color: var(--aks-ink-400); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; padding: 6px 10px 4px; }
@media (prefers-color-scheme: dark) {
  .aks-menu-portal[data-theme='auto'] {
    background: #131c27; border-color: #1f2a37;
    --aks-ink-700: #c4ccd5;
    --aks-line: #1f2a37;
  }
}
.aks-menu-portal[data-theme='dark'] {
  background: #131c27; border-color: #1f2a37;
  --aks-ink-700: #c4ccd5;
  --aks-line: #1f2a37;
}
.aks-menu-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 5px; cursor: pointer; color: var(--aks-ink-700);
  user-select: none;
}
.aks-menu-item:hover { background: var(--aks-grad-soft); color: var(--aks-blue-1); }
.aks-menu-item.danger { color: var(--aks-danger); }
.aks-menu-item.danger:hover { background: rgba(239,91,91,0.06); }
.aks-menu-item.disabled { color: var(--aks-ink-400); cursor: not-allowed; }
.aks-menu-item.disabled:hover { background: transparent; color: var(--aks-ink-400); }
.aks-menu-divider { height: 1px; background: var(--aks-line); margin: 4px 2px; }
.aks-menu-section-label { font-size: 10px; color: var(--aks-ink-400); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; padding: 6px 10px 4px; }

/* layout + table */
.aks-table-card { background: var(--aks-card); border: 1px solid var(--aks-line); border-radius: var(--aks-radius); overflow: hidden; }
.aks-table-scroll { overflow-x: auto; }
.aks-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.aks-table thead th {
  text-align: left; font-size: 10px; font-weight: 600; color: var(--aks-ink-500);
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 11px 14px; background: #fafbfd; border-bottom: 1px solid var(--aks-line);
  white-space: nowrap;
}
.aks-table thead th.num { text-align: right; }
.aks-table tbody td { padding: 10px 14px; border-bottom: 1px solid var(--aks-line-soft); vertical-align: middle; }
.aks-table tbody tr:last-child td { border-bottom: none; }
.aks-table tbody tr { cursor: default; transition: background .1s; }
.aks-table tbody tr:hover { background: #fafbfd; }
.aks-table .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }

/* density */
.aks-root.dense .aks-table tbody td { padding: 7px 14px; }

/* name + status */
.aks-name-stack { line-height: 1.3; }
.aks-name-stack .n { font-weight: 600; font-size: 13px; color: var(--aks-ink-900); display: inline-flex; align-items: center; gap: 6px; }
.aks-name-stack .id { font-size: 11px; color: var(--aks-ink-400); margin-top: 1px; font-family: 'JetBrains Mono', ui-monospace, monospace; }
.aks-status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.aks-status-dot.active { background: var(--aks-ok); box-shadow: 0 0 0 3px rgba(20,184,108,0.16); }
.aks-status-dot.disabled { background: var(--aks-ink-300); }
.aks-status-dot.expired { background: var(--aks-danger); }
.aks-status-dot.warning { background: var(--aks-warn); box-shadow: 0 0 0 3px rgba(245,166,35,0.16); }
.aks-status-dot.exhausted { background: var(--aks-danger); }
.aks-status-pill {
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
  display: inline-flex; align-items: center; gap: 4px;
  text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
}
.aks-status-pill.active { background: rgba(20,184,108,0.1); color: var(--aks-ok); }
.aks-status-pill.disabled { background: var(--aks-line-soft); color: var(--aks-ink-500); }
.aks-status-pill.expired { background: rgba(239,91,91,0.1); color: var(--aks-danger); }
.aks-status-pill.warning { background: rgba(245,166,35,0.1); color: var(--aks-warn); }
.aks-status-pill.exhausted { background: rgba(239,91,91,0.1); color: var(--aks-danger); }

.aks-group-tag {
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
  background: var(--aks-grad-soft); color: var(--aks-blue-1);
  text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
}
.aks-group-tag.muted { background: var(--aks-line-soft); color: var(--aks-ink-500); }

.aks-quota-cell { display: flex; align-items: center; gap: 8px; min-width: 140px; }
.aks-quota-bar { flex: 1; height: 4px; border-radius: 2px; background: var(--aks-line-soft); overflow: hidden; min-width: 60px; }
.aks-quota-fill { height: 100%; background: var(--aks-grad); border-radius: 2px; transition: width .25s; }
.aks-quota-fill.warn { background: linear-gradient(90deg, #f5a623, #ef5b5b); }
.aks-quota-fill.muted { background: var(--aks-ink-300); }
.aks-quota-text { font-size: 11px; color: var(--aks-ink-700); font-variant-numeric: tabular-nums; white-space: nowrap; }
.aks-quota-text .total { color: var(--aks-ink-400); }

.aks-key-cell { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.aks-key-mask { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; color: var(--aks-ink-700); letter-spacing: 0.5px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aks-key-actions { display: inline-flex; gap: 2px; opacity: 0; transition: opacity .12s; }
.aks-table tbody tr:hover .aks-key-actions { opacity: 1; }

.aks-last-used { font-size: 11px; color: var(--aks-ink-500); white-space: nowrap; }
.aks-last-used.fresh { color: var(--aks-ok); font-weight: 600; }

/* checkbox */
.aks-cb {
  width: 14px; height: 14px; border-radius: 3px;
  border: 1.5px solid var(--aks-ink-300);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; background: white; flex: none;
  transition: all .12s; color: white;
}
.aks-cb.checked { background: var(--aks-grad); border-color: transparent; }
.aks-cb svg { opacity: 0; }
.aks-cb.checked svg { opacity: 1; }
.aks-cb.indeterminate { background: var(--aks-grad); border-color: transparent; position: relative; }
.aks-cb.indeterminate::after { content: ''; width: 7px; height: 1.5px; background: white; border-radius: 1px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.aks-cb.indeterminate svg { display: none; }

/* table footer */
.aks-table-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-top: 1px solid var(--aks-line); background: #fafbfd;
  font-size: 12px; color: var(--aks-ink-500); flex-wrap: wrap; gap: 12px;
}
.aks-pager { display: inline-flex; gap: 4px; align-items: center; }
.aks-pager button {
  min-width: 28px; height: 28px; padding: 0 8px; border-radius: 6px;
  font-size: 12px; font-weight: 500; color: var(--aks-ink-700);
  border: 1px solid var(--aks-line); background: white;
}
.aks-pager button:hover:not(:disabled) { color: var(--aks-blue-1); border-color: rgba(0,114,255,0.3); }
.aks-pager button.active { background: var(--aks-grad); border-color: transparent; color: white; }
.aks-pager button:disabled { opacity: 0.4; cursor: not-allowed; }
.aks-pager .ellipsis { color: var(--aks-ink-400); padding: 0 4px; }

/* bulk action bar */
.aks-bulk-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 14px;
  background: var(--aks-grad-soft);
  border-top: 1px solid rgba(0,114,255,0.15);
  border-bottom: 1px solid rgba(0,114,255,0.15);
  font-size: 12px; flex-wrap: wrap;
}
.aks-bulk-bar .count-pill { background: var(--aks-grad); color: white; padding: 2px 8px; border-radius: 999px; font-weight: 600; font-size: 11px; }
.aks-bulk-bar .actions { margin-left: auto; display: flex; gap: 6px; flex-wrap: wrap; }
.aks-bulk-bar .actions button { font-size: 11px; height: 26px; padding: 0 10px; border-radius: 6px; background: white; color: var(--aks-ink-700); border: 1px solid rgba(0,114,255,0.15); display: inline-flex; align-items: center; gap: 5px; }
.aks-bulk-bar .actions button:hover { color: var(--aks-blue-1); border-color: rgba(0,114,255,0.4); }
.aks-bulk-bar .actions button.danger:hover { color: var(--aks-danger); border-color: rgba(239,91,91,0.3); }

/* empty state */
.aks-empty { padding: 60px 20px; text-align: center; color: var(--aks-ink-400); font-size: 12px; }

@media (max-width: 900px) {
  .aks-metrics { grid-template-columns: repeat(2, 1fr); }
  .aks-page { padding: 16px 14px 40px; }
}

/* dark mode */
@media (prefers-color-scheme: dark) {
  .aks-root[data-theme='auto'] {
    --aks-ink-900: #e6eaf0;
    --aks-ink-700: #c4ccd5;
    --aks-ink-500: #8593a3;
    --aks-ink-400: #6c7a8b;
    --aks-ink-300: #4a5564;
    --aks-line: #1f2a37;
    --aks-line-soft: #182230;
    --aks-bg: #0b121b;
    --aks-card: #131c27;
  }
  .aks-root[data-theme='auto'] .aks-table thead th { background: #182230; }
  .aks-root[data-theme='auto'] .aks-table tbody tr:hover { background: #182230; }
  .aks-root[data-theme='auto'] .aks-table-foot { background: #182230; }
}
.aks-root[data-theme='dark'] {
  --aks-ink-900: #e6eaf0;
  --aks-ink-700: #c4ccd5;
  --aks-ink-500: #8593a3;
  --aks-ink-400: #6c7a8b;
  --aks-ink-300: #4a5564;
  --aks-line: #1f2a37;
  --aks-line-soft: #182230;
  --aks-bg: #0b121b;
  --aks-card: #131c27;
}
.aks-root[data-theme='dark'] .aks-table thead th { background: #182230; }
.aks-root[data-theme='dark'] .aks-table tbody tr:hover { background: #182230; }
.aks-root[data-theme='dark'] .aks-table-foot { background: #182230; }
`;

/* ───────── Small reusable components ───────── */

const FilterPill = ({ label, value, options, onChange, openId, setOpenId, mid }) => {
  const open = openId === mid;
  const cur = options.find((o) => o.v === value);
  const hasValue = value !== '' && value !== 'all';
  return (
    <div className='aks-dd-wrap'>
      <button
        type='button'
        className={`aks-pill ${hasValue ? 'has-value' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpenId(open ? null : mid);
        }}
      >
        <span className='key'>{label}：</span>
        <span className='val'>{cur?.l || options[0]?.l}</span>
        <I.Chevron />
      </button>
      {open && (
        <div className='aks-menu left' onClick={(e) => e.stopPropagation()}>
          {options.map((o) => (
            <div
              key={o.v}
              className='aks-menu-item'
              onClick={() => {
                onChange(o.v);
                setOpenId(null);
              }}
            >
              <span style={{ width: 12, color: 'var(--aks-blue-1)' }}>
                {value === o.v ? <I.Check /> : null}
              </span>
              {o.l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Cb = ({ checked, indeterminate, onClick }) => (
  <span
    role='checkbox'
    aria-checked={checked}
    className={`aks-cb ${checked ? 'checked' : ''} ${indeterminate ? 'indeterminate' : ''}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick && onClick(e);
    }}
  >
    <I.Check />
  </span>
);

/* ───────── Main page ───────── */

function TokensPage() {
  const openFluentNotificationRef = useRef(null);
  const openCCSwitchModalRef = useRef(null);
  const tokensData = useTokensData(
    (key) => openFluentNotificationRef.current?.(key),
    (key) => openCCSwitchModalRef.current?.(key),
  );

  const {
    tokens,
    loading,
    activePage,
    tokenCount,
    pageSize,

    selectedKeys,
    setSelectedKeys,

    showEdit,
    setShowEdit,
    editingToken,
    setEditingToken,
    closeEdit,

    compactMode,
    setCompactMode,
    showKeys,
    resolvedTokenKeys,
    loadingTokenKeys,

    searchQuery,
    setSearchQuery,

    statusFilter,
    setStatusFilter,
    groupFilter,
    setGroupFilter,
    stats,
    loadStats,

    loadTokens,
    refresh,
    fetchTokenKey,
    toggleTokenVisibility,
    copyTokenKey,
    copyTokenConnectionString,
    onOpenLink,
    manageToken,
    searchTokens,
    handlePageChange,
    batchCopyTokens,
    batchDeleteTokens,

    t,
  } = tokensData;

  /* ─── Local state ─── */
  const [openMenuId, setOpenMenuId] = useState(null);
  // Row More menu — rendered via portal so it escapes the table-card's
  // overflow:hidden / overflow-x:auto clipping. Stored as
  // {record, top, right} when a button is clicked.
  const [rowMenu, setRowMenu] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [groupOptions, setGroupOptions] = useState([{ v: '', l: '全部分组' }]);
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [fluentNoticeOpen, setFluentNoticeOpen] = useState(false);
  const [prefillKey, setPrefillKey] = useState('');
  const [ccSwitchVisible, setCCSwitchVisible] = useState(false);
  const [ccSwitchKey, setCCSwitchKey] = useState('');
  const searchInputRef = useRef(null);
  const latestRef = useRef({});

  /* Keep latest pieces accessible inside Notification handlers */
  useEffect(() => {
    latestRef.current = {
      tokens,
      selectedKeys,
      t,
      selectedModel,
      prefillKey,
      fetchTokenKey,
    };
  }, [tokens, selectedKeys, t, selectedModel, prefillKey, fetchTokenKey]);

  /* Initial loads */
  useEffect(() => {
    loadStats();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sync local search input <- global state */
  useEffect(() => {
    setSearchInput(searchQuery || '');
  }, [searchQuery]);

  /* Close menus on outside click + on scroll/resize for the row menu */
  useEffect(() => {
    const onDocClick = () => {
      setOpenMenuId(null);
      setRowMenu(null);
    };
    const onScrollOrResize = () => setRowMenu(null);
    document.addEventListener('click', onDocClick);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  /* ⌘K / Ctrl+K focuses search */
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

  /* Re-fetch list when statusFilter or groupFilter change */
  useEffect(() => {
    if (searchQuery) return; // skip while user is searching
    loadTokens(1, pageSize, statusFilter, groupFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, groupFilter]);

  /* Load user's selectable groups for the group filter pill */
  const loadGroups = async () => {
    try {
      const res = await API.get('/api/user/self/groups');
      const { success, data } = res.data || {};
      if (success && data) {
        const opts = [{ v: '', l: t('全部分组') }];
        Object.entries(data).forEach(([group, info]) => {
          opts.push({ v: group, l: (info && info.desc) || group });
        });
        setGroupOptions(opts);
      }
    } catch (_) {}
  };

  /* Models — needed by FluentRead notification */
  const loadModels = async () => {
    try {
      const res = await API.get('/api/user/models');
      const { success, message, data } = res.data || {};
      if (success) {
        const categories = getModelCategories(t);
        const options = (data || []).map((model) => {
          let icon = null;
          for (const [key, category] of Object.entries(categories)) {
            if (key !== 'all' && category.filter({ model_name: model })) {
              icon = category.icon;
              break;
            }
          }
          return {
            label: (
              <span className='flex items-center gap-1'>
                {icon}
                {model}
              </span>
            ),
            value: model,
          };
        });
        setModelOptions(options);
      } else {
        showError(t(message));
      }
    } catch (e) {
      showError(e.message || 'Failed to load models');
    }
  };

  /* ─── FluentRead integration (kept verbatim from previous shell) ─── */
  function openFluentNotification(key) {
    const { t: tt } = latestRef.current;
    const SUPPRESS_KEY = 'fluent_notify_suppressed';
    if (modelOptions.length === 0) loadModels();
    if (!key && localStorage.getItem(SUPPRESS_KEY) === '1') return;
    const container = document.getElementById('fluent-aggre-api-container');
    if (!container) {
      Toast.warning(tt('未检测到 FluentRead（流畅阅读），请确认扩展已启用'));
      return;
    }
    setPrefillKey(key || '');
    setFluentNoticeOpen(true);
    Notification.info({
      id: 'fluent-detected',
      title: tt('检测到 FluentRead（流畅阅读）'),
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            {key
              ? tt('请选择模型。')
              : tt('选择模型后可一键填充当前选中令牌（或本页第一个令牌）。')}
          </div>
          <div style={{ marginBottom: 8 }}>
            <Select
              placeholder={tt('请选择模型')}
              optionList={modelOptions}
              onChange={setSelectedModel}
              filter={selectFilter}
              style={{ width: 320 }}
              showClear
              searchable
              emptyContent={tt('暂无数据')}
            />
          </div>
          <Space>
            <Button
              theme='solid'
              type='primary'
              onClick={handlePrefillToFluent}
            >
              {tt('一键填充到 FluentRead')}
            </Button>
            {!key && (
              <Button
                type='warning'
                onClick={() => {
                  localStorage.setItem(SUPPRESS_KEY, '1');
                  Notification.close('fluent-detected');
                  Toast.info(tt('已关闭后续提醒'));
                }}
              >
                {tt('不再提醒')}
              </Button>
            )}
            <Button
              type='tertiary'
              onClick={() => Notification.close('fluent-detected')}
            >
              {tt('关闭')}
            </Button>
          </Space>
        </div>
      ),
      duration: 0,
    });
  }
  openFluentNotificationRef.current = openFluentNotification;

  function openCCSwitchModal(key) {
    if (modelOptions.length === 0) loadModels();
    setCCSwitchKey(key || '');
    setCCSwitchVisible(true);
  }
  openCCSwitchModalRef.current = openCCSwitchModal;

  const handlePrefillToFluent = async () => {
    const {
      tokens: tks,
      selectedKeys: sel,
      t: tt,
      selectedModel: chosenModel,
      prefillKey: overrideKey,
      fetchTokenKey: fetchKey,
    } = latestRef.current;
    const container = document.getElementById('fluent-aggre-api-container');
    if (!container) {
      Toast.error(tt('未检测到 Fluent 容器'));
      return;
    }
    if (!chosenModel) {
      Toast.warning(tt('请选择模型'));
      return;
    }
    let status = localStorage.getItem('status');
    let serverAddress = '';
    if (status) {
      try {
        status = JSON.parse(status);
        serverAddress = status.server_address || '';
      } catch (_) {}
    }
    if (!serverAddress) serverAddress = window.location.origin;

    let apiKeyToUse = '';
    if (overrideKey) {
      apiKeyToUse = 'sk-' + overrideKey;
    } else {
      const tk = sel && sel.length === 1 ? sel[0] : tks && tks.length > 0 ? tks[0] : null;
      if (!tk) {
        Toast.warning(tt('没有可用令牌用于填充'));
        return;
      }
      try {
        apiKeyToUse = 'sk-' + (await fetchKey(tk));
      } catch (_) {
        return;
      }
    }
    const payload = {
      id: 'aggre-api',
      baseUrl: serverAddress,
      apiKey: apiKeyToUse,
      model: chosenModel,
    };
    container.dispatchEvent(new CustomEvent('fluent:prefill', { detail: payload }));
    Toast.success(tt('已发送到 Fluent'));
    Notification.close('fluent-detected');
  };

  useEffect(() => {
    const onAppeared = () => openFluentNotification();
    const onRemoved = () => {
      setFluentNoticeOpen(false);
      Notification.close('fluent-detected');
    };
    window.addEventListener('fluent-container:appeared', onAppeared);
    window.addEventListener('fluent-container:removed', onRemoved);
    return () => {
      window.removeEventListener('fluent-container:appeared', onAppeared);
      window.removeEventListener('fluent-container:removed', onRemoved);
    };
  }, []);

  useEffect(() => {
    if (fluentNoticeOpen) openFluentNotification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelOptions, selectedModel, t, fluentNoticeOpen]);

  useEffect(() => {
    const selector = '#fluent-aggre-api-container';
    const root = document.body || document.documentElement;
    const existing = document.querySelector(selector);
    if (existing) {
      window.dispatchEvent(new CustomEvent('fluent-container:appeared', { detail: existing }));
    }
    const isOrContainsTarget = (node) => {
      if (!(node && node.nodeType === 1)) return false;
      if (node.id === 'fluent-aggre-api-container') return true;
      return typeof node.querySelector === 'function' && !!node.querySelector(selector);
    };
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const added of m.addedNodes) {
          if (isOrContainsTarget(added)) {
            const el = document.querySelector(selector);
            if (el) {
              window.dispatchEvent(new CustomEvent('fluent-container:appeared', { detail: el }));
            }
            break;
          }
        }
        for (const removed of m.removedNodes) {
          if (isOrContainsTarget(removed)) {
            const elNow = document.querySelector(selector);
            if (!elNow) {
              window.dispatchEvent(new CustomEvent('fluent-container:removed'));
            }
            break;
          }
        }
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  /* ─── Computed ─── */
  const totalPages = Math.max(1, Math.ceil(tokenCount / (pageSize || 1)));

  const tabCounts = {
    all: stats?.total ?? '',
    active: stats?.active ?? '',
    disabled: stats?.disabled ?? '',
    expired: stats?.expired ?? '',
  };

  const allOnPageChecked = tokens.length > 0 && selectedKeys.length === tokens.length;
  const someOnPageChecked = selectedKeys.length > 0 && !allOnPageChecked;

  const toggleSelectOne = (record) => {
    const exists = selectedKeys.find((k) => k.id === record.id);
    if (exists) setSelectedKeys(selectedKeys.filter((k) => k.id !== record.id));
    else setSelectedKeys([...selectedKeys, record]);
  };
  const toggleSelectAll = () => {
    if (allOnPageChecked) setSelectedKeys([]);
    else setSelectedKeys(tokens);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchQuery(searchInput);
    if (searchInput) {
      searchTokens(1, pageSize, searchInput);
    } else {
      loadTokens(1, pageSize, statusFilter, groupFilter);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    loadTokens(1, pageSize, statusFilter, groupFilter);
  };

  const handleTabChange = (key) => {
    setSelectedKeys([]);
    if (searchQuery) {
      setSearchInput('');
      setSearchQuery('');
    }
    setStatusFilter(key);
  };

  const handleGroupChange = (group) => {
    setSelectedKeys([]);
    setGroupFilter(group);
  };

  const handleRowMore = (e, record) => {
    e.stopPropagation();
    if (rowMenu && rowMenu.record.id === record.id) {
      setRowMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200; // approximate; right-anchored
    const menuMaxHeight = 360;
    // Right-align to the button; flip upward when not enough room below.
    const top =
      rect.bottom + menuMaxHeight > window.innerHeight - 8
        ? rect.top - menuMaxHeight - 4
        : rect.bottom + 4;
    const left = Math.max(8, rect.right - menuWidth);
    setRowMenu({ record, top, left });
  };

  const handleEdit = (record) => {
    setEditingToken(record);
    setShowEdit(true);
  };

  const handleToggleStatus = async (record) => {
    setOpenMenuId(null);
    const action = record.status === 1 ? 'disable' : 'enable';
    await manageToken(record.id, action, record);
    await refresh();
  };

  const handleDelete = (record) => {
    setOpenMenuId(null);
    Modal.confirm({
      title: t('确定是否要删除此令牌？'),
      content: t('此修改将不可逆'),
      onOk: async () => {
        await manageToken(record.id, 'delete', record);
        await refresh();
      },
    });
  };

  const handleBatchCopy = () => {
    if (selectedKeys.length === 0) {
      showError(t('请至少选择一个令牌！'));
      return;
    }
    setShowCopyModal(true);
  };

  const handleBatchDelete = () => {
    if (selectedKeys.length === 0) {
      showError(t('请至少选择一个令牌！'));
      return;
    }
    setShowDeleteModal(true);
  };

  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (activePage >= totalPages - 3)
      return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', activePage - 1, activePage, activePage + 1, '…', totalPages];
  };

  /* Build chat link list once per render — used by row More menu */
  const chatLinks = useMemo(() => {
    let arr = [];
    try {
      const raw = localStorage.getItem('chats');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (let i = 0; i < parsed.length; i++) {
          const item = parsed[i];
          const name = Object.keys(item)[0];
          if (!name) continue;
          arr.push({ name, value: item[name] });
        }
      }
    } catch (_) {}
    return arr;
  }, []);

  return (
    <div className='aks-root' data-theme='auto'>
      <style>{PAGE_STYLES}</style>
      <div className={`aks-page ${compactMode ? 'aks-page-dense' : ''}`} style={compactMode ? {} : {}}>
        {/* Make density a class on root for the table */}
        <DensityClassEffect dense={compactMode} />

        {/* Header */}
        <header className='aks-head'>
          <div>
            <h1 className='aks-title'>
              {t('API 密钥管理')}
              <span className='aks-badge-pro'>{t('ENTERPRISE')}</span>
            </h1>
            <div className='aks-sub'>
              {t('为应用、服务和合作伙伴签发并管理访问凭证 · 全量审计追踪')}
            </div>
          </div>
          <div>
            <button
              type='button'
              className='aks-btn primary'
              onClick={() => {
                setEditingToken({ id: undefined });
                setShowEdit(true);
              }}
            >
              <I.Plus /> {t('新建令牌')}
            </button>
          </div>
        </header>

        {/* Metric strip */}
        <div className='aks-metrics'>
          <div className='aks-metric'>
            <div className='aks-metric-icon'><I.Key /></div>
            <div className='aks-metric-body'>
              <div className='aks-metric-label'>{t('总令牌数')}</div>
              <div className='aks-metric-value'>{stats ? stats.total : '—'}</div>
              <div className='aks-metric-foot'>
                <span>{t('账户内全部令牌')}</span>
              </div>
            </div>
          </div>
          <div className='aks-metric'>
            <div className='aks-metric-icon ok'><I.Pulse /></div>
            <div className='aks-metric-body'>
              <div className='aks-metric-label'>{t('活跃令牌')}</div>
              <div className='aks-metric-value'>{stats ? stats.active : '—'}</div>
              <div className='aks-metric-foot'>
                <span>{t('当前可用于调用')}</span>
              </div>
            </div>
          </div>
          <div className='aks-metric'>
            <div className='aks-metric-icon'><I.Wallet /></div>
            <div className='aks-metric-body'>
              <div className='aks-metric-label'>{t('累计已用额度')}</div>
              <div className='aks-metric-value'>
                {stats ? renderQuota(stats.total_used_quota) : '—'}
              </div>
              <div className='aks-metric-foot'>
                <span>{t('全部令牌累计消耗')}</span>
              </div>
            </div>
          </div>
          <div className='aks-metric'>
            <div className='aks-metric-icon warn'><I.Alert /></div>
            <div className='aks-metric-body'>
              <div className='aks-metric-label'>{t('需关注')}</div>
              <div className='aks-metric-value'>{stats ? stats.need_attention : '—'}</div>
              <div className='aks-metric-foot'>
                {stats ? (
                  <span>
                    {t('{{n}} 即将到期 · {{m}} 接近配额', {
                      n: stats.expiring_soon || 0,
                      m: stats.near_quota || 0,
                    })}
                  </span>
                ) : (
                  <span>{t('过期或配额预警')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='aks-tabs'>
          <button
            type='button'
            className={`aks-tab ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => handleTabChange('')}
          >
            {t('全部')}
            <span className='count'>{tabCounts.all}</span>
          </button>
          <button
            type='button'
            className={`aks-tab ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => handleTabChange('active')}
          >
            {t('活跃')}
            <span className='count'>{tabCounts.active}</span>
          </button>
          <button
            type='button'
            className={`aks-tab ${statusFilter === 'disabled' ? 'active' : ''}`}
            onClick={() => handleTabChange('disabled')}
          >
            {t('已禁用')}
            <span className='count'>{tabCounts.disabled}</span>
          </button>
          <button
            type='button'
            className={`aks-tab ${statusFilter === 'expired' ? 'active' : ''}`}
            onClick={() => handleTabChange('expired')}
          >
            {t('已过期')}
            <span className='count'>{tabCounts.expired}</span>
          </button>
        </div>

        {/* Toolbar */}
        <form className='aks-toolbar' onSubmit={handleSearchSubmit}>
          <div className='aks-search'>
            <I.Search />
            <input
              ref={searchInputRef}
              placeholder={t('按名称 / ID / 密钥 / 分组搜索…')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type='button'
                onClick={handleClearSearch}
                style={{ color: 'var(--aks-ink-400)', display: 'inline-flex', alignItems: 'center' }}
                aria-label={t('清除')}
              >
                <I.Close />
              </button>
            )}
            <kbd>⌘K</kbd>
          </div>

          <FilterPill
            label={t('分组')}
            value={groupFilter}
            options={groupOptions}
            onChange={handleGroupChange}
            openId={openMenuId}
            setOpenId={setOpenMenuId}
            mid='group'
          />

          <div className='aks-toolbar-right'>
            <div className='aks-density'>
              <button
                type='button'
                className={!compactMode ? 'active' : ''}
                onClick={() => setCompactMode(false)}
                title={t('舒适')}
              >
                <I.Rows />
              </button>
              <button
                type='button'
                className={compactMode ? 'active' : ''}
                onClick={() => setCompactMode(true)}
                title={t('紧凑')}
              >
                <I.RowsDense />
              </button>
            </div>
            <button
              type='button'
              className='aks-icon-btn'
              onClick={() => {
                if (searchQuery) {
                  searchTokens(activePage, pageSize, searchQuery);
                } else {
                  refresh();
                }
                loadStats();
              }}
              disabled={loading}
              aria-label={t('刷新')}
            >
              <I.Refresh />
            </button>
          </div>
        </form>

        {/* Table card */}
        <div className='aks-table-card'>
          {selectedKeys.length > 0 && (
            <div className='aks-bulk-bar'>
              <span className='count-pill'>{selectedKeys.length}</span>
              <span style={{ color: 'var(--aks-ink-700)' }}>
                {t('已选择 · 可对所选令牌批量操作')}
              </span>
              <div className='actions'>
                <button type='button' onClick={handleBatchCopy}>
                  <I.Copy /> {t('复制密钥')}
                </button>
                <button type='button' className='danger' onClick={handleBatchDelete}>
                  <I.Trash /> {t('删除')}
                </button>
                <button
                  type='button'
                  onClick={() => setSelectedKeys([])}
                  style={{ color: 'var(--aks-ink-500)' }}
                >
                  {t('清空选择')}
                </button>
              </div>
            </div>
          )}

          <div className='aks-table-scroll'>
            <table className='aks-table'>
              <thead>
                <tr>
                  <th style={{ width: 36, paddingRight: 0 }}>
                    <Cb
                      checked={allOnPageChecked}
                      indeterminate={someOnPageChecked}
                      onClick={toggleSelectAll}
                    />
                  </th>
                  <th>{t('名称 / ID')}</th>
                  <th>{t('分组')}</th>
                  <th>{t('状态')}</th>
                  <th>{t('密钥')}</th>
                  <th>{t('配额使用')}</th>
                  <th>{t('最近调用')}</th>
                  <th>{t('过期时间')}</th>
                  <th style={{ width: 60, textAlign: 'right' }}>{t('操作')}</th>
                </tr>
              </thead>
              <tbody>
                {tokens.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9}>
                      <div className='aks-empty'>
                        {searchQuery
                          ? t('没有找到匹配的令牌')
                          : statusFilter || groupFilter
                            ? t('该筛选下没有令牌')
                            : t('还没有令牌，点击右上角"新建令牌"创建第一个')}
                      </div>
                    </td>
                  </tr>
                )}

                {tokens.map((record) => {
                  const checked = !!selectedKeys.find((k) => k.id === record.id);
                  const eff = effectiveStatus(record);
                  const warn = isWarning(record);
                  const meta = STATUS_META[eff] || STATUS_META[4];
                  const dotCls = warn ? 'warning' : meta.cls;
                  const pillCls = warn ? 'warning' : meta.cls;
                  const pillLabel = warn ? t('配额预警') : t(meta.label);

                  const used = parseInt(record.used_quota) || 0;
                  const remain = parseInt(record.remain_quota) || 0;
                  const total = used + remain;
                  const usedPct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

                  const revealed = !!showKeys[record.id];
                  const fullKey =
                    revealed && resolvedTokenKeys[record.id]
                      ? `sk-${resolvedTokenKeys[record.id]}`
                      : record.key
                        ? `sk-${record.key}`
                        : '';

                  return (
                    <tr key={record.id}>
                      <td onClick={(e) => { e.stopPropagation(); toggleSelectOne(record); }}>
                        <Cb checked={checked} onClick={() => toggleSelectOne(record)} />
                      </td>
                      <td>
                        <div className='aks-name-stack'>
                          <div className='n'>{record.name || '—'}</div>
                          <div className='id'>k_{record.id}</div>
                        </div>
                      </td>
                      <td>
                        {record.group === 'auto' ? (
                          <Popover
                            content={
                              <div style={{ padding: 8, fontSize: 12, maxWidth: 240 }}>
                                {t(
                                  '当前分组为 auto，会自动选择最优分组，当一个组不可用时自动降级到下一个组（熔断机制）',
                                )}
                              </div>
                            }
                          >
                            <span className='aks-group-tag'>
                              {t('智能熔断')}
                              {record.cross_group_retry ? `(${t('跨分组')})` : ''}
                            </span>
                          </Popover>
                        ) : record.group ? (
                          <span className='aks-group-tag'>{record.group}</span>
                        ) : (
                          <span className='aks-group-tag muted'>{t('默认')}</span>
                        )}
                      </td>
                      <td>
                        <span className={`aks-status-pill ${pillCls}`}>
                          <span className={`aks-status-dot ${dotCls}`} />
                          {pillLabel}
                        </span>
                      </td>
                      <td>
                        <div className='aks-key-cell'>
                          <span className='aks-key-mask' title={fullKey}>{fullKey}</span>
                          <span className='aks-key-actions'>
                            <button
                              type='button'
                              className='aks-icon-btn flat'
                              style={{ width: 22, height: 22 }}
                              onClick={(e) => { e.stopPropagation(); toggleTokenVisibility(record); }}
                              disabled={loadingTokenKeys[record.id]}
                              aria-label={t('显示/隐藏密钥')}
                            >
                              {revealed ? <I.EyeOff /> : <I.Eye />}
                            </button>
                            <button
                              type='button'
                              className='aks-icon-btn flat'
                              style={{ width: 22, height: 22 }}
                              onClick={(e) => { e.stopPropagation(); copyTokenKey(record); }}
                              aria-label={t('复制密钥')}
                            >
                              <I.Copy />
                            </button>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className='aks-quota-cell'>
                          {record.unlimited_quota ? (
                            <span className='aks-quota-text' style={{ color: 'var(--aks-blue-1)', fontWeight: 600 }}>
                              {t('无限额度')}
                            </span>
                          ) : (
                            <Popover
                              content={
                                <div style={{ padding: 8, fontSize: 12, minWidth: 180 }}>
                                  <Paragraph copyable={{ content: renderQuota(used) }}>
                                    {t('已用额度')}: {renderQuota(used)}
                                  </Paragraph>
                                  <Paragraph copyable={{ content: renderQuota(remain) }}>
                                    {t('剩余额度')}: {renderQuota(remain)}
                                  </Paragraph>
                                  <Paragraph copyable={{ content: renderQuota(total) }}>
                                    {t('总额度')}: {renderQuota(total)}
                                  </Paragraph>
                                </div>
                              }
                            >
                              <div className='aks-quota-cell' style={{ minWidth: 0, flex: 1 }}>
                                <div className='aks-quota-bar'>
                                  <div
                                    className={`aks-quota-fill ${warn ? 'warn' : ''} ${eff !== 1 ? 'muted' : ''}`}
                                    style={{ width: `${usedPct}%` }}
                                  />
                                </div>
                                <span className='aks-quota-text'>
                                  {renderQuota(used)}
                                  <span className='total'> / {renderQuota(total)}</span>
                                </span>
                              </div>
                            </Popover>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`aks-last-used ${isFreshAccess(record.accessed_time) ? 'fresh' : ''}`}>
                          {formatRelative(record.accessed_time)}
                        </span>
                      </td>
                      <td className='mono' style={{ fontSize: 11, color: eff === 3 ? 'var(--aks-danger)' : 'var(--aks-ink-700)', whiteSpace: 'nowrap' }}>
                        {record.expired_time === -1 ? t('永不过期') : timestamp2string(record.expired_time)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type='button'
                          className='aks-icon-btn flat'
                          style={{ width: 26, height: 26 }}
                          onClick={(e) => handleRowMore(e, record)}
                          aria-label={t('更多')}
                          aria-haspopup='menu'
                          aria-expanded={rowMenu?.record.id === record.id}
                        >
                          <I.More />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {tokenCount > 0 && (
            <div className='aks-table-foot'>
              <div>
                {t('显示')}{' '}
                <strong style={{ color: 'var(--aks-ink-900)' }}>
                  {(activePage - 1) * pageSize + 1}–{Math.min(activePage * pageSize, tokenCount)}
                </strong>
                {' · '}
                {t('共')} <strong style={{ color: 'var(--aks-ink-900)' }}>{tokenCount}</strong> {t('条')}
              </div>
              <div className='aks-pager'>
                <button
                  type='button'
                  disabled={activePage <= 1}
                  onClick={() => handlePageChange(Math.max(1, activePage - 1))}
                >
                  <I.ChevronL />
                </button>
                {renderPageNumbers().map((p, i) =>
                  p === '…' ? (
                    <span key={`e-${i}`} className='ellipsis'>…</span>
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
                  onClick={() => handlePageChange(Math.min(totalPages, activePage + 1))}
                >
                  <I.ChevronR />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row More menu — portal so it isn't clipped by table-card overflow */}
      {rowMenu &&
        createPortal(
          <div
            className='aks-menu-portal'
            data-theme='auto'
            style={{ top: rowMenu.top, left: rowMenu.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className='aks-menu-item'
              onClick={() => { setRowMenu(null); copyTokenKey(rowMenu.record); }}
            >
              <I.Copy /> {t('复制密钥')}
            </div>
            <div
              className='aks-menu-item'
              onClick={() => { setRowMenu(null); copyTokenConnectionString(rowMenu.record); }}
            >
              <I.Copy /> {t('复制连接信息')}
            </div>
            {chatLinks.length > 0 && (
              <>
                <div className='aks-menu-divider' />
                <div className='aks-menu-section-label'>{t('聊天')}</div>
                {chatLinks.map((c, i) => (
                  <div
                    key={i}
                    className='aks-menu-item'
                    onClick={() => {
                      const r = rowMenu.record;
                      setRowMenu(null);
                      onOpenLink(c.name, c.value, r);
                    }}
                  >
                    <I.Comment /> {c.name}
                  </div>
                ))}
              </>
            )}
            <div className='aks-menu-divider' />
            <div
              className='aks-menu-item'
              onClick={() => { const r = rowMenu.record; setRowMenu(null); handleEdit(r); }}
            >
              <I.Edit /> {t('编辑')}
            </div>
            <div
              className='aks-menu-item'
              onClick={() => { const r = rowMenu.record; setRowMenu(null); handleToggleStatus(r); }}
            >
              <I.Power /> {rowMenu.record.status === 1 ? t('禁用') : t('启用')}
            </div>
            <div className='aks-menu-divider' />
            <div
              className='aks-menu-item danger'
              onClick={() => { const r = rowMenu.record; setRowMenu(null); handleDelete(r); }}
            >
              <I.Trash /> {t('删除')}
            </div>
          </div>,
          document.body,
        )}

      {/* Modals */}
      <EditTokenModal
        refresh={refresh}
        editingToken={editingToken}
        visiable={showEdit}
        handleClose={closeEdit}
      />
      <CCSwitchModal
        visible={ccSwitchVisible}
        onClose={() => setCCSwitchVisible(false)}
        tokenKey={ccSwitchKey}
        modelOptions={modelOptions}
      />
      <CopyTokensModal
        visible={showCopyModal}
        onCancel={() => setShowCopyModal(false)}
        batchCopyTokens={batchCopyTokens}
        t={t}
      />
      <DeleteTokensModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          batchDeleteTokens();
          setShowDeleteModal(false);
        }}
        selectedKeys={selectedKeys}
        t={t}
      />
    </div>
  );
}

/* Toggle the .dense class on the page root so the table's CSS can use it
   without prop drilling. Mounted alongside the page tree. */
const DensityClassEffect = ({ dense }) => {
  useEffect(() => {
    const root = document.querySelector('.aks-root');
    if (!root) return;
    if (dense) root.classList.add('dense');
    else root.classList.remove('dense');
  }, [dense]);
  return null;
};

export default TokensPage;
