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
import { Modal, Input } from '@douyinfe/semi-ui';
import { IconBookmark } from '@douyinfe/semi-icons';

const BatchTagModal = ({
  showBatchSetTag,
  setShowBatchSetTag,
  batchSetChannelTag,
  batchSetTagValue,
  setBatchSetTagValue,
  selectedChannels,
  t,
}) => {
  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span
            className='w-6 h-6 flex items-center justify-center'
            style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            <IconBookmark size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('批量设置标签')}
          </span>
        </div>
      }
      visible={showBatchSetTag}
      onOk={batchSetChannelTag}
      onCancel={() => setShowBatchSetTag(false)}
      maskClosable={false}
      centered={true}
      size='small'
      okButtonProps={{
        style: { background: 'var(--accent-gradient)', color: '#fff', borderRadius: 'var(--radius-md)' },
      }}
      cancelButtonProps={{
        style: { borderRadius: 'var(--radius-md)', background: 'var(--surface-active)', color: 'var(--text-primary)' },
      }}
    >
      <p className='text-sm mb-3 mt-0' style={{ color: 'var(--text-secondary)' }}>
        {t('请输入要设置的标签名称')}
      </p>
      <Input
        placeholder={t('请输入标签名称')}
        value={batchSetTagValue}
        onChange={(v) => setBatchSetTagValue(v)}
      />
      <p className='text-xs mt-3 mb-0' style={{ color: 'var(--text-muted)' }}>
        {t('已选择 ${count} 个渠道').replace(
          '${count}',
          selectedChannels.length,
        )}
      </p>
    </Modal>
  );
};

export default BatchTagModal;
