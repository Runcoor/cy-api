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

import React, { useMemo } from 'react';
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { SunMedium, MoonStar, MonitorSmartphone } from 'lucide-react';
import { useActualTheme } from '../../../context/Theme';

const headerIconBtnClass = '!w-8 !h-8 !p-0 flex items-center justify-center';
const headerIconBtnStyle = {
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-secondary)',
  background: 'transparent',
  transition: 'background-color 150ms ease-out, color 150ms ease-out',
};

const ThemeToggle = ({ theme, onThemeToggle, t }) => {
  const actualTheme = useActualTheme();

  const themeOptions = useMemo(
    () => [
      {
        key: 'light',
        icon: <SunMedium size={16} />,
        buttonIcon: <SunMedium size={16} />,
        label: t('浅色模式'),
        description: t('始终使用浅色主题'),
      },
      {
        key: 'dark',
        icon: <MoonStar size={16} />,
        buttonIcon: <MoonStar size={16} />,
        label: t('深色模式'),
        description: t('始终使用深色主题'),
      },
      {
        key: 'auto',
        icon: <MonitorSmartphone size={16} />,
        buttonIcon: <MonitorSmartphone size={16} />,
        label: t('自动模式'),
        description: t('跟随系统主题设置'),
      },
    ],
    [t],
  );

  const getItemStyle = (isSelected) => ({
    backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
    fontWeight: isSelected ? 600 : 400,
    borderRadius: 'var(--radius-sm)',
  });

  const currentButtonIcon = useMemo(() => {
    const currentOption = themeOptions.find((option) => option.key === theme);
    return currentOption?.buttonIcon || themeOptions[2].buttonIcon;
  }, [theme, themeOptions]);

  return (
    <Dropdown
      position='bottomRight'
      render={
        <Dropdown.Menu style={{ padding: 4 }}>
          {themeOptions.map((option) => (
            <Dropdown.Item
              key={option.key}
              icon={option.icon}
              onClick={() => onThemeToggle(option.key)}
              style={getItemStyle(theme === option.key)}
            >
              <div className='flex flex-col'>
                <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                  {option.label}
                </span>
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {option.description}
                </span>
              </div>
            </Dropdown.Item>
          ))}

          {theme === 'auto' && (
            <>
              <Dropdown.Divider />
              <div
                className='px-3 py-2 text-xs'
                style={{ color: 'var(--text-muted)' }}
              >
                {t('当前跟随系统')}：
                {actualTheme === 'dark' ? t('深色') : t('浅色')}
              </div>
            </>
          )}
        </Dropdown.Menu>
      }
    >
      <Button
        icon={currentButtonIcon}
        aria-label={t('切换主题')}
        theme='borderless'
        type='tertiary'
        className={headerIconBtnClass}
        style={headerIconBtnStyle}
      />
    </Dropdown>
  );
};

export default ThemeToggle;
