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
import { Timeline, Empty } from '@douyinfe/semi-ui';
import { Bell } from 'lucide-react';
import { marked } from 'marked';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import ScrollableContainer from '../common/ui/ScrollableContainer';

const AnnouncementsPanel = ({
  announcementData,
  announcementLegendData,
  CARD_PROPS,
  ILLUSTRATION_SIZE,
  t,
}) => {
  return (
    <div
      className='lg:col-span-2 rounded-[var(--radius-lg)] border overflow-hidden'
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Panel header */}
      <div
        className='px-5 py-3 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2'
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className='flex items-center gap-2'>
          <div
            className='w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center'
            style={{
              background: 'var(--warning-light)',
              color: 'var(--warning)',
            }}
          >
            <Bell size={14} />
          </div>
          <span
            className='text-sm font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
            }}
          >
            {t('系统公告')}
          </span>
          <span
            className='text-xs px-2 py-0.5 rounded-[var(--radius-sm)]'
            style={{
              background: 'var(--surface-active)',
              color: 'var(--text-muted)',
            }}
          >
            {t('显示最新20条')}
          </span>
        </div>
        {/* Legend */}
        <div className='flex flex-wrap gap-3 text-xs'>
          {announcementLegendData.map((legend, index) => (
            <div key={index} className='flex items-center gap-1'>
              <div
                className='w-2 h-2 rounded-full'
                style={{
                  backgroundColor:
                    legend.color === 'grey'
                      ? 'var(--text-muted)'
                      : legend.color === 'blue'
                        ? 'var(--accent)'
                        : legend.color === 'green'
                          ? 'var(--success)'
                          : legend.color === 'orange'
                            ? 'var(--warning)'
                            : legend.color === 'red'
                              ? 'var(--error)'
                              : 'var(--text-muted)',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{legend.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <ScrollableContainer maxHeight='24rem'>
        {announcementData.length > 0 ? (
          <div className='p-4'>
            <Timeline mode='left'>
              {announcementData.map((item, idx) => {
                const htmlExtra = item.extra ? marked.parse(item.extra) : '';
                return (
                  <Timeline.Item
                    key={idx}
                    type={item.type || 'default'}
                    time={`${item.relative ? item.relative + ' ' : ''}${item.time}`}
                    extra={
                      item.extra ? (
                        <div
                          className='text-xs'
                          style={{ color: 'var(--text-muted)' }}
                          dangerouslySetInnerHTML={{ __html: htmlExtra }}
                        />
                      ) : null
                    }
                  >
                    <div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(item.content || ''),
                        }}
                      />
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </div>
        ) : (
          <div className='flex justify-center items-center py-8'>
            <Empty
              image={<IllustrationConstruction style={ILLUSTRATION_SIZE} />}
              darkModeImage={
                <IllustrationConstructionDark style={ILLUSTRATION_SIZE} />
              }
              title={t('暂无系统公告')}
              description={t('请联系管理员在系统设置中配置公告信息')}
            />
          </div>
        )}
      </ScrollableContainer>
    </div>
  );
};

export default AnnouncementsPanel;
