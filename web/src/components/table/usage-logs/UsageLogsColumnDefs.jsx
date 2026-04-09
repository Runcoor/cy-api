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
import {
  Avatar,
  Space,
  Tooltip,
  Popover,
  Typography,
} from '@douyinfe/semi-ui';
import {
  renderGroup,
  renderQuota,
  stringToColor,
  getLogOther,
  renderModelTag,
  renderModelPriceSimple,
} from '../../../helpers';
import { IconHelpCircle } from '@douyinfe/semi-icons';
import { CircleAlert, Route, Sparkles } from 'lucide-react';

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

function formatRatio(ratio) {
  if (ratio === undefined || ratio === null) {
    return '-';
  }
  if (typeof ratio === 'number') {
    return ratio.toFixed(4);
  }
  return String(ratio);
}

function buildChannelAffinityTooltip(affinity, t) {
  if (!affinity) {
    return null;
  }

  const keySource = affinity.key_source || '-';
  const keyPath = affinity.key_path || affinity.key_key || '-';
  const keyHint = affinity.key_hint || '';
  const keyFp = affinity.key_fp ? `#${affinity.key_fp}` : '';
  const keyText = `${keySource}:${keyPath}${keyFp}`;

  const lines = [
    t('渠道亲和性'),
    `${t('规则')}：${affinity.rule_name || '-'}`,
    `${t('分组')}：${affinity.selected_group || '-'}`,
    `${t('Key')}：${keyText}`,
    ...(keyHint ? [`${t('Key 摘要')}：${keyHint}`] : []),
  ];

  return (
    <div style={{ lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

// Render functions — iOS system colors
export const logTypeStyleMap = {
  1: { color: '#32ADE6', bg: 'rgba(50, 173, 230, 0.12)', label: '充值' },
  2: { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)', label: '消费' },
  3: { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)', label: '管理' },
  4: { color: '#AF52DE', bg: 'rgba(175, 82, 222, 0.12)', label: '系统' },
  5: { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)', label: '错误' },
  6: { color: '#30B0C7', bg: 'rgba(48, 176, 199, 0.12)', label: '退款' },
};

export function renderType(type, t) {
  const cfg = logTypeStyleMap[type] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', label: '未知' };
  return (
    <InlineBadge color={cfg.color} bg={cfg.bg}>
      {t(cfg.label)}
    </InlineBadge>
  );
}

function buildStreamStatusTooltip(ss, t) {
  if (!ss) return null;
  const lines = [
    t('流状态') + '：' + t('异常'),
    (ss.end_reason || 'unknown'),
  ];
  if (ss.error_count > 0) {
    lines.push(`${t('软错误')}: ${ss.error_count}`);
  }
  if (ss.end_error) {
    lines.push(ss.end_error);
  }
  return (
    <div style={{ lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

export function renderIsStream(bool, t, streamStatus) {
  const isError = streamStatus && streamStatus.status !== 'ok';

  if (bool) {
    return (
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <InlineBadge color='var(--accent)' bg='var(--accent-light)'>
          {t('流')}
        </InlineBadge>
        {isError && (
          <Tooltip content={buildStreamStatusTooltip(streamStatus, t)}>
            <span
              style={{
                position: 'absolute',
                right: -4,
                top: -4,
                lineHeight: 1,
                color: 'var(--error)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <CircleAlert
                size={14}
                strokeWidth={2.5}
                color='currentColor'
              />
            </span>
          </Tooltip>
        )}
      </span>
    );
  } else {
    return (
      <InlineBadge color='#AF52DE' bg='rgba(175, 82, 222, 0.12)'>
        {t('非流')}
      </InlineBadge>
    );
  }
}

function getTimeColor(time, thresholds) {
  if (time < thresholds[0]) return { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.12)' };
  if (time < thresholds[1]) return { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.12)' };
  return { color: 'var(--error)', bg: 'rgba(255, 59, 48, 0.12)' };
}

export function renderUseTime(type, t) {
  const time = parseInt(type);
  const style = getTimeColor(time, [101, 300]);
  return (
    <InlineBadge mono color={style.color} bg={style.bg} style={{ fontSize: '11px', padding: '0px 6px' }}>
      {time} s
    </InlineBadge>
  );
}

export function renderFirstUseTime(type, t) {
  let time = parseFloat(type) / 1000.0;
  time = time.toFixed(1);
  const style = getTimeColor(parseFloat(time), [3, 10]);
  return (
    <InlineBadge mono color={style.color} bg={style.bg} style={{ fontSize: '11px', padding: '0px 6px' }}>
      {time} s
    </InlineBadge>
  );
}

export function renderBillingTag(record, t) {
  const other = getLogOther(record.other);
  if (other?.billing_source === 'subscription') {
    return (
      <InlineBadge color='var(--success)' bg='rgba(52, 199, 89, 0.12)'>
        {t('订阅抵扣')}
      </InlineBadge>
    );
  }
  return null;
}

export function renderModelName(record, copyText, t) {
  let other = getLogOther(record.other);
  let modelMapped =
    other?.is_model_mapped &&
    other?.upstream_model_name &&
    other?.upstream_model_name !== '';
  if (!modelMapped) {
    return renderModelTag(record.model_name, {
      onClick: (event) => {
        copyText(event, record.model_name).then((r) => {});
      },
    });
  } else {
    return (
      <>
        <Space vertical align={'start'}>
          <Popover
            content={
              <div style={{ padding: 10 }}>
                <Space vertical align={'start'}>
                  <div className='flex items-center'>
                    <span style={{ fontWeight: 600, marginRight: 8, color: 'var(--text-primary)' }}>
                      {t('请求并计费模型')}:
                    </span>
                    {renderModelTag(record.model_name, {
                      onClick: (event) => {
                        copyText(event, record.model_name).then((r) => {});
                      },
                    })}
                  </div>
                  <div className='flex items-center'>
                    <span style={{ fontWeight: 600, marginRight: 8, color: 'var(--text-primary)' }}>
                      {t('实际模型')}:
                    </span>
                    {renderModelTag(other.upstream_model_name, {
                      onClick: (event) => {
                        copyText(event, other.upstream_model_name).then(
                          (r) => {},
                        );
                      },
                    })}
                  </div>
                </Space>
              </div>
            }
          >
            {renderModelTag(record.model_name, {
              onClick: (event) => {
                copyText(event, record.model_name).then((r) => {});
              },
              suffixIcon: (
                <Route
                  style={{ width: '0.9em', height: '0.9em', opacity: 0.75 }}
                />
              ),
            })}
          </Popover>
        </Space>
      </>
    );
  }
}

function toTokenNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return parsed;
}

function formatTokenCount(value) {
  return toTokenNumber(value).toLocaleString();
}

function getPromptCacheSummary(other) {
  if (!other || typeof other !== 'object') {
    return null;
  }

  const cacheReadTokens = toTokenNumber(other.cache_tokens);
  const cacheCreationTokens = toTokenNumber(other.cache_creation_tokens);
  const cacheCreationTokens5m = toTokenNumber(other.cache_creation_tokens_5m);
  const cacheCreationTokens1h = toTokenNumber(other.cache_creation_tokens_1h);

  const hasSplitCacheCreation =
    cacheCreationTokens5m > 0 || cacheCreationTokens1h > 0;
  const cacheWriteTokens = hasSplitCacheCreation
    ? cacheCreationTokens5m + cacheCreationTokens1h
    : cacheCreationTokens;

  if (cacheReadTokens <= 0 && cacheWriteTokens <= 0) {
    return null;
  }

  return {
    cacheReadTokens,
    cacheWriteTokens,
  };
}

function normalizeDetailText(detail) {
  return String(detail || '')
    .replace(/\n\r/g, '\n')
    .replace(/\r\n/g, '\n');
}

function getUsageLogGroupSummary(groupRatio, userGroupRatio, t) {
  const parsedUserGroupRatio = Number(userGroupRatio);
  const useUserGroupRatio =
    Number.isFinite(parsedUserGroupRatio) && parsedUserGroupRatio !== -1;
  const ratio = useUserGroupRatio ? userGroupRatio : groupRatio;
  if (ratio === undefined || ratio === null || ratio === '') {
    return '';
  }
  return `${useUserGroupRatio ? t('专属倍率') : t('分组')} ${formatRatio(ratio)}x`;
}

export function renderCompactDetailSummary(summarySegments) {
  const segments = Array.isArray(summarySegments)
    ? summarySegments.filter((segment) => segment?.text)
    : [];
  if (!segments.length) {
    return null;
  }

  return (
    <div
      style={{
        maxWidth: 180,
        lineHeight: 1.35,
      }}
    >
      {segments.map((segment, index) => (
        <span
          key={`${segment.text}-${index}`}
          style={{
            display: 'block',
            maxWidth: '100%',
            fontSize: 12,
            marginTop: index === 0 ? 0 : 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: segment.tone === 'secondary' ? 'var(--text-muted)' : 'var(--text-primary)',
          }}
        >
          {segment.text}
        </span>
      ))}
    </div>
  );
}

export function getUsageLogDetailSummary(record, text, billingDisplayMode, t) {
  const other = getLogOther(record.other);

  if (record.type === 6) {
    return {
      segments: [{ text: t('异步任务退款'), tone: 'primary' }],
    };
  }

  if (other == null || record.type !== 2) {
    return null;
  }

  if (
    other?.violation_fee === true ||
    Boolean(other?.violation_fee_code) ||
    Boolean(other?.violation_fee_marker)
  ) {
    const feeQuota = other?.fee_quota ?? record?.quota;
    const groupText = getUsageLogGroupSummary(
      other?.group_ratio,
      other?.user_group_ratio,
      t,
    );
    return {
      segments: [
        groupText ? { text: groupText, tone: 'primary' } : null,
        { text: t('违规扣费'), tone: 'primary' },
        {
          text: `${t('扣费')}：${renderQuota(feeQuota, 6)}`,
          tone: 'secondary',
        },
        text ? { text: `${t('详情')}：${text}`, tone: 'secondary' } : null,
      ].filter(Boolean),
    };
  }

  return {
    segments: other?.claude
      ? renderModelPriceSimple(
          other.model_ratio,
          other.model_price,
          other.group_ratio,
          other?.user_group_ratio,
          other.cache_tokens || 0,
          other.cache_ratio || 1.0,
          other.cache_creation_tokens || 0,
          other.cache_creation_ratio || 1.0,
          other.cache_creation_tokens_5m || 0,
          other.cache_creation_ratio_5m || other.cache_creation_ratio || 1.0,
          other.cache_creation_tokens_1h || 0,
          other.cache_creation_ratio_1h || other.cache_creation_ratio || 1.0,
          false,
          1.0,
          other?.is_system_prompt_overwritten,
          'claude',
          billingDisplayMode,
          'segments',
        )
      : renderModelPriceSimple(
          other.model_ratio,
          other.model_price,
          other.group_ratio,
          other?.user_group_ratio,
          other.cache_tokens || 0,
          other.cache_ratio || 1.0,
          0,
          1.0,
          0,
          1.0,
          0,
          1.0,
          false,
          1.0,
          other?.is_system_prompt_overwritten,
          'openai',
          billingDisplayMode,
          'segments',
        ),
  };
}

export const getLogsColumns = ({
  t,
  COLUMN_KEYS,
  copyText,
  showUserInfoFunc,
  openChannelAffinityUsageCacheModal,
  isAdminUser,
  billingDisplayMode = 'price',
}) => {
  return [
    {
      key: COLUMN_KEYS.TIME,
      title: t('时间'),
      dataIndex: 'timestamp2string',
    },
    {
      key: COLUMN_KEYS.CHANNEL,
      title: t('渠道'),
      dataIndex: 'channel',
      render: (text, record, index) => {
        let isMultiKey = false;
        let multiKeyIndex = -1;
        let content = t('渠道') + `：${record.channel}`;
        let affinity = null;
        let showMarker = false;
        let other = getLogOther(record.other);
        if (other?.admin_info) {
          let adminInfo = other.admin_info;
          if (adminInfo?.is_multi_key) {
            isMultiKey = true;
            multiKeyIndex = adminInfo.multi_key_index;
          }
          if (
            Array.isArray(adminInfo.use_channel) &&
            adminInfo.use_channel.length > 0
          ) {
            content = t('渠道') + `：${adminInfo.use_channel.join('->')}`;
          }
          if (adminInfo.channel_affinity) {
            affinity = adminInfo.channel_affinity;
            showMarker = true;
          }
        }

        return isAdminUser &&
          (record.type === 0 ||
            record.type === 2 ||
            record.type === 5 ||
            record.type === 6) ? (
          <Space>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <Tooltip content={record.channel_name || t('未知渠道')}>
                <span>
                  {(() => {
                    const c = channelColors[parseInt(text) % channelColors.length];
                    return <InlineBadge mono color={c.color} bg={c.bg}>{text}</InlineBadge>;
                  })()}
                </span>
              </Tooltip>
              {showMarker && (
                <Tooltip
                  content={
                    <div style={{ lineHeight: 1.6 }}>
                      <div>{content}</div>
                      {affinity ? (
                        <div style={{ marginTop: 6 }}>
                          {buildChannelAffinityTooltip(affinity, t)}
                        </div>
                      ) : null}
                    </div>
                  }
                >
                  <span
                    style={{
                      position: 'absolute',
                      right: -4,
                      top: -4,
                      lineHeight: 1,
                      fontWeight: 600,
                      color: 'var(--warning)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openChannelAffinityUsageCacheModal?.(affinity);
                    }}
                  >
                    <Sparkles
                      size={14}
                      strokeWidth={2}
                      color='currentColor'
                      fill='currentColor'
                    />
                  </span>
                </Tooltip>
              )}
            </span>
            {isMultiKey && (
              <InlineBadge mono style={{ fontSize: '11px', padding: '0px 6px' }}>
                {multiKeyIndex}
              </InlineBadge>
            )}
          </Space>
        ) : null;
      },
    },
    {
      key: COLUMN_KEYS.USERNAME,
      title: t('用户'),
      dataIndex: 'username',
      render: (text, record, index) => {
        return isAdminUser ? (
          <div>
            <Avatar
              size='extra-small'
              color={stringToColor(text)}
              style={{ marginRight: 4 }}
              onClick={(event) => {
                event.stopPropagation();
                showUserInfoFunc(record.user_id);
              }}
            >
              {typeof text === 'string' && text.slice(0, 1)}
            </Avatar>
            {text}
          </div>
        ) : (
          <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.TOKEN,
      title: t('令牌'),
      dataIndex: 'token_name',
      render: (text, record, index) => {
        return record.type === 0 ||
          record.type === 2 ||
          record.type === 5 ||
          record.type === 6 ? (
          <div>
            <InlineBadge
              style={{ cursor: 'pointer', fontSize: '11px', padding: '0px 6px' }}
              onClick={(event) => {
                copyText(event, text);
              }}
            >
              {t(text)}
            </InlineBadge>
          </div>
        ) : (
          <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.GROUP,
      title: t('分组'),
      dataIndex: 'group',
      render: (text, record, index) => {
        if (
          record.type === 0 ||
          record.type === 2 ||
          record.type === 5 ||
          record.type === 6
        ) {
          if (record.group) {
            return <>{renderGroup(record.group)}</>;
          } else {
            let other = null;
            try {
              other = JSON.parse(record.other);
            } catch (e) {
              console.error(
                `Failed to parse record.other: "${record.other}".`,
                e,
              );
            }
            if (other === null) {
              return <></>;
            }
            if (other.group !== undefined) {
              return <>{renderGroup(other.group)}</>;
            } else {
              return <></>;
            }
          }
        } else {
          return <></>;
        }
      },
    },
    {
      key: COLUMN_KEYS.TYPE,
      title: t('类型'),
      dataIndex: 'type',
      render: (text, record, index) => {
        return <>{renderType(text, t)}</>;
      },
    },
    {
      key: COLUMN_KEYS.MODEL,
      title: t('模型'),
      dataIndex: 'model_name',
      render: (text, record, index) => {
        return record.type === 0 ||
          record.type === 2 ||
          record.type === 5 ||
          record.type === 6 ? (
          <>{renderModelName(record, copyText, t)}</>
        ) : (
          <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.USE_TIME,
      title: t('用时/首字'),
      dataIndex: 'use_time',
      render: (text, record, index) => {
        if (!(record.type === 2 || record.type === 5)) {
          return <></>;
        }
        if (record.is_stream) {
          let other = getLogOther(record.other);
          return (
            <>
              <Space>
                {renderUseTime(text, t)}
                {renderFirstUseTime(other?.frt, t)}
                {renderIsStream(record.is_stream, t, other?.stream_status)}
              </Space>
            </>
          );
        } else {
          return (
            <>
              <Space>
                {renderUseTime(text, t)}
                {renderIsStream(record.is_stream, t)}
              </Space>
            </>
          );
        }
      },
    },
    {
      key: COLUMN_KEYS.PROMPT,
      title: (
        <div className='flex items-center gap-1'>
          {t('输入')}
          <Tooltip
            content={t(
              '根据 Anthropic 协定，/v1/messages 的输入 tokens 仅统计非缓存输入，不包含缓存读取与缓存写入 tokens。',
            )}
          >
            <IconHelpCircle className='mv-text-muted cursor-help' />
          </Tooltip>
        </div>
      ),
      dataIndex: 'prompt_tokens',
      render: (text, record, index) => {
        const other = getLogOther(record.other);
        const cacheSummary = getPromptCacheSummary(other);
        const hasCacheRead = (cacheSummary?.cacheReadTokens || 0) > 0;
        const hasCacheWrite = (cacheSummary?.cacheWriteTokens || 0) > 0;
        let cacheText = '';
        if (hasCacheRead && hasCacheWrite) {
          cacheText = `${t('缓存读')} ${formatTokenCount(cacheSummary.cacheReadTokens)} · ${t('写')} ${formatTokenCount(cacheSummary.cacheWriteTokens)}`;
        } else if (hasCacheRead) {
          cacheText = `${t('缓存读')} ${formatTokenCount(cacheSummary.cacheReadTokens)}`;
        } else if (hasCacheWrite) {
          cacheText = `${t('缓存写')} ${formatTokenCount(cacheSummary.cacheWriteTokens)}`;
        }

        return record.type === 0 ||
          record.type === 2 ||
          record.type === 5 ||
          record.type === 6 ? (
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              lineHeight: 1.2,
            }}
          >
            <span>{text}</span>
            {cacheText ? (
              <span
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {cacheText}
              </span>
            ) : null}
          </div>
        ) : (
          <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.COMPLETION,
      title: t('输出'),
      dataIndex: 'completion_tokens',
      render: (text, record, index) => {
        return parseInt(text) > 0 &&
          (record.type === 0 ||
            record.type === 2 ||
            record.type === 5 ||
            record.type === 6) ? (
          <>{<span> {text} </span>}</>
        ) : (
          <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.COST,
      title: t('花费'),
      dataIndex: 'quota',
      render: (text, record, index) => {
        if (
          !(
            record.type === 0 ||
            record.type === 2 ||
            record.type === 5 ||
            record.type === 6
          )
        ) {
          return <></>;
        }
        const other = getLogOther(record.other);
        const isSubscription = other?.billing_source === 'subscription';
        if (isSubscription) {
          // Subscription billed: show only tag (no $0), but keep tooltip for equivalent cost.
          return (
            <Tooltip content={`${t('由订阅抵扣')}：${renderQuota(text, 6)}`}>
              <span>{renderBillingTag(record, t)}</span>
            </Tooltip>
          );
        }
        return <>{renderQuota(text, 6)}</>;
      },
    },
    {
      key: COLUMN_KEYS.IP,
      title: (
        <div className='flex items-center gap-1'>
          {t('IP')}
          <Tooltip
            content={t(
              '只有当用户设置开启IP记录时，才会进行请求和错误类型日志的IP记录',
            )}
          >
            <IconHelpCircle className='mv-text-muted cursor-help' />
          </Tooltip>
        </div>
      ),
      dataIndex: 'ip',
      render: (text, record, index) => {
        return (record.type === 2 || record.type === 5) && text ? (
          <Tooltip content={text}>
            <InlineBadge
              mono
              color='var(--warning)'
              bg='rgba(255, 149, 0, 0.12)'
              style={{ cursor: 'pointer', fontSize: '11px', padding: '0px 6px' }}
              onClick={(event) => {
                copyText(event, text);
              }}
            >
              {text}
            </InlineBadge>
          </Tooltip>
        ) : (
          <></>
        );
      },
    },
    {
      key: COLUMN_KEYS.RETRY,
      title: t('重试'),
      dataIndex: 'retry',
      render: (text, record, index) => {
        if (!(record.type === 2 || record.type === 5)) {
          return <></>;
        }
        let content = t('渠道') + `：${record.channel}`;
        if (record.other !== '') {
          let other = JSON.parse(record.other);
          if (other === null) {
            return <></>;
          }
          if (other.admin_info !== undefined) {
            if (
              other.admin_info.use_channel !== null &&
              other.admin_info.use_channel !== undefined &&
              other.admin_info.use_channel !== ''
            ) {
              let useChannel = other.admin_info.use_channel;
              let useChannelStr = useChannel.join('->');
              content = t('渠道') + `：${useChannelStr}`;
            }
          }
        }
        return isAdminUser ? <div>{content}</div> : <></>;
      },
    },
    {
      key: COLUMN_KEYS.DETAILS,
      title: t('详情'),
      dataIndex: 'content',
      fixed: 'right',
      width: 200,
      render: (text, record, index) => {
        const detailSummary = getUsageLogDetailSummary(
          record,
          text,
          billingDisplayMode,
          t,
        );

        if (!detailSummary) {
          return (
            <Typography.Paragraph
              ellipsis={{
                rows: 2,
                showTooltip: {
                  type: 'popover',
                  opts: { style: { width: 240 } },
                },
              }}
              style={{ maxWidth: 200, marginBottom: 0 }}
            >
              {text}
            </Typography.Paragraph>
          );
        }

        return renderCompactDetailSummary(detailSummary.segments);
      },
    },
  ];
};
