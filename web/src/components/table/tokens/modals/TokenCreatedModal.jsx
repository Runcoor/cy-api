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
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { Modal, Button } from '@douyinfe/semi-ui';
import {
  IconEyeOpened,
  IconEyeClosed,
  IconCopy,
  IconBookStroked,
  IconDownloadStroked,
  IconTick,
} from '@douyinfe/semi-icons';
import { Claude, OpenAI, Cline, Cursor } from '@lobehub/icons';
import { VscVscode } from 'react-icons/vsc';
import { copy, showSuccess } from '../../../../helpers/utils';
import { getServerAddress } from '../../../../helpers/token';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';

/* ─────────────────────────────────────────────────────────────
   Utilities
   ───────────────────────────────────────────────────────────── */

const maskKey = (key) => {
  if (!key) return '';
  if (key.length <= 12) return key;
  return key.slice(0, 7) + '\u2022'.repeat(18) + key.slice(-4);
};

/* ─────────────────────────────────────────────────────────────
   Syntax highlight — className-based so CSS can theme light/dark
   ───────────────────────────────────────────────────────────── */
const KW = ({ children }) => <span className='tm-syn-kw'>{children}</span>;
const STR = ({ children }) => <span className='tm-syn-str'>{children}</span>;
const CMT = ({ children }) => <span className='tm-syn-cmt'>{children}</span>;
const VAR = ({ children }) => <span className='tm-syn-var'>{children}</span>;
const FN = ({ children }) => <span className='tm-syn-fn'>{children}</span>;
const ENV = ({ children }) => <span className='tm-syn-env'>{children}</span>;

/* ─────────────────────────────────────────────────────────────
   Tutorial content — rendered as arrays of spans so we can both
   render React with syntax highlight AND derive plain text for copy.
   ───────────────────────────────────────────────────────────── */
const getTutorial = (tab, base, key, t) => {
  switch (tab) {
    case 'claude':
      return {
        filename: 'shell · ~/.zshrc',
        lines: [
          [<CMT>{`# ${t('Claude Code — 将 API 请求路由到')} ${base}`}</CMT>],
          [],
          [<KW>export</KW>, ' ', <ENV>ANTHROPIC_BASE_URL</ENV>, '=', <STR>{base}</STR>],
          [<KW>export</KW>, ' ', <ENV>ANTHROPIC_AUTH_TOKEN</ENV>, '=', <STR>{key}</STR>],
          [],
          [<CMT>{`# ${t('然后在终端中启动')}`}</CMT>],
          [<FN>claude</FN>],
        ],
      };
    case 'opencode':
      return {
        filename: 'config · ~/.config/opencode/config.json',
        lines: [
          [<CMT>{`# ${t('OpenCode — 设置自定义 API 端点')}`}</CMT>],
          [],
          [<KW>export</KW>, ' ', <ENV>OPENAI_BASE_URL</ENV>, '=', <STR>{`${base}/v1`}</STR>],
          [<KW>export</KW>, ' ', <ENV>OPENAI_API_KEY</ENV>, '=', <STR>{key}</STR>],
          [],
          [<CMT>{`# ${t('或在 config.json 中配置')}`}</CMT>],
          ['{'],
          ['  ', <ENV>"model"</ENV>, ': ', <STR>"openai/gpt-4o"</STR>, ','],
          ['  ', <ENV>"openai"</ENV>, ': { ', <ENV>"baseURL"</ENV>, ': ', <STR>{`"${base}/v1"`}</STR>, ' }'],
          ['}'],
        ],
      };
    case 'cline':
      return {
        filename: 'vscode · cline extension',
        lines: [
          [<CMT>{`# ${t('Cline (VSCode Extension) — 自定义端点')}`}</CMT>],
          [],
          [<CMT>{`# 1. ${t('打开 VSCode → Cline 扩展面板')}`}</CMT>],
          [<CMT>{`# 2. ${t('点击右上角设置图标')}`}</CMT>],
          [<CMT>{`# 3. ${t('API Provider 选择 "OpenAI Compatible"')}`}</CMT>],
          [],
          [<ENV>Base URL</ENV>, '  ', <STR>{`${base}/v1`}</STR>],
          [<ENV>API Key</ENV>, '   ', <STR>{key}</STR>],
          [<ENV>Model ID</ENV>, '  ', <STR>claude-sonnet-4-5</STR>],
        ],
      };
    case 'codex':
      return {
        filename: 'shell · terminal',
        lines: [
          [<CMT>{`# ${t('OpenAI Codex CLI — 指向自定义端点')}`}</CMT>],
          [],
          [<KW>export</KW>, ' ', <ENV>OPENAI_BASE_URL</ENV>, '=', <STR>{`${base}/v1`}</STR>],
          [<KW>export</KW>, ' ', <ENV>OPENAI_API_KEY</ENV>, '=', <STR>{key}</STR>],
          [],
          [<CMT>{`# ${t('启动 Codex')}`}</CMT>],
          [<FN>codex</FN>],
        ],
      };
    case 'cursor':
      return {
        filename: 'cursor · settings → models',
        lines: [
          [<CMT>{`# ${t('Cursor IDE — 自定义 API 端点')}`}</CMT>],
          [],
          [<CMT>{`# ${t('路径')}: Settings → Models → OpenAI API Key`}</CMT>],
          [],
          [<ENV>Override OpenAI Base URL</ENV>],
          [<STR>{`${base}/v1`}</STR>],
          [],
          [<ENV>API Key</ENV>, '  ', <STR>{key}</STR>],
        ],
      };
    case 'code':
    default:
      return {
        filename: 'javascript · example.js',
        lines: [
          [<KW>import</KW>, ' ', <VAR>OpenAI</VAR>, ' ', <KW>from</KW>, ' ', <STR>'openai'</STR>, ';'],
          [],
          [<KW>const</KW>, ' ', <VAR>client</VAR>, ' = ', <KW>new</KW>, ' ', <FN>OpenAI</FN>, '({'],
          ['  ', <ENV>baseURL</ENV>, ': ', <STR>{`'${base}/v1'`}</STR>, ','],
          ['  ', <ENV>apiKey</ENV>, ': ', <STR>{`'${key}'`}</STR>, ','],
          ['});'],
          [],
          [<KW>const</KW>, ' ', <VAR>res</VAR>, ' = ', <KW>await</KW>, ' client.chat.completions.', <FN>create</FN>, '({'],
          ['  ', <ENV>model</ENV>, ': ', <STR>'gpt-4o'</STR>, ','],
          ['  ', <ENV>messages</ENV>, ': [{ ', <ENV>role</ENV>, ': ', <STR>'user'</STR>, ', ', <ENV>content</ENV>, ': ', <STR>'Hello!'</STR>, ' }],'],
          ['});'],
        ],
      };
  }
};

const getTutorialPlainText = (tab, base, key) => {
  switch (tab) {
    case 'claude':
      return `# Claude Code\nexport ANTHROPIC_BASE_URL=${base}\nexport ANTHROPIC_AUTH_TOKEN=${key}\n\nclaude`;
    case 'opencode':
      return `export OPENAI_BASE_URL=${base}/v1\nexport OPENAI_API_KEY=${key}\n\n# ~/.config/opencode/config.json\n{\n  "model": "openai/gpt-4o",\n  "openai": { "baseURL": "${base}/v1" }\n}`;
    case 'cline':
      return `# Cline (VSCode) → Settings → OpenAI Compatible\nBase URL:  ${base}/v1\nAPI Key:   ${key}\nModel ID:  claude-sonnet-4-5`;
    case 'codex':
      return `export OPENAI_BASE_URL=${base}/v1\nexport OPENAI_API_KEY=${key}\n\ncodex`;
    case 'cursor':
      return `# Cursor → Settings → Models → OpenAI API Key\nOverride OpenAI Base URL: ${base}/v1\nAPI Key: ${key}`;
    case 'code':
    default:
      return `import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  baseURL: '${base}/v1',\n  apiKey: '${key}',\n});\n\nconst res = await client.chat.completions.create({\n  model: 'gpt-4o',\n  messages: [{ role: 'user', content: 'Hello!' }],\n});`;
  }
};

/* ─────────────────────────────────────────────────────────────
   Scoped stylesheet — all values derived from the project's
   design tokens in src/index.css. Dark mode cascades via html.dark.
   The modal chrome itself is NOT overridden — .semi-modal-content
   already gets --surface + --border-default + --shadow-float from
   the global stylesheet, matching every other modal in the app.
   ───────────────────────────────────────────────────────────── */
const MODAL_STYLES = `
.tm-root {
  /* Apple system green — the one hardcoded brand note we keep,
     because success semantics don't belong in the product palette. */
  --tm-success: #34c759;
  --tm-success-soft: rgba(52, 199, 89, 0.12);
  --tm-success-ring: rgba(52, 199, 89, 0.28);

  /* Syntax — light theme (GitHub light inspired) */
  --tm-syn-kw:  #8250df;
  --tm-syn-str: #0a3069;
  --tm-syn-cmt: #6e7781;
  --tm-syn-var: #953800;
  --tm-syn-fn:  #0550ae;
  --tm-syn-env: #116329;
}
html.dark .tm-root {
  --tm-syn-kw:  #d2a8ff;
  --tm-syn-str: #a5d6ff;
  --tm-syn-cmt: #8b949e;
  --tm-syn-var: #ffa657;
  --tm-syn-fn:  #79c0ff;
  --tm-syn-env: #7ee787;
}

/* ───── Stagger reveal ───── */
@keyframes tm-rise {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tm-root .tm-stagger > * {
  opacity: 0;
  animation: tm-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.tm-root .tm-stagger > *:nth-child(1) { animation-delay: 0ms; }
.tm-root .tm-stagger > *:nth-child(2) { animation-delay: 60ms; }
.tm-root .tm-stagger > *:nth-child(3) { animation-delay: 120ms; }
.tm-root .tm-stagger > *:nth-child(4) { animation-delay: 180ms; }
.tm-root .tm-stagger > *:nth-child(5) { animation-delay: 240ms; }
.tm-root .tm-stagger > *:nth-child(6) { animation-delay: 300ms; }
.tm-root .tm-stagger > *:nth-child(7) { animation-delay: 360ms; }

/* ───── Success mark SVG draw-in ───── */
@keyframes tm-draw-check {
  from { stroke-dashoffset: 30; }
  to   { stroke-dashoffset: 0; }
}
@keyframes tm-pulse-ring {
  0%   { transform: scale(0.85); opacity: 0; }
  60%  { opacity: 0.5; }
  100% { transform: scale(1.25); opacity: 0; }
}
.tm-check-path {
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: tm-draw-check 0.6s 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.tm-check-pulse {
  transform-origin: center;
  animation: tm-pulse-ring 1.4s 0.35s ease-out forwards;
}

/* ───── Eyebrow label ───── */
.tm-eyebrow {
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tm-eyebrow::before,
.tm-eyebrow::after {
  content: '';
  display: inline-block;
  width: 18px;
  height: 1px;
  background: var(--border-default);
}

/* ───── Title ───── */
.tm-title {
  font-family: var(--font-sans);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  text-align: center;
  margin: 0;
}
.tm-subtitle {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.55;
  margin: 0;
  max-width: 380px;
}

/* ───── Hero key card ───── */
.tm-key-card {
  width: 100%;
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  transition: background-color var(--ease-micro), border-color var(--ease-micro);
}
.tm-key-card:hover {
  background: var(--bg-muted);
}
.tm-key-chip {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: var(--accent-light);
  color: var(--accent);
  text-transform: uppercase;
}
.tm-key-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 0.01em;
  color: var(--text-primary);
  user-select: all;
}
.tm-icon-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--ease-micro), color var(--ease-micro);
}
.tm-icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
.tm-icon-btn.is-copied {
  color: var(--tm-success);
}

/* ───── Segmented tab bar ───── */
.tm-segment {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-snap-type: x proximity;
  scroll-behavior: smooth;
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
}
.tm-segment::-webkit-scrollbar { display: none; }
.tm-seg-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  box-shadow: var(--shadow-ring), 0 1px 2px rgba(0,0,0,0.05);
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
              width 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
  will-change: transform, width;
}
html.dark .tm-seg-indicator {
  background: var(--surface-active);
  box-shadow: var(--shadow-ring), 0 1px 3px rgba(0,0,0,0.35);
}
.tm-seg-btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  scroll-snap-align: center;
  padding: 7px 13px;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--ease-micro);
}
.tm-seg-btn:hover { color: var(--text-primary); }
.tm-seg-btn.is-active {
  color: var(--text-primary);
  font-weight: 600;
}
.tm-seg-btn-icon {
  display: inline-flex;
  align-items: center;
  opacity: 0.9;
}

/* ───── Code well ───── */
.tm-code-well {
  margin-top: 10px;
  border-radius: var(--radius-lg);
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  overflow: hidden;
}
.tm-code-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.tm-code-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-family: var(--font-mono);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tm-code-body {
  padding: 14px 16px 16px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.75;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--border-default) transparent;
}
.tm-code-body::-webkit-scrollbar { height: 6px; }
.tm-code-body::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 3px;
}
.tm-code-line {
  display: flex;
  gap: 14px;
  white-space: nowrap;
  min-height: 1.75em;
}
.tm-code-line-num {
  color: var(--text-muted);
  opacity: 0.6;
  min-width: 18px;
  user-select: none;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.tm-code-line-content {
  color: var(--text-primary);
}

/* Syntax spans */
.tm-syn-kw  { color: var(--tm-syn-kw); }
.tm-syn-str { color: var(--tm-syn-str); }
.tm-syn-cmt { color: var(--tm-syn-cmt); font-style: italic; }
.tm-syn-var { color: var(--tm-syn-var); }
.tm-syn-fn  { color: var(--tm-syn-fn); }
.tm-syn-env { color: var(--tm-syn-env); }

/* Code fade between tabs */
@keyframes tm-code-fade {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tm-code-body .tm-code-line {
  animation: tm-code-fade 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.tm-code-body .tm-code-line:nth-child(1)  { animation-delay: 0ms; }
.tm-code-body .tm-code-line:nth-child(2)  { animation-delay: 20ms; }
.tm-code-body .tm-code-line:nth-child(3)  { animation-delay: 40ms; }
.tm-code-body .tm-code-line:nth-child(4)  { animation-delay: 60ms; }
.tm-code-body .tm-code-line:nth-child(5)  { animation-delay: 80ms; }
.tm-code-body .tm-code-line:nth-child(6)  { animation-delay: 100ms; }
.tm-code-body .tm-code-line:nth-child(7)  { animation-delay: 120ms; }
.tm-code-body .tm-code-line:nth-child(8)  { animation-delay: 140ms; }
.tm-code-body .tm-code-line:nth-child(9)  { animation-delay: 160ms; }
.tm-code-body .tm-code-line:nth-child(10) { animation-delay: 180ms; }
.tm-code-body .tm-code-line:nth-child(11) { animation-delay: 200ms; }

/* ───── Footer actions — Semi Buttons inherit global styling ───── */
.tm-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding-top: 4px;
}
.tm-footer-mobile {
  flex-direction: column;
  align-items: stretch;
}
.tm-footer-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.tm-footer-mobile .tm-footer-actions {
  flex-direction: column-reverse;
  width: 100%;
}
.tm-footer-mobile .tm-footer-actions .semi-button { width: 100%; }
.tm-footer-mobile .semi-button-borderless {
  order: 3;
  justify-content: center;
  padding-top: 10px !important;
}
`;

/* ─────────────────────────────────────────────────────────────
   Success mark component
   ───────────────────────────────────────────────────────────── */
const SuccessMark = () => (
  <svg width='48' height='48' viewBox='0 0 48 48' fill='none' aria-hidden>
    <circle
      className='tm-check-pulse'
      cx='24'
      cy='24'
      r='22'
      fill='none'
      stroke='var(--tm-success-ring)'
      strokeWidth='1'
    />
    <circle
      cx='24'
      cy='24'
      r='20'
      fill='var(--tm-success-soft)'
      stroke='var(--tm-success-ring)'
      strokeWidth='0.75'
    />
    <path
      className='tm-check-path'
      d='M15 24.5 L21 30.5 L33 18.5'
      fill='none'
      stroke='var(--tm-success)'
      strokeWidth='2.25'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────── */
const TokenCreatedModal = ({ visible, onClose, tokenKeys, t }) => {
  const isMobile = useIsMobile();
  const [revealed, setRevealed] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('claude');
  const [indicatorRect, setIndicatorRect] = useState({ left: 0, width: 0 });

  const segmentRef = useRef(null);
  const tabRefs = useRef({});

  const isBatch = tokenKeys.length > 1;
  const firstKey = tokenKeys[0] || '';
  const fullKey = `sk-${firstKey}`;
  const displayKey = fullKey.startsWith('sk-') ? fullKey.slice(3) : fullKey;

  // Resolve the public base URL. Prefer admin-configured server_address
  // unless it points at localhost (a leftover dev value), in which case
  // fall back to the current browser origin. Same logic as HomeLanding.
  const baseUrl = useMemo(() => {
    const fromBackend = getServerAddress() || '';
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(fromBackend);
    if (fromBackend && !isLocal) return fromBackend;
    return typeof window !== 'undefined' ? window.location.origin : fromBackend;
  }, [visible]);

  const TABS = useMemo(
    () => [
      { id: 'claude',   label: 'Claude Code', icon: <Claude size={13} /> },
      { id: 'opencode', label: 'OpenCode',    icon: <span style={{ fontSize: 13, fontWeight: 600 }}>◈</span> },
      { id: 'cline',    label: 'Cline',       icon: <Cline size={13} /> },
      { id: 'codex',    label: 'Codex CLI',   icon: <OpenAI size={13} /> },
      { id: 'cursor',   label: 'Cursor',      icon: <Cursor size={13} /> },
      { id: 'code',     label: 'Code',        icon: <VscVscode size={13} /> },
    ],
    [],
  );

  const allKeysText = useMemo(
    () => tokenKeys.map((k) => `sk-${k}`).join('\n'),
    [tokenKeys],
  );

  /* ── Update sliding segment indicator ── */
  useLayoutEffect(() => {
    if (isBatch) return;
    const el = tabRefs.current[activeTab];
    const seg = segmentRef.current;
    if (!el || !seg) return;
    const segRect = seg.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicatorRect({
      left: elRect.left - segRect.left + seg.scrollLeft,
      width: elRect.width,
    });
    // Auto-scroll active tab into view horizontally
    el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeTab, isBatch, visible, isMobile]);

  // Recompute indicator on window resize (mask width changes)
  useEffect(() => {
    const onResize = () => {
      const el = tabRefs.current[activeTab];
      const seg = segmentRef.current;
      if (!el || !seg) return;
      const segRect = seg.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicatorRect({
        left: elRect.left - segRect.left + seg.scrollLeft,
        width: elRect.width,
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeTab]);

  const handleCopyKey = async () => {
    const ok = await copy(isBatch ? allKeysText : fullKey);
    if (ok) {
      setCopiedKey(true);
      showSuccess(t('已复制到剪切板'));
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const text = getTutorialPlainText(activeTab, baseUrl, fullKey);
    const ok = await copy(text);
    if (ok) {
      setCopiedCode(true);
      showSuccess(t('代码已复制到剪贴板'));
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadEnv = () => {
    const envContent = `# API Configuration\nAPI_KEY=${fullKey}\nBASE_URL=${baseUrl}/v1\n`;
    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setRevealed(false);
    setCopiedKey(false);
    setCopiedCode(false);
    setActiveTab('claude');
    onClose();
  };

  const tutorial = getTutorial(
    activeTab,
    baseUrl,
    isBatch ? 'YOUR_API_KEY' : fullKey,
    t,
  );

  return (
    <Modal
      className='tm-modal'
      visible={visible}
      onCancel={handleClose}
      footer={null}
      closable={false}
      centered
      fullScreen={isMobile}
      width={isMobile ? undefined : 640}
      bodyStyle={{
        padding: 0,
        maxHeight: isMobile ? '100vh' : '88vh',
        overflowY: 'auto',
      }}
      style={isMobile ? { borderRadius: 0 } : undefined}
    >
      <style>{MODAL_STYLES}</style>

      <div
        className='tm-root'
        style={{
          padding: isMobile ? '28px 20px 20px' : '32px 28px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          className='tm-stagger'
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            gap: 0,
          }}
        >
          {/* 1. Success mark */}
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SuccessMark />
          </div>

          {/* 2. Eyebrow + Title + Subtitle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
            }}
          >
            <span className='tm-eyebrow'>{t('API 密钥')}</span>
            <h2 className='tm-title'>
              {isBatch ? t('批量创建成功') : t('创建成功')}
            </h2>
            <p className='tm-subtitle'>
              {isBatch
                ? `${tokenKeys.length} ${t('个密钥已生成，请妥善保管。')}`
                : t('此密钥拥有完整的 API 访问权限，请妥善保管。')}
            </p>
          </div>

          {/* 3. Hero key card */}
          <div className='tm-key-card' style={{ marginBottom: 10 }}>
            <span className='tm-key-chip'>sk</span>
            <span className='tm-key-text'>
              {isBatch
                ? `${tokenKeys.length} ${t('个密钥已生成')}`
                : revealed
                  ? displayKey
                  : maskKey(displayKey)}
            </span>
            {!isBatch && (
              <button
                className='tm-icon-btn'
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? t('隐藏') : t('显示')}
                type='button'
              >
                {revealed ? <IconEyeClosed size='small' /> : <IconEyeOpened size='small' />}
              </button>
            )}
            <button
              className={`tm-icon-btn${copiedKey ? ' is-copied' : ''}`}
              onClick={handleCopyKey}
              aria-label={t('复制')}
              type='button'
            >
              {copiedKey ? <IconTick size='small' /> : <IconCopy size='small' />}
            </button>
          </div>

          {/* Spacer between key card and tutorial */}
          <div style={{ height: 18 }} />

          {/* 4. Tutorial segment + code */}
          {!isBatch && (
            <div style={{ width: '100%', marginBottom: 26, minWidth: 0 }}>
              {/* Segmented control */}
              <div className='tm-segment' ref={segmentRef}>
                <div
                  className='tm-seg-indicator'
                  style={{
                    transform: `translateX(${indicatorRect.left}px)`,
                    width: indicatorRect.width,
                  }}
                />
                {TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => (tabRefs.current[tab.id] = el)}
                      className={`tm-seg-btn${active ? ' is-active' : ''}`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setCopiedCode(false);
                      }}
                      type='button'
                    >
                      <span className='tm-seg-btn-icon'>{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Code well */}
              <div className='tm-code-well'>
                <div className='tm-code-header'>
                  <span className='tm-code-label'>{tutorial.filename}</span>
                  <button
                    className={`tm-icon-btn${copiedCode ? ' is-copied' : ''}`}
                    onClick={handleCopyCode}
                    aria-label={t('复制')}
                    type='button'
                    style={{ width: 26, height: 26 }}
                  >
                    {copiedCode ? <IconTick size='small' /> : <IconCopy size='small' />}
                  </button>
                </div>
                <div className='tm-code-body' key={activeTab}>
                  {tutorial.lines.map((parts, i) => (
                    <div
                      key={`${activeTab}-${i}`}
                      className='tm-code-line'
                    >
                      <span className='tm-code-line-num'>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className='tm-code-line-content'>
                        {parts.length === 0
                          ? '\u00A0'
                          : parts.map((p, j) => (
                              <React.Fragment key={j}>{p}</React.Fragment>
                            ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. Footer actions — Semi Buttons pick up global .semi-button styling */}
          <div className={`tm-footer${isMobile ? ' tm-footer-mobile' : ''}`}>
            <Button
              icon={<IconBookStroked />}
              theme='borderless'
              type='tertiary'
              size='default'
              onClick={() => {
                const docsLink = localStorage.getItem('docs_link') || '';
                if (docsLink) window.open(docsLink, '_blank');
              }}
            >
              {t('查看接入文档')}
            </Button>

            <div className='tm-footer-actions'>
              {!isBatch && (
                <Button
                  icon={<IconDownloadStroked />}
                  theme='light'
                  type='tertiary'
                  onClick={handleDownloadEnv}
                >
                  {t('下载 .env')}
                </Button>
              )}
              <Button
                theme='solid'
                type='primary'
                onClick={handleClose}
                style={{ minWidth: isMobile ? undefined : 96 }}
              >
                {t('完成')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TokenCreatedModal;
