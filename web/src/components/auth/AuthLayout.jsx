import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemName } from '../../helpers';

// Generate random streamline paths for variety
const generateStreams = (count) => {
  const streams = [];
  for (let i = 0; i < count; i++) {
    const y1 = 50 + Math.random() * 700;
    const y2 = 50 + Math.random() * 700;
    const y3 = 50 + Math.random() * 700;
    const y4 = 50 + Math.random() * 700;
    const cx1 = 150 + Math.random() * 200;
    const cx2 = 350 + Math.random() * 200;
    const cx3 = 600 + Math.random() * 200;
    const cx4 = 850 + Math.random() * 200;
    const d = `M-100,${y1} C${cx1},${y2} ${cx2},${y3} ${cx3},${y4} S${cx4},${y1} 1100,${y2}`;
    const gradientIdx = (i % 3) + 1;
    const width = 0.8 + Math.random() * 2;
    const duration = 6 + Math.random() * 12;
    const delay = Math.random() * 10;
    streams.push({ d, gradientIdx, width, duration, delay, key: i });
  }
  return streams;
};

const AuthLayout = ({ children }) => {
  const { t } = useTranslation();
  const systemName = getSystemName();

  const streams = useMemo(() => generateStreams(12), []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Left: Visual Hero Panel — wider 2/3 */}
      <div
        className="hidden lg:flex"
        style={{
          width: '66.67%',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #06080f 0%, #0a1628 35%, #0f1d30 60%, #0a0e1a 100%)',
        }}
      >
        {/* SVG streamlines — 12 random lines */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }}
          viewBox="0 0 1000 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="s1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0072ff" stopOpacity="0" />
              <stop offset="40%" stopColor="#00c6ff" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#00c6ff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0072ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="s2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
              <stop offset="40%" stopColor="#a78bfa" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#a78bfa" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="s3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <filter id="gl">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {streams.map((s) => (
            <path
              key={s.key}
              d={s.d}
              fill="none"
              stroke={`url(#s${s.gradientIdx})`}
              strokeWidth={s.width}
              filter="url(#gl)"
              style={{
                strokeDasharray: '300 1700',
                animation: `authStream ${s.duration}s ease-in-out infinite ${s.delay}s`,
              }}
            />
          ))}
        </svg>

        {/* Subtle radial glow in center */}
        <div
          style={{
            position: 'absolute',
            top: '30%', left: '40%',
            width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,114,255,0.06) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Bottom gradient overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(6,8,15,0.9) 0%, rgba(6,8,15,0.3) 40%, transparent 70%)',
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '72px', maxWidth: 640 }}>
          <div style={{ marginBottom: 40 }}>
            <span
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 11,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {t('官方直连 · 模型保真')}
            </span>
          </div>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 20,
              fontFamily: 'var(--font-serif)',
            }}
          >
            {t('一手模型')}{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #0072ff, #00c6ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >{t('原生直连')}</span>
            <br />
            {t('毫秒响应。')}
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 15,
              lineHeight: 1.8,
              maxWidth: 440,
            }}
          >
            {t('40+ 官方模型一手接入，零中间商。每一次请求都经过原始 API 验证，确保模型保真、响应极速、价格透明。')}
          </p>

          {/* Bottom feature tags */}
          <div style={{ marginTop: 56, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ height: 1, width: 32, background: 'rgba(255,255,255,0.15)' }} />
            {[t('智能调度'), t('99.9% 稳定'), t('一键接入'), t('价格透明')].map((tag, i) => (
              <span
                key={i}
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form Panel — narrower 1/3 */}
      <div
        className="w-full lg:w-1/3"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 28px',
          background: 'var(--bg-base)',
          minHeight: '100vh',
          overflow: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Brand anchor — uses favicon.svg */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/favicon.svg"
                alt="Logo"
                style={{ height: 32, width: 32, objectFit: 'contain' }}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-serif)',
                }}
              >
                {systemName}
              </span>
            </div>
          </div>

          <div className="auth-form-area">
            {children}
          </div>

          {/* Mobile slogan */}
          <div className="mt-12 lg:hidden text-center" style={{ opacity: 0.3 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {t('智能调度')} · {t('一键接入')} · {t('价格透明')}
            </span>
          </div>
        </div>
      </div>

      {/* Animation keyframes + form input overrides for Luminous style */}
      <style>{`
        @keyframes authStream {
          0% { stroke-dashoffset: 2000; opacity: 0; }
          8% { opacity: 1; }
          88% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        /* Override Semi UI Form.Input inside auth pages */
        .auth-form-area .semi-input-wrapper {
          height: 48px !important;
          border-radius: 12px !important;
          border: 1px solid var(--border-default, #e5e7eb) !important;
          background: #fff !important;
          padding: 0 16px !important;
          transition: all 300ms ease !important;
          box-shadow: none !important;
        }
        .dark .auth-form-area .semi-input-wrapper {
          background: var(--surface, #1e1e1e) !important;
        }
        .auth-form-area .semi-input-wrapper:focus-within {
          border-color: transparent !important;
          background: #fff !important;
          background-image: linear-gradient(#fff, #fff), var(--accent-gradient, linear-gradient(135deg, #0072ff, #00c6ff)) !important;
          background-origin: border-box !important;
          background-clip: padding-box, border-box !important;
          border: 1px solid transparent !important;
        }
        .dark .auth-form-area .semi-input-wrapper:focus-within {
          background-image: linear-gradient(var(--surface, #1e1e1e), var(--surface, #1e1e1e)), var(--accent-gradient, linear-gradient(135deg, #0072ff, #00c6ff)) !important;
        }
        .auth-form-area .semi-input-wrapper .semi-input-prefix {
          display: none !important;
        }
        .auth-form-area .semi-input-wrapper .semi-input {
          font-size: 14px !important;
          height: 100% !important;
        }
        .auth-form-area .semi-input-wrapper .semi-input::placeholder {
          color: var(--text-muted) !important;
          opacity: 0.5 !important;
        }
        .auth-form-area .semi-form-field-label-text {
          font-size: 11px !important;
          font-weight: 600 !important;
          letter-spacing: 0.06em !important;
          text-transform: uppercase !important;
          color: var(--text-muted) !important;
          padding-left: 2px !important;
        }
        .auth-form-area .semi-form-field {
          margin-bottom: 16px !important;
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
