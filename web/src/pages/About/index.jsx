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

import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Zap, Shield, Workflow, BarChart3 } from 'lucide-react';
import { StatusContext } from '../../context/Status';

const About = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const systemName = statusState?.status?.system_name || 'AGGRETOKEN';
  const currentYear = new Date().getFullYear();

  return (
    <div
      className='w-full overflow-x-hidden'
      style={{
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <style>{`
        .about-gradient-text {
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .about-gradient-bg {
          background: var(--accent-gradient);
        }
        .about-glass {
          background: color-mix(in srgb, var(--surface) 82%, transparent);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        html.dark .about-glass {
          background: color-mix(in srgb, var(--surface) 72%, transparent);
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════
          Hero — The Vision
          ═══════════════════════════════════════════════════════════ */}
      <header
        className='relative flex flex-col items-center justify-center px-6 overflow-hidden'
        style={{ minHeight: 'clamp(560px, 80vh, 820px)' }}
      >
        {/* Background blurs */}
        <div
          aria-hidden
          className='absolute about-gradient-bg rounded-full'
          style={{
            top: '-10%',
            right: '-5%',
            width: 600,
            height: 600,
            filter: 'blur(120px)',
            opacity: 0.1,
          }}
        />
        <div
          aria-hidden
          className='absolute about-gradient-bg rounded-full'
          style={{
            bottom: '-10%',
            left: '-5%',
            width: 400,
            height: 400,
            filter: 'blur(100px)',
            opacity: 0.05,
          }}
        />

        <div className='max-w-5xl w-full text-center z-10'>
          <div
            className='inline-block px-4 py-1.5 mb-8'
            style={{
              borderRadius: 9999,
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            {t('关于我们')}
          </div>

          <h1
            style={{
              fontFamily:
                'Manrope, -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(48px, 8vw, 96px)',
              letterSpacing: '-0.045em',
              lineHeight: 1.05,
              color: 'var(--text-primary)',
              margin: '0 0 32px 0',
            }}
          >
            {t('统一智能')}
            <br />
            <span className='about-gradient-text'>{t('无限可能')}</span>
          </h1>

          <div className='flex justify-center mb-12'>
            <div
              className='about-gradient-bg'
              style={{ height: 4, width: 96, borderRadius: 9999 }}
            />
          </div>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(16px, 2.2vw, 22px)',
              fontWeight: 300,
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              maxWidth: 640,
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            {t(
              '聚合全球 40+ 顶尖 AI 供应商，为企业和开发者提供统一、可靠、极速的 AI API 网关服务。',
            )}
          </p>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          Our Mission
          ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: 'clamp(80px, 12vw, 192px) 0',
          background: 'var(--bg-subtle)',
        }}
      >
        <div
          className='max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start'
        >
          <div className='lg:col-span-4'>
            <h2
              style={{
                fontFamily: 'Manrope, var(--font-sans)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 3.5vw, 40px)',
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {t('我们的使命')}
            </h2>
            <div
              style={{
                marginTop: 16,
                color: 'var(--accent)',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {t('核心驱动力')}
            </div>
          </div>
          <div className='lg:col-span-8'>
            <p
              style={{
                fontFamily: 'Manrope, var(--font-sans)',
                fontWeight: 300,
                fontSize: 'clamp(20px, 2.8vw, 36px)',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              {t('我们相信 AI 不应被供应商锁定或碎片化的 API 所限制，而应是一个')}
              <span
                style={{
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                }}
              >
                {t('开放、统一、可靠')}
              </span>
              {t('的基础设施。我们致力于消除接入壁垒，让每一位开发者都能用')}
              <span
                className='about-gradient-text'
                style={{ fontWeight: 600, fontStyle: 'italic' }}
              >
                {t('一个端点、一把钥匙')}
              </span>
              {t('驾驭全球领先 AI 模型的全部能力。')}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Core Values
          ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: 'clamp(80px, 12vw, 192px) 0',
          background: 'var(--surface)',
        }}
      >
        <div className='max-w-7xl mx-auto px-6 md:px-8'>
          <div className='text-center mb-16 md:mb-24'>
            <h2
              style={{
                fontFamily: 'Manrope, var(--font-sans)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 3.5vw, 40px)',
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                margin: '0 0 16px 0',
              }}
            >
              {t('核心价值观')}
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 14,
                margin: 0,
              }}
            >
              {t('驱动我们每一次技术决策的基石')}
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {[
              {
                key: 'routing',
                Icon: Zap,
                title: t('极速路由'),
                desc: t(
                  '智能负载均衡与毫秒级路由决策，确保每一次 API 调用都以最优路径到达最佳供应商。',
                ),
              },
              {
                key: 'security',
                Icon: Shield,
                title: t('企业安全'),
                desc: t(
                  'AES-256 加密、TLS 1.3 全链路保护、零信任架构，为企业数据筑起坚实屏障。',
                ),
              },
              {
                key: 'aggregate',
                Icon: Workflow,
                title: t('统一聚合'),
                desc: t(
                  '40+ 供应商、数百个模型，一个 API 端点全部覆盖。不再维护多套 SDK 和凭证。',
                ),
              },
              {
                key: 'observe',
                Icon: BarChart3,
                title: t('透明可观测'),
                desc: t(
                  '实时用量面板、细粒度日志、多维度统计。每一分消耗都清晰可查、可审计。',
                ),
              },
            ].map((v) => (
              <div
                key={v.key}
                className='group flex flex-col items-center text-center'
                style={{
                  padding: 'clamp(32px, 4vw, 40px)',
                  background: 'var(--surface)',
                  border: '1px solid transparent',
                  borderRadius: 'var(--radius-lg)',
                  transition:
                    'background-color 220ms, border-color 220ms, box-shadow 220ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow =
                    '0 12px 32px -12px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className='mb-6'
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 9999,
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 220ms',
                  }}
                >
                  <v.Icon size={26} style={{ color: 'var(--accent)' }} strokeWidth={1.8} />
                </div>
                <h3
                  style={{
                    fontFamily: 'Manrope, var(--font-sans)',
                    fontWeight: 700,
                    fontSize: 18,
                    color: 'var(--text-primary)',
                    margin: '0 0 16px 0',
                  }}
                >
                  {v.title}
                </h3>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    color: 'var(--text-secondary)',
                    margin: 0,
                  }}
                >
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Contact / CTA
          ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: 'clamp(64px, 8vw, 128px) 0',
          background: 'var(--bg-subtle)',
          flex: '1 0 auto',
        }}
      >
        <div className='max-w-3xl mx-auto px-6 text-center'>
          <h2
            style={{
              fontFamily: 'Manrope, var(--font-sans)',
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 36px)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: '0 0 16px 0',
            }}
          >
            {t('联系我们')}
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              margin: '0 0 32px 0',
            }}
          >
            {t(
              '无论是技术咨询、商务合作还是产品反馈，我们都期待与您交流。',
            )}
          </p>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto'>
            {[
              { label: t('客户支持'), email: 'support@aggretoken.com' },
              { label: t('商务合作'), email: 'hello@aggretoken.com' },
            ].map((c) => (
              <a
                key={c.email}
                href={`mailto:${c.email}`}
                className='group'
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '20px 24px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                  transition: 'border-color 180ms, box-shadow 180ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow =
                    '0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  {c.label}
                </span>
                <span
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {c.email}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Footer
          ═══════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '32px 0',
          flexShrink: 0,
        }}
      >
        <div className='max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6'>
          <div
            style={{
              fontFamily: 'Manrope, var(--font-sans)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontSize: 15,
            }}
          >
            {systemName}
          </div>
          <div className='flex flex-wrap justify-center gap-6 md:gap-8'>
            {[
              { label: t('隐私政策'), to: '/privacy-policy' },
              { label: t('服务条款'), to: '/terms-of-service' },
              { label: t('安全'), to: '/security' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'color 180ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--text-muted)')
                }
              >
                {item.label}
              </Link>
            ))}
            <a
              href='mailto:support@aggretoken.com'
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 180ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--text-muted)')
              }
            >
              {t('联系支持')}
            </a>
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            © {currentYear} {systemName}. {t('版权所有')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
