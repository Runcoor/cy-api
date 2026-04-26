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
import { Modal } from '@douyinfe/semi-ui';
import TelegramLoginButton from 'react-telegram-login';
import {
  API,
  copy,
  showError,
  showSuccess,
  onGitHubOAuthClicked,
  onOIDCClicked,
  onLinuxDOOAuthClicked,
  onDiscordOAuthClicked,
  onCustomOAuthClicked,
} from '../../../../helpers';
import TwoFASetting from '../components/TwoFASetting';
import { AasIcons as I } from '../_shared/AccountSettingsStyles';

const AccountManagement = ({
  t,
  userState,
  status,
  systemToken,
  setShowEmailBindModal,
  setShowWeChatBindModal,
  generateAccessToken,
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
  const [showTelegramBindModal, setShowTelegramBindModal] =
    React.useState(false);
  const [customOAuthBindings, setCustomOAuthBindings] = React.useState([]);
  const [customOAuthLoading, setCustomOAuthLoading] = React.useState({});

  const loadCustomOAuthBindings = async () => {
    try {
      const res = await API.get('/api/user/oauth/bindings');
      if (res.data.success) {
        setCustomOAuthBindings(res.data.data || []);
      }
    } catch (error) {
      // ignore — this endpoint may not be enabled
    }
  };

  const handleUnbindCustomOAuth = (providerId, providerName) => {
    Modal.confirm({
      title: t('确认解绑'),
      content: t('确定要解绑 {{name}} 吗？', { name: providerName }),
      okText: t('确认'),
      cancelText: t('取消'),
      onOk: async () => {
        setCustomOAuthLoading((prev) => ({ ...prev, [providerId]: true }));
        try {
          const res = await API.delete(
            `/api/user/oauth/bindings/${providerId}`,
          );
          if (res.data.success) {
            showSuccess(t('解绑成功'));
            await loadCustomOAuthBindings();
          } else {
            showError(res.data.message);
          }
        } catch (error) {
          showError(
            error.response?.data?.message || error.message || t('操作失败'),
          );
        } finally {
          setCustomOAuthLoading((prev) => ({ ...prev, [providerId]: false }));
        }
      },
    });
  };

  const handleBindCustomOAuth = (provider) => onCustomOAuthClicked(provider);

  const isCustomOAuthBound = (providerId) => {
    const normalizedId = Number(providerId);
    return customOAuthBindings.some(
      (b) => Number(b.provider_id) === normalizedId,
    );
  };

  const getCustomOAuthBinding = (providerId) => {
    const normalizedId = Number(providerId);
    return customOAuthBindings.find(
      (b) => Number(b.provider_id) === normalizedId,
    );
  };

  React.useEffect(() => {
    loadCustomOAuthBindings();
  }, []);

  const passkeyEnabled = passkeyStatus?.enabled;
  const lastUsedLabel = passkeyStatus?.last_used_at
    ? new Date(passkeyStatus.last_used_at).toLocaleString()
    : t('尚未使用');

  // Build the providers list. Each entry produces a single binding card.
  const providerCards = [];

  providerCards.push({
    key: 'email',
    iconKey: 'email',
    icon: <I.Mail />,
    name: t('邮箱'),
    detail: userState.user?.email || t('未绑定'),
    primary: !!userState.user?.email,
    bound: !!userState.user?.email,
    actionLabel: userState.user?.email ? t('管理') : t('绑定'),
    onClick: () => setShowEmailBindModal(true),
    enabled: true,
  });

  if (status.wechat_login !== undefined) {
    providerCards.push({
      key: 'wechat',
      iconKey: 'wechat',
      icon: <I.WeChat />,
      name: t('微信'),
      detail:
        userState.user?.wechat_id ||
        (status.wechat_login ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.wechat_id),
      actionLabel: isBound(userState.user?.wechat_id)
        ? t('管理')
        : status.wechat_login
          ? t('绑定')
          : t('未启用'),
      onClick: status.wechat_login
        ? () => setShowWeChatBindModal(true)
        : undefined,
      enabled: !!status.wechat_login,
    });
  }

  if (status.github_oauth !== undefined) {
    providerCards.push({
      key: 'github',
      iconKey: 'github',
      icon: <I.GitHub />,
      name: 'GitHub',
      detail:
        userState.user?.github_id ||
        (status.github_oauth ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.github_id),
      actionLabel: isBound(userState.user?.github_id)
        ? t('已绑定')
        : status.github_oauth
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.github_id) && status.github_oauth
          ? () => onGitHubOAuthClicked(status.github_client_id)
          : undefined,
      enabled: !!status.github_oauth && !isBound(userState.user?.github_id),
    });
  }

  if (status.discord_oauth !== undefined) {
    providerCards.push({
      key: 'discord',
      iconKey: 'discord',
      icon: <I.Discord />,
      name: 'Discord',
      detail:
        userState.user?.discord_id ||
        (status.discord_oauth ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.discord_id),
      actionLabel: isBound(userState.user?.discord_id)
        ? t('已绑定')
        : status.discord_oauth
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.discord_id) && status.discord_oauth
          ? () => onDiscordOAuthClicked(status.discord_client_id)
          : undefined,
      enabled: !!status.discord_oauth && !isBound(userState.user?.discord_id),
    });
  }

  if (status.telegram_oauth !== undefined) {
    providerCards.push({
      key: 'telegram',
      iconKey: 'telegram',
      icon: <I.Telegram />,
      name: 'Telegram',
      detail:
        userState.user?.telegram_id ||
        (status.telegram_oauth ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.telegram_id),
      actionLabel: isBound(userState.user?.telegram_id)
        ? t('已绑定')
        : status.telegram_oauth
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.telegram_id) && status.telegram_oauth
          ? () => setShowTelegramBindModal(true)
          : undefined,
      enabled: !!status.telegram_oauth && !isBound(userState.user?.telegram_id),
    });
  }

  if (status.linuxdo_oauth !== undefined) {
    providerCards.push({
      key: 'linuxdo',
      iconKey: 'linuxdo',
      icon: <I.Linux />,
      name: 'LinuxDO',
      detail:
        userState.user?.linux_do_id ||
        (status.linuxdo_oauth ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.linux_do_id),
      actionLabel: isBound(userState.user?.linux_do_id)
        ? t('已绑定')
        : status.linuxdo_oauth
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.linux_do_id) && status.linuxdo_oauth
          ? () => onLinuxDOOAuthClicked(status.linuxdo_client_id)
          : undefined,
      enabled: !!status.linuxdo_oauth && !isBound(userState.user?.linux_do_id),
    });
  }

  if (status.oidc_enabled !== undefined) {
    providerCards.push({
      key: 'oidc',
      iconKey: 'oidc',
      icon: <I.Oidc />,
      name: 'OIDC',
      detail:
        userState.user?.oidc_id ||
        (status.oidc_enabled ? t('未绑定') : t('未启用')),
      bound: isBound(userState.user?.oidc_id),
      actionLabel: isBound(userState.user?.oidc_id)
        ? t('已绑定')
        : status.oidc_enabled
          ? t('绑定')
          : t('未启用'),
      onClick:
        !isBound(userState.user?.oidc_id) && status.oidc_enabled
          ? () =>
              onOIDCClicked(
                status.oidc_authorization_endpoint,
                status.oidc_client_id,
              )
          : undefined,
      enabled: !!status.oidc_enabled && !isBound(userState.user?.oidc_id),
    });
  }

  if (status.custom_oauth_providers) {
    status.custom_oauth_providers.forEach((provider) => {
      const bound = isCustomOAuthBound(provider.id);
      const binding = getCustomOAuthBinding(provider.id);
      providerCards.push({
        key: `custom_${provider.slug}`,
        iconKey: 'custom',
        icon: <I.Plug />,
        name: provider.name,
        detail: bound ? binding?.provider_user_id || t('已绑定') : t('未绑定'),
        bound,
        actionLabel: bound ? t('解绑') : t('绑定'),
        onClick: bound
          ? () => handleUnbindCustomOAuth(provider.id, provider.name)
          : () => handleBindCustomOAuth(provider),
        enabled: true,
        loading: customOAuthLoading[provider.id],
        unbindStyle: bound,
      });
    });
  }

  const linkedCount = providerCards.filter((c) => c.bound).length;
  const totalCount = providerCards.length;

  const tokenSuffix = systemToken
    ? `sk-${'*'.repeat(3)}${systemToken.slice(-4)}`
    : t('尚未生成');

  const copyToken = async (val) => {
    if (await copy(val)) showSuccess(t('已复制到剪贴板'));
  };

  return (
    <>
      {/* === ACCOUNT BINDINGS === */}
      <section className='aas-section' id='sec-account'>
        <div className='aas-section-head'>
          <h2>
            {t('账户绑定')}{' '}
            <span className='aas-hint'>· {t('外部身份提供方')}</span>
          </h2>
          <span className='aas-meta'>
            {t('已绑定')}{' '}
            <strong style={{ color: 'var(--aas-ink-900)' }}>
              {linkedCount}
            </strong>
            {' / '}
            {totalCount} {t('个')}
          </span>
        </div>
        <div className='aas-bindings'>
          {providerCards.map((b) => (
            <div className='aas-binding' key={b.key}>
              <div className={`aas-binding-icon ${b.iconKey}`}>{b.icon}</div>
              <div className='aas-binding-info'>
                <div className='aas-binding-name'>
                  {b.name}
                  {b.primary && (
                    <span className='aas-primary-tag'>{t('主')}</span>
                  )}
                </div>
                <div
                  className={`aas-binding-status ${b.bound ? 'bound' : ''}`}
                  title={b.detail}
                >
                  {b.detail}
                </div>
              </div>
              <button
                className={`aas-binding-action ${b.unbindStyle ? 'unbind' : ''} ${!b.onClick || b.loading ? 'disabled' : ''}`}
                onClick={b.onClick}
                disabled={!b.onClick || b.loading}
              >
                {b.loading ? '…' : b.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Telegram bind modal stays here — uses TelegramLoginButton */}
      <Modal
        title={t('绑定 Telegram')}
        visible={showTelegramBindModal}
        onCancel={() => setShowTelegramBindModal(false)}
        footer={null}
      >
        <div
          className='my-3 text-sm'
          style={{ color: 'var(--text-secondary)' }}
        >
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

      {/* === SECURITY === */}
      <section className='aas-section' id='sec-security'>
        <div className='aas-section-head'>
          <h2>
            {t('安全设置')}{' '}
            <span className='aas-hint'>· {t('建议每 90 天轮换密钥')}</span>
          </h2>
        </div>
        <div className='aas-section-body'>
          {/* System Access Token */}
          <div className='aas-row'>
            <div className='aas-row-icon tinted-blue'>
              <I.Key />
            </div>
            <div className='aas-row-info'>
              <div className='aas-row-title'>{t('系统访问令牌')}</div>
              <div className='aas-row-desc'>
                {t('用于 API 调用的身份验证令牌')} ·{' '}
                <span className='aas-mono'>{tokenSuffix}</span>
              </div>
              {systemToken && (
                <div className='aas-token-display'>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {systemToken}
                  </span>
                  <button onClick={() => copyToken(systemToken)}>
                    <I.Copy /> {t('复制')}
                  </button>
                </div>
              )}
            </div>
            <button className='aas-btn' onClick={generateAccessToken}>
              <I.Refresh /> {systemToken ? t('重新生成') : t('生成令牌')}
            </button>
          </div>

          {/* Password */}
          <div className='aas-row'>
            <div className='aas-row-icon'>
              <I.Lock />
            </div>
            <div className='aas-row-info'>
              <div className='aas-row-title'>{t('密码管理')}</div>
              <div className='aas-row-desc'>
                {t('定期更改密码可以提高账户安全性')}
              </div>
            </div>
            <button
              className='aas-btn'
              onClick={() => setShowChangePasswordModal(true)}
            >
              {t('修改密码')}
            </button>
          </div>

          {/* Passkey */}
          <div className='aas-row'>
            <div className='aas-row-icon tinted-blue'>
              <I.Fingerprint />
            </div>
            <div className='aas-row-info'>
              <div className='aas-row-title'>
                {t('Passkey 登录')}{' '}
                {passkeyEnabled ? (
                  <span className='aas-pill ok'>{t('已启用')}</span>
                ) : (
                  <span className='aas-pill info'>{t('推荐')}</span>
                )}
              </div>
              <div className='aas-row-desc'>
                {passkeyEnabled
                  ? t('已启用 Passkey，无需密码即可登录')
                  : t('使用生物识别免密且更安全的登录体验')}
                {' · '}
                {t('最后使用')}：{lastUsedLabel}
                {!passkeySupported && (
                  <>
                    {' · '}
                    <span style={{ color: 'var(--aas-orange)' }}>
                      {t('当前设备不支持')}
                    </span>
                  </>
                )}
              </div>
            </div>
            {passkeyEnabled ? (
              <button
                className='aas-btn danger'
                disabled={passkeyDeleteLoading}
                onClick={() => {
                  Modal.confirm({
                    title: t('确认解绑 Passkey'),
                    content: t('解绑后将无法使用 Passkey 登录，确定要继续吗？'),
                    okText: t('确认解绑'),
                    cancelText: t('取消'),
                    okType: 'danger',
                    onOk: onPasskeyDelete,
                  });
                }}
              >
                {passkeyDeleteLoading ? '…' : t('解绑 Passkey')}
              </button>
            ) : (
              <button
                className='aas-btn'
                disabled={!passkeySupported || passkeyRegisterLoading}
                onClick={onPasskeyRegister}
              >
                {passkeyRegisterLoading ? '…' : t('注册 Passkey')}
              </button>
            )}
          </div>

          {/* 2FA — embedded existing component as a sub-row */}
          <div className='aas-row' style={{ display: 'block' }}>
            <div style={{ padding: '4px 0 8px' }}>
              <TwoFASetting t={t} />
            </div>
          </div>

          {/* Delete account — danger row */}
          <div className='aas-row aas-danger-row'>
            <div className='aas-row-icon tinted-red'>
              <I.Power />
            </div>
            <div className='aas-row-info'>
              <div className='aas-row-title'>{t('删除账户')}</div>
              <div className='aas-row-desc'>
                {t('此操作不可逆，所有数据将被永久删除')}
              </div>
            </div>
            <button
              className='aas-btn danger'
              onClick={() => setShowAccountDeleteModal(true)}
            >
              {t('注销账户')}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default AccountManagement;
