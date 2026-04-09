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
import { IconSearch, IconRefresh, IconClose } from '@douyinfe/semi-icons';

/**
 * TokensFilters — filter bar matching the Tailwind HTML mockup.
 *
 * Layout:
 *   [ Search pill with icon, flex-grow ]  [ Refresh icon button ]
 *
 * The search is a plain native <input> styled via .cp-search — no Semi Form
 * wrapper — so we have full control over the visual treatment and avoid
 * fighting Semi's default form-control styling.
 */
const TokensFilters = ({ value, onChange, onSubmit, onRefresh, loading, t }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Debounced change → onChange
  const scheduleChange = useCallback(
    (next) => {
      setLocalValue(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (onChange) onChange(next);
      }, 250);
    },
    [onChange],
  );

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (onChange) onChange(localValue);
    if (onSubmit) onSubmit(localValue);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) onChange('');
    if (onSubmit) onSubmit('');
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
            placeholder={t('搜索名称 / 密钥 / 分组')}
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
        <button
          type='button'
          className='cp-icon-btn'
          onClick={() => onRefresh && onRefresh()}
          aria-label={t('刷新')}
          disabled={loading}
          style={{
            opacity: loading ? 0.55 : 1,
          }}
        >
          <IconRefresh size='default' />
        </button>
      </div>
    </form>
  );
};

export default TokensFilters;
