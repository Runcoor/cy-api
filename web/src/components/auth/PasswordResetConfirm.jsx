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
  copy,
  showError,
  showNotice,
  getLogo,
  getSystemName,
} from '../../helpers';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Form, Banner } from '@douyinfe/semi-ui';
import { IconMail, IconLock, IconCopy } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const PasswordResetConfirm = () => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    email: '',
    token: '',
  });
  const { email, token } = inputs;
  const isValidResetLink = email && token;

  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [newPassword, setNewPassword] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [formApi, setFormApi] = useState(null);

  const logo = getLogo();
  const systemName = getSystemName();

  useEffect(() => {
    let token = searchParams.get('token');
    let email = searchParams.get('email');
    setInputs({
      token: token || '',
      email: email || '',
    });
    if (formApi) {
      formApi.setValues({
        email: email || '',
        newPassword: newPassword || '',
      });
    }
  }, [searchParams, newPassword, formApi]);

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

  async function handleSubmit(e) {
    if (!email || !token) {
      showError(t('无效的重置链接，请重新发起密码重置请求'));
      return;
    }
    setDisableButton(true);
    setLoading(true);
    const res = await API.post(`/api/user/reset`, {
      email,
      token,
    });
    const { success, message } = res.data;
    if (success) {
      let password = res.data.data;
      setNewPassword(password);
      await copy(password);
      showNotice(`${t('密码已重置并已复制到剪贴板：')} ${password}`);
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
                {t('密码重置确认')}
              </h3>
              <p
                className='mt-1'
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  margin: '4px 0 0',
                }}
              >
                {isValidResetLink
                  ? t('确认重置您的账户密码')
                  : t('无效的重置链接')}
              </p>
            </div>

            <div style={{ padding: '24px' }}>
              {!isValidResetLink && (
                <Banner
                  type='danger'
                  description={t('无效的重置链接，请重新发起密码重置请求')}
                  closeIcon={null}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                  }}
                />
              )}

              <Form
                getFormApi={(api) => setFormApi(api)}
                initValues={{
                  email: email || '',
                  newPassword: newPassword || '',
                }}
                className='space-y-4'
              >
                <Form.Input
                  field='email'
                  label={t('邮箱')}
                  name='email'
                  disabled={true}
                  prefix={<IconMail />}
                  placeholder={email ? '' : t('等待获取邮箱信息...')}
                />

                {newPassword && (
                  <Form.Input
                    field='newPassword'
                    label={t('新密码')}
                    name='newPassword'
                    disabled={true}
                    prefix={<IconLock />}
                    suffix={
                      <Button
                        icon={<IconCopy />}
                        type='tertiary'
                        theme='borderless'
                        size='small'
                        onClick={async () => {
                          await copy(newPassword);
                          showNotice(
                            `${t('密码已复制到剪贴板：')} ${newPassword}`,
                          );
                        }}
                        style={{
                          color: 'var(--accent)',
                          fontSize: '13px',
                        }}
                      >
                        {t('复制')}
                      </Button>
                    }
                  />
                )}

                <Button
                  theme='solid'
                  type='primary'
                  htmlType='submit'
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={
                    disableButton || newPassword || !isValidResetLink
                  }
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
                  {newPassword ? t('密码重置完成') : t('确认重置密码')}
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
                  {t('返回登录')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirm;
