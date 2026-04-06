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
import { useMinimumLoadingTime } from '../../../hooks/common/useMinimumLoadingTime';
import { IconEyeOpened } from '@douyinfe/semi-icons';
import CompactModeToggle from '../../common/ui/CompactModeToggle';

const MjLogsActions = ({
  loading,
  showBanner,
  isAdminUser,
  compactMode,
  setCompactMode,
  t,
}) => {
  const showSkeleton = useMinimumLoadingTime(loading);

  const placeholder = (
    <div className='flex items-center gap-2.5'>
      <Skeleton.Title style={{ width: 28, height: 28, borderRadius: 6 }} />
      <Skeleton.Title style={{ width: 200, height: 18, borderRadius: 4 }} />
    </div>
  );

  return (
    <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
      <Skeleton loading={showSkeleton} active placeholder={placeholder}>
        <div className='flex items-center gap-2.5'>
          <div
            className='flex items-center justify-center flex-shrink-0'
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
            }}
          >
            <IconEyeOpened size='small' />
          </div>
          <div>
            <h3
              className='text-sm font-semibold leading-tight'
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {t('Midjourney 任务记录')}
            </h3>
            {isAdminUser && showBanner && (
              <p
                className='text-xs mt-0.5'
                style={{ color: 'var(--warning)', margin: 0 }}
              >
                {t('当前未开启Midjourney回调，部分项目可能无法获得绘图结果，可在运营设置中开启。')}
              </p>
            )}
          </div>
        </div>
      </Skeleton>

      <CompactModeToggle
        compactMode={compactMode}
        setCompactMode={setCompactMode}
        t={t}
      />
    </div>
  );
};

export default MjLogsActions;
