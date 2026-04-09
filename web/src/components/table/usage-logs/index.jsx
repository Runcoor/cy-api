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

import React, { useEffect } from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { IconEyeOpened, IconEyeClosed } from '@douyinfe/semi-icons';
import CardPageLayout from '../../common/ui/CardPageLayout';
import LogsTable from './UsageLogsTable';
import LogsFilters from './UsageLogsFilters';
import UserInfoModal from './modals/UserInfoModal';
import ChannelAffinityUsageCacheModal from './modals/ChannelAffinityUsageCacheModal';
import ParamOverrideModal from './modals/ParamOverrideModal';
import { useLogsData } from '../../../hooks/usage-logs/useUsageLogsData';
import { renderQuota } from '../../../helpers';

const LogsPage = () => {
  const logsData = useLogsData();
  const {
    // Data
    loading,
    logCount,
    activePage,
    pageSize,
    handlePageChange,
    refresh,
    isAdminUser,

    // Stats
    stat,
    showStat,
    handleEyeClick,

    // Filter state
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    selectedLogType,
    setSelectedLogType,

    t,
  } = logsData;

  // Re-fetch logs when any filter changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dateRange, selectedLogType]);

  const subtitleText = showStat
    ? `${t('消耗额度')}: ${renderQuota(stat.quota)} · RPM ${stat.rpm} · TPM ${stat.tpm}`
    : `${t('共')} ${logCount} ${t('条日志')}`;

  const statsToggle = (
    <Tooltip
      content={showStat ? t('隐藏统计') : t('显示统计')}
      position='top'
    >
      <button
        type='button'
        className='cp-icon-btn'
        onClick={() => handleEyeClick && handleEyeClick()}
        style={{ width: 40, height: 40 }}
        aria-label={t('统计')}
      >
        {showStat ? <IconEyeClosed size='default' /> : <IconEyeOpened size='default' />}
      </button>
    </Tooltip>
  );

  const filterBar = (
    <LogsFilters
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      dateRange={dateRange}
      setDateRange={setDateRange}
      selectedLogType={selectedLogType}
      setSelectedLogType={setSelectedLogType}
      isAdminUser={isAdminUser}
      onSubmit={() => refresh()}
      onRefresh={() => refresh()}
      loading={loading}
      t={t}
    />
  );

  // Lightweight pagination
  const totalPages = Math.max(1, Math.ceil(logCount / (pageSize || 1)));
  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (activePage >= totalPages - 3)
      return [
        1,
        '…',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, '…', activePage - 1, activePage, activePage + 1, '…', totalPages];
  };

  const footer =
    logCount > 0 ? (
      <div className='cp-footer'>
        <div className='cp-footer-count'>
          {t('共')} <strong>{logCount}</strong> {t('条')}
        </div>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            className='cp-icon-btn'
            style={{ width: 36, height: 36 }}
            onClick={() => handlePageChange(Math.max(1, activePage - 1))}
            disabled={activePage <= 1}
          >
            ‹
          </button>
          {renderPageNumbers().map((p, i) =>
            p === '…' ? (
              <span
                key={`e-${i}`}
                style={{ padding: '0 6px', color: 'var(--text-muted)' }}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type='button'
                onClick={() => handlePageChange(p)}
                style={{
                  minWidth: 36,
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: p === activePage ? 700 : 500,
                  color: p === activePage ? '#fff' : 'var(--text-secondary)',
                  background:
                    p === activePage ? 'var(--accent-gradient)' : 'transparent',
                  boxShadow:
                    p === activePage
                      ? '0 4px 12px -4px rgba(0,114,255,0.35)'
                      : 'none',
                  transition:
                    'background var(--ease-micro), color var(--ease-micro)',
                }}
              >
                {p}
              </button>
            ),
          )}
          <button
            type='button'
            className='cp-icon-btn'
            style={{ width: 36, height: 36 }}
            onClick={() => handlePageChange(Math.min(totalPages, activePage + 1))}
            disabled={activePage >= totalPages}
          >
            ›
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <UserInfoModal {...logsData} />
      <ChannelAffinityUsageCacheModal {...logsData} />
      <ParamOverrideModal {...logsData} />

      <CardPageLayout
        title={t('使用记录')}
        subtitle={subtitleText}
        primaryAction={statsToggle}
        filterBar={filterBar}
        footer={footer}
      >
        <LogsTable {...logsData} />
      </CardPageLayout>
    </>
  );
};

export default LogsPage;
