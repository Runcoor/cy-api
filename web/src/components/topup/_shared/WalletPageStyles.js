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

// All styles scoped under .wal-root.
export const WALLET_PAGE_STYLES = `
.wal-root {
  --wal-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --wal-grad-r: linear-gradient(90deg, #0072ff 0%, #00c6ff 100%);
  --wal-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --wal-blue-1: #0072ff;
  --wal-blue-2: #00c6ff;
  --wal-ink-900: #0b1a2b;
  --wal-ink-700: #2a3a4d;
  --wal-ink-500: #5b6878;
  --wal-ink-400: #8593a3;
  --wal-ink-300: #b6bfca;
  --wal-line: #e8edf3;
  --wal-line-soft: #f1f4f8;
  --wal-card: #ffffff;
  --wal-green: #16a37b;
  --wal-green-bg: #e7f7f0;
  --wal-orange: #d97706;
  --wal-orange-bg: #fef3e7;
  --wal-red: #dc2626;
  --wal-red-bg: #fde8e8;
  --wal-purple: #7c3aed;
  --wal-purple-bg: #f0e9ff;

  font-family: "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--wal-ink-900);
  -webkit-font-smoothing: antialiased;
  font-size: 13px;
  line-height: 1.45;
  width: 100%;
}
.wal-root *, .wal-root *::before, .wal-root *::after { box-sizing: border-box; }
.wal-root .wal-mono { font-family: "JetBrains Mono", ui-monospace, monospace; font-feature-settings: "tnum"; }
.wal-root button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.wal-root input { font-family: inherit; }

.wal-root .wal-page { max-width: 1280px; margin: 0 auto; padding: 28px 28px 60px; }

.wal-root .wal-page-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 24px; margin-bottom: 20px; flex-wrap: wrap;
}
.wal-root .wal-page-title { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 4px; }
.wal-root .wal-page-sub { color: var(--wal-ink-500); font-size: 12px; }
.wal-root .wal-head-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.wal-root .wal-icon-btn {
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--wal-card); border: 1px solid var(--wal-line);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--wal-ink-500); transition: all .12s;
}
.wal-root .wal-icon-btn:hover { color: var(--wal-blue-1); border-color: rgba(0,114,255,0.3); }
.wal-root .wal-btn {
  padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 500;
  background: var(--wal-card); border: 1px solid var(--wal-line); color: var(--wal-ink-700);
  display: inline-flex; align-items: center; gap: 6px;
  transition: all .12s; white-space: nowrap;
}
.wal-root .wal-btn:hover:not(:disabled) { border-color: rgba(0,114,255,0.3); color: var(--wal-blue-1); }
.wal-root .wal-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* GRID */
.wal-root .wal-grid-12 { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; align-items: stretch; }
.wal-root .wal-grid-12 + .wal-grid-12 { margin-top: 16px; }
.wal-root .wal-col-12 { grid-column: span 12; }
.wal-root .wal-col-8 { grid-column: span 8; }
.wal-root .wal-col-7 { grid-column: span 7; }
.wal-root .wal-col-5 { grid-column: span 5; }
.wal-root .wal-col-4 { grid-column: span 4; }

/* CARD */
.wal-root .wal-card {
  background: var(--wal-card); border: 1px solid var(--wal-line);
  border-radius: 16px; padding: 18px 20px;
}
.wal-root .wal-card-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; gap: 12px; flex-wrap: wrap;
}
.wal-root .wal-card-head h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--wal-ink-900); }
.wal-root .wal-card-head .wal-h-meta { font-size: 11px; color: var(--wal-ink-500); }

/* === BALANCE HERO === */
.wal-root .wal-balance-hero {
  position: relative; overflow: hidden;
  color: white; border-radius: 18px; border: none;
  background:
    radial-gradient(circle at 0% 100%, rgba(0,198,255,0.55), transparent 50%),
    radial-gradient(circle at 100% 0%, rgba(124,58,237,0.4), transparent 50%),
    linear-gradient(135deg, #0050d4 0%, #0072ff 50%, #00a3ff 100%);
  padding: 22px 26px;
  box-shadow: 0 14px 40px -16px rgba(0,80,212,0.5);
  height: 100%;
  display: flex; flex-direction: column;
}
.wal-root .wal-balance-hero::before {
  content: ''; position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  -webkit-mask-image: radial-gradient(ellipse at 70% 30%, black 30%, transparent 70%);
  mask-image: radial-gradient(ellipse at 70% 30%, black 30%, transparent 70%);
}
.wal-root .wal-balance-hero::after {
  content: ''; position: absolute;
  right: -120px; top: -120px;
  width: 360px; height: 360px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow:
    inset 0 0 0 40px rgba(255,255,255,0.04),
    inset 0 0 0 80px rgba(255,255,255,0.025);
  pointer-events: none;
}
.wal-root .wal-balance-hero > * { position: relative; z-index: 1; }
.wal-root .wal-bh-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
}
.wal-root .wal-bh-label {
  font-size: 12px; font-weight: 500;
  color: rgba(255,255,255,0.85);
  display: flex; align-items: center; gap: 8px;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.wal-root .wal-bh-label::before {
  content: ''; width: 4px; height: 4px; border-radius: 50%;
  background: #00ffaa; box-shadow: 0 0 0 4px rgba(0,255,170,0.2);
  animation: wal-bh-pulse 2s infinite;
}
@keyframes wal-bh-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(0,255,170,0.2); }
  50% { box-shadow: 0 0 0 8px rgba(0,255,170,0); }
}
.wal-root .wal-bh-account-id {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px; color: rgba(255,255,255,0.65);
  background: rgba(255,255,255,0.1);
  padding: 4px 10px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.15);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
}
.wal-root .wal-bh-amount-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.wal-root .wal-bh-amount {
  font-size: 56px; font-weight: 800;
  letter-spacing: -0.04em; line-height: 1;
  background: linear-gradient(180deg, #ffffff 0%, #d8edff 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 4px 30px rgba(255,255,255,0.2);
  font-feature-settings: "tnum";
}
.wal-root .wal-bh-amount .wal-currency { font-size: 24px; font-weight: 600; vertical-align: top; margin-right: 4px; opacity: 0.8; }
.wal-root .wal-bh-amount .wal-cents { font-size: 28px; font-weight: 600; opacity: 0.7; }
.wal-root .wal-bh-delta {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(0,255,170,0.15); color: #00ffc0;
  font-size: 12px; font-weight: 600;
  padding: 4px 10px; border-radius: 999px;
  border: 1px solid rgba(0,255,170,0.3);
}
.wal-root .wal-bh-delta.down { background: rgba(255,180,180,0.15); color: #ffd9d9; border-color: rgba(255,180,180,0.3); }
.wal-root .wal-bh-stats {
  display: flex; gap: 30px; margin-top: 22px; padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,0.15); flex-wrap: wrap;
}
.wal-root .wal-bh-stat .wal-bh-stat-lbl {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
  color: rgba(255,255,255,0.6); font-weight: 500;
}
.wal-root .wal-bh-stat .wal-bh-stat-val {
  font-size: 18px; font-weight: 700; margin-top: 4px;
  font-feature-settings: "tnum";
}
.wal-root .wal-bh-stat .wal-bh-stat-sub {
  font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 2px;
}
.wal-root .wal-bh-foot {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto; padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.15);
  font-size: 11px; color: rgba(255,255,255,0.75); flex-wrap: wrap; gap: 12px;
}
.wal-root .wal-bh-foot-left { display: inline-flex; align-items: center; gap: 6px; }
.wal-root .wal-bh-foot-actions { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.wal-root .wal-bh-bill-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 999px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.22); color: white;
  font-size: 12px; font-weight: 500;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  transition: background .15s, border-color .15s, transform .15s;
}
.wal-root .wal-bh-bill-btn:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.4);
  transform: translateY(-1px);
}
.wal-root .wal-recharge-cta-mini {
  position: relative;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px 6px 6px; border-radius: 999px;
  background: linear-gradient(135deg, #ffffff 0%, #ecf5ff 100%);
  color: #0050d4;
  font-size: 13px; font-weight: 700;
  box-shadow: 0 4px 14px -2px rgba(0,0,0,0.18), inset 0 -1px 0 rgba(0,80,212,0.12);
  overflow: hidden; isolation: isolate;
  transition: transform .15s, box-shadow .15s;
}
.wal-root .wal-recharge-cta-mini::before {
  content: '';
  position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(120deg, transparent 0%, rgba(0,114,255,0.25) 50%, transparent 100%);
  animation: wal-cta-sweep 2.6s ease-in-out infinite;
}
.wal-root .wal-recharge-cta-mini:hover { transform: translateY(-1px); box-shadow: 0 8px 22px -4px rgba(0,0,0,0.25); }
.wal-root .wal-recharge-cta-mini:hover .wal-cta-icon { transform: rotate(-12deg) scale(1.08); }
.wal-root .wal-recharge-cta-mini:hover .wal-cta-arrow { transform: translateX(3px); }
.wal-root .wal-recharge-cta-mini .wal-cta-icon {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--wal-grad);
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  transition: transform .25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(0,114,255,0.4);
}
.wal-root .wal-recharge-cta-mini .wal-cta-arrow { transition: transform .2s; display: inline-flex; }
@keyframes wal-cta-sweep {
  0% { left: -100%; }
  60%, 100% { left: 200%; }
}

/* === HEALTH === */
.wal-root .wal-health-card { display: flex; flex-direction: column; height: 100%; }
.wal-root .wal-ring-wrap { display: flex; align-items: center; gap: 18px; padding: 8px 0 14px; }
.wal-root .wal-ring { position: relative; width: 96px; height: 96px; flex: none; }
.wal-root .wal-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.wal-root .wal-ring .wal-ring-track { stroke: var(--wal-line-soft); }
.wal-root .wal-ring .wal-ring-fill { stroke: url(#wal-ring-grad); stroke-linecap: round; transition: stroke-dashoffset 1s ease-out; }
.wal-root .wal-ring-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.wal-root .wal-ring-center .wal-v {
  font-size: 15px; font-weight: 700; letter-spacing: -0.02em;
  background: var(--wal-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  font-feature-settings: "tnum";
}
.wal-root .wal-ring-center .wal-l { font-size: 10px; color: var(--wal-ink-500); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.06em; }
.wal-root .wal-ring-meta { font-size: 11px; color: var(--wal-ink-500); }
.wal-root .wal-ring-meta .wal-title { font-size: 14px; font-weight: 600; color: var(--wal-ink-900); margin-bottom: 4px; }
.wal-root .wal-ring-meta .wal-stat { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.wal-root .wal-ring-meta .wal-stat .wal-dot { width: 6px; height: 6px; border-radius: 50%; }

.wal-root .wal-health-rows { display: flex; flex-direction: column; gap: 6px; margin-top: auto; }
.wal-root .wal-health-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  border: 1px solid var(--wal-line);
  font-size: 12px; transition: all .12s;
}
.wal-root .wal-health-row:hover { border-color: rgba(0,114,255,0.2); }
.wal-root .wal-health-row .wal-ic {
  width: 26px; height: 26px; border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center; flex: none;
}
.wal-root .wal-health-row .wal-ic.ok { background: var(--wal-green-bg); color: var(--wal-green); }
.wal-root .wal-health-row .wal-ic.warn { background: var(--wal-orange-bg); color: var(--wal-orange); }
.wal-root .wal-health-row .wal-ic.info { background: var(--wal-grad-soft); color: var(--wal-blue-1); }
.wal-root .wal-health-row .wal-body { flex: 1; min-width: 0; }
.wal-root .wal-health-row .wal-body .wal-t { font-weight: 500; }
.wal-root .wal-health-row .wal-body .wal-d { font-size: 10px; color: var(--wal-ink-500); }
.wal-root .wal-health-row .wal-v { font-size: 12px; font-weight: 600; font-feature-settings: "tnum"; }
.wal-root .wal-health-row .wal-v.green { color: var(--wal-green); }

/* === SPEND TREND === */
.wal-root .wal-trend-tabs {
  display: inline-flex; gap: 2px; padding: 2px;
  background: var(--wal-line-soft); border-radius: 8px;
}
.wal-root .wal-trend-tabs button {
  padding: 4px 12px; border-radius: 6px; font-size: 11px; color: var(--wal-ink-500);
  font-weight: 500;
}
.wal-root .wal-trend-tabs button.active {
  background: white; color: var(--wal-ink-900);
  box-shadow: 0 1px 3px rgba(11,26,43,0.1);
}
.wal-root .wal-trend-stats { display: flex; gap: 28px; padding: 6px 0 14px; flex-wrap: wrap; }
.wal-root .wal-trend-stats .wal-ts { display: flex; flex-direction: column; }
.wal-root .wal-trend-stats .wal-ts .wal-lbl { font-size: 10px; color: var(--wal-ink-500); text-transform: uppercase; letter-spacing: 0.06em; }
.wal-root .wal-trend-stats .wal-ts .wal-val { font-size: 18px; font-weight: 700; margin-top: 2px; font-feature-settings: "tnum"; }
.wal-root .wal-trend-stats .wal-ts .wal-val.grad { background: var(--wal-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.wal-root .wal-trend-stats .wal-ts .wal-delta { font-size: 11px; color: var(--wal-green); margin-top: 1px; font-weight: 500; }
.wal-root .wal-chart-wrap { height: 140px; position: relative; margin: 0 -4px; }

/* === BILLING PREFERENCE === */
.wal-root .wal-billing-card { display: flex; flex-direction: column; height: 100%; }
.wal-root .wal-billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.wal-root .wal-billing-opt {
  position: relative;
  padding: 14px;
  border: 1.5px solid var(--wal-line);
  border-radius: 12px;
  cursor: pointer; transition: all .15s;
  display: flex; gap: 10px; align-items: flex-start;
  background: var(--wal-card);
}
.wal-root .wal-billing-opt:hover {
  border-color: rgba(0,114,255,0.35);
  background: linear-gradient(135deg, rgba(0,114,255,0.02), rgba(0,198,255,0.02));
}
.wal-root .wal-billing-opt.active {
  border-color: var(--wal-blue-1);
  background: linear-gradient(135deg, rgba(0,114,255,0.06), rgba(0,198,255,0.04));
  box-shadow: 0 0 0 3px rgba(0,114,255,0.08), 0 4px 14px -6px rgba(0,114,255,0.25);
}
.wal-root .wal-bo-radio {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid var(--wal-ink-300);
  flex: none; margin-top: 1px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color .15s;
}
.wal-root .wal-billing-opt.active .wal-bo-radio { border-color: var(--wal-blue-1); }
.wal-root .wal-bo-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--wal-blue-1);
  transform: scale(0);
  transition: transform .2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.wal-root .wal-billing-opt.active .wal-bo-dot { transform: scale(1); }
.wal-root .wal-bo-body { flex: 1; min-width: 0; }
.wal-root .wal-bo-title-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
.wal-root .wal-bo-title { font-size: 14px; font-weight: 600; color: var(--wal-ink-900); }
.wal-root .wal-billing-opt.active .wal-bo-title {
  background: var(--wal-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.wal-root .wal-bo-badge {
  font-size: 9px; font-weight: 700;
  padding: 2px 6px; border-radius: 4px;
  background: var(--wal-grad); color: white;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.wal-root .wal-bo-info {
  position: relative; margin-left: auto;
  width: 18px; height: 18px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--wal-ink-300); cursor: help;
  transition: color .15s;
}
.wal-root .wal-bo-info:hover { color: var(--wal-blue-1); }
.wal-root .wal-bo-tooltip {
  position: absolute;
  bottom: calc(100% + 10px); right: -8px;
  width: 240px; padding: 10px 12px;
  background: var(--wal-ink-900); color: white;
  font-size: 11.5px; line-height: 1.5;
  border-radius: 8px; z-index: 10;
  box-shadow: 0 10px 30px -10px rgba(11,26,43,0.4);
  pointer-events: none;
  animation: wal-tooltip-in .15s ease-out;
}
@keyframes wal-tooltip-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.wal-root .wal-bo-tooltip-arrow {
  position: absolute;
  top: 100%; right: 12px;
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--wal-ink-900);
}
.wal-root .wal-bo-desc { font-size: 12px; color: var(--wal-ink-500); line-height: 1.5; }
.wal-root .wal-billing-hint {
  margin-top: 14px; padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(0,114,255,0.05), rgba(0,198,255,0.03));
  border: 1px solid rgba(0,114,255,0.1);
  font-size: 11.5px; color: var(--wal-ink-700);
  display: flex; align-items: center; gap: 8px;
}
.wal-root .wal-billing-hint strong { color: var(--wal-blue-1); font-weight: 600; }

/* === EARNINGS === */
.wal-root .wal-earnings-card { display: flex; flex-direction: column; height: 100%; }
.wal-root .wal-earn-stats-row { display: flex; align-items: center; padding: 6px 0 16px; gap: 20px; }
.wal-root .wal-earn-stat { flex: 1; min-width: 0; }
.wal-root .wal-earn-stat .wal-lbl {
  font-size: 11px; color: var(--wal-ink-500);
  text-transform: uppercase; letter-spacing: 0.06em;
  font-weight: 500;
}
.wal-root .wal-earn-val {
  font-size: 30px; font-weight: 800;
  letter-spacing: -0.02em; line-height: 1.1;
  margin-top: 6px; color: var(--wal-ink-900);
  font-feature-settings: "tnum";
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.wal-root .wal-earn-val.grad {
  background: var(--wal-grad);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.wal-root .wal-earn-val .wal-curr { font-size: 18px; font-weight: 600; vertical-align: top; margin-right: 1px; opacity: 0.7; }
.wal-root .wal-earn-divider { width: 1px; align-self: stretch; background: var(--wal-line); margin: 6px 0; }
.wal-root .wal-transfer-btn {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: 12px;
  background: var(--wal-grad); color: white;
  font-size: 13px; font-weight: 600;
  box-shadow: 0 6px 16px -6px rgba(0,114,255,0.45);
  transition: transform .12s, box-shadow .15s;
  position: relative; overflow: hidden;
}
.wal-root .wal-transfer-btn::before {
  content: '';
  position: absolute; top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
  transition: left .5s;
}
.wal-root .wal-transfer-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px -6px rgba(0,114,255,0.55);
}
.wal-root .wal-transfer-btn:hover:not(:disabled)::before { left: 200%; }
.wal-root .wal-transfer-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.wal-root .wal-tb-icon {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: inline-flex; align-items: center; justify-content: center;
  flex: none;
}
.wal-root .wal-tb-amt {
  margin-left: auto;
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  background: rgba(255,255,255,0.2);
  padding: 3px 9px; border-radius: 6px;
  font-size: 12px;
}

.wal-root .wal-earn-source-strip { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--wal-line-soft); }
.wal-root .wal-ess-bar { display: flex; gap: 2px; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
.wal-root .wal-bar-seg { height: 100%; border-radius: 2px; }
.wal-root .wal-bar-seg.bonus { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.wal-root .wal-bar-seg.refund { background: var(--wal-grad-r); }
.wal-root .wal-bar-seg.event { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
.wal-root .wal-bar-seg.credit { background: linear-gradient(90deg, #16a37b, #34d399); }
.wal-root .wal-ess-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; }
.wal-root .wal-legend-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; }
.wal-root .wal-legend-dot { width: 8px; height: 8px; border-radius: 2px; flex: none; }
.wal-root .wal-legend-dot.bonus { background: #f59e0b; }
.wal-root .wal-legend-dot.refund { background: var(--wal-blue-1); }
.wal-root .wal-legend-dot.event { background: #7c3aed; }
.wal-root .wal-legend-dot.credit { background: var(--wal-green); }
.wal-root .wal-legend-t { color: var(--wal-ink-500); }
.wal-root .wal-legend-v {
  margin-left: auto;
  color: var(--wal-ink-900); font-weight: 600;
  font-family: "JetBrains Mono", monospace;
  font-feature-settings: "tnum";
}

/* === INVITE === */
.wal-root .wal-invite-card {
  position: relative; overflow: hidden;
  background:
    radial-gradient(circle at 0% 100%, rgba(0,114,255,0.06), transparent 40%),
    radial-gradient(circle at 100% 0%, rgba(0,198,255,0.05), transparent 40%),
    var(--wal-card);
}
.wal-root .wal-invite-card::after {
  content: '';
  position: absolute; right: -40px; top: -40px;
  width: 160px; height: 160px;
  border-radius: 50%;
  border: 1px dashed rgba(0,114,255,0.15);
  animation: wal-spin-slow 30s linear infinite;
  pointer-events: none;
}
.wal-root .wal-invite-card::before {
  content: '';
  position: absolute; right: -10px; top: -10px;
  width: 100px; height: 100px;
  border-radius: 50%;
  border: 1px dashed rgba(0,198,255,0.2);
  animation: wal-spin-slow 22s linear infinite reverse;
  pointer-events: none;
}
@keyframes wal-spin-slow { to { transform: rotate(360deg); } }

.wal-root .wal-invite-horizontal {
  display: grid; grid-template-columns: 1fr 1fr; gap: 28px;
  padding: 22px 28px;
  align-items: stretch;
  position: relative; z-index: 1;
}
.wal-root .wal-inv-left { display: flex; flex-direction: column; gap: 10px; min-width: 0; position: relative; z-index: 1; }
.wal-root .wal-inv-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--wal-blue-1); font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.wal-root .wal-inv-headline {
  font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
  color: var(--wal-ink-900); line-height: 1.2;
}
.wal-root .wal-inv-amt {
  background: var(--wal-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  font-feature-settings: "tnum";
}
.wal-root .wal-inv-sub {
  font-size: 12.5px; color: var(--wal-ink-500); line-height: 1.55;
  max-width: 460px;
}
.wal-root .wal-inv-sub strong { color: var(--wal-ink-900); font-weight: 600; }

.wal-root .wal-invite-link {
  display: flex; align-items: center; gap: 6px;
  background: white; border: 1px solid var(--wal-line);
  border-radius: 10px;
  padding: 5px 5px 5px 14px;
  margin-top: 6px; max-width: 460px;
}
.wal-root .wal-invite-link input {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent;
  font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--wal-ink-700);
  overflow: hidden; text-overflow: ellipsis;
}
.wal-root .wal-invite-link button {
  padding: 0 12px; height: 30px; border-radius: 6px;
  background: var(--wal-grad); color: white;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  font-size: 12px; font-weight: 600;
  box-shadow: 0 2px 6px rgba(0,114,255,0.3);
  transition: transform .12s; flex: none;
}
.wal-root .wal-invite-link button:hover { transform: scale(1.04); }

.wal-root .wal-share-row {
  display: flex; gap: 6px; margin-top: 10px; max-width: 460px; align-items: center; flex-wrap: wrap;
}
.wal-root .wal-share-label { font-size: 11px; color: var(--wal-ink-500); margin-right: 2px; }
.wal-root .wal-share-btn {
  width: 36px; height: 30px; border-radius: 8px;
  background: var(--wal-line-soft);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--wal-ink-500); flex: none;
  transition: all .12s;
}
.wal-root .wal-share-btn:hover { background: var(--wal-grad-soft); color: var(--wal-blue-1); transform: translateY(-1px); }

.wal-root .wal-inv-right {
  border-left: 1px solid var(--wal-line);
  padding-left: 28px;
  display: flex; flex-direction: column; gap: 16px;
  justify-content: center;
  position: relative; z-index: 1;
  min-width: 0;
}
.wal-root .wal-inv-tier-head {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; font-weight: 600; color: var(--wal-ink-900);
  gap: 8px; flex-wrap: wrap;
}
.wal-root .wal-inv-progress {
  font-size: 11px; font-weight: 500; color: var(--wal-blue-1);
  padding: 3px 10px; border-radius: 999px;
  background: var(--wal-grad-soft);
  border: 1px solid rgba(0,114,255,0.15);
}
.wal-root .wal-reward-tiers {
  display: flex; align-items: flex-start; gap: 0;
  margin-top: 4px;
}
.wal-root .wal-tier-step { flex: 1; text-align: center; position: relative; }
.wal-root .wal-tier-step::after {
  content: ''; position: absolute; top: 13px; right: -50%;
  width: 100%; height: 1px;
  background: linear-gradient(90deg, var(--wal-line), var(--wal-line));
}
.wal-root .wal-tier-step.done::after {
  background: linear-gradient(90deg, var(--wal-blue-1), rgba(0,114,255,0.2));
}
.wal-root .wal-tier-step:last-child::after { display: none; }
.wal-root .wal-tier-step .wal-tdot {
  width: 26px; height: 26px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  margin: 0 auto;
  font-size: 11px; font-weight: 700;
  background: var(--wal-card); border: 2px solid var(--wal-line); color: var(--wal-ink-400);
  position: relative; z-index: 1;
}
.wal-root .wal-tier-step.next .wal-tdot {
  border-color: var(--wal-blue-1); color: var(--wal-blue-1);
}
.wal-root .wal-tier-step.done .wal-tdot {
  background: var(--wal-grad); color: white; border-color: transparent;
  box-shadow: 0 2px 8px rgba(0,114,255,0.3);
}
.wal-root .wal-tier-step .wal-tlbl { font-size: 10px; color: var(--wal-ink-500); margin-top: 6px; }
.wal-root .wal-tier-step .wal-tval { font-size: 13px; font-weight: 700; margin-top: 1px; color: var(--wal-ink-700); }
.wal-root .wal-tier-step.done .wal-tval { background: var(--wal-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }

.wal-root .wal-tier-empty {
  font-size: 12px; color: var(--wal-ink-400);
  padding: 18px 12px; text-align: center;
  border: 1px dashed var(--wal-line); border-radius: 10px;
}

/* RESPONSIVE */
@media (max-width: 980px) {
  .wal-root .wal-page { padding: 18px 14px 60px; }
  .wal-root .wal-col-8, .wal-root .wal-col-7,
  .wal-root .wal-col-5, .wal-root .wal-col-4 { grid-column: span 12; }
  .wal-root .wal-bh-amount { font-size: 44px; }
  .wal-root .wal-billing-grid { grid-template-columns: 1fr; }
  .wal-root .wal-invite-horizontal { grid-template-columns: 1fr; padding: 18px 18px; }
  .wal-root .wal-inv-right { border-left: none; border-top: 1px solid var(--wal-line); padding-left: 0; padding-top: 18px; }
}
@media (max-width: 560px) {
  .wal-root .wal-bh-amount { font-size: 36px; }
  .wal-root .wal-bh-stats { gap: 18px; }
  .wal-root .wal-trend-stats { gap: 16px; }
  .wal-root .wal-reward-tiers { flex-wrap: wrap; gap: 12px; }
  .wal-root .wal-tier-step { flex: 0 0 calc(50% - 12px); }
  .wal-root .wal-tier-step::after { display: none; }
}
`;

export const WalIcons = {
  Bolt: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M13 2 4 14h6l-1 8 9-12h-6l1-8z' />
    </svg>
  ),
  ArrowRight: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.4'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M5 12h14M13 5l7 7-7 7' />
    </svg>
  ),
  ArrowUp: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.4'
      strokeLinecap='round'
      {...p}
    >
      <path d='M12 19V5M5 12l7-7 7 7' />
    </svg>
  ),
  ArrowDown: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.4'
      strokeLinecap='round'
      {...p}
    >
      <path d='M12 5v14M5 12l7 7 7-7' />
    </svg>
  ),
  Receipt: (p) => (
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
      <path d='M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2-3 2z' />
      <path d='M8 8h8M8 12h8M8 16h5' />
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
      <path d='m6 10 6 6 6-6' />
      <path d='M4 20h16' />
    </svg>
  ),
  Calendar: (p) => (
    <svg
      width='13'
      height='13'
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
  Copy: (p) => (
    <svg
      width='13'
      height='13'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <rect x='9' y='9' width='12' height='12' rx='2' />
      <path d='M5 15V5a2 2 0 0 1 2-2h10' />
    </svg>
  ),
  Check: (p) => (
    <svg
      width='11'
      height='11'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='3'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='m4 12 5 5L20 6' />
    </svg>
  ),
  Refresh: (p) => (
    <svg
      width='13'
      height='13'
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
  Clock: (p) => (
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
      <circle cx='12' cy='12' r='9' />
      <path d='M12 7v5l3 2' />
    </svg>
  ),
  Bell: (p) => (
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
      <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
      <path d='M10 21a2 2 0 0 0 4 0' />
    </svg>
  ),
  CheckCircle: (p) => (
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
      <circle cx='12' cy='12' r='9' />
      <path d='m9 12 2 2 4-4' />
    </svg>
  ),
  Sparkle: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z' />
    </svg>
  ),
  Settings: (p) => (
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
      <circle cx='12' cy='12' r='3' />
      <path d='M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' />
    </svg>
  ),
  Info: (p) => (
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
      <circle cx='12' cy='12' r='9' />
      <path d='M12 16v-5M12 8h.01' />
    </svg>
  ),
  Mail: (p) => (
    <svg
      width='13'
      height='13'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <rect x='3' y='5' width='18' height='14' rx='2' />
      <path d='m3 7 9 6 9-6' />
    </svg>
  ),
  Link: (p) => (
    <svg
      width='13'
      height='13'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M10 13a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1' />
      <path d='M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1' />
    </svg>
  ),
  WeChat: (p) => (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M8.5 4C4.4 4 1 6.9 1 10.5c0 2 1 3.7 2.6 5L3 17.5l2.4-1.2c.6.2 1.3.3 2 .3.3 0 .5 0 .8-.1-.2-.6-.3-1.2-.3-1.8 0-3.4 3.2-6.1 7.2-6.1h.6C15 6.2 12 4 8.5 4zM6 7.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4.6 3.4c-3.4 0-6.1 2.3-6.1 5.1 0 2.8 2.7 5.1 6.1 5.1.6 0 1.2-.1 1.8-.2L20 22l-.5-1.6c1.4-.9 2.5-2.4 2.5-4 0-2.8-2.7-5.1-6.4-5.1zM14 13.5a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zm3.5 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z' />
    </svg>
  ),
  Twitter: (p) => (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M18.244 2H21l-6.5 7.4L22 22h-6.6l-5.2-6.7L4.2 22H1.5l7-8L1 2h6.7l4.7 6.2L18.244 2zm-1.1 18h1.5L7 4H5.4l11.7 16z' />
    </svg>
  ),
  Users: (p) => (
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
      <circle cx='9' cy='8' r='4' />
      <path d='M2 22a7 7 0 0 1 14 0' />
      <circle cx='17' cy='6' r='3' />
      <path d='M22 18a5 5 0 0 0-7-4.6' />
    </svg>
  ),
};

// Convenience wrapper that injects styles once at top of the page.
export const WalletPageStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: WALLET_PAGE_STYLES }} />
);
