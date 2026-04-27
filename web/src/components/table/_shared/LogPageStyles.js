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

// Shared CSS for the enterprise log pages (Usage Logs + Task Logs).
// Scoped under `.alog-root` so styles never leak. Designed for the
// #0072ff → #00c6ff gradient system; the same component tree is used
// across both pages.
export const LOG_PAGE_STYLES = `
.alog-root {
  --alog-blue-1: #0072ff;
  --alog-blue-2: #00c6ff;
  --alog-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --alog-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --alog-grad-softer: linear-gradient(180deg, rgba(0,114,255,0.04) 0%, rgba(0,198,255,0.02) 100%);
  --alog-ink-900: #0b1a2b;
  --alog-ink-700: #2a3a4d;
  --alog-ink-500: #5b6878;
  --alog-ink-400: #8593a3;
  --alog-ink-300: #b6bfca;
  --alog-line: #e8edf3;
  --alog-line-soft: #f1f4f8;
  --alog-bg: #f5f7fb;
  --alog-card: #ffffff;
  --alog-green: #16a37b;
  --alog-green-bg: #e7f7f0;
  --alog-orange: #d97706;
  --alog-orange-bg: #fef3e7;
  --alog-red: #dc2626;
  --alog-red-bg: #fde8e8;
  --alog-purple: #7c3aed;
  --alog-purple-bg: #f0e9ff;
  font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 13px;
  line-height: 1.45;
  color: var(--alog-ink-900);
  background: var(--alog-bg);
  min-height: 100%;
}
.alog-root *, .alog-root *::before, .alog-root *::after { box-sizing: border-box; }
.alog-root .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: 'tnum'; }
.alog-root button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; padding: 0; }
.alog-root input, .alog-root select { font-family: inherit; }

.alog-page { max-width: 1320px; margin: 0 auto; padding: 28px 28px 64px; }

/* page head */
.alog-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
.alog-title { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 4px; display: flex; align-items: center; gap: 10px; color: var(--alog-ink-900); }
.alog-sub { color: var(--alog-ink-500); font-size: 12px; }
.alog-livedot {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 500; color: var(--alog-green);
  background: var(--alog-green-bg); padding: 3px 10px; border-radius: 999px;
}
.alog-livedot::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: var(--alog-green);
  animation: alog-pulse 1.6s ease-out infinite;
}
@keyframes alog-pulse {
  0% { box-shadow: 0 0 0 0 rgba(22,163,123,0.5); }
  70% { box-shadow: 0 0 0 5px rgba(22,163,123,0); }
  100% { box-shadow: 0 0 0 0 rgba(22,163,123,0); }
}
.alog-head-actions { display: flex; gap: 8px; align-items: center; }
.alog-iconbtn {
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--alog-card); border: 1px solid var(--alog-line);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--alog-ink-500); transition: all .12s;
}
.alog-iconbtn:hover { color: var(--alog-blue-1); border-color: rgba(0,114,255,0.3); }
.alog-iconbtn:disabled { opacity: 0.5; cursor: not-allowed; }
.alog-btn {
  padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--alog-line); background: var(--alog-card); color: var(--alog-ink-700);
  transition: all .12s;
}
.alog-btn:hover { border-color: rgba(0,114,255,0.3); color: var(--alog-blue-1); }
.alog-btn-primary {
  background: var(--alog-grad); color: white; border-color: transparent;
  box-shadow: 0 2px 8px rgba(0,114,255,0.25);
}
.alog-btn-primary:hover { color: white; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,114,255,0.35); }

/* KPI strip */
.alog-kpis {
  display: grid; gap: 1px; background: var(--alog-line);
  border: 1px solid var(--alog-line);
  border-radius: 14px; overflow: hidden; margin-bottom: 16px;
}
.alog-kpis.cols-4 { grid-template-columns: 1.4fr 1fr 1fr 1fr; }
.alog-kpis.cols-5 { grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; }
.alog-kpi { background: var(--alog-card); padding: 16px 18px; position: relative; min-width: 0; }
.alog-kpi.hero { background: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%); color: white; }
.alog-kpi.hero::after {
  content: ''; position: absolute; right: -20px; bottom: -20px; width: 100px; height: 100px;
  background: radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%);
}
.alog-kpi-label { font-size: 11px; font-weight: 500; color: var(--alog-ink-500); text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; gap: 6px; }
.alog-kpi.hero .alog-kpi-label { color: rgba(255,255,255,0.85); }
.alog-kpi-value { font-size: 22px; font-weight: 700; margin-top: 8px; font-feature-settings: 'tnum'; letter-spacing: -0.02em; word-break: break-all; }
.alog-kpi.hero .alog-kpi-value { font-size: 28px; }
.alog-kpi-foot { margin-top: 8px; font-size: 11px; color: var(--alog-ink-500); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.alog-kpi.hero .alog-kpi-foot { color: rgba(255,255,255,0.85); }
.alog-kpi-grad-text { background: var(--alog-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* toolbar */
.alog-toolbar {
  background: var(--alog-card); border: 1px solid var(--alog-line);
  border-radius: 12px; padding: 10px 12px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-bottom: 12px;
}
.alog-search {
  display: flex; align-items: center; gap: 8px;
  border: 1px solid var(--alog-line); border-radius: 8px;
  padding: 6px 12px;
  flex: 1; min-width: 240px;
  transition: all .12s;
  background: white;
}
.alog-search:focus-within {
  border-color: rgba(0,114,255,0.4);
  box-shadow: 0 0 0 3px rgba(0,114,255,0.08);
}
.alog-search svg { color: var(--alog-ink-400); flex: none; }
.alog-search input { border: none; outline: none; background: transparent; flex: 1; font-size: 13px; color: var(--alog-ink-900); min-width: 0; }
.alog-search input::placeholder { color: var(--alog-ink-400); }
.alog-search-clear { color: var(--alog-ink-400); display: inline-flex; align-items: center; }
.alog-search-clear:hover { color: var(--alog-red); }

.alog-toolbar-divider { width: 1px; height: 22px; background: var(--alog-line); margin: 0 2px; }

.alog-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--alog-line); background: white; color: var(--alog-ink-700);
  font-size: 12px; font-weight: 500;
  transition: all .12s; cursor: pointer; white-space: nowrap;
}
.alog-pill:hover { border-color: rgba(0,114,255,0.3); }
.alog-pill svg { color: var(--alog-ink-400); }
.alog-pill .pill-key { color: var(--alog-ink-500); }
.alog-pill.active { background: var(--alog-grad-soft); border-color: rgba(0,114,255,0.3); color: var(--alog-blue-1); }
.alog-pill.active svg { color: var(--alog-blue-1); }
.alog-pill .pill-clear {
  width: 14px; height: 14px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--alog-ink-400); margin-left: 2px;
}
.alog-pill .pill-clear:hover { background: rgba(0,0,0,0.06); color: var(--alog-ink-700); }

.alog-quick-ranges {
  display: inline-flex; gap: 0; border: 1px solid var(--alog-line);
  border-radius: 8px; padding: 2px; background: white;
}
.alog-quick-ranges button {
  padding: 4px 10px; border-radius: 6px; font-size: 12px; color: var(--alog-ink-500);
}
.alog-quick-ranges button.active {
  background: var(--alog-grad); color: white; font-weight: 500;
}

/* active filters bar */
.alog-active-filters {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 8px 14px;
  background: linear-gradient(180deg, rgba(0,114,255,0.025), transparent);
  border: 1px solid var(--alog-line); border-bottom: none;
  border-radius: 12px 12px 0 0;
  margin-bottom: -1px;
  font-size: 12px;
}
.alog-active-filters .label { color: var(--alog-ink-500); margin-right: 4px; }
.alog-filter-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 6px 3px 10px;
  background: white;
  border: 1px solid var(--alog-line);
  border-radius: 6px; font-size: 11px; color: var(--alog-ink-700);
}
.alog-filter-tag .key { color: var(--alog-ink-500); margin-right: 2px; }
.alog-filter-tag .x {
  width: 16px; height: 16px; border-radius: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--alog-ink-400);
}
.alog-filter-tag .x:hover { background: var(--alog-line-soft); color: var(--alog-red); }
.alog-clear-all {
  margin-left: auto; color: var(--alog-blue-1); font-size: 11px; font-weight: 500; padding: 4px 8px; border-radius: 4px;
}
.alog-clear-all:hover { background: var(--alog-grad-soft); }

/* table */
.alog-table-wrap {
  background: var(--alog-card); border: 1px solid var(--alog-line);
  border-radius: 12px; overflow: hidden;
}
.alog-table-wrap.with-active-filters { border-radius: 0 0 12px 12px; }
.alog-table-scroll { overflow-x: auto; }
.alog-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.alog-table thead th {
  text-align: left; font-size: 11px; font-weight: 600; color: var(--alog-ink-500);
  text-transform: uppercase; letter-spacing: 0.04em;
  padding: 10px 14px; background: #fbfcfe;
  border-bottom: 1px solid var(--alog-line);
  white-space: nowrap; user-select: none;
}
.alog-table thead th.num { text-align: right; }
.alog-table tbody td {
  padding: 11px 14px; border-bottom: 1px solid var(--alog-line-soft);
  vertical-align: middle;
  font-feature-settings: 'tnum';
}
.alog-table tbody tr { transition: background .08s; position: relative; cursor: pointer; }
.alog-table tbody tr:hover { background: #fbfcfe; }
.alog-table tbody tr:hover .alog-row-actions { opacity: 1; }
.alog-table tbody tr:last-child td { border-bottom: none; }
.alog-table tbody tr.expanded { background: linear-gradient(180deg, rgba(0,114,255,0.025), transparent); }

/* density */
.alog-root.dense .alog-table tbody td { padding: 7px 14px; }

/* type indicator */
.alog-type-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
.alog-type-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.alog-type-dot.consume { background: var(--alog-green); box-shadow: 0 0 0 3px var(--alog-green-bg); }
.alog-type-dot.system { background: var(--alog-purple); box-shadow: 0 0 0 3px var(--alog-purple-bg); }
.alog-type-dot.error { background: var(--alog-red); box-shadow: 0 0 0 3px var(--alog-red-bg); }
.alog-type-dot.success { background: var(--alog-green); box-shadow: 0 0 0 3px var(--alog-green-bg); }
.alog-type-dot.running { background: var(--alog-blue-1); box-shadow: 0 0 0 3px rgba(0,114,255,0.16); animation: alog-pulse-blue 1.6s ease-out infinite; }
.alog-type-dot.queued { background: var(--alog-orange); box-shadow: 0 0 0 3px var(--alog-orange-bg); }
.alog-type-dot.failure { background: var(--alog-red); box-shadow: 0 0 0 3px var(--alog-red-bg); }
.alog-type-dot.muted { background: var(--alog-ink-300); }
@keyframes alog-pulse-blue {
  0% { box-shadow: 0 0 0 0 rgba(0,114,255,0.5); }
  70% { box-shadow: 0 0 0 5px rgba(0,114,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(0,114,255,0); }
}
.alog-type-label { font-size: 11px; font-weight: 600; }
.alog-type-label.consume { color: var(--alog-green); }
.alog-type-label.system { color: var(--alog-purple); }
.alog-type-label.error { color: var(--alog-red); }
.alog-type-label.success { color: var(--alog-green); }
.alog-type-label.running { color: var(--alog-blue-1); }
.alog-type-label.queued { color: var(--alog-orange); }
.alog-type-label.failure { color: var(--alog-red); }
.alog-type-label.muted { color: var(--alog-ink-500); }

/* time */
.alog-time-stack { display: flex; flex-direction: column; min-width: 0; }
.alog-time-stack .date { font-size: 11px; color: var(--alog-ink-400); }
.alog-time-stack .time { font-weight: 600; color: var(--alog-ink-900); }

/* model pill */
.alog-model-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 8px 3px 6px; border-radius: 6px;
  background: var(--alog-line-soft); border: 1px solid transparent;
  font-size: 12px; font-weight: 500; color: var(--alog-ink-900);
  max-width: 220px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.alog-provider-icon {
  width: 16px; height: 16px; border-radius: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  flex: none;
}
.alog-provider-icon.openai { background: #0e1014; color: white; }
.alog-provider-icon.anthropic { background: #f0e7da; color: #c15f3c; }
.alog-provider-icon.google { background: #e7f0fe; color: #1a73e8; }
.alog-provider-icon.azure { background: #e8f1fb; color: #0078d4; }
.alog-provider-icon.generic { background: var(--alog-grad-soft); color: var(--alog-blue-1); }

/* user */
.alog-user-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
.alog-avatar-sm {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; flex: none;
  background: var(--alog-line-soft); color: var(--alog-ink-700);
  text-transform: uppercase;
}
.alog-user-cell .name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

/* token pill */
.alog-token-pill {
  font-size: 11px; padding: 2px 8px; border-radius: 4px;
  background: var(--alog-line-soft); color: var(--alog-ink-700);
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid transparent;
  max-width: 140px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: inline-block;
}

/* metric chip */
.alog-metrics-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.alog-metric-chip {
  font-size: 11px; padding: 2px 6px; border-radius: 4px;
  font-family: 'JetBrains Mono', monospace; font-weight: 500;
  display: inline-flex; align-items: center; gap: 3px;
  white-space: nowrap;
}
.alog-metric-chip .unit { opacity: 0.6; font-size: 9px; }
.alog-metric-chip.duration { background: #fff3d6; color: #b88500; }
.alog-metric-chip.ttft { background: #ffe4d6; color: #c4570d; }
.alog-metric-chip.stream { background: var(--alog-green-bg); color: var(--alog-green); }
.alog-metric-chip.nostream { background: var(--alog-purple-bg); color: var(--alog-purple); }
.alog-metric-chip.tokens { background: var(--alog-grad-soft); color: var(--alog-blue-1); }
.alog-metric-chip.muted { background: var(--alog-line-soft); color: var(--alog-ink-500); }

/* progress bar */
.alog-progress {
  display: flex; flex-direction: column; gap: 4px; min-width: 100px; max-width: 180px;
}
.alog-progress-bar {
  height: 4px; border-radius: 2px; background: var(--alog-line-soft);
  overflow: hidden;
}
.alog-progress-fill { height: 100%; background: var(--alog-grad); border-radius: 2px; transition: width .25s; }
.alog-progress-fill.failure { background: linear-gradient(90deg, #f5a623, #ef5b5b); }
.alog-progress-fill.success { background: var(--alog-green); }
.alog-progress-foot { font-size: 11px; color: var(--alog-ink-400); font-family: 'JetBrains Mono', monospace; }

/* cost */
.alog-cost {
  font-weight: 600; font-feature-settings: 'tnum';
  background: var(--alog-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  text-align: right;
}
.alog-cost.zero { background: none; -webkit-text-fill-color: var(--alog-ink-300); color: var(--alog-ink-300); font-weight: 500; }
.alog-cost.gain { background: none; -webkit-text-fill-color: var(--alog-green); color: var(--alog-green); }

/* detail (info column for system/error rows) */
.alog-detail-cell { color: var(--alog-ink-700); display: inline-flex; align-items: center; gap: 6px; max-width: 100%; }
.alog-detail-cell .gain { color: var(--alog-green); font-weight: 600; }
.alog-detail-cell .err { color: var(--alog-red); font-weight: 500; }
.alog-detail-cell .text {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 320px;
}

/* row actions */
.alog-row-actions {
  display: flex; gap: 2px; opacity: 0; transition: opacity .12s; justify-content: flex-end;
}
.alog-row-actions button {
  width: 26px; height: 26px; border-radius: 6px;
  color: var(--alog-ink-400);
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .12s;
}
.alog-row-actions button:hover { background: var(--alog-line-soft); color: var(--alog-blue-1); }

/* expanded detail panel */
.alog-detail-panel {
  background: linear-gradient(180deg, rgba(0,114,255,0.025), transparent);
  border-bottom: 1px solid var(--alog-line-soft);
}
.alog-detail-panel .inner {
  padding: 16px 20px 20px 44px;
  display: grid; gap: 24px;
}
.alog-detail-panel .inner.col-3 { grid-template-columns: 1.2fr 1fr 1fr; }
.alog-detail-panel .inner.col-2 { grid-template-columns: 1fr 1fr; }
@media (max-width: 900px) {
  .alog-detail-panel .inner.col-3,
  .alog-detail-panel .inner.col-2 { grid-template-columns: 1fr; padding: 14px 14px 18px; }
}
.alog-detail-section h4 {
  margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--alog-ink-500); font-weight: 600;
}
.alog-detail-kv { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; font-size: 12px; }
.alog-detail-kv dt { color: var(--alog-ink-500); white-space: nowrap; }
.alog-detail-kv dd { margin: 0; color: var(--alog-ink-900); font-weight: 500; word-break: break-all; }
.alog-detail-kv dd.mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.alog-detail-kv dd.multi {
  white-space: pre-wrap;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.55;
  background: #fbfcfe;
  border: 1px solid var(--alog-line-soft);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--alog-ink-700);
  font-weight: 400;
}
/* Extension info table — denser than the per-section dl */
.alog-detail-kv-extra {
  grid-template-columns: 110px 1fr;
  gap: 4px 12px;
  padding: 10px 12px;
  background: #fbfcfe;
  border: 1px solid var(--alog-line-soft);
  border-radius: 8px;
  font-size: 11.5px;
}
.alog-detail-kv-extra dt {
  font-size: 11px;
  font-weight: 500;
  padding-top: 1px;
}
.alog-detail-kv-extra dd {
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.55;
  min-width: 0;
}
.alog-detail-kv-extra dd.mono { font-size: 10.5px; }
.alog-detail-kv-extra dd.multi {
  margin: 2px 0 4px;
  padding: 7px 9px;
  background: white;
  border-color: var(--alog-line);
  font-size: 10.5px;
}
.alog-token-bar {
  height: 6px; background: var(--alog-line-soft); border-radius: 3px;
  overflow: hidden; display: flex; margin-top: 6px;
}
.alog-token-bar .seg { height: 100%; }
.alog-token-bar .seg.input { background: var(--alog-blue-1); }
.alog-token-bar .seg.output { background: var(--alog-blue-2); }
.alog-token-bar .seg.cache { background: rgba(0,114,255,0.3); }
.alog-token-legend { display: flex; gap: 12px; font-size: 11px; color: var(--alog-ink-500); margin-top: 6px; }
.alog-token-legend span::before {
  content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px;
  vertical-align: middle;
}
.alog-token-legend .input::before { background: var(--alog-blue-1); }
.alog-token-legend .output::before { background: var(--alog-blue-2); }
.alog-token-legend .cache::before { background: rgba(0,114,255,0.3); }

/* footer */
.alog-table-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-top: 1px solid var(--alog-line);
  background: #fbfcfe; font-size: 12px; color: var(--alog-ink-500);
  flex-wrap: wrap; gap: 12px;
}
.alog-pager { display: inline-flex; align-items: center; gap: 4px; }
.alog-pager button {
  min-width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--alog-line); background: white;
  font-size: 12px; color: var(--alog-ink-700); padding: 0 8px;
}
.alog-pager button:hover:not(:disabled) { border-color: rgba(0,114,255,0.3); color: var(--alog-blue-1); }
.alog-pager button.active { background: var(--alog-grad); color: white; border-color: transparent; }
.alog-pager button:disabled { opacity: 0.4; cursor: not-allowed; }
.alog-pager .ellipsis { color: var(--alog-ink-400); padding: 0 4px; }

/* dropdown menu */
.alog-menu-portal {
  position: fixed;
  min-width: 200px; background: white;
  border: 1px solid var(--alog-line); border-radius: 10px;
  box-shadow: 0 12px 28px -8px rgba(11,26,43,0.15);
  padding: 6px; z-index: 1100;
  font-size: 12px;
  font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  --alog-blue-1: #0072ff;
  --alog-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --alog-line-soft: #f1f4f8;
  --alog-ink-700: #2a3a4d;
  animation: alog-menu-in .12s ease-out;
}
@keyframes alog-menu-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.alog-menu-item {
  display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 6px;
  font-size: 12px; color: var(--alog-ink-700); cursor: pointer; width: 100%;
  background: transparent; border: none; user-select: none;
}
.alog-menu-item:hover { background: var(--alog-line-soft); }
.alog-menu-item.selected { background: var(--alog-grad-soft); color: var(--alog-blue-1); font-weight: 500; }
.alog-menu-item .check { margin-left: auto; color: var(--alog-blue-1); opacity: 0; }
.alog-menu-item.selected .check { opacity: 1; }
.alog-menu-divider { height: 1px; background: var(--alog-line-soft); margin: 4px 2px; }

/* empty */
.alog-empty { padding: 60px 20px; text-align: center; color: var(--alog-ink-400); }

/* responsive */
@media (max-width: 1100px) {
  .alog-kpis.cols-5 { grid-template-columns: 1.4fr 1fr 1fr 1fr; }
  .alog-kpis.cols-5 .alog-kpi:nth-child(5) { display: none; }
}
@media (max-width: 900px) {
  .alog-kpis.cols-5, .alog-kpis.cols-4 { grid-template-columns: 1fr 1fr; }
  .alog-kpis.cols-5 .alog-kpi:nth-child(5),
  .alog-kpis.cols-4 .alog-kpi:nth-child(4) { display: block; }
  .alog-page { padding: 16px 14px 40px; }
}

/* ───────── Dark mode ───────── */
html.dark .alog-root {
  --alog-ink-900: rgba(255,255,255,0.95);
  --alog-ink-700: rgba(255,255,255,0.78);
  --alog-ink-500: rgba(255,255,255,0.55);
  --alog-ink-400: rgba(255,255,255,0.42);
  --alog-ink-300: rgba(255,255,255,0.28);
  --alog-line: rgba(255,255,255,0.08);
  --alog-line-soft: rgba(255,255,255,0.04);
  --alog-bg: #1c1c1e;
  --alog-card: #2a2a2c;
  --alog-green-bg: rgba(48,209,88,0.16);
  --alog-orange-bg: rgba(255,159,10,0.16);
  --alog-red-bg: rgba(255,69,58,0.16);
  --alog-purple-bg: rgba(124,58,237,0.22);
}
html.dark .alog-root .alog-search,
html.dark .alog-root .alog-pill,
html.dark .alog-root .alog-quick-ranges,
html.dark .alog-root .alog-filter-tag {
  background: var(--alog-card);
}
html.dark .alog-root .alog-table thead th,
html.dark .alog-root .alog-table tbody tr:hover,
html.dark .alog-root .alog-table-foot {
  background: rgba(255,255,255,0.04);
}
html.dark .alog-root .alog-table tbody tr.expanded,
html.dark .alog-root .alog-detail-panel {
  background: linear-gradient(180deg, rgba(56,182,255,0.08), transparent);
}
html.dark .alog-root .alog-pager button {
  background: var(--alog-card);
}
html.dark .alog-root .alog-detail-kv dd.multi,
html.dark .alog-root .alog-detail-kv-extra {
  background: rgba(255,255,255,0.04);
}
html.dark .alog-root .alog-detail-kv-extra dd.multi {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.08);
}
html.dark .alog-root .alog-metric-chip.duration {
  background: rgba(255,159,10,0.16); color: #ffb340;
}
html.dark .alog-root .alog-metric-chip.ttft {
  background: rgba(255,107,46,0.18); color: #ff8d5a;
}
html.dark .alog-menu-portal {
  background: #2a2a2c;
  border-color: rgba(255,255,255,0.1);
  --alog-line-soft: rgba(255,255,255,0.06);
  --alog-ink-700: rgba(255,255,255,0.78);
  box-shadow: 0 12px 28px -8px rgba(0,0,0,0.45);
}
html.dark .alog-menu-portal .alog-menu-item { color: rgba(255,255,255,0.78); }
html.dark .alog-menu-portal .alog-menu-item:hover { background: rgba(255,255,255,0.06); }
html.dark .alog-menu-portal .alog-menu-divider { background: rgba(255,255,255,0.06); }
`;

/* ───────── Inline-SVG icon set shared by both pages ───────── */
import React from 'react';

export const LogIcons = {
  Search: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      {...p}
    >
      <circle cx='11' cy='11' r='7' />
      <path d='m20 20-3.5-3.5' />
    </svg>
  ),
  Refresh: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='M21 12a9 9 0 1 1-3-6.7L21 8' />
      <path d='M21 3v5h-5' />
    </svg>
  ),
  Download: (p) => (
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
      <path d='M12 4v12' />
      <path d='m7 11 5 5 5-5' />
      <path d='M5 20h14' />
    </svg>
  ),
  Filter: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='M3 5h18M6 12h12M10 19h4' />
    </svg>
  ),
  Calendar: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <rect x='3' y='5' width='18' height='16' rx='2' />
      <path d='M3 10h18M8 3v4M16 3v4' />
    </svg>
  ),
  Chevron: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='m6 9 6 6 6-6' />
    </svg>
  ),
  ChevronR: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='m9 6 6 6-6 6' />
    </svg>
  ),
  ChevronL: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='m15 6-6 6 6 6' />
    </svg>
  ),
  Close: (p) => (
    <svg
      width='10'
      height='10'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.4'
      strokeLinecap='round'
      {...p}
    >
      <path d='M6 6l12 12M18 6 6 18' />
    </svg>
  ),
  Eye: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      {...p}
    >
      <path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' />
      <circle cx='12' cy='12' r='3' />
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
      {...p}
    >
      <rect x='9' y='9' width='11' height='11' rx='2' />
      <path d='M5 15V5a2 2 0 0 1 2-2h10' />
    </svg>
  ),
  More: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <circle cx='5' cy='12' r='1.5' />
      <circle cx='12' cy='12' r='1.5' />
      <circle cx='19' cy='12' r='1.5' />
    </svg>
  ),
  Check: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='m4 12 5 5L20 6' />
    </svg>
  ),
  Film: (p) => (
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
      <rect x='2' y='4' width='20' height='16' rx='2' />
      <path d='M7 4v16M17 4v16M2 12h20M7 8h10M7 16h10' />
    </svg>
  ),
  Volume: (p) => (
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
      <polygon points='11 5 6 9 2 9 2 15 6 15 11 19' />
      <path d='M15.54 8.46a5 5 0 0 1 0 7.07' />
      <path d='M19.07 4.93a10 10 0 0 1 0 14.14' />
    </svg>
  ),
};
