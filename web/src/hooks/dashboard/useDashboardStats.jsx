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

import { useMemo } from 'react';
import { Wallet, Activity, Zap, Gauge } from 'lucide-react';
import {
  IconMoneyExchangeStroked,
  IconHistogram,
  IconCoinMoneyStroked,
  IconTextStroked,
  IconPulse,
  IconStopwatchStroked,
  IconTypograph,
  IconSend,
} from '@douyinfe/semi-icons';
import { renderQuota } from '../../helpers';
import { createSectionTitle } from '../../helpers/dashboard';

export const useDashboardStats = (
  userState,
  consumeQuota,
  consumeTokens,
  times,
  trendData,
  performanceMetrics,
  navigate,
  t,
) => {
  const groupedStatsData = useMemo(
    () => [
      {
        title: createSectionTitle(Wallet, t('账户数据')),
        color: 'accent',
        items: [
          {
            title: t('当前余额'),
            value: renderQuota(userState?.user?.quota),
            icon: <IconMoneyExchangeStroked />,
            avatarColor: 'blue',
            trendData: [],
            trendColor: '#007AFF',
          },
          {
            title: t('历史消耗'),
            value: renderQuota(userState?.user?.used_quota),
            icon: <IconHistogram />,
            avatarColor: 'purple',
            trendData: [],
            trendColor: '#AF52DE',
          },
        ],
      },
      {
        title: createSectionTitle(Activity, t('使用统计')),
        color: 'success',
        items: [
          {
            title: t('请求次数'),
            value: userState.user?.request_count,
            icon: <IconSend />,
            avatarColor: 'green',
            trendData: [],
            trendColor: '#34C759',
          },
          {
            title: t('统计次数'),
            value: times,
            icon: <IconPulse />,
            avatarColor: 'cyan',
            trendData: trendData.times,
            trendColor: '#5AC8FA',
          },
        ],
      },
      {
        title: createSectionTitle(Zap, t('资源消耗')),
        color: 'warning',
        items: [
          {
            title: t('统计额度'),
            value: renderQuota(consumeQuota),
            icon: <IconCoinMoneyStroked />,
            avatarColor: 'yellow',
            trendData: trendData.consumeQuota,
            trendColor: '#FF9500',
          },
          {
            title: t('统计Tokens'),
            value: isNaN(consumeTokens) ? 0 : consumeTokens.toLocaleString(),
            icon: <IconTextStroked />,
            avatarColor: 'pink',
            trendData: trendData.tokens,
            trendColor: '#FF2D55',
          },
        ],
      },
      {
        title: createSectionTitle(Gauge, t('性能指标')),
        color: 'info',
        items: [
          {
            title: t('平均RPM'),
            value: performanceMetrics.avgRPM,
            icon: <IconStopwatchStroked />,
            avatarColor: 'indigo',
            trendData: trendData.rpm,
            trendColor: '#5856D6',
          },
          {
            title: t('平均TPM'),
            value: performanceMetrics.avgTPM,
            icon: <IconTypograph />,
            avatarColor: 'orange',
            trendData: trendData.tpm,
            trendColor: '#FF9500',
          },
        ],
      },
    ],
    [
      userState?.user?.quota,
      userState?.user?.used_quota,
      userState?.user?.request_count,
      times,
      consumeQuota,
      consumeTokens,
      trendData,
      performanceMetrics,
      navigate,
      t,
    ],
  );

  return {
    groupedStatsData,
  };
};
