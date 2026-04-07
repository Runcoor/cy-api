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
import { Link2 } from 'lucide-react';

const ModelEndpoints = ({ modelData, endpointMap = {}, t }) => {
  const renderAPIEndpoints = () => {
    if (!modelData) return null;

    const mapping = endpointMap;
    const types = modelData.supported_endpoint_types || [];

    return types.map((type) => {
      const info = mapping[type] || {};
      let path = info.path || '';
      // 如果路径中包含 {model} 占位符，替换为真实模型名称
      if (path.includes('{model}')) {
        const modelName = modelData.model_name || modelData.modelName || '';
        path = path.replaceAll('{model}', modelName);
      }
      const method = info.method || 'POST';
      return (
        <div
          key={type}
          className='flex justify-between border-b border-dashed last:border-0 py-2 last:pb-0'
          style={{ borderColor: 'var(--border-default)' }}
        >
          <span className='flex items-center pr-5'>
            <span
              className='mr-2 flex-shrink-0'
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
              }}
            />
            {type}
            {path && '：'}
            {path && (
              <span className='mv-text-muted md:ml-1 break-all'>{path}</span>
            )}
          </span>
          {path && (
            <span className='mv-text-muted text-xs md:ml-1'>{method}</span>
          )}
        </div>
      );
    });
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
            background: 'rgba(175, 82, 222, 0.12)',
            color: '#AF52DE',
          }}
        >
          <Link2 size={16} />
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
            {t('API端点')}
          </span>
          <div className='text-xs text-mv-text-secondary'>
            {t('模型支持的接口端点信息')}
          </div>
        </div>
      </div>
      {renderAPIEndpoints()}
    </div>
  );
};

export default ModelEndpoints;
