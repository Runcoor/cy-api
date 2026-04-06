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
import { Layout, TabPane, Tabs } from '@douyinfe/semi-ui';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Calculator,
  Gauge,
  Shapes,
  Cog,
  MoreHorizontal,
  LayoutDashboard,
  MessageSquare,
  Palette,
  CreditCard,
  Server,
  Activity,
} from 'lucide-react';

import SystemSetting from '../../components/settings/SystemSetting';
import { isRoot } from '../../helpers';
import OtherSetting from '../../components/settings/OtherSetting';
import OperationSetting from '../../components/settings/OperationSetting';
import RateLimitSetting from '../../components/settings/RateLimitSetting';
import ModelSetting from '../../components/settings/ModelSetting';
import DashboardSetting from '../../components/settings/DashboardSetting';
import RatioSetting from '../../components/settings/RatioSetting';
import ChatsSetting from '../../components/settings/ChatsSetting';
import DrawingSetting from '../../components/settings/DrawingSetting';
import PaymentSetting from '../../components/settings/PaymentSetting';
import ModelDeploymentSetting from '../../components/settings/ModelDeploymentSetting';
import PerformanceSetting from '../../components/settings/PerformanceSetting';

const Setting = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [tabActiveKey, setTabActiveKey] = useState('1');
  let panes = [];

  if (isRoot()) {
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <Settings size={16} />
          {t('运营设置')}
        </span>
      ),
      content: <OperationSetting />,
      itemKey: 'operation',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <LayoutDashboard size={16} />
          {t('仪表盘设置')}
        </span>
      ),
      content: <DashboardSetting />,
      itemKey: 'dashboard',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <MessageSquare size={16} />
          {t('聊天设置')}
        </span>
      ),
      content: <ChatsSetting />,
      itemKey: 'chats',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <Palette size={16} />
          {t('绘图设置')}
        </span>
      ),
      content: <DrawingSetting />,
      itemKey: 'drawing',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <CreditCard size={16} />
          {t('支付设置')}
        </span>
      ),
      content: <PaymentSetting />,
      itemKey: 'payment',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <Calculator size={16} />
          {t('分组与模型定价设置')}
        </span>
      ),
      content: <RatioSetting />,
      itemKey: 'ratio',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <Gauge size={16} />
          {t('速率限制设置')}
        </span>
      ),
      content: <RateLimitSetting />,
      itemKey: 'ratelimit',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <Shapes size={16} />
          {t('模型相关设置')}
        </span>
      ),
      content: <ModelSetting />,
      itemKey: 'models',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <Server size={16} />
          {t('模型部署设置')}
        </span>
      ),
      content: <ModelDeploymentSetting />,
      itemKey: 'model-deployment',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <Activity size={16} />
          {t('性能设置')}
        </span>
      ),
      content: <PerformanceSetting />,
      itemKey: 'performance',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <Cog size={16} />
          {t('系统设置')}
        </span>
      ),
      content: <SystemSetting />,
      itemKey: 'system',
    });
    panes.push({
      tab: (
        <span className='flex items-center gap-1.5'>
          <MoreHorizontal size={16} />
          {t('其他设置')}
        </span>
      ),
      content: <OtherSetting />,
      itemKey: 'other',
    });
  }
  const onChangeTab = (key) => {
    setTabActiveKey(key);
    navigate(`?tab=${key}`);
  };
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      setTabActiveKey(tab);
    } else {
      onChangeTab('operation');
    }
  }, [location.search]);
  return (
    <div className='mt-[60px] px-2'>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Panel Header */}
        <div
          className='px-5 py-3 flex items-center gap-2.5'
          style={{
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className='flex items-center justify-center'
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
            }}
          >
            <Cog size={15} />
          </div>
          <h2
            className='text-base font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {t('系统设置')}
          </h2>
        </div>

        {/* Tabs Content */}
        <Layout>
          <Layout.Content>
            <Tabs
              type='card'
              collapsible
              activeKey={tabActiveKey}
              onChange={(key) => onChangeTab(key)}
            >
              {panes.map((pane) => (
                <TabPane itemKey={pane.itemKey} tab={pane.tab} key={pane.itemKey}>
                  {tabActiveKey === pane.itemKey && pane.content}
                </TabPane>
              ))}
            </Tabs>
          </Layout.Content>
        </Layout>
      </div>
    </div>
  );
};

export default Setting;
