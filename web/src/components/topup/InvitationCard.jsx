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
import {
  Button,
  Input,
} from '@douyinfe/semi-ui';
import { Copy, Users, BarChart2, TrendingUp, Gift, Zap } from 'lucide-react';

const InvitationCard = ({
  t,
  userState,
  renderQuota,
  setOpenTransfer,
  affLink,
  handleAffLinkClick,
}) => {
  return (
    <div
      className='rounded-[var(--radius-lg)] border border-[var(--border-default)]'
      style={{ background: 'var(--surface)' }}
    >
      {/* Card header — macOS panel style */}
      <div className='px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3'>
        <div
          className='w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center'
          style={{ background: 'var(--accent-light)' }}
        >
          <Gift size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h3
            className='text-base font-semibold leading-tight'
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {t('邀请奖励')}
          </h3>
          <p className='text-xs mt-0.5' style={{ color: 'var(--text-muted)' }}>
            {t('邀请好友获得额外奖励')}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className='p-5 space-y-4'>

        {/* Earnings Stats Panel — macOS elevated surface */}
        <div
          className='rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden'
          style={{ background: 'var(--bg-subtle)' }}
        >
          {/* Stats header with transfer button */}
          <div className='px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between'>
            <span
              className='text-sm font-semibold'
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
            >
              {t('收益统计')}
            </span>
            <Button
              type='primary'
              theme='solid'
              size='small'
              disabled={
                !userState?.user?.aff_quota ||
                userState?.user?.aff_quota <= 0
              }
              onClick={() => setOpenTransfer(true)}
              className='!rounded-[var(--radius-md)]'
            >
              <Zap size={12} className='mr-1' />
              {t('划转到余额')}
            </Button>
          </div>

          {/* Stats grid */}
          <div className='grid grid-cols-3 divide-x divide-[var(--border-subtle)]'>
            {/* Pending earnings */}
            <div className='px-4 py-4 text-center'>
              <div
                className='text-base sm:text-xl font-bold mb-1'
                style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}
              >
                {renderQuota(userState?.user?.aff_quota || 0)}
              </div>
              <div className='flex items-center justify-center gap-1'>
                <TrendingUp size={12} style={{ color: 'var(--text-muted)' }} />
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {t('待使用收益')}
                </span>
              </div>
            </div>

            {/* Total earnings */}
            <div className='px-4 py-4 text-center'>
              <div
                className='text-base sm:text-xl font-bold mb-1'
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {renderQuota(userState?.user?.aff_history_quota || 0)}
              </div>
              <div className='flex items-center justify-center gap-1'>
                <BarChart2 size={12} style={{ color: 'var(--text-muted)' }} />
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {t('总收益')}
                </span>
              </div>
            </div>

            {/* Invited count */}
            <div className='px-4 py-4 text-center'>
              <div
                className='text-base sm:text-xl font-bold mb-1'
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {userState?.user?.aff_count || 0}
              </div>
              <div className='flex items-center justify-center gap-1'>
                <Users size={12} style={{ color: 'var(--text-muted)' }} />
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {t('邀请人数')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invitation link */}
        <div
          className='rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-4'
          style={{ background: 'var(--bg-subtle)' }}
        >
          <Input
            value={affLink}
            readonly
            className='!rounded-[var(--radius-md)]'
            prefix={
              <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                {t('邀请链接')}
              </span>
            }
            suffix={
              <Button
                type='primary'
                theme='solid'
                onClick={handleAffLinkClick}
                icon={<Copy size={14} />}
                className='!rounded-[var(--radius-md)]'
                size='small'
              >
                {t('复制')}
              </Button>
            }
          />
        </div>

        {/* Reward description */}
        <div
          className='rounded-[var(--radius-lg)] border border-[var(--border-subtle)]'
          style={{ background: 'var(--surface)' }}
        >
          <div className='px-5 py-3 border-b border-[var(--border-subtle)]'>
            <span
              className='text-sm font-semibold'
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
            >
              {t('奖励说明')}
            </span>
          </div>
          <div className='p-4 space-y-3'>
            <div className='flex items-start gap-3'>
              <div
                className='w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0'
                style={{ background: 'var(--success)' }}
              />
              <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>
                {t('邀请好友注册，好友充值后您可获得相应奖励')}
              </span>
            </div>

            <div className='flex items-start gap-3'>
              <div
                className='w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0'
                style={{ background: 'var(--success)' }}
              />
              <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>
                {t('通过划转功能将奖励额度转入到您的账户余额中')}
              </span>
            </div>

            <div className='flex items-start gap-3'>
              <div
                className='w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0'
                style={{ background: 'var(--success)' }}
              />
              <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>
                {t('邀请的好友越多，获得的奖励越多')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationCard;
