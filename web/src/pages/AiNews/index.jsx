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

import React, { useState } from 'react';
import { Tabs, TabPane } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

import { useIsMobile } from '../../hooks/common/useIsMobile';
import SettingsTab from './SettingsTab';
import SourcesTab from './SourcesTab';
import BriefingsTab from './BriefingsTab';

const AiNews = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState('briefings');
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        padding: isMobile ? '12px 12px 24px' : '16px 24px',
        maxWidth: 1280,
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        {t('AI 前沿信息')}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        {t('Agent 每天采集 AI 资讯,生成深度分析与简单总结,经管理员审核后通过邮件分发给订阅用户')}
      </p>
      <Tabs type='line' activeKey={active} onChange={setActive}>
        <TabPane tab={t('简报')} itemKey='briefings'>
          <BriefingsTab />
        </TabPane>
        <TabPane tab={t('源管理')} itemKey='sources'>
          <SourcesTab />
        </TabPane>
        <TabPane tab={t('设置')} itemKey='settings'>
          <SettingsTab />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AiNews;
