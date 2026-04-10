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

/**
 * PricingPage — full-width editorial layout matching the HTML mockup.
 *
 * NO sidebar. All filters live in the header as horizontal tabs/toggles.
 *
 * Structure:
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ Row 1: [blue label + big headline]         [search input]      │
 *   │ Row 2: Tab pills  [All Models] [tag1] [tag2] ...              │
 *   │ Row 3: PROVIDER [seg] │ MODALITY [seg] │ actions               │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │ 2-col card grid (or table view)                                │
 *   │ Pagination                                                     │
 *   └─────────────────────────────────────────────────────────────────┘
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ImagePreview, Switch, Select, Button } from '@douyinfe/semi-ui';
import { IconSearch, IconCopy, IconRefresh } from '@douyinfe/semi-icons';
import ModelDetailSideSheet from '../modal/ModelDetailSideSheet';
import PricingCardView from '../view/card/PricingCardView';
import PricingTable from '../view/table/PricingTable';
import { useModelPricingData } from '../../../../hooks/model-pricing/useModelPricingData';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { usePricingFilterCounts } from '../../../../hooks/model-pricing/usePricingFilterCounts';
import { resetPricingFilters } from '../../../../helpers/utils';

/* ─── Segmented pill toggle — matches mockup exactly:
   container: bg-surface-container-high rounded-xl p-1
   active:    bg-surface-container-lowest shadow-sm rounded-lg ─── */
const SegmentedPills = ({ items, value, onChange }) => (
  <div
    style={{
      display: 'inline-flex',
      padding: 4,
      background: 'var(--bg-muted)',
      borderRadius: 12,
      gap: 0,
      flexWrap: 'wrap',
    }}
  >
    {items.map((item) => {
      const active = value === item.value;
      return (
        <button
          key={item.value}
          type='button'
          onClick={() => onChange(item.value)}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 150ms',
            background: active ? 'var(--surface)' : 'transparent',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

/* ─── Tab pills row — matches mockup's All Models / Standard / Custom / ... ─── */
const TabPills = ({ items, value, onChange }) => (
  <nav
    className='flex items-center gap-2 overflow-x-auto pb-1'
    style={{ scrollbarWidth: 'none' }}
  >
    {items.map((item) => {
      const active = value === item.value;
      return (
        <button
          key={item.value}
          type='button'
          onClick={() => onChange(item.value)}
          style={{
            padding: '10px 20px',
            borderRadius: 9999,
            border: 'none',
            fontSize: 13,
            fontFamily: 'Manrope, var(--font-sans)',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 150ms',
            background: active ? 'var(--accent)' : 'var(--bg-subtle)',
            color: active ? '#fff' : 'var(--text-secondary)',
          }}
        >
          {item.label}
        </button>
      );
    })}
  </nav>
);

/* ═══════════════════════════════════════════════════════════
   Main page component
   ═══════════════════════════════════════════════════════════ */
const PricingPage = () => {
  const pricingData = useModelPricingData();
  const isMobile = useIsMobile();
  const [showRatio, setShowRatio] = useState(false);
  const [viewMode, setViewMode] = useState('card');

  const {
    models,
    filteredModels,
    loading,
    filterVendor,
    setFilterVendor,
    filterEndpointType,
    setFilterEndpointType,
    filterTag,
    setFilterTag,
    filterQuotaType,
    setFilterQuotaType,
    filterGroup,
    handleGroupClick,
    setFilterGroup,
    searchValue,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    usableGroup,
    groupRatio,
    selectedGroup,
    currency,
    setCurrency,
    siteDisplayType,
    tokenUnit,
    setTokenUnit,
    showWithRecharge,
    setShowWithRecharge,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    selectedRowKeys,
    setSelectedRowKeys,
    rowSelection,
    copyText,
    displayPrice,
    openModelDetail,
    t,
  } = pricingData;

  const allProps = {
    ...pricingData,
    showRatio,
    setShowRatio,
    viewMode,
    setViewMode,
  };

  // Tag pills for the tab row
  const tagItems = useMemo(() => {
    const allTags = new Set();
    models.forEach((m) => {
      (m.tags || []).forEach((tag) => allTags.add(tag));
    });
    return [
      { value: 'all', label: t('全部模型') },
      ...Array.from(allTags)
        .sort()
        .map((tag) => ({ value: tag, label: tag })),
    ];
  }, [models, t]);

  // Vendor pills — top 8
  const vendorItems = useMemo(() => {
    const vendors = new Set();
    models.forEach((m) => {
      if (m.vendor_name) vendors.add(m.vendor_name);
    });
    const sorted = Array.from(vendors).sort();
    return [
      { value: 'all', label: t('全部') },
      ...sorted.slice(0, 8).map((v) => ({ value: v, label: v })),
    ];
  }, [models, t]);

  // Endpoint type pills
  const endpointItems = useMemo(() => {
    const eps = new Set();
    models.forEach((m) => {
      (m.supported_endpoint_types || []).forEach((ep) => eps.add(ep));
    });
    return [
      { value: 'all', label: t('全部') },
      ...Array.from(eps)
        .sort()
        .map((ep) => ({ value: ep, label: ep })),
    ];
  }, [models, t]);

  const handleResetFilters = useCallback(
    () =>
      resetPricingFilters({
        handleChange,
        setShowWithRecharge,
        setCurrency,
        setShowRatio,
        setViewMode,
        setFilterGroup,
        setFilterQuotaType,
        setFilterEndpointType,
        setFilterVendor,
        setFilterTag,
        setCurrentPage,
        setTokenUnit,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const supportsCurrencyDisplay = siteDisplayType !== 'TOKENS';

  return (
    <div
      style={{
        background: 'var(--bg-base)',
        minHeight: '100%',
        flex: '1 0 auto',
      }}
    >
      <main
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: isMobile ? '20px 16px 32px' : '32px 28px 48px',
        }}
      >
        {/* ═══════════ HEADER ═══════════ */}
        <header style={{ marginBottom: isMobile ? 20 : 32 }}>
          {/* Row 1: label + headline + search */}
          <div
            className='flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8'
            style={{ marginBottom: isMobile ? 16 : 24 }}
          >
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                }}
              >
                {t('模型定价')}
              </span>
              <h1
                style={{
                  fontFamily: 'Manrope, var(--font-sans)',
                  fontSize: isMobile ? 32 : 44,
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  color: 'var(--text-primary)',
                  margin: '4px 0 0 0',
                  lineHeight: 1.1,
                }}
              >
                {t('模型列表')}
              </h1>
            </div>
            {/* Search — matches mockup: h-14, rounded-2xl, glass bg */}
            <div className='w-full md:w-96'>
              <div
                className='flex items-center gap-3'
                style={{
                  height: 56,
                  padding: '0 20px',
                  background:
                    'color-mix(in srgb, var(--bg-muted) 50%, transparent)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 16,
                  transition: 'background 200ms, box-shadow 200ms',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px -8px rgba(0,0,0,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background =
                    'color-mix(in srgb, var(--bg-muted) 50%, transparent)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <IconSearch style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type='text'
                  value={searchValue}
                  onChange={(e) => handleChange(e.target.value)}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder={t('搜索模型名称...')}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Tag tab pills */}
          <div style={{ marginBottom: isMobile ? 12 : 16 }}>
            <TabPills
              items={tagItems}
              value={filterTag}
              onChange={setFilterTag}
            />
          </div>

          {/* Row 3: Segmented filter toggles + actions */}
          {/* Matches mockup: bg-surface-container-lowest/40 backdrop-blur-md rounded-3xl */}
          <div
            className='flex flex-wrap items-center gap-4 md:gap-6'
            style={{
              padding: isMobile ? '12px 14px' : '16px 24px',
              background:
                'color-mix(in srgb, var(--surface) 40%, transparent)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 24,
            }}
          >
            {/* Provider */}
            <div className='flex items-center gap-3'>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {t('供应商')}
              </span>
              <SegmentedPills
                items={vendorItems}
                value={filterVendor}
                onChange={setFilterVendor}
              />
            </div>

            <div
              className='hidden md:block'
              style={{
                width: 1,
                height: 24,
                background: 'var(--border-subtle)',
                flexShrink: 0,
              }}
            />

            {/* Endpoint type */}
            <div className='flex items-center gap-3'>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {t('类型')}
              </span>
              <SegmentedPills
                items={endpointItems}
                value={filterEndpointType}
                onChange={setFilterEndpointType}
              />
            </div>

            <div style={{ flex: '1 1 0', minWidth: 0 }} />

            {/* Action buttons */}
            <div className='flex items-center gap-2 flex-wrap'>
              {selectedRowKeys.length > 0 && (
                <Button
                  size='small'
                  icon={<IconCopy />}
                  onClick={() => copyText(selectedRowKeys)}
                  style={{
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {t('复制')} ({selectedRowKeys.length})
                </Button>
              )}

              {!isMobile && supportsCurrencyDisplay && (
                <>
                  <div className='flex items-center gap-1.5'>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {t('充值价格')}
                    </span>
                    <Switch
                      size='small'
                      checked={showWithRecharge}
                      onChange={setShowWithRecharge}
                    />
                  </div>
                  {showWithRecharge && (
                    <Select
                      size='small'
                      value={currency}
                      onChange={setCurrency}
                      style={{ width: 80 }}
                      optionList={[
                        { value: 'USD', label: 'USD' },
                        { value: 'CNY', label: 'CNY' },
                        { value: 'CUSTOM', label: t('自定义') },
                      ]}
                    />
                  )}
                </>
              )}
              {!isMobile && (
                <>
                  <div className='flex items-center gap-1.5'>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {t('倍率')}
                    </span>
                    <Switch
                      size='small'
                      checked={showRatio}
                      onChange={setShowRatio}
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() =>
                      setViewMode(viewMode === 'table' ? 'card' : 'table')
                    }
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      background:
                        viewMode === 'table'
                          ? 'var(--accent)'
                          : 'var(--surface)',
                      color:
                        viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('表格')}
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      setTokenUnit(tokenUnit === 'K' ? 'M' : 'K')
                    }
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      background:
                        tokenUnit === 'K'
                          ? 'var(--accent)'
                          : 'var(--surface)',
                      color:
                        tokenUnit === 'K' ? '#fff' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {tokenUnit}
                  </button>
                </>
              )}
              <button
                type='button'
                onClick={handleResetFilters}
                style={{
                  padding: 6,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                title={t('重置筛选')}
              >
                <IconRefresh size='small' />
              </button>
            </div>
          </div>
        </header>

        {/* ═══════════ CONTENT ═══════════ */}
        {viewMode === 'card' ? (
          <PricingCardView
            filteredModels={filteredModels}
            loading={loading}
            rowSelection={rowSelection}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            selectedGroup={selectedGroup}
            groupRatio={groupRatio}
            copyText={copyText}
            setModalImageUrl={pricingData.setModalImageUrl}
            setIsModalOpenurl={pricingData.setIsModalOpenurl}
            currency={currency}
            siteDisplayType={siteDisplayType}
            tokenUnit={tokenUnit}
            displayPrice={displayPrice}
            showRatio={showRatio}
            selectedRowKeys={selectedRowKeys}
            setSelectedRowKeys={setSelectedRowKeys}
            openModelDetail={openModelDetail}
            t={t}
          />
        ) : (
          <PricingTable {...allProps} />
        )}
      </main>

      {/* Modals */}
      <ImagePreview
        src={pricingData.modalImageUrl}
        visible={pricingData.isModalOpenurl}
        onVisibleChange={(visible) => pricingData.setIsModalOpenurl(visible)}
      />
      <ModelDetailSideSheet
        visible={pricingData.showModelDetail}
        onClose={pricingData.closeModelDetail}
        modelData={pricingData.selectedModel}
        groupRatio={groupRatio}
        usableGroup={usableGroup}
        currency={currency}
        siteDisplayType={siteDisplayType}
        tokenUnit={tokenUnit}
        displayPrice={displayPrice}
        showRatio={showRatio}
        vendorsMap={pricingData.vendorsMap}
        endpointMap={pricingData.endpointMap}
        autoGroups={pricingData.autoGroups}
        t={t}
      />
    </div>
  );
};

export default PricingPage;
