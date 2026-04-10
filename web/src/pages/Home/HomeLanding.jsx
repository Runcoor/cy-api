import React, { useContext, useEffect, useState, useRef } from 'react';
import { Button } from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
  IconFile,

} from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
  Cursor,
  Cline,
} from '@lobehub/icons';
import { VscVscode } from 'react-icons/vsc';

const ICON_SIZE = 44;
const ICON_SIZE_SM = 36;

const providerIcons = [
  { key: 'moonshot', Icon: Moonshot, color: false },
  { key: 'openai', Icon: OpenAI, color: false },
  { key: 'xai', Icon: XAI, color: false },
  { key: 'zhipu', Icon: Zhipu, color: true },
  { key: 'volcengine', Icon: Volcengine, color: true },
  { key: 'cohere', Icon: Cohere, color: true },
  { key: 'claude', Icon: Claude, color: true },
  { key: 'gemini', Icon: Gemini, color: true },
  { key: 'suno', Icon: Suno, color: false },
  { key: 'minimax', Icon: Minimax, color: true },
  { key: 'wenxin', Icon: Wenxin, color: true },
  { key: 'spark', Icon: Spark, color: true },
  { key: 'qingyan', Icon: Qingyan, color: true },
  { key: 'deepseek', Icon: DeepSeek, color: true },
  { key: 'qwen', Icon: Qwen, color: true },
  { key: 'midjourney', Icon: Midjourney, color: false },
  { key: 'grok', Icon: Grok, color: false },
  { key: 'azureai', Icon: AzureAI, color: true },
  { key: 'hunyuan', Icon: Hunyuan, color: true },
  { key: 'xinference', Icon: Xinference, color: true },
];

const ProviderIconItem = ({ icon, size }) => {
  const Comp = icon.color ? icon.Icon.Color || icon.Icon : icon.Icon;
  return (
    <div
      className='shrink-0 flex items-center justify-center'
      style={{
        width: size + 24,
        height: size + 24,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      <Comp size={size} />
    </div>
  );
};

const ScrollingIcons = ({ isMobile }) => {
  const trackRef = useRef(null);
  const size = isMobile ? ICON_SIZE_SM : ICON_SIZE;
  const icons = [...providerIcons, ...providerIcons];

  return (
    <div className='relative w-full overflow-hidden' style={{ height: size + 32 }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          zIndex: 2,
          background: 'linear-gradient(to right, var(--bg-base), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          zIndex: 2,
          background: 'linear-gradient(to left, var(--bg-base), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        ref={trackRef}
        className='flex items-center gap-4'
        style={{
          animation: 'scroll-left 40s linear infinite',
          width: 'max-content',
        }}
      >
        {icons.map((icon, i) => (
          <ProviderIconItem key={`${icon.key}-${i}`} icon={icon} size={size} />
        ))}
      </div>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, accent = false, wide = false }) => (
  <div
    className={`p-8 md:p-10 flex flex-col justify-between gap-6 ${wide ? 'md:col-span-2' : ''}`}
    style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface)',
      border: `1px solid ${accent ? 'rgba(0,114,255,0.15)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-lg)',
      minHeight: wide ? 280 : 240,
    }}
  >
    <span
      className='material-symbols-outlined'
      style={{
        fontSize: 40,
        color: 'var(--accent)',
        fontVariationSettings: "'FILL' 1",
      }}
    >
      {icon}
    </span>
    <div>
      <h3
        className='text-xl md:text-2xl font-semibold mb-3'
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}
      >
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Tutorial Panel
───────────────────────────────────────────── */
const KW = ({ children }) => (
  <span style={{ color: '#79b8ff' }}>{children}</span>
);
const STR = ({ children }) => (
  <span style={{ color: '#9ecbff' }}>{children}</span>
);
const CMT = ({ children }) => (
  <span style={{ color: '#6a737d', fontStyle: 'italic' }}>{children}</span>
);
const VAR = ({ children }) => (
  <span style={{ color: '#b392f0' }}>{children}</span>
);
const FN = ({ children }) => (
  <span style={{ color: '#79b8ff' }}>{children}</span>
);
const ENV = ({ children }) => (
  <span style={{ color: '#ffab70' }}>{children}</span>
);

const TABS = [
  { id: 'claude', label: 'Claude Code', icon: <Claude size={14} /> },
  { id: 'opencode', label: 'OpenCode', icon: '◈' },
  { id: 'cline', label: 'Cline', icon: <Cline size={14} /> },
  { id: 'codex', label: 'Codex CLI', icon: <OpenAI size={14} /> },
  { id: 'cursor', label: 'Cursor', icon: <Cursor size={14} /> },
  { id: 'code', label: 'Code', icon: <VscVscode size={14} /> },
];

const getTutorial = (tab, serverAddress, t) => {
  // Single source of truth — always falls through to whatever the parent
  // computed. The parent already handles localhost / browser-origin fallback.
  const base = serverAddress || (typeof window !== 'undefined' ? window.location.origin : '');
  switch (tab) {
    case 'claude':
      return {
        filename: '~/.bashrc  /  ~/.zshrc',
        lines: [
          { n: '01', el: <><CMT># {t('Claude Code — 将 API 请求路由到')} {base}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><KW>export</KW> <ENV>ANTHROPIC_BASE_URL</ENV>=<STR>{base}</STR></> },
          { n: '04', el: <><KW>export</KW> <ENV>ANTHROPIC_AUTH_TOKEN</ENV>=<STR>YOUR_API_KEY</STR></> },
          { n: '05', el: <></> },
          { n: '06', el: <><CMT># {t('然后在终端中启动')}</CMT></> },
          { n: '07', el: <><FN>claude</FN></> },
        ],
      };
    case 'codex':
      return {
        filename: 'terminal',
        lines: [
          { n: '01', el: <><CMT># {t('OpenAI Codex CLI — 指向自定义端点')}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><KW>export</KW> <ENV>OPENAI_BASE_URL</ENV>=<STR>{base}/v1</STR></> },
          { n: '04', el: <><KW>export</KW> <ENV>OPENAI_API_KEY</ENV>=<STR>YOUR_API_KEY</STR></> },
          { n: '05', el: <></> },
          { n: '06', el: <><CMT># {t('启动 Codex')}</CMT></> },
          { n: '07', el: <><FN>codex</FN> <STR>"{t('重构这段代码，提升可读性')}"</STR></> },
        ],
      };
    case 'cursor':
      return {
        filename: 'Cursor → Settings → Models',
        lines: [
          { n: '01', el: <><CMT># {t('Cursor IDE — 自定义 API 端点')}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><CMT># {t('路径')}: Settings → Models → OpenAI API Key</CMT></> },
          { n: '04', el: <></> },
          { n: '05', el: <><ENV>Override OpenAI Base URL</ENV></> },
          { n: '06', el: <><STR>{base}/v1</STR></> },
          { n: '07', el: <></> },
          { n: '08', el: <><ENV>API Key</ENV>: <STR>YOUR_API_KEY</STR></> },
        ],
      };
    case 'opencode':
      return {
        filename: 'terminal  (~/.config/opencode/config.json)',
        lines: [
          { n: '01', el: <><CMT># {t('OpenCode — 设置自定义 API 端点')}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><KW>export</KW> <ENV>OPENAI_BASE_URL</ENV>=<STR>{base}/v1</STR></> },
          { n: '04', el: <><KW>export</KW> <ENV>OPENAI_API_KEY</ENV>=<STR>YOUR_API_KEY</STR></> },
          { n: '05', el: <></> },
          { n: '06', el: <><CMT># {t('或在 config.json 中配置')}</CMT></> },
          { n: '07', el: <>{'{'}</> },
          { n: '08', el: <>&nbsp;&nbsp;<ENV>"model"</ENV>: <STR>"openai/gpt-4o"</STR>,</> },
          { n: '09', el: <>&nbsp;&nbsp;<ENV>"openai"</ENV>: {'{'} <ENV>"baseURL"</ENV>: <STR>"{base}/v1"</STR> {'}'}</> },
          { n: '10', el: <>{'}'}</> },
        ],
      };
    case 'cline':
      return {
        filename: 'VSCode → Cline Extension → Settings',
        lines: [
          { n: '01', el: <><CMT># {t('Cline (VSCode Extension) — 自定义端点')}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><CMT># 1. {t('打开 VSCode → Cline 扩展面板')}</CMT></> },
          { n: '04', el: <><CMT># 2. {t('点击右上角设置图标')}</CMT></> },
          { n: '05', el: <><CMT># 3. {t('API Provider 选择 "OpenAI Compatible"')}</CMT></> },
          { n: '06', el: <></> },
          { n: '07', el: <><ENV>Base URL</ENV>:   <STR>{base}/v1</STR></> },
          { n: '08', el: <><ENV>API Key</ENV>:    <STR>YOUR_API_KEY</STR></> },
          { n: '09', el: <><ENV>Model ID</ENV>:   <STR>claude-sonnet-4-5</STR></> },
        ],
      };
    case 'code':
    default:
      return {
        filename: 'example.js',
        lines: [
          { n: '01', el: <><KW>import</KW> <VAR>OpenAI</VAR> <KW>from</KW> <STR>'openai'</STR>;</> },
          { n: '02', el: <></> },
          { n: '03', el: <><KW>const</KW> <VAR>client</VAR> = <KW>new</KW> <FN>OpenAI</FN>({'{'}</> },
          { n: '04', el: <>&nbsp;&nbsp;<ENV>baseURL</ENV>: <STR>'{base}/v1'</STR>,</> },
          { n: '05', el: <>&nbsp;&nbsp;<ENV>apiKey</ENV>: <STR>'YOUR_API_KEY'</STR>,</> },
          { n: '06', el: <>{'}'})</> },
          { n: '07', el: <></> },
          { n: '08', el: <><KW>const</KW> <VAR>res</VAR> = <KW>await</KW> client.chat.completions.<FN>create</FN>({'{'}</> },
          { n: '09', el: <>&nbsp;&nbsp;<ENV>model</ENV>: <STR>'gpt-4o'</STR>,</> },
          { n: '10', el: <>&nbsp;&nbsp;<ENV>messages</ENV>: [{'{'} <ENV>role</ENV>: <STR>'user'</STR>, <ENV>content</ENV>: <STR>'Hello!'</STR> {'}'}],</> },
          { n: '11', el: <>{'}'});</> },
        ],
      };
  }
};

const TutorialPanel = ({ serverAddress, systemName, t }) => {
  const [activeTab, setActiveTab] = React.useState('claude');
  const [animKey, setAnimKey] = React.useState(0);

  const handleTab = (id) => {
    if (id === activeTab) return;
    setActiveTab(id);
    setAnimKey((k) => k + 1);
  };

  const tutorial = getTutorial(activeTab, serverAddress, t);

  return (
    <div className='relative z-10 w-full max-w-4xl mx-auto px-5 pb-20 md:pb-28'>
      <style>{`
        @keyframes code-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .code-line-anim {
          animation: code-fade-in 0.35s ease both;
        }
        .tutorial-tab {
          position: relative;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          border: none;
          outline: none;
          background: transparent;
          white-space: nowrap;
        }
        .tutorial-tab.active {
          background: var(--accent-gradient);
          color: #fff;
          box-shadow: 0 2px 12px rgba(0,114,255,0.25);
        }
        .tutorial-tab:not(.active) {
          color: var(--text-muted);
        }
        .tutorial-tab:not(.active):hover {
          color: var(--text-primary);
          background: var(--surface-hover);
        }
      `}</style>

      {/* Tabs */}
      <div
        className='flex items-center gap-1 mb-3 p-1.5 overflow-x-auto'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tutorial-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => handleTab(tab.id)}
          >
            <span
              className='mr-1.5'
              style={{
                fontSize: 11,
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'middle',
              }}
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Window */}
      <div
        style={{
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Titlebar */}
        <div
          className='flex items-center gap-2 px-4 py-3'
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className='w-3 h-3 rounded-full' style={{ background: '#ff5f57' }} />
          <div className='w-3 h-3 rounded-full' style={{ background: '#febc2e' }} />
          <div className='w-3 h-3 rounded-full' style={{ background: '#28c840' }} />
          <span
            className='ml-3 text-xs tracking-widest uppercase'
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)' }}
          >
            {tutorial.filename}
          </span>
        </div>

        {/* Lines */}
        <div className='p-5 md:p-7' style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: '1.9' }}>
          {tutorial.lines.map((row, i) => (
            <div
              key={`${animKey}-${i}`}
              className='code-line-anim flex gap-4'
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span style={{ color: 'rgba(255,255,255,0.18)', minWidth: 22, userSelect: 'none', textAlign: 'right' }}>
                {row.n}
              </span>
              <span style={{ color: '#e6edf3' }}>{row.el}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ value, label }) => (
  <div className='text-center'>
    <div
      className='text-3xl md:text-4xl font-bold mb-1'
      style={{
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: 'var(--font-serif)',
      }}
    >
      {value}
    </div>
    <div className='text-xs uppercase tracking-widest' style={{ color: 'var(--text-muted)' }}>
      {label}
    </div>
  </div>
);

const HomeLanding = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  // Resolve the public server address shown in the tutorial.
  // Priority:
  //   1. Backend-configured server_address (admin option), unless it points
  //      to localhost / 127.0.0.1 (a leftover dev value users complain about).
  //   2. Current browser URL — whatever domain the user is actually viewing.
  // This way the tutorial always reflects the real public endpoint without
  // needing the admin to remember to update Settings → server_address.
  const serverAddress = (() => {
    const fromBackend = statusState?.status?.server_address || '';
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(fromBackend);
    if (fromBackend && !isLocal) return fromBackend;
    return window.location.origin;
  })();
  const endpointItems = API_ENDPOINTS.map((e) => ({ value: e }));
  const [endpointIndex, setEndpointIndex] = useState(0);
  const isChinese = i18n.language.startsWith('zh');
  const systemName = statusState?.status?.system_name || 'AGGRETOKEN';

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  const [copied, setCopied] = useState(false);
  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  useEffect(() => {
    const checkNotice = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') setNoticeVisible(true);
        } catch (e) {
          console.error('获取公告失败:', e);
        }
      }
    };
    checkNotice();
  }, []);

  useEffect(() => { displayHomePageContent(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  return (
    <div
      className='w-full overflow-x-hidden'
      style={{ marginTop: 'calc(-1 * var(--header-height))' }}
    >
      <link
        href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
        rel='stylesheet'
      />
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />

      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full overflow-x-hidden'>

          {/* ===== Hero Section ===== */}
          <section
            className='relative w-full overflow-hidden'
            style={{
              background: 'var(--bg-base)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {/* Subtle grid overlay */}
            <div
              className='absolute inset-0 pointer-events-none'
              style={{
                backgroundImage: 'radial-gradient(var(--border-default) 0.5px, transparent 0.5px)',
                backgroundSize: '32px 32px',
                opacity: 0.5,
              }}
            />
            {/* Glow — positioned so it bleeds behind the fixed header */}
            <div
              className='absolute pointer-events-none'
              style={{
                top: '-60px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 800,
                height: 500,
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                filter: 'blur(100px)',
                opacity: 0.18,
              }}
            />

            <div className='relative z-10 flex flex-col items-center justify-center text-center px-5 pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-44 lg:pb-32 max-w-4xl mx-auto'>
              {/* Badge */}
              <div
                className='inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-medium uppercase tracking-widest'
                style={{
                  borderRadius: 'var(--radius-full, 9999px)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  className='inline-block w-2 h-2 rounded-full'
                  style={{ background: 'var(--accent)' }}
                />
                {t('企业级 API 基础设施')}
              </div>

              {/* Heading */}
              <h1
                className={`text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] mb-6 ${isChinese ? 'tracking-wide' : 'tracking-tighter'}`}
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
              >
                <span
                  style={{
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {systemName}
                </span>
                <br />
                {t('优质 API 管理平台')}
              </h1>

              {/* Subtitle */}
              <p
                className='text-base md:text-xl lg:text-2xl font-light mb-8 max-w-2xl'
                style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
              >
                {t('官方一手，为开发者提供')}{' '}
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                  {t('稳定、极速、满血版')}
                </span>{' '}
                {t('的 API 体验。')}
              </p>

              {/* Base URL — code snippet style */}
              <div
                onClick={handleCopyBaseURL}
                className='group flex items-center gap-3 px-5 py-3 mb-10 cursor-pointer transition-all duration-200'
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  maxWidth: '480px',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 600,
                    userSelect: 'none',
                  }}
                >
                  $
                </span>
                <span
                  className='flex-1 text-left truncate'
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {serverAddress}
                  <span style={{ color: 'var(--text-muted)', transition: 'opacity 200ms' }}>
                    {endpointItems[endpointIndex]?.value}
                  </span>
                </span>
                <span
                  style={{
                    color: copied ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    transition: 'color 200ms',
                    userSelect: 'none',
                  }}
                >
                  {copied ? t('已复制') : t('复制')}
                </span>
              </div>

              {/* CTAs */}
              <div className='flex flex-row gap-3 justify-center items-center'>
                <Link to='/console'>
                  <Button
                    theme='solid'
                    type='primary'
                    size={isMobile ? 'default' : 'large'}
                    icon={<IconPlay />}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      padding: '0 28px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {t('立即开始')}
                  </Button>
                </Link>
                {isDemoSiteMode && statusState?.status?.version ? (
                  <Button
                    size={isMobile ? 'default' : 'large'}
                    icon={<IconGithubLogo />}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      padding: '0 20px',
                      background: 'var(--surface-active)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-default)',
                    }}
                    onClick={() => window.open('https://github.com/QuantumNous/aggre-api', '_blank')}
                  >
                    {statusState.status.version}
                  </Button>
                ) : (
                  <Link to='/docs'>
                    <Button
                      size={isMobile ? 'default' : 'large'}
                      icon={<IconFile />}
                      style={{
                        borderRadius: 'var(--radius-md)',
                        padding: '0 20px',
                        background: 'var(--surface-active)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      {t('查看文档')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Tutorial Tabs Panel */}
            <TutorialPanel serverAddress={serverAddress} systemName={systemName} t={t} />
          </section>

          {/* ===== Scrolling Provider Icons ===== */}
          <section
            className='py-16 md:py-24'
            style={{
              background: 'var(--bg-base)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div className='max-w-screen-xl mx-auto px-5'>
              <p
                className='text-xs uppercase tracking-widest mb-8 md:mb-10 text-center'
                style={{ color: 'var(--text-muted)', letterSpacing: '0.15em' }}
              >
                {t('支持众多的大模型供应商')}
              </p>
              <ScrollingIcons isMobile={isMobile} />
            </div>
          </section>

          {/* ===== Features Bento Grid ===== */}
          <section className='py-20 md:py-32' style={{ background: 'var(--bg-base)' }}>
            <div className='max-w-screen-xl mx-auto px-5'>
              <div className='flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 gap-6'>
                <div className='max-w-2xl'>
                  <h2
                    className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
                  >
                    {t('核心优势：为性能而生')}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    {t('为什么选择我们？')}
                  </p>
                </div>
                <div
                  className='text-xs font-semibold uppercase tracking-widest hidden md:block'
                  style={{ color: 'var(--accent)' }}
                >
                  {t('功能架构')}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                <FeatureCard
                  wide
                  icon='shield_with_heart'
                  title={t('卓越稳定性')}
                  desc={t('企业级 SLA 保证，99.9% 全年在线。多重负载均衡与实时熔断机制，确保您的业务永不断线。')}
                />
                <FeatureCard
                  icon='bolt'
                  title={t('极速响应')}
                  desc={t('全球边缘节点并发，毫秒级延迟，感受如丝般顺滑的 API 调用体验。')}
                />
                <FeatureCard
                  icon='rocket_launch'
                  title={t('满血版体验')}
                  desc={t('提供最完整、无限制的 API 功能，打破封锁与限制，释放模型全部潜能。')}
                />
                <FeatureCard
                  wide
                  accent
                  icon='support_agent'
                  title={t('7x24 售后保障')}
                  desc={t('顶级技术团队实时待命，响应迅速。无论是接入调试还是高并发优化，我们都在您身后。')}
                />
              </div>
            </div>
          </section>

          {/* ===== CTA Section ===== */}
          <section
            className='py-20 md:py-32 relative overflow-hidden'
            style={{ background: 'var(--bg-base)' }}
          >
            <div
              className='absolute pointer-events-none'
              style={{
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 1000,
                height: 400,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                filter: 'blur(150px)',
                opacity: 0.3,
              }}
            />
            <div className='max-w-3xl mx-auto px-5 text-center relative z-10'>
              <h2
                className='text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight'
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
              >
                {t('加入')}{' '}
                <span
                  style={{
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {systemName}
                </span>
                <br />
                <span
                  style={{
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {t('真货不缩水，体验极致')}
                </span>
              </h2>
              <p
                className='text-base md:text-xl mb-10 max-w-2xl mx-auto'
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('现在注册，开启您的下一代 AI 业务架构。')}
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Link to='/register'>
                  <Button
                    theme='solid'
                    type='primary'
                    size='large'
                    style={{
                      borderRadius: 'var(--radius-md)',
                      padding: '0 36px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      fontWeight: 600,
                      height: 48,
                    }}
                  >
                    {t('开始免费试用')}
                  </Button>
                </Link>
                <Link to='/docs'>
                  <Button
                    size='large'
                    style={{
                      borderRadius: 'var(--radius-md)',
                      padding: '0 36px',
                      background: 'var(--surface)',
                      color: 'var(--accent)',
                      border: '1px solid var(--border-default)',
                      fontWeight: 600,
                      height: 48,
                    }}
                  >
                    {t('查看文档')}
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* ===== Footer ===== */}
          <footer
            className='py-8 px-5'
            style={{
              background: 'var(--surface)',
              borderTop: '1px solid var(--border-subtle)',
              marginBottom: 0,
            }}
          >
            <div className='flex flex-col md:flex-row justify-between items-center gap-6 max-w-screen-xl mx-auto'>
              <div className='flex flex-col items-center md:items-start gap-2'>
                <div
                  className='text-lg font-bold'
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
                >
                  {systemName}
                </div>
                <p className='text-sm' style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                  © {new Date().getFullYear()} {systemName}.
                </p>
              </div>
              <div className='flex gap-6'>
                {[
                  { label: t('隐私政策'), to: '/privacy-policy' },
                  { label: t('服务条款'), to: '/terms-of-service' },
                  { label: t('安全'), to: '/security' },
                  { label: t('关于'), to: '/about' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className='text-sm transition-colors duration-200'
                    style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                    onMouseEnter={(e) => { e.target.style.color = 'var(--accent)'; e.target.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.opacity = '0.5'; }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe src={homePageContent} className='w-full h-screen border-none' />
          ) : (
            <div className='mt-[60px]' dangerouslySetInnerHTML={{ __html: homePageContent }} />
          )}
        </div>
      )}
    </div>
  );
};

export default HomeLanding;
