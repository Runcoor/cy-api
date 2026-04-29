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
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { Globe2 } from 'lucide-react';

const headerIconBtnClass = '!w-8 !h-8 !p-0 flex items-center justify-center';
const headerIconBtnStyle = {
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-secondary)',
  background: 'transparent',
  transition: 'background-color 150ms ease-out, color 150ms ease-out',
};

const languages = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
];

const LanguageSelector = ({ currentLang, onLanguageChange, t }) => {
  return (
    <Dropdown
      position='bottomRight'
      render={
        <Dropdown.Menu style={{ padding: 4 }}>
          {languages.map((lang) => (
            <Dropdown.Item
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              style={{
                backgroundColor:
                  currentLang === lang.code
                    ? 'var(--accent-light)'
                    : 'transparent',
                fontWeight: currentLang === lang.code ? 600 : 400,
                color: 'var(--text-primary)',
                fontSize: '13px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {lang.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      }
    >
      <Button
        icon={<Globe2 size={16} />}
        aria-label={t('common.changeLanguage')}
        theme='borderless'
        type='tertiary'
        className={headerIconBtnClass}
        style={headerIconBtnStyle}
      />
    </Dropdown>
  );
};

export default LanguageSelector;
