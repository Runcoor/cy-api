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
import { useTranslation } from 'react-i18next';
import { useTokenKeys } from '../../hooks/chat/useTokenKeys';

const bars = Array.from({ length: 12 });

const chat2page = () => {
  const { t } = useTranslation();
  const { keys, chatLink, serverAddress, isLoading } = useTokenKeys();

  const comLink = (key) => {
    if (!chatLink || !serverAddress || !key) return '';
    return `${chatLink}/#/?settings={"key":"sk-${key}","url":"${encodeURIComponent(serverAddress)}"}`;
  };

  if (keys.length > 0) {
    const redirectLink = comLink(keys[0]);
    if (redirectLink) {
      window.location.href = redirectLink;
    }
  }

  return (
    <div
      className='flex flex-col items-center justify-center gap-3'
      style={{
        minHeight: '320px',
        background: 'var(--bg-base)',
      }}
    >
      <div className='mv-loader mv-loader-medium'>
        {bars.map((_, i) => (
          <span key={i} className='mv-loader-bar' />
        ))}
      </div>
      <p
        className='text-sm mt-2'
        style={{
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {t('加载中...')}
      </p>
    </div>
  );
};

export default chat2page;
