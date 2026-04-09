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

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Button,
  Input,
  Banner,
} from '@douyinfe/semi-ui';
import { IconKey } from '@douyinfe/semi-icons';
import { API, copy, showError, showSuccess } from '../../../../helpers';

const CodexOAuthModal = ({ visible, onCancel, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [authorizeUrl, setAuthorizeUrl] = useState('');
  const [input, setInput] = useState('');

  const startOAuth = async () => {
    setLoading(true);
    try {
      const res = await API.post(
        '/api/channel/codex/oauth/start',
        {},
        { skipErrorHandler: true },
      );
      if (!res?.data?.success) {
        console.error('Codex OAuth start failed:', res?.data?.message);
        throw new Error(t('启动授权失败'));
      }
      const url = res?.data?.data?.authorize_url || '';
      if (!url) {
        console.error(
          'Codex OAuth start response missing authorize_url:',
          res?.data,
        );
        throw new Error(t('响应缺少授权链接'));
      }
      setAuthorizeUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
      showSuccess(t('已打开授权页面'));
    } catch (error) {
      showError(error?.message || t('启动授权失败'));
    } finally {
      setLoading(false);
    }
  };

  const completeOAuth = async () => {
    if (!input || !input.trim()) {
      showError(t('请先粘贴回调 URL'));
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(
        '/api/channel/codex/oauth/complete',
        { input },
        { skipErrorHandler: true },
      );
      if (!res?.data?.success) {
        console.error('Codex OAuth complete failed:', res?.data?.message);
        throw new Error(t('授权失败'));
      }

      const key = res?.data?.data?.key || '';
      if (!key) {
        console.error('Codex OAuth complete response missing key:', res?.data);
        throw new Error(t('响应缺少凭据'));
      }

      onSuccess && onSuccess(key);
      showSuccess(t('已生成授权凭据'));
      onCancel && onCancel();
    } catch (error) {
      showError(error?.message || t('授权失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    setAuthorizeUrl('');
    setInput('');
  }, [visible]);

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span
            className='w-6 h-6 flex items-center justify-center'
            style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            <IconKey size={14} />
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('Codex 授权')}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      maskClosable={false}
      closeOnEsc
      width={720}
      footer={
        <div className='flex justify-end gap-2'>
          <Button
            theme='borderless'
            onClick={onCancel}
            disabled={loading}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-active)', color: 'var(--text-primary)' }}
          >
            {t('取消')}
          </Button>
          <Button
            theme='solid'
            onClick={completeOAuth}
            loading={loading}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', color: '#fff' }}
          >
            {t('生成并填入')}
          </Button>
        </div>
      }
    >
      <div className='space-y-4'>
        <Banner
          type='info'
          description={t(
            '1) 点击「打开授权页面」完成登录；2) 浏览器会跳转到 localhost（页面打不开也没关系）；3) 复制地址栏完整 URL 粘贴到下方；4) 点击「生成并填入」。',
          )}
        />

        <div className='flex items-center gap-2 flex-wrap'>
          <Button
            onClick={startOAuth}
            loading={loading}
            style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', color: '#fff' }}
          >
            {t('打开授权页面')}
          </Button>
          <Button
            theme='outline'
            disabled={!authorizeUrl || loading}
            onClick={() => copy(authorizeUrl)}
            style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}
          >
            {t('复制授权链接')}
          </Button>
        </div>

        <Input
          value={input}
          onChange={(value) => setInput(value)}
          placeholder={t('请粘贴完整回调 URL（包含 code 与 state）')}
          showClear
        />

        <p className='text-xs m-0' style={{ color: 'var(--text-muted)' }}>
          {t(
            '说明：生成结果是可直接粘贴到渠道密钥里的 JSON（包含 access_token / refresh_token / account_id）。',
          )}
        </p>
      </div>
    </Modal>
  );
};

export default CodexOAuthModal;
