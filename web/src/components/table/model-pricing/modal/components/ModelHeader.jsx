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
import { Toast } from '@douyinfe/semi-ui';
import { Copy } from 'lucide-react';
import { getLobeHubIcon, stringToColor, copy } from '../../../../../helpers';

const CARD_STYLES = {
  container:
    'w-12 h-12 flex items-center justify-center relative',
  icon: 'w-8 h-8 flex items-center justify-center',
};

const ModelHeader = ({ modelData, vendorsMap = {}, t }) => {
  // 获取模型图标（优先模型图标，其次供应商图标）
  const getModelIcon = () => {
    // 1) 优先使用模型自定义图标
    if (modelData?.icon) {
      return (
        <div className={CARD_STYLES.container}>
          <div className={CARD_STYLES.icon}>
            {getLobeHubIcon(modelData.icon, 32)}
          </div>
        </div>
      );
    }
    // 2) 退化为供应商图标
    if (modelData?.vendor_icon) {
      return (
        <div className={CARD_STYLES.container}>
          <div className={CARD_STYLES.icon}>
            {getLobeHubIcon(modelData.vendor_icon, 32)}
          </div>
        </div>
      );
    }

    // 如果没有供应商图标，使用模型名称生成 tinted square
    const avatarText = modelData?.model_name?.slice(0, 2).toUpperCase() || 'AI';
    const bgColor = stringToColor(modelData?.model_name || 'AI');
    return (
      <div className={CARD_STYLES.container}>
        <div
          className='w-12 h-12 flex items-center justify-center text-base font-semibold'
          style={{
            borderRadius: 'var(--radius-lg)',
            background: `${bgColor}1A`,
            color: bgColor,
          }}
        >
          {avatarText}
        </div>
      </div>
    );
  };

  const handleCopy = async () => {
    const ok = await copy(modelData?.model_name || '');
    if (ok) {
      Toast.success({ content: t('已复制模型名称') });
    }
  };

  return (
    <div className='flex items-center'>
      {getModelIcon()}
      <div className='ml-3 flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <span
            className='truncate text-base font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              maxWidth: '280px',
            }}
          >
            {modelData?.model_name || t('未知模型')}
          </span>
          <button
            onClick={handleCopy}
            className='flex items-center justify-center w-6 h-6 flex-shrink-0'
            style={{
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 150ms ease-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            title={t('复制')}
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelHeader;
