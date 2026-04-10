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

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Dropdown } from '@douyinfe/semi-ui';
import { ChevronDown } from 'lucide-react';
import {
  IconExit,
  IconUserSetting,
  IconCreditCard,
  IconKey,
} from '@douyinfe/semi-icons';
import { stringToColor } from '../../../helpers';
import SkeletonWrapper from '../components/SkeletonWrapper';

const menuItemStyle = {
  fontSize: '13px',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius-sm)',
};

const menuIconStyle = {
  color: 'var(--text-muted)',
};

const UserArea = ({
  userState,
  isLoading,
  isMobile,
  isSelfUseMode,
  logout,
  navigate,
  t,
}) => {
  const dropdownRef = useRef(null);
  if (isLoading) {
    return (
      <SkeletonWrapper
        loading={true}
        type='userArea'
        width={50}
        isMobile={isMobile}
      />
    );
  }

  if (userState.user) {
    return (
      <div className='relative' ref={dropdownRef}>
        <Dropdown
          position='bottomRight'
          getPopupContainer={() => dropdownRef.current}
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={logout}
                style={{ ...menuItemStyle, color: 'var(--error)' }}
              >
                <div className='flex items-center gap-2'>
                  <IconExit size='small' style={{ color: 'var(--error)' }} />
                  <span>{t('退出')}</span>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button
            theme='borderless'
            type='tertiary'
            className='!px-2 !py-1'
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              transition: 'background-color 150ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className='text-xs font-medium'
                style={{ color: 'var(--text-primary)' }}
              >
                {userState.user.username}
              </span>
              <ChevronDown
                size={12}
                style={{ color: 'var(--text-muted)', flexShrink: 0 }}
              />
            </div>
          </Button>
        </Dropdown>
      </div>
    );
  } else {
    const showRegisterButton = !isSelfUseMode;

    return (
      <div className='flex items-center gap-1.5'>
        <Link to='/login' style={{ textDecoration: 'none' }}>
          <Button
            theme='borderless'
            type='tertiary'
            size='small'
            style={{
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              transition: 'background-color 150ms ease-out, color 150ms ease-out',
              fontSize: '13px',
              padding: '4px 12px',
            }}
          >
            {t('登录')}
          </Button>
        </Link>
        {showRegisterButton && (
          <div className='hidden md:block'>
            <Link to='/register' style={{ textDecoration: 'none' }}>
              <Button
                theme='solid'
                type='primary'
                size='small'
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  padding: '4px 12px',
                }}
              >
                {t('注册')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }
};

export default UserArea;
