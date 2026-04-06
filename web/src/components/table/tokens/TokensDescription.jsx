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
import CompactModeToggle from '../../common/ui/CompactModeToggle';

const TokensDescription = ({ compactMode, setCompactMode, t }) => {
  return (
    <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
      <div className='flex items-center gap-2.5'>
        <div
          className='flex items-center justify-center'
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
          }}
        >
          <Key size={15} />
        </div>
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
      </div>

      <CompactModeToggle
        compactMode={compactMode}
        setCompactMode={setCompactMode}
        t={t}
      />
    </div>
  );
};

export default TokensDescription;
