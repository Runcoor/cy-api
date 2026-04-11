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
import { Link, useNavigate } from 'react-router-dom';
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
  onDiscordOAuthClicked,
  onCustomOAuthClicked,
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
import {
  IconGithubLogo,
  IconMail,
  IconUser,
  IconLock,
  IconKey,
} from '@douyinfe/semi-icons';
import {
  onGitHubOAuthClicked,
  onLinuxDOOAuthClicked,
  onOIDCClicked,
} from '../../helpers';
import OIDCIcon from '../common/logo/OIDCIcon';
import LinuxDoIcon from '../common/logo/LinuxDoIcon';
import WeChatIcon from '../common/logo/WeChatIcon';
import TelegramLoginButton from 'react-telegram-login/src';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { useTranslation } from 'react-i18next';
import { SiDiscord } from 'react-icons/si';
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

const RegisterForm = () => {
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
    password2: '',
    email: '',
    verification_code: '',
    wechat_verification_code: '',
  });
  const { username, password, password2 } = inputs;
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showWeChatLoginModal, setShowWeChatLoginModal] = useState(false);
  const [showEmailRegister, setShowEmailRegister] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [oidcLoading, setOidcLoading] = useState(false);
  const [linuxdoLoading, setLinuxdoLoading] = useState(false);
  const [emailRegisterLoading, setEmailRegisterLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [verificationCodeLoading, setVerificationCodeLoading] = useState(false);
  const [otherRegisterOptionsLoading, setOtherRegisterOptionsLoading] = useState(false);
  const [wechatCodeSubmitLoading, setWechatCodeSubmitLoading] = useState(false);
  const [customOAuthLoading, setCustomOAuthLoading] = useState({});
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasUserAgreement, setHasUserAgreement] = useState(false);
  const [hasPrivacyPolicy, setHasPrivacyPolicy] = useState(false);
  const [githubButtonState, setGithubButtonState] = useState('idle');
  const [githubButtonDisabled, setGithubButtonDisabled] = useState(false);
  const githubTimeoutRef = useRef(null);
  const githubButtonText = t(githubButtonTextKeyByState[githubButtonState]);

  const logo = getLogo();
  const systemName = getSystemName();

  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) localStorage.setItem('aff', affCode);

  const status = useMemo(() => {
    if (statusState?.status) return statusState.status;
    const savedStatus = localStorage.getItem('status');
    if (!savedStatus) return {};
    try { return JSON.parse(savedStatus) || {}; } catch (err) { return {}; }
  }, [statusState?.status]);
  const hasCustomOAuthProviders = (status.custom_oauth_providers || []).length > 0;
  const hasOAuthRegisterOptions = Boolean(
    status.github_oauth || status.discord_oauth || status.oidc_enabled ||
    status.wechat_login || status.linuxdo_oauth || status.telegram_oauth || hasCustomOAuthProviders,
  );

  const [showEmailVerification, setShowEmailVerification] = useState(false);

  useEffect(() => {
    setShowEmailVerification(!!status?.email_verification);
    if (status?.turnstile_check) { setTurnstileEnabled(true); setTurnstileSiteKey(status.turnstile_site_key); }
    setHasUserAgreement(status?.user_agreement_enabled || false);
    setHasPrivacyPolicy(status?.privacy_policy_enabled || false);
  }, [status]);

  useEffect(() => {
    let countdownInterval = null;
    if (disableButton && countdown > 0) { countdownInterval = setInterval(() => setCountdown(countdown - 1), 1000); }
    else if (countdown === 0) { setDisableButton(false); setCountdown(30); }
    return () => clearInterval(countdownInterval);
  }, [disableButton, countdown]);

  useEffect(() => { return () => { if (githubTimeoutRef.current) clearTimeout(githubTimeoutRef.current); }; }, []);

  // ── All handlers (unchanged) ──

  const onWeChatLoginClicked = () => { setWechatLoading(true); setShowWeChatLoginModal(true); setWechatLoading(false); };

  const onSubmitWeChatVerificationCode = async () => {
    if (turnstileEnabled && turnstileToken === '') { showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！'); return; }
    setWechatCodeSubmitLoading(true);
    try {
      const res = await API.get(`/api/oauth/wechat?code=${inputs.wechat_verification_code}`);
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        setUserData(data); updateAPI(); navigate('/'); showSuccess('登录成功！'); setShowWeChatLoginModal(false);
      } else showError(message);
    } catch (error) { showError('登录失败，请重试'); } finally { setWechatCodeSubmitLoading(false); }
  };

  function handleChange(name, value) { setInputs((inputs) => ({ ...inputs, [name]: value })); }

  async function handleSubmit(e) {
    if (password.length < 8) { showInfo('密码长度不得小于 8 位！'); return; }
    if (password !== password2) { showInfo('两次输入的密码不一致'); return; }
    if (username && password) {
      if (turnstileEnabled && turnstileToken === '') { showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！'); return; }
      setRegisterLoading(true);
      try {
        if (!affCode) affCode = localStorage.getItem('aff');
        inputs.aff_code = affCode;
        const res = await API.post(`/api/user/register?turnstile=${turnstileToken}`, inputs);
        const { success, message } = res.data;
        if (success) { navigate('/login'); showSuccess('注册成功！'); } else showError(message);
      } catch (error) { showError('注册失败，请重试'); } finally { setRegisterLoading(false); }
    }
  }

  const sendVerificationCode = async () => {
    if (inputs.email === '') return;
    if (turnstileEnabled && turnstileToken === '') { showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！'); return; }
    setVerificationCodeLoading(true);
    try {
      const res = await API.get(`/api/verification?email=${encodeURIComponent(inputs.email)}&turnstile=${turnstileToken}`);
      const { success, message } = res.data;
      if (success) { showSuccess('验证码发送成功，请检查你的邮箱！'); setDisableButton(true); } else showError(message);
    } catch (error) { showError('发送验证码失败，请重试'); } finally { setVerificationCodeLoading(false); }
  };

  const handleGitHubClick = () => {
    if (githubButtonDisabled) return;
    setGithubLoading(true); setGithubButtonDisabled(true); setGithubButtonState('redirecting');
    if (githubTimeoutRef.current) clearTimeout(githubTimeoutRef.current);
    githubTimeoutRef.current = setTimeout(() => { setGithubLoading(false); setGithubButtonState('timeout'); setGithubButtonDisabled(true); }, 20000);
    try { onGitHubOAuthClicked(status.github_client_id, { shouldLogout: true }); } finally { setTimeout(() => setGithubLoading(false), 3000); }
  };

  const handleDiscordClick = () => { setDiscordLoading(true); try { onDiscordOAuthClicked(status.discord_client_id, { shouldLogout: true }); } finally { setTimeout(() => setDiscordLoading(false), 3000); } };
  const handleOIDCClick = () => { setOidcLoading(true); try { onOIDCClicked(status.oidc_authorization_endpoint, status.oidc_client_id, false, { shouldLogout: true }); } finally { setTimeout(() => setOidcLoading(false), 3000); } };
  const handleLinuxDOClick = () => { setLinuxdoLoading(true); try { onLinuxDOOAuthClicked(status.linuxdo_client_id, { shouldLogout: true }); } finally { setTimeout(() => setLinuxdoLoading(false), 3000); } };
  const handleCustomOAuthClick = (provider) => { setCustomOAuthLoading((prev) => ({ ...prev, [provider.slug]: true })); try { onCustomOAuthClicked(provider, { shouldLogout: true }); } finally { setTimeout(() => { setCustomOAuthLoading((prev) => ({ ...prev, [provider.slug]: false })); }, 3000); } };
  const handleEmailRegisterClick = () => { setEmailRegisterLoading(true); setShowEmailRegister(true); setEmailRegisterLoading(false); };
  const handleOtherRegisterOptionsClick = () => { setOtherRegisterOptionsLoading(true); setShowEmailRegister(false); setOtherRegisterOptionsLoading(false); };

  const onTelegramLoginClicked = async (response) => {
    const fields = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash', 'lang'];
    const params = {};
    fields.forEach((field) => { if (response[field]) params[field] = response[field]; });
    try {
      const res = await API.get(`/api/oauth/telegram/login`, { params });
      const { success, message, data } = res.data;
      if (success) { userDispatch({ type: 'login', payload: data }); localStorage.setItem('user', JSON.stringify(data)); showSuccess('登录成功！'); setUserData(data); updateAPI(); navigate('/'); }
      else showError(message);
    } catch (error) { showError('登录失败，请重试'); }
  };

  /* ─── Terms checkbox ─── */
  const renderTermsCheckbox = () => {
    if (!hasUserAgreement && !hasPrivacyPolicy) return null;
    return (
      <div style={{ paddingTop: 12 }}>
        <Checkbox checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {t('我已阅读并同意')}
            {hasUserAgreement && <a href='/user-agreement' target='_blank' rel='noopener noreferrer' style={{ ...accentLinkStyle, margin: '0 4px', fontSize: 12 }}>{t('用户协议')}</a>}
            {hasUserAgreement && hasPrivacyPolicy && t('和')}
            {hasPrivacyPolicy && <a href='/privacy-policy' target='_blank' rel='noopener noreferrer' style={{ ...accentLinkStyle, margin: '0 4px', fontSize: 12 }}>{t('隐私政策')}</a>}
          </span>
        </Checkbox>
      </div>
    );
  };

  /* ─── Login link ─── */
  const renderLoginLink = () => (
    <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{t('已有账户？')} </span>
      <Link to='/login' style={accentLinkStyle}>{t('登录')}</Link>
    </div>
  );

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
          <div className='flex justify-center my-2'>
            <TelegramLoginButton dataOnauth={onTelegramLoginClicked} botName={status.telegram_bot_name} />
          </div>
        )}
      </div>

      <Divider margin='16px' align='center' style={{ borderColor: 'var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t('或')}</span>
      </Divider>

      <button
        onClick={handleEmailRegisterClick}
        disabled={emailRegisterLoading}
        style={{
          width: '100%', height: 48, background: 'var(--accent-gradient)', color: '#fff',
          border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 12px 24px -8px rgba(0,114,255,0.3)', transition: 'all 300ms ease',
        }}
      >
        {t('使用 用户名 注册')}
      </button>

      {renderLoginLink()}
    </div>
  );

  /* ─── Email register form ─── */
  const renderEmailRegisterForm = () => (
    <div>
      <Form className='space-y-4'>
        <Form.Input field='username' label={t('用户名')} placeholder={t('请输入用户名')}
          name='username' onChange={(value) => handleChange('username', value)} prefix={<IconUser />} />
        <Form.Input field='password' label={t('密码')} placeholder={t('输入密码，最短 8 位，最长 20 位')}
          name='password' mode='password' onChange={(value) => handleChange('password', value)} prefix={<IconLock />} />
        <Form.Input field='password2' label={t('确认密码')} placeholder={t('确认密码')}
          name='password2' mode='password' onChange={(value) => handleChange('password2', value)} prefix={<IconLock />} />

        {showEmailVerification && (
          <>
            <Form.Input field='email' label={t('邮箱')} placeholder={t('输入邮箱地址')}
              name='email' type='email' onChange={(value) => handleChange('email', value)} prefix={<IconMail />}
              suffix={
                <Button onClick={sendVerificationCode} loading={verificationCodeLoading}
                  disabled={disableButton || verificationCodeLoading} size='small'
                  style={{ color: 'var(--accent)', fontSize: 13 }}>
                  {disableButton ? `${t('重新发送')} (${countdown})` : t('获取验证码')}
                </Button>
              }
            />
            <Form.Input field='verification_code' label={t('验证码')} placeholder={t('输入验证码')}
              name='verification_code' onChange={(value) => handleChange('verification_code', value)} prefix={<IconKey />} />
          </>
        )}

        {renderTermsCheckbox()}

        <div style={{ paddingTop: 8 }}>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={registerLoading || ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms)}
            style={{
              width: '100%', height: 48, background: 'var(--accent-gradient)', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 12px 24px -8px rgba(0,114,255,0.3)', transition: 'all 300ms ease',
              opacity: registerLoading || ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) ? 0.6 : 1,
            }}
          >
            {registerLoading ? t('注册中...') : t('注册')}
          </button>
        </div>
      </Form>

      {hasOAuthRegisterOptions && (
        <>
          <Divider margin='16px' align='center' style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t('或')}</span>
          </Divider>
          <Button theme='borderless' type='tertiary' className='w-full'
            onClick={handleOtherRegisterOptionsClick} loading={otherRegisterOptionsLoading}
            style={{ ...oauthBtnStyle, fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('其他注册选项')}
          </Button>
        </>
      )}

      {renderLoginLink()}
    </div>
  );

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

  /* ─── Main return ─── */
  return (
    <AuthLayout>
      {/* Form header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          {t('创建账户')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 300 }}>
          {t('注册以开始使用 AI 服务')}
        </p>
      </div>

      {showEmailRegister || !hasOAuthRegisterOptions
        ? renderEmailRegisterForm()
        : renderOAuthOptions()}

      {renderWeChatLoginModal()}

      {turnstileEnabled && (
        <div className='flex justify-center mt-6'>
          <Turnstile sitekey={turnstileSiteKey} onVerify={(token) => setTurnstileToken(token)} />
        </div>
      )}
    </AuthLayout>
  );
};

export default RegisterForm;
