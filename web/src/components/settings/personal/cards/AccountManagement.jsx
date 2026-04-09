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
import {
  Input,
  Typography,
  Modal,
} from '@douyinfe/semi-ui';
import {
  IconKey,
} from '@douyinfe/semi-icons';
import { SiTelegram, SiWechat, SiLinux, SiDiscord } from 'react-icons/si';
import TelegramLoginButton from 'react-telegram-login';
import {
  API,
  showError,
  showSuccess,
  onGitHubOAuthClicked,
  onOIDCClicked,
  onLinuxDOOAuthClicked,
  onDiscordOAuthClicked,
  onCustomOAuthClicked,
  getOAuthProviderIcon,
} from '../../../../helpers';
import TwoFASetting from '../components/TwoFASetting';

const AccountManagement = ({
  t,
  userState,
  status,
  systemToken,
  setShowEmailBindModal,
  setShowWeChatBindModal,
  generateAccessToken,
  handleSystemTokenClick,
  setShowChangePasswordModal,
  setShowAccountDeleteModal,
  passkeyStatus,
  passkeySupported,
  passkeyRegisterLoading,
  passkeyDeleteLoading,
  onPasskeyRegister,
  onPasskeyDelete,
}) => {
  const isBound = (accountId) => Boolean(accountId);
  const [showTelegramBindModal, setShowTelegramBindModal] = React.useState(false);
  const [customOAuthBindings, setCustomOAuthBindings] = React.useState([]);
  const [customOAuthLoading, setCustomOAuthLoading] = React.useState({});

  const loadCustomOAuthBindings = async () => {
    try {
      const res = await API.get('/api/user/oauth/bindings');
      if (res.data.success) {
        setCustomOAuthBindings(res.data.data || []);
      } else {
        showError(res.data.message || t('获取绑定信息失败'));
      }
    } catch (error) {
      showError(error.response?.data?.message || error.message || t('获取绑定信息失败'));
    }
  };

  const handleUnbindCustomOAuth = async (providerId, providerName) => {
    Modal.confirm({
      title: t('确认解绑'),
      content: t('确定要解绑 {{name}} 吗？', { name: providerName }),
      okText: t('确认'),
      cancelText: t('取消'),
      onOk: async () => {
        setCustomOAuthLoading((prev) => ({ ...prev, [providerId]: true }));
        try {
          const res = await API.delete(`/api/user/oauth/bindings/${providerId}`);
          if (res.data.success) {
            showSuccess(t('解绑成功'));
            await loadCustomOAuthBindings();
          } else {
            showError(res.data.message);
          }
        } catch (error) {
          showError(error.response?.data?.message || error.message || t('操作失败'));
        } finally {
          setCustomOAuthLoading((prev) => ({ ...prev, [providerId]: false }));
        }
      },
    });
  };

  const handleBindCustomOAuth = (provider) => {
    onCustomOAuthClicked(provider);
  };

  const isCustomOAuthBound = (providerId) => {
    const normalizedId = Number(providerId);
    return customOAuthBindings.some((b) => Number(b.provider_id) === normalizedId);
  };

  const getCustomOAuthBinding = (providerId) => {
    const normalizedId = Number(providerId);
    return customOAuthBindings.find((b) => Number(b.provider_id) === normalizedId);
  };

  React.useEffect(() => {
    loadCustomOAuthBindings();
  }, []);

  const passkeyEnabled = passkeyStatus?.enabled;
  const lastUsedLabel = passkeyStatus?.last_used_at
    ? new Date(passkeyStatus.last_used_at).toLocaleString()
    : t('尚未使用');

  const cardStyle = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    padding: '20px',
    transition: 'background 0.15s',
    cursor: 'default',
  };

  const iconBoxStyle = (bg) => ({
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  const statusBadge = (connected, label) => (
    <span
      className='inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider'
      style={{
        borderRadius: 9999,
        background: connected ? 'rgba(22,163,74,0.1)' : 'var(--bg-subtle)',
        color: connected ? '#16a34a' : 'var(--text-muted)',
      }}
    >
      {label || (connected ? t('settings.connected') : t('未绑定'))}
    </span>
  );

  const providerCards = [];

  providerCards.push({
    key: 'email',
    icon: (
      <span style={{ fontSize: 20, color: '#3b82f6' }} className='material-symbols-outlined-placeholder'>
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#3b82f6' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='4' width='20' height='16' rx='2'/><path d='M22 7l-10 6L2 7'/></svg>
      </span>
    ),
    iconBg: 'rgba(59,130,246,0.1)',
    name: t('邮箱'),
    detail: userState.user?.email || '',
    connected: isBound(userState.user?.email),
    statusLabel: isBound(userState.user?.email) ? t('settings.primary') : undefined,
    onClick: () => setShowEmailBindModal(true),
    actionLabel: isBound(userState.user?.email) ? t('修改绑定') : t('绑定'),
    disabled: false,
  });

  if (status.wechat_login !== undefined) {
    providerCards.push({
      key: 'wechat',
      icon: <SiWechat size={20} color='#22c55e' />,
      iconBg: 'rgba(34,197,94,0.1)',
      name: t('微信'),
      detail: userState.user?.wechat_id || '',
      connected: isBound(userState.user?.wechat_id),
      statusLabel: !status.wechat_login ? t('未启用') : undefined,
      onClick: () => setShowWeChatBindModal(true),
      actionLabel: isBound(userState.user?.wechat_id) ? t('修改绑定') : status.wechat_login ? t('绑定') : t('未启用'),
      disabled: !status.wechat_login,
    });
  }

  if (status.github_oauth !== undefined) {
    providerCards.push({
      key: 'github',
      icon: (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor' style={{ color: 'var(--text-primary)' }}>
          <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/>
        </svg>
      ),
      iconBg: 'rgba(15,23,42,0.08)',
      name: 'GitHub',
      detail: userState.user?.github_id || '',
      connected: isBound(userState.user?.github_id),
      onClick: () => onGitHubOAuthClicked(status.github_client_id),
      actionLabel: status.github_oauth ? t('绑定') : t('未启用'),
      disabled: isBound(userState.user?.github_id) || !status.github_oauth,
    });
  }

  if (status.discord_oauth !== undefined) {
    providerCards.push({
      key: 'discord',
      icon: <SiDiscord size={20} color='#5865F2' />,
      iconBg: 'rgba(88,101,242,0.1)',
      name: 'Discord',
      detail: userState.user?.discord_id || '',
      connected: isBound(userState.user?.discord_id),
      onClick: () => onDiscordOAuthClicked(status.discord_client_id),
      actionLabel: status.discord_oauth ? t('settings.linkAccount') : t('未启用'),
      disabled: isBound(userState.user?.discord_id) || !status.discord_oauth,
    });
  }

  if (status.telegram_oauth !== undefined) {
    providerCards.push({
      key: 'telegram',
      icon: <SiTelegram size={20} color='#26a5e4' />,
      iconBg: 'rgba(38,165,228,0.1)',
      name: 'Telegram',
      detail: userState.user?.telegram_id || '',
      connected: isBound(userState.user?.telegram_id),
      onClick: () => setShowTelegramBindModal(true),
      actionLabel: status.telegram_oauth
        ? isBound(userState.user?.telegram_id) ? t('已绑定') : t('绑定')
        : t('未启用'),
      disabled: !status.telegram_oauth || isBound(userState.user?.telegram_id),
    });
  }

  if (status.linuxdo_oauth !== undefined) {
    providerCards.push({
      key: 'linuxdo',
      icon: <SiLinux size={20} color='#f97316' />,
      iconBg: 'rgba(249,115,22,0.1)',
      name: 'LinuxDO',
      detail: userState.user?.linux_do_id || '',
      connected: isBound(userState.user?.linux_do_id),
      onClick: () => onLinuxDOOAuthClicked(status.linuxdo_client_id),
      actionLabel: status.linuxdo_oauth ? t('绑定') : t('未启用'),
      disabled: isBound(userState.user?.linux_do_id) || !status.linuxdo_oauth,
    });
  }

  if (status.oidc_enabled !== undefined) {
    providerCards.push({
      key: 'oidc',
      icon: (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#a855f7' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4'/></svg>
      ),
      iconBg: 'rgba(168,85,247,0.1)',
      name: 'OIDC',
      detail: userState.user?.oidc_id || '',
      connected: isBound(userState.user?.oidc_id),
      statusLabel: isBound(userState.user?.oidc_id) ? t('settings.active') : undefined,
      onClick: () => onOIDCClicked(status.oidc_authorization_endpoint, status.oidc_client_id),
      actionLabel: status.oidc_enabled ? t('绑定') : t('未启用'),
      disabled: isBound(userState.user?.oidc_id) || !status.oidc_enabled,
    });
  }

  if (status.custom_oauth_providers) {
    status.custom_oauth_providers.forEach((provider) => {
      const bound = isCustomOAuthBound(provider.id);
      const binding = getCustomOAuthBinding(provider.id);
      providerCards.push({
        key: `custom_${provider.slug}`,
        icon: getOAuthProviderIcon(provider.icon || binding?.provider_icon || '', 20),
        iconBg: 'var(--bg-subtle)',
        name: provider.name,
        detail: bound ? binding?.provider_user_id || '' : '',
        connected: bound,
        onClick: bound ? () => handleUnbindCustomOAuth(provider.id, provider.name) : () => handleBindCustomOAuth(provider),
        actionLabel: bound ? t('解绑') : t('绑定'),
        actionDanger: bound,
        disabled: false,
        loading: customOAuthLoading[provider.id],
      });
    });
  }

  const linkedCount = providerCards.filter((c) => c.connected).length;

  const securityItems = [
    {
      key: 'token',
      iconBg: 'rgba(0,114,255,0.08)',
      iconColor: 'var(--accent)',
      icon: (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><circle cx='12' cy='12' r='3'/><path d='M12 1v6m0 6v6m11-7h-6m-6 0H1m15.36-5.36l-4.24 4.24m-4.24-4.24L3.64 3.64m12.72 12.72l-4.24-4.24m-4.24 4.24l-4.24 4.24'/></svg>
      ),
      title: t('系统访问令牌'),
      desc: t('用于API调用的身份验证令牌，请妥善保管'),
      action: t('生成令牌'),
      actionLabel: systemToken ? t('重新生成') : t('生成令牌'),
      onAction: generateAccessToken,
      extra: systemToken ? (
        <div className='mt-3 w-full'>
          <Input
            readonly
            value={systemToken}
            onClick={handleSystemTokenClick}
            size='default'
            prefix={<IconKey />}
            style={{ width: '100%' }}
          />
        </div>
      ) : null,
    },
    {
      key: 'password',
      iconBg: 'rgba(0,114,255,0.08)',
      iconColor: 'var(--accent)',
      icon: (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>
      ),
      title: t('密码管理'),
      desc: t('定期更改密码可以提高账户安全性'),
      actionLabel: t('修改密码'),
      onAction: () => setShowChangePasswordModal(true),
    },
    {
      key: 'passkey',
      iconBg: 'rgba(0,114,255,0.08)',
      iconColor: 'var(--accent)',
      icon: (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M7 11V7a5 5 0 0 1 9.9-1'/><path d='M18.5 11H20a2 2 0 0 1 2 2v2.5'/><path d='M2 16v-1a2 2 0 0 1 2-2h.5'/><circle cx='12' cy='16' r='3'/><path d='M12 19v3'/></svg>
      ),
      title: t('Passkey 登录'),
      desc: passkeyEnabled
        ? t('已启用 Passkey，无需密码即可登录')
        : t('使用 Passkey 实现免密且更安全的登录体验'),
      actionLabel: passkeyEnabled ? t('解绑 Passkey') : t('注册 Passkey'),
      actionDanger: passkeyEnabled,
      onAction: passkeyEnabled
        ? () => {
            Modal.confirm({
              title: t('确认解绑 Passkey'),
              content: t('解绑后将无法使用 Passkey 登录，确定要继续吗？'),
              okText: t('确认解绑'),
              cancelText: t('取消'),
              okType: 'danger',
              onOk: onPasskeyDelete,
            });
          }
        : onPasskeyRegister,
      disabled: !passkeySupported && !passkeyEnabled,
      loading: passkeyEnabled ? passkeyDeleteLoading : passkeyRegisterLoading,
      statusExtra: !passkeySupported ? t('当前设备不支持 Passkey') : `${t('最后使用时间')}：${lastUsedLabel}`,
    },
  ];

  return (
    <>
      {/* Section: Account Connections */}
      <section>
        <div className='flex items-center justify-between mb-6'>
          <h2
            className='text-xl sm:text-2xl font-bold'
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {t('settings.accountConnections')}
          </h2>
          <span className='text-sm font-medium' style={{ color: 'var(--text-muted)' }}>
            {t('settings.accountsLinked', { count: linkedCount })}
          </span>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          {providerCards.map((p) => (
            <div
              key={p.key}
              className='group'
              style={cardStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
            >
              <div className='flex items-start justify-between mb-3'>
                <div style={iconBoxStyle(p.iconBg)}>{p.icon}</div>
                {statusBadge(p.connected, p.statusLabel)}
              </div>
              <h3 className='font-bold text-sm mb-0.5' style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
              <p className='text-xs truncate mb-3' style={{ color: 'var(--text-muted)', minHeight: 16 }}>
                {p.detail ? (
                  <Typography.Paragraph copyable={{ content: p.detail }} className='!text-xs !mb-0' style={{ color: 'var(--text-muted)' }}>
                    {p.detail}
                  </Typography.Paragraph>
                ) : (
                  p.connected ? '' : t('settings.notConnected')
                )}
              </p>
              {!p.connected && !p.disabled && (
                <button
                  className='text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity'
                  style={{ color: p.actionDanger ? 'var(--error)' : 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  onClick={p.onClick}
                >
                  {p.actionLabel}
                </button>
              )}
              {p.connected && !p.disabled && p.actionDanger && (
                <button
                  className='text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity'
                  style={{ color: 'var(--error)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  onClick={p.onClick}
                >
                  {p.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Telegram Bind Modal */}
      <Modal
        title={t('绑定 Telegram')}
        visible={showTelegramBindModal}
        onCancel={() => setShowTelegramBindModal(false)}
        footer={null}
      >
        <div className='my-3 text-sm' style={{ color: 'var(--text-secondary)' }}>
          {t('点击下方按钮通过 Telegram 完成绑定')}
        </div>
        <div className='flex justify-center'>
          <div className='scale-90'>
            <TelegramLoginButton
              dataAuthUrl='/api/oauth/telegram/bind'
              botName={status.telegram_bot_name}
            />
          </div>
        </div>
      </Modal>

      {/* Section: Security Infrastructure */}
      <section className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
        <div className='lg:col-span-1'>
          <h2
            className='text-xl sm:text-2xl font-bold mb-3'
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {t('settings.securityInfra')}
          </h2>
          <p className='text-sm leading-relaxed' style={{ color: 'var(--text-muted)' }}>
            {t('settings.securityInfraDesc')}
          </p>
        </div>
        <div className='lg:col-span-2 flex flex-col gap-3'>
          {securityItems.map((item) => (
            <div
              key={item.key}
              className='flex items-center gap-4 sm:gap-5 group'
              style={{
                ...cardStyle,
                padding: '16px 20px',
                cursor: 'default',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <div
                className='flex items-center justify-center flex-shrink-0'
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: item.iconBg,
                  color: item.iconColor,
                }}
              >
                {item.icon}
              </div>
              <div className='flex-grow min-w-0'>
                <h4 className='font-bold text-sm' style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                <p className='text-xs mt-0.5' style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                {item.statusExtra && (
                  <p className='text-[11px] mt-1' style={{ color: 'var(--text-muted)' }}>{item.statusExtra}</p>
                )}
                {item.extra}
              </div>
              <button
                className='flex-shrink-0 px-3 py-1.5 text-xs font-bold transition-colors'
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: item.actionDanger ? 'transparent' : 'var(--bg-subtle)',
                  color: item.actionDanger ? 'var(--error)' : 'var(--text-primary)',
                  border: item.actionDanger ? '1px solid var(--error)' : '1px solid var(--border-subtle)',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1,
                }}
                disabled={item.disabled || item.loading}
                onClick={item.onAction}
              >
                {item.loading ? '...' : item.actionLabel}
              </button>
            </div>
          ))}

          {/* 2FA */}
          <TwoFASetting t={t} />

          {/* Delete Account */}
          <div
            className='flex items-center gap-4 sm:gap-5'
            style={{
              ...cardStyle,
              padding: '16px 20px',
              background: 'rgba(186,26,26,0.03)',
              borderColor: 'rgba(186,26,26,0.12)',
            }}
          >
            <div
              className='flex items-center justify-center flex-shrink-0'
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(186,26,26,0.08)',
                color: '#dc2626',
              }}
            >
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M18.36 6.64A9 9 0 1 1 5.64 5.64'/><path d='M12 2v10'/></svg>
            </div>
            <div className='flex-grow'>
              <h4 className='font-bold text-sm' style={{ color: '#dc2626' }}>{t('删除账户')}</h4>
              <p className='text-xs mt-0.5' style={{ color: 'rgba(186,26,26,0.6)' }}>
                {t('此操作不可逆，所有数据将被永久删除')}
              </p>
            </div>
            <button
              className='flex-shrink-0 text-xs font-bold hover:underline'
              style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setShowAccountDeleteModal(true)}
            >
              {t('settings.deactivate')}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default AccountManagement;
