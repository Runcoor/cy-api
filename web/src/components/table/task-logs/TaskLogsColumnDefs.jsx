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
import { Progress, Tooltip, Typography, Avatar } from '@douyinfe/semi-ui';
import {
  Music,
  FileText,
  HelpCircle,
  CheckCircle,
  Pause,
  Clock,
  Play,
  XCircle,
  Loader,
  List,
  Hash,
  Video,
  Sparkles,
} from 'lucide-react';
import {
  TASK_ACTION_FIRST_TAIL_GENERATE,
  TASK_ACTION_GENERATE,
  TASK_ACTION_REFERENCE_GENERATE,
  TASK_ACTION_TEXT_GENERATE,
  TASK_ACTION_REMIX_GENERATE,
} from '../../../constants/common.constant';
import { CHANNEL_OPTIONS } from '../../../constants/channel.constants';
import { stringToColor } from '../../../helpers/render';

// iOS system color palette for channel badges
const channelColors = [
  { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)' },
  { color: 'var(--accent)', bg: 'var(--accent-light)' },
  { color: '#32ADE6', bg: 'rgba(50, 173, 230, 0.12)' },
  { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)' },
  { color: 'var(--text-muted)', bg: 'var(--surface-active)' },
  { color: '#5856D6', bg: 'rgba(88, 86, 214, 0.12)' },
  { color: '#007AFF', bg: 'var(--accent-light)' },
  { color: '#34C759', bg: 'rgba(52, 199, 89, 0.08)' },
  { color: '#FF9500', bg: 'rgba(255, 149, 0, 0.08)' },
  { color: '#FF2D55', bg: 'rgba(255, 45, 85, 0.12)' },
  { color: '#AF52DE', bg: 'rgba(175, 82, 222, 0.12)' },
  { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)' },
  { color: '#30B0C7', bg: 'rgba(48, 176, 199, 0.12)' },
  { color: '#5856D6', bg: 'rgba(88, 86, 214, 0.08)' },
  { color: '#FFCC00', bg: 'rgba(255, 204, 0, 0.15)' },
];

// iOS-style inline badge helper
export const InlineBadge = ({ color, bg, mono, children, style: extraStyle, ...rest }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '1px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '12px',
      fontWeight: 500,
      fontFamily: mono ? 'var(--font-mono)' : undefined,
      color: color || 'var(--text-secondary)',
      background: bg || 'var(--surface-active)',
      lineHeight: '20px',
      whiteSpace: 'nowrap',
      ...extraStyle,
    }}
    {...rest}
  >
    {children}
  </span>
);

// Render functions
export const renderTimestamp = (timestampInSeconds) => {
  const date = new Date(timestampInSeconds * 1000); // 从秒转换为毫秒

  const year = date.getFullYear(); // 获取年份
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // 获取月份，从0开始需要+1，并保证两位数
  const day = ('0' + date.getDate()).slice(-2); // 获取日期，并保证两位数
  const hours = ('0' + date.getHours()).slice(-2); // 获取小时，并保证两位数
  const minutes = ('0' + date.getMinutes()).slice(-2); // 获取分钟，并保证两位数
  const seconds = ('0' + date.getSeconds()).slice(-2); // 获取秒钟，并保证两位数

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // 格式化输出
};

export function renderDuration(submit_time, finishTime) {
  if (!submit_time || !finishTime) return 'N/A';
  const durationSec = finishTime - submit_time;
  const isLong = durationSec > 60;
  return (
    <InlineBadge
      mono
      color={isLong ? 'var(--error)' : 'var(--success)'}
      bg={isLong ? 'rgba(255, 59, 48, 0.12)' : 'rgba(52, 199, 89, 0.12)'}
    >
      {durationSec} s
    </InlineBadge>
  );
}

export const taskTypeStyleMap = {
  'MUSIC': { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: Music, label: '生成音乐' },
  'LYRICS': { color: '#FF2D55', bg: 'rgba(255, 45, 85, 0.12)', icon: FileText, label: '生成歌词' },
  [TASK_ACTION_GENERATE]: { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Sparkles, label: '图生视频' },
  [TASK_ACTION_TEXT_GENERATE]: { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Sparkles, label: '文生视频' },
  [TASK_ACTION_FIRST_TAIL_GENERATE]: { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Sparkles, label: '首尾生视频' },
  [TASK_ACTION_REFERENCE_GENERATE]: { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Sparkles, label: '参照生视频' },
  [TASK_ACTION_REMIX_GENERATE]: { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Sparkles, label: '视频Remix' },
};

export const renderType = (type, t) => {
  const cfg = taskTypeStyleMap[type] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: HelpCircle, label: '未知' };
  const Icon = cfg.icon;
  return (
    <InlineBadge color={cfg.color} bg={cfg.bg}>
      <Icon size={14} />
      {t(cfg.label)}
    </InlineBadge>
  );
};

export const renderPlatform = (platform, t) => {
  let option = CHANNEL_OPTIONS.find(
    (opt) => String(opt.value) === String(platform),
  );
  if (option) {
    return <InlineBadge>{option.label}</InlineBadge>;
  }
  if (platform === 'suno') {
    return <InlineBadge color='var(--success)' bg='rgba(52, 199, 89, 0.12)'>Suno</InlineBadge>;
  }
  return <InlineBadge>{t('未知')}</InlineBadge>;
};

export const taskStatusStyleMap = {
  'SUCCESS': { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)', icon: CheckCircle, label: '成功' },
  'NOT_START': { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: Pause, label: '未启动' },
  'SUBMITTED': { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', icon: Clock, label: '队列中' },
  'IN_PROGRESS': { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Play, label: '执行中' },
  'FAILURE': { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)', icon: XCircle, label: '失败' },
  'QUEUED': { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.08)', icon: List, label: '排队中' },
  'UNKNOWN': { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: HelpCircle, label: '未知' },
  '': { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: Loader, label: '正在提交' },
};

export const renderStatus = (type, t) => {
  const cfg = taskStatusStyleMap[type] || taskStatusStyleMap['UNKNOWN'];
  const Icon = cfg.icon;
  return (
    <InlineBadge color={cfg.color} bg={cfg.bg}>
      <Icon size={14} />
      {t(cfg.label)}
    </InlineBadge>
  );
};

export const getTaskLogsColumns = ({
  t,
  COLUMN_KEYS,
  copyText,
  openContentModal,
  isAdminUser,
  openVideoModal,
  openAudioModal,
}) => {
  return [
    {
      key: COLUMN_KEYS.SUBMIT_TIME,
      title: t('提交时间'),
      dataIndex: 'submit_time',
      render: (text, record, index) => {
        return <div>{text ? renderTimestamp(text) : '-'}</div>;
      },
    },
    {
      key: COLUMN_KEYS.FINISH_TIME,
      title: t('结束时间'),
      dataIndex: 'finish_time',
      render: (text, record, index) => {
        return <div>{text ? renderTimestamp(text) : '-'}</div>;
      },
    },
    {
      key: COLUMN_KEYS.DURATION,
      title: t('花费时间'),
      dataIndex: 'finish_time',
      render: (finish, record) => {
        return <>{finish ? renderDuration(record.submit_time, finish) : '-'}</>;
      },
    },
    {
      key: COLUMN_KEYS.CHANNEL,
      title: t('渠道'),
      dataIndex: 'channel_id',
      render: (text, record, index) => {
        return isAdminUser ? (
          <div>
            {(() => {
              const c = channelColors[parseInt(text) % channelColors.length];
              return (
                <InlineBadge
                  mono
                  color={c.color}
                  bg={c.bg}
                  style={{ cursor: 'pointer' }}
                  onClick={() => { copyText(text); }}
                >
                  {text}
                </InlineBadge>
              );
            })()}
          </div>
        ) : (
          <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.USERNAME,
      title: t('用户'),
      dataIndex: 'username',
      render: (userId, record, index) => {
        if (!isAdminUser) {
          return <></>;
        }
        const displayText = String(record.username || userId || '?');
        return (
          <div className='flex items-center gap-2'>
            <Avatar
              size='extra-small'
              color={stringToColor(displayText)}
            >
              {displayText.slice(0, 1)}
            </Avatar>
            <span style={{ color: 'var(--text-primary)' }}>
              {displayText}
            </span>
          </div>
        );
      },
    },
    {
      key: COLUMN_KEYS.PLATFORM,
      title: t('平台'),
      dataIndex: 'platform',
      render: (text, record, index) => {
        return <div>{renderPlatform(text, t)}</div>;
      },
    },
    {
      key: COLUMN_KEYS.TYPE,
      title: t('类型'),
      dataIndex: 'action',
      render: (text, record, index) => {
        return <div>{renderType(text, t)}</div>;
      },
    },
    {
      key: COLUMN_KEYS.TASK_ID,
      title: t('任务ID'),
      dataIndex: 'task_id',
      render: (text, record, index) => {
        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            onClick={() => {
              openContentModal(JSON.stringify(record, null, 2));
            }}
          >
            <div>{text}</div>
          </Typography.Text>
        );
      },
    },
    {
      key: COLUMN_KEYS.TASK_STATUS,
      title: t('任务状态'),
      dataIndex: 'status',
      render: (text, record, index) => {
        return <div>{renderStatus(text, t)}</div>;
      },
    },
    {
      key: COLUMN_KEYS.PROGRESS,
      title: t('进度'),
      dataIndex: 'progress',
      render: (text, record, index) => {
        return (
          <div>
            {isNaN(text?.replace('%', '')) ? (
              text || '-'
            ) : (
              <Progress
                stroke={
                  record.status === 'FAILURE'
                    ? 'var(--warning)'
                    : null
                }
                percent={text ? parseInt(text.replace('%', '')) : 0}
                showInfo={true}
                aria-label='task progress'
                style={{ minWidth: '160px' }}
              />
            )}
          </div>
        );
      },
    },
    {
      key: COLUMN_KEYS.FAIL_REASON,
      title: t('详情'),
      dataIndex: 'fail_reason',
      fixed: 'right',
      render: (text, record, index) => {
        // Suno audio preview
        const isSunoSuccess =
          record.platform === 'suno' &&
          record.status === 'SUCCESS' &&
          Array.isArray(record.data) &&
          record.data.some((c) => c.audio_url);
        if (isSunoSuccess) {
          return (
            <a
              href='#'
              onClick={(e) => {
                e.preventDefault();
                openAudioModal(record.data);
              }}
            >
              {t('点击预览音乐')}
            </a>
          );
        }

        // 视频预览：优先使用 result_url，兼容旧数据 fail_reason 中的 URL
        const isVideoTask =
          record.action === TASK_ACTION_GENERATE ||
          record.action === TASK_ACTION_TEXT_GENERATE ||
          record.action === TASK_ACTION_FIRST_TAIL_GENERATE ||
          record.action === TASK_ACTION_REFERENCE_GENERATE ||
          record.action === TASK_ACTION_REMIX_GENERATE;
        const isSuccess = record.status === 'SUCCESS';
        const resultUrl = record.result_url;
        const hasResultUrl = typeof resultUrl === 'string' && /^https?:\/\//.test(resultUrl);
        if (isSuccess && isVideoTask && hasResultUrl) {
          return (
            <a
              href='#'
              onClick={(e) => {
                e.preventDefault();
                openVideoModal(resultUrl);
              }}
            >
              {t('点击预览视频')}
            </a>
          );
        }
        if (!text) {
          return t('无');
        }
        return (
          <Typography.Text
            ellipsis={{ showTooltip: true }}
            style={{ width: 100 }}
            onClick={() => {
              openContentModal(text);
            }}
          >
            {text}
          </Typography.Text>
        );
      },
    },
  ];
};
