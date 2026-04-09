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
import { Key } from 'lucide-react';

const TokensDescription = ({ tokenCount, t }) => {
  return (
    <div className='flex items-center gap-2.5'>
      <div
        className='flex items-center justify-center'
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-light)',
          color: 'var(--accent)',
        }}
      >
        <Key size={16} />
      </div>
      <div className='flex flex-col gap-0.5'>
        <h3
          className='text-sm font-semibold leading-tight'
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {t('令牌管理')}
        </h3>
        {typeof tokenCount === 'number' && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {t('共')} {tokenCount} {t('个令牌')}
          </span>
        )}
      </div>
    </div>
  );
};

export default TokensDescription;
