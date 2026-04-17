/*
Copyright (C) 2025 QuantumNous — AGPL-3.0

Luminous Editorial Dashboard. Reuses existing hooks and sub-components
for data, charts, API info, announcements, FAQ, and uptime panels.
*/

import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRelativeTime, renderQuota, copy } from '../../helpers';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { useTranslation } from 'react-i18next';

import ChartsPanel from './ChartsPanel';
import ApiInfoPanel from './ApiInfoPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import FaqPanel from './FaqPanel';
import UptimePanel from './UptimePanel';
import SearchModal from './modals/SearchModal';

import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { useDashboardStats } from '../../hooks/dashboard/useDashboardStats';
import { useDashboardCharts } from '../../hooks/dashboard/useDashboardCharts';

import {
  CHART_CONFIG,
  CARD_PROPS,
  FLEX_CENTER_GAP2,
  ILLUSTRATION_SIZE,
  ANNOUNCEMENT_LEGEND_DATA,
  UPTIME_STATUS_MAP,
} from '../../constants/dashboard.constants';
import {
  getTrendSpec,
  handleCopyUrl,
  handleSpeedTest,
  getUptimeStatusColor,
  getUptimeStatusText,
  renderMonitorList,
} from '../../helpers/dashboard';

import {
  RefreshCw,
  Search,
  Zap,
  TrendingUp,
  Activity,
  Clock,
  DollarSign,
  Hash,
  Gauge,
  BarChart3,
  Copy as CopyIcon,
  Check,
  Key,
  ChevronRight,
  FileText,
  Plus,
  Eye,
  EyeOff,
  Shield,
  ArrowUpRight,
  Cpu,
  GitBranch,
} from 'lucide-react';

// ── Shared styles ───────────────────────────────────────────────────────────
const glassPanel = {
  background: 'var(--surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
};

// ── Main Dashboard ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState, statusDispatch] = useContext(StatusContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const dashboardData = useDashboardData(userState, userDispatch, statusState);
  const dashboardCharts = useDashboardCharts(
    dashboardData.dataExportDefaultTime,
    dashboardData.setTrendData,
    dashboardData.setConsumeQuota,
    dashboardData.setTimes,
    dashboardData.setConsumeTokens,
    dashboardData.setPieData,
    dashboardData.setLineData,
    dashboardData.setModelColors,
    dashboardData.t,
  );
  const { groupedStatsData } = useDashboardStats(
    userState,
    dashboardData.consumeQuota,
    dashboardData.consumeTokens,
    dashboardData.times,
    dashboardData.trendData,
    dashboardData.performanceMetrics,
    dashboardData.navigate,
    dashboardData.t,
  );

  const initChart = async () => {
    await dashboardData.loadQuotaData().then((data) => {
      if (data && data.length > 0) dashboardCharts.updateChartData(data);
    });
    await dashboardData.loadUptimeData();
  };

  const handleRefresh = async () => {
    const data = await dashboardData.refresh();
    if (data && data.length > 0) dashboardCharts.updateChartData(data);
  };

  const handleSearchConfirm = async () => {
    await dashboardData.handleSearchConfirm(dashboardCharts.updateChartData);
  };

  useEffect(() => {
    initChart();
  }, []);

  // ── Copy state for endpoint ──
  const [copied, setCopied] = useState(false);
  const handleCopyEndpoint = async (text) => {
    const ok = await copy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // ── Secret mask state ──
  const [secretRevealed, setSecretRevealed] = useState(false);

  // ── Data ──
  const apiInfoData = statusState?.status?.api_info || [];
  const serverAddress = statusState?.status?.server_address || window.location.origin;
  const announcementData = (statusState?.status?.announcements || []).map((item) => {
    const pubDate = item?.publishDate ? new Date(item.publishDate) : null;
    const absoluteTime =
      pubDate && !isNaN(pubDate.getTime())
        ? `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, '0')}-${String(pubDate.getDate()).padStart(2, '0')} ${String(pubDate.getHours()).padStart(2, '0')}:${String(pubDate.getMinutes()).padStart(2, '0')}`
        : item?.publishDate || '';
    return { ...item, time: absoluteTime, relative: getRelativeTime(item.publishDate) };
  });
  const faqData = statusState?.status?.faq || [];
  const uptimeLegendData = Object.entries(UPTIME_STATUS_MAP).map(([status, info]) => ({
    status: Number(status),
    color: info.color,
    label: dashboardData.t(info.label),
  }));

  // Flatten stats for display
  const allStats = groupedStatsData.flatMap((g) => g.items);
  const balance = allStats.find((s) => s.title === t('当前余额'));
  const usedQuota = allStats.find((s) => s.title === t('历史消耗'));
  const requests = allStats.find((s) => s.title === t('请求次数'));
  const tokens = allStats.find((s) => s.title === t('统计Tokens'));
  const rpm = allStats.find((s) => s.title === t('平均RPM'));
  const tpm = allStats.find((s) => s.title === t('平均TPM'));
  const statQuota = allStats.find((s) => s.title === t('统计额度'));
  const statTimes = allStats.find((s) => s.title === t('统计次数'));

  const userName = userState?.user?.username || '';
  const systemName = statusState?.status?.system_name || 'Intelligence Systems';
  const endpointUrl = serverAddress + '/v1';

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 0 48px' }}>
      {/* Search Modal */}
      <SearchModal
        searchModalVisible={dashboardData.searchModalVisible}
        handleSearchConfirm={handleSearchConfirm}
        handleCloseModal={dashboardData.handleCloseModal}
        isMobile={dashboardData.isMobile}
        isAdminUser={dashboardData.isAdminUser}
        inputs={dashboardData.inputs}
        dataExportDefaultTime={dashboardData.dataExportDefaultTime}
        timeOptions={dashboardData.timeOptions}
        handleInputChange={dashboardData.handleInputChange}
        t={dashboardData.t}
      />

      {/* ═══ Section 1: Header Greeting (no card) ═══ */}
      <div className='mb-6 px-1'>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {systemName} {t('仪表盘')}
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-serif)',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.2,
            opacity: dashboardData.greetingVisible ? 1 : 0,
            transition: 'opacity 600ms ease-out',
          }}
        >
          {dashboardData.getGreeting.replace(/^👋/, '')}
          {userName && (
            <>
              {', '}
              <span
                style={{
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {userName}
              </span>
            </>
          )}
        </h1>
      </div>

      {/* ═══ Section 2: Account Balance Hero + API Credentials ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Left: Balance Hero Card (8 cols) */}
        <div
          className="lg:col-span-8"
          style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-gradient)',
            color: '#fff',
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -30,
              left: '40%',
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }}
          />

          <div className="p-6 md:p-7" style={{ position: 'relative', zIndex: 1 }}>
            {/* Top row: label + trend badges */}
            <div className="flex items-center justify-between mb-2">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                }}
              >
                {t('可用余额')}
              </div>
              <div className="flex gap-2">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full, 9999px)',
                    background: 'rgba(255,255,255,0.15)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <TrendingUp size={11} />
                  {t('活跃')}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full, 9999px)',
                    background: 'rgba(255,255,255,0.15)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <Zap size={11} />
                  {t('系统运行中')}
                </span>
              </div>
            </div>

            {/* Huge balance number */}
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                margin: '8px 0 24px',
              }}
            >
              {balance?.value || '$0.00'}
            </div>

            {/* Bottom sub-stats row */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 20 }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    opacity: 0.6,
                    marginBottom: 4,
                  }}
                >
                  {t('历史消耗')}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {usedQuota?.value || '$0.00'}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    opacity: 0.6,
                    marginBottom: 4,
                  }}
                >
                  {t('请求次数')}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {requests?.value?.toLocaleString?.() || requests?.value || '0'}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    opacity: 0.6,
                    marginBottom: 4,
                  }}
                >
                  {t('统计额度')}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {statQuota?.value || '$0.00'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: API Credentials sidebar (4 cols) */}
        <div
          className="lg:col-span-4"
          style={{
            ...glassPanel,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="p-6" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
                margin: '0 0 16px 0',
              }}
            >
              {t('API 凭证')}
            </h3>

            {/* Endpoint URL */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {t('接口地址')}
              </div>
              <div
                onClick={() => handleCopyEndpoint(endpointUrl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  {endpointUrl}
                </span>
                {copied ? (
                  <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                ) : (
                  <CopyIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                )}
              </div>
            </div>

            {/* Security notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '12px 14px',
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                marginTop: 'auto',
              }}
            >
              <Shield
                size={14}
                style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}
              />
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {t('您的 API 环境已隔离并安全保护。')}{' '}
                <span
                  onClick={() => navigate('/console/token')}
                  style={{
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {t('管理令牌')}
                  <ChevronRight
                    size={11}
                    style={{ display: 'inline', verticalAlign: 'middle' }}
                  />
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 3: Announcements (4) + Charts (8), same row ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6" style={{ minHeight: 380 }}>
        {/* Left: Announcements (4 cols) */}
        <div className="lg:col-span-4" style={{ display: 'flex' }}>
          <AnnouncementsPanel
            announcementData={announcementData}
            announcementLegendData={ANNOUNCEMENT_LEGEND_DATA.map((item) => ({
              ...item,
              label: dashboardData.t(item.label),
            }))}
            CARD_PROPS={CARD_PROPS}
            ILLUSTRATION_SIZE={ILLUSTRATION_SIZE}
            t={dashboardData.t}
            fullWidth
          />
        </div>
        {/* Right: Charts (8 cols) */}
        <div className="lg:col-span-8" style={{ display: 'flex' }}>
          <ChartsPanel
            activeChartTab={dashboardData.activeChartTab}
            setActiveChartTab={dashboardData.setActiveChartTab}
            spec_line={dashboardCharts.spec_line}
            spec_model_line={dashboardCharts.spec_model_line}
            spec_pie={dashboardCharts.spec_pie}
            spec_rank_bar={dashboardCharts.spec_rank_bar}
            CARD_PROPS={CARD_PROPS}
            CHART_CONFIG={CHART_CONFIG}
            FLEX_CENTER_GAP2={FLEX_CENTER_GAP2}
            hasApiInfoPanel={false}
            t={dashboardData.t}
            onRefresh={handleRefresh}
            onFilter={dashboardData.showSearchModal}
            loading={dashboardData.loading}
          />
        </div>
      </section>

      {/* ═══ Section 4: Resource Efficiency + Performance Benchmarks ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Left: Resource Efficiency */}
        <div style={{ ...glassPanel, padding: 0 }}>
          <div className="p-6 md:p-8">
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {t('资源效率')}
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
                margin: '0 0 20px 0',
              }}
            >
              {t('请求与吞吐量')}
            </h3>

            {/* RPM row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(var(--accent-rgb, 0,114,255), 0.08), transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Activity size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    RPM
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {t('每分钟请求数')}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {rpm?.value || '0'}
              </div>
            </div>

            {/* TPM row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.08), transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Gauge size={16} style={{ color: '#FF9500' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    TPM
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {t('每分钟令牌数')}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {tpm?.value || '0'}
              </div>
            </div>

            {/* Tokens + Stat times */}
            <div className="grid grid-cols-2 gap-3" style={{ marginTop: 6 }}>
              <div
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {t('统计Tokens')}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {tokens?.value?.toLocaleString?.() || tokens?.value || '0'}
                </div>
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {t('统计次数')}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {statTimes?.value?.toLocaleString?.() || statTimes?.value || '0'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Performance Benchmarks */}
        <div style={{ ...glassPanel, padding: 0 }}>
          <div className="p-6 md:p-8">
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {t('性能基准')}
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
                margin: '0 0 20px 0',
              }}
            >
              {t('性能指标')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Average RPM box */}
              <div
                style={{
                  padding: '28px 20px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(var(--accent-rgb, 0,114,255), 0.1), transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Activity size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  {dashboardData.performanceMetrics.avgRPM}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: 8,
                  }}
                >
                  {t('平均RPM')}
                </div>
              </div>

              {/* Average TPM box */}
              <div
                style={{
                  padding: '28px 20px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.1), transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Gauge size={20} style={{ color: '#FF9500' }} />
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  {dashboardData.performanceMetrics.avgTPM}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: 8,
                  }}
                >
                  {t('平均TPM')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 5: FAQ, Uptime ═══ */}
      {dashboardData.hasInfoPanels && (
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {dashboardData.faqEnabled && (
              <FaqPanel
                faqData={faqData}
                CARD_PROPS={CARD_PROPS}
                FLEX_CENTER_GAP2={FLEX_CENTER_GAP2}
                ILLUSTRATION_SIZE={ILLUSTRATION_SIZE}
                t={dashboardData.t}
              />
            )}
            {dashboardData.uptimeEnabled && (
              <UptimePanel
                uptimeData={dashboardData.uptimeData}
                uptimeLoading={dashboardData.uptimeLoading}
                activeUptimeTab={dashboardData.activeUptimeTab}
                setActiveUptimeTab={dashboardData.setActiveUptimeTab}
                loadUptimeData={dashboardData.loadUptimeData}
                uptimeLegendData={uptimeLegendData}
                renderMonitorList={(monitors) =>
                  renderMonitorList(
                    monitors,
                    (status) => getUptimeStatusColor(status, UPTIME_STATUS_MAP),
                    (status) => getUptimeStatusText(status, UPTIME_STATUS_MAP, dashboardData.t),
                    dashboardData.t,
                  )
                }
                CARD_PROPS={CARD_PROPS}
                ILLUSTRATION_SIZE={ILLUSTRATION_SIZE}
                t={dashboardData.t}
              />
            )}
          </div>
        </section>
      )}

      {/* ═══ Section 6: Editorial Feature Showcase ═══ */}
      <section
        className='grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center'
        style={{ paddingTop: 16 }}
      >
        {/* Left: Visual card with overlay */}
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            minHeight: 420,
            background: 'var(--accent-gradient)',
          }}
          className='group'
        >
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
              zIndex: 1,
            }}
          />
          {/* Decorative background elements */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.06,
              zIndex: 0,
            }}
          >
            <Cpu size={280} strokeWidth={0.5} style={{ color: '#fff' }} />
          </div>
          {/* Content */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '32px',
              zIndex: 2,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 12,
              }}
            >
              {t('系统架构')}
            </div>
            <h3
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'var(--font-serif)',
                margin: '0 0 12px 0',
                lineHeight: 1.3,
              }}
            >
              {t('多模型智能路由引擎')}
            </h3>
            <p
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 14,
                lineHeight: 1.7,
                maxWidth: 400,
                marginBottom: 20,
              }}
            >
              {t('内置 40+ 模型供应商适配器，自动选择最优渠道。支持故障转移、负载均衡和 Prompt Caching，降低成本的同时保证每一次调用的质量。')}
            </p>
            <button
              onClick={() => navigate('/docs')}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                background: '#fff',
                color: 'var(--text-primary)',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              {t('了解更多')}
            </button>
          </div>
        </div>

        {/* Right: Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {t('无限扩展智能')}<br />
            <span style={{ color: 'var(--text-muted)' }}>{t('无需妥协。')}</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Feature 1 */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Zap size={20} style={{ color: '#fff' }} />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {t('自主优化路由')}
                </h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {t('系统根据查询复杂度和渠道健康状态，自动将请求路由到最优的模型集群，确保最佳性价比。')}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Shield size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {t('安全合规保障')}
                </h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {t('内置请求审计与敏感词过滤，API Key 权限隔离，支持 2FA 和 OAuth 多因素认证，满足企业级安全要求。')}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(139,92,246,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GitBranch size={20} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {t('多格式协议转换')}
                </h4>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {t('一个端点兼容 OpenAI、Claude Messages、Gemini 三大 API 格式，无需为不同模型维护不同的接入代码。')}
                </p>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => navigate('/docs')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {t('查看完整文档')}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Responsive + animation styles ── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
