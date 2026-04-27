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

const SpendTrend = ({
  t,
  range,
  setRange,
  data,
  totalUsd,
  avgUsd,
  peakUsd,
  topModelName,
  topModelShare,
  prevPeriodDeltaPct,
}) => {
  const W = 1180,
    H = 140,
    P = { l: 0, r: 0, t: 8, b: 8 };
  const series = (data && data.length ? data : [0]).map((v) => Number(v) || 0);
  const max = Math.max(...series, 0.0001) * 1.1;
  const stepX = (W - P.l - P.r) / Math.max(series.length - 1, 1);
  const points = series.map((v, i) => ({
    x: P.l + i * stepX,
    y: P.t + (H - P.t - P.b) * (1 - v / max),
    v,
  }));
  const path = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
  }, '');
  const area = `${path} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;

  const peak = peakUsd ?? Math.max(...series);
  const peakIdx = series.indexOf(peak);
  const peakPoint = peakIdx >= 0 ? points[peakIdx] : null;

  return (
    <div className='wal-card'>
      <div className='wal-card-head'>
        <h3>{t('消费趋势')}</h3>
        <div className='wal-trend-tabs'>
          {[
            ['7d', t('7天')],
            ['30d', t('30天')],
            ['90d', t('90天')],
          ].map(([k, l]) => (
            <button
              key={k}
              className={range === k ? 'active' : ''}
              onClick={() => setRange?.(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className='wal-trend-stats'>
        <div className='wal-ts'>
          <div className='wal-lbl'>{t('总消费')}</div>
          <div className='wal-val grad'>${(totalUsd || 0).toFixed(2)}</div>
          {prevPeriodDeltaPct !== null &&
            prevPeriodDeltaPct !== undefined &&
            isFinite(prevPeriodDeltaPct) && (
              <div className='wal-delta'>
                {t('较上一周期')} {prevPeriodDeltaPct >= 0 ? '↑' : '↓'}{' '}
                {Math.abs(Math.round(prevPeriodDeltaPct * 10) / 10)}%
              </div>
            )}
        </div>
        <div className='wal-ts'>
          <div className='wal-lbl'>{t('日均')}</div>
          <div className='wal-val'>${(avgUsd || 0).toFixed(2)}</div>
        </div>
        <div className='wal-ts'>
          <div className='wal-lbl'>{t('峰值')}</div>
          <div className='wal-val'>${(peak || 0).toFixed(2)}</div>
        </div>
        {topModelName ? (
          <div className='wal-ts'>
            <div className='wal-lbl'>{t('最常用')}</div>
            <div
              className='wal-val'
              style={{ fontSize: 14, marginTop: 8 }}
              title={topModelName}
            >
              {topModelName}
              {topModelShare ? ` · ${topModelShare}%` : ''}
            </div>
          </div>
        ) : null}
      </div>
      <div className='wal-chart-wrap'>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio='none'
          width='100%'
          height='100%'
        >
          <defs>
            <linearGradient id='wal-area-grad' x1='0' x2='0' y1='0' y2='1'>
              <stop
                offset='0%'
                stopColor='var(--wal-blue-1)'
                stopOpacity='0.32'
              />
              <stop
                offset='100%'
                stopColor='var(--wal-blue-2)'
                stopOpacity='0'
              />
            </linearGradient>
            <linearGradient id='wal-line-grad' x1='0' x2='1' y1='0' y2='0'>
              <stop offset='0%' stopColor='var(--wal-blue-1)' />
              <stop offset='100%' stopColor='var(--wal-blue-2)' />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1='0'
              x2={W}
              y1={H * f}
              y2={H * f}
              stroke='var(--wal-line-soft)'
              strokeDasharray='3 3'
            />
          ))}
          <path d={area} fill='url(#wal-area-grad)' />
          <path
            d={path}
            fill='none'
            stroke='url(#wal-line-grad)'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          {peakPoint && peak > 0 && (
            <g>
              <circle
                cx={peakPoint.x}
                cy={peakPoint.y}
                r='5'
                fill='var(--wal-card)'
                stroke='var(--wal-blue-1)'
                strokeWidth='2.5'
              />
              <g
                transform={`translate(${Math.min(peakPoint.x, W - 100)}, ${Math.max(peakPoint.y - 22, 8)})`}
              >
                <rect
                  x='-2'
                  y='-14'
                  width='90'
                  height='20'
                  rx='6'
                  fill='var(--wal-ink-900)'
                />
                <text
                  x='43'
                  y='0'
                  fill='white'
                  fontSize='10'
                  fontWeight='600'
                  textAnchor='middle'
                  fontFamily='JetBrains Mono'
                >
                  {t('峰值')} ${peak.toFixed(2)}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default SpendTrend;
