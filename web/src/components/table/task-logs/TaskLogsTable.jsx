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
import { Progress, Tooltip } from '@douyinfe/semi-ui';
import { IconEyeOpened, IconFile } from '@douyinfe/semi-icons';
import { Film, Music, Volume2 } from 'lucide-react';
import CardList from '../../common/ui/CardList';
import CardRow from '../../common/ui/CardRow';
import {
  InlineBadge,
  renderTimestamp,
  renderType,
  renderPlatform,
  renderStatus,
} from './TaskLogsColumnDefs';

const STATUS_META = {
  SUCCESS:     'success',
  NOT_START:   'muted',
  SUBMITTED:   'warning',
  QUEUED:      'warning',
  IN_PROGRESS: 'accent',
  FAILURE:     'error',
  UNKNOWN:     'muted',
};

const TaskLogsTable = (taskLogsData) => {
  const {
    logs,
    loading,
    openContentModal,
    openVideoModal,
    openAudioModal,
    isAdminUser,
    t,
  } = taskLogsData;

  const renderCard = (record) => {
    const statusColor = STATUS_META[record.status] || 'muted';

    // Decide leading icon by action/platform
    let LeadingIcon = IconFile;
    if (record.action === 'MUSIC' || record.platform === 'suno')
      LeadingIcon = () => <Music size={20} />;
    else if (record.action && record.action.includes('VIDEO'))
      LeadingIcon = () => <Film size={20} />;

    const fields = [];

    // SUBMIT TIME
    fields.push({
      label: t('提交时间'),
      value: (
        <span style={{ whiteSpace: 'nowrap' }}>
          {renderTimestamp(record.submit_time)}
        </span>
      ),
    });

    // PLATFORM
    fields.push({
      label: t('平台'),
      value: renderPlatform(record.platform, t),
    });

    // TYPE
    fields.push({
      label: t('类型'),
      value: renderType(record.action, t),
    });

    // TASK ID
    fields.push({
      label: t('任务 ID'),
      value: (
        <Tooltip content={record.task_id} position='top'>
          <InlineBadge
            mono
            style={{ cursor: 'pointer', fontSize: 11, padding: '0 6px' }}
          >
            {record.task_id
              ? record.task_id.length > 20
                ? record.task_id.slice(0, 8) + '…' + record.task_id.slice(-8)
                : record.task_id
              : '—'}
          </InlineBadge>
        </Tooltip>
      ),
    });

    // STATUS
    fields.push({
      label: t('状态'),
      value: renderStatus(record.status, t),
    });

    // PROGRESS
    const percent = record.progress
      ? parseInt(record.progress.replace('%', ''))
      : 0;
    fields.push({
      label: t('进度'),
      value: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 0,
            width: '100%',
          }}
        >
          <Progress
            percent={percent}
            stroke={
              record.status === 'FAILURE'
                ? 'var(--warning)'
                : record.status === 'SUCCESS'
                  ? 'var(--success)'
                  : undefined
            }
            showInfo={false}
            size='small'
            aria-label='task progress'
          />
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {percent}%
            {record.finish_time && record.submit_time
              ? ` · ${((record.finish_time - record.submit_time)).toFixed(0)}s`
              : ''}
          </span>
        </div>
      ),
      align: 'end',
    });

    // Build actions — preview links for video / audio, plus detail popover
    const resultUrl = record.data?.result_url || record.result_url || '';
    const audioClips = record.data?.clips || [];
    const hasVideo =
      record.data?.video_url ||
      (resultUrl && /\.(mp4|webm|mov)/i.test(resultUrl));
    const hasAudio =
      audioClips.length > 0 ||
      (resultUrl && /\.(mp3|wav|ogg|m4a)/i.test(resultUrl));

    const makeIconBtn = (icon, label, onClick) => (
      <Tooltip content={label} position='top'>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition:
              'background-color var(--ease-micro), color var(--ease-micro)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {icon}
        </button>
      </Tooltip>
    );

    const actions = (
      <>
        {hasVideo &&
          makeIconBtn(<Film size={16} />, t('预览视频'), () =>
            openVideoModal &&
            openVideoModal(record.data?.video_url || resultUrl),
          )}
        {hasAudio &&
          makeIconBtn(<Volume2 size={16} />, t('预览音频'), () =>
            openAudioModal &&
            openAudioModal(
              audioClips.length > 0 ? audioClips : [{ url: resultUrl }],
            ),
          )}
        {makeIconBtn(<IconEyeOpened size='default' />, t('查看详情'), () => {
          const detail = [
            `${t('任务 ID')}: ${record.task_id || '—'}`,
            record.platform ? `\n${t('平台')}: ${record.platform}` : '',
            record.action ? `\n${t('动作')}: ${record.action}` : '',
            record.fail_reason
              ? `\n${t('失败原因')}: ${record.fail_reason}`
              : '',
          ]
            .filter(Boolean)
            .join('');
          openContentModal && openContentModal(detail);
        })}
      </>
    );

    return (
      <CardRow
        key={record.key || record.id}
        statusIcon={<LeadingIcon />}
        statusColor={statusColor}
        fields={fields}
        actions={actions}
      />
    );
  };

  return (
    <CardList
      dataSource={logs}
      renderCard={renderCard}
      loading={loading}
      t={t}
    />
  );
};

export default TaskLogsTable;
