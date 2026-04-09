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
import CardPageLayout from '../../common/ui/CardPageLayout';
import TaskLogsTable from './TaskLogsTable';
import TaskLogsFilters from './TaskLogsFilters';
import ContentModal from './modals/ContentModal';
import AudioPreviewModal from './modals/AudioPreviewModal';
import { useTaskLogsData } from '../../../hooks/task-logs/useTaskLogsData';

const TaskLogsPage = () => {
  const taskLogsData = useTaskLogsData();
  const {
    loading,
    logCount,
    activePage,
    pageSize,
    handlePageChange,
    refresh,
    isAdminUser,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    t,
  } = taskLogsData;

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dateRange]);

  const filterBar = (
    <TaskLogsFilters
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      dateRange={dateRange}
      setDateRange={setDateRange}
      isAdminUser={isAdminUser}
      onSubmit={() => refresh()}
      onRefresh={() => refresh()}
      loading={loading}
      t={t}
    />
  );

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
      <ContentModal {...taskLogsData} isVideo={false} />
      <ContentModal
        isModalOpen={taskLogsData.isVideoModalOpen}
        setIsModalOpen={taskLogsData.setIsVideoModalOpen}
        modalContent={taskLogsData.videoUrl}
        isVideo={true}
      />
      <AudioPreviewModal
        isModalOpen={taskLogsData.isAudioModalOpen}
        setIsModalOpen={taskLogsData.setIsAudioModalOpen}
        audioClips={taskLogsData.audioClips}
      />

      <CardPageLayout
        title={t('任务记录')}
        subtitle={`${t('共')} ${logCount} ${t('个任务')}`}
        filterBar={filterBar}
        footer={footer}
      >
        <TaskLogsTable {...taskLogsData} />
      </CardPageLayout>
    </>
  );
};

export default TaskLogsPage;
