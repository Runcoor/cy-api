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
import {
  API,
  getLogo,
  showError,
  showInfo,
  showSuccess,
  getSystemName,
} from '../../helpers';
import Turnstile from 'react-turnstile';
import { Button, Form } from '@douyinfe/semi-ui';
import { IconMail } from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PasswordResetForm = () => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    email: '',
  });
  const { email } = inputs;

  const [loading, setLoading] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const logo = getLogo();
  const systemName = getSystemName();

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  }, []);

  useEffect(() => {
    let countdownInterval = null;
    if (disableButton && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setDisableButton(false);
      setCountdown(30);
    }
    return () => clearInterval(countdownInterval);
  }, [disableButton, countdown]);

  function handleChange(value) {
    setInputs((inputs) => ({ ...inputs, email: value }));
  }

  async function handleSubmit(e) {
    if (!email) {
      showError(t('请输入邮箱地址'));
      return;
    }
    if (turnstileEnabled && turnstileToken === '') {
      showInfo(t('请稍后几秒重试，Turnstile 正在检查用户环境！'));
      return;
    }
    setDisableButton(true);
    setLoading(true);
    const res = await API.get(
      `/api/reset_password?email=${email}&turnstile=${turnstileToken}`,
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('重置邮件发送成功，请检查邮箱！'));
      setInputs({ ...inputs, email: '' });
    } else {
      showError(message);
    }
    setLoading(false);
  }

  return (
    <div
      className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'
      style={{
        background: 'var(--bg-base)',
        minHeight: 'calc(100vh - var(--header-height))',
      }}
    >
      <div className='w-full max-w-sm'>
        <div className='flex flex-col items-center'>
          {/* Logo + system name */}
          <div className='flex items-center gap-2.5 mb-8'>
            <img
              src={logo}
              alt='Logo'
              style={{
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                objectFit: 'contain',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {systemName}
            </span>
          </div>

          {/* Card panel */}
          <div
            className='w-full'
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            <div
              className='text-center'
              style={{
                padding: '24px 24px 0',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {t('密码重置')}
              </h3>
              <p
                className='mt-1'
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  margin: '4px 0 0',
                }}
              >
                {t('请输入您的邮箱地址')}
              </p>
            </div>

            <div style={{ padding: '24px' }}>
              <Form className='space-y-4'>
                <Form.Input
                  field='email'
                  label={t('邮箱')}
                  placeholder={t('请输入您的邮箱地址')}
                  name='email'
                  value={email}
                  onChange={handleChange}
                  prefix={<IconMail />}
                />

                <Button
                  theme='solid'
                  type='primary'
                  htmlType='submit'
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={disableButton}
                  className='w-full'
                  style={{
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent)',
                    border: 'none',
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {disableButton
                    ? `${t('重试')} (${countdown})`
                    : t('提交')}
                </Button>
              </Form>

              <div
                className='mt-6 text-center'
                style={{ fontSize: '13px' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  {t('想起来了？')}{' '}
                </span>
                <Link
                  to='/login'
                  style={{
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  {t('登录')}
                </Link>
              </div>
            </div>
          </div>

          {turnstileEnabled && (
            <div className='flex justify-center mt-6'>
              <Turnstile
                sitekey={turnstileSiteKey}
                onVerify={(token) => {
                  setTurnstileToken(token);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetForm;
