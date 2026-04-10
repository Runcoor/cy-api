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

import React, { useMemo } from 'react';
import { ShieldCheck, Terminal, Gauge, Calculator } from 'lucide-react';

export const useNavigation = (t, docsLink, headerNavModules) => {
  const mainNavLinks = useMemo(() => {
    // 默认配置，如果没有传入配置则显示所有模块
    const defaultModules = {
      home: true,
      console: true,
      pricing: true,
      docs: true,
      about: true,
    };

    // 使用传入的配置或默认配置
    const modules = headerNavModules || defaultModules;

    const allLinks = [
      {
        text: t('首页'),
        itemKey: 'home',
        to: '/',
      },
      {
        text: t('控制台'),
        itemKey: 'console',
        to: '/console',
      },
      {
        text: t('模型广场'),
        itemKey: 'pricing',
        to: '/pricing',
      },
      {
        text: t('价格'),
        itemKey: 'plans',
        to: '/plans',
      },
      {
        text: t('文档'),
        itemKey: 'docs',
        to: '/docs',
      },
      {
        text: t('工具'),
        itemKey: 'tools',
        children: [
          {
            text: t('模型验真'),
            itemKey: 'verifier',
            to: '/verifier',
            description: t('验证代理是否真的在响应目标模型'),
            icon: React.createElement(ShieldCheck, { size: 16 }),
          },
          {
            text: t('cURL 生成器'),
            itemKey: 'curl-gen',
            to: '/tools/curl',
            description: t('可视化构造请求,一键生成可复制代码'),
            icon: React.createElement(Terminal, { size: 16 }),
          },
          {
            text: t('Token 计算器'),
            itemKey: 'tokens',
            to: '/tools/tokens',
            description: t('估算 Token 数量并对比多模型调用成本'),
            icon: React.createElement(Calculator, { size: 16 }),
          },
          {
            text: t('端点延迟测试'),
            itemKey: 'latency',
            to: '/tools/latency',
            description: t('连续探测,统计 P50 / P95 / 首字延迟'),
            icon: React.createElement(Gauge, { size: 16 }),
          },
        ],
      },
    ];

    // 根据配置过滤导航链接
    return allLinks.filter((link) => {
      if (link.itemKey === 'docs') {
        return modules.docs !== false;
      }
      if (link.itemKey === 'tools') {
        return true; // always visible
      }
      if (link.itemKey === 'plans') {
        return true; // always visible
      }
      if (link.itemKey === 'pricing') {
        // 支持新的pricing配置格式
        return typeof modules.pricing === 'object'
          ? modules.pricing.enabled
          : modules.pricing;
      }
      return modules[link.itemKey] === true;
    });
  }, [t, docsLink, headerNavModules]);

  return {
    mainNavLinks,
  };
};
