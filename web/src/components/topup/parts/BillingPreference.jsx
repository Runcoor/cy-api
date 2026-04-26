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

import React, { useState } from 'react';
import { WalIcons as I } from '../_shared/WalletPageStyles';

const BillingPreference = ({
  t,
  value,
  onChange,
  activeSubscription,
  subscriptionRemainingLabel,
  subscriptionResetLabel,
}) => {
  const [openTip, setOpenTip] = useState(null);

  const OPTIONS = [
    {
      id: 'subscription_first',
      title: t('优先订阅'),
      desc: t('先扣订阅额度，用尽后自动从钱包余额扣费'),
      tooltip: t(
        '当订阅额度耗尽，系统会无缝切换到钱包余额扣费，保证服务不中断。适合大多数订阅用户。',
      ),
      badge: t('推荐'),
    },
    {
      id: 'wallet_first',
      title: t('优先钱包'),
      desc: t('先扣钱包余额，钱包不足时使用订阅额度'),
      tooltip: t(
        '适合想先把钱包余额用完再走订阅的用户。钱包扣完后会自动切到订阅额度。',
      ),
      badge: null,
    },
    {
      id: 'subscription_only',
      title: t('仅用订阅'),
      desc: t('只使用订阅额度，额度耗尽则停止服务'),
      tooltip: t(
        '严格控制成本：订阅额度用完后，所有 API 请求会被拒绝，不会从钱包扣费。',
      ),
      badge: null,
    },
    {
      id: 'wallet_only',
      title: t('仅用钱包'),
      desc: t('只从钱包余额扣费，不使用订阅额度'),
      tooltip: t(
        '保留订阅额度备用：所有调用从钱包扣费，订阅额度作为后备资源不会被消耗。',
      ),
      badge: null,
    },
  ];

  return (
    <div className='wal-card wal-billing-card'>
      <div className='wal-card-head'>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.Settings style={{ color: 'var(--wal-blue-1)' }} /> {t('计费偏好')}
        </h3>
        <span className='wal-h-meta'>{t('实时生效 · 下一次调用即采用')}</span>
      </div>
      <div className='wal-billing-grid'>
        {OPTIONS.map((opt) => {
          const active = value === opt.id;
          return (
            <div
              key={opt.id}
              className={`wal-billing-opt ${active ? 'active' : ''}`}
              onClick={() => onChange?.(opt.id)}
            >
              <div className='wal-bo-radio'>
                <span className='wal-bo-dot' />
              </div>
              <div className='wal-bo-body'>
                <div className='wal-bo-title-row'>
                  <span className='wal-bo-title'>{opt.title}</span>
                  {opt.badge && (
                    <span className='wal-bo-badge'>{opt.badge}</span>
                  )}
                  <span
                    className='wal-bo-info'
                    onMouseEnter={() => setOpenTip(opt.id)}
                    onMouseLeave={() => setOpenTip(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTip(openTip === opt.id ? null : opt.id);
                    }}
                  >
                    <I.Info />
                    {openTip === opt.id && (
                      <span className='wal-bo-tooltip'>
                        <span className='wal-bo-tooltip-arrow' />
                        {opt.tooltip}
                      </span>
                    )}
                  </span>
                </div>
                <div className='wal-bo-desc'>{opt.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
      {activeSubscription ? (
        <div className='wal-billing-hint'>
          <I.Bolt
            style={{ width: 11, height: 11, color: 'var(--wal-blue-1)' }}
          />
          <span>
            {t('当前订阅')}: <strong>{activeSubscription}</strong>
            {subscriptionRemainingLabel ? (
              <>
                {' '}
                · {t('本月剩余')} <strong>{subscriptionRemainingLabel}</strong>
              </>
            ) : null}
            {subscriptionResetLabel ? (
              <>
                {' '}
                · {t('重置于')} {subscriptionResetLabel}
              </>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default BillingPreference;
