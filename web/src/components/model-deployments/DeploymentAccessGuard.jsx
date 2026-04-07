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
import { Button } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Settings, Server, AlertCircle, WifiOff } from 'lucide-react';

const DeploymentAccessGuard = ({
  children,
  loading,
  isEnabled,
  connectionLoading,
  connectionOk,
  connectionError,
  onRetry,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    navigate('/console/setting?tab=model-deployment');
  };

  if (loading) {
    return (
      <div
        className='px-4 flex items-center justify-center'
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        <div className='text-center'>
          <div className='mv-loader mx-auto mb-4' />
          <p className='text-sm' style={{ color: 'var(--text-muted)' }}>
            {t('加载设置中...')}
          </p>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div
        className='px-4 flex items-center justify-center'
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div
            className='rounded-[var(--radius-lg)]'
            style={{
              padding: '48px 32px',
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            {/* Icon — restrained */}
            <div
              className='mx-auto mb-5 flex items-center justify-center'
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--warning-light)',
              }}
            >
              <AlertCircle size={32} color='var(--warning)' />
            </div>

            {/* Title — serif */}
            <h2
              className='text-xl font-semibold mb-2'
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
              }}
            >
              {t('模型部署服务未启用')}
            </h2>
            <p
              className='text-sm mb-6'
              style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
            >
              {t('访问模型部署功能需要先启用 io.net 部署服务')}
            </p>

            {/* Requirements card */}
            <div
              className='rounded-[var(--radius-md)] text-left mb-6'
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
              }}
            >
              <div
                className='flex items-center gap-2 px-4 py-3'
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div
                  className='flex items-center justify-center'
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-light)',
                  }}
                >
                  <Server size={16} color='var(--accent)' />
                </div>
                <span
                  className='text-sm font-medium'
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t('需要配置的项目')}
                </span>
              </div>
              <div className='px-4 py-3 flex flex-col gap-3'>
                {[
                  t('启用 io.net 部署开关'),
                  t('配置有效的 io.net API Key'),
                ].map((item) => (
                  <div key={item} className='flex items-center gap-3'>
                    <div
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className='text-sm'
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action button — accent */}
            <Button
              type='primary'
              icon={<Settings size={16} />}
              onClick={handleGoToSettings}
              className='!rounded-[var(--radius-md)] mb-4'
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
              }}
            >
              {t('前往设置页面')}
            </Button>

            {/* Hint */}
            <p
              className='text-xs'
              style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}
            >
              {t('配置完成后刷新页面即可使用模型部署功能')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (connectionLoading || (connectionOk === null && !connectionError)) {
    return (
      <div
        className='px-4 flex items-center justify-center'
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        <div className='text-center'>
          <div className='mv-loader mx-auto mb-4' />
          <p className='text-sm' style={{ color: 'var(--text-muted)' }}>
            {t('正在检查 io.net 连接...')}
          </p>
        </div>
      </div>
    );
  }

  if (connectionOk === false) {
    const isExpired = connectionError?.type === 'expired';
    const title = isExpired ? t('接口密钥已过期') : t('无法连接 io.net');
    const description = isExpired
      ? t('当前 API 密钥已过期，请在设置中更新。')
      : t('当前配置无法连接到 io.net。');
    const detail = connectionError?.message || '';

    return (
      <div
        className='px-4 flex items-center justify-center'
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div
            className='rounded-[var(--radius-lg)]'
            style={{
              padding: '48px 32px',
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            {/* Icon — restrained error */}
            <div
              className='mx-auto mb-5 flex items-center justify-center'
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--error-light)',
              }}
            >
              <WifiOff size={32} color='var(--error)' />
            </div>

            {/* Title — serif */}
            <h2
              className='text-xl font-semibold mb-2'
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
              }}
            >
              {title}
            </h2>
            <p
              className='text-sm mb-1'
              style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
            >
              {description}
            </p>
            {detail && (
              <p
                className='text-xs mb-6'
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {detail}
              </p>
            )}

            {/* Actions */}
            <div className='flex gap-3 justify-center mt-6'>
              <Button
                type='primary'
                icon={<Settings size={16} />}
                onClick={handleGoToSettings}
                className='!rounded-[var(--radius-md)]'
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {t('前往设置')}
              </Button>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className='!rounded-[var(--radius-md)]'
                  style={{
                    background: 'var(--surface-active)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {t('重试连接')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default DeploymentAccessGuard;
