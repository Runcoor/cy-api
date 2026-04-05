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
import { API, showError, showSuccess } from '../../helpers';
import { Button, Divider, Form, Typography } from '@douyinfe/semi-ui';
import React, { useState } from 'react';

const { Text } = Typography;

const TwoFAVerification = ({ onSuccess, onBack, isModal = false }) => {
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = async () => {
    if (!verificationCode) {
      showError('请输入验证码');
      return;
    }
    // Validate code format
    if (useBackupCode && verificationCode.length !== 8) {
      showError('备用码必须是8位');
      return;
    } else if (!useBackupCode && !/^\d{6}$/.test(verificationCode)) {
      showError('验证码必须是6位数字');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/api/user/login/2fa', {
        code: verificationCode,
      });

      if (res.data.success) {
        showSuccess('登录成功');
        // 保存用户信息到本地存储
        localStorage.setItem('user', JSON.stringify(res.data.data));
        if (onSuccess) {
          onSuccess(res.data.data);
        }
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const linkButtonStyle = {
    color: 'var(--accent)',
    padding: 0,
    fontSize: '13px',
    fontWeight: 500,
  };

  const hintBoxStyle = {
    marginTop: '20px',
    padding: '12px 14px',
    background: 'var(--surface-hover)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
  };

  const submitButtonStyle = {
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    border: 'none',
    height: '40px',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '16px',
  };

  if (isModal) {
    return (
      <div className='space-y-4'>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: '0 0 8px',
          }}
        >
          请输入认证器应用显示的验证码完成登录
        </p>

        <Form onSubmit={handleSubmit}>
          <Form.Input
            field='code'
            label={useBackupCode ? '备用码' : '验证码'}
            placeholder={useBackupCode ? '请输入8位备用码' : '请输入6位验证码'}
            value={verificationCode}
            onChange={setVerificationCode}
            onKeyPress={handleKeyPress}
            style={{ marginBottom: 16 }}
            autoFocus
          />

          <Button
            htmlType='submit'
            type='primary'
            theme='solid'
            loading={loading}
            block
            className='w-full'
            style={submitButtonStyle}
          >
            验证并登录
          </Button>
        </Form>

        <Divider
          style={{
            borderColor: 'var(--border-subtle)',
            margin: '12px 0',
          }}
        />

        <div style={{ textAlign: 'center' }}>
          <Button
            theme='borderless'
            type='tertiary'
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setVerificationCode('');
            }}
            style={{ ...linkButtonStyle, marginRight: 16 }}
          >
            {useBackupCode ? '使用认证器验证码' : '使用备用码'}
          </Button>

          {onBack && (
            <Button
              theme='borderless'
              type='tertiary'
              onClick={onBack}
              style={linkButtonStyle}
            >
              返回登录
            </Button>
          )}
        </div>

        <div style={hintBoxStyle}>
          <Text
            size='small'
            style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
          >
            <strong style={{ color: 'var(--text-secondary)' }}>提示：</strong>
            <br />
            • 验证码每30秒更新一次
            <br />
            • 如果无法获取验证码，请使用备用码
            <br />• 每个备用码只能使用一次
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div
      className='flex items-center justify-center py-12 px-4'
      style={{
        background: 'var(--bg-base)',
        minHeight: 'calc(100vh - var(--header-height))',
      }}
    >
      <div
        className='w-full'
        style={{
          maxWidth: '400px',
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
            两步验证
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              margin: '4px 0 0',
            }}
          >
            请输入认证器应用显示的验证码完成登录
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          <Form onSubmit={handleSubmit}>
            <Form.Input
              field='code'
              label={useBackupCode ? '备用码' : '验证码'}
              placeholder={
                useBackupCode ? '请输入8位备用码' : '请输入6位验证码'
              }
              value={verificationCode}
              onChange={setVerificationCode}
              onKeyPress={handleKeyPress}
              style={{ marginBottom: 16 }}
              autoFocus
            />

            <Button
              htmlType='submit'
              type='primary'
              theme='solid'
              loading={loading}
              className='w-full'
              style={submitButtonStyle}
            >
              验证并登录
            </Button>
          </Form>

          <Divider
            style={{
              borderColor: 'var(--border-subtle)',
              margin: '12px 0',
            }}
          />

          <div style={{ textAlign: 'center' }}>
            <Button
              theme='borderless'
              type='tertiary'
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setVerificationCode('');
              }}
              style={{ ...linkButtonStyle, marginRight: 16 }}
            >
              {useBackupCode ? '使用认证器验证码' : '使用备用码'}
            </Button>

            {onBack && (
              <Button
                theme='borderless'
                type='tertiary'
                onClick={onBack}
                style={linkButtonStyle}
              >
                返回登录
              </Button>
            )}
          </div>

          <div style={hintBoxStyle}>
            <Text
              size='small'
              style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
            >
              <strong style={{ color: 'var(--text-secondary)' }}>
                提示：
              </strong>
              <br />
              • 验证码每30秒更新一次
              <br />
              • 如果无法获取验证码，请使用备用码
              <br />• 每个备用码只能使用一次
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFAVerification;
