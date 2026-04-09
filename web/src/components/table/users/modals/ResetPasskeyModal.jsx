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
import { Modal } from '@douyinfe/semi-ui';
import { IconKey } from '@douyinfe/semi-icons';

const ResetPasskeyModal = ({ visible, onCancel, onConfirm, user, t }) => {
  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span
            className='w-6 h-6 flex items-center justify-center'
            style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(255, 149, 0, 0.12)', color: 'var(--warning)' }}
          >
            <IconKey size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('确认重置 Passkey')}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      okButtonProps={{
        style: { background: 'var(--warning)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)' },
      }}
      cancelButtonProps={{
        style: { borderRadius: 'var(--radius-md)', background: 'var(--surface-active)', color: 'var(--text-primary)' },
      }}
    >
      <p className='text-sm m-0' style={{ color: 'var(--text-secondary)' }}>
        {t('此操作将解绑用户当前的 Passkey，下次登录需要重新注册。')}{' '}
        {user?.username
          ? t('目标用户：{{username}}', { username: user.username })
          : ''}
      </p>
    </Modal>
  );
};

export default ResetPasskeyModal;
