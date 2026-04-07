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

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Progress,
  Descriptions,
  Empty,
  Button,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  FaInfoCircle,
  FaServer,
  FaClock,
  FaMapMarkerAlt,
  FaDocker,
  FaMoneyBillWave,
  FaChartLine,
  FaCopy,
  FaLink,
} from 'react-icons/fa';
import { IconRefresh } from '@douyinfe/semi-icons';
import {
  API,
  showError,
  showSuccess,
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

/* ── Status dot (replaces emoji icons) ── */
const StatusDot = ({ color }) => (
  <span
    className='inline-block w-2 h-2 rounded-full flex-shrink-0'
    style={{ background: color }}
  />
);

/* ── macOS panel section wrapper ── */
const PanelSection = ({ icon, iconColor, iconBg, title, children }) => (
  <div
    className='rounded-[var(--radius-lg)] overflow-hidden'
    style={{
      border: '1px solid var(--border-subtle)',
      background: 'var(--surface)',
    }}
  >
    <div
      className='flex items-center gap-2.5 px-4 py-3'
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <span
        className='w-6 h-6 flex items-center justify-center flex-shrink-0'
        style={{
          borderRadius: 'var(--radius-sm)',
          background: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      <span
        className='text-sm font-semibold'
        style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </span>
    </div>
    <div className='px-4 py-3'>{children}</div>
  </div>
);

const ViewDetailsModal = ({ visible, onCancel, deployment, t }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [containers, setContainers] = useState([]);
  const [containersLoading, setContainersLoading] = useState(false);

  const fetchDetails = async () => {
    if (!deployment?.id) return;

    setLoading(true);
    try {
      const response = await API.get(`/api/deployments/${deployment.id}`);
      if (response.data.success) {
        setDetails(response.data.data);
      }
    } catch (error) {
      showError(
        t('获取详情失败') +
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
        setContainers(response.data.data?.containers || []);
      }
    } catch (error) {
      showError(
        t('获取容器信息失败') +
          ': ' +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setContainersLoading(false);
    }
  };

  useEffect(() => {
    if (visible && deployment?.id) {
      fetchDetails();
      fetchContainers();
    } else if (!visible) {
      setDetails(null);
      setContainers([]);
    }
  }, [visible, deployment?.id]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(deployment?.id);
    showSuccess(t('已复制 ID 到剪贴板'));
  };

  const handleRefresh = () => {
    fetchDetails();
    fetchContainers();
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      running: { color: 'var(--success)', bg: 'var(--success-light)', text: '运行中' },
      completed: { color: 'var(--success)', bg: 'var(--success-light)', text: '已完成' },
      'deployment requested': { color: 'var(--accent)', bg: 'var(--accent-light)', text: '部署请求中' },
      'termination requested': { color: 'var(--warning)', bg: 'var(--warning-light)', text: '终止请求中' },
      destroyed: { color: 'var(--error)', bg: 'var(--error-light)', text: '已销毁' },
      failed: { color: 'var(--error)', bg: 'var(--error-light)', text: '失败' },
    };
    return statusConfig[status] || { color: 'var(--text-muted)', bg: 'var(--surface-active)', text: status };
  };

  const statusConfig = getStatusConfig(deployment?.status);

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
            <FaInfoCircle size={14} />
          </span>
          <span
            className='text-base font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
            }}
          >
            {t('容器详情')}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={
        <div
          className='flex justify-between items-center'
          style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 0 0' }}
        >
          <Button
            icon={<IconRefresh />}
            onClick={handleRefresh}
            loading={loading || containersLoading}
            theme='borderless'
            style={{
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
            }}
          >
            {t('刷新')}
          </Button>
          <Button
            onClick={onCancel}
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-active)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
          >
            {t('关闭')}
          </Button>
        </div>
      }
      width={800}
      className='deployment-details-modal'
    >
      {loading && !details ? (
        <div className='flex items-center justify-center py-12'>
          <MacSpinner size='large' tip={t('加载详情中...')} />
        </div>
      ) : details ? (
        <div className='space-y-3 max-h-[600px] overflow-y-auto pr-1'>
          {/* Basic Info */}
          <PanelSection
            icon={<FaServer size={13} />}
            iconColor='var(--accent)'
            iconBg='var(--accent-light)'
            title={t('基本信息')}
          >
            <Descriptions
              data={[
                {
                  key: t('容器名称'),
                  value: (
                    <div className='flex items-center gap-2'>
                      <span
                        className='text-sm font-semibold'
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {details.deployment_name || details.id}
                      </span>
                      <button
                        className='w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150'
                        style={{ color: 'var(--text-muted)' }}
                        onClick={handleCopyId}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FaCopy size={11} />
                      </button>
                    </div>
                  ),
                },
                {
                  key: t('容器ID'),
                  value: (
                    <span
                      className='text-xs'
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {details.id}
                    </span>
                  ),
                },
                {
                  key: t('状态'),
                  value: (
                    <div className='flex items-center gap-2'>
                      <StatusDot color={statusConfig.color} />
                      <InlineBadge color={statusConfig.color} bg={statusConfig.bg}>
                        {t(statusConfig.text)}
                      </InlineBadge>
                    </div>
                  ),
                },
                {
                  key: t('创建时间'),
                  value: (
                    <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                      {timestamp2string(details.created_at)}
                    </span>
                  ),
                },
              ]}
            />
          </PanelSection>

          {/* Hardware & Performance */}
          <PanelSection
            icon={<FaChartLine size={13} />}
            iconColor='var(--success)'
            iconBg='var(--success-light)'
            title={t('硬件与性能')}
          >
            <div className='space-y-4'>
              <Descriptions
                data={[
                  {
                    key: t('硬件类型'),
                    value: (
                      <div className='flex items-center gap-2'>
                        <InlineBadge color='var(--accent)' bg='var(--accent-light)'>
                          {details.brand_name}
                        </InlineBadge>
                        <span
                          className='text-sm font-medium'
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {details.hardware_name}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: t('GPU数量'),
                    value: (
                      <div className='flex items-center gap-2'>
                        <InlineBadge color='var(--accent)' bg='var(--accent-light)' mono>
                          {details.total_gpus}
                        </InlineBadge>
                        <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                          {t('总计')} {details.total_gpus} {t('个GPU')}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: t('容器配置'),
                    value: (
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                          {t('每容器GPU数')}: <span style={{ fontFamily: 'var(--font-mono)' }}>{details.gpus_per_container}</span>
                        </span>
                        <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                          {t('容器总数')}: <span style={{ fontFamily: 'var(--font-mono)' }}>{details.total_containers}</span>
                        </span>
                      </div>
                    ),
                  },
                ]}
              />

              {/* Progress Bar */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span
                    className='text-sm font-medium'
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t('完成进度')}
                  </span>
                  <span
                    className='text-sm'
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {details.completed_percent}%
                  </span>
                </div>
                <Progress
                  percent={details.completed_percent}
                  status={
                    details.completed_percent === 100 ? 'success' : 'normal'
                  }
                  strokeWidth={8}
                  showInfo={false}
                />
                <div className='flex justify-between text-xs' style={{ color: 'var(--text-muted)' }}>
                  <span>
                    {t('已服务')}: <span style={{ fontFamily: 'var(--font-mono)' }}>{details.compute_minutes_served}</span> {t('分钟')}
                  </span>
                  <span>
                    {t('剩余')}: <span style={{ fontFamily: 'var(--font-mono)' }}>{details.compute_minutes_remaining}</span> {t('分钟')}
                  </span>
                </div>
              </div>
            </div>
          </PanelSection>

          {/* Container Configuration */}
          {details.container_config && (
            <PanelSection
              icon={<FaDocker size={13} />}
              iconColor='var(--accent)'
              iconBg='var(--accent-light)'
              title={t('容器配置')}
            >
              <div className='space-y-3'>
                <Descriptions
                  data={[
                    {
                      key: t('镜像地址'),
                      value: (
                        <span
                          className='text-xs break-all'
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {details.container_config.image_url || 'N/A'}
                        </span>
                      ),
                    },
                    {
                      key: t('流量端口'),
                      value: (
                        <span
                          className='text-sm'
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {details.container_config.traffic_port || 'N/A'}
                        </span>
                      ),
                    },
                    {
                      key: t('启动命令'),
                      value: (
                        <span
                          className='text-xs'
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {details.container_config.entrypoint
                            ? details.container_config.entrypoint.join(' ')
                            : 'N/A'}
                        </span>
                      ),
                    },
                  ]}
                />

                {/* Environment Variables */}
                {details.container_config.env_variables &&
                  Object.keys(details.container_config.env_variables).length >
                    0 && (
                    <div className='mt-3'>
                      <span
                        className='block mb-2 text-xs font-medium'
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {t('环境变量')}:
                      </span>
                      <div
                        className='p-3 rounded-[var(--radius-md)] max-h-32 overflow-y-auto'
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {Object.entries(
                          details.container_config.env_variables,
                        ).map(([key, value]) => (
                          <div
                            key={key}
                            className='flex gap-2 text-xs mb-1'
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            <span className='font-medium' style={{ color: 'var(--accent)' }}>
                              {key}=
                            </span>
                            <span className='break-all' style={{ color: 'var(--text-secondary)' }}>
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </PanelSection>
          )}

          {/* Containers List */}
          <PanelSection
            icon={<FaServer size={13} />}
            iconColor='#5856D6'
            iconBg='rgba(88, 86, 214, 0.12)'
            title={t('容器实例')}
          >
            {containersLoading ? (
              <div className='flex items-center justify-center py-6'>
                <MacSpinner tip={t('加载容器信息中...')} />
              </div>
            ) : containers.length === 0 ? (
              <Empty
                description={t('暂无容器信息')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className='space-y-2'>
                {containers.map((ctr) => (
                  <div
                    key={ctr.container_id}
                    className='rounded-[var(--radius-md)] p-3'
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <div className='flex flex-col gap-1'>
                        <span
                          className='text-xs font-medium'
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {ctr.container_id}
                        </span>
                        <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                          {t('设备')} {ctr.device_id || '--'} · {t('状态')}{' '}
                          {ctr.status || '--'}
                        </span>
                        <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                          {t('创建时间')}:{' '}
                          {ctr.created_at
                            ? timestamp2string(ctr.created_at)
                            : '--'}
                        </span>
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        <InlineBadge color='var(--accent)' bg='var(--accent-light)' mono>
                          {t('GPU/容器')}: {ctr.gpus_per_container ?? '--'}
                        </InlineBadge>
                        {ctr.public_url && (
                          <Tooltip content={ctr.public_url}>
                            <Button
                              icon={<FaLink />}
                              size='small'
                              theme='borderless'
                              onClick={() =>
                                window.open(
                                  ctr.public_url,
                                  '_blank',
                                  'noopener,noreferrer',
                                )
                              }
                              style={{
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--accent)',
                                fontSize: '12px',
                              }}
                            >
                              {t('访问容器')}
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {ctr.events && ctr.events.length > 0 && (
                      <div
                        className='mt-2 rounded-[var(--radius-sm)] p-2.5'
                        style={{
                          background: 'var(--surface)',
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
                          {ctr.events.map((event, index) => (
                            <div
                              key={`${ctr.container_id}-${event.time}-${index}`}
                              className='flex gap-3 text-xs'
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              <span className='min-w-[140px] flex-shrink-0' style={{ color: 'var(--text-muted)' }}>
                                {event.time
                                  ? timestamp2string(event.time)
                                  : '--'}
                              </span>
                              <span className='break-all flex-1' style={{ color: 'var(--text-secondary)' }}>
                                {event.message || '--'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </PanelSection>

          {/* Location Information */}
          {details.locations && details.locations.length > 0 && (
            <PanelSection
              icon={<FaMapMarkerAlt size={13} />}
              iconColor='var(--warning)'
              iconBg='var(--warning-light)'
              title={t('部署位置')}
            >
              <div className='flex flex-wrap gap-2'>
                {details.locations.map((location) => (
                  <InlineBadge
                    key={location.id}
                    color='var(--warning)'
                    bg='var(--warning-light)'
                  >
                    {location.name} ({location.iso2})
                  </InlineBadge>
                ))}
              </div>
            </PanelSection>
          )}

          {/* Cost Information */}
          <PanelSection
            icon={<FaMoneyBillWave size={13} />}
            iconColor='var(--success)'
            iconBg='var(--success-light)'
            title={t('费用信息')}
          >
            <div className='space-y-3'>
              <div
                className='flex items-center justify-between p-3 rounded-[var(--radius-md)]'
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>
                  {t('已支付金额')}
                </span>
                <span
                  className='text-base font-semibold'
                  style={{
                    color: 'var(--success)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  $
                  {details.amount_paid
                    ? details.amount_paid.toFixed(2)
                    : '0.00'}{' '}
                  USDC
                </span>
              </div>

              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div className='flex justify-between'>
                  <span style={{ color: 'var(--text-muted)' }}>{t('计费开始')}:</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {details.started_at
                      ? timestamp2string(details.started_at)
                      : 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span style={{ color: 'var(--text-muted)' }}>{t('预计结束')}:</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {details.finished_at
                      ? timestamp2string(details.finished_at)
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </PanelSection>

          {/* Time Information */}
          <PanelSection
            icon={<FaClock size={13} />}
            iconColor='var(--text-secondary)'
            iconBg='var(--surface-active)'
            title={t('时间信息')}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm' style={{ color: 'var(--text-muted)' }}>
                    {t('已运行时间')}:
                  </span>
                  <span
                    className='text-sm font-medium'
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {Math.floor(details.compute_minutes_served / 60)}h{' '}
                    {details.compute_minutes_served % 60}m
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm' style={{ color: 'var(--text-muted)' }}>
                    {t('剩余时间')}:
                  </span>
                  <span
                    className='text-sm font-medium'
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--warning)',
                    }}
                  >
                    {Math.floor(details.compute_minutes_remaining / 60)}h{' '}
                    {details.compute_minutes_remaining % 60}m
                  </span>
                </div>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm' style={{ color: 'var(--text-muted)' }}>
                    {t('创建时间')}:
                  </span>
                  <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                    {timestamp2string(details.created_at)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm' style={{ color: 'var(--text-muted)' }}>
                    {t('最后更新')}:
                  </span>
                  <span className='text-sm' style={{ color: 'var(--text-primary)' }}>
                    {timestamp2string(details.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </PanelSection>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('无法获取容器详情')}
        />
      )}
    </Modal>
  );
};

export default ViewDetailsModal;
