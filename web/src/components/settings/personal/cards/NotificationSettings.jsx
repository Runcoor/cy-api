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

import React, { useEffect, useState, useContext } from 'react';
import {
  API,
  showError,
  showSuccess,
  renderQuotaWithPrompt,
} from '../../../../helpers';
import { StatusContext } from '../../../../context/Status';
import { UserContext } from '../../../../context/User';
import { useUserPermissions } from '../../../../hooks/common/useUserPermissions';
import {
  mergeAdminConfig,
  useSidebar,
} from '../../../../hooks/common/useSidebar';
import { AasIcons as I } from '../_shared/AccountSettingsStyles';

const DEFAULT_SIDEBAR = {
  chat: { enabled: true, playground: true, chat: true },
  console: {
    enabled: true,
    detail: true,
    token: true,
    log: true,
    midjourney: true,
    task: true,
  },
  personal: { enabled: true, topup: true, personal: true },
  admin: {
    enabled: true,
    channel: true,
    models: true,
    deployment: true,
    subscription: true,
    redemption: true,
    'login-log': true,
    user: true,
    setting: true,
  },
};

const NotificationSettings = ({
  t,
  notificationSettings,
  handleNotificationSettingChange,
  markNotificationDirty,
}) => {
  const [statusState] = useContext(StatusContext);
  const [userState] = useContext(UserContext);
  const isAdminOrRoot = (userState?.user?.role || 0) >= 10;

  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ----- sidebar state -----
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarModulesUser, setSidebarModulesUser] = useState(DEFAULT_SIDEBAR);
  const [adminConfig, setAdminConfig] = useState(null);

  const {
    hasSidebarSettingsPermission,
    isSidebarSectionAllowed,
    isSidebarModuleAllowed,
  } = useUserPermissions();

  const { refreshUserConfig } = useSidebar();

  const handleSectionChange = (sectionKey) => (checked) => {
    setSidebarModulesUser((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], enabled: checked },
    }));
  };

  const handleModuleChange = (sectionKey, moduleKey) => (checked) => {
    setSidebarModulesUser((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [moduleKey]: checked },
    }));
  };

  const saveSidebarSettings = async () => {
    setSidebarLoading(true);
    try {
      const res = await API.put('/api/user/self', {
        sidebar_modules: JSON.stringify(sidebarModulesUser),
      });
      if (res.data.success) {
        showSuccess(t('侧边栏设置保存成功'));
        await refreshUserConfig();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('保存失败'));
    }
    setSidebarLoading(false);
  };

  const resetSidebarModules = () => setSidebarModulesUser(DEFAULT_SIDEBAR);

  useEffect(() => {
    const loadSidebarConfigs = async () => {
      try {
        if (statusState?.status?.SidebarModulesAdmin) {
          try {
            const adminConf = JSON.parse(
              statusState.status.SidebarModulesAdmin,
            );
            setAdminConfig(mergeAdminConfig(adminConf));
          } catch {
            setAdminConfig(mergeAdminConfig(null));
          }
        } else {
          setAdminConfig(mergeAdminConfig(null));
        }

        const userRes = await API.get('/api/user/self');
        if (userRes.data.success && userRes.data.data.sidebar_modules) {
          let userConf;
          if (typeof userRes.data.data.sidebar_modules === 'string') {
            userConf = JSON.parse(userRes.data.data.sidebar_modules);
          } else {
            userConf = userRes.data.data.sidebar_modules;
          }
          setSidebarModulesUser(userConf);
        }
      } catch (error) {
        // ignore — no sidebar config available
      }
    };

    loadSidebarConfigs();
  }, [statusState]);

  const isAllowedByAdmin = (sectionKey, moduleKey = null) => {
    if (!adminConfig) return true;
    if (moduleKey) {
      return (
        adminConfig[sectionKey]?.enabled && adminConfig[sectionKey]?.[moduleKey]
      );
    }
    return adminConfig[sectionKey]?.enabled;
  };

  const sectionConfigs = [
    {
      key: 'chat',
      title: t('聊天区域'),
      description: t('操练场和聊天功能'),
      modules: [
        {
          key: 'playground',
          title: t('操练场'),
          description: t('AI模型测试环境'),
        },
        { key: 'chat', title: t('聊天'), description: t('聊天会话管理') },
      ],
    },
    {
      key: 'console',
      title: t('控制台区域'),
      description: t('数据管理和日志查看'),
      modules: [
        { key: 'detail', title: t('数据看板'), description: t('系统数据统计') },
        { key: 'token', title: t('令牌管理'), description: t('API令牌管理') },
        { key: 'log', title: t('使用日志'), description: t('API使用记录') },
        {
          key: 'midjourney',
          title: t('绘图日志'),
          description: t('绘图任务记录'),
        },
        { key: 'task', title: t('任务日志'), description: t('系统任务记录') },
      ],
    },
    {
      key: 'personal',
      title: t('个人中心区域'),
      description: t('用户个人功能'),
      modules: [
        { key: 'topup', title: t('钱包管理'), description: t('余额充值管理') },
        {
          key: 'personal',
          title: t('个人设置'),
          description: t('个人信息设置'),
        },
      ],
    },
    {
      key: 'admin',
      title: t('管理员区域'),
      description: t('系统管理功能'),
      modules: [
        { key: 'channel', title: t('渠道管理'), description: t('API渠道配置') },
        { key: 'models', title: t('模型管理'), description: t('AI模型配置') },
        {
          key: 'deployment',
          title: t('模型部署'),
          description: t('模型部署管理'),
        },
        {
          key: 'subscription',
          title: t('订阅管理'),
          description: t('订阅套餐管理'),
        },
        {
          key: 'redemption',
          title: t('兑换码管理'),
          description: t('兑换码生成管理'),
        },
        {
          key: 'login-log',
          title: t('登录日志'),
          description: t('用户登录记录'),
        },
        { key: 'user', title: t('用户管理'), description: t('用户账户管理') },
        {
          key: 'ai-news',
          title: t('AI 前沿信息'),
          description: t('每日 AI 资讯订阅'),
        },
        {
          key: 'setting',
          title: t('系统设置'),
          description: t('系统参数配置'),
        },
      ],
    },
  ]
    .filter((section) => isSidebarSectionAllowed(section.key))
    .map((section) => ({
      ...section,
      modules: section.modules.filter((m) =>
        isSidebarModuleAllowed(section.key, m.key),
      ),
    }))
    .filter(
      (section) => section.modules.length > 0 && isAllowedByAdmin(section.key),
    );

  const setField = (field, value) => {
    handleNotificationSettingChange(field, value);
    if (markNotificationDirty) markNotificationDirty();
  };

  const setRawField = (field, e) => {
    handleNotificationSettingChange(field, e.target.value);
    if (markNotificationDirty) markNotificationDirty();
  };

  const Switch = ({ checked, onChange, disabled }) => (
    <button
      type='button'
      className={`aas-switch ${checked ? 'on' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    />
  );

  return (
    <>
      {/* === NOTIFICATIONS === */}
      <section className='aas-section' id='sec-notifications'>
        <div className='aas-section-head'>
          <h2>
            {t('通知配置')}{' '}
            <span className='aas-hint'>· {t('接收方式与额度阈值')}</span>
          </h2>
        </div>
        <div className='aas-section-body'>
          <div className='aas-row'>
            <div className='aas-row-icon tinted-blue'>
              <I.Mail />
            </div>
            <div className='aas-row-info'>
              <div className='aas-row-title'>{t('邮件通知')}</div>
              <div className='aas-row-desc'>
                {t('启用后将通过邮件接收预警和系统通知')}
              </div>
            </div>
            <Switch
              checked={notificationSettings.warningType === 'email'}
              onChange={(v) => setField('warningType', v ? 'email' : '')}
            />
          </div>
          {isAdminOrRoot && (
            <div className='aas-row'>
              <div className='aas-row-icon'>
                <I.Bell />
              </div>
              <div className='aas-row-info'>
                <div className='aas-row-title'>{t('上游模型更新通知')}</div>
                <div className='aas-row-desc'>
                  {t('仅管理员可见，接收上游模型变更提醒')}
                </div>
              </div>
              <Switch
                checked={
                  !!notificationSettings.upstreamModelUpdateNotifyEnabled
                }
                onChange={(v) =>
                  setField('upstreamModelUpdateNotifyEnabled', v)
                }
              />
            </div>
          )}
        </div>

        <div className='aas-config-grid'>
          <div className='aas-field'>
            <label>
              {t('额度预警阈值')}{' '}
              <span className='aas-help'>
                {renderQuotaWithPrompt(notificationSettings.warningThreshold)}
              </span>{' '}
              <span className='aas-req'>*</span>
            </label>
            <div className='aas-input'>
              <I.Bell />
              <input
                type='text'
                value={notificationSettings.warningThreshold}
                onChange={(e) => setRawField('warningThreshold', e)}
              />
              <span className='aas-suffix'>tokens</span>
            </div>
            <div className='aas-field-help'>
              {t('当余额低于此数值时，系统将通过选择的方式发送通知')}
            </div>
          </div>
          <div className='aas-field'>
            <label>{t('通知邮箱')}</label>
            <div className='aas-input'>
              <I.Mail />
              <input
                type='text'
                value={notificationSettings.notificationEmail}
                onChange={(e) => setRawField('notificationEmail', e)}
                placeholder={t('留空则使用账号绑定的邮箱')}
              />
            </div>
            <div className='aas-field-help'>
              {t('不填则使用账号绑定的邮箱')}
            </div>
          </div>
        </div>

        {/* Advanced channels (webhook / bark / gotify) — collapsed by default */}
        <div
          style={{
            borderTop: '1px solid var(--aas-line-soft)',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            color: 'var(--aas-ink-500)',
            fontSize: 12,
            userSelect: 'none',
          }}
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          <I.Webhook />
          <span style={{ flex: 1 }}>{t('高级通知通道')}</span>
          <span
            style={{
              transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .15s',
              display: 'inline-flex',
            }}
          >
            <I.Chevron />
          </span>
        </div>
        {advancedOpen && (
          <div className='aas-config-grid'>
            <div className='aas-field'>
              <label>{t('Webhook URL')}</label>
              <div className='aas-input'>
                <I.Webhook />
                <input
                  type='text'
                  value={notificationSettings.webhookUrl}
                  onChange={(e) => setRawField('webhookUrl', e)}
                  placeholder='https://'
                />
              </div>
            </div>
            <div className='aas-field'>
              <label>{t('Webhook Secret')}</label>
              <div className='aas-input'>
                <I.Lock />
                <input
                  type='text'
                  value={notificationSettings.webhookSecret}
                  onChange={(e) => setRawField('webhookSecret', e)}
                />
              </div>
            </div>
            <div className='aas-field'>
              <label>Bark URL</label>
              <div className='aas-input'>
                <I.Bell />
                <input
                  type='text'
                  value={notificationSettings.barkUrl}
                  onChange={(e) => setRawField('barkUrl', e)}
                  placeholder='https://api.day.app/...'
                />
              </div>
            </div>
            <div className='aas-field'>
              <label>Gotify URL</label>
              <div className='aas-input'>
                <I.Bell />
                <input
                  type='text'
                  value={notificationSettings.gotifyUrl}
                  onChange={(e) => setRawField('gotifyUrl', e)}
                  placeholder='https://gotify.example.com'
                />
              </div>
            </div>
            <div className='aas-field'>
              <label>Gotify Token</label>
              <div className='aas-input'>
                <I.Key />
                <input
                  type='text'
                  value={notificationSettings.gotifyToken}
                  onChange={(e) => setRawField('gotifyToken', e)}
                />
              </div>
            </div>
            <div className='aas-field'>
              <label>
                Gotify Priority <span className='aas-help'>0-10</span>
              </label>
              <div className='aas-input'>
                <I.Sliders />
                <input
                  type='number'
                  min='0'
                  max='10'
                  value={notificationSettings.gotifyPriority}
                  onChange={(e) => setRawField('gotifyPriority', e)}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* === PRICING === */}
      <section className='aas-section' id='sec-pricing'>
        <div className='aas-section-head'>
          <h2>{t('价格设置')}</h2>
        </div>
        <div className='aas-section-body'>
          <div className='aas-row'>
            <div className='aas-row-icon tinted-orange'>
              <I.Tag />
            </div>
            <div className='aas-row-info'>
              <div className='aas-row-title'>
                {t('接受未设置价格的模型')}{' '}
                <span className='aas-pill warn'>{t('谨慎')}</span>
              </div>
              <div className='aas-row-desc'>
                {t('当模型没有设置价格时仍接受调用，可能产生高额费用')}
              </div>
            </div>
            <Switch
              checked={!!notificationSettings.acceptUnsetModelRatioModel}
              onChange={(v) => setField('acceptUnsetModelRatioModel', v)}
            />
          </div>
        </div>
      </section>

      {/* === PRIVACY === */}
      <section className='aas-section' id='sec-privacy'>
        <div className='aas-section-head'>
          <h2>{t('隐私设置')}</h2>
        </div>
        <div className='aas-section-body'>
          <div className='aas-row'>
            <div className='aas-row-icon'>
              <I.Lock />
            </div>
            <div className='aas-row-info'>
              <div className='aas-row-title'>{t('记录请求与错误日志 IP')}</div>
              <div className='aas-row-desc'>
                {t('开启后，"消费"和"错误"日志中将记录您的客户端 IP 地址')}
              </div>
            </div>
            <Switch
              checked={!!notificationSettings.recordIpLog}
              onChange={(v) => setField('recordIpLog', v)}
            />
          </div>
        </div>
      </section>

      {/* === SIDEBAR (admin only) === */}
      {hasSidebarSettingsPermission() && sectionConfigs.length > 0 && (
        <section className='aas-section' id='sec-sidebar'>
          <div className='aas-section-head'>
            <h2>
              {t('边栏设置')}{' '}
              <span className='aas-hint'>
                · {t('个性化侧边栏要显示的功能')}
              </span>
            </h2>
            <span className='aas-meta'>
              <button
                className='aas-btn'
                onClick={resetSidebarModules}
                style={{ marginRight: 8 }}
              >
                {t('重置')}
              </button>
              <button
                className='aas-btn primary'
                onClick={saveSidebarSettings}
                disabled={sidebarLoading}
              >
                {sidebarLoading ? '…' : t('保存边栏设置')}
              </button>
            </span>
          </div>
          <div className='aas-section-body'>
            {sectionConfigs.map((section) => {
              const sectionEnabled =
                sidebarModulesUser[section.key]?.enabled !== false;
              return (
                <React.Fragment key={section.key}>
                  <div className='aas-row'>
                    <div className='aas-row-icon'>
                      <I.Layout />
                    </div>
                    <div className='aas-row-info'>
                      <div className='aas-row-title'>{section.title}</div>
                      <div className='aas-row-desc'>{section.description}</div>
                    </div>
                    <Switch
                      checked={sectionEnabled}
                      onChange={handleSectionChange(section.key)}
                    />
                  </div>
                  <div className='aas-sub-grid'>
                    {section.modules
                      .filter((m) => isAllowedByAdmin(section.key, m.key))
                      .map((module) => {
                        const moduleEnabled =
                          sidebarModulesUser[section.key]?.[module.key] !==
                          false;
                        return (
                          <div
                            key={module.key}
                            className={`aas-sub-card ${sectionEnabled ? '' : 'disabled'}`}
                          >
                            <div className='aas-sub-info'>
                              <div className='aas-sub-title'>
                                {module.title}
                              </div>
                              <div className='aas-sub-desc'>
                                {module.description}
                              </div>
                            </div>
                            <Switch
                              checked={moduleEnabled}
                              onChange={handleModuleChange(
                                section.key,
                                module.key,
                              )}
                              disabled={!sectionEnabled}
                            />
                          </div>
                        );
                      })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
};

export default NotificationSettings;
