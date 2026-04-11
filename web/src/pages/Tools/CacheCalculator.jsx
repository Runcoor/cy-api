/*
Prompt Caching Cost Calculator.

Compare standard vs cached pricing across providers that support Prompt Caching
(OpenAI, Anthropic Claude, Google Gemini, DeepSeek). Shows per-request cost,
daily/monthly projections, and cumulative savings.

Fully client-side, uses js-tiktoken for accurate token counting.
*/

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, TextArea, Select, Slider } from '@douyinfe/semi-ui';
import {
  Zap,
  DollarSign,
  TrendingDown,
  BarChart3,
  Info,
  Percent,
  Repeat,
  FileText,
} from 'lucide-react';
import { getEncoding } from 'js-tiktoken';

// ── Tiktoken ────────────────────────────────────────────────────────────────
const encoderCache = {};
function getEncoder(enc) {
  if (!encoderCache[enc]) encoderCache[enc] = getEncoding(enc);
  return encoderCache[enc];
}
function countTokens(text, family) {
  if (!text) return 0;
  const enc = family === 'gpt' || family === 'reasoning' ? 'o200k_base' : 'cl100k_base';
  try {
    return getEncoder(enc).encode(text).length;
  } catch {
    return Math.max(1, Math.round(text.length / 3.5));
  }
}

// ── Cache pricing per provider ──────────────────────────────────────────────
// Prices: USD per 1M tokens.
// cache_write = cost to write into cache (first request)
// cache_read  = cost to read from cache (subsequent requests, i.e. cache hit)
// input       = standard input price (no caching)
// output      = standard output price (same with or without caching)
// min_tokens  = minimum tokens for caching to activate
const CACHE_MODELS = {
  // ── Anthropic Claude ──────────────────────────────────────────────────
  'claude-sonnet-4-6': {
    provider: 'Anthropic', family: 'claude',
    input: 3.00, output: 15.00,
    cache_write: 3.75, cache_read: 0.30,
    min_tokens: 1024,
  },
  'claude-opus-4-6': {
    provider: 'Anthropic', family: 'claude',
    input: 15.00, output: 75.00,
    cache_write: 18.75, cache_read: 1.50,
    min_tokens: 1024,
  },
  'claude-haiku-4-5': {
    provider: 'Anthropic', family: 'claude',
    input: 1.00, output: 5.00,
    cache_write: 1.25, cache_read: 0.10,
    min_tokens: 1024,
  },
  'claude-sonnet-4-5': {
    provider: 'Anthropic', family: 'claude',
    input: 3.00, output: 15.00,
    cache_write: 3.75, cache_read: 0.30,
    min_tokens: 1024,
  },

  // ── OpenAI ────────────────────────────────────────────────────────────
  'gpt-4o': {
    provider: 'OpenAI', family: 'gpt',
    input: 2.50, output: 10.00,
    cache_write: 2.50, cache_read: 1.25,
    min_tokens: 1024,
  },
  'gpt-4o-mini': {
    provider: 'OpenAI', family: 'gpt',
    input: 0.15, output: 0.60,
    cache_write: 0.15, cache_read: 0.075,
    min_tokens: 1024,
  },
  'o1': {
    provider: 'OpenAI', family: 'reasoning',
    input: 15.00, output: 60.00,
    cache_write: 15.00, cache_read: 7.50,
    min_tokens: 1024,
  },
  'o3-mini': {
    provider: 'OpenAI', family: 'reasoning',
    input: 1.10, output: 4.40,
    cache_write: 1.10, cache_read: 0.55,
    min_tokens: 1024,
  },

  // ── Google Gemini ─────────────────────────────────────────────────────
  'gemini-2.5-pro': {
    provider: 'Google', family: 'gemini',
    input: 1.25, output: 10.00,
    cache_write: 1.25, cache_read: 0.3125,
    min_tokens: 4096,
  },
  'gemini-2.5-flash': {
    provider: 'Google', family: 'gemini',
    input: 0.075, output: 0.30,
    cache_write: 0.075, cache_read: 0.01875,
    min_tokens: 4096,
  },

  // ── DeepSeek ──────────────────────────────────────────────────────────
  'deepseek-v3': {
    provider: 'DeepSeek', family: 'deepseek',
    input: 0.27, output: 1.10,
    cache_write: 0.27, cache_read: 0.07,
    min_tokens: 64,
  },
  'deepseek-reasoner': {
    provider: 'DeepSeek', family: 'deepseek',
    input: 0.55, output: 2.19,
    cache_write: 0.55, cache_read: 0.14,
    min_tokens: 64,
  },
};

const DEFAULT_MODEL = 'claude-sonnet-4-6';

// ── Styles ──────────────────────────────────────────────────────────────────
const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 24,
};
const fieldLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  marginBottom: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};
const statCard = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '16px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
const statLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  color: 'var(--text-muted)',
  fontWeight: 600,
  letterSpacing: '0.04em',
};

function formatUSD(amount) {
  if (amount === 0) return '$0.00';
  if (amount < 0.0001) return '<$0.0001';
  if (amount < 0.01) return '$' + amount.toFixed(4);
  if (amount < 1) return '$' + amount.toFixed(3);
  return '$' + amount.toFixed(2);
}

// ── Component ───────────────────────────────────────────────────────────────
const CacheCalculator = () => {
  const { t } = useTranslation();
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [outputTokens, setOutputTokens] = useState('500');
  const [dailyRequests, setDailyRequests] = useState('100');
  const [cacheHitRate, setCacheHitRate] = useState(90);

  const pricing = CACHE_MODELS[model];

  const modelOptions = useMemo(() => {
    const groups = {};
    for (const [id, meta] of Object.entries(CACHE_MODELS)) {
      if (!groups[meta.provider]) groups[meta.provider] = [];
      groups[meta.provider].push({ label: `${id}`, value: id });
    }
    const result = [];
    for (const [provider, items] of Object.entries(groups)) {
      result.push(...items.map((item) => ({ ...item, label: `${item.label}  ·  ${provider}` })));
    }
    return result;
  }, []);

  const calc = useMemo(() => {
    if (!pricing) return null;

    const cachedTokens = countTokens(systemPrompt, pricing.family);
    const uncachedTokens = countTokens(userPrompt, pricing.family);
    const outTokens = parseInt(outputTokens, 10) || 0;
    const reqPerDay = parseInt(dailyRequests, 10) || 0;
    const hitRate = cacheHitRate / 100;
    const missRate = 1 - hitRate;

    // Per-request cost WITHOUT caching (standard pricing)
    const standardInputCost = ((cachedTokens + uncachedTokens) / 1_000_000) * pricing.input;
    const standardOutputCost = (outTokens / 1_000_000) * pricing.output;
    const standardPerReq = standardInputCost + standardOutputCost;

    // Per-request cost WITH caching
    // Cache miss: cache_write for system + input for user + output
    const missInputCost = (cachedTokens / 1_000_000) * pricing.cache_write
      + (uncachedTokens / 1_000_000) * pricing.input;
    // Cache hit: cache_read for system + input for user + output
    const hitInputCost = (cachedTokens / 1_000_000) * pricing.cache_read
      + (uncachedTokens / 1_000_000) * pricing.input;
    const outputCost = (outTokens / 1_000_000) * pricing.output;

    const cachedPerReqAvg = (hitRate * hitInputCost + missRate * missInputCost) + outputCost;

    // Daily
    const standardDaily = standardPerReq * reqPerDay;
    const cachedDaily = cachedPerReqAvg * reqPerDay;
    const savedDaily = standardDaily - cachedDaily;

    // Monthly (30 days)
    const standardMonthly = standardDaily * 30;
    const cachedMonthly = cachedDaily * 30;
    const savedMonthly = standardMonthly - cachedMonthly;

    const savingsPercent = standardPerReq > 0
      ? ((standardPerReq - cachedPerReqAvg) / standardPerReq) * 100
      : 0;

    return {
      cachedTokens,
      uncachedTokens,
      totalInputTokens: cachedTokens + uncachedTokens,
      outTokens,
      standardPerReq,
      cachedPerReqAvg,
      standardDaily,
      cachedDaily,
      savedDaily,
      standardMonthly,
      cachedMonthly,
      savedMonthly,
      savingsPercent,
      hitInputCost,
      missInputCost,
      belowMinimum: cachedTokens < pricing.min_tokens && cachedTokens > 0,
    };
  }, [model, systemPrompt, userPrompt, outputTokens, dailyRequests, cacheHitRate, pricing]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} color='#fff' />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('Prompt Caching 节省计算器')}
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, maxWidth: 680, margin: 0 }}>
          {t('计算使用 Prompt Caching 后能节省多少成本。将 System Prompt 等固定内容放入缓存区，对比标准价格与缓存价格的差异。')}
        </p>
      </div>

      {/* How it works */}
      <div
        style={{
          ...card,
          background: 'var(--bg-base)',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          padding: 16,
        }}
      >
        <Info size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>
            {t('工作原理')}
          </div>
          <div>{t('Prompt Caching 将固定不变的内容（如 System Prompt、Few-shot 示例）缓存起来，后续请求复用缓存而非重新处理。')}</div>
          <div>{t('首次请求按写入价格计费（通常等于或略高于标准价），后续命中缓存按缓存读取价格计费（通常为标准价的 10%-50%）。')}</div>
        </div>
      </div>

      {/* Config */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className='cache-form-grid'>
          <div>
            <div style={fieldLabel}>{t('模型')}</div>
            <Select
              value={model}
              onChange={setModel}
              style={{ width: '100%' }}
              size='large'
              optionList={modelOptions}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={fieldLabel}>{t('预计输出 Tokens')}</div>
              <Input value={outputTokens} onChange={setOutputTokens} size='large' placeholder='500' />
            </div>
            <div>
              <div style={fieldLabel}>
                <Repeat size={11} /> {t('日请求量')}
              </div>
              <Input value={dailyRequests} onChange={setDailyRequests} size='large' placeholder='100' />
            </div>
          </div>
        </div>

        {/* Cache hit rate slider */}
        <div style={{ marginTop: 20 }}>
          <div style={{ ...fieldLabel, marginBottom: 12 }}>
            <Percent size={11} />
            {t('缓存命中率')}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--accent)',
              marginLeft: 4,
            }}>
              {cacheHitRate}%
            </span>
          </div>
          <Slider
            value={cacheHitRate}
            onChange={setCacheHitRate}
            min={0}
            max={100}
            step={5}
            tipFormatter={(v) => `${v}%`}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Text input */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className='cache-form-grid'>
          <div>
            <div style={fieldLabel}>
              <FileText size={11} />
              {t('缓存内容（System Prompt / 固定前缀）')}
            </div>
            <TextArea
              value={systemPrompt}
              onChange={setSystemPrompt}
              autosize={{ minRows: 4, maxRows: 12 }}
              placeholder={t('粘贴你的 System Prompt 或其他固定内容...')}
              style={{ borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            {calc && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                {calc.cachedTokens.toLocaleString()} tokens
                {calc.belowMinimum && (
                  <span style={{ color: 'var(--warning, #f59e0b)', marginLeft: 8 }}>
                    ({t('低于最小缓存要求')} {pricing.min_tokens} tokens)
                  </span>
                )}
              </div>
            )}
          </div>
          <div>
            <div style={fieldLabel}>
              <FileText size={11} />
              {t('动态内容（User Message）')}
            </div>
            <TextArea
              value={userPrompt}
              onChange={setUserPrompt}
              autosize={{ minRows: 4, maxRows: 12 }}
              placeholder={t('粘贴用户每次不同的输入...')}
              style={{ borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            {calc && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                {calc.uncachedTokens.toLocaleString()} tokens
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {calc && calc.totalInputTokens > 0 && (
        <>
          {/* Savings headline */}
          <div
            style={{
              ...card,
              background: calc.savingsPercent > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))' : 'var(--surface)',
              borderColor: calc.savingsPercent > 0 ? 'rgba(16,185,129,0.3)' : 'var(--border-default)',
              textAlign: 'center',
              padding: '28px 24px',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em' }}>
              {t('使用 Prompt Caching 每次请求节省')}
            </div>
            <div style={{
              fontSize: 48,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: calc.savingsPercent > 0 ? '#10b981' : 'var(--text-muted)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              {calc.savingsPercent > 0 ? `${calc.savingsPercent.toFixed(1)}%` : '0%'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
              {formatUSD(calc.standardPerReq)} → {formatUSD(calc.cachedPerReqAvg)} {t('/ 请求')}
            </div>
          </div>

          {/* Detailed stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {/* Per request comparison */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                {t('单次请求')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={statCard}>
                  <div style={statLabel}>{t('标准价格')}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(calc.standardPerReq)}
                  </div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>
                    <Zap size={11} />
                    {t('缓存价格')}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(calc.cachedPerReqAvg)}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                {t('每日')} ({dailyRequests} {t('次请求')})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={statCard}>
                  <div style={statLabel}>{t('标准费用')}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(calc.standardDaily)}
                  </div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>
                    <TrendingDown size={11} />
                    {t('每日节省')}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(calc.savedDaily)}
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                {t('每月')} (30 {t('天')})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={statCard}>
                  <div style={statLabel}>{t('标准费用')}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(calc.standardMonthly)}
                  </div>
                </div>
                <div style={{ ...statCard, borderColor: 'rgba(16,185,129,0.3)' }}>
                  <div style={statLabel}>
                    <TrendingDown size={11} />
                    {t('每月节省')}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {formatUSD(calc.savedMonthly)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing reference */}
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={13} />
              {t('价格参考')} · {model} ({pricing.provider})
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 8,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{t('标准输入')}</div>
                ${pricing.input}/M
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{t('缓存写入')}</div>
                ${pricing.cache_write}/M
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid #10b981' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{t('缓存读取')}</div>
                ${pricing.cache_read}/M
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{t('输出')}</div>
                ${pricing.output}/M
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{t('最小缓存')}</div>
                {pricing.min_tokens.toLocaleString()} tokens
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 640px) {
          .cache-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CacheCalculator;
