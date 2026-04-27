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

import React from 'react';

export const MODEL_DRAWER_STYLES = `
/* Drawer container — the .md-detail-sheet className lives on the
   outermost wrapper. These descendant selectors out-specificity the
   global .semi-sidesheet-inner { border-radius: var(--radius-lg) !important }
   rule from web/src/index.css. */
.md-detail-sheet.semi-sidesheet,
.md-detail-sheet .semi-sidesheet-inner,
.md-detail-sheet .semi-sidesheet-content,
.md-detail-sheet .semi-sidesheet-body {
  border-radius: 0 !important;
}
.md-detail-sheet .semi-sidesheet-body {
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}

.md-root {
  --md-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --md-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.12) 0%, rgba(0,198,255,0.08) 100%);
  --md-blue-1: #0072ff;
  --md-blue-2: #00c6ff;
  --md-ink-900: #0b1a2b;
  --md-ink-700: #2a3a4d;
  --md-ink-500: #5b6878;
  --md-ink-400: #8593a3;
  --md-ink-300: #b6bfca;
  --md-line: #e8edf3;
  --md-bg: #f6f8fc;
  --md-card: #ffffff;
  --md-body-bg: #f8fafc;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--md-card);
  color: var(--md-ink-900);
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  font-size: 13px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Header — fixed, never scrolls */
.md-head {
  padding: 20px 24px;
  border-bottom: 1px solid var(--md-line);
  display: flex;
  gap: 12px;
  align-items: center;
  flex: none;
  background: var(--md-card);
}
.md-head-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
}
.md-head-avatar.fallback {
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.02em;
}
.md-head-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--md-ink-900);
}
.md-head-name > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.md-copy {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--md-ink-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  background: transparent;
  border: none;
  cursor: pointer;
  flex: none;
}
.md-copy:hover {
  background: var(--md-bg);
  color: var(--md-blue-1);
}
.md-close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: var(--md-ink-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  background: transparent;
  border: none;
  cursor: pointer;
  flex: none;
}
.md-close:hover {
  background: var(--md-bg);
  color: var(--md-ink-900);
}

/* Body — only this scrolls */
.md-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px;
  background: var(--md-body-bg);
}

/* Cards */
.md-card {
  background: var(--md-card);
  border: 1px solid var(--md-line);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 12px;
}
.md-card:last-child {
  margin-bottom: 0;
}
.md-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--md-line);
}
.md-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.md-card-icon.blue {
  background: linear-gradient(
    135deg,
    rgba(0, 114, 255, 0.12),
    rgba(0, 198, 255, 0.08)
  );
  color: var(--md-blue-1);
}
.md-card-icon.purple {
  background: linear-gradient(
    135deg,
    rgba(168, 85, 247, 0.14),
    rgba(217, 70, 239, 0.08)
  );
  color: #9333ea;
}
.md-card-icon.amber {
  background: linear-gradient(
    135deg,
    rgba(251, 146, 60, 0.16),
    rgba(245, 158, 11, 0.1)
  );
  color: #ea580c;
}
.md-card-icon svg {
  width: 18px;
  height: 18px;
}
.md-card-text {
  min-width: 0;
}
.md-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--md-ink-900);
  letter-spacing: -0.01em;
}
.md-card-sub {
  font-size: 12px;
  color: var(--md-ink-500);
  margin-top: 2px;
}

.md-desc {
  font-size: 13px;
  color: var(--md-ink-700);
  line-height: 1.6;
  margin: 0;
}
.md-desc.empty {
  color: var(--md-ink-400);
  font-style: italic;
}
.md-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.md-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
}

/* API endpoints */
.md-endpoint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  font-size: 13px;
}
.md-endpoint:first-of-type {
  padding-top: 0;
}
.md-endpoint:last-of-type {
  padding-bottom: 0;
}
.md-endpoint + .md-endpoint {
  border-top: 1px dashed var(--md-line);
}
.md-endpoint-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  flex: none;
}
.md-endpoint-prov {
  color: var(--md-ink-700);
  font-weight: 500;
  flex: none;
}
.md-endpoint-path {
  flex: 1;
  min-width: 0;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  color: var(--md-ink-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.md-endpoint-method {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--md-ink-500);
  letter-spacing: 0.04em;
  flex: none;
}
.md-empty {
  font-size: 12.5px;
  color: var(--md-ink-400);
  font-style: italic;
}

/* Pricing */
.md-route {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--md-ink-700);
  margin-bottom: 12px;
  padding: 6px 4px;
}
.md-route-chip {
  padding: 4px 9px;
  background: var(--md-bg);
  border: 1px solid var(--md-line);
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--md-ink-700);
}
.md-route-arrow {
  color: var(--md-ink-400);
}

.md-table {
  border: 1px solid var(--md-line);
  border-radius: 10px;
  overflow: hidden;
  background: var(--md-card);
}
.md-table-head,
.md-table-row {
  display: grid;
  grid-template-columns: 1fr 0.9fr 1.6fr;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 12.5px;
}
.md-table-head {
  background: linear-gradient(
    180deg,
    rgba(0, 114, 255, 0.05),
    rgba(0, 114, 255, 0.02)
  );
  color: var(--md-ink-700);
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid var(--md-line);
}
.md-table-row + .md-table-row {
  border-top: 1px solid var(--md-line);
}
.md-group-pill {
  display: inline-block;
  padding: 4px 10px;
  border: 1px solid var(--md-line);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--md-ink-700);
  background: var(--md-card);
}
.md-billing-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--md-grad-soft);
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--md-blue-1);
}
.md-billing-pill.usage {
  background: rgba(88, 86, 214, 0.12);
  color: #5856d6;
}
.md-billing-pill.percall {
  background: rgba(48, 176, 199, 0.12);
  color: #1d8e9f;
}
.md-billing-pill.muted {
  background: var(--md-bg);
  color: var(--md-ink-500);
}
.md-ratio-pill {
  display: inline-block;
  padding: 4px 10px;
  background: var(--md-bg);
  border: 1px solid var(--md-line);
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--md-ink-700);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.md-price-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.md-price-line {
  display: flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
  min-width: 0;
}
.md-price-label {
  font-size: 11px;
  color: var(--md-ink-500);
  flex: none;
}
.md-price-val {
  font-size: 12.5px;
  font-weight: 700;
  color: #ea580c;
  font-feature-settings: 'tnum';
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.md-price-unit {
  font-size: 10.5px;
  color: var(--md-ink-500);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.md-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  color: var(--md-ink-500);
  font-size: 13px;
}

@media (max-width: 640px) {
  .md-head {
    padding: 16px 18px;
  }
  .md-body {
    padding: 16px 18px;
  }
  .md-card {
    padding: 16px;
  }
  .md-table-head,
  .md-table-row {
    grid-template-columns: 1fr 1fr 1.3fr;
    padding: 10px 12px;
  }
}

/* ───────── Dark mode ───────── */
html.dark .md-root {
  --md-ink-900: rgba(255,255,255,0.95);
  --md-ink-700: rgba(255,255,255,0.78);
  --md-ink-500: rgba(255,255,255,0.55);
  --md-ink-400: rgba(255,255,255,0.42);
  --md-ink-300: rgba(255,255,255,0.28);
  --md-line: rgba(255,255,255,0.08);
  --md-bg: #1c1c1e;
  --md-card: #2a2a2c;
  --md-body-bg: #1c1c1e;
}
html.dark .md-root .md-table-head,
html.dark .md-root .md-table-row + .md-table-row {
  background: rgba(255,255,255,0.03);
}
html.dark .md-root .md-card-icon.blue { background: rgba(56,182,255,0.18); color: #5ec4ff; }
html.dark .md-root .md-card-icon.purple { background: rgba(176,124,255,0.18); color: #b07cff; }
html.dark .md-root .md-card-icon.amber { background: rgba(255,159,10,0.18); color: #ffb340; }
html.dark .md-root .md-billing-pill.usage {
  background: rgba(124,120,255,0.16); color: #a8a4ff;
}
html.dark .md-root .md-billing-pill.percall {
  background: rgba(72,200,220,0.16); color: #5fdbe5;
}
html.dark .md-root .md-billing-pill.muted {
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
}
html.dark .md-root .md-group-pill,
html.dark .md-root .md-ratio-pill {
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85);
}
html.dark .md-root .md-route {
  background: rgba(56,182,255,0.08);
  border-color: rgba(56,182,255,0.18);
}
`;

export const MdIcons = {
  Info: (p) => (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='16' x2='12' y2='12' />
      <line x1='12' y1='8' x2='12.01' y2='8' />
    </svg>
  ),
  Link: (p) => (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
      <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
    </svg>
  ),
  Coins: (p) => (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <circle cx='8' cy='8' r='6' />
      <path d='M18.09 10.37A6 6 0 1 1 10.34 18' />
      <path d='M7 6h1v4' />
      <path d='m16.71 13.88.7.71-2.82 2.82' />
    </svg>
  ),
  Copy: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
      <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
    </svg>
  ),
  Close: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='M6 6l12 12M18 6 6 18' />
    </svg>
  ),
};

export const ModelDetailDrawerStyles = () => (
  <style>{MODEL_DRAWER_STYLES}</style>
);
