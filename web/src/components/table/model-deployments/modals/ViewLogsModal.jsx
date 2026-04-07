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

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Select,
  Input,
  Empty,
  Switch,
  Tooltip,
  Radio,
} from '@douyinfe/semi-ui';
import {
  FaCopy,
  FaSearch,
  FaClock,
  FaTerminal,
  FaServer,
  FaInfoCircle,
  FaLink,
} from 'react-icons/fa';
import { IconRefresh, IconDownload } from '@douyinfe/semi-icons';
import {
  API,
  showError,
  showSuccess,
  copy,
  timestamp2string,
} from '../../../../helpers';
import MacSpinner from '../../../common/ui/MacSpinner';

/* ── iOS-style inline badge ── */
const InlineBadge = ({ color, bg, mono, children }) => (
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
    }}
  >
    {children}
  </span>
);

const ALL_CONTAINERS = '__all__';

/* ── Status badge config ── */
const getStatusBadge = (status, t) => {
  if (!status) {
    return { color: 'var(--text-muted)', bg: 'var(--surface-active)', label: t('未知状态') };
  }
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  const statusMap = {
    running: { color: 'var(--success)', bg: 'var(--success-light)', label: '运行中' },
    pending: { color: 'var(--warning)', bg: 'var(--warning-light)', label: '准备中' },
    deployed: { color: 'var(--accent)', bg: 'var(--accent-light)', label: '已部署' },
    failed: { color: 'var(--error)', bg: 'var(--error-light)', label: '失败' },
    destroyed: { color: 'var(--error)', bg: 'var(--error-light)', label: '已销毁' },
    stopping: { color: 'var(--warning)', bg: 'var(--warning-light)', label: '停止中' },
    terminated: { color: 'var(--text-muted)', bg: 'var(--surface-active)', label: '已终止' },
  };
  const config = statusMap[normalized] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', label: status };
  return { ...config, label: t(config.label) };
};

const ViewLogsModal = ({ visible, onCancel, deployment, t }) => {
  const [logLines, setLogLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [following, setFollowing] = useState(false);
  const [containers, setContainers] = useState([]);
  const [containersLoading, setContainersLoading] = useState(false);
  const [selectedContainerId, setSelectedContainerId] =
    useState(ALL_CONTAINERS);
  const [containerDetails, setContainerDetails] = useState(null);
  const [containerDetailsLoading, setContainerDetailsLoading] = useState(false);
  const [streamFilter, setStreamFilter] = useState('stdout');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const logContainerRef = useRef(null);
  const autoRefreshRef = useRef(null);

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  const resolveStreamValue = (value) => {
    if (typeof value === 'string') return value;
    if (value && typeof value.value === 'string') return value.value;
    if (value && value.target && typeof value.target.value === 'string') return value.target.value;
    return '';
  };

  const handleStreamChange = (value) => {
    const next = resolveStreamValue(value) || 'stdout';
    setStreamFilter(next);
  };

  const fetchLogs = async (containerIdOverride = undefined) => {
    if (!deployment?.id) return;

    const containerId =
      typeof containerIdOverride === 'string'
        ? containerIdOverride
        : selectedContainerId;

    if (!containerId || containerId === ALL_CONTAINERS) {
      setLogLines([]);
      setLastUpdatedAt(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('container_id', containerId);

      const streamValue = resolveStreamValue(streamFilter) || 'stdout';
      if (streamValue && streamValue !== 'all') {
        params.append('stream', streamValue);
      }
      if (following) params.append('follow', 'true');

      const response = await API.get(
        `/api/deployments/${deployment.id}/logs?${params}`,
      );

      if (response.data.success) {
        const rawContent =
          typeof response.data.data === 'string' ? response.data.data : '';
        const normalized = rawContent.replace(/\r\n?/g, '\n');
        const lines = normalized ? normalized.split('\n') : [];

        setLogLines(lines);
        setLastUpdatedAt(new Date());

        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      showError(
        t('获取日志失败') +
          ': ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchContainers = async () => {
    if (!deployment?.id) return;

    setContainersLoading(true);
    try {
      const response = await API.get(
        `/api/deployments/${deployment.id}/containers`,
      );

      if (response.data.success) {
        const list = response.data.data?.containers || [];
        setContainers(list);

        setSelectedContainerId((current) => {
          if (
            current !== ALL_CONTAINERS &&
            list.some((item) => item.container_id === current)
          ) {
            return current;
          }

          return list.length > 0 ? list[0].container_id : ALL_CONTAINERS;
        });

        if (list.length === 0) {
          setContainerDetails(null);
        }
      }
    } catch (error) {
      showError(
        t('获取容器列表失败') +
          ': ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setContainersLoading(false);
    }
  };

  const fetchContainerDetails = async (containerId) => {
    if (!deployment?.id || !containerId || containerId === ALL_CONTAINERS) {
      setContainerDetails(null);
      return;
    }

    setContainerDetailsLoading(true);
    try {
      const response = await API.get(
        `/api/deployments/${deployment.id}/containers/${containerId}`,
      );

      if (response.data.success) {
        setContainerDetails(response.data.data || null);
      }
    } catch (error) {
      showError(
        t('获取容器详情失败') +
          ': ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setContainerDetailsLoading(false);
    }
  };

  const handleContainerChange = (value) => {
    const newValue = value || ALL_CONTAINERS;
    setSelectedContainerId(newValue);
    setLogLines([]);
    setLastUpdatedAt(null);
  };

  const refreshContainerDetails = () => {
    if (selectedContainerId && selectedContainerId !== ALL_CONTAINERS) {
      fetchContainerDetails(selectedContainerId);
    }
  };

  const currentContainer =
    selectedContainerId !== ALL_CONTAINERS
      ? containers.find((ctr) => ctr.container_id === selectedContainerId)
      : null;

  const refreshLogs = () => {
    if (selectedContainerId && selectedContainerId !== ALL_CONTAINERS) {
      fetchContainerDetails(selectedContainerId);
    }
    fetchLogs();
  };

  const downloadLogs = () => {
    const sourceLogs = filteredLogs.length > 0 ? filteredLogs : logLines;
    if (sourceLogs.length === 0) {
      showError(t('暂无日志可下载'));
      return;
    }
    const logText = sourceLogs.join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeContainerId =
      selectedContainerId && selectedContainerId !== ALL_CONTAINERS
        ? selectedContainerId.replace(/[^a-zA-Z0-9_-]/g, '-')
        : '';
    const fileName = safeContainerId
      ? `deployment-${deployment.id}-container-${safeContainerId}-logs.txt`
      : `deployment-${deployment.id}-logs.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess(t('日志已下载'));
  };

  const copyAllLogs = async () => {
    const sourceLogs = filteredLogs.length > 0 ? filteredLogs : logLines;
    if (sourceLogs.length === 0) {
      showError(t('暂无日志可复制'));
      return;
    }
    const logText = sourceLogs.join('\n');

    const copied = await copy(logText);
    if (copied) {
      showSuccess(t('日志已复制到剪贴板'));
    } else {
      showError(t('复制失败，请手动选择文本复制'));
    }
  };

  // Auto refresh functionality
  useEffect(() => {
    if (autoRefresh && visible) {
      autoRefreshRef.current = setInterval(() => {
        fetchLogs();
      }, 5000);
    } else {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefresh, visible, selectedContainerId, streamFilter, following]);

  useEffect(() => {
    if (visible && deployment?.id) {
      fetchContainers();
    } else if (!visible) {
      setContainers([]);
      setSelectedContainerId(ALL_CONTAINERS);
      setContainerDetails(null);
      setStreamFilter('stdout');
      setLogLines([]);
      setLastUpdatedAt(null);
    }
  }, [visible, deployment?.id]);

  useEffect(() => {
    if (visible) {
      setStreamFilter('stdout');
    }
  }, [selectedContainerId, visible]);

  useEffect(() => {
    if (visible && deployment?.id) {
      fetchContainerDetails(selectedContainerId);
    }
  }, [visible, deployment?.id, selectedContainerId]);

  // Initial load and cleanup
  useEffect(() => {
    if (visible && deployment?.id) {
      fetchLogs();
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [visible, deployment?.id, streamFilter, selectedContainerId, following]);

  // Filter logs based on search term
  const filteredLogs = logLines
    .map((line) => line ?? '')
    .filter(
      (line) =>
        !searchTerm || line.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const renderLogEntry = (line, index) => (
    <div
      key={`${index}-${line.slice(0, 20)}`}
      className='py-1 px-3 text-xs whitespace-pre-wrap break-words'
      style={{
        fontFamily: 'var(--font-mono)',
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      {line}
    </div>
  );

  return (
    <Modal
      title={
        <div className='flex items-center gap-2.5'>
          <span
            className='w-7 h-7 flex items-center justify-center'
            style={{
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
            }}
          >
            <FaTerminal size={14} />
          </span>
          <span
            className='text-base font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
            }}
          >
            {t('容器日志')}
          </span>
          <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
            — {deployment?.container_name || deployment?.id}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      height={700}
      className='logs-modal'
      style={{ top: 20 }}
    >
      <div className='flex flex-col h-full max-h-[600px]'>
        {/* Controls Panel */}
        <div
          className='mb-3 rounded-[var(--radius-lg)] overflow-hidden'
          style={{
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface)',
          }}
        >
          {/* Toolbar row */}
          <div
            className='px-4 py-3'
            style={{
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div className='flex items-center justify-between flex-wrap gap-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <Select
                  prefix={<FaServer style={{ color: 'var(--text-muted)' }} />}
                  placeholder={t('选择容器')}
                  value={selectedContainerId}
                  onChange={handleContainerChange}
                  style={{ width: 240 }}
                  size='small'
                  loading={containersLoading}
                  dropdownStyle={{ maxHeight: 320, overflowY: 'auto' }}
                >
                  <Select.Option value={ALL_CONTAINERS}>
                    {t('全部容器')}
                  </Select.Option>
                  {containers.map((ctr) => (
                    <Select.Option
                      key={ctr.container_id}
                      value={ctr.container_id}
                    >
                      <div className='flex flex-col'>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {ctr.container_id}
                        </span>
                        <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                          {ctr.brand_name || 'IO.NET'}
                          {ctr.hardware ? ` · ${ctr.hardware}` : ''}
                        </span>
                      </div>
                    </Select.Option>
                  ))}
                </Select>

                <Input
                  prefix={<FaSearch style={{ color: 'var(--text-muted)' }} />}
                  placeholder={t('搜索日志内容')}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  style={{ width: 200 }}
                  size='small'
                />

                <div className='flex items-center gap-1.5 ml-1'>
                  <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {t('日志流')}
                  </span>
                  <Radio.Group
                    type='button'
                    size='small'
                    value={streamFilter}
                    onChange={handleStreamChange}
                  >
                    <Radio value='stdout'>STDOUT</Radio>
                    <Radio value='stderr'>STDERR</Radio>
                  </Radio.Group>
                </div>

                <div className='flex items-center gap-1.5'>
                  <Switch
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                    size='small'
                  />
                  <span className='text-xs' style={{ color: 'var(--text-secondary)' }}>
                    {t('自动刷新')}
                  </span>
                </div>

                <div className='flex items-center gap-1.5'>
                  <Switch
                    checked={following}
                    onChange={setFollowing}
                    size='small'
                  />
                  <span className='text-xs' style={{ color: 'var(--text-secondary)' }}>
                    {t('跟随日志')}
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-1'>
                <Tooltip content={t('刷新日志')}>
                  <Button
                    icon={<IconRefresh />}
                    onClick={refreshLogs}
                    loading={loading}
                    size='small'
                    theme='borderless'
                    style={{ borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
                  />
                </Tooltip>

                <Tooltip content={t('复制日志')}>
                  <Button
                    icon={<FaCopy />}
                    onClick={copyAllLogs}
                    size='small'
                    theme='borderless'
                    disabled={logLines.length === 0}
                    style={{ borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
                  />
                </Tooltip>

                <Tooltip content={t('下载日志')}>
                  <Button
                    icon={<IconDownload />}
                    onClick={downloadLogs}
                    size='small'
                    theme='borderless'
                    disabled={logLines.length === 0}
                    style={{ borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Status info strip */}
          <div
            className='flex items-center justify-between px-4 py-2'
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className='flex items-center gap-3'>
              <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                {t('共 {{count}} 条日志', { count: logLines.length })}
              </span>
              {searchTerm && (
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {t('(筛选后显示 {{count}} 条)', {
                    count: filteredLogs.length,
                  })}
                </span>
              )}
              {autoRefresh && (
                <InlineBadge color='var(--success)' bg='var(--success-light)'>
                  <FaClock size={10} />
                  {t('自动刷新中')}
                </InlineBadge>
              )}
            </div>

            <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
              {t('状态')}: {deployment?.status || 'unknown'}
            </span>
          </div>

          {/* Container details section */}
          {selectedContainerId !== ALL_CONTAINERS && (
            <div className='px-4 py-3'>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between flex-wrap gap-2'>
                  <div className='flex items-center gap-2'>
                    <InlineBadge color='var(--accent)' bg='var(--accent-light)'>
                      {t('容器')}
                    </InlineBadge>
                    <span
                      className='text-xs'
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {selectedContainerId}
                    </span>
                    {(() => {
                      const cfg = getStatusBadge(
                        containerDetails?.status || currentContainer?.status,
                        t,
                      );
                      return (
                        <InlineBadge color={cfg.color} bg={cfg.bg}>
                          {cfg.label}
                        </InlineBadge>
                      );
                    })()}
                  </div>

                  <div className='flex items-center gap-1'>
                    {containerDetails?.public_url && (
                      <Tooltip content={containerDetails.public_url}>
                        <Button
                          icon={<FaLink />}
                          size='small'
                          theme='borderless'
                          onClick={() =>
                            window.open(containerDetails.public_url, '_blank')
                          }
                          style={{ borderRadius: 'var(--radius-sm)', color: 'var(--accent)' }}
                        />
                      </Tooltip>
                    )}
                    <Tooltip content={t('刷新容器信息')}>
                      <Button
                        icon={<IconRefresh />}
                        onClick={refreshContainerDetails}
                        size='small'
                        theme='borderless'
                        loading={containerDetailsLoading}
                        style={{ borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
                      />
                    </Tooltip>
                  </div>
                </div>

                {containerDetailsLoading ? (
                  <div className='flex items-center justify-center py-6'>
                    <MacSpinner tip={t('加载容器详情中...')} />
                  </div>
                ) : containerDetails ? (
                  <div className='grid gap-3 md:grid-cols-2 text-sm'>
                    <div className='flex items-center gap-2'>
                      <FaInfoCircle size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)' }}>{t('硬件')}</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {containerDetails?.brand_name ||
                          currentContainer?.brand_name ||
                          t('未知品牌')}
                        {containerDetails?.hardware ||
                        currentContainer?.hardware
                          ? ` · ${containerDetails?.hardware || currentContainer?.hardware}`
                          : ''}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <FaServer size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)' }}>{t('GPU/容器')}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {containerDetails?.gpus_per_container ??
                          currentContainer?.gpus_per_container ??
                          0}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <FaClock size={12} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)' }}>{t('创建时间')}</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {containerDetails?.created_at
                          ? timestamp2string(containerDetails.created_at)
                          : currentContainer?.created_at
                            ? timestamp2string(currentContainer.created_at)
                            : t('未知')}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <FaInfoCircle size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)' }}>{t('运行时长')}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {containerDetails?.uptime_percent ??
                          currentContainer?.uptime_percent ??
                          0}
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                    {t('暂无容器详情')}
                  </span>
                )}

                {containerDetails?.events &&
                  containerDetails.events.length > 0 && (
                    <div
                      className='rounded-[var(--radius-md)] p-3'
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span
                        className='block mb-1.5 text-xs font-medium'
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {t('最近事件')}
                      </span>
                      <div className='space-y-1.5 max-h-32 overflow-y-auto'>
                        {containerDetails.events
                          .slice(0, 5)
                          .map((event, index) => (
                            <div
                              key={`${event.time}-${index}`}
                              className='flex gap-3 text-xs'
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              <span className='flex-shrink-0' style={{ color: 'var(--text-muted)' }}>
                                {event.time
                                  ? timestamp2string(event.time)
                                  : '--'}
                              </span>
                              <span className='break-all flex-1' style={{ color: 'var(--text-secondary)' }}>
                                {event.message}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Log Content — terminal-like area */}
        <div
          className='flex-1 flex flex-col rounded-[var(--radius-lg)] overflow-hidden'
          style={{
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
          }}
        >
          <div
            ref={logContainerRef}
            className='flex-1 overflow-y-auto'
            style={{ background: 'var(--surface)', maxHeight: '400px' }}
          >
            {loading && logLines.length === 0 ? (
              <div className='flex items-center justify-center p-8'>
                <MacSpinner tip={t('加载日志中...')} />
              </div>
            ) : filteredLogs.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchTerm ? t('没有匹配的日志条目') : t('暂无日志')
                }
                style={{ padding: '60px 20px' }}
              />
            ) : (
              <div>
                {filteredLogs.map((log, index) => renderLogEntry(log, index))}
              </div>
            )}
          </div>

          {/* Footer status */}
          {logLines.length > 0 && (
            <div
              className='flex items-center justify-between px-3 py-2 text-xs'
              style={{
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <span>{following ? t('正在跟随最新日志') : t('日志已加载')}</span>
              <span>
                {t('最后更新')}:{' '}
                {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : '--'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewLogsModal;
