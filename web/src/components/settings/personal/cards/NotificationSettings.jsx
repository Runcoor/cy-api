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

import React, { useRef, useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,

  Card,
  Avatar,
  Form,
  Radio,
  Toast,
  Tabs,
  TabPane,
  Switch,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import { IconMail, IconKey, IconBell, IconLink } from '@douyinfe/semi-icons';
import { ShieldCheck, Bell, DollarSign, Settings, Globe, Check } from 'lucide-react';
import { normalizeLanguage } from '../../../../i18n/language';
import {
  renderQuotaWithPrompt,
  API,
  showSuccess,
  showError,
} from '../../../../helpers';
import CodeViewer from '../../../playground/CodeViewer';
import { StatusContext } from '../../../../context/Status';
import { UserContext } from '../../../../context/User';
import { useUserPermissions } from '../../../../hooks/common/useUserPermissions';
import {
  mergeAdminConfig,
  useSidebar,
} from '../../../../hooks/common/useSidebar';

const NotificationSettings = ({
  t,
  notificationSettings,
  handleNotificationSettingChange,
  saveNotificationSettings,
}) => {
  const formApiRef = useRef(null);
  const { i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [userState, userDispatch] = useContext(UserContext);
  const isAdminOrRoot = (userState?.user?.role || 0) >= 10;

  // Language settings
  const languageOptions = [
    { value: 'zh-CN', label: '简体中文', shortCode: '中' },
    { value: 'zh-TW', label: '繁體中文', shortCode: '繁' },
    { value: 'en',    label: 'English',  shortCode: 'EN' },
    { value: 'fr',    label: 'Français', shortCode: 'FR' },
    { value: 'ru',    label: 'Русский',  shortCode: 'RU' },
    { value: 'ja',    label: '日本語',   shortCode: '日' },
    { value: 'vi',    label: 'Tiếng Việt', shortCode: 'VI' },
  ];
  const [currentLanguage, setCurrentLanguage] = useState(normalizeLanguage(i18n.language) || 'zh-CN');
  const [langLoading, setLangLoading] = useState(false);

  useEffect(() => {
    if (userState?.user?.setting) {
      try {
        const settings = JSON.parse(userState.user.setting);
        if (settings.language) {
          const lang = normalizeLanguage(settings.language);
          setCurrentLanguage(lang);
          if (i18n.language !== lang) i18n.changeLanguage(lang);
        }
      } catch (e) { /* ignore */ }
    }
  }, [userState?.user?.setting, i18n]);

  const handleLanguageChange = async (lang) => {
    if (lang === currentLanguage) return;
    setLangLoading(true);
    const prev = currentLanguage;
    try {
      setCurrentLanguage(lang);
      i18n.changeLanguage(lang);
      localStorage.setItem('i18nextLng', lang);
      const res = await API.put('/api/user/self', { language: lang });
      if (res.data.success) {
        showSuccess(t('语言偏好已保存'));
        let settings = {};
        if (userState?.user?.setting) {
          try { settings = JSON.parse(userState.user.setting) || {}; } catch (e) { settings = {}; }
        }
        settings.language = lang;
        const nextUser = { ...userState.user, setting: JSON.stringify(settings) };
        userDispatch({ type: 'login', payload: nextUser });
        localStorage.setItem('user', JSON.stringify(nextUser));
      } else {
        showError(res.data.message || t('保存失败'));
        setCurrentLanguage(prev); i18n.changeLanguage(prev); localStorage.setItem('i18nextLng', prev);
      }
    } catch (error) {
      showError(t('保存失败，请重试'));
      setCurrentLanguage(prev); i18n.changeLanguage(prev); localStorage.setItem('i18nextLng', prev);
    } finally { setLangLoading(false); }
  };

  // 左侧边栏设置相关状态
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('notification');
  const [sidebarModulesUser, setSidebarModulesUser] = useState({
    chat: {
      enabled: true,
      playground: true,
      chat: true,
    },
    console: {
      enabled: true,
      detail: true,
      token: true,
      log: true,
      midjourney: true,
      task: true,
    },
    personal: {
      enabled: true,
      topup: true,
      personal: true,
    },
    admin: {
      enabled: true,
      channel: true,
      models: true,
      deployment: true,
      subscription: true,
      redemption: true,
      user: true,
      setting: true,
    },
  });
  const [adminConfig, setAdminConfig] = useState(null);

  // 使用后端权限验证替代前端角色判断
  const {
    permissions,
    loading: permissionsLoading,
    hasSidebarSettingsPermission,
    isSidebarSectionAllowed,
    isSidebarModuleAllowed,
  } = useUserPermissions();

  // 使用useSidebar钩子获取刷新方法
  const { refreshUserConfig } = useSidebar();

  // 左侧边栏设置处理函数
  const handleSectionChange = (sectionKey) => {
    return (checked) => {
      const newModules = {
        ...sidebarModulesUser,
        [sectionKey]: {
          ...sidebarModulesUser[sectionKey],
          enabled: checked,
        },
      };
      setSidebarModulesUser(newModules);
    };
  };

  const handleModuleChange = (sectionKey, moduleKey) => {
    return (checked) => {
      const newModules = {
        ...sidebarModulesUser,
        [sectionKey]: {
          ...sidebarModulesUser[sectionKey],
          [moduleKey]: checked,
        },
      };
      setSidebarModulesUser(newModules);
    };
  };

  const saveSidebarSettings = async () => {
    setSidebarLoading(true);
    try {
      const res = await API.put('/api/user/self', {
        sidebar_modules: JSON.stringify(sidebarModulesUser),
      });
      if (res.data.success) {
        showSuccess(t('侧边栏设置保存成功'));

        // 刷新useSidebar钩子中的用户配置，实现实时更新
        await refreshUserConfig();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('保存失败'));
    }
    setSidebarLoading(false);
  };

  const resetSidebarModules = () => {
    const defaultConfig = {
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
        user: true,
        setting: true,
      },
    };
    setSidebarModulesUser(defaultConfig);
  };

  // 加载左侧边栏配置
  useEffect(() => {
    const loadSidebarConfigs = async () => {
      try {
        // 获取管理员全局配置
        if (statusState?.status?.SidebarModulesAdmin) {
          try {
            const adminConf = JSON.parse(
              statusState.status.SidebarModulesAdmin,
            );
            setAdminConfig(mergeAdminConfig(adminConf));
          } catch (error) {
            setAdminConfig(mergeAdminConfig(null));
          }
        } else {
          setAdminConfig(mergeAdminConfig(null));
        }

        // 获取用户个人配置
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
        console.error('加载边栏配置失败:', error);
      }
    };

    loadSidebarConfigs();
  }, [statusState]);

  // 初始化表单值
  useEffect(() => {
    if (formApiRef.current && notificationSettings) {
      formApiRef.current.setValues(notificationSettings);
    }
  }, [notificationSettings]);

  // 处理表单字段变化
  const handleFormChange = (field, value) => {
    handleNotificationSettingChange(field, value);
  };

  // 检查功能是否被管理员允许
  const isAllowedByAdmin = (sectionKey, moduleKey = null) => {
    if (!adminConfig) return true;

    if (moduleKey) {
      return (
        adminConfig[sectionKey]?.enabled && adminConfig[sectionKey]?.[moduleKey]
      );
    } else {
      return adminConfig[sectionKey]?.enabled;
    }
  };

  // 区域配置数据（根据权限过滤）
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
    // 管理员区域：根据后端权限控制显示
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
        { key: 'user', title: t('用户管理'), description: t('用户账户管理') },
        {
          key: 'setting',
          title: t('系统设置'),
          description: t('系统参数配置'),
        },
      ],
    },
  ]
    .filter((section) => {
      // 使用后端权限验证替代前端角色判断
      return isSidebarSectionAllowed(section.key);
    })
    .map((section) => ({
      ...section,
      modules: section.modules.filter((module) =>
        isSidebarModuleAllowed(section.key, module.key),
      ),
    }))
    .filter(
      (section) =>
        // 过滤掉没有可用模块的区域
        section.modules.length > 0 && isAllowedByAdmin(section.key),
    );

  // 表单提交
  const handleSubmit = () => {
    if (formApiRef.current) {
      formApiRef.current
        .validate()
        .then(() => {
          saveNotificationSettings();
        })
        .catch((errors) => {
          console.log('表单验证失败:', errors);
          Toast.error(t('请检查表单填写是否正确'));
        });
    } else {
      saveNotificationSettings();
    }
  };

  return (
    <div className='space-y-6'>
      {/* Section header */}
      <div className='flex items-center gap-3 mb-4'>
        <span
          className='inline-flex items-center justify-center'
          style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)' }}
        >
          <Settings size={16} style={{ color: 'var(--accent)' }} />
        </span>
        <h3 className='text-lg font-bold' style={{ color: 'var(--text-primary)' }}>
          {t('通知与偏好')}
        </h3>
      </div>

      {/* Actions */}
      <div className='flex justify-end gap-3'>
        {activeTabKey === 'sidebar' ? (
          <>
            <Button
              type='tertiary'
              onClick={resetSidebarModules}
              className='!rounded-[var(--radius-md)]'
            >
              {t('重置为默认')}
            </Button>
            <Button
              type='primary'
              onClick={saveSidebarSettings}
              loading={sidebarLoading}
              className='!rounded-[var(--radius-md)]'
            >
              {t('保存设置')}
            </Button>
          </>
        ) : (
          <Button type='primary' onClick={handleSubmit} className='!rounded-[var(--radius-md)]'>
            {t('保存设置')}
          </Button>
        )}
      </div>

      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        initValues={notificationSettings}
        onSubmit={handleSubmit}
      >
        {() => (
          <Tabs
            type='card'
            defaultActiveKey='notification'
            onChange={(key) => setActiveTabKey(key)}
          >
            {/* 通知配置 Tab */}
            <TabPane
              tab={
                <div className='flex items-center'>
                  <Bell size={16} className='mr-2' />
                  {t('通知配置')}
                </div>
              }
              itemKey='notification'
            >
              <div className='py-4'>
                <Form.RadioGroup
                  field='warningType'
                  label={t('通知方式')}
                  initValue={notificationSettings.warningType}
                  onChange={(value) => handleFormChange('warningType', value)}
                  rules={[{ required: true, message: t('请选择通知方式') }]}
                >
                  <Radio value='email'>{t('邮件通知')}</Radio>
                  <Radio value='webhook'>{t('Webhook通知')}</Radio>
                  <Radio value='bark'>{t('Bark通知')}</Radio>
                  <Radio value='gotify'>{t('Gotify通知')}</Radio>
                </Form.RadioGroup>

                <Form.AutoComplete
                  field='warningThreshold'
                  label={
                    <span>
                      {t('额度预警阈值')}{' '}
                      {renderQuotaWithPrompt(
                        notificationSettings.warningThreshold,
                      )}
                    </span>
                  }
                  placeholder={t('请输入预警额度')}
                  data={[
                    { value: 100000, label: '0.2$' },
                    { value: 500000, label: '1$' },
                    { value: 1000000, label: '2$' },
                    { value: 5000000, label: '10$' },
                  ]}
                  onChange={(val) => handleFormChange('warningThreshold', val)}
                  prefix={<IconBell />}
                  extraText={t(
                    '当钱包或订阅剩余额度低于此数值时，系统将通过选择的方式发送通知',
                  )}
                  style={{ width: '100%', maxWidth: '300px' }}
                  rules={[
                    { required: true, message: t('请输入预警阈值') },
                    {
                      validator: (rule, value) => {
                        const numValue = Number(value);
                        if (isNaN(numValue) || numValue <= 0) {
                          return Promise.reject(t('预警阈值必须为正数'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                />

                {isAdminOrRoot && (
                  <Form.Switch
                    field='upstreamModelUpdateNotifyEnabled'
                    label={t('接收上游模型更新通知')}
                    checkedText={t('开')}
                    uncheckedText={t('关')}
                    onChange={(value) =>
                      handleFormChange('upstreamModelUpdateNotifyEnabled', value)
                    }
                    extraText={t(
                      '仅管理员可用。开启后，当系统定时检测全部渠道发现上游模型变更或检测异常时，将按你选择的通知方式发送汇总通知；渠道或模型过多时会自动省略部分明细。',
                    )}
                  />
                )}

                {/* 邮件通知设置 */}
                {notificationSettings.warningType === 'email' && (
                  <Form.Input
                    field='notificationEmail'
                    label={t('通知邮箱')}
                    placeholder={t('留空则使用账号绑定的邮箱')}
                    onChange={(val) =>
                      handleFormChange('notificationEmail', val)
                    }
                    prefix={<IconMail />}
                    extraText={t(
                      '设置用于接收额度预警的邮箱地址，不填则使用账号绑定的邮箱',
                    )}
                    showClear
                  />
                )}

                {/* Webhook通知设置 */}
                {notificationSettings.warningType === 'webhook' && (
                  <>
                    <Form.Input
                      field='webhookUrl'
                      label={t('Webhook地址')}
                      placeholder={t(
                        '请输入Webhook地址，例如: https://example.com/webhook',
                      )}
                      onChange={(val) => handleFormChange('webhookUrl', val)}
                      prefix={<IconLink />}
                      extraText={t(
                        '只支持HTTPS，系统将以POST方式发送通知，请确保地址可以接收POST请求',
                      )}
                      showClear
                      rules={[
                        {
                          required:
                            notificationSettings.warningType === 'webhook',
                          message: t('请输入Webhook地址'),
                        },
                        {
                          pattern: /^https:\/\/.+/,
                          message: t('Webhook地址必须以https://开头'),
                        },
                      ]}
                    />

                    <Form.Input
                      field='webhookSecret'
                      label={t('接口凭证')}
                      placeholder={t('请输入密钥')}
                      onChange={(val) => handleFormChange('webhookSecret', val)}
                      prefix={<IconKey />}
                      extraText={t(
                        '密钥将以Bearer方式添加到请求头中，用于验证webhook请求的合法性',
                      )}
                      showClear
                    />

                    <Form.Slot label={t('Webhook请求结构说明')}>
                      <div>
                        <div style={{ height: '200px', marginBottom: '12px' }}>
                          <CodeViewer
                            content={{
                              type: 'quota_exceed',
                              title: '额度预警通知',
                              content:
                                '您的额度即将用尽，当前剩余额度为 {{value}}',
                              values: ['$0.99'],
                              timestamp: 1739950503,
                            }}
                            title='webhook'
                            language='json'
                          />
                        </div>
                        <div className='text-xs leading-relaxed' style={{ color: 'var(--text-muted)' }}>
                          <div>
                            <strong>type:</strong>{' '}
                            {t('通知类型 (quota_exceed: 额度预警)')}{' '}
                          </div>
                          <div>
                            <strong>title:</strong> {t('通知标题')}
                          </div>
                          <div>
                            <strong>content:</strong>{' '}
                            {t('通知内容，支持 {{value}} 变量占位符')}
                          </div>
                          <div>
                            <strong>values:</strong>{' '}
                            {t('按顺序替换content中的变量占位符')}
                          </div>
                          <div>
                            <strong>timestamp:</strong> {t('Unix时间戳')}
                          </div>
                        </div>
                      </div>
                    </Form.Slot>
                  </>
                )}

                {/* Bark推送设置 */}
                {notificationSettings.warningType === 'bark' && (
                  <>
                    <Form.Input
                      field='barkUrl'
                      label={t('Bark推送URL')}
                      placeholder={t(
                        '请输入Bark推送URL，例如: https://api.day.app/yourkey/{{title}}/{{content}}',
                      )}
                      onChange={(val) => handleFormChange('barkUrl', val)}
                      prefix={<IconLink />}
                      extraText={t(
                        '支持HTTP和HTTPS，模板变量: {{title}} (通知标题), {{content}} (通知内容)',
                      )}
                      showClear
                      rules={[
                        {
                          required: notificationSettings.warningType === 'bark',
                          message: t('请输入Bark推送URL'),
                        },
                        {
                          pattern: /^https?:\/\/.+/,
                          message: t('Bark推送URL必须以http://或https://开头'),
                        },
                      ]}
                    />

                    <div className='mt-3 p-4' style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-lg)' }}>
                      <div className='text-sm mb-3' style={{ color: 'var(--text-primary)' }}>
                        <strong>{t('模板示例')}</strong>
                      </div>
                      <div className='text-xs font-mono p-3 mb-4' style={{ color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                        https://api.day.app/yourkey/{'{{title}}'}/
                        {'{{content}}'}?sound=alarm&group=quota
                      </div>
                      <div className='text-xs space-y-2' style={{ color: 'var(--text-muted)' }}>
                        <div>
                          • <strong>{'title'}:</strong> {t('通知标题')}
                        </div>
                        <div>
                          • <strong>{'content'}:</strong> {t('通知内容')}
                        </div>
                        <div className='mt-3 pt-3' style={{ borderTop: '1px solid var(--border-default)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {t('更多参数请参考')}
                          </span>{' '}
                          <a
                            href='https://github.com/Finb/Bark'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='font-medium' style={{ color: 'var(--accent)' }}
                          >
                            Bark {t('官方文档')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Gotify推送设置 */}
                {notificationSettings.warningType === 'gotify' && (
                  <>
                    <Form.Input
                      field='gotifyUrl'
                      label={t('Gotify服务器地址')}
                      placeholder={t(
                        '请输入Gotify服务器地址，例如: https://gotify.example.com',
                      )}
                      onChange={(val) => handleFormChange('gotifyUrl', val)}
                      prefix={<IconLink />}
                      extraText={t(
                        '支持HTTP和HTTPS，填写Gotify服务器的完整URL地址',
                      )}
                      showClear
                      rules={[
                        {
                          required:
                            notificationSettings.warningType === 'gotify',
                          message: t('请输入Gotify服务器地址'),
                        },
                        {
                          pattern: /^https?:\/\/.+/,
                          message: t(
                            'Gotify服务器地址必须以http://或https://开头',
                          ),
                        },
                      ]}
                    />

                    <Form.Input
                      field='gotifyToken'
                      label={t('Gotify应用令牌')}
                      placeholder={t('请输入Gotify应用令牌')}
                      onChange={(val) => handleFormChange('gotifyToken', val)}
                      prefix={<IconKey />}
                      extraText={t(
                        '在Gotify服务器创建应用后获得的令牌，用于发送通知',
                      )}
                      showClear
                      rules={[
                        {
                          required:
                            notificationSettings.warningType === 'gotify',
                          message: t('请输入Gotify应用令牌'),
                        },
                      ]}
                    />

                    <Form.AutoComplete
                      field='gotifyPriority'
                      label={t('消息优先级')}
                      placeholder={t('请选择消息优先级')}
                      data={[
                        { value: 0, label: t('0 - 最低') },
                        { value: 2, label: t('2 - 低') },
                        { value: 5, label: t('5 - 正常（默认）') },
                        { value: 8, label: t('8 - 高') },
                        { value: 10, label: t('10 - 最高') },
                      ]}
                      onChange={(val) =>
                        handleFormChange('gotifyPriority', val)
                      }
                      prefix={<IconBell />}
                      extraText={t('消息优先级，范围0-10，默认为5')}
                      style={{ width: '100%', maxWidth: '300px' }}
                    />

                    <div className='mt-3 p-4' style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-lg)' }}>
                      <div className='text-sm mb-3' style={{ color: 'var(--text-primary)' }}>
                        <strong>{t('配置说明')}</strong>
                      </div>
                      <div className='text-xs space-y-2' style={{ color: 'var(--text-muted)' }}>
                        <div>
                          1. {t('在Gotify服务器的应用管理中创建新应用')}
                        </div>
                        <div>
                          2.{' '}
                          {t(
                            '复制应用的令牌（Token）并填写到上方的应用令牌字段',
                          )}
                        </div>
                        <div>3. {t('填写Gotify服务器的完整URL地址')}</div>
                        <div className='mt-3 pt-3' style={{ borderTop: '1px solid var(--border-default)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {t('更多信息请参考')}
                          </span>{' '}
                          <a
                            href='https://gotify.net/'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='font-medium' style={{ color: 'var(--accent)' }}
                          >
                            Gotify {t('官方文档')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabPane>

            {/* 价格设置 Tab */}
            <TabPane
              tab={
                <div className='flex items-center'>
                  <DollarSign size={16} className='mr-2' />
                  {t('价格设置')}
                </div>
              }
              itemKey='pricing'
            >
              <div className='py-4'>
                <Form.Switch
                  field='acceptUnsetModelRatioModel'
                  label={t('接受未设置价格模型')}
                  checkedText={t('开')}
                  uncheckedText={t('关')}
                  onChange={(value) =>
                    handleFormChange('acceptUnsetModelRatioModel', value)
                  }
                  extraText={t(
                    '当模型没有设置价格时仍接受调用，仅当您信任该网站时使用，可能会产生高额费用',
                  )}
                />
              </div>
            </TabPane>

            {/* 隐私设置 Tab */}
            <TabPane
              tab={
                <div className='flex items-center'>
                  <ShieldCheck size={16} className='mr-2' />
                  {t('隐私设置')}
                </div>
              }
              itemKey='privacy'
            >
              <div className='py-4'>
                <Form.Switch
                  field='recordIpLog'
                  label={t('记录请求与错误日志IP')}
                  checkedText={t('开')}
                  uncheckedText={t('关')}
                  onChange={(value) => handleFormChange('recordIpLog', value)}
                  extraText={t(
                    '开启后，仅"消费"和"错误"日志将记录您的客户端IP地址',
                  )}
                />
              </div>
            </TabPane>

            {/* 左侧边栏设置 Tab - 根据后端权限控制显示 */}
            {hasSidebarSettingsPermission() && (
              <TabPane
                tab={
                  <div className='flex items-center'>
                    <Settings size={16} className='mr-2' />
                    {t('边栏设置')}
                  </div>
                }
                itemKey='sidebar'
              >
                <div className='py-4'>
                  <div className='mb-4'>
                    <span
                      style={{
                        fontSize: '12px',
                        lineHeight: '1.5',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {t('您可以个性化设置侧边栏的要显示功能')}
                    </span>
                  </div>
                  {/* 边栏设置功能区域容器 */}
                  <div
                    className='p-4'
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface)',
                    }}
                  >
                    {sectionConfigs.map((section) => (
                      <div key={section.key} className='mb-6'>
                        {/* 区域标题和总开关 */}
                        <div
                          className='flex justify-between items-center mb-4 p-4'
                          style={{
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--surface-hover)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div>
                            <div className='font-semibold text-base mb-1' style={{ color: 'var(--text-primary)' }}>
                              {section.title}
                            </div>
                            <span
                              style={{
                                fontSize: '12px',
                                lineHeight: '1.5',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {section.description}
                            </span>
                          </div>
                          <Switch
                            checked={
                              sidebarModulesUser[section.key]?.enabled !== false
                            }
                            onChange={handleSectionChange(section.key)}
                            size='default'
                          />
                        </div>

                        {/* 功能模块网格 */}
                        <Row gutter={[12, 12]}>
                          {section.modules
                            .filter((module) =>
                              isAllowedByAdmin(section.key, module.key),
                            )
                            .map((module) => (
                              <Col
                                key={module.key}
                                xs={24}
                                sm={24}
                                md={12}
                                lg={8}
                                xl={8}
                              >
                                <Card
                                  className={`${
                                    sidebarModulesUser[section.key]?.enabled !==
                                    false
                                      ? ''
                                      : 'opacity-50'
                                  }`}
                                  bodyStyle={{ padding: '16px' }}
                                  style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}
                                  hoverable
                                >
                                  <div className='flex justify-between items-center h-full'>
                                    <div className='flex-1 text-left'>
                                      <div className='font-semibold text-sm mb-1' style={{ color: 'var(--text-primary)' }}>
                                        {module.title}
                                      </div>
                                      <span
                                        className='block'
                                        style={{
                                          fontSize: '12px',
                                          lineHeight: '1.5',
                                          color: 'var(--text-secondary)',
                                          marginTop: '4px',
                                        }}
                                      >
                                        {module.description}
                                      </span>
                                    </div>
                                    <div className='ml-4'>
                                      <Switch
                                        checked={
                                          sidebarModulesUser[section.key]?.[
                                            module.key
                                          ] !== false
                                        }
                                        onChange={handleModuleChange(
                                          section.key,
                                          module.key,
                                        )}
                                        size='default'
                                        disabled={
                                          sidebarModulesUser[section.key]
                                            ?.enabled === false
                                        }
                                      />
                                    </div>
                                  </div>
                                </Card>
                              </Col>
                            ))}
                        </Row>
                      </div>
                    ))}
                  </div>{' '}
                  {/* 关闭边栏设置功能区域容器 */}
                </div>
              </TabPane>
            )}
            {/* 语言设置 Tab */}
            <TabPane
              tab={
                <div className='flex items-center'>
                  <Globe size={16} className='mr-2' />
                  {t('语言设置')}
                </div>
              }
              itemKey='language'
            >
              <div className='py-4'>
                <div className='mb-3'>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    {t('当前使用')}:{' '}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {languageOptions.find((o) => o.value === currentLanguage)?.label || currentLanguage}
                    </span>
                  </p>
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2'>
                  {languageOptions.map((opt) => {
                    const active = currentLanguage === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleLanguageChange(opt.value)}
                        disabled={langLoading}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${active ? 'transparent' : 'var(--border-default)'}`,
                          background: active ? 'var(--accent-light)' : 'var(--bg-subtle)',
                          color: active ? 'var(--accent)' : 'var(--text-primary)',
                          cursor: langLoading ? 'wait' : 'pointer',
                          opacity: langLoading && !active ? 0.5 : 1,
                          transition: 'all 150ms ease',
                          textAlign: 'left',
                          minHeight: 48,
                          boxShadow: active ? '0 0 0 1px var(--accent), 0 4px 12px -4px rgba(0,114,255,0.2)' : 'none',
                        }}
                      >
                        <span
                          style={{
                            flexShrink: 0, width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: active ? 'var(--accent-gradient)' : 'var(--surface)',
                            color: active ? '#fff' : 'var(--text-secondary)',
                            fontSize: 11, fontWeight: 700,
                            border: active ? 'none' : '1px solid var(--border-default)',
                          }}
                        >
                          {opt.shortCode}
                        </span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opt.label}
                        </span>
                        {active && <Check size={14} style={{ flexShrink: 0, color: 'var(--accent)', strokeWidth: 3 }} />}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '12px 0 0', lineHeight: 1.5 }}>
                  {t('提示：语言偏好会同步到您登录的所有设备，并影响API返回的错误消息语言。')}
                </p>
              </div>
            </TabPane>
          </Tabs>
        )}
      </Form>
    </div>
  );
};

export default NotificationSettings;
