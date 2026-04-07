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
import { Chat, Button } from '@douyinfe/semi-ui';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CustomInputRender from './CustomInputRender';

const ChatArea = ({
  chatRef,
  message,
  inputs,
  styleState,
  showDebugPanel,
  roleInfo,
  onMessageSend,
  onMessageCopy,
  onMessageReset,
  onMessageDelete,
  onStopGenerator,
  onClearMessages,
  onToggleDebugPanel,
  renderCustomChatContent,
  renderChatBoxAction,
}) => {
  const { t } = useTranslation();

  const renderInputArea = React.useCallback((props) => {
    return <CustomInputRender {...props} />;
  }, []);

  return (
    <div
      className='h-full'
      style={{
        padding: 0,
        height: 'calc(100vh - 66px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 聊天头部 */}
      {styleState.isMobile ? (
        <div className='pt-4'></div>
      ) : (
        <div className='px-6 py-4' style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 flex items-center justify-center' style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-hover)' }}>
                <MessageSquare size={20} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div>
                <h5 className='mb-0 text-base font-semibold' style={{ color: 'var(--text-primary)' }}>
                  {t('AI 对话')}
                </h5>
                <span className='text-sm hidden sm:inline' style={{ color: 'var(--text-muted)' }}>
                  {inputs.model || t('选择模型开始对话')}
                </span>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                icon={showDebugPanel ? <EyeOff size={14} /> : <Eye size={14} />}
                onClick={onToggleDebugPanel}
                theme='borderless'
                type='tertiary'
                size='small'
                style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}
              >
                {showDebugPanel ? t('隐藏调试') : t('显示调试')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 聊天内容区域 */}
      <div className='flex-1 overflow-hidden'>
        <Chat
          ref={chatRef}
          chatBoxRenderConfig={{
            renderChatBoxContent: renderCustomChatContent,
            renderChatBoxAction: renderChatBoxAction,
            renderChatBoxTitle: () => null,
          }}
          renderInputArea={renderInputArea}
          roleConfig={roleInfo}
          style={{
            height: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
          chats={message}
          onMessageSend={onMessageSend}
          onMessageCopy={onMessageCopy}
          onMessageReset={onMessageReset}
          onMessageDelete={onMessageDelete}
          showClearContext
          showStopGenerate
          onStopGenerator={onStopGenerator}
          onClear={onClearMessages}
          className='h-full'
          placeholder={t('请输入您的问题...')}
        />
      </div>
    </div>
  );
};

export default ChatArea;
