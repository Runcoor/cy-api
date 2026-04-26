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

// All styles are scoped under .aas-root so they don't leak to other pages.
export const ACCOUNT_SETTINGS_STYLES = `
.aas-root {
  --aas-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --aas-grad-r: linear-gradient(90deg, #0072ff 0%, #00c6ff 100%);
  --aas-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --aas-grad-bg: linear-gradient(135deg, #eef4ff 0%, #e0f2ff 50%, #d9f0ff 100%);
  --aas-blue-1: #0072ff;
  --aas-blue-2: #00c6ff;
  --aas-ink-900: #0b1a2b;
  --aas-ink-700: #2a3a4d;
  --aas-ink-500: #5b6878;
  --aas-ink-400: #8593a3;
  --aas-ink-300: #b6bfca;
  --aas-line: #e8edf3;
  --aas-line-soft: #f1f4f8;
  --aas-bg: #f5f7fb;
  --aas-card: #ffffff;
  --aas-green: #16a37b;
  --aas-green-bg: #e7f7f0;
  --aas-orange: #d97706;
  --aas-orange-bg: #fef3e7;
  --aas-red: #dc2626;
  --aas-red-bg: #fde8e8;
  --aas-purple: #7c3aed;
  --aas-purple-bg: #f0e9ff;

  font-family: "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--aas-ink-900);
  -webkit-font-smoothing: antialiased;
  font-size: 13px;
  line-height: 1.45;
  width: 100%;
}
.aas-root *, .aas-root *::before, .aas-root *::after { box-sizing: border-box; }
.aas-root .aas-mono { font-family: "JetBrains Mono", ui-monospace, monospace; font-feature-settings: "tnum"; }
.aas-root button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.aas-root input, .aas-root select, .aas-root textarea { font-family: inherit; }

.aas-root .aas-page { max-width: 1240px; margin: 0 auto; padding: 28px 28px 100px; }

.aas-root .aas-page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
.aas-root .aas-page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 4px; }
.aas-root .aas-page-sub { color: var(--aas-ink-500); font-size: 12px; }

/* ===== wallet hero ===== */
.aas-root .aas-wallet {
  background: var(--aas-grad-bg);
  border: 1px solid rgba(0,114,255,0.1);
  border-radius: 16px;
  padding: 20px 22px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 28px;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}
.aas-root .aas-wallet::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(circle at 85% -20%, rgba(0,114,255,0.18), transparent 50%),
    radial-gradient(circle at 110% 120%, rgba(0,198,255,0.2), transparent 55%);
}
.aas-root .aas-wallet > * { position: relative; }

.aas-root .aas-avatar-block { display: flex; align-items: center; gap: 14px; min-width: 0; }
.aas-root .aas-avatar {
  width: 56px; height: 56px; border-radius: 16px;
  background: #0b1a2b;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 20px;
  box-shadow: 0 8px 24px -8px rgba(11,26,43,0.3);
  flex: none; overflow: hidden;
}
.aas-root .aas-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.aas-root .aas-avatar-info { min-width: 0; }
.aas-root .aas-avatar-info .aas-name { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.aas-root .aas-avatar-info .aas-name .aas-uname {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;
}
.aas-root .aas-role-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  background: rgba(11,26,43,0.85); color: white; letter-spacing: 0.04em;
  text-transform: uppercase; flex: none;
}
.aas-root .aas-avatar-info .aas-handle { font-size: 12px; color: var(--aas-ink-500); margin-top: 2px; }

.aas-root .aas-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
  align-items: flex-end;
  justify-self: end;
  min-width: 0;
}
.aas-root .aas-stat { min-width: 0; }
.aas-root .aas-stat .aas-lbl { font-size: 11px; color: var(--aas-ink-500); margin-bottom: 4px; font-weight: 500; text-transform: none; letter-spacing: 0; }
.aas-root .aas-stat .aas-val {
  font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
  font-feature-settings: "tnum";
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.aas-root .aas-stat.balance .aas-val {
  background: var(--aas-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  font-size: 26px;
}
.aas-root .aas-stat .aas-delta { font-size: 11px; color: var(--aas-ink-400); margin-top: 2px; font-weight: 500; }
.aas-root .aas-stat .aas-tier-pill {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--aas-grad); color: white;
  padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,114,255,0.3);
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ===== layout ===== */
.aas-root .aas-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  align-items: flex-start;
}
.aas-root .aas-nav-rail {
  position: sticky; top: 24px;
  background: transparent;
  padding: 6px 4px;
}
.aas-root .aas-nav-rail .aas-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 8px;
  font-size: 13px; color: var(--aas-ink-500); cursor: pointer;
  width: 100%; text-align: left;
  transition: all .12s;
  position: relative;
}
.aas-root .aas-nav-rail .aas-nav-item svg { color: var(--aas-ink-400); }
.aas-root .aas-nav-rail .aas-nav-item:hover { color: var(--aas-ink-900); background: var(--aas-line-soft); }
.aas-root .aas-nav-rail .aas-nav-item.active {
  color: var(--aas-blue-1); background: var(--aas-grad-soft); font-weight: 600;
}
.aas-root .aas-nav-rail .aas-nav-item.active svg { color: var(--aas-blue-1); }
.aas-root .aas-nav-rail .aas-nav-item.active::before {
  content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
  background: var(--aas-grad); border-radius: 0 3px 3px 0;
}
.aas-root .aas-nav-rail .aas-badge {
  margin-left: auto; font-size: 10px; padding: 1px 6px; border-radius: 4px;
  background: var(--aas-red-bg); color: var(--aas-red); font-weight: 600;
}

.aas-root .aas-main-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.aas-root .aas-section {
  background: var(--aas-card); border: 1px solid var(--aas-line);
  border-radius: 14px;
  overflow: hidden;
}
.aas-root .aas-section-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--aas-line-soft);
  gap: 12px;
  flex-wrap: wrap;
}
.aas-root .aas-section-head h2 {
  font-size: 14px; font-weight: 600; margin: 0;
  display: flex; align-items: center; gap: 8px;
  color: var(--aas-ink-900);
}
.aas-root .aas-section-head h2 .aas-hint { font-size: 11px; color: var(--aas-ink-400); font-weight: 400; }
.aas-root .aas-section-head .aas-meta { font-size: 11px; color: var(--aas-ink-500); }
.aas-root .aas-section-body { padding: 4px 0; }

/* ===== bindings grid ===== */
.aas-root .aas-bindings {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1px; background: var(--aas-line-soft);
}
.aas-root .aas-binding {
  background: white; padding: 12px 14px;
  display: flex; align-items: center; gap: 10px;
  transition: background .12s;
  position: relative;
  min-width: 0;
}
.aas-root .aas-binding:hover { background: #fbfcfe; }
.aas-root .aas-binding-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex: none;
}
.aas-root .aas-binding-icon.email { background: #e7f0ff; color: var(--aas-blue-1); }
.aas-root .aas-binding-icon.wechat { background: #e2f5e9; color: #07c160; }
.aas-root .aas-binding-icon.github { background: #1a1f24; color: white; }
.aas-root .aas-binding-icon.discord { background: #e9ecff; color: #5865f2; }
.aas-root .aas-binding-icon.telegram { background: #e0f2fe; color: #0088cc; }
.aas-root .aas-binding-icon.linuxdo { background: #fef3e7; color: #d97706; }
.aas-root .aas-binding-icon.oidc { background: var(--aas-purple-bg); color: var(--aas-purple); }
.aas-root .aas-binding-icon.custom { background: var(--aas-line-soft); color: var(--aas-ink-500); }
.aas-root .aas-binding-info { min-width: 0; flex: 1; }
.aas-root .aas-binding-name { font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.aas-root .aas-binding-status { font-size: 11px; color: var(--aas-ink-400); margin-top: 1px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aas-root .aas-binding-status.bound { color: var(--aas-ink-700); }
.aas-root .aas-binding-action {
  font-size: 11px; color: var(--aas-blue-1); font-weight: 500;
  padding: 4px 8px; border-radius: 4px; flex: none;
  cursor: pointer; transition: background .1s, color .1s;
}
.aas-root .aas-binding-action:hover { background: var(--aas-grad-soft); }
.aas-root .aas-binding-action.unbind { color: var(--aas-ink-400); }
.aas-root .aas-binding-action.unbind:hover { background: var(--aas-red-bg); color: var(--aas-red); }
.aas-root .aas-binding-action.disabled { color: var(--aas-ink-300); cursor: not-allowed; }
.aas-root .aas-binding-action.disabled:hover { background: transparent; color: var(--aas-ink-300); }
.aas-root .aas-binding .aas-primary-tag {
  font-size: 9px; padding: 1px 5px; border-radius: 3px;
  background: var(--aas-green-bg); color: var(--aas-green); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
}

/* ===== settings rows ===== */
.aas-root .aas-row {
  display: grid; grid-template-columns: 32px 1fr auto;
  gap: 12px; align-items: center;
  padding: 10px 18px;
  transition: background .08s;
}
.aas-root .aas-row + .aas-row { border-top: 1px solid var(--aas-line-soft); }
.aas-root .aas-row:hover { background: #fbfcfe; }
.aas-root .aas-row-icon {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: var(--aas-line-soft); color: var(--aas-ink-500);
  flex: none;
}
.aas-root .aas-row-icon.tinted-blue { background: var(--aas-grad-soft); color: var(--aas-blue-1); }
.aas-root .aas-row-icon.tinted-red { background: var(--aas-red-bg); color: var(--aas-red); }
.aas-root .aas-row-icon.tinted-orange { background: var(--aas-orange-bg); color: var(--aas-orange); }
.aas-root .aas-row-icon.tinted-green { background: var(--aas-green-bg); color: var(--aas-green); }
.aas-root .aas-row-info { min-width: 0; }
.aas-root .aas-row-title { font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; color: var(--aas-ink-900); }
.aas-root .aas-row-desc { font-size: 11px; color: var(--aas-ink-500); margin-top: 2px; }
.aas-root .aas-row-desc .aas-mono { color: var(--aas-ink-700); }
.aas-root .aas-row-extra { grid-column: 2 / 4; padding-top: 8px; }

.aas-root .aas-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.aas-root .aas-pill.warn { background: var(--aas-orange-bg); color: var(--aas-orange); }
.aas-root .aas-pill.ok { background: var(--aas-green-bg); color: var(--aas-green); }
.aas-root .aas-pill.danger { background: var(--aas-red-bg); color: var(--aas-red); }
.aas-root .aas-pill.info { background: var(--aas-grad-soft); color: var(--aas-blue-1); }
.aas-root .aas-pill.muted { background: var(--aas-line-soft); color: var(--aas-ink-500); }

.aas-root .aas-btn {
  padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 500;
  border: 1px solid var(--aas-line); background: white; color: var(--aas-ink-700);
  transition: all .12s; display: inline-flex; align-items: center; gap: 5px;
  white-space: nowrap;
}
.aas-root .aas-btn:hover:not(:disabled) { border-color: rgba(0,114,255,0.3); color: var(--aas-blue-1); }
.aas-root .aas-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.aas-root .aas-btn.primary {
  background: var(--aas-grad); color: white; border-color: transparent;
  box-shadow: 0 2px 8px rgba(0,114,255,0.25);
}
.aas-root .aas-btn.primary:hover:not(:disabled) { color: white; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,114,255,0.35); }
.aas-root .aas-btn.danger { color: var(--aas-red); border-color: rgba(220,38,38,0.2); background: white; }
.aas-root .aas-btn.danger:hover:not(:disabled) { background: var(--aas-red-bg); color: var(--aas-red); border-color: var(--aas-red); }
.aas-root .aas-btn.ghost { background: transparent; border-color: transparent; color: var(--aas-ink-500); }
.aas-root .aas-btn.ghost:hover:not(:disabled) { color: var(--aas-blue-1); background: var(--aas-grad-soft); border-color: transparent; }

/* ===== switch ===== */
.aas-root .aas-switch {
  position: relative; width: 36px; height: 20px; border-radius: 999px;
  background: #cfd8e3; cursor: pointer; transition: background .15s;
  flex: none; border: none;
}
.aas-root .aas-switch::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
  background: white; border-radius: 50%; transition: transform .15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.aas-root .aas-switch.on { background: var(--aas-grad); }
.aas-root .aas-switch.on::after { transform: translateX(16px); }
.aas-root .aas-switch:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== config grid (notification config) ===== */
.aas-root .aas-config-grid {
  padding: 14px 18px 16px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px;
  border-top: 1px solid var(--aas-line-soft);
}
.aas-root .aas-config-grid.cols-1 { grid-template-columns: 1fr; }
.aas-root .aas-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.aas-root .aas-field label {
  font-size: 12px; color: var(--aas-ink-700); font-weight: 500;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.aas-root .aas-field label .aas-req { color: var(--aas-red); }
.aas-root .aas-field label .aas-help { color: var(--aas-ink-400); font-weight: 400; font-size: 11px; }
.aas-root .aas-input {
  border: 1px solid var(--aas-line); border-radius: 8px;
  padding: 8px 12px; font-size: 13px; background: white;
  transition: all .12s;
  display: flex; align-items: center; gap: 8px;
  min-width: 0;
}
.aas-root .aas-input:focus-within {
  border-color: rgba(0,114,255,0.4);
  box-shadow: 0 0 0 3px rgba(0,114,255,0.08);
}
.aas-root .aas-input svg { color: var(--aas-ink-400); flex: none; }
.aas-root .aas-input input, .aas-root .aas-input select {
  border: none; outline: none; flex: 1; font-size: 13px;
  background: transparent;
  font-feature-settings: "tnum";
  min-width: 0; color: var(--aas-ink-900);
}
.aas-root .aas-input .aas-suffix { color: var(--aas-ink-400); font-size: 11px; flex: none; }
.aas-root .aas-field-help { font-size: 11px; color: var(--aas-ink-400); margin-top: -2px; }

/* danger row */
.aas-root .aas-danger-row {
  margin: 6px 14px 8px;
  background: linear-gradient(135deg, rgba(220,38,38,0.04) 0%, rgba(220,38,38,0.02) 100%);
  border: 1px solid rgba(220,38,38,0.15);
  border-radius: 10px;
}
.aas-root .aas-danger-row:hover { background: linear-gradient(135deg, rgba(220,38,38,0.06) 0%, rgba(220,38,38,0.03) 100%); }
.aas-root .aas-danger-row .aas-row-title { color: var(--aas-red) !important; }
.aas-root .aas-danger-row .aas-row-desc { color: rgba(220,38,38,0.7); }

/* sidebar modules sub-rows */
.aas-root .aas-sub-grid {
  padding: 0 18px 14px 60px;
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
}
.aas-root .aas-sub-card {
  background: var(--aas-line-soft);
  border-radius: 8px; padding: 8px 12px;
  display: flex; align-items: center; gap: 12px;
}
.aas-root .aas-sub-card.disabled { opacity: 0.55; }
.aas-root .aas-sub-card .aas-sub-info { flex: 1; min-width: 0; }
.aas-root .aas-sub-card .aas-sub-title { font-size: 12px; font-weight: 500; color: var(--aas-ink-900); }
.aas-root .aas-sub-card .aas-sub-desc { font-size: 10.5px; color: var(--aas-ink-500); margin-top: 1px; }

/* sticky save bar */
.aas-root .aas-save-bar {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(120px);
  background: #0b1a2b; color: white;
  padding: 8px 8px 8px 18px; border-radius: 999px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 14px 40px -10px rgba(11,26,43,0.5);
  transition: transform .25s cubic-bezier(0.2, 0.9, 0.2, 1);
  font-size: 13px;
  z-index: 50;
  white-space: nowrap;
}
.aas-root .aas-save-bar.show { transform: translateX(-50%) translateY(0); }
.aas-root .aas-save-bar .aas-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--aas-orange); animation: aas-pulse 1.5s infinite; flex: none; }
.aas-root .aas-save-bar .aas-discard {
  color: rgba(255,255,255,0.7); font-size: 12px; padding: 4px 10px; border-radius: 6px;
}
.aas-root .aas-save-bar .aas-discard:hover { color: white; background: rgba(255,255,255,0.08); }
.aas-root .aas-save-bar .aas-save-action {
  background: var(--aas-grad); color: white; padding: 7px 16px; border-radius: 999px; font-weight: 600;
}
.aas-root .aas-save-bar .aas-save-action:disabled { opacity: 0.65; cursor: progress; }
@keyframes aas-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* small token display block */
.aas-root .aas-token-display {
  display: flex; align-items: center; gap: 8px;
  background: #0b1a2b; color: #e8f1ff;
  padding: 8px 12px; border-radius: 8px;
  font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 12px;
  margin-top: 8px;
  word-break: break-all;
}
.aas-root .aas-token-display button {
  color: var(--aas-blue-2); font-size: 11px; font-weight: 600; padding: 2px 8px;
  border-radius: 4px; background: rgba(0,198,255,0.12); flex: none;
}
.aas-root .aas-token-display button:hover { background: rgba(0,198,255,0.22); }

/* responsive */
@media (max-width: 980px) {
  .aas-root .aas-page { padding: 18px 14px 100px; }
  .aas-root .aas-wallet { grid-template-columns: 1fr; gap: 18px; }
  .aas-root .aas-stats { justify-self: stretch; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .aas-root .aas-layout { grid-template-columns: 1fr; }
  .aas-root .aas-nav-rail { position: static; display: flex; flex-wrap: wrap; gap: 6px; padding: 0; }
  .aas-root .aas-nav-rail .aas-nav-item { width: auto; }
  .aas-root .aas-nav-rail .aas-nav-item.active::before { display: none; }
  .aas-root .aas-bindings { grid-template-columns: repeat(2, 1fr); }
  .aas-root .aas-config-grid { grid-template-columns: 1fr; }
  .aas-root .aas-sub-grid { grid-template-columns: 1fr; padding-left: 18px; }
}
@media (max-width: 560px) {
  .aas-root .aas-bindings { grid-template-columns: 1fr; }
  .aas-root .aas-stats { grid-template-columns: 1fr 1fr; }
  .aas-root .aas-section-head { padding: 12px 14px; }
  .aas-root .aas-row { padding: 10px 14px; }
}
`;

// Inline SVG icon set used across the redesigned account page.
export const AasIcons = {
  Plug: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M9 2v6M15 2v6' />
      <path d='M5 8h14v4a7 7 0 0 1-14 0V8z' />
      <path d='M12 19v3' />
    </svg>
  ),
  Shield: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z' />
    </svg>
  ),
  Bell: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
      <path d='M10 21a2 2 0 0 0 4 0' />
    </svg>
  ),
  Tag: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M20 12 12 20l-9-9V3h8l9 9z' />
      <circle cx='7' cy='7' r='1.5' />
    </svg>
  ),
  Lock: (p) => (
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
      <rect x='4' y='11' width='16' height='10' rx='2' />
      <path d='M8 11V7a4 4 0 0 1 8 0v4' />
    </svg>
  ),
  Key: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <circle cx='8' cy='15' r='4' />
      <path d='m11 12 9-9 3 3-3 3 2 2-2 2-2-2-2 2' />
    </svg>
  ),
  Fingerprint: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      {...p}
    >
      <path d='M12 11v3a8 8 0 0 1-2 5.5' />
      <path d='M16 6.5A8 8 0 0 0 4 14' />
      <path d='M8 17a4 4 0 0 1 0-8 4 4 0 0 1 4 4v1a8 8 0 0 0 1 4' />
      <path d='M20 12a8 8 0 0 0-2-5' />
    </svg>
  ),
  Power: (p) => (
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
      <path d='M12 2v8M5 7a8 8 0 1 0 14 0' />
    </svg>
  ),
  Mail: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      {...p}
    >
      <rect x='3' y='5' width='18' height='14' rx='2' />
      <path d='m3 7 9 6 9-6' />
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
      strokeLinejoin='round'
      {...p}
    >
      <path d='M3 12a9 9 0 0 1 15-6.7L21 8' />
      <path d='M21 3v5h-5' />
      <path d='M21 12a9 9 0 0 1-15 6.7L3 16' />
      <path d='M3 21v-5h5' />
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
      strokeLinejoin='round'
      {...p}
    >
      <rect x='9' y='9' width='13' height='13' rx='2' />
      <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
    </svg>
  ),
  WeChat: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M9 4C5 4 2 6.7 2 10c0 1.7.9 3.3 2.4 4.4L4 16l2-1.2c.6.2 1.3.3 2 .3-.7-2.5.9-5.3 4-6.4-.6-2.6-2.7-4.7-3-4.7zM7 8.5a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zm4 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zM16 9c-3.3 0-6 2.2-6 5s2.7 5 6 5c.6 0 1.1-.1 1.7-.2L19 19l-.3-1.4c1.4-.9 2.3-2.3 2.3-3.6 0-2.8-2.7-5-5-5zm-2 3.5a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4zm4 0a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4z' />
    </svg>
  ),
  GitHub: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z' />
    </svg>
  ),
  Discord: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M19.6 5.6a17 17 0 0 0-4.3-1.3c-.2.4-.4.8-.5 1.2a16 16 0 0 0-4.6 0c-.1-.4-.3-.8-.5-1.2-1.5.3-3 .7-4.3 1.3-2.7 4-3.4 8-3 11.8a17 17 0 0 0 5.3 2.7c.4-.6.8-1.2 1.1-1.9-.6-.2-1.2-.5-1.7-.9.1-.1.3-.2.4-.4 3.4 1.6 7 1.6 10.4 0 .1.2.3.3.4.4-.5.4-1.1.7-1.7.9.3.7.7 1.3 1.1 1.9a17 17 0 0 0 5.3-2.7c.5-4.4-.7-8.4-3-11.8zM8.7 14.6c-1 0-1.9-.9-1.9-2.1 0-1.2.8-2.1 1.9-2.1s1.9.9 1.9 2.1c0 1.2-.9 2.1-1.9 2.1zm6.6 0c-1 0-1.9-.9-1.9-2.1 0-1.2.8-2.1 1.9-2.1s1.9.9 1.9 2.1c0 1.2-.9 2.1-1.9 2.1z' />
    </svg>
  ),
  Telegram: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M21.5 4.5 2.5 11.7c-.7.3-.7 1.3 0 1.5l4.4 1.5L17 7.5c.4-.3.9.2.5.5l-8.3 7.6-.3 4.5c.5 0 .7-.2 1-.5l2.4-2.3 4.5 3.3c.8.5 1.4.2 1.6-.7l3-13.4c.3-1.1-.4-1.6-1.2-1.4z' />
    </svg>
  ),
  Linux: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <path d='M12 2c-2.5 0-3.5 2.5-3.5 5 0 1.2.4 2.3.9 3.2-1.5 1.4-3.4 3.7-3.4 6.3 0 2.5 1.5 4 3 4.5 1 .3 1.5.5 1.5 1V22c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-.5c0-.5.5-.7 1.5-1 1.5-.5 3-2 3-4.5 0-2.6-1.9-4.9-3.4-6.3.5-.9.9-2 .9-3.2 0-2.5-1-5-3.5-5zm-1.5 4.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z' />
    </svg>
  ),
  Oidc: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' {...p}>
      <circle cx='12' cy='9' r='4' />
      <path d='M11 13v8h2v-3l3 1v-2l-3-1v-3z' />
    </svg>
  ),
  Webhook: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M18 18a4 4 0 1 0-3.9-3' />
      <path d='M14 18H8' />
      <path d='m9 12-2.1 4.6A4 4 0 1 0 9 21' />
      <path d='M14 6a4 4 0 1 0-7 1' />
    </svg>
  ),
  Sliders: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <line x1='4' y1='21' x2='4' y2='14' />
      <line x1='4' y1='10' x2='4' y2='3' />
      <line x1='12' y1='21' x2='12' y2='12' />
      <line x1='12' y1='8' x2='12' y2='3' />
      <line x1='20' y1='21' x2='20' y2='16' />
      <line x1='20' y1='12' x2='20' y2='3' />
      <circle cx='4' cy='12' r='2' />
      <circle cx='12' cy='10' r='2' />
      <circle cx='20' cy='14' r='2' />
    </svg>
  ),
  Eye: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  ),
  EyeOff: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.06-5.06' />
      <path d='M22.54 12.88A18.5 18.5 0 0 0 23 12s-4-7-11-7c-1.4 0-2.74.27-4 .73' />
      <path d='M9.88 9.88A3 3 0 1 0 14.12 14.12' />
      <line x1='1' y1='1' x2='23' y2='23' />
    </svg>
  ),
  Chevron: (p) => (
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
      <path d='m6 9 6 6 6-6' />
    </svg>
  ),
  Layout: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <rect x='3' y='3' width='18' height='18' rx='2' />
      <line x1='3' y1='9' x2='21' y2='9' />
      <line x1='9' y1='21' x2='9' y2='9' />
    </svg>
  ),
};

// Convenience helper to mount the styles once per page render. Call inside the
// root <div className="aas-root"> of the page.
export const AccountSettingsStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: ACCOUNT_SETTINGS_STYLES }} />
);
