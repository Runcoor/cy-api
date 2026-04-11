import React from 'react';
import { useTranslation } from 'react-i18next';
import { History, Sparkles, Wrench, Zap, Shield } from 'lucide-react';

const tagStyles = {
  new: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', icon: Sparkles },
  improved: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', icon: Zap },
  fixed: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: Wrench },
  security: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', icon: Shield },
};

const Tag = ({ type, t }) => {
  const s = tagStyles[type] || tagStyles.new;
  const Icon = s.icon;
  const labels = { new: t('新功能'), improved: t('优化'), fixed: t('修复'), security: t('安全') };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full, 9999px)',
        background: s.bg,
        color: s.color,
      }}
    >
      <Icon size={10} />
      {labels[type] || type}
    </span>
  );
};

const CHANGELOG = [
  {
    version: 'v1.2.0',
    date: '2026-04-10',
    items: [
      { type: 'new', text: 'API Key 余额查询工具 — 支持 OpenAI、Claude、DeepSeek 等 10+ 平台' },
      { type: 'new', text: 'Prompt Caching 节省计算器 — 对比缓存与标准价格差异' },
      { type: 'new', text: 'Token 计算器升级至 tiktoken WASM 精确计算' },
      { type: 'new', text: '首页 FAQ 手风琴模块' },
      { type: 'improved', text: '首页 Hero 区 API 地址展示改为代码片段风格' },
      { type: 'improved', text: 'SEO 优化 — 添加 Open Graph 和 Twitter Card 元标签' },
    ],
  },
  {
    version: 'v1.1.0',
    date: '2026-04-08',
    items: [
      { type: 'new', text: '模型定价页 — 全宽编辑布局，内联筛选' },
      { type: 'improved', text: '模型卡片重新设计 — 双列网格大卡布局' },
      { type: 'fixed', text: '关于页面底部间距修复' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-04-01',
    items: [
      { type: 'new', text: '项目发布 — 自定义 UI 界面' },
      { type: 'new', text: '支持 40+ AI 模型聚合代理' },
      { type: 'new', text: '完整的用户管理、计费、限流系统' },
      { type: 'security', text: '服务条款、隐私政策、安全声明页面' },
    ],
  },
];

const ChangelogPage = () => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: 'calc(100vh - var(--header-height))',
        background: 'var(--bg-base)',
        padding: '32px 24px',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
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
              <History size={18} color='#fff' />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {t('更新日志')}
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {t('了解我们的最新功能、改进和修复。')}
          </p>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: 15,
              top: 8,
              bottom: 8,
              width: 1,
              background: 'var(--border-default)',
            }}
          />

          {CHANGELOG.map((release, rIdx) => (
            <div key={release.version} style={{ position: 'relative', paddingLeft: 44, paddingBottom: rIdx < CHANGELOG.length - 1 ? 40 : 0 }}>
              {/* Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: 9,
                  top: 6,
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  background: rIdx === 0 ? 'var(--accent-gradient)' : 'var(--surface)',
                  border: rIdx === 0 ? 'none' : '2px solid var(--border-default)',
                  boxShadow: rIdx === 0 ? '0 0 0 4px rgba(var(--accent-rgb, 0,114,255), 0.15)' : 'none',
                }}
              />

              {/* Version header */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {release.version}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{release.date}</span>
              </div>

              {/* Items */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {release.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderBottom: iIdx < release.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    <Tag type={item.type} t={t} />
                    <span>{t(item.text)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogPage;
