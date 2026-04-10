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
import { Checkbox, Empty, Pagination, Tooltip } from '@douyinfe/semi-ui';
import {
  stringToColor,
  calculateModelPrice,
  getLobeHubIcon,
  getModelPriceItems,
} from '../../../../../helpers';
import PricingCardSkeleton from './PricingCardSkeleton';
import { useMinimumLoadingTime } from '../../../../../hooks/common/useMinimumLoadingTime';
import { useIsMobile } from '../../../../../hooks/common/useIsMobile';

/* ─── Model icon (unchanged from before) ─── */
const ModelIcon = ({ model, size = 44 }) => {
  const iconKey = model?.icon || model?.vendor_icon;
  if (iconKey) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        {getLobeHubIcon(iconKey, size - 16)}
      </span>
    );
  }
  const text = (model?.model_name || '?').slice(0, 2).toUpperCase();
  const c = stringToColor(model?.model_name || '');
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-lg)',
        background: `${c}18`,
        color: c,
        fontSize: size * 0.3,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${c}22`,
      }}
    >
      {text}
    </span>
  );
};

/* ─── Tag badge ─── */
const TagBadge = ({ children, color, bg, accent }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: 9999,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: accent ? 'var(--accent)' : color || 'var(--text-secondary)',
      background: accent
        ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
        : bg || 'var(--surface-active)',
      whiteSpace: 'nowrap',
      lineHeight: '18px',
      boxShadow: accent ? '0 0 16px rgba(0,114,255,0.12)' : 'none',
    }}
  >
    {children}
  </span>
);

/* ─── Price cell — large gradient number ─── */
const PriceCell = ({ label, value, suffix }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        lineHeight: 1,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontFamily: 'Manrope, var(--font-sans)',
        fontSize: 16,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1.2,
      }}
    >
      {value}
      {suffix && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            WebkitTextFillColor: 'var(--text-muted)',
            color: 'var(--text-muted)',
            marginLeft: 2,
          }}
        >
          {suffix}
        </span>
      )}
    </span>
  </div>
);

const CACHE_KEYS = new Set([
  'cache',
  'create-cache',
  'cache-ratio',
  'create-cache-ratio',
]);

/* ═══════════════════════════════════════════════════════════
   ModelCard — large vertical card matching the HTML mockup.
   2-col grid on desktop, 1-col on mobile.
   ═══════════════════════════════════════════════════════════ */
const ModelCard = ({
  model,
  isSelected,
  priceData,
  rowSelection,
  showRatio,
  openModelDetail,
  handleCheckboxChange,
  t,
}) => {
  const priceItems = priceData ? getModelPriceItems(priceData, t) : [];
  const inputPrice = priceItems.find(
    (i) => i.key === 'input' || i.key === 'prompt',
  );
  const outputPrice = priceItems.find(
    (i) => i.key === 'output' || i.key === 'completion',
  );
  const cachePrice = priceItems.find((i) => CACHE_KEYS.has(i.key));
  const tags = model.tags || [];

  return (
    <article
      onClick={() => openModelDetail?.(model)}
      className='group'
      style={{
        position: 'relative',
        background: isSelected ? 'var(--accent-light)' : 'var(--surface)',
        border: isSelected
          ? '1px solid var(--accent)'
          : '1px solid transparent',
        borderRadius: 16,
        padding: '18px 20px',
        cursor: 'pointer',
        transition:
          'box-shadow 400ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow =
            '0 24px 64px -16px rgba(0,0,0,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* ── Header: icon + name + badge ── */}
      <div
        className='flex justify-between items-start'
        style={{ marginBottom: 16 }}
      >
        <div className='flex gap-3 items-center min-w-0'>
          <ModelIcon model={model} size={44} />
          <div className='min-w-0'>
            <h3
              style={{
                fontFamily: 'Manrope, var(--font-sans)',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
                margin: '0 0 4px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {model.model_name}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {model.description ||
                (model.vendor_name ? model.vendor_name : '')}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2 flex-shrink-0 ml-3'>
          {model.quota_type === 1 && (
            <TagBadge color='#30B0C7' bg='rgba(48,176,199,0.10)'>
              {t('按次')}
            </TagBadge>
          )}
          {tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} accent>
              {tag}
            </TagBadge>
          ))}
        </div>
      </div>

      {/* ── Pricing grid — 3 cols ── */}
      <div
        className='grid gap-3'
        style={{
          gridTemplateColumns:
            cachePrice || showRatio
              ? 'repeat(3, minmax(0, 1fr))'
              : 'repeat(2, minmax(0, 1fr))',
          marginBottom: 16,
        }}
      >
        {inputPrice && (
          <PriceCell
            label={t('输入价格')}
            value={inputPrice.value}
            suffix={inputPrice.suffix}
          />
        )}
        {outputPrice && (
          <PriceCell
            label={t('输出价格')}
            value={outputPrice.value}
            suffix={outputPrice.suffix}
          />
        )}
        {cachePrice && (
          <PriceCell
            label={cachePrice.label}
            value={cachePrice.value}
            suffix={cachePrice.suffix}
          />
        )}
        {!cachePrice && showRatio && model.quota_type === 0 && (
          <PriceCell label={t('倍率')} value={`×${model.model_ratio}`} />
        )}
      </div>

      {/* ── Footer: status + action ── */}
      <div
        className='flex items-center justify-between'
        style={{
          paddingTop: 14,
          borderTop: '1px solid color-mix(in srgb, var(--border-default) 50%, transparent)',
        }}
      >
        <div className='flex items-center gap-2'>
          {(model.supported_endpoint_types || []).slice(0, 3).map((ep) => (
            <Tooltip key={ep} content={ep} position='top'>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-active)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {ep}
              </span>
            </Tooltip>
          ))}
          {showRatio && cachePrice && model.quota_type === 0 && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ×{model.model_ratio}
            </span>
          )}
        </div>
        <div className='flex items-center gap-3'>
          {rowSelection && (
            <Checkbox
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxChange(model, e.target.checked);
              }}
            />
          )}
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              openModelDetail?.(model);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 18px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--accent-gradient)',
              color: '#fff',
              fontFamily: 'Manrope, var(--font-sans)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 8px 20px -8px rgba(0,114,255,0.3)',
              transition:
                'transform 120ms ease-out, box-shadow 220ms cubic-bezier(0.22,1,0.36,1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow =
                '0 12px 28px -8px rgba(0,114,255,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow =
                '0 8px 20px -8px rgba(0,114,255,0.3)';
            }}
          >
            {t('查看详情')}
          </button>
        </div>
      </div>
    </article>
  );
};

/* ═══════════════════════════════════════════════════════════
   PricingCardView — 2-col grid + pagination
   ═══════════════════════════════════════════════════════════ */
const PricingCardView = ({
  filteredModels,
  loading,
  rowSelection,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  selectedGroup,
  groupRatio,
  copyText,
  setModalImageUrl,
  setIsModalOpenurl,
  currency,
  siteDisplayType,
  tokenUnit,
  displayPrice,
  showRatio,
  t,
  selectedRowKeys = [],
  setSelectedRowKeys,
  openModelDetail,
}) => {
  const showSkeleton = useMinimumLoadingTime(loading);
  const isMobile = useIsMobile();

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedModels = filteredModels.slice(
    startIndex,
    startIndex + pageSize,
  );
  const getModelKey = (m) => m.key ?? m.model_name ?? m.id;

  const handleCheckboxChange = (model, checked) => {
    if (!setSelectedRowKeys) return;
    const key = getModelKey(model);
    const newKeys = checked
      ? Array.from(new Set([...selectedRowKeys, key]))
      : selectedRowKeys.filter((k) => k !== key);
    setSelectedRowKeys(newKeys);
    rowSelection?.onChange?.(newKeys, null);
  };

  if (showSkeleton) {
    return (
      <PricingCardSkeleton
        rowSelection={!!rowSelection}
        showRatio={showRatio}
      />
    );
  }

  if (!filteredModels || filteredModels.length === 0) {
    return (
      <div className='flex justify-center items-center py-16'>
        <Empty
          image={
            <img
              src='/NoDataillustration.svg'
              alt=''
              style={{ width: 120, height: 120 }}
            />
          }
          darkModeImage={
            <img
              src='/NoDataillustration.svg'
              alt=''
              style={{ width: 120, height: 120 }}
            />
          }
          description={t('搜索无结果')}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '8px 12px' : '12px 20px' }}>
      {/* ── 2-col card grid ── */}
      <div
        className='grid gap-5'
        style={{
          gridTemplateColumns: isMobile
            ? '1fr'
            : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        {paginatedModels.map((model, index) => {
          const key = getModelKey(model);
          const isSelected = selectedRowKeys.includes(key);
          const priceData = calculateModelPrice({
            record: model,
            selectedGroup,
            groupRatio,
            tokenUnit,
            displayPrice,
            currency,
            quotaDisplayType: siteDisplayType,
          });

          return (
            <ModelCard
              key={key || index}
              model={model}
              isSelected={isSelected}
              priceData={priceData}
              rowSelection={rowSelection}
              showRatio={showRatio}
              openModelDetail={openModelDetail}
              handleCheckboxChange={handleCheckboxChange}
              t={t}
            />
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {filteredModels.length > 0 && (
        <div
          className='flex justify-center py-4'
          style={{
            marginTop: 16,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            total={filteredModels.length}
            showSizeChanger
            pageSizeOptions={[20, 50, 100, 200]}
            size={isMobile ? 'small' : 'default'}
            showQuickJumper={!isMobile}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PricingCardView;
