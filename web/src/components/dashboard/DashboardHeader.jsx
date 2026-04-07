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
import { RefreshCw, Search } from 'lucide-react';

const DashboardHeader = ({
  getGreeting,
  greetingVisible,
  showSearchModal,
  refresh,
  loading,
  t,
}) => {
  const iconBtnBaseStyle = {
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <div className='flex items-center justify-between mb-5'>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '22px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          opacity: greetingVisible ? 1 : 0,
          transition: 'opacity 500ms ease-out',
          margin: 0,
        }}
      >
        {getGreeting}
      </h2>
      <div className='flex items-center gap-1'>
        <button
          className='w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150'
          style={iconBtnBaseStyle}
          onClick={showSearchModal}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Search size={16} />
        </button>
        <button
          className='w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150'
          style={iconBtnBaseStyle}
          onClick={refresh}
          disabled={loading}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <RefreshCw size={16} style={loading ? { opacity: 0.4 } : undefined} />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
