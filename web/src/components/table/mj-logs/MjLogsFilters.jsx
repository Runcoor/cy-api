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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DatePicker } from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconRefresh,
  IconClose,
  IconCalendar,
} from '@douyinfe/semi-icons';
import { DATE_RANGE_PRESETS } from '../../../constants/console.constants';

const MjLogsFilters = ({
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  isAdminUser,
  onSubmit,
  onRefresh,
  loading,
  t,
}) => {
  const [localValue, setLocalValue] = useState(searchQuery || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalValue(searchQuery || '');
  }, [searchQuery]);

  const scheduleChange = useCallback(
    (next) => {
      setLocalValue(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(next);
      }, 300);
    },
    [setSearchQuery],
  );

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setSearchQuery(localValue);
    if (onSubmit) onSubmit();
  };

  const handleClear = () => {
    setLocalValue('');
    setSearchQuery('');
    if (onSubmit) onSubmit();
  };

  return (
    <form className='cp-filter-bar' onSubmit={handleSubmit}>
      <div className='cp-filter-row'>
        <div className='cp-search'>
          <span className='cp-search-icon'>
            <IconSearch size='default' />
          </span>
          <input
            type='text'
            value={localValue}
            onChange={(e) => scheduleChange(e.target.value)}
            placeholder={
              isAdminUser
                ? t('搜索任务ID / Prompt / 类型 / 状态 / 渠道ID')
                : t('搜索任务ID / Prompt / 类型 / 状态')
            }
            autoComplete='off'
          />
          {localValue && (
            <button
              type='button'
              className='cp-search-clear'
              onClick={handleClear}
              aria-label={t('清除')}
            >
              <IconClose size='small' />
            </button>
          )}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 8px 4px 12px',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid transparent',
            minHeight: 42,
          }}
        >
          <IconCalendar
            size='default'
            style={{ color: 'var(--accent)', flexShrink: 0 }}
          />
          <DatePicker
            type='dateTimeRange'
            value={dateRange}
            onChange={(v) => setDateRange(v || [])}
            placeholder={[t('开始时间'), t('结束时间')]}
            size='default'
            showClear
            density='compact'
            style={{
              border: 'none',
              background: 'transparent',
              minWidth: 240,
              padding: 0,
            }}
            presets={DATE_RANGE_PRESETS.map((preset) => ({
              text: t(preset.text),
              start: preset.start(),
              end: preset.end(),
            }))}
          />
        </div>

        <button
          type='button'
          className='cp-icon-btn'
          onClick={() => onRefresh && onRefresh()}
          aria-label={t('刷新')}
          disabled={loading}
          style={{ opacity: loading ? 0.55 : 1 }}
        >
          <IconRefresh size='default' />
        </button>
      </div>
    </form>
  );
};

export default MjLogsFilters;
