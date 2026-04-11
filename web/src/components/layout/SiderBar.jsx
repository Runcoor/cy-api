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

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLucideIcon } from '../../helpers/render';
import { useSidebar } from '../../hooks/common/useSidebar';
import { useMinimumLoadingTime } from '../../hooks/common/useMinimumLoadingTime';
import { isAdmin, isRoot, showError } from '../../helpers';
import SkeletonWrapper from './components/SkeletonWrapper';
import { Tooltip } from '@douyinfe/semi-ui';

const routerMap = {
  home: '/',
  channel: '/console/channel',
  finance: '/console/finance',
  token: '/console/token',
  redemption: '/console/redemption',
  topup: '/console/topup',
  user: '/console/user',
  subscription: '/console/subscription',
  log: '/console/log',
  midjourney: '/console/midjourney',
  setting: '/console/setting',
  about: '/about',
  detail: '/console',
  pricing: '/pricing',
  task: '/console/task',
  models: '/console/models',
  deployment: '/console/deployment',
  playground: '/console/playground',
  personal: '/console/personal',
};

const SiderBar = ({ onNavigate = () => {} }) => {
  const { t } = useTranslation();
  const {
    isModuleVisible,
    hasSectionVisibleModules,
    loading: sidebarLoading,
  } = useSidebar();

  const showSkeleton = useMinimumLoadingTime(sidebarLoading, 200);

  const [selectedKey, setSelectedKey] = useState('home');
  const [chatItems, setChatItems] = useState([]);
  const location = useLocation();
  const [routerMapState, setRouterMapState] = useState(routerMap);

  // Build sections — each section becomes one pill card.
  const sections = useMemo(() => {
    const chatSection = {
      key: 'chat',
      items: [
        { text: t('操练场'), itemKey: 'playground' },
      ].filter((it) => isModuleVisible('chat', it.itemKey)),
    };

    const consoleSection = {
      key: 'console',
      items: [
        {
          text: t('数据看板'),
          itemKey: 'detail',
          hidden: localStorage.getItem('enable_data_export') !== 'true',
        },
        { text: t('令牌管理'), itemKey: 'token' },
        { text: t('使用日志'), itemKey: 'log' },
        {
          text: t('绘图日志'),
          itemKey: 'midjourney',
          hidden: localStorage.getItem('enable_drawing') !== 'true',
        },
        {
          text: t('任务日志'),
          itemKey: 'task',
          hidden: localStorage.getItem('enable_task') !== 'true',
        },
      ]
        .filter((it) => !it.hidden)
        .filter((it) => isModuleVisible('console', it.itemKey)),
    };

    const personalSection = {
      key: 'personal',
      items: [
        { text: t('钱包管理'), itemKey: 'topup' },
        { text: t('个人设置'), itemKey: 'personal' },
      ].filter((it) => isModuleVisible('personal', it.itemKey)),
    };

    const adminSection = {
      key: 'admin',
      items: isAdmin()
        ? [
            { text: t('渠道管理'), itemKey: 'channel' },
            { text: t('财务报表'), itemKey: 'finance' },
            { text: t('订阅管理'), itemKey: 'subscription' },
            { text: t('模型管理'), itemKey: 'models' },
            { text: t('模型部署'), itemKey: 'deployment' },
            { text: t('兑换码管理'), itemKey: 'redemption' },
            { text: t('用户管理'), itemKey: 'user' },
            { text: t('系统设置'), itemKey: 'setting', requireRoot: true },
          ]
            .filter((it) => !it.requireRoot || isRoot())
            .filter((it) => isModuleVisible('admin', it.itemKey))
        : [],
    };

    return [chatSection, consoleSection, personalSection, adminSection].filter(
      (s) => s.items.length > 0 && hasSectionVisibleModules(s.key),
    );
  }, [t, isModuleVisible, hasSectionVisibleModules, chatItems]);

  // Load chat items
  useEffect(() => {
    let chats = localStorage.getItem('chats');
    if (chats) {
      try {
        chats = JSON.parse(chats);
        if (Array.isArray(chats)) {
          const newRouterMap = { ...routerMap };
          for (let i = 0; i < chats.length; i++) {
            newRouterMap['chat' + i] = '/console/chat/' + i;
          }
          setRouterMapState(newRouterMap);
          setChatItems(chats);
        }
      } catch (e) {
        showError('聊天数据解析失败');
      }
    }
  }, []);

  // Match selected key by current path
  useEffect(() => {
    const currentPath = location.pathname;
    let matchingKey = Object.keys(routerMapState).find(
      (key) => routerMapState[key] === currentPath,
    );
    if (!matchingKey && currentPath.startsWith('/console/chat/')) {
      const chatIndex = currentPath.split('/').pop();
      matchingKey = !isNaN(chatIndex) ? 'chat' + chatIndex : 'playground';
    }
    if (matchingKey) setSelectedKey(matchingKey);
  }, [location.pathname, routerMapState]);

  // Force-disable any legacy collapsed body class — pill sidebar is fixed-width.
  useEffect(() => {
    document.body.classList.remove('sidebar-collapsed');
  }, []);

  const renderIcon = (item) => {
    const isSelected = selectedKey === item.itemKey;
    const to = routerMapState[item.itemKey] || routerMap[item.itemKey];
    const inner = (
      <div
        className={`pill-icon ${isSelected ? 'pill-icon-selected' : ''}`}
        aria-label={item.text}
      >
        <div className='pill-icon-inner'>
          {getLucideIcon(item.itemKey, isSelected)}
        </div>
      </div>
    );
    const wrapped = to ? (
      <Link to={to} onClick={onNavigate} style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    ) : (
      <div>{inner}</div>
    );
    return (
      <Tooltip
        key={item.itemKey}
        content={item.text}
        position='right'
        mouseEnterDelay={80}
        className='pill-tooltip-semi'
      >
        {wrapped}
      </Tooltip>
    );
  };

  return (
    <div className='pill-sidebar-container'>
      <SkeletonWrapper
        loading={showSkeleton}
        type='sidebar'
        collapsed={true}
        showAdmin={isAdmin()}
      >
        <nav className='pill-sidebar-nav'>
          {sections.map((section) => (
            <div className='pill-section' key={section.key}>
              {section.items.map((item) => renderIcon(item))}
            </div>
          ))}
        </nav>
      </SkeletonWrapper>
    </div>
  );
};

export default SiderBar;
