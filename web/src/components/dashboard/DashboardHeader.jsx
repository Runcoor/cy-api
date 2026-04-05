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
import { Button } from '@douyinfe/semi-ui';
import { RefreshCw, Search } from 'lucide-react';

const DashboardHeader = ({
  getGreeting,
  greetingVisible,
  showSearchModal,
  refresh,
  loading,
  t,
}) => {
  const iconBtnStyle = {
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
  };

  return (
    <div className='flex items-center justify-between mb-4'>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '22px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          opacity: greetingVisible ? 1 : 0,
          transition: 'opacity 500ms ease-out',
        }}
      >
        {getGreeting}
      </h2>
      <div className='flex gap-2'>
        <Button
          type='tertiary'
          theme='borderless'
          icon={<Search size={16} />}
          onClick={showSearchModal}
          style={iconBtnStyle}
        />
        <Button
          type='tertiary'
          theme='borderless'
          icon={<RefreshCw size={16} />}
          onClick={refresh}
          loading={loading}
          style={iconBtnStyle}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;
