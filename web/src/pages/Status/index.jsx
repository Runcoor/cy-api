import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../../helpers';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  up: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  down: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: AlertTriangle },
  maintenance: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: AlertTriangle },
};

const MonitorRow = ({ monitor, t }) => {
  const status = monitor.active !== false ? 'up' : 'down';
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const uptime = monitor.uptime != null ? `${(monitor.uptime * 100).toFixed(2)}%` : '--';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <Icon size={16} style={{ color: cfg.color, flexShrink: 0 }} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {monitor.name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          {uptime}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: cfg.bg,
            color: cfg.color,
          }}
        >
          {status === 'up' ? t('正常') : t('异常')}
        </span>
      </div>
    </div>
  );
};

// Heartbeat bar (last N checks)
const HeartbeatBar = ({ beats = [] }) => {
  const last = beats.slice(-30);
  return (
    <div style={{ display: 'flex', gap: 1.5, alignItems: 'center', height: 20 }}>
      {last.map((b, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: b ? 16 : 10,
            borderRadius: 2,
            background: b ? '#10b981' : '#ef4444',
            opacity: 0.6 + (i / last.length) * 0.4,
            transition: 'height 200ms ease',
          }}
        />
      ))}
    </div>
  );
};

const StatusPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/api/uptime/status');
      const { success, message, data: d } = res.data;
      if (success && d) {
        setData(d);
        setLastUpdated(new Date());
      } else {
        setError(message || t('加载失败'));
      }
    } catch (e) {
      setError(e.message || t('加载失败'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  // Parse uptime data — handle both array and grouped formats
  const monitors = Array.isArray(data) ? data : [];
  const allUp = monitors.length > 0 && monitors.every((m) => m.active !== false);
  const overallCfg = allUp ? STATUS_CONFIG.up : STATUS_CONFIG.down;
  const OverallIcon = monitors.length === 0 ? Activity : overallCfg.icon;

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
        <div style={{ marginBottom: 32 }}>
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
              <Activity size={18} color='#fff' />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {t('服务状态')}
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
            {t('实时监控所有服务的运行状态。')}
          </p>
        </div>

        {/* Overall status banner */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: loading ? 'var(--surface-hover)' : overallCfg.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <OverallIcon
                size={20}
                style={{ color: loading ? 'var(--text-muted)' : overallCfg.color }}
              />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {loading
                  ? t('检查中...')
                  : error
                    ? t('无法获取状态')
                    : allUp
                      ? t('所有服务正常运行')
                      : t('部分服务异常')}
              </div>
              {lastUpdated && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {t('最后更新：')}{lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {t('刷新')}
          </button>
        </div>

        {/* Error */}
        {error && !loading && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            <AlertTriangle size={24} style={{ color: 'var(--warning, #f59e0b)', marginBottom: 8 }} />
            <div>{t('暂时无法获取服务状态，请稍后刷新。')}</div>
            <div style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {error}
            </div>
          </div>
        )}

        {/* Monitors list */}
        {!error && monitors.length > 0 && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 16px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span>{t('服务')}</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span>{t('可用率')}</span>
                <span style={{ width: 52, textAlign: 'center' }}>{t('状态')}</span>
              </div>
            </div>
            {monitors.map((m, i) => (
              <MonitorRow key={m.name || i} monitor={m} t={t} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!error && !loading && monitors.length === 0 && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 48,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            <Activity size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>{t('暂无监控数据。管理员可在后台配置 Uptime Kuma 监控。')}</div>
          </div>
        )}

        {/* Spin animation */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default StatusPage;
