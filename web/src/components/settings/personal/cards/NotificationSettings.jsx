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
import {
  Button,
  Card,
  Form,
  Toast,
  Switch,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import { IconMail, IconBell } from '@douyinfe/semi-icons';
import { ShieldCheck, Bell, DollarSign, Settings } from 'lucide-react';
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
  const [statusState] = useContext(StatusContext);
  const [userState, userDispatch] = useContext(UserContext);
  const isAdminOrRoot = (userState?.user?.role || 0) >= 10;

  // 左侧边栏设置相关状态
  const [sidebarLoading, setSidebarLoading] = useState(false);
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

  // Card style constants
  const sectionCardStyle = {
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-default)',
    backgroundColor: 'var(--surface)',
    padding: '24px',
  };

  const toggleItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--surface-hover)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const settingRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--surface-hover)',
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

      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        initValues={notificationSettings}
        onSubmit={handleSubmit}
      >
        {() => (
          <div className='space-y-6'>
            {/* ====== 通知配置 Card ====== */}
            <div style={sectionCardStyle}>
              <div className='flex items-center gap-3 mb-6'>
                <div
                  className='flex items-center justify-center'
                  style={{
                    width: 40, height: 40,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-hover)',
                  }}
                >
                  <Bell size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div className='font-bold text-base' style={{ color: 'var(--text-primary)' }}>
                    {t('通知配置')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {t('配置通知方式和预警阈值')}
                  </div>
                </div>
              </div>

              {/* Notification method toggles */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6'>
                <div style={toggleItemStyle}>
                  <div className='flex items-center gap-3'>
                    <IconMail style={{ color: 'var(--text-secondary)' }} />
                    <span className='font-medium text-sm' style={{ color: 'var(--text-primary)' }}>
                      {t('邮件通知')}
                    </span>
                  </div>
                  <Switch
                    checked={notificationSettings.warningType === 'email'}
                    onChange={(checked) => handleFormChange('warningType', checked ? 'email' : '')}
                    size='default'
                  />
                </div>

                {isAdminOrRoot && (
                  <div style={toggleItemStyle}>
                    <div className='flex items-center gap-3'>
                      <IconBell style={{ color: 'var(--text-secondary)' }} />
                      <span className='font-medium text-sm' style={{ color: 'var(--text-primary)' }}>
                        {t('上游模型更新通知')}
                      </span>
                    </div>
                    <Switch
                      checked={!!notificationSettings.upstreamModelUpdateNotifyEnabled}
                      onChange={(value) => handleFormChange('upstreamModelUpdateNotifyEnabled', value)}
                      size='default'
                    />
                  </div>
                )}
              </div>

              {/* Input fields row */}
              <div
                className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-5'
                style={{
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-hover)',
                }}
              >
                <div>
                  <Form.AutoComplete
                    field='warningThreshold'
                    label={
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                        {t('额度预警阈值')}{' '}
                        {renderQuotaWithPrompt(notificationSettings.warningThreshold)}
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
                    style={{ width: '100%' }}
                    noLabel={false}
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
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {t('当钱包或订阅剩余额度低于此数值时，系统将通过选择的方式发送通知')}
                  </div>
                </div>

                {notificationSettings.warningType === 'email' && (
                  <div>
                    <Form.Input
                      field='notificationEmail'
                      label={
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                          {t('通知邮箱')}
                        </span>
                      }
                      placeholder={t('留空则使用账号绑定的邮箱')}
                      onChange={(val) => handleFormChange('notificationEmail', val)}
                      prefix={<IconMail />}
                      showClear
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {t('设置用于接收额度预警的邮箱地址，不填则使用账号绑定的邮箱')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ====== 价格设置 Card ====== */}
            <div style={sectionCardStyle}>
              <div className='flex items-center gap-3 mb-6'>
                <div
                  className='flex items-center justify-center'
                  style={{
                    width: 40, height: 40,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-hover)',
                  }}
                >
                  <DollarSign size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div className='font-bold text-base' style={{ color: 'var(--text-primary)' }}>
                    {t('价格设置')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {t('管理模型费用计算的全局偏好')}
                  </div>
                </div>
              </div>

              <div style={settingRowStyle}>
                <div style={{ flex: 1, paddingRight: 24 }}>
                  <div className='font-semibold text-sm' style={{ color: 'var(--text-primary)', marginBottom: 4 }}>
                    {t('接受未设置价格模型')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {t('当模型没有设置价格时仍接受调用，仅当您信任该网站时使用，可能会产生高额费用')}
                  </div>
                </div>
                <Switch
                  checked={!!notificationSettings.acceptUnsetModelRatioModel}
                  onChange={(value) => handleFormChange('acceptUnsetModelRatioModel', value)}
                  size='large'
                />
              </div>
            </div>

            {/* ====== 隐私设置 Card ====== */}
            <div style={sectionCardStyle}>
              <div className='flex items-center gap-3 mb-6'>
                <div
                  className='flex items-center justify-center'
                  style={{
                    width: 40, height: 40,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-hover)',
                  }}
                >
                  <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div className='font-bold text-base' style={{ color: 'var(--text-primary)' }}>
                    {t('隐私设置')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {t('配置数据采集和留存策略')}
                  </div>
                </div>
              </div>

              <div style={settingRowStyle}>
                <div style={{ flex: 1, paddingRight: 24 }}>
                  <div className='font-semibold text-sm' style={{ color: 'var(--text-primary)', marginBottom: 4 }}>
                    {t('记录请求与错误日志IP')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {t('开启后，仅"消费"和"错误"日志将记录您的客户端IP地址')}
                  </div>
                </div>
                <Switch
                  checked={!!notificationSettings.recordIpLog}
                  onChange={(value) => handleFormChange('recordIpLog', value)}
                  size='large'
                />
              </div>
            </div>

            {/* ====== 边栏设置 Card ====== */}
            {hasSidebarSettingsPermission() && (
              <div style={sectionCardStyle}>
                <div className='flex items-center gap-3 mb-6'>
                  <div
                    className='flex items-center justify-center'
                    style={{
                      width: 40, height: 40,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-hover)',
                    }}
                  >
                    <Settings size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className='font-bold text-base' style={{ color: 'var(--text-primary)' }}>
                      {t('边栏设置')}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {t('您可以个性化设置侧边栏的要显示功能')}
                    </div>
                  </div>
                </div>

                <div className='space-y-5'>
                  {sectionConfigs.map((section) => (
                    <div key={section.key}>
                      {/* Section header with toggle */}
                      <div
                        className='flex justify-between items-center mb-3'
                        style={{
                          ...settingRowStyle,
                          backgroundColor: 'var(--surface-hover)',
                        }}
                      >
                        <div>
                          <div className='font-semibold text-sm' style={{ color: 'var(--text-primary)' }}>
                            {section.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {section.description}
                          </div>
                        </div>
                        <Switch
                          checked={sidebarModulesUser[section.key]?.enabled !== false}
                          onChange={handleSectionChange(section.key)}
                          size='default'
                        />
                      </div>

                      {/* Module toggles grid */}
                      <Row gutter={[12, 12]}>
                        {section.modules
                          .filter((module) => isAllowedByAdmin(section.key, module.key))
                          .map((module) => (
                            <Col key={module.key} xs={24} sm={24} md={12} lg={8} xl={8}>
                              <Card
                                className={sidebarModulesUser[section.key]?.enabled !== false ? '' : 'opacity-50'}
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
                                      style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-secondary)', marginTop: '4px' }}
                                    >
                                      {module.description}
                                    </span>
                                  </div>
                                  <div className='ml-4'>
                                    <Switch
                                      checked={sidebarModulesUser[section.key]?.[module.key] !== false}
                                      onChange={handleModuleChange(section.key, module.key)}
                                      size='default'
                                      disabled={sidebarModulesUser[section.key]?.enabled === false}
                                    />
                                  </div>
                                </div>
                              </Card>
                            </Col>
                          ))}
                      </Row>
                    </div>
                  ))}
                </div>

                {/* Sidebar action buttons */}
                <div className='flex justify-end gap-3 mt-6 pt-4' style={{ borderTop: '1px solid var(--border-default)' }}>
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
                    {t('保存边栏设置')}
                  </Button>
                </div>
              </div>
            )}

            {/* ====== Save Button ====== */}
            <div className='flex justify-end pt-2'>
              <Button
                type='primary'
                size='large'
                onClick={handleSubmit}
                className='!rounded-[var(--radius-md)]'
                style={{ paddingLeft: 32, paddingRight: 32 }}
              >
                {t('保存设置')}
              </Button>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
};

export default NotificationSettings;
