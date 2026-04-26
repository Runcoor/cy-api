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

const formatUSD = (n, digits = 2) =>
  `$${(Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;

const EarningsCard = ({ t, affQuotaUsd, affHistoryUsd, onTransfer }) => {
  // Backend exposes a single AffQuota bucket; we render it as one source.
  // If/when refunds/events/credits are split out, extend `sources` here.
  const sources = [
    { id: 'invite', t: t('邀请奖励'), amt: affHistoryUsd || 0, cls: 'bonus' },
  ];
  const total = sources.reduce((s, i) => s + i.amt, 0);
  const transferable = affQuotaUsd || 0;
  return (
    <div className='wal-card wal-earnings-card'>
      <div className='wal-card-head'>
        <h3>{t('收益统计')}</h3>
        <span className='wal-h-meta'>{t('累计')}</span>
      </div>

      <div className='wal-earn-stats-row'>
        <div className='wal-earn-stat'>
          <div className='wal-lbl'>{t('待使用收益')}</div>
          <div className='wal-earn-val grad' title={formatUSD(transferable)}>
            <span className='wal-curr'>$</span>
            {Number(transferable).toFixed(2)}
          </div>
        </div>
        <div className='wal-earn-divider' />
        <div className='wal-earn-stat'>
          <div className='wal-lbl'>{t('总收益')}</div>
          <div className='wal-earn-val' title={formatUSD(affHistoryUsd)}>
            <span className='wal-curr'>$</span>
            {Number(affHistoryUsd || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <button
        className='wal-transfer-btn'
        onClick={onTransfer}
        disabled={transferable <= 0}
      >
        <span className='wal-tb-icon'>
          <I.ArrowRight />
        </span>
        <span>{t('划转到余额')}</span>
        <span className='wal-tb-amt'>{formatUSD(transferable)}</span>
      </button>

      {total > 0 && (
        <div className='wal-earn-source-strip'>
          <div className='wal-ess-bar'>
            {sources.map((s) => (
              <div
                key={s.id}
                className={`wal-bar-seg ${s.cls}`}
                style={{ flex: Math.max(s.amt, 0.01) }}
                title={`${s.t} ${formatUSD(s.amt)}`}
              />
            ))}
          </div>
          <div className='wal-ess-legend'>
            {sources.map((s) => (
              <div key={s.id} className='wal-legend-item'>
                <span className={`wal-legend-dot ${s.cls}`} />
                <span className='wal-legend-t'>{s.t}</span>
                <span className='wal-legend-v'>{formatUSD(s.amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsCard;
