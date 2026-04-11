import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button, Toast, Spin } from '@douyinfe/semi-ui';
import {
  Wallet,
  ShieldCheck,
  KeyRound,
  Globe,
  Search,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Gift,
  Clock,
} from 'lucide-react';
import { API } from '../../helpers';

// ── Providers ───────────────────────────────────────────────────────────────
const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  {
    value: 'claude',
    label: 'Claude (Anthropic)',
    placeholder: 'sk-ant-admin-...',
    special: true,
    keyType: 'Admin API Key',
    guideUrl: 'https://console.anthropic.com/settings/admin-keys',
  },
  {
    value: 'grok',
    label: 'Grok (xAI)',
    placeholder: 'xai-mgmt-...',
    special: true,
    keyType: 'Management API Key',
    guideUrl: 'https://console.x.ai/team',
    needTeamId: true,
  },
  { value: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...' },
  { value: 'moonshot', label: 'Moonshot / Kimi', placeholder: 'sk-...' },
  { value: 'siliconflow', label: 'SiliconFlow', placeholder: 'sk-...' },
  { value: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...' },
  { value: 'closeai', label: 'CloseAI / API2GPT', placeholder: 'sk-...' },
  { value: 'aigc2d', label: 'AIGC2D', placeholder: 'sk-...' },
  { value: 'custom', label: 'Custom (OpenAI compatible)', placeholder: 'sk-...' },
];

const NEED_BASE_URL = ['openai', 'custom'];

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

// ── Component ───────────────────────────────────────────────────────────────
const BalanceChecker = () => {
  const { t } = useTranslation();
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const selectedProvider = PROVIDERS.find((p) => p.value === provider);
  const showBaseUrl = NEED_BASE_URL.includes(provider);
  const isSpecial = selectedProvider?.special;
  const needTeamId = selectedProvider?.needTeamId;
  const [teamId, setTeamId] = useState('');

  const handleQuery = useCallback(async () => {
    if (!apiKey.trim()) {
      Toast.warning(t('请输入 API Key'));
      return;
    }
    if (needTeamId && !teamId.trim()) {
      Toast.warning(t('请输入 Team ID'));
      return;
    }
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const body = { provider, key: apiKey.trim() };
      if (showBaseUrl && baseUrl.trim()) {
        body.base_url = baseUrl.trim().replace(/\/+$/, '');
      }
      if (needTeamId && teamId.trim()) {
        body.base_url = teamId.trim();
      }
      const res = await API.post('/api/tool/balance', body);
      const { success, message, data } = res.data;
      if (success) {
        setResult(data);
      } else {
        setError(message || t('查询失败'));
      }
    } catch (e) {
      setError(e.message || t('查询失败'));
    } finally {
      setLoading(false);
    }
  }, [provider, apiKey, baseUrl, showBaseUrl, t]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleQuery();
  };

  const fmt = (v, currency) => {
    if (v === undefined || v === null) return null;
    const sym = currency === 'CNY' ? '\u00a5' : '$';
    return `${sym}${Number(v).toFixed(2)}`;
  };

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
            <Wallet size={18} color='#fff' />
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {t('API Key 余额查询')}
          </h1>
        </div>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 13,
            lineHeight: 1.6,
            maxWidth: 640,
            margin: 0,
          }}
        >
          {t('查询 API Key 在各平台的剩余额度、已用量和到期时间。支持 OpenAI、DeepSeek、Moonshot 等主流平台及 OpenAI 兼容接口。')}
        </p>
      </div>

      {/* Security Notice */}
      <div
        style={{
          ...card,
          background: 'var(--bg-base)',
          borderColor: 'var(--warning, #f59e0b)',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          padding: 16,
        }}
      >
        <ShieldCheck
          size={20}
          style={{ color: 'var(--warning, #f59e0b)', flexShrink: 0, marginTop: 1 }}
        />
        <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <div
            style={{
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            {t('安全说明')}
          </div>
          <div>{t('您的 API Key 仅用于向对应平台发起余额查询请求，查询完成后不会被存储或记录。')}</div>
          <div>{t('查询请求通过本站服务端中转至目标平台，以避免浏览器跨域限制。')}</div>
          <div>{t('本项目完全开源，您可以审查源代码以确认安全性。如仍有顾虑，建议在查询后轮换您的 Key。')}</div>
        </div>
      </div>

      {/* Query Form */}
      <div style={card}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: showBaseUrl ? '1fr 1fr' : '1fr 2fr',
            gap: 16,
          }}
          className='balance-form-grid'
        >
          <div>
            <div style={fieldLabel}>
              <Globe size={12} /> {t('服务商')}
            </div>
            <Select
              value={provider}
              onChange={(v) => { setProvider(v); setResult(null); setError(''); }}
              style={{ width: '100%' }}
              size='large'
              optionList={PROVIDERS.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
            />
          </div>
          <div>
            <div style={fieldLabel}>
              <KeyRound size={12} /> API Key
            </div>
            <Input
              value={apiKey}
              onChange={setApiKey}
              onKeyDown={handleKeyDown}
              mode='password'
              size='large'
              placeholder={selectedProvider?.placeholder || 'sk-...'}
            />
          </div>
        </div>

        {showBaseUrl && (
          <div style={{ marginTop: 16 }}>
            <div style={fieldLabel}>
              <Globe size={12} /> Base URL{' '}
              <span style={{ fontWeight: 400, opacity: 0.6 }}>
                ({t('可选，默认为官方地址')})
              </span>
            </div>
            <Input
              value={baseUrl}
              onChange={setBaseUrl}
              onKeyDown={handleKeyDown}
              size='large'
              placeholder='https://api.openai.com'
            />
          </div>
        )}

        {/* Grok Team ID */}
        {needTeamId && (
          <div style={{ marginTop: 16 }}>
            <div style={fieldLabel}>
              <Globe size={12} /> Team ID
            </div>
            <Input
              value={teamId}
              onChange={setTeamId}
              onKeyDown={handleKeyDown}
              size='large'
              placeholder='team_xxxxxxxx'
            />
          </div>
        )}

        {/* Special provider warning */}
        {isSpecial && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: 'var(--bg-base)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              lineHeight: 1.8,
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--accent)', fontSize: 13, marginBottom: 4 }}>
              <AlertTriangle size={14} />
              {t('特殊说明')}
            </div>
            {provider === 'claude' && (
              <>
                <div>{t('Claude 不提供余额查询接口，仅支持通过 Admin API Key 查询本月消费金额。')}</div>
                <div>{t('需要使用 Admin API Key（以 sk-ant-admin- 开头），普通 API Key 无法查询。')}</div>
                <div>
                  {t('获取方式：')}{' '}
                  <a
                    href='https://console.anthropic.com/settings/admin-keys'
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                  >
                    Anthropic Console → Settings → Admin Keys
                  </a>
                </div>
                <div style={{ marginTop: 4, color: 'var(--warning, #f59e0b)' }}>
                  {t('Admin Key 拥有较高权限，请在查询后及时删除或轮换。')}
                </div>
              </>
            )}
            {provider === 'grok' && (
              <>
                <div>{t('Grok 余额查询需要 Management API Key（非推理用 API Key）和 Team ID。')}</div>
                <div>
                  {t('获取 Management Key：')}{' '}
                  <a
                    href='https://console.x.ai/team'
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                  >
                    xAI Console → Team → API Keys → Management Keys
                  </a>
                </div>
                <div>
                  {t('获取 Team ID：在 xAI Console 的 Team 页面 URL 中可以找到，格式如 team_xxxxxxxx。')}
                </div>
                <div style={{ marginTop: 4, color: 'var(--warning, #f59e0b)' }}>
                  {t('Management Key 拥有账户管理权限，请在查询后及时删除或轮换。')}
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <Button
            theme='solid'
            type='primary'
            size='large'
            loading={loading}
            onClick={handleQuery}
            icon={<Search size={16} />}
            style={{
              borderRadius: 'var(--radius-md)',
              padding: '0 32px',
              background: 'var(--accent-gradient)',
              border: 'none',
              fontWeight: 600,
            }}
          >
            {t('查询余额')}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: 40 }}>
          <Spin size='large' />
          <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 13 }}>
            {t('正在查询，请稍候...')}
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          style={{
            ...card,
            borderColor: 'var(--error, #ef4444)',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            padding: 16,
          }}
        >
          <AlertTriangle
            size={18}
            style={{ color: 'var(--error, #ef4444)', flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--error, #ef4444)',
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              {t('查询失败')}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                wordBreak: 'break-all',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div style={card}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {PROVIDERS.find((p) => p.value === result.provider)?.label || result.provider}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                background: 'var(--surface-hover)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {result.currency}
            </span>
          </div>

          {/* Balance Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            {/* Available Balance (hidden for Claude since it only has usage) */}
            {result.balance >= 0 && (
            <div style={statCard}>
              <div style={statLabel}>
                <DollarSign size={12} />
                {t('可用余额')}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em',
                }}
              >
                {fmt(result.balance, result.currency)}
              </div>
            </div>
            )}

            {/* Used */}
            {result.used > 0 && (
              <div style={statCard}>
                <div style={statLabel}>
                  <TrendingUp size={12} />
                  {result.balance < 0 ? t('本月消费') : t('已使用')}
                </div>
                <div
                  style={{
                    fontSize: result.balance < 0 ? 28 : 22,
                    fontWeight: result.balance < 0 ? 700 : 600,
                    color: result.balance < 0 ? 'var(--accent)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: result.balance < 0 ? '-0.02em' : undefined,
                  }}
                >
                  {fmt(result.used, result.currency)}
                </div>
              </div>
            )}

            {/* Granted */}
            {result.granted > 0 && (
              <div style={statCard}>
                <div style={statLabel}>
                  <Gift size={12} />
                  {t('赠送额度')}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {fmt(result.granted, result.currency)}
                </div>
              </div>
            )}

            {/* Limit */}
            {result.limit > 0 && (
              <div style={statCard}>
                <div style={statLabel}>
                  <ArrowRight size={12} />
                  {t('额度上限')}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {fmt(result.limit, result.currency)}
                </div>
              </div>
            )}

            {/* Expires */}
            {result.expires_at && (
              <div style={statCard}>
                <div style={statLabel}>
                  <Clock size={12} />
                  {t('到期时间')}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {result.expires_at}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supported Providers */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          {t('支持的平台')}
        </div>
        <div>
          OpenAI, Claude (Anthropic), Grok (xAI), DeepSeek, Moonshot/Kimi, SiliconFlow,
          OpenRouter, CloseAI/API2GPT, AIGC2D, {t('以及所有兼容 OpenAI 计费接口的第三方平台')}
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 640px) {
          .balance-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BalanceChecker;
