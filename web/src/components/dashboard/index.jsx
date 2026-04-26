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

/**
 * Dashboard — designed in Claude Design (handoff bundle "aggre-token",
 * file "Dashboard.html"). Single accent gradient #0072ff → #00c6ff,
 * width-capped 1280px page (no longer full-bleed), 5 horizontal bands:
 *
 *   1. Topbar           greeting + status pills + refresh
 *   2. Hero row         Balance card (gradient) + API credentials card
 *   3. KPI strip        4 tiles with sparklines
 *   4. Main row         Charts panel + Announcements panel  (existing components)
 *   5. Perf row         Resource list + Twin gauges
 *   6. Info row         FAQ + Uptime (only if enabled — existing components)
 *   7. Promo row        Gradient promo card + Feature list
 *
 * All data hooks (useDashboardData, useDashboardCharts, useDashboardStats),
 * sub-panels (ChartsPanel, AnnouncementsPanel, FaqPanel, UptimePanel,
 * SearchModal) and helpers are reused unchanged.
 */

import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { copy } from '../../helpers';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';

import ChartsPanel from './ChartsPanel';
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
  getUptimeStatusColor,
  getUptimeStatusText,
  renderMonitorList,
} from '../../helpers/dashboard';
import { getRelativeTime } from '../../helpers';

/* ────────── inline icons (match design) ────────── */
const I = {
  Refresh: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='M21 12a9 9 0 1 1-3-6.7L21 8' />
      <path d='M21 3v5h-5' />
    </svg>
  ),
  TrendUp: (p) => (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='m3 17 6-6 4 4 8-8' />
      <path d='M14 7h7v7' />
    </svg>
  ),
  TrendDown: (p) => (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='m3 7 6 6 4-4 8 8' />
      <path d='M14 17h7v-7' />
    </svg>
  ),
  Pulse: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='M3 12h4l3-9 4 18 3-9h4' />
    </svg>
  ),
  Gauge: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <path d='M12 14a2 2 0 0 0 2-2' />
      <path d='M13.4 10.6 19 5' />
      <path d='M5 19a9 9 0 0 1 14-7' />
      <path d='M3 19h18' />
    </svg>
  ),
  Coins: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' {...p}>
      <circle cx='9' cy='9' r='6' />
      <path d='M16.5 6.5A6 6 0 1 1 14 17' />
    </svg>
  ),
  Bolt: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='M13 2 4 14h7l-1 8 9-12h-7l1-8z' />
    </svg>
  ),
  Shield: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' {...p}>
      <path d='M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z' />
    </svg>
  ),
  Branches: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <circle cx='6' cy='6' r='2' />
      <circle cx='6' cy='18' r='2' />
      <circle cx='18' cy='6' r='2' />
      <path d='M8 6h6a4 4 0 0 1 4 4v8' />
      <path d='M6 8v8' />
    </svg>
  ),
  Sparkle: (p) => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' {...p}>
      <path d='M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8' />
    </svg>
  ),
  Key: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <circle cx='8' cy='15' r='4' />
      <path d='m11 12 9-9 2 2-2 2 2 2-3 3-3-3' />
    </svg>
  ),
  Copy: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <rect x='9' y='9' width='12' height='12' rx='2' />
      <path d='M5 15V5a2 2 0 0 1 2-2h10' />
    </svg>
  ),
  Check: (p) => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round' {...p}>
      <path d='m4 12 5 5L20 6' />
    </svg>
  ),
  Lock: (p) => (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' {...p}>
      <rect x='4' y='11' width='16' height='10' rx='2' />
      <path d='M8 11V7a4 4 0 0 1 8 0v4' />
    </svg>
  ),
  Arrow: (p) => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' {...p}>
      <path d='M5 12h14' />
      <path d='m13 6 6 6-6 6' />
    </svg>
  ),
};

/* ────────── tiny chart primitives ────────── */
function Sparkline({ data, color = '#0072ff' }) {
  const W = 80;
  const H = 28;
  if (!Array.isArray(data) || data.length < 2) {
    return <svg className='spark' width={W} height={H} viewBox={`0 0 ${W} ${H}`} />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  return (
    <svg className='spark' width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path
        d={path}
        fill='none'
        stroke={color}
        strokeWidth='1.5'
        strokeLinejoin='round'
        strokeLinecap='round'
      />
    </svg>
  );
}

function Gauge({ value, max }) {
  const r = 36;
  const cx = 45;
  const cy = 45;
  const start = Math.PI;
  const end = 2 * Math.PI;
  const safeMax = max && max > 0 ? max : 1;
  const pct = Math.min(Math.max(value / safeMax, 0), 1);
  const angle = start + (end - start) * pct;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  const large = pct > 0.5 ? 1 : 0;
  const arcBg = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const arcFg = `M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${x} ${y}`;
  return (
    <svg viewBox='0 0 90 60'>
      <defs>
        <linearGradient id='agg-dash-gauge' x1='0' y1='0' x2='1' y2='0'>
          <stop offset='0%' stopColor='#0072ff' />
          <stop offset='100%' stopColor='#00c6ff' />
        </linearGradient>
      </defs>
      <path d={arcBg} fill='none' stroke='#e8edf3' strokeWidth='6' strokeLinecap='round' />
      <path
        d={arcFg}
        fill='none'
        stroke='url(#agg-dash-gauge)'
        strokeWidth='6'
        strokeLinecap='round'
      />
    </svg>
  );
}

/* ────────── KPI tile ────────── */
function KpiTile({ label, value, suffix, subtitle, icon, sparkData, sparkColor }) {
  return (
    <div className='agg-dash-kpi'>
      <div className='kpi-head'>
        <div style={{ minWidth: 0 }}>
          <div className='kpi-label'>{label}</div>
          <div className='kpi-value mono'>
            {value}
            {suffix && <span className='suffix'>{suffix}</span>}
          </div>
        </div>
        <div className='kpi-icon'>{icon}</div>
      </div>
      {subtitle && <div className='kpi-foot'>{subtitle}</div>}
      {sparkData && sparkData.length > 1 && (
        <div className='kpi-spark'>
          <Sparkline data={sparkData} color={sparkColor} />
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════ */
const Dashboard = () => {
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [copied, setCopied] = useState(false);
  const handleCopyEndpoint = async (text) => {
    const ok = await copy(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  /* ── pluck the stats we need ── */
  const allStats = groupedStatsData.flatMap((g) => g.items);
  const find = (title) => allStats.find((s) => s.title === t(title));
  const balance = find('当前余额');
  const usedQuota = find('历史消耗');
  const requests = find('请求次数');
  const tokens = find('统计Tokens');
  const rpm = find('平均RPM');
  const tpm = find('平均TPM');
  const statTimes = find('统计次数');

  const userName = userState?.user?.username || '';
  const systemName = statusState?.status?.system_name || 'Aggre Token';
  const serverAddress =
    statusState?.status?.server_address || window.location.origin;
  const endpointUrl = serverAddress + '/v1';

  const announcementData = (statusState?.status?.announcements || []).map(
    (item) => {
      const pubDate = item?.publishDate ? new Date(item.publishDate) : null;
      const absoluteTime =
        pubDate && !isNaN(pubDate.getTime())
          ? `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, '0')}-${String(pubDate.getDate()).padStart(2, '0')} ${String(pubDate.getHours()).padStart(2, '0')}:${String(pubDate.getMinutes()).padStart(2, '0')}`
          : item?.publishDate || '';
      return {
        ...item,
        time: absoluteTime,
        relative: getRelativeTime(item.publishDate),
      };
    },
  );
  const faqData = statusState?.status?.faq || [];
  const uptimeLegendData = Object.entries(UPTIME_STATUS_MAP).map(
    ([status, info]) => ({
      status: Number(status),
      color: info.color,
      label: dashboardData.t(info.label),
    }),
  );

  /* ── derive sparkline data + gauge maxes from trendData ── */
  const trend = dashboardData.trendData || {};
  const rpmSeries = trend.rpm || [];
  const tpmSeries = trend.tpm || [];
  const tokensSeries = trend.tokens || [];
  const timesSeries = trend.times || [];
  const rpmMax = Math.max(...rpmSeries, 0.01);
  const tpmMax = Math.max(...tpmSeries, 1);
  const avgRpmNum = parseFloat(dashboardData.performanceMetrics.avgRPM) || 0;
  const avgTpmNum = parseFloat(dashboardData.performanceMetrics.avgTPM) || 0;
  const rpmPct = Math.round((avgRpmNum / rpmMax) * 100) || 0;
  const tpmPct = Math.round((avgTpmNum / tpmMax) * 100) || 0;

  return (
    <div className='agg-dash-root'>
      <style>{PAGE_CSS}</style>

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

      <div className='agg-dash-page'>
        {/* ═══ Topbar ═══ */}
        <div className='agg-dash-topbar'>
          <div className='greeting'>
            <div className='eyebrow'>
              {systemName} · {t('仪表盘')}
            </div>
            <h1>
              {(dashboardData.getGreeting || '').replace(/^👋/, '').trim()}
              {userName && (
                <>
                  {', '}
                  <span className='name'>{userName}</span>
                </>
              )}
            </h1>
          </div>
          <div className='topbar-right'>
            <span className='pill'>
              <span className='dot' />
              {t('系统运行中')}
            </span>
            <span className='pill grad'>
              <I.TrendUp />
              {t('近 24h 活跃')}
            </span>
            <button
              type='button'
              className='icon-btn'
              onClick={handleRefresh}
              title={t('刷新')}
              aria-label={t('刷新')}
            >
              <I.Refresh />
            </button>
          </div>
        </div>

        {/* ═══ Hero row ═══ */}
        <div className='agg-dash-hero'>
          {/* Balance card (gradient) */}
          <div className='balance-card'>
            <div>
              <div className='bc-head'>
                <div>
                  <div className='bc-label'>{t('可用余额')}</div>
                  <div className='bc-amount mono'>{balance?.value || '$0.00'}</div>
                  {balance?.delta && (
                    <div className='bc-trend'>
                      <I.TrendUp /> {balance.delta}
                    </div>
                  )}
                </div>
                <div className='bc-status-pills'>
                  <span className='p'>
                    <I.Pulse /> {t('活跃')}
                  </span>
                  <span className='p'>{t('系统运行中')}</span>
                </div>
              </div>
            </div>
            <div className='bc-stats'>
              <div className='bc-stat'>
                <div className='k'>{t('历史消耗')}</div>
                <div className='v mono'>{usedQuota?.value || '$0.00'}</div>
                {usedQuota?.delta && <div className='delta'>{usedQuota.delta}</div>}
              </div>
              <div className='bc-stat'>
                <div className='k'>{t('请求次数')}</div>
                <div className='v mono'>
                  {requests?.value?.toLocaleString?.() || requests?.value || '0'}
                </div>
                {requests?.delta && <div className='delta'>{requests.delta}</div>}
              </div>
              <div className='bc-stat'>
                <div className='k'>{t('统计次数')}</div>
                <div className='v mono'>
                  {statTimes?.value?.toLocaleString?.() ||
                    statTimes?.value ||
                    '0'}
                </div>
                {statTimes?.delta && (
                  <div className='delta'>{statTimes.delta}</div>
                )}
              </div>
            </div>
          </div>

          {/* API credentials */}
          <div className='api-card'>
            <div className='card-head'>
              <div className='card-title'>
                <span className='ic'>
                  <I.Key />
                </span>
                {t('API 凭证')}
              </div>
              <span className='card-meta'>v1</span>
            </div>
            <div>
              <div className='field-label'>{t('接口地址')}</div>
              <div
                className='endpoint-input'
                onClick={() => handleCopyEndpoint(endpointUrl)}
              >
                <span className='url mono'>{endpointUrl}</span>
                <button type='button' title={t('复制')}>
                  {copied ? <I.Check /> : <I.Copy />}
                </button>
              </div>
            </div>
            <div className='api-foot'>
              <span className='lock-line'>
                <I.Lock /> {t('凭据已脱敏并安全保护')}
              </span>
              <a onClick={() => navigate('/console/token')}>
                {t('管理令牌')} →
              </a>
            </div>
          </div>
        </div>

        {/* ═══ KPI strip ═══ */}
        <div className='agg-dash-kpi-row'>
          <KpiTile
            label={t('请求量 (RPM)')}
            value={rpm?.value || '0'}
            subtitle={t('滚动 5 分钟均值')}
            icon={<I.Pulse />}
            sparkData={rpmSeries}
            sparkColor='#0072ff'
          />
          <KpiTile
            label={t('吞吐量 (TPM)')}
            value={tpm?.value || '0'}
            subtitle={t('滚动 5 分钟均值')}
            icon={<I.Gauge />}
            sparkData={tpmSeries}
            sparkColor='#00c6ff'
          />
          <KpiTile
            label={t('累计 Tokens')}
            value={tokens?.value?.toLocaleString?.() || tokens?.value || '0'}
            subtitle={t('实时聚合')}
            icon={<I.Coins />}
            sparkData={tokensSeries}
            sparkColor='#0072ff'
          />
          <KpiTile
            label={t('累计调用')}
            value={requests?.value?.toLocaleString?.() || requests?.value || '0'}
            subtitle={t('实时聚合')}
            icon={<I.Bolt />}
            sparkData={timesSeries}
            sparkColor='#00c6ff'
          />
        </div>

        {/* ═══ Main row: Charts + Announcements ═══ */}
        <div className='agg-dash-main-row'>
          <div className='main-chart-slot'>
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
          <div className='main-ann-slot'>
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
        </div>

        {/* ═══ Perf row: Resource list + Twin gauges ═══ */}
        <div className='agg-dash-perf-row'>
          {/* Resource panel */}
          <div className='panel'>
            <div className='panel-head'>
              <div>
                <div className='panel-title'>{t('请求与吞吐量')}</div>
                <div className='panel-sub'>{t('资源效率')}</div>
              </div>
              <span className='card-meta'>{t('实时')}</span>
            </div>
            <div className='resource-list'>
              <div className='resource-item'>
                <div className='resource-icon'>
                  <I.Pulse />
                </div>
                <div className='resource-text'>
                  <div className='name'>RPM</div>
                  <div className='desc'>{t('每分钟请求数')}</div>
                </div>
                <div className='resource-bar'>
                  <div
                    className='fill'
                    style={{ width: `${Math.min(rpmPct, 100)}%` }}
                  />
                </div>
                <div className='resource-value mono'>{rpm?.value || '0'}</div>
              </div>
              <div className='resource-item'>
                <div className='resource-icon'>
                  <I.Gauge />
                </div>
                <div className='resource-text'>
                  <div className='name'>TPM</div>
                  <div className='desc'>{t('每分钟令牌数')}</div>
                </div>
                <div className='resource-bar'>
                  <div
                    className='fill'
                    style={{ width: `${Math.min(tpmPct, 100)}%` }}
                  />
                </div>
                <div className='resource-value mono'>{tpm?.value || '0'}</div>
              </div>

              <div className='resource-twin'>
                <div className='resource-mini'>
                  <div className='lbl'>{t('统计Tokens')}</div>
                  <div className='val mono'>
                    {tokens?.value?.toLocaleString?.() ||
                      tokens?.value ||
                      '0'}
                  </div>
                </div>
                <div className='resource-mini'>
                  <div className='lbl'>{t('统计次数')}</div>
                  <div className='val mono'>
                    {statTimes?.value?.toLocaleString?.() ||
                      statTimes?.value ||
                      '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance gauges */}
          <div className='panel'>
            <div className='panel-head'>
              <div>
                <div className='panel-title'>{t('性能指标')}</div>
                <div className='panel-sub'>{t('滚动 5 分钟均值')}</div>
              </div>
            </div>
            <div className='gauge-wrap'>
              <div className='gauge-card'>
                <div className='gauge'>
                  <Gauge value={avgRpmNum} max={Math.max(rpmMax, 0.01)} />
                </div>
                <div className='gauge-value mono'>
                  {dashboardData.performanceMetrics.avgRPM}
                </div>
                <div className='gauge-label'>{t('平均RPM')}</div>
                <div className='gauge-sublabel'>
                  {t('峰值占比 {{pct}}%', { pct: Math.min(rpmPct, 100) })}
                </div>
              </div>
              <div className='gauge-card'>
                <div className='gauge'>
                  <Gauge value={avgTpmNum} max={Math.max(tpmMax, 1)} />
                </div>
                <div className='gauge-value mono'>
                  {dashboardData.performanceMetrics.avgTPM}
                </div>
                <div className='gauge-label'>{t('平均TPM')}</div>
                <div className='gauge-sublabel'>
                  {t('峰值占比 {{pct}}%', { pct: Math.min(tpmPct, 100) })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Optional info row: FAQ + Uptime ═══ */}
        {dashboardData.hasInfoPanels &&
          (dashboardData.faqEnabled || dashboardData.uptimeEnabled) && (
            <div className='agg-dash-info-row'>
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
                      (status) =>
                        getUptimeStatusText(
                          status,
                          UPTIME_STATUS_MAP,
                          dashboardData.t,
                        ),
                      dashboardData.t,
                    )
                  }
                  CARD_PROPS={CARD_PROPS}
                  ILLUSTRATION_SIZE={ILLUSTRATION_SIZE}
                  t={dashboardData.t}
                />
              )}
            </div>
          )}

        {/* ═══ Promo row ═══ */}
        <div className='agg-dash-promo-row'>
          <div className='promo-card'>
            <span className='chip-tag'>{t('系统架构')}</span>
            <div>
              <h3>{t('多模型智能路由引擎')}</h3>
              <p>
                {t(
                  '内置 40+ 模型供应商适配器，自动选择最优渠道。支持故障转移、负载均衡和 Prompt Caching，降低成本的同时保证每一次调用的质量。',
                )}
              </p>
            </div>
            <button
              type='button'
              className='cta'
              onClick={() => navigate('/docs')}
            >
              {t('了解更多')} <I.Arrow />
            </button>
          </div>

          <div className='panel feature-panel'>
            <div className='panel-head' style={{ marginBottom: 8 }}>
              <div>
                <div className='panel-title' style={{ fontSize: 20 }}>
                  {t('无限扩展智能')}
                </div>
                <div className='panel-sub'>{t('无需妥协。')}</div>
              </div>
            </div>
            <div className='feature-list'>
              {[
                {
                  ic: <I.Bolt />,
                  name: t('自主优化路由'),
                  desc: t(
                    '系统根据查询复杂度和渠道健康状态，自动将请求路由到最优的模型集群，确保最佳性价比。',
                  ),
                },
                {
                  ic: <I.Shield />,
                  name: t('安全合规保障'),
                  desc: t(
                    '内置请求审计与敏感词过滤，API Key 权限隔离，支持 2FA 和 OAuth 多因素认证，满足企业级安全要求。',
                  ),
                },
                {
                  ic: <I.Branches />,
                  name: t('多格式协议转换'),
                  desc: t(
                    '一个端点兼容 OpenAI、Claude Messages、Gemini 三大 API 格式，无需为不同模型维护不同的接入代码。',
                  ),
                },
                {
                  ic: <I.Sparkle />,
                  name: t('Prompt Caching'),
                  desc: t(
                    '对重复出现的 system prompt 自动启用缓存读取，最高可节省 75% 输入成本。',
                  ),
                },
              ].map((f, i) => (
                <div key={i} className='feature-row'>
                  <div className='feature-icon'>{f.ic}</div>
                  <div className='feature-text'>
                    <div className='name'>{f.name}</div>
                    <div className='desc'>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── scoped page CSS ─── */
const PAGE_CSS = `
.agg-dash-root {
  --add-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --add-grad-vivid: linear-gradient(135deg, #0058d6 0%, #00a8e8 60%, #00c6ff 100%);
  --add-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --add-grad-softer: linear-gradient(135deg, rgba(0,114,255,0.04) 0%, rgba(0,198,255,0.04) 100%);
  --add-blue-1: #0072ff;
  --add-blue-2: #00c6ff;
  --add-ink-900: #0b1a2b;
  --add-ink-700: #2a3a4d;
  --add-ink-500: #5b6878;
  --add-ink-400: #8593a3;
  --add-ink-300: #b6bfca;
  --add-line: #e8edf3;
  --add-line-soft: #f1f4f8;
  --add-bg: #f6f8fc;
  --add-card: #ffffff;
  --add-radius-lg: 18px;
  --add-radius: 14px;
  --add-radius-sm: 10px;
  --add-ok: #14b86c;
  --add-warn: #f5a623;
  --add-danger: #ef5b5b;
  font-family: "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--add-ink-900);
  font-size: 14px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
.agg-dash-root .mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.agg-dash-root button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; padding: 0; }

.agg-dash-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 28px 80px;
  box-sizing: border-box;
}

/* topbar */
.agg-dash-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 22px; gap: 16px; flex-wrap: wrap;
}
.agg-dash-topbar .greeting .eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  background: var(--add-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  margin-bottom: 6px;
}
.agg-dash-topbar .greeting h1 {
  font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin: 0;
}
.agg-dash-topbar .greeting h1 .name {
  background: var(--add-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.agg-dash-topbar .topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.agg-dash-topbar .pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 999px; background: var(--add-card);
  border: 1px solid var(--add-line); font-size: 12px; color: var(--add-ink-700); font-weight: 500;
}
.agg-dash-topbar .pill .dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--add-ok);
  box-shadow: 0 0 0 3px rgba(20,184,108,0.18);
}
.agg-dash-topbar .pill.grad {
  background: var(--add-grad-soft); border-color: rgba(0,114,255,0.15); color: var(--add-blue-1);
}
.agg-dash-topbar .icon-btn {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--add-card); border: 1px solid var(--add-line);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--add-ink-500); transition: all .15s;
}
.agg-dash-topbar .icon-btn:hover {
  color: var(--add-blue-1); border-color: rgba(0,114,255,0.3);
}

/* hero row */
.agg-dash-hero {
  display: grid; grid-template-columns: 1.7fr 1fr; gap: 14px; margin-bottom: 14px;
}
.balance-card {
  position: relative; overflow: hidden;
  background: var(--add-grad-vivid);
  border-radius: var(--add-radius-lg);
  padding: 24px 26px;
  color: white;
  box-shadow: 0 12px 28px -10px rgba(0,114,255,0.45);
  min-height: 220px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.balance-card::before, .balance-card::after {
  content: ''; position: absolute; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle at center, rgba(255,255,255,0.18) 0%, transparent 70%);
}
.balance-card::before { width: 360px; height: 360px; right: -100px; top: -120px; }
.balance-card::after  { width: 260px; height: 260px; right: 80px; bottom: -160px; opacity: 0.6; }
.balance-card > * { position: relative; z-index: 1; }
.balance-card .bc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.balance-card .bc-label { font-size: 12px; font-weight: 500; opacity: 0.85; letter-spacing: 0.04em; }
.balance-card .bc-amount {
  font-size: 48px; font-weight: 700; line-height: 1; margin-top: 8px;
  letter-spacing: -0.025em;
}
.balance-card .bc-trend {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; padding: 4px 10px; background: rgba(255,255,255,0.18);
  border-radius: 999px; backdrop-filter: blur(8px); margin-top: 12px;
}
.balance-card .bc-status-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.balance-card .bc-status-pills .p {
  font-size: 11px; padding: 5px 10px; border-radius: 999px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
  display: inline-flex; align-items: center; gap: 5px;
  border: 1px solid rgba(255,255,255,0.18);
}
.balance-card .bc-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
  padding-top: 18px; margin-top: 18px;
  border-top: 1px solid rgba(255,255,255,0.18);
}
.balance-card .bc-stat .k { font-size: 11px; opacity: 0.8; font-weight: 500; letter-spacing: 0.02em; }
.balance-card .bc-stat .v { font-size: 20px; font-weight: 700; margin-top: 4px; }
.balance-card .bc-stat .delta { font-size: 11px; opacity: 0.85; margin-top: 2px; }

/* api card */
.api-card {
  background: var(--add-card); border: 1px solid var(--add-line);
  border-radius: var(--add-radius-lg); padding: 22px;
  display: flex; flex-direction: column; gap: 14px;
}
.api-card .card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.api-card .card-title {
  font-size: 14px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 8px;
}
.api-card .card-title .ic {
  width: 22px; height: 22px; border-radius: 6px;
  background: var(--add-grad-soft);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--add-blue-1);
}
.api-card .card-meta { font-size: 11px; color: var(--add-ink-400); font-weight: 500; }
.api-card .field-label { font-size: 11px; color: var(--add-ink-500); font-weight: 500; margin-bottom: 6px; }
.api-card .endpoint-input {
  background: var(--add-bg); border: 1px solid var(--add-line-soft);
  border-radius: 10px; padding: 10px 12px;
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--add-ink-900); cursor: pointer;
}
.api-card .endpoint-input .url { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.api-card .endpoint-input button {
  color: var(--add-ink-400); display: inline-flex; padding: 4px; border-radius: 6px;
}
.api-card .endpoint-input button:hover { color: var(--add-blue-1); background: var(--add-grad-soft); }
.api-card .api-foot {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px; color: var(--add-ink-500); padding-top: 4px; flex-wrap: wrap; gap: 8px;
}
.api-card .api-foot .lock-line { display: inline-flex; align-items: center; gap: 5px; }
.api-card .api-foot a {
  background: var(--add-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  font-weight: 600; cursor: pointer;
}

/* KPI strip */
.agg-dash-kpi-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  margin-bottom: 14px;
}
.agg-dash-kpi {
  position: relative; overflow: hidden;
  background: var(--add-card); border: 1px solid var(--add-line);
  border-radius: var(--add-radius); padding: 16px 18px;
  transition: border-color .15s, box-shadow .15s;
}
.agg-dash-kpi:hover {
  border-color: rgba(0,114,255,0.25);
  box-shadow: 0 4px 12px -6px rgba(0,114,255,0.18);
}
.agg-dash-kpi .kpi-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.agg-dash-kpi .kpi-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: var(--add-grad-soft); color: var(--add-blue-1);
  display: inline-flex; align-items: center; justify-content: center;
  flex: none;
}
.agg-dash-kpi .kpi-label { font-size: 12px; color: var(--add-ink-500); font-weight: 500; }
.agg-dash-kpi .kpi-value {
  font-size: 26px; font-weight: 700; margin-top: 8px; letter-spacing: -0.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.agg-dash-kpi .kpi-value .suffix {
  font-size: 14px; color: var(--add-ink-400); margin-left: 3px; font-weight: 500;
}
.agg-dash-kpi .kpi-foot { font-size: 11px; color: var(--add-ink-500); margin-top: 6px; }
.agg-dash-kpi .kpi-spark {
  position: absolute; right: 12px; bottom: 12px; opacity: 0.45; pointer-events: none;
}

/* main row (charts + announcements) */
.agg-dash-main-row {
  display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-bottom: 14px;
}
.agg-dash-main-row .main-chart-slot,
.agg-dash-main-row .main-ann-slot { display: flex; min-width: 0; }
.agg-dash-main-row .main-chart-slot > *,
.agg-dash-main-row .main-ann-slot > * { flex: 1; min-width: 0; }

/* perf row */
.agg-dash-perf-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;
}
.agg-dash-root .panel {
  background: var(--add-card); border: 1px solid var(--add-line);
  border-radius: var(--add-radius-lg); padding: 20px 22px;
}
.agg-dash-root .panel-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 16px;
}
.agg-dash-root .panel-title { font-size: 15px; font-weight: 600; }
.agg-dash-root .panel-sub { font-size: 12px; color: var(--add-ink-500); margin-top: 2px; }
.agg-dash-root .card-meta { font-size: 11px; color: var(--add-ink-400); font-weight: 500; }

.resource-list { display: flex; flex-direction: column; gap: 10px; }
.resource-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: var(--add-bg);
  border-radius: var(--add-radius-sm);
}
.resource-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--add-card); color: var(--add-blue-1);
  display: inline-flex; align-items: center; justify-content: center; flex: none;
}
.resource-text { flex: 1; min-width: 0; }
.resource-text .name { font-size: 13px; font-weight: 600; }
.resource-text .desc { font-size: 11px; color: var(--add-ink-500); margin-top: 1px; }
.resource-value { font-size: 18px; font-weight: 700; }
.resource-bar {
  height: 4px; background: var(--add-line-soft); border-radius: 2px;
  overflow: hidden; flex: none; width: 60px;
}
.resource-bar .fill { height: 100%; background: var(--add-grad); border-radius: 2px; }
.resource-twin { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
.resource-mini {
  padding: 10px 14px; background: var(--add-bg);
  border-radius: var(--add-radius-sm);
}
.resource-mini .lbl {
  font-size: 10px; color: var(--add-ink-400); text-transform: uppercase;
  letter-spacing: 0.06em; font-weight: 600;
}
.resource-mini .val { font-size: 18px; font-weight: 700; margin-top: 2px; }

.gauge-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.gauge-card {
  background: var(--add-bg); border-radius: var(--add-radius-sm);
  padding: 16px; text-align: center;
}
.gauge { width: 90px; height: 60px; margin: 0 auto; position: relative; }
.gauge svg { width: 100%; height: 100%; }
.gauge-value {
  font-size: 22px; font-weight: 700; margin-top: 6px;
  background: var(--add-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.gauge-label { font-size: 11px; color: var(--add-ink-500); margin-top: 2px; }
.gauge-sublabel { font-size: 10px; color: var(--add-ink-400); margin-top: 1px; }

/* info row (faq + uptime) */
.agg-dash-info-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;
}

/* promo row */
.agg-dash-promo-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
}
.promo-card {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #0058d6 0%, #00a8e8 100%);
  border-radius: var(--add-radius-lg); padding: 28px;
  color: white;
  min-height: 240px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.promo-card::before {
  content: ''; position: absolute; right: -40px; bottom: -40px;
  width: 280px; height: 280px;
  background: radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 65%);
  border-radius: 50%; pointer-events: none;
}
.promo-card .chip-tag {
  align-self: flex-start; position: relative; z-index: 1;
  font-size: 11px; padding: 4px 10px; border-radius: 999px;
  background: rgba(255,255,255,0.18); backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.18);
}
.promo-card h3 {
  font-size: 24px; font-weight: 700; margin: 0; line-height: 1.25;
  letter-spacing: -0.01em; max-width: 360px; position: relative; z-index: 1;
}
.promo-card p {
  font-size: 13px; line-height: 1.6; opacity: 0.85; max-width: 380px;
  margin: 8px 0 0; position: relative; z-index: 1;
}
.promo-card .cta {
  align-self: flex-start; background: white; color: var(--add-blue-1);
  padding: 9px 18px; border-radius: 999px;
  font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 14px; position: relative; z-index: 1;
  transition: transform .12s, box-shadow .12s;
}
.promo-card .cta:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(0,0,0,0.18); }

.feature-panel { display: flex; flex-direction: column; }
.feature-list { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
.feature-row {
  display: flex; gap: 14px; align-items: flex-start;
  padding: 10px 12px; border-radius: 10px; transition: background .15s;
}
.feature-row:hover { background: var(--add-grad-softer); }
.feature-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--add-grad-soft); color: var(--add-blue-1);
  display: inline-flex; align-items: center; justify-content: center; flex: none;
}
.feature-text .name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.feature-text .desc { font-size: 12px; color: var(--add-ink-500); line-height: 1.55; }

/* responsive */
@media (max-width: 1100px) {
  .agg-dash-hero,
  .agg-dash-perf-row,
  .agg-dash-info-row,
  .agg-dash-promo-row,
  .agg-dash-main-row { grid-template-columns: 1fr; }
  .agg-dash-kpi-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .agg-dash-page { padding: 20px 14px 80px; }
  .agg-dash-kpi-row { grid-template-columns: 1fr; }
  .balance-card .bc-stats { grid-template-columns: 1fr; }
  .agg-dash-topbar { flex-direction: column; align-items: flex-start; }
}
`;

export default Dashboard;
