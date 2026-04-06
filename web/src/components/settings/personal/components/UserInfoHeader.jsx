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
  Avatar,
  Tag,
  Divider,
} from '@douyinfe/semi-ui';
import {
  isRoot,
  isAdmin,
  renderQuota,
  stringToColor,
} from '../../../../helpers';
import { Coins, BarChart2, Users } from 'lucide-react';

const UserInfoHeader = ({ t, userState }) => {
  const getUsername = () => {
    if (userState.user) {
      return userState.user.username;
    } else {
      return 'null';
    }
  };

  const getAvatarText = () => {
    const username = getUsername();
    if (username && username.length > 0) {
      return username.slice(0, 2).toUpperCase();
    }
    return 'NA';
  };

  const getRoleLabel = () => {
    if (isRoot()) return t('超级管理员');
    if (isAdmin()) return t('管理员');
    return t('普通用户');
  };

  return (
    <div
      className='rounded-[var(--radius-lg)] border border-[var(--border-default)] overflow-hidden'
      style={{ background: 'var(--surface)' }}
    >
      {/* User profile header — macOS elevated surface */}
      <div
        className='px-6 py-5'
        style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className='flex items-center gap-4'>
          <Avatar size='large' color={stringToColor(getUsername())}>
            {getAvatarText()}
          </Avatar>
          <div className='flex-1 min-w-0'>
            <h2
              className='text-2xl sm:text-3xl font-bold truncate leading-tight'
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', margin: 0 }}
            >
              {getUsername()}
            </h2>
            <div className='flex flex-wrap items-center gap-2 mt-1.5'>
              <Tag
                size='small'
                shape='circle'
                style={{
                  color: 'var(--accent)',
                  background: 'var(--accent-light)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {getRoleLabel()}
              </Tag>
              <Tag
                size='small'
                shape='circle'
                style={{
                  color: 'var(--text-muted)',
                  background: 'var(--surface-active)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                ID: {userState?.user?.id}
              </Tag>
            </div>
          </div>
        </div>
      </div>

      {/* Balance + stats */}
      <div className='px-6 py-4'>
        <div className='flex items-start justify-between gap-6'>
          {/* Current balance */}
          <div>
            <div className='text-xs mb-1' style={{ color: 'var(--text-muted)' }}>
              {t('当前余额')}
            </div>
            <div
              className='text-2xl sm:text-3xl font-bold tracking-wide'
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
            >
              {renderQuota(userState?.user?.quota)}
            </div>
          </div>

          {/* Desktop stats */}
          <div className='hidden lg:block flex-shrink-0'>
            <div
              className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-2.5'
              style={{ background: 'var(--bg-subtle)' }}
            >
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Coins size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {t('历史消耗')}
                  </span>
                  <span className='text-xs font-semibold' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {renderQuota(userState?.user?.used_quota)}
                  </span>
                </div>
                <Divider layout='vertical' />
                <div className='flex items-center gap-2'>
                  <BarChart2 size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {t('请求次数')}
                  </span>
                  <span className='text-xs font-semibold' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {userState.user?.request_count || 0}
                  </span>
                </div>
                <Divider layout='vertical' />
                <div className='flex items-center gap-2'>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {t('用户分组')}
                  </span>
                  <span className='text-xs font-semibold' style={{ color: 'var(--text-primary)' }}>
                    {userState?.user?.group || t('默认')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile stats */}
        <div className='lg:hidden mt-3'>
          <div
            className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3'
            style={{ background: 'var(--bg-subtle)' }}
          >
            <div className='space-y-2.5'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Coins size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {t('历史消耗')}
                  </span>
                </div>
                <span className='text-xs font-semibold' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {renderQuota(userState?.user?.used_quota)}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <BarChart2 size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {t('请求次数')}
                  </span>
                </div>
                <span className='text-xs font-semibold' style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {userState.user?.request_count || 0}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {t('用户分组')}
                  </span>
                </div>
                <span className='text-xs font-semibold' style={{ color: 'var(--text-primary)' }}>
                  {userState?.user?.group || t('默认')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoHeader;
