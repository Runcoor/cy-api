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

const formatUSD = (n, digits = 2) => {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
};

const BalanceHero = ({
  t,
  user,
  monthDelta,
  totalTopupUsd,
  topupCount,
  totalUsedUsd,
  monthDeltaPct,
  onOpenHistory,
  onRecharge,
}) => {
  const balance = (user?.quota || 0) / 500000;
  const dollars = Math.floor(balance);
  const cents = Math.round((balance - dollars) * 100)
    .toString()
    .padStart(2, '0');

  const accountId = `acct_${user?.id || 0}`;
  const monthDeltaIsDown = (monthDelta || 0) < 0;

  return (
    <div className='wal-balance-hero'>
      <div className='wal-bh-top'>
        <div className='wal-bh-label'>{t('可用余额')}</div>
        <div className='wal-bh-account-id'>{accountId} · USD</div>
      </div>
      <div className='wal-bh-amount-row'>
        <div className='wal-bh-amount'>
          <span className='wal-currency'>$</span>
          {dollars.toLocaleString()}
          <span className='wal-cents'>.{cents}</span>
        </div>
        {monthDelta !== null && monthDelta !== undefined && (
          <div
            className={`wal-bh-delta ${monthDeltaIsDown ? 'down' : ''}`}
            title={t('本月余额变动')}
          >
            {monthDeltaIsDown ? <I.ArrowDown /> : <I.ArrowUp />}
            {monthDeltaIsDown ? '-' : '+'}
            {formatUSD(Math.abs(monthDelta))} {t('本月')}
          </div>
        )}
      </div>
      <div className='wal-bh-stats'>
        <div className='wal-bh-stat'>
          <div className='wal-bh-stat-lbl'>{t('可用')}</div>
          <div className='wal-bh-stat-val'>{formatUSD(balance)}</div>
        </div>
        <div className='wal-bh-stat'>
          <div className='wal-bh-stat-lbl'>{t('冻结')}</div>
          <div className='wal-bh-stat-val'>$0.00</div>
          <div className='wal-bh-stat-sub'>{t('无待处理')}</div>
        </div>
        <div className='wal-bh-stat'>
          <div className='wal-bh-stat-lbl'>{t('累计充值')}</div>
          <div className='wal-bh-stat-val'>{formatUSD(totalTopupUsd || 0)}</div>
          {topupCount ? (
            <div className='wal-bh-stat-sub'>
              {t('共 {{count}} 次充值', { count: topupCount })}
            </div>
          ) : null}
        </div>
        <div className='wal-bh-stat'>
          <div className='wal-bh-stat-lbl'>{t('累计消费')}</div>
          <div className='wal-bh-stat-val'>{formatUSD(totalUsedUsd || 0)}</div>
          {monthDeltaPct !== null && monthDeltaPct !== undefined ? (
            <div className='wal-bh-stat-sub'>
              {t('较上月')} {monthDeltaPct >= 0 ? '↑' : '↓'}{' '}
              {Math.abs(Math.round(monthDeltaPct))}%
            </div>
          ) : null}
        </div>
      </div>
      <div className='wal-bh-foot'>
        <div className='wal-bh-foot-left'>
          <I.Clock style={{ opacity: 0.6 }} />
          <span>{t('最后更新 · 刚刚')}</span>
        </div>
        <div className='wal-bh-foot-actions'>
          <button className='wal-bh-bill-btn' onClick={onOpenHistory}>
            <I.Receipt />
            <span>{t('账单')}</span>
          </button>
          <button className='wal-recharge-cta-mini' onClick={onRecharge}>
            <span className='wal-cta-icon'>
              <I.Bolt />
            </span>
            <span>{t('立即充值')}</span>
            <span className='wal-cta-arrow'>
              <I.ArrowRight />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceHero;
