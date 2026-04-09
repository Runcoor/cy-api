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
import { Popover, Descriptions, Avatar, Tooltip } from '@douyinfe/semi-ui';
import {
  IconEyeOpened,
  IconActivity,
  IconPlus,
  IconAlertTriangle,
  IconRefresh,
  IconServer,
} from '@douyinfe/semi-icons';
import CardList from '../../common/ui/CardList';
import CardRow from '../../common/ui/CardRow';
import {
  renderQuota,
  stringToColor,
  getLogOther,
  renderModelTag,
} from '../../../helpers';
import {
  logTypeStyleMap,
  renderType,
  renderUseTime,
  renderFirstUseTime,
  renderIsStream,
  renderModelName,
  getUsageLogDetailSummary,
  renderCompactDetailSummary,
  InlineBadge,
} from './UsageLogsColumnDefs';

/* Map log.type → card status color + leading icon */
const TYPE_META = {
  1: { color: 'accent',  Icon: IconPlus },        // 充值
  2: { color: 'success', Icon: IconActivity },    // 消费
  3: { color: 'warning', Icon: IconServer },      // 管理
  4: { color: 'muted',   Icon: IconServer },      // 系统
  5: { color: 'error',   Icon: IconAlertTriangle },// 错误
  6: { color: 'warning', Icon: IconRefresh },     // 退款
};

const getTypeMeta = (record) =>
  TYPE_META[record.type] || { color: 'muted', Icon: IconActivity };

/* Is this record a chat/request-style log (has model/token/latency fields)? */
const isRequestLog = (record) =>
  record.type === 0 ||
  record.type === 2 ||
  record.type === 5 ||
  record.type === 6;

const LogsTable = (logsData) => {
  const {
    logs,
    expandData,
    loading,
    copyText,
    showUserInfoFunc,
    isAdminUser,
    billingDisplayMode,
    t,
  } = logsData;

  const renderCard = (record) => {
    const meta = getTypeMeta(record);
    const requestLike = isRequestLog(record);
    const other = getLogOther(record.other);
    const typeCfg = logTypeStyleMap[record.type];

    // ───── Build fields based on record type ─────
    const fields = [];

    // 1. TIME — always
    fields.push({
      label: t('时间'),
      value: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 3,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            {record.timestamp2string}
          </span>
          {typeCfg && (
            <InlineBadge
              color={typeCfg.color}
              bg={typeCfg.bg}
              style={{ fontSize: 10, padding: '0 6px', lineHeight: '16px' }}
            >
              {t(typeCfg.label)}
            </InlineBadge>
          )}
        </div>
      ),
    });

    if (requestLike) {
      // 2. MODEL
      fields.push({
        label: t('模型'),
        value: renderModelName(record, copyText, t),
      });

      // 3. USER (admin only) — for non-admin show TOKEN here instead
      if (isAdminUser) {
        fields.push({
          label: t('用户'),
          value: (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 0,
              }}
            >
              <Avatar
                size='extra-small'
                color={stringToColor(record.username)}
                onClick={(e) => {
                  e.stopPropagation();
                  showUserInfoFunc && showUserInfoFunc(record.user_id);
                }}
                style={{ cursor: 'pointer' }}
              >
                {typeof record.username === 'string' &&
                  record.username.slice(0, 1)}
              </Avatar>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {record.username || '—'}
              </span>
            </span>
          ),
        });
      }

      // 4. TOKEN
      fields.push({
        label: t('令牌'),
        value: (
          <InlineBadge
            style={{ cursor: 'pointer', fontSize: 11, padding: '0 6px' }}
            onClick={(e) => copyText(e, record.token_name)}
          >
            {record.token_name || '—'}
          </InlineBadge>
        ),
      });

      // 5. USE_TIME
      fields.push({
        label: t('用时'),
        value: record.use_time ? (
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            {renderUseTime(record.use_time, t)}
            {record.is_stream && other?.frt
              ? renderFirstUseTime(other.frt, t)
              : null}
            {renderIsStream(record.is_stream, t, other?.stream_status)}
          </span>
        ) : (
          '—'
        ),
      });

      // 6. COST
      fields.push({
        label: t('花费'),
        value: (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent)',
            }}
          >
            {renderQuota(record.quota, 6)}
          </span>
        ),
        align: 'end',
      });
    } else {
      // Non-request logs (recharge/system/manage) — show fewer richer fields
      if (isAdminUser && record.username) {
        fields.push({
          label: t('用户'),
          value: (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Avatar
                size='extra-small'
                color={stringToColor(record.username)}
                onClick={(e) => {
                  e.stopPropagation();
                  showUserInfoFunc && showUserInfoFunc(record.user_id);
                }}
                style={{ cursor: 'pointer' }}
              >
                {record.username.slice(0, 1)}
              </Avatar>
              <span>{record.username}</span>
            </span>
          ),
        });
      }
      if (record.quota) {
        fields.push({
          label: record.type === 1 ? t('充值额度') : t('额度'),
          value: (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--accent)',
              }}
            >
              {renderQuota(record.quota, 6)}
            </span>
          ),
        });
      }
      if (record.content) {
        fields.push({
          label: t('详情'),
          value: (
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--text-secondary)',
              }}
              title={record.content}
            >
              {record.content}
            </span>
          ),
          span: 2,
        });
      }
    }

    // Detail popover on hover for request logs
    const detailSummary = requestLike
      ? getUsageLogDetailSummary(record, record.content, billingDisplayMode, t)
      : null;

    const actions = (
      <Popover
        position='left'
        trigger='click'
        content={
          <div style={{ padding: 12, maxWidth: 420 }}>
            {detailSummary
              ? renderCompactDetailSummary(detailSummary.segments)
              : record.content || t('无详情')}
            {expandData[record.key] && expandData[record.key].length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Descriptions data={expandData[record.key]} size='small' />
              </div>
            )}
          </div>
        }
      >
        <Tooltip content={t('查看详情')} position='top'>
          <button
            type='button'
            onClick={(e) => e.stopPropagation()}
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
              transition: 'background-color var(--ease-micro), color var(--ease-micro)',
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
      </Popover>
    );

    return (
      <CardRow
        key={record.key || record.id}
        statusIcon={<meta.Icon />}
        statusColor={meta.color}
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

export default LogsTable;
