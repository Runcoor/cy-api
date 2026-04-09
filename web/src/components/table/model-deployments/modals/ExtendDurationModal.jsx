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
  Modal,
  Form,
  Button,
  Banner,
} from '@douyinfe/semi-ui';
import {
  FaClock,
  FaCalculator,
  FaInfoCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { API, showError, showSuccess } from '../../../../helpers';
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

const ExtendDurationModal = ({
  visible,
  onCancel,
  deployment,
  onSuccess,
  t,
}) => {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [durationHours, setDurationHours] = useState(1);
  const [costLoading, setCostLoading] = useState(false);
  const [priceEstimation, setPriceEstimation] = useState(null);
  const [priceError, setPriceError] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deploymentDetails, setDeploymentDetails] = useState(null);
  const costRequestIdRef = useRef(0);

  const resetState = () => {
    costRequestIdRef.current += 1;
    setDurationHours(1);
    setPriceEstimation(null);
    setPriceError(null);
    setDeploymentDetails(null);
    setCostLoading(false);
  };

  const fetchDeploymentDetails = async (deploymentId) => {
    setDetailsLoading(true);
    try {
      const response = await API.get(`/api/deployments/${deploymentId}`);
      if (response.data.success) {
        const details = response.data.data;
        setDeploymentDetails(details);
        setPriceError(null);
        return details;
      }

      const message = response.data.message || '';
      const errorMessage = t('获取详情失败') + (message ? `: ${message}` : '');
      showError(errorMessage);
      setDeploymentDetails(null);
      setPriceEstimation(null);
      setPriceError(errorMessage);
      return null;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || '';
      const errorMessage = t('获取详情失败') + (message ? `: ${message}` : '');
      showError(errorMessage);
      setDeploymentDetails(null);
      setPriceEstimation(null);
      setPriceError(errorMessage);
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const calculatePrice = async (hours, details) => {
    if (!visible || !details) return;

    const sanitizedHours = Number.isFinite(hours) ? Math.round(hours) : 0;
    if (sanitizedHours <= 0) {
      setPriceEstimation(null);
      setPriceError(null);
      return;
    }

    const hardwareId = Number(details?.hardware_id) || 0;
    const totalGPUs = Number(details?.total_gpus) || 0;
    const totalContainers = Number(details?.total_containers) || 0;
    const baseGpusPerContainer = Number(details?.gpus_per_container) || 0;
    const resolvedGpusPerContainer =
      baseGpusPerContainer > 0
        ? baseGpusPerContainer
        : totalContainers > 0 && totalGPUs > 0
          ? Math.max(1, Math.round(totalGPUs / totalContainers))
          : 0;
    const resolvedReplicaCount =
      totalContainers > 0
        ? totalContainers
        : resolvedGpusPerContainer > 0 && totalGPUs > 0
          ? Math.max(1, Math.round(totalGPUs / resolvedGpusPerContainer))
          : 0;
    const locationIds = Array.isArray(details?.locations)
      ? details.locations
          .map((location) =>
            Number(
              location?.id ?? location?.location_id ?? location?.locationId,
            ),
          )
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (
      hardwareId <= 0 ||
      resolvedGpusPerContainer <= 0 ||
      resolvedReplicaCount <= 0 ||
      locationIds.length === 0
    ) {
      setPriceEstimation(null);
      setPriceError(t('价格计算失败'));
      return;
    }

    const requestId = Date.now();
    costRequestIdRef.current = requestId;
    setCostLoading(true);
    setPriceError(null);

    const payload = {
      location_ids: locationIds,
      hardware_id: hardwareId,
      gpus_per_container: resolvedGpusPerContainer,
      duration_hours: sanitizedHours,
      replica_count: resolvedReplicaCount,
      currency: 'usdc',
      duration_type: 'hour',
      duration_qty: sanitizedHours,
      hardware_qty: resolvedGpusPerContainer,
    };

    try {
      const response = await API.post(
        '/api/deployments/price-estimation',
        payload,
      );

      if (costRequestIdRef.current !== requestId) return;

      if (response.data.success) {
        setPriceEstimation(response.data.data);
      } else {
        const message = response.data.message || '';
        setPriceEstimation(null);
        setPriceError(t('价格计算失败') + (message ? `: ${message}` : ''));
      }
    } catch (error) {
      if (costRequestIdRef.current !== requestId) return;

      const message = error?.response?.data?.message || error.message || '';
      setPriceEstimation(null);
      setPriceError(t('价格计算失败') + (message ? `: ${message}` : ''));
    } finally {
      if (costRequestIdRef.current === requestId) {
        setCostLoading(false);
      }
    }
  };

  useEffect(() => {
    if (visible && deployment?.id) {
      resetState();
      if (formRef.current) {
        formRef.current.setValue('duration_hours', 1);
      }
      fetchDeploymentDetails(deployment.id);
    }
    if (!visible) {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, deployment?.id]);

  useEffect(() => {
    if (!visible) return;
    if (!deploymentDetails) return;
    calculatePrice(durationHours, deploymentDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationHours, deploymentDetails, visible]);

  const handleExtend = async () => {
    try {
      if (formRef.current) {
        await formRef.current.validate();
      }
      setLoading(true);

      const response = await API.post(
        `/api/deployments/${deployment.id}/extend`,
        {
          duration_hours: Math.round(durationHours),
        },
      );

      if (response.data.success) {
        showSuccess(t('容器时长延长成功'));
        onSuccess?.(response.data.data);
        handleCancel();
      }
    } catch (error) {
      showError(
        t('延长时长失败') +
          ': ' +
          (error?.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    resetState();
    onCancel();
  };

  const currentRemainingTime = deployment?.time_remaining || '0分钟';
  const newTotalTime = `${currentRemainingTime} + ${durationHours}${t('小时')}`;

  const priceData = priceEstimation || {};
  const breakdown = priceData.price_breakdown || priceData.PriceBreakdown || {};
  const currencyLabel = (priceData.currency || priceData.Currency || 'USDC')
    .toString()
    .toUpperCase();

  const estimatedTotalCost =
    typeof priceData.estimated_cost === 'number'
      ? priceData.estimated_cost
      : typeof priceData.EstimatedCost === 'number'
        ? priceData.EstimatedCost
        : typeof breakdown.total_cost === 'number'
          ? breakdown.total_cost
          : breakdown.TotalCost;
  const hourlyRate =
    typeof breakdown.hourly_rate === 'number'
      ? breakdown.hourly_rate
      : breakdown.HourlyRate;
  const computeCost =
    typeof breakdown.compute_cost === 'number'
      ? breakdown.compute_cost
      : breakdown.ComputeCost;

  const resolvedHardwareName =
    deploymentDetails?.hardware_name || deployment?.hardware_name || '--';
  const gpuCount =
    deploymentDetails?.total_gpus || deployment?.hardware_quantity || 0;
  const containerCount = deploymentDetails?.total_containers || 0;

  /* ── Row helper for cost breakdown ── */
  const CostRow = ({ label, value, strong, color }) => (
    <div className='flex items-center justify-between'>
      <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span
        className={`text-sm ${strong ? 'font-semibold' : 'font-medium'}`}
        style={{
          fontFamily: 'var(--font-mono)',
          color: color || 'var(--text-primary)',
        }}
      >
        {value}
      </span>
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
            <FaClock size={14} />
          </span>
          <span
            className='text-base font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
            }}
          >
            {t('延长容器时长')}
          </span>
        </div>
      }
      visible={visible}
      onCancel={handleCancel}
      onOk={handleExtend}
      okText={t('确认延长')}
      cancelText={t('取消')}
      confirmLoading={loading}
      okButtonProps={{
        disabled:
          !deployment?.id ||
          detailsLoading ||
          !durationHours ||
          durationHours < 1,
        style: {
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-gradient)',
          color: '#fff',
          border: '1px solid transparent',
        },
      }}
      cancelButtonProps={{
        style: {
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-active)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
        },
      }}
      width={600}
      className='extend-duration-modal'
    >
      <div className='space-y-4'>
        {/* Deployment info panel */}
        <div
          className='rounded-[var(--radius-lg)] p-4'
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <span
                className='text-sm font-semibold block'
                style={{ color: 'var(--text-primary)' }}
              >
                {deployment?.container_name || deployment?.deployment_name}
              </span>
              <span
                className='text-xs mt-0.5 block'
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}
              >
                ID: {deployment?.id}
              </span>
            </div>
            <div className='text-right'>
              <div className='mb-1'>
                <InlineBadge color='var(--accent)' bg='var(--accent-light)'>
                  {resolvedHardwareName}
                  {gpuCount ? ` x${gpuCount}` : ''}
                </InlineBadge>
              </div>
              <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                {t('当前剩余')}:{' '}
                <span className='font-medium' style={{ color: 'var(--text-primary)' }}>
                  {currentRemainingTime}
                </span>
              </span>
            </div>
          </div>
        </div>

        <Banner
          type='warning'
          icon={<FaExclamationTriangle />}
          title={t('重要提醒')}
          description={
            <div className='space-y-2'>
              <p>
                {t('延长容器时长将会产生额外费用，请确认您有足够的账户余额。')}
              </p>
              <p>{t('延长操作一旦确认无法撤销，费用将立即扣除。')}</p>
            </div>
          }
        />

        <Form
          getFormApi={(api) => (formRef.current = api)}
          layout='vertical'
          onValueChange={(values) => {
            if (values.duration_hours !== undefined) {
              const numericValue = Number(values.duration_hours);
              setDurationHours(
                Number.isFinite(numericValue) ? numericValue : 0,
              );
            }
          }}
        >
          <Form.InputNumber
            field='duration_hours'
            label={t('延长时长（小时）')}
            placeholder={t('请输入要延长的小时数')}
            min={1}
            max={720}
            step={1}
            initValue={1}
            style={{ width: '100%' }}
            suffix={t('小时')}
            rules={[
              { required: true, message: t('请输入延长时长') },
              {
                type: 'number',
                min: 1,
                message: t('延长时长至少为1小时'),
              },
              {
                type: 'number',
                max: 720,
                message: t('延长时长不能超过720小时（30天）'),
              },
            ]}
          />
        </Form>

        {/* Quick select */}
        <div className='space-y-2'>
          <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
            {t('快速选择')}:
          </span>
          <div className='flex flex-wrap gap-1.5'>
            {[1, 2, 6, 12, 24, 48, 72, 168].map((hours) => (
              <Button
                key={hours}
                size='small'
                theme={durationHours === hours ? 'solid' : 'borderless'}
                type={durationHours === hours ? 'primary' : 'secondary'}
                onClick={() => {
                  setDurationHours(hours);
                  if (formRef.current) {
                    formRef.current.setValue('duration_hours', hours);
                  }
                }}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  ...(durationHours === hours
                    ? { background: 'var(--accent-gradient)', color: '#fff' }
                    : { border: '1px solid var(--border-default)' }),
                }}
              >
                {hours < 24
                  ? `${hours}${t('小时')}`
                  : `${hours / 24}${t('天')}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* Cost estimation panel */}
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
                background: 'var(--success-light)',
                color: 'var(--success)',
              }}
            >
              <FaCalculator size={12} />
            </span>
            <span
              className='text-sm font-semibold'
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
              }}
            >
              {t('费用预估')}
            </span>
          </div>
          <div className='px-4 py-3'>
            {priceEstimation ? (
              <div className='space-y-2.5'>
                <CostRow label={t('延长时长') + ':'} value={`${Math.round(durationHours)} ${t('小时')}`} />
                <CostRow label={t('硬件配置') + ':'} value={`${resolvedHardwareName}${gpuCount ? ` x${gpuCount}` : ''}`} />
                {containerCount ? (
                  <CostRow label={t('容器数量') + ':'} value={String(containerCount)} />
                ) : null}
                <CostRow
                  label={t('单GPU小时费率') + ':'}
                  value={typeof hourlyRate === 'number' ? `${hourlyRate.toFixed(4)} ${currencyLabel}` : '--'}
                />
                {typeof computeCost === 'number' && (
                  <CostRow
                    label={t('计算成本') + ':'}
                    value={`${computeCost.toFixed(4)} ${currencyLabel}`}
                  />
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

                <div className='flex items-center justify-between'>
                  <span
                    className='text-base font-semibold'
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t('预估总费用')}:
                  </span>
                  <span
                    className='text-base font-semibold'
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--success)',
                    }}
                  >
                    {typeof estimatedTotalCost === 'number'
                      ? `${estimatedTotalCost.toFixed(4)} ${currencyLabel}`
                      : '--'}
                  </span>
                </div>

                <div
                  className='p-3 rounded-[var(--radius-md)]'
                  style={{
                    background: 'var(--accent-light)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className='flex items-start gap-2'>
                    <FaInfoCircle className='mt-0.5 flex-shrink-0' size={12} style={{ color: 'var(--accent)' }} />
                    <div className='space-y-0.5'>
                      <span className='text-xs block' style={{ color: 'var(--text-secondary)' }}>
                        {t('延长后总时长')}:{' '}
                        <span className='font-medium' style={{ color: 'var(--text-primary)' }}>
                          {newTotalTime}
                        </span>
                      </span>
                      <span className='text-xs block' style={{ color: 'var(--text-muted)' }}>
                        {t('预估费用仅供参考，实际费用可能略有差异')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center py-4'>
                {costLoading ? (
                  <div className='flex items-center justify-center gap-2'>
                    <MacSpinner size='small' />
                    <span className='text-sm' style={{ color: 'var(--text-muted)' }}>
                      {t('计算费用中...')}
                    </span>
                  </div>
                ) : priceError ? (
                  <span className='text-sm' style={{ color: 'var(--error)' }}>
                    {priceError}
                  </span>
                ) : deploymentDetails ? (
                  <span className='text-sm' style={{ color: 'var(--text-muted)' }}>
                    {t('请输入延长时长')}
                  </span>
                ) : (
                  <span className='text-sm' style={{ color: 'var(--text-muted)' }}>
                    {t('加载详情中...')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Warning banner */}
        <div
          className='rounded-[var(--radius-md)] p-3'
          style={{
            background: 'var(--error-light)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className='flex items-start gap-2'>
            <FaExclamationTriangle className='mt-0.5 flex-shrink-0' size={12} style={{ color: 'var(--error)' }} />
            <div>
              <span
                className='text-sm font-medium block'
                style={{ color: 'var(--error)' }}
              >
                {t('确认延长容器时长')}
              </span>
              <span className='text-xs block mt-0.5' style={{ color: 'var(--error)' }}>
                {t('点击"确认延长"后将立即扣除费用并延长容器运行时间')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExtendDurationModal;
