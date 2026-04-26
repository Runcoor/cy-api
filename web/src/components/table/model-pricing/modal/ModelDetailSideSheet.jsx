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
import { SideSheet, Toast } from '@douyinfe/semi-ui';
import {
  calculateModelPrice,
  getModelPriceItems,
  getLobeHubIcon,
  stringToColor,
  copy,
} from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  ModelDetailDrawerStyles,
  MdIcons as I,
} from '../_shared/ModelDetailDrawerStyles';

const ProviderAvatar = ({ modelData }) => {
  if (modelData?.icon) {
    return (
      <div className='md-head-avatar'>{getLobeHubIcon(modelData.icon, 32)}</div>
    );
  }
  if (modelData?.vendor_icon) {
    return (
      <div className='md-head-avatar'>
        {getLobeHubIcon(modelData.vendor_icon, 32)}
      </div>
    );
  }
  const text = (modelData?.model_name || 'AI').slice(0, 2).toUpperCase();
  const color = stringToColor(modelData?.model_name || 'AI');
  return (
    <div
      className='md-head-avatar fallback'
      style={{ background: `${color}1F`, color }}
    >
      {text}
    </div>
  );
};

const BasicInfoCard = ({ modelData, t }) => {
  const desc =
    modelData?.description ||
    (modelData?.vendor_description
      ? `${t('供应商信息：')}${modelData.vendor_description}`
      : '');
  const tags = (modelData?.tags || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className='md-card'>
      <div className='md-card-head'>
        <div className='md-card-icon blue'>
          <I.Info />
        </div>
        <div className='md-card-text'>
          <div className='md-card-title'>{t('基本信息')}</div>
          <div className='md-card-sub'>{t('模型的详细描述和基本特性')}</div>
        </div>
      </div>
      <p className={`md-desc ${desc ? '' : 'empty'}`}>
        {desc || t('暂无模型描述')}
      </p>
      {tags.length > 0 && (
        <div className='md-tags'>
          {tags.map((tag) => {
            const c = stringToColor(tag);
            return (
              <span
                key={tag}
                className='md-tag'
                style={{ background: `${c}1F`, color: c }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EndpointsCard = ({ modelData, endpointMap, t }) => {
  const types = modelData?.supported_endpoint_types || [];
  const rows = types.map((type) => {
    const info = (endpointMap || {})[type] || {};
    let path = info.path || '';
    if (path.includes('{model}')) {
      path = path.replaceAll(
        '{model}',
        modelData?.model_name || modelData?.modelName || '',
      );
    }
    return { type, path, method: info.method || 'POST' };
  });

  return (
    <div className='md-card'>
      <div className='md-card-head'>
        <div className='md-card-icon purple'>
          <I.Link />
        </div>
        <div className='md-card-text'>
          <div className='md-card-title'>{t('API端点')}</div>
          <div className='md-card-sub'>{t('模型支持的接口端点信息')}</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className='md-empty'>{t('暂无端点信息')}</div>
      ) : (
        rows.map((r) => (
          <div key={r.type} className='md-endpoint'>
            <span className='md-endpoint-dot' />
            <span className='md-endpoint-prov'>
              {r.type}
              {r.path ? '：' : ''}
            </span>
            <span className='md-endpoint-path'>{r.path}</span>
            {r.path && <span className='md-endpoint-method'>{r.method}</span>}
          </div>
        ))
      )}
    </div>
  );
};

const PricingCard = ({
  modelData,
  groupRatio,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  usableGroup,
  autoGroups,
  t,
}) => {
  const modelEnableGroups = Array.isArray(modelData?.enable_groups)
    ? modelData.enable_groups
    : [];
  const autoChain = (autoGroups || []).filter((g) =>
    modelEnableGroups.includes(g),
  );

  const availableGroups = Object.keys(usableGroup || {})
    .filter((g) => g !== '')
    .filter((g) => g !== 'auto')
    .filter((g) => modelEnableGroups.includes(g));

  const billingClass = (text) => {
    if (text === t('按量计费')) return 'usage';
    if (text === t('按次计费')) return 'percall';
    return 'muted';
  };

  return (
    <div className='md-card'>
      <div className='md-card-head'>
        <div className='md-card-icon amber'>
          <I.Coins />
        </div>
        <div className='md-card-text'>
          <div className='md-card-title'>{t('分组价格')}</div>
          <div className='md-card-sub'>{t('不同用户分组的价格信息')}</div>
        </div>
      </div>

      {autoChain.length > 0 && (
        <div className='md-route'>
          <span>{t('auto分组调用链路')}</span>
          <span className='md-route-arrow'>→</span>
          {autoChain.map((g, idx) => (
            <React.Fragment key={g}>
              <span className='md-route-chip'>
                {g}
                {t('分组')}
              </span>
              {idx < autoChain.length - 1 && (
                <span className='md-route-arrow'>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className='md-table'>
        <div className='md-table-head'>
          <div>{t('分组')}</div>
          <div>{showRatio ? t('倍率') : t('计费类型')}</div>
          <div>
            {siteDisplayType === 'TOKENS' ? t('计费摘要') : t('价格摘要')}
          </div>
        </div>
        {availableGroups.length === 0 && (
          <div className='md-table-row'>
            <div className='md-empty' style={{ gridColumn: '1 / -1' }}>
              {t('暂无可用分组')}
            </div>
          </div>
        )}
        {availableGroups.map((group) => {
          const priceData = calculateModelPrice({
            record: modelData,
            selectedGroup: group,
            groupRatio,
            tokenUnit,
            displayPrice,
            currency,
            quotaDisplayType: siteDisplayType,
          });
          const ratio = (groupRatio && groupRatio[group]) || 1;
          const billingText =
            modelData?.quota_type === 0
              ? t('按量计费')
              : modelData?.quota_type === 1
                ? t('按次计费')
                : '-';
          const items = getModelPriceItems(priceData, t, siteDisplayType);
          return (
            <div key={group} className='md-table-row'>
              <div>
                <span className='md-group-pill'>
                  {group}
                  {t('分组')}
                </span>
              </div>
              <div>
                {showRatio ? (
                  <span className='md-ratio-pill'>{ratio}x</span>
                ) : (
                  <span
                    className={`md-billing-pill ${billingClass(billingText)}`}
                  >
                    {billingText}
                  </span>
                )}
              </div>
              <div className='md-price-cell'>
                {items.map((item) => (
                  <div key={item.key} className='md-price-line'>
                    {item.label && (
                      <span className='md-price-label'>{item.label}</span>
                    )}
                    <span className='md-price-val'>{item.value}</span>
                    {item.suffix && (
                      <span className='md-price-unit'>{item.suffix}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ModelDetailSideSheet = ({
  visible,
  onClose,
  modelData,
  groupRatio,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  usableGroup,
  endpointMap,
  autoGroups,
  t,
}) => {
  const isMobile = useIsMobile();

  const handleCopy = async () => {
    const ok = await copy(modelData?.model_name || '');
    if (ok) Toast.success({ content: t('已复制模型名称') });
  };

  return (
    <SideSheet
      placement='right'
      visible={visible}
      width={isMobile ? '100%' : 580}
      onCancel={onClose}
      closable={false}
      headerStyle={{ display: 'none' }}
      bodyStyle={{ padding: 0, height: '100%' }}
      style={{ borderRadius: 0 }}
      className='md-detail-sheet'
      mask
    >
      <ModelDetailDrawerStyles />
      <div className='md-root'>
        <div className='md-head'>
          <ProviderAvatar modelData={modelData} />
          <div className='md-head-name'>
            <span title={modelData?.model_name}>
              {modelData?.model_name || t('未知模型')}
            </span>
            {modelData?.model_name && (
              <button
                type='button'
                className='md-copy'
                onClick={handleCopy}
                title={t('复制')}
              >
                <I.Copy />
              </button>
            )}
          </div>
          <button
            type='button'
            className='md-close'
            onClick={onClose}
            aria-label={t('关闭')}
          >
            <I.Close />
          </button>
        </div>
        <div className='md-body'>
          {!modelData ? (
            <div className='md-loading'>{t('加载中...')}</div>
          ) : (
            <>
              <BasicInfoCard modelData={modelData} t={t} />
              <EndpointsCard
                modelData={modelData}
                endpointMap={endpointMap}
                t={t}
              />
              <PricingCard
                modelData={modelData}
                groupRatio={groupRatio}
                currency={currency}
                siteDisplayType={siteDisplayType}
                tokenUnit={tokenUnit}
                displayPrice={displayPrice}
                showRatio={showRatio}
                usableGroup={usableGroup}
                autoGroups={autoGroups}
                t={t}
              />
            </>
          )}
        </div>
      </div>
    </SideSheet>
  );
};

export default ModelDetailSideSheet;
