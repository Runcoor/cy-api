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
import { Empty } from '@douyinfe/semi-ui';
import { Server, Gauge, ExternalLink } from 'lucide-react';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import ScrollableContainer from '../common/ui/ScrollableContainer';

const ApiInfoPanel = ({
  apiInfoData,
  handleCopyUrl,
  handleSpeedTest,
  CARD_PROPS,
  FLEX_CENTER_GAP2,
  ILLUSTRATION_SIZE,
  t,
}) => {
  return (
    <div
      className='rounded-[var(--radius-lg)] border overflow-hidden'
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Panel header */}
      <div
        className='px-5 py-3 border-b flex items-center gap-2'
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className='w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center'
          style={{
            background: 'var(--success-light)',
            color: 'var(--success)',
          }}
        >
          <Server size={14} />
        </div>
        <span
          className='text-sm font-semibold'
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
          }}
        >
          {t('API信息')}
        </span>
      </div>

      {/* Body */}
      <ScrollableContainer maxHeight='24rem'>
        {apiInfoData.length > 0 ? (
          <div className='p-2'>
            {apiInfoData.map((api, index) => (
              <div
                key={api.id}
                className='flex p-3 rounded-[var(--radius-md)] cursor-pointer transition-colors duration-150'
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Route icon badge */}
                <div
                  className='w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 mr-3 text-xs font-semibold'
                  style={{
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                  }}
                >
                  {api.route.substring(0, 2).toUpperCase()}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex flex-wrap items-center justify-between mb-1 w-full gap-2'>
                    <span
                      className='text-sm break-all font-semibold'
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {api.route}
                    </span>
                    <div className='flex items-center gap-1'>
                      <button
                        className='flex items-center gap-1 text-xs px-2 py-1 rounded-[var(--radius-sm)] transition-colors duration-150'
                        style={{
                          background: 'var(--surface-active)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSpeedTest(api.url)}
                      >
                        <Gauge size={12} />
                        {t('测速')}
                      </button>
                      <button
                        className='flex items-center gap-1 text-xs px-2 py-1 rounded-[var(--radius-sm)] transition-colors duration-150'
                        style={{
                          background: 'var(--surface-active)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          window.open(api.url, '_blank', 'noopener,noreferrer')
                        }
                      >
                        <ExternalLink size={12} />
                        {t('跳转')}
                      </button>
                    </div>
                  </div>
                  <div
                    className='break-all cursor-pointer text-xs mb-1 transition-colors duration-150'
                    style={{ color: 'var(--accent)' }}
                    onClick={() => handleCopyUrl(api.url)}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {api.url}
                  </div>
                  <div className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {api.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex justify-center items-center min-h-[20rem] w-full'>
            <Empty
              image={<IllustrationConstruction style={ILLUSTRATION_SIZE} />}
              darkModeImage={
                <IllustrationConstructionDark style={ILLUSTRATION_SIZE} />
              }
              title={t('暂无API信息')}
              description={t('请联系管理员在系统设置中配置API信息')}
            />
          </div>
        )}
      </ScrollableContainer>
    </div>
  );
};

export default ApiInfoPanel;
