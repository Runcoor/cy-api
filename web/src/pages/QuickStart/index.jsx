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
  Tag,
  Radio,
  RadioGroup,
  Skeleton,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconCopy,
  IconTick,
  IconChevronDown,
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
  Zap,
  ArrowRight,
  TicketCheck,
  CreditCard,
} from 'lucide-react';
import { Claude, OpenAI, Cline, Cursor } from '@lobehub/icons';
import { VscVscode } from 'react-icons/vsc';
import { SiAlipay, SiWechat, SiStripe } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess, renderQuota } from '../../helpers';
import { getCurrencyConfig } from '../../helpers/render';
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
    case 'cline':
      return {
        filename: 'vscode · cline extension',
        lines: [
          [<CMT>{`# ${t('Cline (VSCode Extension) — 自定义端点')}`}</CMT>],
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
        ],
      };
  }
};

const getTutorialPlainText = (tab, base, key) => {
  switch (tab) {
    case 'claude':
      return `export ANTHROPIC_BASE_URL=${base}\nexport ANTHROPIC_AUTH_TOKEN=${key}\n\nclaude`;
    case 'cline':
      return `Base URL:  ${base}/v1\nAPI Key:   ${key}\nModel ID:  claude-sonnet-4-5`;
    case 'codex':
      return `export OPENAI_BASE_URL=${base}/v1\nexport OPENAI_API_KEY=${key}\n\ncodex`;
    case 'cursor':
      return `Override OpenAI Base URL: ${base}/v1\nAPI Key: ${key}`;
    case 'code':
    default:
      return `import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  baseURL: '${base}/v1',\n  apiKey: '${key}',\n});`;
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

@keyframes qs-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes qs-scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
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
@keyframes qs-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}

.qs-step-card {
  animation: qs-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.qs-step-card:nth-child(1) { animation-delay: 0ms; }
.qs-step-card:nth-child(2) { animation-delay: 100ms; }
.qs-step-card:nth-child(3) { animation-delay: 200ms; }

.qs-content-enter {
  animation: qs-scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
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

.qs-float { animation: qs-float 3s ease-in-out infinite; }

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

/* ─────── Step indicator ─────── */
const StepIndicator = ({ step, current, completed, onClick }) => {
  const isActive = step === current;
  return (
    <button onClick={onClick} style={{
      width: 32, height: 32, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: isActive ? '2px solid var(--accent)' : completed ? '2px solid var(--success)' : '2px solid var(--border-default)',
      background: completed ? 'rgba(52, 199, 89, 0.12)' : isActive ? 'var(--accent-light)' : 'var(--surface)',
      color: completed ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--text-muted)',
      fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s', outline: 'none', flexShrink: 0,
    }}>
      {completed ? <Check size={16} /> : step}
    </button>
  );
};

/* ─────── Collapsible step card ─────── */
const StepCard = ({ icon, title, subtitle, active, completed, onToggle, children, t }) => (
  <div style={{
    borderRadius: 'var(--radius-lg)',
    border: active ? '1px solid var(--accent)' : completed ? '1px solid rgba(52, 199, 89, 0.3)' : '1px solid var(--border-default)',
    background: 'var(--surface)',
    overflow: 'hidden',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    boxShadow: active ? '0 0 0 3px var(--accent-light)' : 'none',
  }}>
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      width: '100%', padding: '16px 20px',
      background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left',
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: completed ? 'rgba(52, 199, 89, 0.12)' : active ? 'var(--accent-light)' : 'var(--surface-active)',
        color: completed ? 'var(--success)' : active ? 'var(--accent)' : 'var(--text-muted)',
        transition: 'all 0.3s',
      }}>
        {completed ? <Check size={18} /> : icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ fontSize: 15, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s' }}>
            {title}
          </Text>
          {completed && <Tag size='small' color='green' style={{ borderRadius: 'var(--radius-sm)' }}>{t('已完成')}</Tag>}
        </div>
        <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</Text>
      </div>
      <span style={{ color: 'var(--text-muted)', transition: 'transform 0.3s', transform: active ? 'rotate(180deg)' : 'rotate(0)' }}>
        <IconChevronDown />
      </span>
    </button>
    <div style={{
      maxHeight: active ? 1200 : 0,
      opacity: active ? 1 : 0,
      overflow: 'hidden',
      transition: 'max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s',
    }}>
      <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
        {children}
      </div>
    </div>
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

  /* ─── Step 3: Tutorial ─── */
  const [tutorialTab, setTutorialTab] = useState('claude');
  const [codeCopied, setCodeCopied] = useState(false);

  const base = getServerAddress();
  const displayKey = selectedKey ? `sk-${selectedKey}` : 'sk-your-api-key';
  const maskedKey = selectedKey
    ? `sk-${selectedKey.slice(0, 4)}${'●'.repeat(16)}${selectedKey.slice(-4)}`
    : '';

  const stepRefs = useRef({});
  const scrollToStep = (step) => {
    setTimeout(() => {
      stepRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };
  const completeStep = (step) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    if (step < 3) {
      setActiveStep(step + 1);
      scrollToStep(step + 1);
    }
  };

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

  /* ─── Load topup info ─── */
  useEffect(() => {
    (async () => {
      setTopupLoading(true);
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

  /* ─── Step 2: Online payment ─── */
  const handleOnlinePay = async (method) => {
    if (topUpCount < minTopUp) { showError(`${t('最低充值')} ${minTopUp}`); return; }
    setPaymentLoading(true);
    setPayWay(method);
    try {
      if (method === 'stripe') {
        const res = await API.post('/api/user/stripe/pay', { amount: Math.floor(topUpCount), payment_method: 'stripe' });
        if (res.data?.message === 'success') {
          window.open(res.data.data?.pay_link, '_blank');
          showSuccess(t('已打开支付页面'));
          completeStep(2);
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
          completeStep(2);
        } else { showError(res.data?.message || t('支付失败')); }
      }
    } catch { showError(t('请求失败')); }
    finally { setPaymentLoading(false); setPayWay(''); }
  };

  /* ─── Copy helpers ─── */
  const handleCopyKey = () => { copy(displayKey); setKeyCopied(true); showSuccess(t('已复制')); setTimeout(() => setKeyCopied(false), 2000); };
  const handleCopyCode = () => { copy(getTutorialPlainText(tutorialTab, base, displayKey)); setCodeCopied(true); showSuccess(t('已复制')); setTimeout(() => setCodeCopied(false), 2000); };

  const { symbol, rate: currencyRate } = getCurrencyConfig();
  const epayMethods = payMethods.filter((m) => m?.type && m.type !== 'stripe' && m.type !== 'creem');
  const hasAnyPayment = enableOnlineTopUp || enableStripeTopUp;
  const tutorial = getTutorial(tutorialTab, base, displayKey, t);

  const steps = [
    { step: 1, icon: <Key size={20} />, title: t('创建 API Key'), subtitle: t('一键生成你的专属密钥') },
    { step: 2, icon: <Wallet size={20} />, title: t('快速充值'), subtitle: t('充值额度开始使用') },
    { step: 3, icon: <BookOpen size={20} />, title: t('开始使用'), subtitle: t('在你喜欢的工具中配置') },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className='qs-root' style={{
        minHeight: 'calc(100vh - var(--header-height))',
        background: 'var(--bg-base)',
        padding: isMobile ? '24px 16px 48px' : '48px 24px 80px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* ─── Header ─── */}
          <div style={{ textAlign: 'center', marginBottom: 48 }} className='qs-step-card'>
            <div className='qs-float' style={{ marginBottom: 16 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--accent-light)', color: 'var(--accent)',
              }}>
                <Zap size={28} />
              </span>
            </div>
            <h1 className='qs-shimmer-text' style={{
              fontSize: isMobile ? 28 : 36, fontWeight: 700,
              fontFamily: 'var(--font-serif)', margin: '0 0 8px', lineHeight: 1.2,
            }}>
              {t('快速开始')}
            </h1>
            <Text style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              {t('只需三步，即可开始使用 API 服务')}
            </Text>
          </div>

          {/* ─── Progress bar ─── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
            {steps.map((s, i) => (
              <React.Fragment key={s.step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <StepIndicator step={s.step} current={activeStep} completed={completedSteps.has(s.step)} onClick={() => setActiveStep(s.step)} />
                  {!isMobile && (
                    <Text style={{ fontSize: 12, fontWeight: 500, color: activeStep === s.step ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.3s' }}>
                      {s.title}
                    </Text>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    width: isMobile ? 40 : 80, height: 2,
                    background: completedSteps.has(s.step) ? 'var(--success)' : 'var(--border-default)',
                    borderRadius: 1, transition: 'background 0.4s', marginBottom: isMobile ? 0 : 22,
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ─── Step cards ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ═══ Step 1: API Key ═══ */}
            <div ref={(el) => (stepRefs.current[1] = el)} className='qs-step-card'>
              <StepCard
                icon={steps[0].icon} title={steps[0].title} subtitle={steps[0].subtitle}
                active={activeStep === 1} completed={completedSteps.has(1)}
                onToggle={() => setActiveStep(activeStep === 1 ? 0 : 1)} t={t}
              >
                <div className='qs-content-enter' style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              </StepCard>
            </div>

            {/* ═══ Step 2: Top Up ═══ */}
            <div ref={(el) => (stepRefs.current[2] = el)} className='qs-step-card'>
              <StepCard
                icon={steps[1].icon} title={steps[1].title} subtitle={steps[1].subtitle}
                active={activeStep === 2} completed={completedSteps.has(2)}
                onToggle={() => setActiveStep(activeStep === 2 ? 0 : 2)} t={t}
              >
                {completedSteps.has(2) ? (
                  <div className='qs-content-enter' style={{
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
                ) : topupLoading ? (
                  <Skeleton.Paragraph active rows={4} />
                ) : (
                  <div className='qs-content-enter' style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
                              const originalPrice = p.value * priceRatio;
                              const discountedPrice = originalPrice * discount;
                              const hasDiscount = discount < 1.0;
                              const save = originalPrice - discountedPrice;
                              const isSelected = selectedPreset === p.value;

                              // Currency conversion
                              let statusStr = localStorage.getItem('status');
                              let usdRate = 7;
                              try { if (statusStr) { usdRate = JSON.parse(statusStr)?.usd_exchange_rate || 7; } } catch {}
                              const { type: currType } = getCurrencyConfig();
                              let displayValue = p.value;
                              let displayActualPay = discountedPrice;
                              let displaySave = save;
                              if (currType === 'USD') {
                                displayActualPay = discountedPrice / usdRate;
                                displaySave = save / usdRate;
                              } else if (currType === 'CNY') {
                                displayValue = p.value * usdRate;
                              } else if (currType === 'CUSTOM') {
                                displayValue = p.value * currencyRate;
                                displayActualPay = (discountedPrice / usdRate) * currencyRate;
                                displaySave = (save / usdRate) * currencyRate;
                              }

                              return (
                                <button
                                  key={p.value}
                                  className={`qs-preset-btn${isSelected ? ' active' : ''}`}
                                  onClick={() => { setSelectedPreset(p.value); setTopUpCount(p.value); }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                                      {displayValue} {symbol}
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
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {t('实付')} {symbol}{displayActualPay.toFixed(2)}
                                    {hasDiscount ? ` · ${t('节省')} ${symbol}${displaySave.toFixed(2)}` : ''}
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
                            prefix={<CreditCard size={14} style={{ color: 'var(--text-muted)', marginLeft: 4 }} />}
                            placeholder={`${t('最低')} ${minTopUp}`}
                          />
                          {(() => {
                            const discount = topupInfo?.discount?.[topUpCount] || 1.0;
                            const raw = topUpCount * priceRatio;
                            const actual = raw * discount;
                            let statusStr = localStorage.getItem('status');
                            let usdRate = 7;
                            try { if (statusStr) { usdRate = JSON.parse(statusStr)?.usd_exchange_rate || 7; } } catch {}
                            const { type: currType } = getCurrencyConfig();
                            let display = actual;
                            if (currType === 'USD') display = actual / usdRate;
                            else if (currType === 'CUSTOM') display = (actual / usdRate) * currencyRate;
                            return (
                              <Text style={{ fontSize: 12, color: discount < 1 ? 'var(--error)' : 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: discount < 1 ? 600 : 400 }}>
                                {t('实付')} {symbol}{display.toFixed(2)}
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
                          prefix={<TicketCheck size={14} style={{ color: 'var(--text-muted)', marginLeft: 4 }} />}
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
                )}
              </StepCard>
            </div>

            {/* ═══ Step 3: Usage Guide ═══ */}
            <div ref={(el) => (stepRefs.current[3] = el)} className='qs-step-card'>
              <StepCard
                icon={steps[2].icon} title={steps[2].title} subtitle={steps[2].subtitle}
                active={activeStep === 3} completed={completedSteps.has(3)}
                onToggle={() => setActiveStep(activeStep === 3 ? 0 : 3)} t={t}
              >
                <div className='qs-content-enter' style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {t('选择你使用的工具，将以下配置添加到对应位置即可。')}
                  </Text>

                  {/* Tool tabs */}
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
              </StepCard>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default QuickStart;
