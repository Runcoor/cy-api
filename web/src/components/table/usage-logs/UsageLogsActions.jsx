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
import { renderQuota } from '../../../helpers';
import CompactModeToggle from '../../common/ui/CompactModeToggle';
import { useMinimumLoadingTime } from '../../../hooks/common/useMinimumLoadingTime';

const LogsActions = ({
  stat,
  loadingStat,
  showStat,
  compactMode,
  setCompactMode,
  t,
}) => {
  const showSkeleton = useMinimumLoadingTime(loadingStat);
  const needSkeleton = !showStat || showSkeleton;

  const placeholder = (
    <div className='flex items-center gap-2'>
      <Skeleton.Title style={{ width: 108, height: 21, borderRadius: 6 }} />
      <Skeleton.Title style={{ width: 65, height: 21, borderRadius: 6 }} />
      <Skeleton.Title style={{ width: 64, height: 21, borderRadius: 6 }} />
    </div>
  );

  return (
    <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
      <div className='flex items-center gap-2.5'>
        <h3
          className='text-sm font-semibold leading-tight mr-3'
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {t('日志')}
        </h3>
        <Skeleton loading={needSkeleton} active placeholder={placeholder}>
          <div className='flex items-center gap-2'>
            <span
              className='text-xs font-medium px-2.5 py-1'
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
              }}
            >
              {t('消耗额度')}: {renderQuota(stat.quota)}
            </span>
            <span
              className='text-xs font-medium px-2.5 py-1'
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--error-light)',
                color: 'var(--error)',
              }}
            >
              RPM: {stat.rpm}
            </span>
            <span
              className='text-xs font-medium px-2.5 py-1'
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-active)',
                color: 'var(--text-secondary)',
              }}
            >
              TPM: {stat.tpm}
            </span>
          </div>
        </Skeleton>
      </div>

      <CompactModeToggle
        compactMode={compactMode}
        setCompactMode={setCompactMode}
        t={t}
      />
    </div>
  );
};

export default LogsActions;
