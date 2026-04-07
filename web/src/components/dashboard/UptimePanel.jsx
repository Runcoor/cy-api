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
import {
  Button,
  Tabs,
  TabPane,
  Empty,
} from '@douyinfe/semi-ui';
import { Gauge, RefreshCw } from 'lucide-react';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import ScrollableContainer from '../common/ui/ScrollableContainer';
import MacSpinner from '../common/ui/MacSpinner';

const UptimePanel = ({
  uptimeData,
  uptimeLoading,
  activeUptimeTab,
  setActiveUptimeTab,
  loadUptimeData,
  uptimeLegendData,
  renderMonitorList,
  CARD_PROPS,
  ILLUSTRATION_SIZE,
  t,
}) => {
  return (
    <div
      className='lg:col-span-1 rounded-[var(--radius-lg)] border overflow-hidden'
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Panel header */}
      <div
        className='px-5 py-3 border-b flex items-center justify-between'
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className='flex items-center gap-2'>
          <div
            className='w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center'
            style={{
              background: 'var(--success-light)',
              color: 'var(--success)',
            }}
          >
            <Gauge size={14} />
          </div>
          <span
            className='text-sm font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
            }}
          >
            {t('服务可用性')}
          </span>
        </div>
        <button
          className='w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150'
          style={{
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={loadUptimeData}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Body */}
      <div className='relative'>
        <MacSpinner spinning={uptimeLoading}>
          {uptimeData.length > 0 ? (
            uptimeData.length === 1 ? (
              <ScrollableContainer maxHeight='24rem'>
                {renderMonitorList(uptimeData[0].monitors)}
              </ScrollableContainer>
            ) : (
              <Tabs
                type='card'
                collapsible
                activeKey={activeUptimeTab}
                onChange={setActiveUptimeTab}
                size='small'
              >
                {uptimeData.map((group, groupIdx) => (
                  <TabPane
                    tab={
                      <span className='flex items-center gap-2'>
                        <Gauge size={14} />
                        {group.categoryName}
                        <span
                          className='text-xs px-1.5 py-0 rounded-[var(--radius-sm)] font-medium'
                          style={{
                            background: activeUptimeTab === group.categoryName
                              ? 'var(--error-light)'
                              : 'var(--surface-active)',
                            color: activeUptimeTab === group.categoryName
                              ? 'var(--error)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {group.monitors ? group.monitors.length : 0}
                        </span>
                      </span>
                    }
                    itemKey={group.categoryName}
                    key={groupIdx}
                  >
                    <ScrollableContainer maxHeight='21.5rem'>
                      {renderMonitorList(group.monitors)}
                    </ScrollableContainer>
                  </TabPane>
                ))}
              </Tabs>
            )
          ) : (
            <div className='flex justify-center items-center py-8'>
              <Empty
                image={<IllustrationConstruction style={ILLUSTRATION_SIZE} />}
                darkModeImage={
                  <IllustrationConstructionDark style={ILLUSTRATION_SIZE} />
                }
                title={t('暂无监控数据')}
                description={t('请联系管理员在系统设置中配置Uptime')}
              />
            </div>
          )}
        </MacSpinner>
      </div>

      {/* Legend footer */}
      {uptimeData.length > 0 && (
        <div
          className='px-4 py-2.5 border-t'
          style={{
            background: 'var(--surface-hover)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className='flex flex-wrap gap-3 text-xs justify-center'>
            {uptimeLegendData.map((legend, index) => (
              <div key={index} className='flex items-center gap-1'>
                <div
                  className='w-2 h-2 rounded-full'
                  style={{ backgroundColor: legend.color }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{legend.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UptimePanel;
