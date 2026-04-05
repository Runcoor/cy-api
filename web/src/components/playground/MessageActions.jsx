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
import { Button, Tooltip } from '@douyinfe/semi-ui';
import { RefreshCw, Copy, Trash2, UserCheck, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MessageActions = ({
  message,
  styleState,
  onMessageReset,
  onMessageCopy,
  onMessageDelete,
  onRoleToggle,
  onMessageEdit,
  isAnyMessageGenerating = false,
  isEditing = false,
}) => {
  const { t } = useTranslation();

  const isLoading =
    message.status === 'loading' || message.status === 'incomplete';
  const shouldDisableActions = isAnyMessageGenerating || isEditing;
  const canToggleRole =
    message.role === 'assistant' || message.role === 'system';
  const canEdit =
    !isLoading &&
    message.content &&
    typeof onMessageEdit === 'function' &&
    !isEditing;

  const btnSize = styleState.isMobile ? 24 : 28;
  const iconSize = styleState.isMobile ? 12 : 14;
  const actionBtnStyle = {
    width: btnSize,
    height: btnSize,
    padding: 0,
    borderRadius: 'var(--radius-sm)',
    color: shouldDisableActions ? 'var(--text-muted)' : 'var(--text-secondary)',
    transition: 'color 150ms ease-out',
  };

  return (
    <div className='flex items-center gap-0.5'>
      {!isLoading && (
        <Tooltip
          content={shouldDisableActions ? t('操作暂时被禁用') : t('重试')}
          position='top'
        >
          <Button
            theme='borderless'
            type='tertiary'
            size='small'
            icon={<RefreshCw size={iconSize} />}
            onClick={() => !shouldDisableActions && onMessageReset(message)}
            disabled={shouldDisableActions}
            style={actionBtnStyle}
            aria-label={t('重试')}
          />
        </Tooltip>
      )}

      {message.content && (
        <Tooltip content={t('复制')} position='top'>
          <Button
            theme='borderless'
            type='tertiary'
            size='small'
            icon={<Copy size={iconSize} />}
            onClick={() => onMessageCopy(message)}
            style={actionBtnStyle}
            aria-label={t('复制')}
          />
        </Tooltip>
      )}

      {canEdit && (
        <Tooltip
          content={shouldDisableActions ? t('操作暂时被禁用') : t('编辑')}
          position='top'
        >
          <Button
            theme='borderless'
            type='tertiary'
            size='small'
            icon={<Edit size={iconSize} />}
            onClick={() => !shouldDisableActions && onMessageEdit(message)}
            disabled={shouldDisableActions}
            style={actionBtnStyle}
            aria-label={t('编辑')}
          />
        </Tooltip>
      )}

      {canToggleRole && !isLoading && (
        <Tooltip
          content={
            shouldDisableActions
              ? t('操作暂时被禁用')
              : message.role === 'assistant'
                ? t('切换为System角色')
                : t('切换为Assistant角色')
          }
          position='top'
        >
          <Button
            theme='borderless'
            type='tertiary'
            size='small'
            icon={<UserCheck size={iconSize} />}
            onClick={() =>
              !shouldDisableActions && onRoleToggle && onRoleToggle(message)
            }
            disabled={shouldDisableActions}
            style={actionBtnStyle}
            aria-label={
              message.role === 'assistant'
                ? t('切换为System角色')
                : t('切换为Assistant角色')
            }
          />
        </Tooltip>
      )}

      {!isLoading && (
        <Tooltip
          content={shouldDisableActions ? t('操作暂时被禁用') : t('删除')}
          position='top'
        >
          <Button
            theme='borderless'
            type='tertiary'
            size='small'
            icon={<Trash2 size={iconSize} />}
            onClick={() => !shouldDisableActions && onMessageDelete(message)}
            disabled={shouldDisableActions}
            style={actionBtnStyle}
            aria-label={t('删除')}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default MessageActions;
