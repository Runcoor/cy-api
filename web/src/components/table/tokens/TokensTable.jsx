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
  Button,
  Dropdown,
  Popover,
  Typography,
  Progress,
  Modal,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconKey,
  IconEyeOpened,
  IconEyeClosed,
  IconCopy,
  IconEdit,
  IconDelete,
  IconPlay,
  IconStop,
  IconTreeTriangleDown,
  IconComment,
} from '@douyinfe/semi-icons';
import CardList from '../../common/ui/CardList';
import CardRow from '../../common/ui/CardRow';
import {
  timestamp2string,
  renderGroup,
  renderQuota,
  showError,
} from '../../../helpers';

const { Paragraph } = Typography;

/* ───────── Status (token.status → icon color + label) ───────── */
const STATUS_MAP = {
  1: { color: 'success', label: '已启用' },
  2: { color: 'error', label: '已禁用' },
  3: { color: 'warning', label: '已过期' },
  4: { color: 'muted', label: '已耗尽' },
};

const getStatus = (record) => STATUS_MAP[record.status] || STATUS_MAP[4];

/* ───────── Status badge (inline, next to name) ───────── */
const StatusBadge = ({ color, children }) => {
  const palette = {
    success: { fg: '#34c759', bg: 'rgba(52, 199, 89, 0.12)' },
    error: { fg: '#ff3b30', bg: 'rgba(255, 59, 48, 0.12)' },
    warning: { fg: '#ff9500', bg: 'rgba(255, 149, 0, 0.12)' },
    accent: { fg: 'var(--accent)', bg: 'var(--accent-light)' },
    muted: { fg: 'var(--text-muted)', bg: 'var(--surface-active)' },
  }[color] || { fg: 'var(--text-muted)', bg: 'var(--surface-active)' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 7px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: '16px',
        color: palette.fg,
        background: palette.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};

/* ───────── Quota usage cell (compact progress + popover details) ───────── */
const QuotaCell = ({ record, t }) => {
  const used = parseInt(record.used_quota) || 0;
  const remain = parseInt(record.remain_quota) || 0;
  const total = used + remain;

  if (record.unlimited_quota) {
    const popover = (
      <div className='text-xs p-2'>
        <Paragraph copyable={{ content: renderQuota(used) }}>
          {t('已用额度')}: {renderQuota(used)}
        </Paragraph>
      </div>
    );
    return (
      <Popover content={popover} position='top'>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '1px 7px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: '16px',
          }}
        >
          {t('无限额度')}
        </span>
      </Popover>
    );
  }

  const percent = total > 0 ? (remain / total) * 100 : 0;
  const strokeColor =
    percent === 100
      ? 'var(--success)'
      : percent <= 10
        ? 'var(--error)'
        : percent <= 30
          ? 'var(--warning)'
          : undefined;

  const popover = (
    <div className='text-xs p-2'>
      <Paragraph copyable={{ content: renderQuota(used) }}>
        {t('已用额度')}: {renderQuota(used)}
      </Paragraph>
      <Paragraph copyable={{ content: renderQuota(remain) }}>
        {t('剩余额度')}: {renderQuota(remain)} ({percent.toFixed(0)}%)
      </Paragraph>
      <Paragraph copyable={{ content: renderQuota(total) }}>
        {t('总额度')}: {renderQuota(total)}
      </Paragraph>
    </div>
  );

  return (
    <Popover content={popover} position='top'>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.3,
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {`${renderQuota(remain)} / ${renderQuota(total)}`}
        </div>
        <Progress
          percent={percent}
          stroke={strokeColor}
          aria-label='quota usage'
          size='small'
          showInfo={false}
          style={{ width: '100%', marginTop: 0, marginBottom: 0 }}
        />
      </div>
    </Popover>
  );
};

/* ───────── Group cell ───────── */
const GroupCell = ({ record, t }) => {
  if (record.group === 'auto') {
    return (
      <Tooltip
        content={t(
          '当前分组为 auto，会自动选择最优分组，当一个组不可用时自动降级到下一个组（熔断机制）',
        )}
        position='top'
      >
        <StatusBadge color='accent'>
          {t('智能熔断')}
          {record.cross_group_retry ? `(${t('跨分组')})` : ''}
        </StatusBadge>
      </Tooltip>
    );
  }
  return <>{renderGroup(record.group)}</>;
};

/* ───────── Key cell — masked with reveal + copy-menu ───────── */
const KeyCell = ({
  record,
  showKeys,
  resolvedTokenKeys,
  loadingTokenKeys,
  toggleTokenVisibility,
  copyTokenKey,
  copyTokenConnectionString,
  t,
}) => {
  const revealed = !!showKeys[record.id];
  const loading = !!loadingTokenKeys[record.id];
  const keyValue =
    revealed && resolvedTokenKeys[record.id]
      ? resolvedTokenKeys[record.id]
      : record.key || '';
  const displayedKey = keyValue ? `sk-${keyValue}` : '';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
        maxWidth: '100%',
        padding: '2px 4px 2px 8px',
        background: 'var(--surface-active)',
        borderRadius: 'var(--radius-sm)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          color: 'var(--text-primary)',
        }}
      >
        {displayedKey}
      </span>
      <Button
        theme='borderless'
        size='small'
        type='tertiary'
        icon={revealed ? <IconEyeClosed /> : <IconEyeOpened />}
        loading={loading}
        aria-label='toggle token visibility'
        onClick={async (e) => {
          e.stopPropagation();
          await toggleTokenVisibility(record);
        }}
      />
      <Dropdown
        trigger='click'
        position='bottomRight'
        clickToHide
        menu={[
          {
            node: 'item',
            name: t('复制密钥'),
            onClick: () => copyTokenKey(record),
          },
          {
            node: 'item',
            name: t('复制连接信息'),
            onClick: () => copyTokenConnectionString(record),
          },
        ]}
      >
        <Button
          theme='borderless'
          size='small'
          type='tertiary'
          icon={<IconCopy />}
          aria-label='copy token key'
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </div>
  );
};

/* ───────── Row actions ───────── */
const buildActions = ({
  record,
  onOpenLink,
  setEditingToken,
  setShowEdit,
  manageToken,
  refresh,
  t,
}) => {
  // Build chat links from localStorage
  let chatsArray = [];
  try {
    const raw = localStorage.getItem('chats');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        const name = Object.keys(item)[0];
        if (!name) continue;
        chatsArray.push({
          node: 'item',
          key: i,
          name,
          value: item[name],
          onClick: () => onOpenLink(name, item[name], record),
        });
      }
    }
  } catch (_) {
    showError(t('聊天链接配置错误，请联系管理员'));
  }

  const chatAction = (
    <Dropdown
      key='chat'
      trigger='click'
      position='bottomRight'
      menu={
        chatsArray.length > 0
          ? chatsArray
          : [{ node: 'item', name: t('请联系管理员配置聊天链接'), disabled: true }]
      }
    >
      <Button
        theme='borderless'
        type='tertiary'
        size='small'
        icon={<IconComment />}
        aria-label={t('聊天')}
      />
    </Dropdown>
  );

  const toggleAction =
    record.status === 1 ? (
      <Tooltip key='disable' content={t('禁用')} position='top'>
        <Button
          theme='borderless'
          type='warning'
          size='small'
          icon={<IconStop />}
          onClick={async () => {
            await manageToken(record.id, 'disable', record);
            await refresh();
          }}
        />
      </Tooltip>
    ) : (
      <Tooltip key='enable' content={t('启用')} position='top'>
        <Button
          theme='borderless'
          type='primary'
          size='small'
          icon={<IconPlay />}
          onClick={async () => {
            await manageToken(record.id, 'enable', record);
            await refresh();
          }}
        />
      </Tooltip>
    );

  const editAction = (
    <Tooltip key='edit' content={t('编辑')} position='top'>
      <Button
        theme='borderless'
        type='tertiary'
        size='small'
        icon={<IconEdit />}
        onClick={() => {
          setEditingToken(record);
          setShowEdit(true);
        }}
      />
    </Tooltip>
  );

  const deleteAction = (
    <Tooltip key='delete' content={t('删除')} position='top'>
      <Button
        theme='borderless'
        type='danger'
        size='small'
        icon={<IconDelete />}
        onClick={() => {
          Modal.confirm({
            title: t('确定是否要删除此令牌？'),
            content: t('此修改将不可逆'),
            onOk: async () => {
              await manageToken(record.id, 'delete', record);
              await refresh();
            },
          });
        }}
      />
    </Tooltip>
  );

  return [chatAction, toggleAction, editAction, deleteAction];
};

/* ───────── Main component ───────── */
const TokensTable = (tokensData) => {
  const {
    tokens,
    loading,
    showKeys,
    resolvedTokenKeys,
    loadingTokenKeys,
    toggleTokenVisibility,
    copyTokenKey,
    copyTokenConnectionString,
    manageToken,
    onOpenLink,
    setEditingToken,
    setShowEdit,
    refresh,
    t,
  } = tokensData;

  const renderCard = (record) => {
    const status = getStatus(record);

    const fields = [
      {
        label: t('名称 & 状态'),
        value: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {record.name || '—'}
            </span>
            <StatusBadge color={status.color}>{t(status.label)}</StatusBadge>
          </div>
        ),
        span: 2,
      },
      {
        label: t('剩余 / 总额度'),
        value: <QuotaCell record={record} t={t} />,
      },
      {
        label: t('分组'),
        value: <GroupCell record={record} t={t} />,
        hideOnMobile: false,
      },
      {
        label: t('密钥'),
        value: (
          <KeyCell
            record={record}
            showKeys={showKeys}
            resolvedTokenKeys={resolvedTokenKeys}
            loadingTokenKeys={loadingTokenKeys}
            toggleTokenVisibility={toggleTokenVisibility}
            copyTokenKey={copyTokenKey}
            copyTokenConnectionString={copyTokenConnectionString}
            t={t}
          />
        ),
        mono: true,
      },
      {
        label: t('过期时间'),
        value:
          record.expired_time === -1
            ? t('永不过期')
            : timestamp2string(record.expired_time),
        align: 'end',
        hideOnMobile: true,
      },
    ];

    const actions = buildActions({
      record,
      onOpenLink,
      setEditingToken,
      setShowEdit,
      manageToken,
      refresh,
      t,
    });

    return (
      <CardRow
        key={record.id}
        statusIcon={<IconKey />}
        statusColor={status.color}
        fields={fields}
        actions={actions}
      />
    );
  };

  return (
    <CardList
      dataSource={tokens}
      renderCard={renderCard}
      loading={loading}
      t={t}
    />
  );
};

export default TokensTable;
