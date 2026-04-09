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
import { IconEyeOpened, IconImage } from '@douyinfe/semi-icons';
import { Image as ImageIcon } from 'lucide-react';
import CardList from '../../common/ui/CardList';
import CardRow from '../../common/ui/CardRow';
import {
  renderType,
  renderStatus,
  renderDuration,
  renderTimestamp,
  mjStatusStyleMap,
  InlineBadge,
} from './MjLogsColumnDefs';

const STATUS_META = {
  SUCCESS:     'success',
  NOT_START:   'muted',
  SUBMITTED:   'warning',
  IN_PROGRESS: 'accent',
  FAILURE:     'error',
  MODAL:       'warning',
};

const MjLogsTable = (mjLogsData) => {
  const {
    logs,
    loading,
    openContentModal,
    openImageModal,
    isAdminUser,
    t,
  } = mjLogsData;

  const renderCard = (record) => {
    const statusColor = STATUS_META[record.status] || 'muted';

    const fields = [];

    // SUBMIT TIME
    fields.push({
      label: t('提交时间'),
      value: (
        <span style={{ whiteSpace: 'nowrap' }}>
          {renderTimestamp(record.submit_time / 1000)}
        </span>
      ),
    });

    // TYPE
    fields.push({
      label: t('类型'),
      value: renderType(record.action, t),
    });

    // TASK ID (with copy on click)
    fields.push({
      label: t('任务 ID'),
      value: (
        <Tooltip content={record.mj_id} position='top'>
          <InlineBadge
            mono
            style={{ cursor: 'pointer', fontSize: 11, padding: '0 6px' }}
          >
            {record.mj_id
              ? record.mj_id.length > 18
                ? record.mj_id.slice(0, 8) + '…' + record.mj_id.slice(-6)
                : record.mj_id
              : '—'}
          </InlineBadge>
        </Tooltip>
      ),
      mono: true,
    });

    // STATUS
    fields.push({
      label: t('状态'),
      value: renderStatus(record.status, t),
    });

    // PROGRESS + DURATION
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
            width: '100%',
            minWidth: 0,
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
            {record.finish_time && record.submit_time ? (
              <>
                {' · '}
                {((record.finish_time - record.submit_time) / 1000).toFixed(1)}
                {t('秒')}
              </>
            ) : null}
          </span>
        </div>
      ),
    });

    // CHANNEL (admin only) or PROMPT summary
    if (isAdminUser) {
      fields.push({
        label: t('渠道'),
        value: (
          <InlineBadge mono style={{ fontSize: 11, padding: '0 6px' }}>
            {record.channel_id || '—'}
          </InlineBadge>
        ),
        align: 'end',
      });
    } else if (record.prompt) {
      fields.push({
        label: 'Prompt',
        value: (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
            title={record.prompt}
            onClick={(e) => {
              e.stopPropagation();
              openContentModal(record.prompt);
            }}
          >
            {record.prompt}
          </span>
        ),
        align: 'end',
      });
    }

    const actions = (
      <>
        {record.image_url && (
          <Tooltip content={t('查看图片')} position='top'>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                openImageModal(record.image_url);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'transparent',
                color: 'var(--accent)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color var(--ease-micro)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ImageIcon size={16} />
            </button>
          </Tooltip>
        )}
        <Tooltip content={t('查看详情')} position='top'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              const detail = [
                `${t('任务 ID')}: ${record.mj_id || '—'}`,
                record.prompt ? `\nPrompt: ${record.prompt}` : '',
                record.prompt_en ? `\nPrompt (EN): ${record.prompt_en}` : '',
                record.fail_reason
                  ? `\n${t('失败原因')}: ${record.fail_reason}`
                  : '',
              ]
                .filter(Boolean)
                .join('');
              openContentModal(detail);
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
            <IconEyeOpened size='default' />
          </button>
        </Tooltip>
      </>
    );

    return (
      <CardRow
        key={record.key || record.id}
        statusIcon={<IconImage />}
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

export default MjLogsTable;
