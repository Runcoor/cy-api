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

import React from 'react';
import { Skeleton } from '@douyinfe/semi-ui';
import { VChart } from '@visactor/react-vchart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const StatsCards = ({
  groupedStatsData,
  loading,
  getTrendSpec,
  CARD_PROPS,
  CHART_CONFIG,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className='mb-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {groupedStatsData.map((group, idx) => (
          <div
            key={idx}
            className='rounded-[var(--radius-lg)] border overflow-hidden'
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Panel header — serif title with icon badge */}
            <div
              className='px-4 py-3 border-b flex items-center gap-2'
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--surface-hover)',
              }}
            >
              <div
                className='w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center'
                style={{
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                </svg>
              </div>
              <span
                className='text-sm font-semibold'
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--text-primary)',
                }}
              >
                {group.title}
              </span>
            </div>

            {/* Stats items */}
            <div className='p-4 space-y-3'>
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className='flex items-center justify-between cursor-pointer rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-150'
                  style={{ background: 'transparent' }}
                  onClick={item.onClick}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className='flex items-center gap-3'>
                    {/* Icon badge — colored circle with icon */}
                    <div
                      className='w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 text-sm'
                      style={{
                        background: item.avatarColor === 'blue' ? 'var(--accent-light)'
                          : item.avatarColor === 'green' ? 'var(--success-light)'
                          : item.avatarColor === 'orange' ? 'var(--warning-light)'
                          : item.avatarColor === 'red' ? 'var(--error-light)'
                          : item.avatarColor === 'purple' ? 'var(--info-light)'
                          : item.avatarColor === 'cyan' ? 'var(--info-light)'
                          : item.avatarColor === 'amber' ? 'var(--warning-light)'
                          : 'var(--surface-active)',
                        color: item.avatarColor === 'blue' ? 'var(--accent)'
                          : item.avatarColor === 'green' ? 'var(--success)'
                          : item.avatarColor === 'orange' ? 'var(--warning)'
                          : item.avatarColor === 'red' ? 'var(--error)'
                          : item.avatarColor === 'purple' ? 'var(--info)'
                          : item.avatarColor === 'cyan' ? 'var(--info)'
                          : item.avatarColor === 'amber' ? 'var(--warning)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div
                        className='text-xs leading-tight'
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {item.title}
                      </div>
                      <div
                        className='text-lg font-semibold leading-tight mt-0.5'
                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
                      >
                        <Skeleton
                          loading={loading}
                          active
                          placeholder={
                            <Skeleton.Paragraph
                              active
                              rows={1}
                              style={{
                                width: '65px',
                                height: '24px',
                                marginTop: '4px',
                              }}
                            />
                          }
                        >
                          {item.value}
                        </Skeleton>
                      </div>
                    </div>
                  </div>
                  {item.title === t('当前余额') ? (
                    <button
                      className='text-xs px-2.5 py-1 rounded-[var(--radius-sm)] transition-colors duration-150 font-medium'
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/console/topup');
                      }}
                    >
                      {t('充值')}
                    </button>
                  ) : (
                    (loading ||
                      (item.trendData && item.trendData.length > 0)) && (
                      <div className='w-24 h-10 flex-shrink-0'>
                        <VChart
                          spec={getTrendSpec(item.trendData, item.trendColor)}
                          option={CHART_CONFIG}
                        />
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCards;
