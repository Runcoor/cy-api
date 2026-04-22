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

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import {
  API,
  getLogo,
  showError,
  showInfo,
  showSuccess,
  updateAPI,
  getSystemName,
  getOAuthProviderIcon,
  setUserData,
  onGitHubOAuthClicked,
  onDiscordOAuthClicked,
  onOIDCClicked,
  onLinuxDOOAuthClicked,
  onCustomOAuthClicked,
  prepareCredentialRequestOptions,
  buildAssertionResult,
  isPasskeySupported,
} from '../../helpers';
import Turnstile from 'react-turnstile';
import {
  Button,
  Checkbox,
  Divider,
  Form,
  Icon,
  Modal,
} from '@douyinfe/semi-ui';
import TelegramLoginButton from 'react-telegram-login';

import {
  IconGithubLogo,
  IconMail,
  IconLock,
  IconKey,
} from '@douyinfe/semi-icons';
import OIDCIcon from '../common/logo/OIDCIcon';
import WeChatIcon from '../common/logo/WeChatIcon';
import LinuxDoIcon from '../common/logo/LinuxDoIcon';
import TwoFAVerification from './TwoFAVerification';
import { useTranslation } from 'react-i18next';
import { SiDiscord, SiTelegram } from 'react-icons/si';
import AuthLayout from './AuthLayout';

/* ─── Shared style constants ─── */
const oauthBtnStyle = {
  borderRadius: 12,
  border: '1px solid var(--border-default)',
  background: 'var(--surface)',
  height: 48,
  transition: 'all 150ms ease-out',
  width: '100%',
};

const oauthBtnTextStyle = {
  marginLeft: 10,
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 500,
};

const accentLinkStyle = {
  color: 'var(--accent)',
  textDecoration: 'none',
  fontWeight: 600,
};

const LoginForm = () => {
  let navigate = useNavigate();
  const { t } = useTranslation();
  const githubButtonTextKeyByState = {
    idle: '使用 GitHub 继续',
    redirecting: '正在跳转 GitHub...',
    timeout: '请求超时，请刷新页面后重新发起 GitHub 登录',
  };
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    wechat_verification_code: '',
  });
  const { username, password } = inputs;
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showWeChatLoginModal, setShowWeChatLoginModal] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [oidcLoading, setOidcLoading] = useState(false);
  const [linuxdoLoading, setLinuxdoLoading] = useState(false);
  const [emailLoginLoading, setEmailLoginLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [otherLoginOptionsLoading, setOtherLoginOptionsLoading] = useState(false);
  const [wechatCodeSubmitLoading, setWechatCodeSubmitLoading] = useState(false);
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasUserAgreement, setHasUserAgreement] = useState(false);
  const [hasPrivacyPolicy, setHasPrivacyPolicy] = useState(false);
  const [githubButtonState, setGithubButtonState] = useState('idle');
  const [githubButtonDisabled, setGithubButtonDisabled] = useState(false);
  const githubTimeoutRef = useRef(null);
  const githubButtonText = t(githubButtonTextKeyByState[githubButtonState]);
  const [customOAuthLoading, setCustomOAuthLoading] = useState({});

  const logo = getLogo();
  const systemName = getSystemName();

  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }

  const status = useMemo(() => {
    if (statusState?.status) return statusState.status;
    const savedStatus = localStorage.getItem('status');
    if (!savedStatus) return {};
    try {
      return JSON.parse(savedStatus) || {};
    } catch (err) {
      return {};
    }
  }, [statusState?.status]);
  const hasCustomOAuthProviders = (status.custom_oauth_providers || []).length > 0;
  const hasOAuthLoginOptions = Boolean(
    status.github_oauth ||
    status.discord_oauth ||
    status.oidc_enabled ||
    status.wechat_login ||
    status.linuxdo_oauth ||
    status.telegram_oauth ||
    hasCustomOAuthProviders,
  );

  useEffect(() => {
    if (status?.turnstile_check) {
      setTurnstileEnabled(true);
      setTurnstileSiteKey(status.turnstile_site_key);
    }
    setHasUserAgreement(status?.user_agreement_enabled || false);
    setHasPrivacyPolicy(status?.privacy_policy_enabled || false);
  }, [status]);

  useEffect(() => {
    isPasskeySupported()
      .then(setPasskeySupported)
      .catch(() => setPasskeySupported(false));
    return () => {
      if (githubTimeoutRef.current) clearTimeout(githubTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('expired')) {
      showError(t('未登录或登录已过期，请重新登录'));
    }
  }, []);

  // ── All handlers (unchanged) ──

  const onWeChatLoginClicked = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    setWechatLoading(true);
    setShowWeChatLoginModal(true);
    setWechatLoading(false);
  };

  const onSubmitWeChatVerificationCode = async () => {
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }
    setWechatCodeSubmitLoading(true);
    try {
      const res = await API.get(`/api/oauth/wechat?code=${inputs.wechat_verification_code}`);
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        setUserData(data);
        updateAPI();
        navigate('/');
        showSuccess('登录成功！');
        setShowWeChatLoginModal(false);
      } else {
        showError(message);
      }
    } catch (error) {
      showError('登录失败，请重试');
    } finally {
      setWechatCodeSubmitLoading(false);
    }
  };

  function handleChange(name, value) {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }
    setSubmitted(true);
    setLoginLoading(true);
    try {
      if (username && password) {
        const res = await API.post(`/api/user/login?turnstile=${turnstileToken}`, { username, password });
        const { success, message, data } = res.data;
        if (success) {
          if (data && data.require_2fa) {
            setShowTwoFA(true);
            setLoginLoading(false);
            return;
          }
          userDispatch({ type: 'login', payload: data });
          setUserData(data);
          updateAPI();
          showSuccess('登录成功！');
          if (username === 'root' && password === '123456') {
            Modal.error({ title: '您正在使用默认密码！', content: '请立刻修改默认密码！', centered: true });
          }
          navigate('/console');
        } else {
          showError(message);
        }
      } else {
        showError('请输入用户名和密码！');
      }
    } catch (error) {
      showError('登录失败，请重试');
    } finally {
      setLoginLoading(false);
    }
  }

  const onTelegramLoginClicked = async (response) => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    const fields = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash', 'lang'];
    const params = {};
    fields.forEach((field) => { if (response[field]) params[field] = response[field]; });
    try {
      const res = await API.get(`/api/oauth/telegram/login`, { params });
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        showSuccess('登录成功！');
        setUserData(data);
        updateAPI();
        navigate('/');
      } else {
        showError(message);
      }
    } catch (error) {
      showError('登录失败，请重试');
    }
  };

  const handleGitHubClick = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) { showInfo(t('请先阅读并同意用户协议和隐私政策')); return; }
    if (githubButtonDisabled) return;
    setGithubLoading(true);
    setGithubButtonDisabled(true);
    setGithubButtonState('redirecting');
    if (githubTimeoutRef.current) clearTimeout(githubTimeoutRef.current);
    githubTimeoutRef.current = setTimeout(() => { setGithubLoading(false); setGithubButtonState('timeout'); setGithubButtonDisabled(true); }, 20000);
    try { onGitHubOAuthClicked(status.github_client_id, { shouldLogout: true }); } finally { setTimeout(() => setGithubLoading(false), 3000); }
  };

  const handleDiscordClick = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) { showInfo(t('请先阅读并同意用户协议和隐私政策')); return; }
    setDiscordLoading(true);
    try { onDiscordOAuthClicked(status.discord_client_id, { shouldLogout: true }); } finally { setTimeout(() => setDiscordLoading(false), 3000); }
  };

  const handleOIDCClick = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) { showInfo(t('请先阅读并同意用户协议和隐私政策')); return; }
    setOidcLoading(true);
    try { onOIDCClicked(status.oidc_authorization_endpoint, status.oidc_client_id, false, { shouldLogout: true }); } finally { setTimeout(() => setOidcLoading(false), 3000); }
  };

  const handleLinuxDOClick = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) { showInfo(t('请先阅读并同意用户协议和隐私政策')); return; }
    setLinuxdoLoading(true);
    try { onLinuxDOOAuthClicked(status.linuxdo_client_id, { shouldLogout: true }); } finally { setTimeout(() => setLinuxdoLoading(false), 3000); }
  };

  const handleCustomOAuthClick = (provider) => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) { showInfo(t('请先阅读并同意用户协议和隐私政策')); return; }
    setCustomOAuthLoading((prev) => ({ ...prev, [provider.slug]: true }));
    try { onCustomOAuthClicked(provider, { shouldLogout: true }); } finally { setTimeout(() => { setCustomOAuthLoading((prev) => ({ ...prev, [provider.slug]: false })); }, 3000); }
  };

  const handleEmailLoginClick = () => { setEmailLoginLoading(true); setShowEmailLogin(true); setEmailLoginLoading(false); };

  const handlePasskeyLogin = async () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) { showInfo(t('请先阅读并同意用户协议和隐私政策')); return; }
    if (!passkeySupported) { showInfo('当前环境无法使用 Passkey 登录'); return; }
    if (!window.PublicKeyCredential) { showInfo('当前浏览器不支持 Passkey'); return; }
    setPasskeyLoading(true);
    try {
      const beginRes = await API.post('/api/user/passkey/login/begin');
      const { success, message, data } = beginRes.data;
      if (!success) { showError(message || '无法发起 Passkey 登录'); return; }
      const publicKeyOptions = prepareCredentialRequestOptions(data?.options || data?.publicKey || data);
      const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
      const payload = buildAssertionResult(assertion);
      if (!payload) { showError('Passkey 验证失败，请重试'); return; }
      const finishRes = await API.post('/api/user/passkey/login/finish', payload);
      const finish = finishRes.data;
      if (finish.success) {
        userDispatch({ type: 'login', payload: finish.data });
        setUserData(finish.data);
        updateAPI();
        showSuccess('登录成功！');
        navigate('/console');
      } else { showError(finish.message || 'Passkey 登录失败，请重试'); }
    } catch (error) {
      if (error?.name === 'AbortError') showInfo('已取消 Passkey 登录');
      else showError('Passkey 登录失败，请重试');
    } finally { setPasskeyLoading(false); }
  };

  const handleResetPasswordClick = () => { setResetPasswordLoading(true); navigate('/reset'); setResetPasswordLoading(false); };
  const handleOtherLoginOptionsClick = () => { setOtherLoginOptionsLoading(true); setShowEmailLogin(false); setOtherLoginOptionsLoading(false); };

  const handle2FASuccess = (data) => {
    userDispatch({ type: 'login', payload: data });
    setUserData(data);
    updateAPI();
    showSuccess('登录成功！');
    navigate('/console');
  };

  const handleBackToLogin = () => {
    setShowTwoFA(false);
    setInputs({ username: '', password: '', wechat_verification_code: '' });
  };

  /* ─── Terms checkbox ─── */
  const renderTermsCheckbox = () => {
    if (!hasUserAgreement && !hasPrivacyPolicy) return null;
    return (
      <div style={{ marginTop: 16 }}>
        <Checkbox checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {t('我已阅读并同意')}
            {hasUserAgreement && (
              <a href='/user-agreement' target='_blank' rel='noopener noreferrer' style={{ ...accentLinkStyle, margin: '0 4px', fontSize: 12 }}>{t('用户协议')}</a>
            )}
            {hasUserAgreement && hasPrivacyPolicy && t('和')}
            {hasPrivacyPolicy && (
              <a href='/privacy-policy' target='_blank' rel='noopener noreferrer' style={{ ...accentLinkStyle, margin: '0 4px', fontSize: 12 }}>{t('隐私政策')}</a>
            )}
          </span>
        </Checkbox>
      </div>
    );
  };

  /* ─── Register link ─── */
  const renderRegisterLink = () => {
    if (status.self_use_mode_enabled) return null;
    return (
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)' }}>{t('没有账户？')} </span>
        <Link to='/register' style={accentLinkStyle}>{t('注册')}</Link>
      </div>
    );
  };

  /* ─── OAuth view ─── */
  const renderOAuthOptions = () => (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {status.wechat_login && (
          <Button theme='borderless' className='w-full flex items-center justify-center' type='tertiary'
            icon={<Icon svg={<WeChatIcon />} style={{ color: '#07C160' }} />}
            onClick={onWeChatLoginClicked} loading={wechatLoading} style={oauthBtnStyle}>
            <span style={oauthBtnTextStyle}>{t('使用 微信 继续')}</span>
          </Button>
        )}
        {status.github_oauth && (
          <Button theme='borderless' className='w-full flex items-center justify-center' type='tertiary'
            icon={<IconGithubLogo size='large' />}
            onClick={handleGitHubClick} loading={githubLoading} disabled={githubButtonDisabled} style={oauthBtnStyle}>
            <span style={oauthBtnTextStyle}>{githubButtonText}</span>
          </Button>
        )}
        {status.discord_oauth && (
          <Button theme='borderless' className='w-full flex items-center justify-center' type='tertiary'
            icon={<SiDiscord style={{ color: '#5865F2', width: 20, height: 20 }} />}
            onClick={handleDiscordClick} loading={discordLoading} style={oauthBtnStyle}>
            <span style={oauthBtnTextStyle}>{t('使用 Discord 继续')}</span>
          </Button>
        )}
        {status.oidc_enabled && (
          <Button theme='borderless' className='w-full flex items-center justify-center' type='tertiary'
            icon={<OIDCIcon style={{ color: '#1877F2' }} />}
            onClick={handleOIDCClick} loading={oidcLoading} style={oauthBtnStyle}>
            <span style={oauthBtnTextStyle}>{t('使用 OIDC 继续')}</span>
          </Button>
        )}
        {status.linuxdo_oauth && (
          <Button theme='borderless' className='w-full flex items-center justify-center' type='tertiary'
            icon={<LinuxDoIcon style={{ color: '#E95420', width: 20, height: 20 }} />}
            onClick={handleLinuxDOClick} loading={linuxdoLoading} style={oauthBtnStyle}>
            <span style={oauthBtnTextStyle}>{t('使用 LinuxDO 继续')}</span>
          </Button>
        )}
        {status.custom_oauth_providers && status.custom_oauth_providers.map((provider) => (
          <Button key={provider.slug} theme='borderless' className='w-full flex items-center justify-center' type='tertiary'
            icon={getOAuthProviderIcon(provider.icon || '', 20)}
            onClick={() => handleCustomOAuthClick(provider)} loading={customOAuthLoading[provider.slug]} style={oauthBtnStyle}>
            <span style={oauthBtnTextStyle}>{t('使用 {{name}} 继续', { name: provider.name })}</span>
          </Button>
        ))}
        {status.telegram_oauth && (
          <Button theme='borderless' className='w-full flex items-center justify-center relative' type='tertiary'
            style={{ ...oauthBtnStyle, padding: 0, overflow: 'hidden' }}>
            {/* Custom UI underneath */}
            <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
              <SiTelegram style={{ color: '#26A5E4', width: 20, height: 20 }} />
              <span style={oauthBtnTextStyle}>{t('使用 Telegram 继续')}</span>
            </div>
            {/* Invisible native telegram button on top to catch clicks */}
            <div className='absolute inset-0 z-10 flex items-center justify-center' style={{ opacity: 0.001, transform: 'scale(5)' }}>
              <TelegramLoginButton dataOnauth={onTelegramLoginClicked} botName={status.telegram_bot_name} />
            </div>
          </Button>
        )}
        {status.passkey_login && passkeySupported && (
          <Button theme='borderless' className='w-full flex items-center justify-center' type='tertiary'
            icon={<IconKey size='large' />}
            onClick={handlePasskeyLogin} loading={passkeyLoading} style={oauthBtnStyle}>
            <span style={oauthBtnTextStyle}>{t('使用 Passkey 登录')}</span>
          </Button>
        )}
      </div>

      <Divider margin='16px' align='center' style={{ borderColor: 'var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t('或')}</span>
      </Divider>

      <button
        onClick={handleEmailLoginClick}
        disabled={emailLoginLoading}
        style={{
          width: '100%', height: 48, background: 'var(--accent-gradient)', color: '#fff',
          border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 12px 24px -8px rgba(0,114,255,0.3)', transition: 'all 300ms ease',
        }}
      >
        {t('使用 邮箱或用户名 登录')}
      </button>

      {renderTermsCheckbox()}
      {renderRegisterLink()}
    </div>
  );

  /* ─── Email/password form ─── */
  const renderEmailLoginForm = () => (
    <div>
      {status.passkey_login && passkeySupported && (
        <Button theme='borderless' type='tertiary' className='w-full flex items-center justify-center'
          icon={<IconKey size='large' />}
          onClick={handlePasskeyLogin} loading={passkeyLoading}
          style={{ ...oauthBtnStyle, marginBottom: 16 }}>
          <span style={oauthBtnTextStyle}>{t('使用 Passkey 登录')}</span>
        </Button>
      )}

      <Form className='space-y-4'>
        <Form.Input
          field='username' label={t('用户名或邮箱')}
          placeholder={t('请输入您的用户名或邮箱地址')}
          name='username'
          onChange={(value) => handleChange('username', value)}
          prefix={<IconMail />}
        />
        <Form.Input
          field='password' label={t('密码')}
          placeholder={t('请输入您的密码')}
          name='password' mode='password'
          onChange={(value) => handleChange('password', value)}
          prefix={<IconLock />}
        />

        {renderTermsCheckbox()}

        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={loginLoading || ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms)}
            style={{
              width: '100%', height: 48, background: 'var(--accent-gradient)', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 12px 24px -8px rgba(0,114,255,0.3)', transition: 'all 300ms ease',
              opacity: loginLoading || ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) ? 0.6 : 1,
            }}
          >
            {loginLoading ? t('登录中...') : t('登录')}
          </button>

          <div style={{ textAlign: 'right' }}>
            <button
              type='button'
              onClick={handleResetPasswordClick}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}
            >
              {t('忘记密码？')}
            </button>
          </div>
        </div>
      </Form>

      {hasOAuthLoginOptions && (
        <>
          <Divider margin='16px' align='center' style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t('或')}</span>
          </Divider>
          <Button theme='borderless' type='tertiary' className='w-full'
            onClick={handleOtherLoginOptionsClick} loading={otherLoginOptionsLoading}
            style={{ ...oauthBtnStyle, fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('其他登录选项')}
          </Button>
        </>
      )}

      {renderRegisterLink()}
    </div>
  );

  /* ─── Modals ─── */
  const renderWeChatLoginModal = () => (
    <Modal title={t('微信扫码登录')} visible={showWeChatLoginModal} maskClosable onOk={onSubmitWeChatVerificationCode}
      onCancel={() => setShowWeChatLoginModal(false)} okText={t('登录')} centered okButtonProps={{ loading: wechatCodeSubmitLoading }}>
      <div className='flex flex-col items-center'>
        <img src={status.wechat_qrcode} alt='微信二维码' className='mb-4' />
      </div>
      <div className='text-center mb-4' style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
        <p>{t('微信扫码关注公众号，输入「验证码」获取验证码（三分钟内有效）')}</p>
      </div>
      <Form>
        <Form.Input field='wechat_verification_code' placeholder={t('验证码')} label={t('验证码')}
          value={inputs.wechat_verification_code}
          onChange={(value) => handleChange('wechat_verification_code', value)} />
      </Form>
    </Modal>
  );

  const render2FAModal = () => (
    <Modal
      title={<span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>两步验证</span>}
      visible={showTwoFA} onCancel={handleBackToLogin} footer={null} width={450} centered>
      <TwoFAVerification onSuccess={handle2FASuccess} onBack={handleBackToLogin} isModal />
    </Modal>
  );

  /* ─── Main return ─── */
  return (
    <AuthLayout>
      {/* Form header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          {t('欢迎回来')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 300 }}>
          {t('登录您的账户以继续使用 API 服务')}
        </p>
      </div>

      {showEmailLogin || !hasOAuthLoginOptions
        ? renderEmailLoginForm()
        : renderOAuthOptions()}

      {renderWeChatLoginModal()}
      {render2FAModal()}

      {turnstileEnabled && (
        <div className='flex justify-center mt-6'>
          <Turnstile
            sitekey={turnstileSiteKey}
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken('')}
            refreshExpired='auto'
          />
        </div>
      )}
    </AuthLayout>
  );
};

export default LoginForm;
