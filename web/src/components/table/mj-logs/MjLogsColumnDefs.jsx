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
import { Button, Progress, Typography } from '@douyinfe/semi-ui';
import {
  Palette,
  ZoomIn,
  Shuffle,
  Move,
  FileText,
  Blend,
  Upload,
  Minimize2,
  RotateCcw,
  PaintBucket,
  Focus,
  Move3D,
  Monitor,
  UserCheck,
  HelpCircle,
  CheckCircle,
  Clock,
  Copy,
  FileX,
  Pause,
  XCircle,
  Loader,
  AlertCircle,
  Hash,
  Video,
} from 'lucide-react';

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

// MJ action type style map
export const mjTypeStyleMap = {
  'IMAGINE': { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Palette, label: '绘图' },
  'UPSCALE': { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', icon: ZoomIn, label: '放大' },
  'VIDEO': { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', icon: Video, label: '视频' },
  'EDITS': { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', icon: Video, label: '编辑' },
  'VARIATION': { color: '#AF52DE', bg: 'rgba(175, 82, 222, 0.12)', icon: Shuffle, label: '变换' },
  'HIGH_VARIATION': { color: '#AF52DE', bg: 'rgba(175, 82, 222, 0.12)', icon: Shuffle, label: '强变换' },
  'LOW_VARIATION': { color: '#AF52DE', bg: 'rgba(175, 82, 222, 0.12)', icon: Shuffle, label: '弱变换' },
  'PAN': { color: '#32ADE6', bg: 'rgba(50, 173, 230, 0.12)', icon: Move, label: '平移' },
  'DESCRIBE': { color: '#FFCC00', bg: 'rgba(255, 204, 0, 0.15)', icon: FileText, label: '图生文' },
  'BLEND': { color: '#34C759', bg: 'rgba(52, 199, 89, 0.08)', icon: Blend, label: '图混合' },
  'UPLOAD': { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Upload, label: '上传文件' },
  'SHORTEN': { color: '#FF2D55', bg: 'rgba(255, 45, 85, 0.12)', icon: Minimize2, label: '缩词' },
  'REROLL': { color: '#5856D6', bg: 'rgba(88, 86, 214, 0.12)', icon: RotateCcw, label: '重绘' },
  'INPAINT': { color: '#5856D6', bg: 'rgba(88, 86, 214, 0.08)', icon: PaintBucket, label: '局部重绘-提交' },
  'ZOOM': { color: '#30B0C7', bg: 'rgba(48, 176, 199, 0.12)', icon: Focus, label: '变焦' },
  'CUSTOM_ZOOM': { color: '#30B0C7', bg: 'rgba(48, 176, 199, 0.12)', icon: Move3D, label: '自定义变焦-提交' },
  'MODAL': { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)', icon: Monitor, label: '窗口处理' },
  'SWAP_FACE': { color: '#34C759', bg: 'rgba(52, 199, 89, 0.08)', icon: UserCheck, label: '换脸' },
};

// MJ submission code style map
const mjCodeStyleMap = {
  1: { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)', icon: CheckCircle, label: '已提交' },
  21: { color: '#34C759', bg: 'rgba(52, 199, 89, 0.08)', icon: Clock, label: '等待中' },
  22: { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', icon: Copy, label: '重复提交' },
  0: { color: '#FFCC00', bg: 'rgba(255, 204, 0, 0.15)', icon: FileX, label: '未提交' },
};

// MJ task status style map
export const mjStatusStyleMap = {
  'SUCCESS': { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)', icon: CheckCircle, label: '成功' },
  'NOT_START': { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: Pause, label: '未启动' },
  'SUBMITTED': { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', icon: Clock, label: '队列中' },
  'IN_PROGRESS': { color: 'var(--accent)', bg: 'var(--accent-light)', icon: Loader, label: '执行中' },
  'FAILURE': { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)', icon: XCircle, label: '失败' },
  'MODAL': { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', icon: AlertCircle, label: '窗口等待' },
};

// Render functions
export function renderType(type, t) {
  const cfg = mjTypeStyleMap[type] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: HelpCircle, label: '未知' };
  const Icon = cfg.icon;
  return (
    <InlineBadge color={cfg.color} bg={cfg.bg}>
      <Icon size={14} />
      {t(cfg.label)}
    </InlineBadge>
  );
}

export function renderCode(code, t) {
  const cfg = mjCodeStyleMap[code] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: HelpCircle, label: '未知' };
  const Icon = cfg.icon;
  return (
    <InlineBadge color={cfg.color} bg={cfg.bg}>
      <Icon size={14} />
      {t(cfg.label)}
    </InlineBadge>
  );
}

export function renderStatus(type, t) {
  const cfg = mjStatusStyleMap[type] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', icon: HelpCircle, label: '未知' };
  const Icon = cfg.icon;
  return (
    <InlineBadge color={cfg.color} bg={cfg.bg}>
      <Icon size={14} />
      {t(cfg.label)}
    </InlineBadge>
  );
}

export const renderTimestamp = (timestampInSeconds) => {
  const date = new Date(timestampInSeconds * 1000);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export function renderDuration(submit_time, finishTime, t) {
  if (!submit_time || !finishTime) return 'N/A';

  const start = new Date(submit_time);
  const finish = new Date(finishTime);
  const durationMs = finish - start;
  const durationSec = (durationMs / 1000).toFixed(1);
  const isLong = durationSec > 60;

  return (
    <InlineBadge
      mono
      color={isLong ? 'var(--error)' : 'var(--success)'}
      bg={isLong ? 'rgba(255, 59, 48, 0.12)' : 'rgba(52, 199, 89, 0.12)'}
    >
      <Clock size={14} />
      {durationSec} {t('秒')}
    </InlineBadge>
  );
}

export const getMjLogsColumns = ({
  t,
  COLUMN_KEYS,
  copyText,
  openContentModal,
  openImageModal,
  isAdminUser,
}) => {
  return [
    {
      key: COLUMN_KEYS.SUBMIT_TIME,
      title: t('提交时间'),
      dataIndex: 'submit_time',
      render: (text, record, index) => {
        return <div>{renderTimestamp(text / 1000)}</div>;
      },
    },
    {
      key: COLUMN_KEYS.DURATION,
      title: t('花费时间'),
      dataIndex: 'finish_time',
      render: (finish, record) => {
        return renderDuration(record.submit_time, finish, t);
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
      dataIndex: 'mj_id',
      render: (text, record, index) => {
        return <div>{text}</div>;
      },
    },
    {
      key: COLUMN_KEYS.SUBMIT_RESULT,
      title: t('提交结果'),
      dataIndex: 'code',
      render: (text, record, index) => {
        return isAdminUser ? <div>{renderCode(text, t)}</div> : <></>;
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
            {
              <Progress
                stroke={
                  record.status === 'FAILURE'
                    ? 'var(--warning)'
                    : null
                }
                percent={text ? parseInt(text.replace('%', '')) : 0}
                showInfo={true}
                aria-label='drawing progress'
                style={{ minWidth: '160px' }}
              />
            }
          </div>
        );
      },
    },
    {
      key: COLUMN_KEYS.IMAGE,
      title: t('结果图片'),
      dataIndex: 'image_url',
      render: (text, record, index) => {
        if (!text) {
          return t('无');
        }
        return (
          <Button
            size='small'
            onClick={() => {
              openImageModal(text);
            }}
          >
            {t('查看图片')}
          </Button>
        );
      },
    },
    {
      key: COLUMN_KEYS.PROMPT,
      title: 'Prompt',
      dataIndex: 'prompt',
      render: (text, record, index) => {
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
    {
      key: COLUMN_KEYS.PROMPT_EN,
      title: 'PromptEn',
      dataIndex: 'prompt_en',
      render: (text, record, index) => {
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
    {
      key: COLUMN_KEYS.FAIL_REASON,
      title: t('失败原因'),
      dataIndex: 'fail_reason',
      fixed: 'right',
      render: (text, record, index) => {
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
