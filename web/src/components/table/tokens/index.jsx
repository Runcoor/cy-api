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

import React, { useEffect, useRef, useState } from 'react';
import {
  Notification,
  Button,
  Space,
  Toast,
  Typography,
  Select,
} from '@douyinfe/semi-ui';
import {
  API,
  showError,
  getModelCategories,
  selectFilter,
} from '../../../helpers';
import { IconPlus, IconDelete, IconCopy } from '@douyinfe/semi-icons';
import CardPageLayout from '../../common/ui/CardPageLayout';
import TokensTable from './TokensTable';
import TokensFilters from './TokensFilters';
import CopyTokensModal from './modals/CopyTokensModal';
import DeleteTokensModal from './modals/DeleteTokensModal';
import EditTokenModal from './modals/EditTokenModal';
import CCSwitchModal from './modals/CCSwitchModal';
import { useTokensData } from '../../../hooks/tokens/useTokensData';

function TokensPage() {
  // Define the function first, then pass it into the hook to avoid TDZ errors
  const openFluentNotificationRef = useRef(null);
  const openCCSwitchModalRef = useRef(null);
  const tokensData = useTokensData(
    (key) => openFluentNotificationRef.current?.(key),
    (key) => openCCSwitchModalRef.current?.(key),
  );
  const latestRef = useRef({
    tokens: [],
    selectedKeys: [],
    t: (k) => k,
    selectedModel: '',
    prefillKey: '',
    fetchTokenKey: async () => '',
  });
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [fluentNoticeOpen, setFluentNoticeOpen] = useState(false);
  const [prefillKey, setPrefillKey] = useState('');
  const [ccSwitchVisible, setCCSwitchVisible] = useState(false);
  const [ccSwitchKey, setCCSwitchKey] = useState('');

  // Keep latest data for handlers inside notifications
  useEffect(() => {
    latestRef.current = {
      tokens: tokensData.tokens,
      selectedKeys: tokensData.selectedKeys,
      t: tokensData.t,
      selectedModel,
      prefillKey,
      fetchTokenKey: tokensData.fetchTokenKey,
    };
  }, [
    tokensData.tokens,
    tokensData.selectedKeys,
    tokensData.t,
    selectedModel,
    prefillKey,
    tokensData.fetchTokenKey,
  ]);

  const loadModels = async () => {
    try {
      const res = await API.get('/api/user/models');
      const { success, message, data } = res.data || {};
      if (success) {
        const categories = getModelCategories(tokensData.t);
        const options = (data || []).map((model) => {
          let icon = null;
          for (const [key, category] of Object.entries(categories)) {
            if (key !== 'all' && category.filter({ model_name: model })) {
              icon = category.icon;
              break;
            }
          }
          return {
            label: (
              <span className='flex items-center gap-1'>
                {icon}
                {model}
              </span>
            ),
            value: model,
          };
        });
        setModelOptions(options);
      } else {
        showError(tokensData.t(message));
      }
    } catch (e) {
      showError(e.message || 'Failed to load models');
    }
  };

  function openFluentNotification(key) {
    const { t } = latestRef.current;
    const SUPPRESS_KEY = 'fluent_notify_suppressed';
    if (modelOptions.length === 0) {
      // fire-and-forget; a later effect will refresh the notice content
      loadModels();
    }
    if (!key && localStorage.getItem(SUPPRESS_KEY) === '1') return;
    const container = document.getElementById('fluent-new-api-container');
    if (!container) {
      Toast.warning(t('未检测到 FluentRead（流畅阅读），请确认扩展已启用'));
      return;
    }
    setPrefillKey(key || '');
    setFluentNoticeOpen(true);
    Notification.info({
      id: 'fluent-detected',
      title: t('检测到 FluentRead（流畅阅读）'),
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            {key
              ? t('请选择模型。')
              : t('选择模型后可一键填充当前选中令牌（或本页第一个令牌）。')}
          </div>
          <div style={{ marginBottom: 8 }}>
            <Select
              placeholder={t('请选择模型')}
              optionList={modelOptions}
              onChange={setSelectedModel}
              filter={selectFilter}
              style={{ width: 320 }}
              showClear
              searchable
              emptyContent={t('暂无数据')}
            />
          </div>
          <Space>
            <Button
              theme='solid'
              type='primary'
              onClick={handlePrefillToFluent}
            >
              {t('一键填充到 FluentRead')}
            </Button>
            {!key && (
              <Button
                type='warning'
                onClick={() => {
                  localStorage.setItem(SUPPRESS_KEY, '1');
                  Notification.close('fluent-detected');
                  Toast.info(t('已关闭后续提醒'));
                }}
              >
                {t('不再提醒')}
              </Button>
            )}
            <Button
              type='tertiary'
              onClick={() => Notification.close('fluent-detected')}
            >
              {t('关闭')}
            </Button>
          </Space>
        </div>
      ),
      duration: 0,
    });
  }
  // assign after definition so hook callback can call it safely
  openFluentNotificationRef.current = openFluentNotification;

  function openCCSwitchModal(key) {
    if (modelOptions.length === 0) {
      loadModels();
    }
    setCCSwitchKey(key || '');
    setCCSwitchVisible(true);
  }
  openCCSwitchModalRef.current = openCCSwitchModal;

  // Prefill to Fluent handler
  const handlePrefillToFluent = async () => {
    const {
      tokens,
      selectedKeys,
      t,
      selectedModel: chosenModel,
      prefillKey: overrideKey,
      fetchTokenKey,
    } = latestRef.current;
    const container = document.getElementById('fluent-new-api-container');
    if (!container) {
      Toast.error(t('未检测到 Fluent 容器'));
      return;
    }

    if (!chosenModel) {
      Toast.warning(t('请选择模型'));
      return;
    }

    let status = localStorage.getItem('status');
    let serverAddress = '';
    if (status) {
      try {
        status = JSON.parse(status);
        serverAddress = status.server_address || '';
      } catch (_) {}
    }
    if (!serverAddress) serverAddress = window.location.origin;

    let apiKeyToUse = '';
    if (overrideKey) {
      apiKeyToUse = 'sk-' + overrideKey;
    } else {
      const token =
        selectedKeys && selectedKeys.length === 1
          ? selectedKeys[0]
          : tokens && tokens.length > 0
            ? tokens[0]
            : null;
      if (!token) {
        Toast.warning(t('没有可用令牌用于填充'));
        return;
      }
      try {
        apiKeyToUse = 'sk-' + (await fetchTokenKey(token));
      } catch (_) {
        return;
      }
    }

    const payload = {
      id: 'new-api',
      baseUrl: serverAddress,
      apiKey: apiKeyToUse,
      model: chosenModel,
    };

    container.dispatchEvent(
      new CustomEvent('fluent:prefill', { detail: payload }),
    );
    Toast.success(t('已发送到 Fluent'));
    Notification.close('fluent-detected');
  };

  // Show notification when Fluent container is available
  useEffect(() => {
    const onAppeared = () => {
      openFluentNotification();
    };
    const onRemoved = () => {
      setFluentNoticeOpen(false);
      Notification.close('fluent-detected');
    };

    window.addEventListener('fluent-container:appeared', onAppeared);
    window.addEventListener('fluent-container:removed', onRemoved);
    return () => {
      window.removeEventListener('fluent-container:appeared', onAppeared);
      window.removeEventListener('fluent-container:removed', onRemoved);
    };
  }, []);

  // When modelOptions or language changes while the notice is open, refresh the content
  useEffect(() => {
    if (fluentNoticeOpen) {
      openFluentNotification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelOptions, selectedModel, tokensData.t, fluentNoticeOpen]);

  useEffect(() => {
    const selector = '#fluent-new-api-container';
    const root = document.body || document.documentElement;

    const existing = document.querySelector(selector);
    if (existing) {
      console.log('Fluent container detected (initial):', existing);
      window.dispatchEvent(
        new CustomEvent('fluent-container:appeared', { detail: existing }),
      );
    }

    const isOrContainsTarget = (node) => {
      if (!(node && node.nodeType === 1)) return false;
      if (node.id === 'fluent-new-api-container') return true;
      return (
        typeof node.querySelector === 'function' &&
        !!node.querySelector(selector)
      );
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // appeared
        for (const added of m.addedNodes) {
          if (isOrContainsTarget(added)) {
            const el = document.querySelector(selector);
            if (el) {
              console.log('Fluent container appeared:', el);
              window.dispatchEvent(
                new CustomEvent('fluent-container:appeared', { detail: el }),
              );
            }
            break;
          }
        }
        // removed
        for (const removed of m.removedNodes) {
          if (isOrContainsTarget(removed)) {
            const elNow = document.querySelector(selector);
            if (!elNow) {
              console.log('Fluent container removed');
              window.dispatchEvent(new CustomEvent('fluent-container:removed'));
            }
            break;
          }
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const {
    // Edit state
    showEdit,
    editingToken,
    closeEdit,
    refresh,

    // Actions state
    selectedKeys,
    setEditingToken,
    setShowEdit,
    batchCopyTokens,
    batchDeleteTokens,

    // Search state
    searchQuery,
    setSearchQuery,
    searchTokens,
    loading,

    // Pagination
    tokenCount,
    activePage,
    pageSize,
    handlePageChange,

    // Translation
    t,
  } = tokensData;

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleBatchCopy = () => {
    if (selectedKeys.length === 0) {
      showError(t('请至少选择一个令牌！'));
      return;
    }
    setShowCopyModal(true);
  };
  const handleBatchDelete = () => {
    if (selectedKeys.length === 0) {
      showError(t('请至少选择一个令牌！'));
      return;
    }
    setShowDeleteModal(true);
  };

  const primaryAction = (
    <button
      type='button'
      className='cp-primary-btn'
      onClick={() => {
        setEditingToken({ id: undefined });
        setShowEdit(true);
      }}
    >
      <IconPlus size='default' />
      {t('添加令牌')}
    </button>
  );

  const secondaryActions = (
    <>
      {selectedKeys.length > 0 && (
        <>
          <button
            type='button'
            className='cp-ghost-btn'
            onClick={handleBatchCopy}
          >
            <IconCopy size='small' />
            {t('复制所选')}
          </button>
          <button
            type='button'
            className='cp-ghost-btn danger'
            onClick={handleBatchDelete}
          >
            <IconDelete size='small' />
            {t('删除所选')}
          </button>
        </>
      )}
    </>
  );

  const filterBar = (
    <TokensFilters
      value={searchQuery}
      onChange={(v) => setSearchQuery(v)}
      onSubmit={(v) => searchTokens(1, pageSize, v)}
      onRefresh={() => refresh()}
      loading={loading}
      t={t}
    />
  );

  // Lightweight pagination matching the HTML mockup footer
  const totalPages = Math.max(1, Math.ceil(tokenCount / (pageSize || 1)));
  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (activePage >= totalPages - 3)
      return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', activePage - 1, activePage, activePage + 1, '…', totalPages];
  };

  const footer = tokenCount > 0 ? (
    <div className='cp-footer'>
      <div className='cp-footer-count'>
        {t('共')} <strong>{tokenCount}</strong> {t('条')}
      </div>
      <div className='flex items-center gap-1'>
        <button
          type='button'
          className='cp-icon-btn'
          style={{ width: 36, height: 36 }}
          onClick={() => handlePageChange(Math.max(1, activePage - 1))}
          disabled={activePage <= 1}
        >
          ‹
        </button>
        {renderPageNumbers().map((p, i) =>
          p === '…' ? (
            <span
              key={`e-${i}`}
              style={{ padding: '0 6px', color: 'var(--text-muted)' }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type='button'
              onClick={() => handlePageChange(p)}
              style={{
                minWidth: 36,
                height: 36,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: p === activePage ? 700 : 500,
                color: p === activePage ? '#fff' : 'var(--text-secondary)',
                background: p === activePage ? 'var(--accent-gradient)' : 'transparent',
                boxShadow: p === activePage ? '0 4px 12px -4px rgba(0,114,255,0.35)' : 'none',
                transition: 'background var(--ease-micro), color var(--ease-micro)',
              }}
            >
              {p}
            </button>
          ),
        )}
        <button
          type='button'
          className='cp-icon-btn'
          style={{ width: 36, height: 36 }}
          onClick={() => handlePageChange(Math.min(totalPages, activePage + 1))}
          disabled={activePage >= totalPages}
        >
          ›
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <EditTokenModal
        refresh={refresh}
        editingToken={editingToken}
        visiable={showEdit}
        handleClose={closeEdit}
      />
      <CCSwitchModal
        visible={ccSwitchVisible}
        onClose={() => setCCSwitchVisible(false)}
        tokenKey={ccSwitchKey}
        modelOptions={modelOptions}
      />
      <CopyTokensModal
        visible={showCopyModal}
        onCancel={() => setShowCopyModal(false)}
        batchCopyTokens={batchCopyTokens}
        t={t}
      />
      <DeleteTokensModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          batchDeleteTokens();
          setShowDeleteModal(false);
        }}
        selectedKeys={selectedKeys}
        t={t}
      />

      <CardPageLayout
        title={t('令牌管理')}
        subtitle={
          tokenCount > 0
            ? `${t('共')} ${tokenCount} ${t('个令牌')}`
            : t('创建和管理你的 API 访问令牌')
        }
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        filterBar={filterBar}
        footer={footer}
      >
        <TokensTable {...tokensData} />
      </CardPageLayout>
    </>
  );
}

export default TokensPage;
