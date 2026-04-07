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
import { PieChart } from 'lucide-react';
import { VChart } from '@visactor/react-vchart';

const ChartsPanel = ({
  activeChartTab,
  setActiveChartTab,
  spec_line,
  spec_model_line,
  spec_pie,
  spec_rank_bar,
  CARD_PROPS,
  CHART_CONFIG,
  FLEX_CENTER_GAP2,
  hasApiInfoPanel,
  t,
}) => {
  const tabs = [
    { key: '1', label: t('消耗分布') },
    { key: '2', label: t('消耗趋势') },
    { key: '3', label: t('调用次数分布') },
    { key: '4', label: t('调用次数排行') },
  ];

  return (
    <div
      className={`rounded-[var(--radius-lg)] border overflow-hidden ${hasApiInfoPanel ? 'lg:col-span-3' : ''}`}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Panel header */}
      <div
        className='px-5 py-3 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3'
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className='flex items-center gap-2'>
          <div
            className='w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center'
            style={{
              background: 'var(--info-light)',
              color: 'var(--info)',
            }}
          >
            <PieChart size={14} />
          </div>
          <span
            className='text-sm font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
            }}
          >
            {t('模型数据分析')}
          </span>
        </div>

        {/* macOS segmented control tabs */}
        <div
          className='flex items-center rounded-[var(--radius-md)] p-0.5 gap-0.5'
          style={{ background: 'var(--surface-hover)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className='px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors duration-150 whitespace-nowrap'
              style={{
                background: activeChartTab === tab.key ? 'var(--surface)' : 'transparent',
                color: activeChartTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: activeChartTab === tab.key ? '1px solid var(--border-subtle)' : '1px solid transparent',
                cursor: 'pointer',
              }}
              onClick={() => setActiveChartTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className='h-96 p-3'>
        {activeChartTab === '1' && (
          <VChart spec={spec_line} option={CHART_CONFIG} />
        )}
        {activeChartTab === '2' && (
          <VChart spec={spec_model_line} option={CHART_CONFIG} />
        )}
        {activeChartTab === '3' && (
          <VChart spec={spec_pie} option={CHART_CONFIG} />
        )}
        {activeChartTab === '4' && (
          <VChart spec={spec_rank_bar} option={CHART_CONFIG} />
        )}
      </div>
    </div>
  );
};

export default ChartsPanel;
