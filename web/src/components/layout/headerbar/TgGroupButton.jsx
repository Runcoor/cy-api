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
import { Button, Tooltip } from '@douyinfe/semi-ui';
import { SiTelegram } from 'react-icons/si';

const TG_BLUE = '#229ED9';

const TgGroupButton = ({ tgGroupLink, t }) => {
  if (!tgGroupLink) return null;

  return (
    <Tooltip content={t('加入 Telegram 群组')} position='bottom'>
      <Button
        aria-label={t('加入 Telegram 群组')}
        theme='borderless'
        type='tertiary'
        className='!w-8 !h-8 !p-0 flex items-center justify-center'
        style={{
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          transition: 'background-color 150ms ease-out',
        }}
        onClick={() => window.open(tgGroupLink, '_blank', 'noopener,noreferrer')}
        icon={<SiTelegram size={16} color={TG_BLUE} />}
      />
    </Tooltip>
  );
};

export default TgGroupButton;
