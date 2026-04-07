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
import { Info } from 'lucide-react';
import { stringToColor } from '../../../../../helpers';

// iOS-style inline badge helper
const InlineBadge = ({ color, bg, children, style: extraStyle, ...rest }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '1px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '12px',
      fontWeight: 500,
      color: color || 'var(--text-secondary)',
      background: bg || 'var(--surface-active)',
      lineHeight: '20px',
      whiteSpace: 'nowrap',
      ...extraStyle,
    }}
    {...rest}
  >
    {children}
  </span>
);

const ModelBasicInfo = ({ modelData, vendorsMap = {}, t }) => {
  // 获取模型描述（使用后端真实数据）
  const getModelDescription = () => {
    if (!modelData) return t('暂无模型描述');

    // 优先使用后端提供的描述
    if (modelData.description) {
      return modelData.description;
    }

    // 如果没有描述但有供应商描述，显示供应商信息
    if (modelData.vendor_description) {
      return t('供应商信息：') + modelData.vendor_description;
    }

    return t('暂无模型描述');
  };

  // 获取模型标签
  const getModelTags = () => {
    const tags = [];

    if (modelData?.tags) {
      const customTags = modelData.tags.split(',').filter((tag) => tag.trim());
      customTags.forEach((tag) => {
        const tagText = tag.trim();
        tags.push({ text: tagText, color: stringToColor(tagText) });
      });
    }

    return tags;
  };

  return (
    <div
      className='mb-6 p-4'
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className='flex items-center mb-4'>
        <div
          className='w-8 h-8 flex items-center justify-center mr-2 flex-shrink-0'
          style={{
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 122, 255, 0.12)',
            color: 'var(--accent)',
          }}
        >
          <Info size={16} />
        </div>
        <div>
          <span
            className='text-lg font-medium block'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {t('基本信息')}
          </span>
          <div className='text-xs text-mv-text-secondary'>
            {t('模型的详细描述和基本特性')}
          </div>
        </div>
      </div>
      <div className='mv-text-secondary'>
        <p className='mb-4'>{getModelDescription()}</p>
        {getModelTags().length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {getModelTags().map((tag, index) => (
              <InlineBadge key={index} color={tag.color} bg={`${tag.color}1F`}>
                {tag.text}
              </InlineBadge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelBasicInfo;
