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
import { useTranslation } from 'react-i18next';
import { Button } from '@douyinfe/semi-ui';
import { copy, showSuccess } from '../../../helpers';

/**
 * 解析密钥数据，支持多种格式
 * @param {string} keyData - 密钥数据
 * @param {Function} t - 翻译函数
 * @returns {Array} 解析后的密钥数组
 */
const parseChannelKeys = (keyData, t) => {
  if (!keyData) return [];

  const trimmed = keyData.trim();

  // 检查是否是JSON数组格式（如Vertex AI）
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          id: index,
          content:
            typeof item === 'string' ? item : JSON.stringify(item, null, 2),
          type: typeof item === 'string' ? 'text' : 'json',
          label: `${t('密钥')} ${index + 1}`,
        }));
      }
    } catch (e) {
      // 如果解析失败，按普通文本处理
      console.warn('Failed to parse JSON keys:', e);
    }
  }

  // 检查是否是多行密钥（按换行符分割）
  const lines = trimmed.split('\n').filter((line) => line.trim());
  if (lines.length > 1) {
    return lines.map((line, index) => ({
      id: index,
      content: line.trim(),
      type: 'text',
      label: `${t('密钥')} ${index + 1}`,
    }));
  }

  // 单个密钥
  return [
    {
      id: 0,
      content: trimmed,
      type: trimmed.startsWith('{') ? 'json' : 'text',
      label: t('密钥'),
    },
  ];
};

/**
 * 可复用的密钥显示组件
 */
const ChannelKeyDisplay = ({
  keyData,
  showSuccessIcon = true,
  successText,
  showWarning = true,
  warningText,
}) => {
  const { t } = useTranslation();

  const parsedKeys = parseChannelKeys(keyData, t);
  const isMultipleKeys = parsedKeys.length > 1;

  const handleCopyAll = () => {
    copy(keyData);
    showSuccess(t('所有密钥已复制到剪贴板'));
  };

  const handleCopyKey = (content) => {
    copy(content);
    showSuccess(t('密钥已复制到剪贴板'));
  };

  return (
    <div className='space-y-4'>
      {/* 成功状态 */}
      {showSuccessIcon && (
        <div className='flex items-center gap-2'>
          <svg
            style={{ width: 20, height: 20, color: 'var(--success)' }}
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
          <span style={{ fontWeight: 600, color: 'var(--success)' }}>
            {successText || t('验证成功')}
          </span>
        </div>
      )}

      {/* 密钥内容 */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {isMultipleKeys ? t('渠道密钥列表') : t('渠道密钥')}
          </span>
          {isMultipleKeys && (
            <div className='flex items-center gap-2'>
              <span
                style={{ color: 'var(--text-muted)', fontSize: '12px' }}
              >
                {t('共 {{count}} 个密钥', { count: parsedKeys.length })}
              </span>
              <Button
                size='small'
                type='primary'
                theme='outline'
                onClick={handleCopyAll}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}
              >
                {t('复制全部')}
              </Button>
            </div>
          )}
        </div>

        <div className='space-y-3 max-h-80 overflow-auto'>
          {parsedKeys.map((keyItem) => (
            <div
              key={keyItem.id}
              style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface)',
                padding: '12px',
              }}
            >
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span
                    style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px' }}
                  >
                    {keyItem.label}
                  </span>
                  <div className='flex items-center gap-2'>
                    {keyItem.type === 'json' && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '1px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          fontWeight: 500,
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(10, 132, 255, 0.12)',
                          color: 'var(--accent)',
                          lineHeight: '20px',
                        }}
                      >
                        {t('JSON')}
                      </span>
                    )}
                    <Button
                      size='small'
                      type='primary'
                      theme='outline'
                      icon={
                        <svg
                          style={{ width: 12, height: 12 }}
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path d='M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' />
                          <path d='M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z' />
                        </svg>
                      }
                      onClick={() => handleCopyKey(keyItem.content)}
                      style={{
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                      }}
                    >
                      {t('复制')}
                    </Button>
                  </div>
                </div>

                <div
                  className='max-h-40 overflow-auto'
                  style={{
                    background: 'var(--surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <code
                    style={{
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap',
                      color: 'var(--text-primary)',
                      background: 'transparent',
                    }}
                  >
                    {keyItem.content}
                  </code>
                </div>

                {keyItem.type === 'json' && (
                  <span
                    style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                    }}
                  >
                    {t('JSON格式密钥，请确保格式正确')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {isMultipleKeys && (
          <div
            style={{
              background: 'var(--accent-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{ color: 'var(--accent)', fontSize: '12px' }}
            >
              <svg
                style={{
                  width: 16,
                  height: 16,
                  display: 'inline',
                  marginRight: 4,
                  verticalAlign: 'text-bottom',
                }}
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                  clipRule='evenodd'
                />
              </svg>
              {t(
                '检测到多个密钥，您可以单独复制每个密钥，或点击复制全部获取完整内容。',
              )}
            </span>
          </div>
        )}
      </div>

      {/* 安全警告 */}
      {showWarning && (
        <div
          style={{
            background: 'var(--warning-light, rgba(255,149,0,0.1))',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className='flex items-start'>
            <svg
              style={{
                width: 20,
                height: 20,
                color: 'var(--warning)',
                marginTop: 2,
                marginRight: 12,
                flexShrink: 0,
              }}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
            <div>
              <span
                style={{ fontWeight: 600, color: 'var(--text-primary)' }}
              >
                {t('安全提醒')}
              </span>
              <span
                style={{
                  display: 'block',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  marginTop: 4,
                }}
              >
                {warningText ||
                  t(
                    '请妥善保管密钥信息，不要泄露给他人。如有安全疑虑，请及时更换密钥。',
                  )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelKeyDisplay;
