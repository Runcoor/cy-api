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

import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Button,
  Input,
  InputNumber,
  Typography,
  Banner,
  Skeleton,
} from '@douyinfe/semi-ui';
import {
  IconCopy,
  IconTick,
  IconEyeOpened,
  IconEyeClosed,
  IconBookStroked,
  IconPlus,
} from '@douyinfe/semi-icons';
import {
  Key,
  Wallet,
  BookOpen,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TicketCheck,
  CreditCard,
} from 'lucide-react';
import { Claude, OpenAI, Cline, Cursor } from '@lobehub/icons';
import { VscVscode } from 'react-icons/vsc';
import { SiAlipay, SiWechat, SiStripe } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess, renderQuota } from '../../helpers';
import { copy } from '../../helpers/utils';
import { getServerAddress, fetchTokenKey } from '../../helpers/token';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { UserContext } from '../../context/User';

const { Text } = Typography;

/* ─────── Syntax highlight tokens ─────── */
const KW = ({ children }) => <span style={{ color: 'var(--qs-syn-kw)' }}>{children}</span>;
const STR = ({ children }) => <span style={{ color: 'var(--qs-syn-str)' }}>{children}</span>;
const CMT = ({ children }) => <span style={{ color: 'var(--qs-syn-cmt)' }}>{children}</span>;
const VAR = ({ children }) => <span style={{ color: 'var(--qs-syn-var)' }}>{children}</span>;
const FN = ({ children }) => <span style={{ color: 'var(--qs-syn-fn)' }}>{children}</span>;
const ENV = ({ children }) => <span style={{ color: 'var(--qs-syn-env)' }}>{children}</span>;

const DEFAULT_MODEL = 'gpt-5.4';

const getTutorial = (tab, base, key, t, os) => {
  const isWin = os === 'windows';
  const exp = isWin ? 'set' : 'export';
  const shellFile = isWin ? 'powershell · terminal' : 'shell · ~/.zshrc';
  const termFile = isWin ? 'powershell · terminal' : 'shell · terminal';

  switch (tab) {
    case 'claude':
      return {
        filename: isWin ? 'powershell · terminal' : 'shell · ~/.zshrc',
        lines: isWin ? [
          [<CMT>{`# ${t('Claude Code — 将 API 请求路由到')} ${base}`}</CMT>],
          [],
          [<KW>$env</KW>, ':', <ENV>ANTHROPIC_BASE_URL</ENV>, ' = ', <STR>{`"${base}"`}</STR>],
          [<KW>$env</KW>, ':', <ENV>ANTHROPIC_AUTH_TOKEN</ENV>, ' = ', <STR>{`"${key}"`}</STR>],
          [<KW>$env</KW>, ':', <ENV>ANTHROPIC_MODEL</ENV>, ' = ', <STR>{`"${DEFAULT_MODEL}"`}</STR>],
          [],
          [<CMT>{`# ${t('然后在终端中启动')}`}</CMT>],
          [<FN>claude</FN>],
        ] : [
          [<CMT>{`# ${t('Claude Code — 将 API 请求路由到')} ${base}`}</CMT>],
          [],
          [<KW>export</KW>, ' ', <ENV>ANTHROPIC_BASE_URL</ENV>, '=', <STR>{base}</STR>],
          [<KW>export</KW>, ' ', <ENV>ANTHROPIC_AUTH_TOKEN</ENV>, '=', <STR>{key}</STR>],
          [<KW>export</KW>, ' ', <ENV>ANTHROPIC_MODEL</ENV>, '=', <STR>{DEFAULT_MODEL}</STR>],
          [],
          [<CMT>{`# ${t('然后在终端中启动')}`}</CMT>],
          [<FN>claude</FN>],
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
          [<ENV>Model ID</ENV>, '  ', <STR>{DEFAULT_MODEL}</STR>],
        ],
      };
    case 'codex':
      return {
        filename: termFile,
        lines: isWin ? [
          [<CMT>{`# ${t('OpenAI Codex CLI — 指向自定义端点')}`}</CMT>],
          [],
          [<KW>$env</KW>, ':', <ENV>OPENAI_BASE_URL</ENV>, ' = ', <STR>{`"${base}/v1"`}</STR>],
          [<KW>$env</KW>, ':', <ENV>OPENAI_API_KEY</ENV>, ' = ', <STR>{`"${key}"`}</STR>],
          [<KW>$env</KW>, ':', <ENV>OPENAI_MODEL</ENV>, ' = ', <STR>{`"${DEFAULT_MODEL}"`}</STR>],
          [],
          [<CMT>{`# ${t('启动 Codex')}`}</CMT>],
          [<FN>codex</FN>],
        ] : [
          [<CMT>{`# ${t('OpenAI Codex CLI — 指向自定义端点')}`}</CMT>],
          [],
          [<KW>export</KW>, ' ', <ENV>OPENAI_BASE_URL</ENV>, '=', <STR>{`${base}/v1`}</STR>],
          [<KW>export</KW>, ' ', <ENV>OPENAI_API_KEY</ENV>, '=', <STR>{key}</STR>],
          [<KW>export</KW>, ' ', <ENV>OPENAI_MODEL</ENV>, '=', <STR>{DEFAULT_MODEL}</STR>],
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
          [<ENV>Model</ENV>, '    ', <STR>{DEFAULT_MODEL}</STR>],
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
          ['  ', <ENV>model</ENV>, ': ', <STR>{`'${DEFAULT_MODEL}'`}</STR>, ','],
          ['  ', <ENV>messages</ENV>, ': [{ ', <ENV>role</ENV>, ': ', <STR>'user'</STR>, ', ', <ENV>content</ENV>, ': ', <STR>'Hello!'</STR>, ' }],'],
          ['});'],
        ],
      };
  }
};

const getTutorialPlainText = (tab, base, key, os) => {
  const isWin = os === 'windows';
  switch (tab) {
    case 'claude':
      return isWin
        ? `# PowerShell\n$env:ANTHROPIC_BASE_URL = "${base}"\n$env:ANTHROPIC_AUTH_TOKEN = "${key}"\n$env:ANTHROPIC_MODEL = "${DEFAULT_MODEL}"\n\nclaude`
        : `export ANTHROPIC_BASE_URL=${base}\nexport ANTHROPIC_AUTH_TOKEN=${key}\nexport ANTHROPIC_MODEL=${DEFAULT_MODEL}\n\nclaude`;
    case 'cline':
      return `Base URL:  ${base}/v1\nAPI Key:   ${key}\nModel ID:  ${DEFAULT_MODEL}`;
    case 'codex':
      return isWin
        ? `# PowerShell\n$env:OPENAI_BASE_URL = "${base}/v1"\n$env:OPENAI_API_KEY = "${key}"\n$env:OPENAI_MODEL = "${DEFAULT_MODEL}"\n\ncodex`
        : `export OPENAI_BASE_URL=${base}/v1\nexport OPENAI_API_KEY=${key}\nexport OPENAI_MODEL=${DEFAULT_MODEL}\n\ncodex`;
    case 'cursor':
      return `# Cursor → Settings → Models → OpenAI API Key\nOverride OpenAI Base URL: ${base}/v1\nAPI Key: ${key}\nModel: ${DEFAULT_MODEL}`;
    case 'code':
    default:
      return `import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  baseURL: '${base}/v1',\n  apiKey: '${key}',\n});\n\nconst res = await client.chat.completions.create({\n  model: '${DEFAULT_MODEL}',\n  messages: [{ role: 'user', content: 'Hello!' }],\n});`;
  }
};

/* ─────── Scoped styles ─────── */
const STYLES = `
.qs-root {
  --qs-syn-kw:  #8250df;
  --qs-syn-str: #0a3069;
  --qs-syn-cmt: #6e7781;
  --qs-syn-var: #953800;
  --qs-syn-fn:  #0550ae;
  --qs-syn-env: #116329;
}
html.dark .qs-root {
  --qs-syn-kw:  #d2a8ff;
  --qs-syn-str: #a5d6ff;
  --qs-syn-cmt: #8b949e;
  --qs-syn-var: #ffa657;
  --qs-syn-fn:  #79c0ff;
  --qs-syn-env: #7ee787;
}

/* ── Check mark animations ── */
@keyframes qs-check-draw {
  from { stroke-dashoffset: 60; }
  to   { stroke-dashoffset: 0; }
}
@keyframes qs-check-pulse {
  0%   { transform: scale(0.85); opacity: 0; }
  60%  { opacity: 0.5; }
  100% { transform: scale(1.3); opacity: 0; }
}
@keyframes qs-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.qs-check-path {
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: qs-check-draw 0.6s 0.15s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.qs-check-pulse {
  transform-origin: center;
  animation: qs-check-pulse 1.2s 0.25s ease-out forwards;
}
.qs-shimmer-text {
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 40%, var(--accent) 80%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: qs-shimmer 3s linear infinite;
}

/* ── Book layout ── */
.qs-book {
  perspective: 2000px;
  max-width: 960px;
  margin: 0 auto;
}
.qs-book-spread {
  position: relative;
  display: flex;
  min-height: max(520px, 55vh);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px var(--border-subtle);
}
.qs-page-left {
  flex: 0 0 35%;
  background: var(--bg-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 28px;
  position: relative;
  overflow: hidden;
}
.qs-page-left::after {
  content: '';
  position: absolute;
  right: 0; top: 0; bottom: 0; width: 20px;
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.03));
  pointer-events: none;
}
.qs-spine {
  width: 2px;
  flex-shrink: 0;
  background: linear-gradient(to bottom, transparent 5%, var(--border-default) 20%, var(--border-default) 80%, transparent 95%);
}
.qs-page-right {
  flex: 1;
  background: var(--surface);
  padding: 32px 28px;
  overflow-y: auto;
  position: relative;
}
.qs-page-right::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0; width: 20px;
  background: linear-gradient(to left, transparent, rgba(0,0,0,0.02));
  pointer-events: none;
  z-index: 1;
}

/* ── 3D Flip animations ── */
@keyframes qs-flip-forward {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(-180deg); }
}
@keyframes qs-flip-backward {
  0%   { transform: rotateY(-180deg); }
  100% { transform: rotateY(0deg); }
}
@keyframes qs-flip-shadow {
  0%   { opacity: 0; }
  50%  { opacity: 1; }
  100% { opacity: 0; }
}
.qs-flip-overlay {
  position: absolute;
  top: 0; bottom: 0;
  width: 65%;
  right: 0;
  transform-origin: left center;
  transform-style: preserve-3d;
  z-index: 10;
  pointer-events: none;
}
.qs-flip-overlay.forward {
  animation: qs-flip-forward 600ms cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
}
.qs-flip-overlay.backward {
  animation: qs-flip-backward 600ms cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
}
.qs-flip-front, .qs-flip-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  overflow: hidden;
}
.qs-flip-front {
  background: var(--surface);
}
.qs-flip-back {
  background: var(--surface);
  transform: rotateY(180deg);
}
.qs-flip-shadow-overlay {
  position: absolute;
  top: 0; bottom: 0;
  left: 35%;
  width: 65%;
  background: rgba(0,0,0,0.06);
  z-index: 9;
  pointer-events: none;
  animation: qs-flip-shadow 600ms cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
}

/* ── Page content transitions ── */
@keyframes qs-page-enter {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.qs-page-content-enter {
  animation: qs-page-enter 0.35s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ── Left page progress indicator ── */
.qs-progress-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 2px solid var(--border-default);
  background: transparent;
  transition: all 0.4s;
  flex-shrink: 0;
}
.qs-progress-dot.active {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}
.qs-progress-dot.completed {
  border-color: var(--success);
  background: var(--success);
}
.qs-progress-line {
  width: 2px; height: 24px;
  background: var(--border-default);
  transition: background 0.4s;
  flex-shrink: 0;
}
.qs-progress-line.completed {
  background: var(--success);
}

/* ── Navigation bar ── */
.qs-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}
.qs-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--surface);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}
.qs-nav-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}
.qs-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.qs-nav-btn.primary {
  background: var(--accent-gradient);
  border: none;
  color: #fff;
  font-weight: 600;
}
.qs-nav-btn.primary:hover:not(:disabled) {
  background: var(--accent-gradient);
  color: #fff;
  opacity: 0.9;
}
.qs-nav-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--border-default);
  border: none;
  cursor: pointer;
  outline: none;
  transition: all 0.3s;
  padding: 0;
}
.qs-nav-dot.active {
  background: var(--accent);
  width: 24px;
  border-radius: 4px;
}
.qs-nav-dot.completed {
  background: var(--success);
}

/* ── Mobile overrides ── */
@media (max-width: 767px) {
  .qs-book-spread {
    flex-direction: column;
    min-height: auto;
  }
  .qs-page-left {
    flex: none;
    padding: 24px 20px;
    flex-direction: row;
    gap: 16px;
    align-items: center;
  }
  .qs-page-left::after { display: none; }
  .qs-spine { width: auto; height: 1px; }
  .qs-page-right {
    padding: 24px 20px;
    min-height: 400px;
  }
  .qs-page-right::before { display: none; }
  .qs-flip-overlay, .qs-flip-shadow-overlay { display: none; }
  .qs-page-content-enter { animation: none; }
}

/* ── Shared UI styles (unchanged) ── */
.qs-code-block {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.65;
  white-space: pre;
  overflow-x: auto;
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
}
.qs-code-block::-webkit-scrollbar { height: 4px; }
.qs-code-block::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

.qs-preset-btn {
  padding: 10px 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--surface);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  outline: none;
}
.qs-preset-btn:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}
.qs-preset-btn.active {
  border-color: var(--accent);
  background: var(--accent-light);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.qs-key-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.2s;
}
.qs-key-item:hover { border-color: var(--accent); background: var(--accent-light); }
.qs-key-item.selected {
  border-color: var(--accent);
  background: var(--accent-light);
  box-shadow: 0 0 0 2px var(--accent-light);
}
`;

/* ─────── Success check mark ─────── */
const SuccessCheck = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox='0 0 48 48' fill='none'>
    <circle cx='24' cy='24' r='20' fill='rgba(52, 199, 89, 0.12)' />
    <circle className='qs-check-pulse' cx='24' cy='24' r='20' fill='none' stroke='rgba(52, 199, 89, 0.3)' strokeWidth='2' />
    <path className='qs-check-path' d='M15 24.5L21 30.5L33 18.5' stroke='#34c759' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);

/* ─────── Left page content — step overview ─────── */
const LeftPageContent = ({ step, icon, title, subtitle, steps, completedSteps, isMobile }) => {
  if (isMobile) {
    return (
      <>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'var(--accent-light)', color: 'var(--accent)',
        }}>
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Step {step} / {steps.length}
          </Text>
          <Text strong style={{ fontSize: 16, color: 'var(--text-primary)', display: 'block', fontFamily: 'var(--font-serif)' }}>
            {title}
          </Text>
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center', width: '100%' }}>
      {/* Large icon */}
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 64, height: 64, borderRadius: 20,
        background: 'var(--accent-light)', color: 'var(--accent)',
        transition: 'all 0.4s',
      }}>
        {React.cloneElement(icon, { size: 28 })}
      </span>

      {/* Step label */}
      <Text style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>
        Step {step} / {steps.length}
      </Text>

      {/* Title & subtitle */}
      <div>
        <Text strong style={{ fontSize: 20, color: 'var(--text-primary)', display: 'block', fontFamily: 'var(--font-serif)', lineHeight: 1.3 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>
          {subtitle}
        </Text>
      </div>

      {/* Vertical progress indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: 8 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.step}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`qs-progress-dot${s.step === step ? ' active' : ''}${completedSteps.has(s.step) ? ' completed' : ''}`}>
                {completedSteps.has(s.step) && (
                  <Check size={8} style={{ color: '#fff', display: 'block', margin: '-1px' }} />
                )}
              </div>
              <Text style={{
                fontSize: 12, fontWeight: s.step === step ? 600 : 400,
                color: s.step === step ? 'var(--accent)' : completedSteps.has(s.step) ? 'var(--success)' : 'var(--text-muted)',
                transition: 'all 0.3s', whiteSpace: 'nowrap',
              }}>
                {s.title}
              </Text>
            </div>
            {i < steps.length - 1 && (
              <div className={`qs-progress-line${completedSteps.has(s.step) ? ' completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ─────── Book navigation bar ─────── */
const BookNavigation = ({ current, total, onPrev, onNext, onDotClick, completedSteps, isFlipping, t, isLastStep }) => (
  <div className='qs-nav'>
    <button className='qs-nav-btn' onClick={onPrev} disabled={current <= 1 || isFlipping}>
      <ChevronLeft size={16} />
      {t('上一步')}
    </button>

    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          className={`qs-nav-dot${i + 1 === current ? ' active' : ''}${completedSteps.has(i + 1) ? ' completed' : ''}`}
          onClick={() => onDotClick(i + 1)}
        />
      ))}
    </div>

    {isLastStep ? (
      <button className='qs-nav-btn primary' onClick={onNext} disabled={isFlipping}>
        {t('进入控制台')}
        <ArrowRight size={16} />
      </button>
    ) : (
      <button className='qs-nav-btn primary' onClick={onNext} disabled={current >= total || isFlipping}>
        {t('下一步')}
        <ChevronRight size={16} />
      </button>
    )}
  </div>
);

/* ─────── Epay form submit helper ─────── */
function submitEpayForm({ url, params }) {
  const form = document.createElement('form');
  form.action = url;
  form.method = 'POST';
  const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') < 1;
  if (!isSafari) form.target = '_blank';
  Object.keys(params || {}).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/* ═══════════════════════════════════════════
   Main QuickStart page
   ═══════════════════════════════════════════ */
const QuickStart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [userState, userDispatch] = useContext(UserContext);

  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  /* ─── Step 1: API Key ─── */
  const [existingTokens, setExistingTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [selectedKey, setSelectedKey] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  /* ─── Step 2: Top up ─── */
  const [topupLoading, setTopupLoading] = useState(true);
  const [topupInfo, setTopupInfo] = useState(null);
  const [payMethods, setPayMethods] = useState([]);
  const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(false);
  const [enableStripeTopUp, setEnableStripeTopUp] = useState(false);
  const [priceRatio, setPriceRatio] = useState(1);
  const [minTopUp, setMinTopUp] = useState(1);
  const [presetAmounts, setPresetAmounts] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [topUpCount, setTopUpCount] = useState(0);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payWay, setPayWay] = useState('');
  const [paymentPending, setPaymentPending] = useState(false);
  const [balanceBefore, setBalanceBefore] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  /* ─── Step 3: Tutorial ─── */
  const [tutorialTab, setTutorialTab] = useState('claude');
  const [tutorialOS, setTutorialOS] = useState('mac');
  const [codeCopied, setCodeCopied] = useState(false);

  const base = getServerAddress();
  const displayKey = selectedKey ? `sk-${selectedKey}` : 'sk-your-api-key';
  const maskedKey = selectedKey
    ? `sk-${selectedKey.slice(0, 4)}${'●'.repeat(16)}${selectedKey.slice(-4)}`
    : '';

  /* ─── Flip animation state ─── */
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('forward');
  const flipTimeoutRef = useRef(null);

  const goToStep = (target) => {
    if (target === activeStep || isFlipping || target < 1 || target > 3) return;
    setFlipDirection(target > activeStep ? 'forward' : 'backward');
    setIsFlipping(true);
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    flipTimeoutRef.current = setTimeout(() => {
      setActiveStep(target);
      setIsFlipping(false);
    }, 600);
  };

  const completeStep = (step) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    if (step < 3) {
      setTimeout(() => goToStep(step + 1), 400);
    }
  };

  /* ─── Keyboard navigation ─── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' && activeStep < 3) goToStep(activeStep + 1);
      if (e.key === 'ArrowLeft' && activeStep > 1) goToStep(activeStep - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeStep, isFlipping]);

  /* ─── Load existing tokens ─── */
  useEffect(() => {
    (async () => {
      setTokensLoading(true);
      try {
        const res = await API.get('/api/token/?p=1&size=20');
        const { success, data } = res.data;
        if (success) {
          const items = Array.isArray(data) ? data : data?.items || [];
          setExistingTokens(items.filter((t) => t.status === 1));
        }
      } catch {}
      setTokensLoading(false);
    })();
  }, []);

  /* ─── Load topup info + live exchange rate ─── */
  useEffect(() => {
    (async () => {
      setTopupLoading(true);
      // Fetch live exchange rate first (updates backend setting)
      try {
        const rateRes = await API.get('/api/user/topup/exchange-rate');
        if (rateRes.data?.success && rateRes.data?.data?.rate) {
          const liveRate = Number(rateRes.data.data.rate);
          if (liveRate > 0) {
            // Update localStorage status with live rate
            try {
              const statusStr = localStorage.getItem('status');
              if (statusStr) {
                const s = JSON.parse(statusStr);
                s.usd_exchange_rate = liveRate;
                s.price = liveRate;
                localStorage.setItem('status', JSON.stringify(s));
              }
            } catch {}
          }
        }
      } catch {}
      // Then load topup info (which now has the updated price)
      try {
        const res = await API.get('/api/user/topup/info');
        const { success, data } = res.data;
        if (success && data) {
          setTopupInfo(data);
          const methods = data.pay_methods || [];
          setPayMethods(methods);
          setEnableOnlineTopUp(!!data.enable_online_topup);
          setEnableStripeTopUp(!!data.enable_stripe_topup);
          const ratio = Number(data.price) || 1;
          setPriceRatio(ratio);
          const min = Number(data.min_topup) || 1;
          setMinTopUp(min);
          setTopUpCount(min);
          // Build presets: use custom amount_options if available, otherwise generate from multipliers
          const amountOptions = data.amount_options || [];
          const discountMap = data.discount || {};
          if (amountOptions.length > 0) {
            setPresetAmounts(amountOptions.map((amount) => ({
              value: amount,
              discount: discountMap[amount] || 1.0,
            })));
          } else {
            const multipliers = [1, 5, 10, 30, 50, 100, 300, 500];
            setPresetAmounts(multipliers.map((m) => ({
              value: min * m,
              discount: discountMap[min * m] || 1.0,
            })));
          }
        }
      } catch {}
      setTopupLoading(false);
    })();
  }, []);

  /* ─── Select existing token ─── */
  const handleSelectToken = async (token) => {
    setSelectedTokenId(token.id);
    try {
      const key = await fetchTokenKey(token.id);
      setSelectedKey(key);
    } catch {
      setSelectedKey('');
      showError(t('获取密钥失败'));
    }
  };

  /* ─── Create new token ─── */
  const handleCreateKey = async () => {
    setCreatingKey(true);
    try {
      const payload = {
        name: tokenName.trim() || `quickstart-${Date.now().toString(36)}`,
        expired_time: -1, remain_quota: 0, unlimited_quota: true,
        model_limits_enabled: false, model_limits: '', allow_ips: '', group: '',
      };
      const res = await API.post('/api/token/', payload);
      const { success, message, data } = res.data;
      if (success && data) {
        setSelectedKey(data);
        setShowCreateForm(false);
        showSuccess(t('API Key 创建成功'));
        // Refresh tokens list
        const listRes = await API.get('/api/token/?p=1&size=20');
        if (listRes.data?.success) {
          const items = Array.isArray(listRes.data.data) ? listRes.data.data : listRes.data.data?.items || [];
          setExistingTokens(items.filter((t) => t.status === 1));
          const newToken = items.find((t) => t.key && data.startsWith(t.key.replace(/\*/g, '').slice(0, 4)));
          if (newToken) setSelectedTokenId(newToken.id);
        }
      } else {
        showError(message || t('创建失败'));
      }
    } catch { showError(t('请求失败')); }
    finally { setCreatingKey(false); }
  };

  /* ─── Step 1 confirm ─── */
  const handleConfirmKey = () => {
    if (!selectedKey) {
      showError(t('请先选择或创建一个 API Key'));
      return;
    }
    completeStep(1);
  };

  /* ─── Step 2: Redeem ─── */
  const handleRedeem = async () => {
    if (!redemptionCode.trim()) { showError(t('请输入充值码')); return; }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', { key: redemptionCode.trim() });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(`${t('充值成功')}${data ? ` — ${renderQuota(data)}` : ''}`);
        setRedemptionCode('');
        // Refresh user
        const selfRes = await API.get('/api/user/self');
        if (selfRes.data?.success) userDispatch({ type: 'login', payload: selfRes.data.data });
        completeStep(2);
      } else { showError(message || t('充值失败')); }
    } catch { showError(t('请求失败')); }
    finally { setIsSubmitting(false); }
  };

  /* ─── Step 2: Online payment — does NOT auto-complete, enters pending state ─── */
  const handleOnlinePay = async (method) => {
    if (topUpCount < minTopUp) { showError(`${t('最低充值')} ${minTopUp}`); return; }
    setPaymentLoading(true);
    setPayWay(method);
    // Record balance before payment to detect changes
    setBalanceBefore(userState?.user?.quota ?? null);
    try {
      if (method === 'stripe') {
        const res = await API.post('/api/user/stripe/pay', { amount: Math.floor(topUpCount), payment_method: 'stripe' });
        if (res.data?.message === 'success') {
          window.open(res.data.data?.pay_link, '_blank');
          showSuccess(t('已打开支付页面'));
          setPaymentPending(true);
        } else { showError(res.data?.message || t('支付失败')); }
      } else {
        const res = await API.post('/api/user/pay', { amount: Math.floor(topUpCount), payment_method: method });
        if (res.data?.message === 'success') {
          if (res.data.url && res.data.data) {
            submitEpayForm({ url: res.data.url, params: res.data.data });
          } else if (res.data.data?.pay_link) {
            window.open(res.data.data.pay_link, '_blank');
          }
          showSuccess(t('已发起支付'));
          setPaymentPending(true);
        } else { showError(res.data?.message || t('支付失败')); }
      }
    } catch { showError(t('请求失败')); }
    finally { setPaymentLoading(false); setPayWay(''); }
  };

  /* ─── Step 2: Verify payment — check if balance actually changed ─── */
  const handleVerifyPayment = async () => {
    setVerifyingPayment(true);
    try {
      const selfRes = await API.get('/api/user/self');
      if (selfRes.data?.success) {
        const newQuota = selfRes.data.data?.quota ?? 0;
        userDispatch({ type: 'login', payload: selfRes.data.data });
        if (balanceBefore !== null && newQuota > balanceBefore) {
          showSuccess(t('充值成功'));
          setPaymentPending(false);
          completeStep(2);
        } else {
          showError(t('暂未检测到到账，请稍后再试或联系客服'));
        }
      }
    } catch { showError(t('请求失败')); }
    finally { setVerifyingPayment(false); }
  };

  /* ─── Copy helpers ─── */
  const handleCopyKey = () => { copy(displayKey); setKeyCopied(true); showSuccess(t('已复制')); setTimeout(() => setKeyCopied(false), 2000); };
  const handleCopyCode = () => { copy(getTutorialPlainText(tutorialTab, base, displayKey, tutorialOS)); setCodeCopied(true); showSuccess(t('已复制')); setTimeout(() => setCodeCopied(false), 2000); };

  const epayMethods = payMethods.filter((m) => m?.type && m.type !== 'stripe' && m.type !== 'creem');
  const hasAnyPayment = enableOnlineTopUp || enableStripeTopUp;
  const tutorial = getTutorial(tutorialTab, base, displayKey, t, tutorialOS);

  const steps = [
    { step: 1, icon: <Key size={20} />, title: t('创建 API Key'), subtitle: t('一键生成你的专属密钥') },
    { step: 2, icon: <Wallet size={20} />, title: t('快速充值'), subtitle: t('充值额度开始使用') },
    { step: 3, icon: <BookOpen size={20} />, title: t('开始使用'), subtitle: t('在你喜欢的工具中配置') },
  ];

  const currentStep = steps.find((s) => s.step === activeStep) || steps[0];

  /* ─── Step content renderers ─── */
  const renderStep1 = () => (
    <div className='qs-page-content-enter' key={`step1-${activeStep}`} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Selected key display */}
      {selectedKey && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 'var(--radius-md)',
          background: 'rgba(52, 199, 89, 0.06)', border: '1px solid rgba(52, 199, 89, 0.2)',
          fontFamily: 'var(--font-mono)', fontSize: 13,
        }}>
          <Check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
            {keyRevealed ? displayKey : maskedKey}
          </span>
          <Button icon={keyRevealed ? <IconEyeClosed /> : <IconEyeOpened />} theme='borderless' type='tertiary' size='small' onClick={() => setKeyRevealed(!keyRevealed)} />
          <Button icon={keyCopied ? <IconTick /> : <IconCopy />} theme='borderless' type='tertiary' size='small' onClick={handleCopyKey} />
        </div>
      )}

      {/* Existing tokens list */}
      {tokensLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton.Paragraph active rows={2} />
        </div>
      ) : existingTokens.length > 0 && (
        <div>
          <Text style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            {t('选择已有的 Key')}
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {existingTokens.map((token) => (
              <div
                key={token.id}
                className={`qs-key-item${selectedTokenId === token.id ? ' selected' : ''}`}
                onClick={() => handleSelectToken(token)}
              >
                <Key size={14} style={{ color: selectedTokenId === token.id ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: 500, display: 'block', color: 'var(--text-primary)' }} ellipsis>
                    {token.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {token.key}
                  </Text>
                </div>
                {selectedTokenId === token.id && <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create new */}
      {showCreateForm ? (
        <div style={{
          padding: 14, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            {t('创建新的 API Key')}
          </Text>
          <Input
            value={tokenName} onChange={setTokenName}
            placeholder={t('例如：my-first-key')} showClear
            style={{ borderRadius: 'var(--radius-md)' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button theme='solid' type='primary' loading={creatingKey} onClick={handleCreateKey}
              icon={<Key size={14} />}
              style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, flex: 1 }}
            >
              {t('立即创建')}
            </Button>
            <Button theme='light' type='tertiary' onClick={() => setShowCreateForm(false)}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              {t('取消')}
            </Button>
          </div>
        </div>
      ) : (
        <Button theme='light' type='primary' icon={<IconPlus />}
          onClick={() => setShowCreateForm(true)}
          style={{ borderRadius: 'var(--radius-md)' }} block
        >
          {t('创建新的 API Key')}
        </Button>
      )}

      {/* Confirm button */}
      {selectedKey && !completedSteps.has(1) && (
        <Button theme='solid' type='primary' onClick={handleConfirmKey}
          icon={<ArrowRight size={14} />}
          style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }} block
        >
          {t('使用此 Key，下一步')}
        </Button>
      )}
    </div>
  );

  const renderStep2 = () => {
    if (completedSteps.has(2)) {
      return (
        <div className='qs-page-content-enter' key='step2-done' style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 16, borderRadius: 'var(--radius-md)',
          background: 'rgba(52, 199, 89, 0.06)', border: '1px solid rgba(52, 199, 89, 0.2)',
        }}>
          <SuccessCheck size={40} />
          <div>
            <Text strong style={{ color: 'var(--success)', display: 'block' }}>{t('充值成功')}</Text>
            <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('额度已到账，可以开始使用了')}</Text>
          </div>
        </div>
      );
    }
    if (paymentPending) {
      return (
        <div className='qs-page-content-enter' key='step2-pending' style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 16, borderRadius: 'var(--radius-md)',
            background: 'rgba(var(--semi-amber-0), 0.08)', border: '1px solid rgba(var(--semi-amber-5), 0.3)',
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(var(--semi-amber-5), 0.12)',
            }}>
              <Wallet size={20} style={{ color: 'var(--warning, #f59e0b)' }} />
            </span>
            <div>
              <Text strong style={{ display: 'block', color: 'var(--text-primary)' }}>{t('支付已发起')}</Text>
              <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('请在打开的页面中完成支付，完成后点击下方按钮确认')}</Text>
            </div>
          </div>
          <Button theme='solid' type='primary' loading={verifyingPayment} onClick={handleVerifyPayment}
            icon={<Check size={14} />}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, height: 40 }} block
          >
            {t('我已完成支付')}
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button theme='borderless' type='tertiary' onClick={() => setPaymentPending(false)}
              style={{ borderRadius: 'var(--radius-md)', flex: 1 }}
            >
              {t('重新选择')}
            </Button>
            <Button theme='borderless' type='tertiary' onClick={() => { setPaymentPending(false); completeStep(2); }}
              style={{ borderRadius: 'var(--radius-md)', flex: 1 }}
            >
              {t('跳过，稍后充值')}
            </Button>
          </div>
        </div>
      );
    }
    if (topupLoading) return <Skeleton.Paragraph active rows={4} />;

    return (
      <div className='qs-page-content-enter' key='step2-form' style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Preset amounts grid */}
        {hasAnyPayment && (
          <>
            <div>
              <Text style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, display: 'block' }}>
                {t('选择充值金额')}
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {presetAmounts.map((p) => {
                  const discount = p.discount || topupInfo?.discount?.[p.value] || 1.0;
                  const originalPay = p.value * priceRatio;
                  const actualPay = originalPay * discount;
                  const hasDiscount = discount < 1.0;
                  const saved = originalPay - actualPay;
                  const isSelected = selectedPreset === p.value;
                  return (
                    <button
                      key={p.value}
                      className={`qs-preset-btn${isSelected ? ' active' : ''}`}
                      onClick={() => { setSelectedPreset(p.value); setTopUpCount(p.value); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                          ${p.value}
                        </span>
                        {hasDiscount && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 5px', lineHeight: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(52, 199, 89, 0.15)', color: 'var(--success)',
                          }}>
                            {t('折').includes('off')
                              ? ((1 - parseFloat(discount)) * 100).toFixed(1)
                              : (discount * 10).toFixed(1)}{t('折')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: hasDiscount ? 'var(--error)' : 'var(--text-muted)' }}>
                        {t('实付')} ¥{actualPay.toFixed(2)}
                        {hasDiscount ? ` · ${t('节省')} ¥${saved.toFixed(2)}` : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom amount input */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <InputNumber
                value={topUpCount} onChange={(v) => { setTopUpCount(v || 0); setSelectedPreset(null); }}
                min={minTopUp} style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
                prefix={<CreditCard size={14} style={{ color: 'var(--text-muted)', marginLeft: 4, marginRight: 4 }} />}
                placeholder={`${t('最低')} ${minTopUp}`}
              />
              {(() => {
                const discount = topupInfo?.discount?.[topUpCount] || 1.0;
                const actualPay = topUpCount * priceRatio * discount;
                const hasDiscount = discount < 1.0;
                return (
                  <Text style={{ fontSize: 12, color: hasDiscount ? 'var(--error)' : 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: hasDiscount ? 600 : 400 }}>
                    {t('实付')} ¥{actualPay.toFixed(2)}
                  </Text>
                );
              })()}
            </div>

            {/* Payment methods */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {enableStripeTopUp && (
                <Button theme='light' loading={paymentLoading && payWay === 'stripe'}
                  onClick={() => handleOnlinePay('stripe')}
                  icon={<SiStripe size={14} color='#635BFF' />}
                  style={{ borderRadius: 'var(--radius-md)', flex: 1 }}
                >
                  Stripe
                </Button>
              )}
              {enableOnlineTopUp && epayMethods.map((m) => (
                <Button key={m.type} theme='light'
                  loading={paymentLoading && payWay === m.type}
                  onClick={() => handleOnlinePay(m.type)}
                  icon={m.type === 'wxpay' ? <SiWechat size={14} color='#07C160' /> : m.type === 'alipay' ? <SiAlipay size={14} color='#1677FF' /> : <CreditCard size={14} />}
                  style={{ borderRadius: 'var(--radius-md)', flex: 1 }}
                >
                  {m.name || m.type}
                </Button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('或')}</Text>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>
          </>
        )}

        {/* Redemption code */}
        <div>
          <Text style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            {t('输入充值码兑换额度')}
          </Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={redemptionCode} onChange={setRedemptionCode}
              placeholder={t('输入充值码')}
              prefix={<TicketCheck size={14} style={{ color: 'var(--text-muted)', marginLeft: 4, marginRight: 4 }} />}
              showClear style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
              onEnterPress={handleRedeem}
            />
            <Button theme='solid' type='primary' loading={isSubmitting} onClick={handleRedeem}
              style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600 }}
            >
              {t('兑换')}
            </Button>
          </div>
        </div>

        {/* Skip */}
        <Button theme='borderless' type='tertiary' onClick={() => completeStep(2)}
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          {t('跳过，稍后充值')}
        </Button>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className='qs-page-content-enter' key={`step3-${activeStep}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        {t('选择你使用的工具，将以下配置添加到对应位置即可。')}
      </Text>

      {/* Tool tabs + OS toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { key: 'claude', label: 'Claude Code', icon: <Claude size={14} /> },
            { key: 'cursor', label: 'Cursor', icon: <Cursor size={14} /> },
            { key: 'cline', label: 'Cline', icon: <Cline size={14} /> },
            { key: 'codex', label: 'Codex CLI', icon: <OpenAI size={14} /> },
            { key: 'code', label: 'Code', icon: <VscVscode size={14} /> },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTutorialTab(item.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                border: tutorialTab === item.key ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                background: tutorialTab === item.key ? 'var(--accent-light)' : 'var(--surface)',
                color: tutorialTab === item.key ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        {/* OS toggle — only show for tools with shell commands */}
        {(tutorialTab === 'claude' || tutorialTab === 'codex') && (
          <div style={{
            display: 'inline-flex', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)', overflow: 'hidden',
          }}>
            {[
              { key: 'mac', label: 'macOS / Linux' },
              { key: 'windows', label: 'Windows' },
            ].map((os) => (
              <button
                key={os.key}
                onClick={() => setTutorialOS(os.key)}
                style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 500,
                  border: 'none', cursor: 'pointer', outline: 'none',
                  background: tutorialOS === os.key ? 'var(--accent-light)' : 'var(--surface)',
                  color: tutorialOS === os.key ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {os.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Code block */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 12px', background: 'var(--surface-active)',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          border: '1px solid var(--border-subtle)', borderBottom: 'none',
        }}>
          <Text style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {tutorial.filename}
          </Text>
          <Button size='small' theme='borderless' type='tertiary'
            icon={codeCopied ? <IconTick /> : <IconCopy />}
            onClick={handleCopyCode} style={{ fontSize: 11 }}
          >
            {codeCopied ? t('已复制') : t('复制')}
          </Button>
        </div>
        <div className='qs-code-block' style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, margin: 0 }}>
          {tutorial.lines.map((line, i) => (
            <div key={i} style={{ minHeight: '1.65em' }}>
              {line.length === 0 ? '\u00A0' : line}
            </div>
          ))}
        </div>
      </div>

      {!selectedKey && (
        <Banner type='warning' closeIcon={null}
          description={t('请先完成第 1 步创建 API Key，代码中的密钥将自动替换。')}
          style={{ borderRadius: 'var(--radius-md)' }}
        />
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button theme='light' type='primary' icon={<IconBookStroked />}
          onClick={() => navigate('/guide')}
          style={{ borderRadius: 'var(--radius-md)', flex: 1 }}
        >
          {t('查看完整教程')}
        </Button>
        <Button theme='solid' type='primary' icon={<ArrowRight size={14} />}
          onClick={() => navigate('/console')}
          style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', fontWeight: 600, flex: 1 }}
        >
          {t('进入控制台')}
        </Button>
      </div>
    </div>
  );

  const stepRenderers = { 1: renderStep1, 2: renderStep2, 3: renderStep3 };

  return (
    <>
      <style>{STYLES}</style>
      <div className='qs-root' style={{
        minHeight: 'calc(100vh - var(--header-height))',
        background: 'var(--bg-base)',
        padding: isMobile ? '24px 16px 48px' : '48px 24px 80px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* ─── Header ─── */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 36 }}>
            <h1 className='qs-shimmer-text' style={{
              fontSize: isMobile ? 24 : 32, fontWeight: 700,
              fontFamily: 'var(--font-serif)', margin: '0 0 6px', lineHeight: 1.2,
            }}>
              {t('快速开始')}
            </h1>
            <Text style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {t('只需三步，即可开始使用 API 服务')}
            </Text>
          </div>

          {/* ─── Book ─── */}
          <div className='qs-book'>
            <div className='qs-book-spread'>
              {/* Left page — step overview */}
              <div className='qs-page-left'>
                <LeftPageContent
                  step={activeStep}
                  icon={currentStep.icon}
                  title={currentStep.title}
                  subtitle={currentStep.subtitle}
                  steps={steps}
                  completedSteps={completedSteps}
                  isMobile={isMobile}
                />
              </div>

              {/* Spine */}
              {!isMobile && <div className='qs-spine' />}

              {/* Right page — interactive content */}
              <div className='qs-page-right'>
                {stepRenderers[activeStep]?.()}
              </div>

              {/* Flip overlay during animation */}
              {isFlipping && !isMobile && (
                <>
                  <div className={`qs-flip-overlay ${flipDirection}`}>
                    <div className='qs-flip-front' style={{ padding: '32px 28px', overflow: 'hidden' }} />
                    <div className='qs-flip-back' style={{ padding: '32px 28px', overflow: 'hidden' }} />
                  </div>
                  <div className='qs-flip-shadow-overlay' />
                </>
              )}
            </div>
          </div>

          {/* ─── Navigation ─── */}
          <BookNavigation
            current={activeStep}
            total={3}
            onPrev={() => goToStep(activeStep - 1)}
            onNext={() => activeStep === 3 ? navigate('/console') : goToStep(activeStep + 1)}
            onDotClick={goToStep}
            completedSteps={completedSteps}
            isFlipping={isFlipping}
            t={t}
            isLastStep={activeStep === 3}
          />

        </div>
      </div>
    </>
  );
};

export default QuickStart;
