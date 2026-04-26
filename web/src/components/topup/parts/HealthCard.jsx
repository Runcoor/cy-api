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
import { WalIcons as I } from '../_shared/WalletPageStyles';

// Static SLA / health card. Backend-free for now.
const HealthCard = ({ t, warningEnabled, warningThresholdLabel }) => {
  const value = 99.9;
  const C = 2 * Math.PI * 42;
  const offset = C - (value / 100) * C;
  return (
    <div className='wal-card wal-health-card'>
      <div className='wal-card-head'>
        <h3>{t('账户健康')}</h3>
        <span className='wal-h-meta'>{t('实时')}</span>
      </div>
      <div className='wal-ring-wrap'>
        <div className='wal-ring'>
          <svg viewBox='0 0 100 100'>
            <defs>
              <linearGradient id='wal-ring-grad' x1='0' x2='1' y1='0' y2='1'>
                <stop offset='0%' stopColor='var(--wal-blue-1)' />
                <stop offset='100%' stopColor='var(--wal-blue-2)' />
              </linearGradient>
            </defs>
            <circle
              className='wal-ring-track'
              cx='50'
              cy='50'
              r='42'
              strokeWidth='8'
              fill='none'
            />
            <circle
              className='wal-ring-fill'
              cx='50'
              cy='50'
              r='42'
              strokeWidth='8'
              fill='none'
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          </svg>
          <div className='wal-ring-center'>
            <div className='wal-v'>{value}%</div>
            <div className='wal-l'>{t('可用率')}</div>
          </div>
        </div>
        <div className='wal-ring-meta'>
          <div className='wal-title'>{t('服务运行正常')}</div>
          <div>{t('过去 30 天的服务可用性')}</div>
          <div className='wal-stat'>
            <span
              className='wal-dot'
              style={{ background: 'var(--wal-green)' }}
            />{' '}
            {t('当前无故障')}
          </div>
        </div>
      </div>
      <div className='wal-health-rows'>
        <div className='wal-health-row'>
          <div className='wal-ic ok'>
            <I.CheckCircle />
          </div>
          <div className='wal-body'>
            <div className='wal-t'>{t('API 服务')}</div>
            <div className='wal-d'>{t('所有节点正常')}</div>
          </div>
          <div className='wal-v green'>{t('正常')}</div>
        </div>
        <div className='wal-health-row'>
          <div className='wal-ic info'>
            <I.Bell />
          </div>
          <div className='wal-body'>
            <div className='wal-t'>{t('余额预警')}</div>
            <div className='wal-d'>
              {warningEnabled
                ? t('低于 {{threshold}} 时提醒', {
                    threshold: warningThresholdLabel || '—',
                  })
                : t('未启用预警')}
            </div>
          </div>
          <div className='wal-v'>{warningEnabled ? t('已开') : t('已关')}</div>
        </div>
      </div>
    </div>
  );
};

export default HealthCard;
