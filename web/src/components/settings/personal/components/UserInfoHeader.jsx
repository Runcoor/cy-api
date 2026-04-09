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
import { isRoot, isAdmin, renderQuota } from '../../../../helpers';

// Default avatar placeholder — user will supply a custom image later,
// just drop it into /web/public/default-avatar.png (or similar path)
// and update DEFAULT_AVATAR below. For now we fall back to the logo.
const DEFAULT_AVATAR = '/favicon.svg';

const UserInfoHeader = ({ t, userState }) => {
  const username = userState?.user?.username || 'null';
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarSrc = userState?.user?.avatar || DEFAULT_AVATAR;

  const getRoleLabel = () => {
    if (isRoot()) return t('超级管理员');
    if (isAdmin()) return t('管理员');
    return t('普通用户');
  };

  const stats = [
    {
      label: t('当前余额'),
      value: renderQuota(userState?.user?.quota),
      accent: true,
      mono: true,
    },
    {
      label: t('历史消耗'),
      value: renderQuota(userState?.user?.used_quota),
      mono: true,
    },
    {
      label: t('请求次数'),
      value: userState?.user?.request_count || 0,
      mono: true,
    },
    {
      label: t('用户分组'),
      value: userState?.user?.group || t('默认'),
      hideOnMobile: true,
    },
  ];

  return (
    <header
      className='relative overflow-hidden'
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: 'clamp(24px, 4vw, 40px)',
        // Soft multi-stop gradient in the accent palette — light in light
        // mode, retains feel in dark mode via --accent-light token.
        background: `
          radial-gradient(
            at 85% 15%,
            color-mix(in srgb, var(--accent) 22%, transparent) 0%,
            transparent 55%
          ),
          radial-gradient(
            at 15% 100%,
            color-mix(in srgb, var(--accent) 14%, transparent) 0%,
            transparent 60%
          ),
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent) 8%, var(--surface)) 0%,
            var(--surface) 100%
          )
        `,
      }}
    >
      {/* Subtle mesh highlight in the top-right corner */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          background: 'var(--accent-gradient)',
          opacity: 0.12,
          filter: 'blur(60px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div
        className='flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10'
      >
        {/* Avatar — image with ring, falls back to logo if user has none */}
        <div
          className='relative flex-shrink-0'
          style={{
            width: 'clamp(88px, 10vw, 112px)',
            height: 'clamp(88px, 10vw, 112px)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              opacity: 0.18,
              filter: 'blur(8px)',
            }}
          />
          <div
            className='flex items-center justify-center'
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'var(--surface)',
              boxShadow:
                '0 12px 28px -8px rgba(0, 114, 255, 0.22), 0 0 0 3px color-mix(in srgb, var(--surface) 95%, transparent)',
              overflow: 'hidden',
            }}
          >
            {!avatarFailed ? (
              <img
                src={avatarSrc}
                alt={username}
                onError={() => setAvatarFailed(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              // final fallback — a neutral silhouette, no letters
              <svg
                width='48'
                height='48'
                viewBox='0 0 24 24'
                fill='none'
                stroke='var(--text-muted)'
                strokeWidth='1.6'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
              >
                <circle cx='12' cy='8' r='4' />
                <path d='M6 21a6 6 0 0 1 12 0' />
              </svg>
            )}
          </div>
        </div>

        {/* Text + stats */}
        <div className='flex-grow min-w-0 text-center md:text-left'>
          <h1
            className='tracking-tight mb-1'
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
              fontSize: 'clamp(24px, 3.4vw, 32px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            {username}
          </h1>
          <p
            className='mb-5'
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-muted)',
              letterSpacing: 0,
            }}
          >
            @{username} · {getRoleLabel()}
          </p>

          {/* Stat chips */}
          <div className='flex flex-wrap justify-center md:justify-start gap-2.5'>
            {stats.map((s) => (
              <div
                key={s.label}
                className={s.hideOnMobile ? 'hidden sm:block' : ''}
                style={{
                  padding: '10px 16px',
                  background:
                    'color-mix(in srgb, var(--surface) 88%, transparent)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  minWidth: 104,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 6,
                    marginBottom: 0,
                    color: s.accent
                      ? 'var(--accent)'
                      : 'var(--text-primary)',
                    fontFamily: s.mono
                      ? 'var(--font-mono)'
                      : '-apple-system, BlinkMacSystemFont, sans-serif',
                    letterSpacing: s.mono ? 0 : '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserInfoHeader;
