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
 * CardList — renders an array of records as CardRow instances,
 * handles the loading skeleton and Semi Empty state. Designed to be
 * a drop-in replacement for CardTable when using the new card layout.
 *
 * Props:
 *   dataSource  Array        records to render
 *   renderCard  (record, index) => ReactNode — maps a record to a CardRow
 *   loading     boolean
 *   empty       ReactNode    custom empty component (falls back to Semi Empty)
 *   gap         number       vertical gap between cards in px (default 10)
 *   className   string
 */

import React from 'react';
import { Empty } from '@douyinfe/semi-ui';
import CardRow from './CardRow';

const CardList = ({
  dataSource = [],
  renderCard,
  loading = false,
  empty,
  gap = 16,
  className = '',
  t = (s) => s,
}) => {
  if (loading && (!dataSource || dataSource.length === 0)) {
    return (
      <div
        className={`flex flex-col ${className}`}
        style={{ gap: `${gap}px` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <CardRow.Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (!dataSource || dataSource.length === 0) {
    return (
      empty || (
        <div
          className='w-full flex items-center justify-center'
          style={{
            padding: '48px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <Empty
            image={
              <img
                src='/NoDataillustration.svg'
                alt='no data'
                style={{ width: 150, height: 150 }}
              />
            }
            darkModeImage={
              <img
                src='/NoDataillustration.svg'
                alt='no data'
                style={{ width: 150, height: 150 }}
              />
            }
            description={t('暂无数据')}
          />
        </div>
      )
    );
  }

  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ gap: `${gap}px`, position: 'relative' }}
    >
      {dataSource.map((record, index) => renderCard(record, index))}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
            backdropFilter: 'blur(1px)',
            borderRadius: 'var(--radius-lg)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default CardList;
