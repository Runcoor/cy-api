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
 * PricingPage — clean compact model list designed in Claude Design
 * (handoff bundle "aggre-token", file "Model List.html").
 *
 * Single accent gradient `#0072ff → #00c6ff`. Three view modes
 * (列表 / 卡片 / 表格), three chip filter rows (类型 / 能力 / 提供商),
 * floating selection bar, detail drawer.
 *
 * Data, search, filtering, currency, displayPrice all reuse the
 * existing useModelPricingData hook so behaviour stays consistent
 * with the rest of the dashboard.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ImagePreview } from '@douyinfe/semi-ui';
import {
  calculateModelPrice,
  getLobeHubIcon,
  stringToColor,
} from '../../../../helpers';
import ModelDetailSideSheet from '../modal/ModelDetailSideSheet';
import { useModelPricingData } from '../../../../hooks/model-pricing/useModelPricingData';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';

/* ─── Inline icons ─── */
const Icon = {
  Search: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      {...p}
    >
      <circle cx='11' cy='11' r='7' />
      <path d='m20 20-3.5-3.5' />
    </svg>
  ),
  Refresh: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='M21 12a9 9 0 1 1-3-6.7L21 8' />
      <path d='M21 3v5h-5' />
    </svg>
  ),
  Check: (p) => (
    <svg
      width='10'
      height='10'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='3.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='m4 12 5 5L20 6' />
    </svg>
  ),
  Arrow: (p) => (
    <svg
      width='11'
      height='11'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.4'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M5 12h14' />
      <path d='m13 6 6 6-6 6' />
    </svg>
  ),
  Chevron: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='m6 9 6 6 6-6' />
    </svg>
  ),
  ListV: (p) => (
    <svg
      width='13'
      height='13'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      {...p}
    >
      <path d='M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' />
    </svg>
  ),
  Cards: (p) => (
    <svg
      width='13'
      height='13'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      {...p}
    >
      <rect x='3' y='3' width='8' height='8' rx='1.5' />
      <rect x='13' y='3' width='8' height='8' rx='1.5' />
      <rect x='3' y='13' width='8' height='8' rx='1.5' />
      <rect x='13' y='13' width='8' height='8' rx='1.5' />
    </svg>
  ),
  Table: (p) => (
    <svg
      width='13'
      height='13'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      {...p}
    >
      <rect x='3' y='4' width='18' height='16' rx='2' />
      <path d='M3 10h18M3 15h18M9 4v16' />
    </svg>
  ),
};

/* ─── Provider avatar — uses LobeHub icon if available, else colored initials ─── */
function ProviderAvatar({ model, size = 36 }) {
  const iconKey = model?.icon || model?.vendor_icon;
  if (iconKey) {
    return (
      <span
        className='aml-avatar'
        style={{
          width: size,
          height: size,
          background: 'var(--aml-line-soft)',
          borderRadius: 10,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
          overflow: 'hidden',
        }}
      >
        {getLobeHubIcon(iconKey, Math.floor(size * 0.55))}
      </span>
    );
  }
  const text = (model?.model_name || '?').slice(0, 2).toUpperCase();
  const c = stringToColor(model?.model_name || '');
  return (
    <span
      className='aml-avatar'
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: `${c}1f`,
        color: c,
        fontSize: Math.floor(size * 0.32),
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        border: `1px solid ${c}33`,
      }}
    >
      {text}
    </span>
  );
}

/* ─── Price cell ─── */
function PriceCell({ label, value, t }) {
  if (value == null || value === '') {
    return (
      <div className='aml-price-cell muted'>
        <div className='label'>{label}</div>
        <div className='value mono'>—</div>
      </div>
    );
  }
  return (
    <div className='aml-price-cell'>
      <div className='label'>{label}</div>
      <div className='value mono'>
        {value}
        <span className='unit'> /1M</span>
      </div>
    </div>
  );
}

/* Per-call pill — used when a model is billed by request (quota_type === 1).
   In list/card layouts it spans the three input/output/cache columns. */
function PerCallPriceCell({ value, t, span }) {
  return (
    <div
      className='aml-price-cell percall'
      style={span ? { gridColumn: `span ${span}` } : undefined}
    >
      <div className='label'>{t('按次计费')}</div>
      <div className='value mono'>
        {value || '—'}
        <span className='unit'> / {t('次')}</span>
      </div>
    </div>
  );
}

/* Render the right set of price cells for a model based on quota_type. */
function PriceCells({ m, layout, t }) {
  if (m.quota_type === 1) {
    return <PerCallPriceCell value={m._input} t={t} span={3} />;
  }
  if (layout === 'card') {
    return (
      <>
        <PriceCell label={t('输入')} value={m._input} t={t} />
        <PriceCell label={t('输出')} value={m._output} t={t} />
        <PriceCell label={t('缓存')} value={m._cache} t={t} />
      </>
    );
  }
  return (
    <>
      <PriceCell label={t('输入')} value={m._input} t={t} />
      <PriceCell label={t('输出')} value={m._output} t={t} />
      <div className='aml-cache-cell' style={{ display: 'contents' }}>
        <PriceCell label={t('缓存读取')} value={m._cache} t={t} />
      </div>
    </>
  );
}

/* ─── Chip ─── */
function Chip({ active, onClick, children, count }) {
  return (
    <button
      type='button'
      className={`aml-chip ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
      {count != null && <span className='aml-chip-count'>{count}</span>}
    </button>
  );
}

/* ─── Toggle ─── */
function Toggle({ on, onChange, label }) {
  return (
    <div
      className={`aml-toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span>{label}</span>
      <span className='switch' />
    </div>
  );
}

/* ─── List row ─── */
function ListRow({ m, selected, onToggleSelect, onView, t }) {
  const tags = parseTags(m.tags);
  return (
    <div className={`aml-row ${selected ? 'selected' : ''}`}>
      <ProviderAvatar model={m} />
      <div className='aml-model-info'>
        <div className='aml-model-name'>
          {m.model_name}
          {m.vendor_name && <span className='aml-pill'>{m.vendor_name}</span>}
        </div>
        <div className='aml-model-desc'>{m.description || '—'}</div>
      </div>
      <PriceCells m={m} layout='list' t={t} />
      <div className='aml-tag-cell'>
        {tags.slice(0, 2).map((tg) => (
          <span key={tg} className='aml-tag'>
            {tg}
          </span>
        ))}
      </div>
      <div className='aml-row-actions'>
        <button
          type='button'
          className={`aml-checkbox ${selected ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(m.model_name);
          }}
          aria-label={t('选择')}
        >
          <Icon.Check />
        </button>
        <button
          type='button'
          className='aml-btn-primary'
          onClick={() => onView(m)}
        >
          {t('查看详情')} <Icon.Arrow />
        </button>
      </div>
    </div>
  );
}

/* ─── Card item ─── */
function CardItem({ m, selected, onToggleSelect, onView, t }) {
  const tags = parseTags(m.tags);
  return (
    <div className='aml-card-item'>
      <div className='aml-card-head'>
        <ProviderAvatar model={m} />
        <div className='info'>
          <div className='name'>{m.model_name}</div>
          <div className='desc'>{m.description || '—'}</div>
        </div>
        <button
          type='button'
          className={`aml-checkbox ${selected ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(m.model_name);
          }}
        >
          <Icon.Check />
        </button>
      </div>
      <div className='aml-card-prices'>
        <PriceCells m={m} layout='card' t={t} />
      </div>
      <div className='aml-card-foot'>
        <div className='left'>
          {(m.supported_endpoint_types || []).slice(0, 1).map((ep) => (
            <span key={ep} className='aml-tag alt'>
              {ep}
            </span>
          ))}
          {tags.slice(0, 3).map((tg) => (
            <span key={tg} className='aml-tag'>
              {tg}
            </span>
          ))}
        </div>
        <button
          type='button'
          className='aml-btn-primary'
          onClick={() => onView(m)}
        >
          {t('详情')} <Icon.Arrow />
        </button>
      </div>
    </div>
  );
}

/* ─── Table view ─── */
function TableView({ items, selected, onToggleSelect, onView, t }) {
  return (
    <div className='aml-table-wrap'>
      <table className='aml-table'>
        <thead>
          <tr>
            <th style={{ width: 32 }}></th>
            <th>{t('模型')}</th>
            <th>{t('提供商')}</th>
            <th className='num'>{t('输入')} /1M</th>
            <th className='num'>{t('输出')} /1M</th>
            <th className='num'>{t('缓存')} /1M</th>
            <th>{t('能力')}</th>
            <th style={{ width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => {
            const tags = parseTags(m.tags);
            const isSel = selected.has(m.model_name);
            return (
              <tr key={m.model_name} className={isSel ? 'selected' : ''}>
                <td>
                  <button
                    type='button'
                    className={`aml-checkbox ${isSel ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(m.model_name);
                    }}
                  >
                    <Icon.Check />
                  </button>
                </td>
                <td>
                  <div className='aml-name-cell'>
                    <ProviderAvatar model={m} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{m.model_name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--aml-ink-400)',
                          marginTop: 2,
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.description || '—'}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className='aml-pill'>{m.vendor_name || '—'}</span>
                </td>
                {m.quota_type === 1 ? (
                  <td colSpan={3} className='num grad-num mono'>
                    {m._input || '—'} / {t('次')}
                  </td>
                ) : (
                  <>
                    <td className='num grad-num mono'>{m._input || '—'}</td>
                    <td className='num grad-num mono'>{m._output || '—'}</td>
                    <td className='num grad-num mono'>{m._cache || '—'}</td>
                  </>
                )}
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tags.slice(0, 3).map((tg) => (
                      <span key={tg} className='aml-tag'>
                        {tg}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button
                    type='button'
                    className='aml-btn-primary'
                    onClick={() => onView(m)}
                  >
                    {t('详情')}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── parse tags helper ─── */
function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return String(raw)
    .split(/[,;|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════════ */
const PricingPage = () => {
  const pricingData = useModelPricingData();
  const isMobile = useIsMobile();

  const {
    models,
    filteredModels,
    loading,
    filterEndpointType,
    setFilterEndpointType,
    filterTag,
    setFilterTag,
    filterVendor,
    setFilterVendor,
    searchValue,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    groupRatio,
    selectedGroup,
    currency,
    setCurrency,
    siteDisplayType,
    tokenUnit,
    showWithRecharge,
    setShowWithRecharge,
    displayPrice,
    refresh,
    openModelDetail,
    selectedRowKeys,
    setSelectedRowKeys,
    t,
  } = pricingData;

  const [view, setView] = useState('cards');
  const [sortBy, setSortBy] = useState('default');

  // Compute prices for the visible models so we can sort/render uniformly.
  const itemsWithPrices = useMemo(() => {
    return filteredModels.map((m) => {
      const price = calculateModelPrice({
        record: m,
        selectedGroup,
        groupRatio,
        tokenUnit,
        displayPrice,
        currency,
        quotaDisplayType: siteDisplayType,
      });
      return {
        ...m,
        _input: price.inputPrice ?? price.price ?? null,
        _output: price.completionPrice ?? null,
        _cache: price.cachePrice ?? null,
        _inputNumeric: price.isPerToken
          ? extractNumeric(price.inputPrice)
          : extractNumeric(price.price),
      };
    });
  }, [
    filteredModels,
    selectedGroup,
    groupRatio,
    tokenUnit,
    displayPrice,
    currency,
    siteDisplayType,
  ]);

  const sortedItems = useMemo(() => {
    if (sortBy === 'default') return itemsWithPrices;
    const arr = [...itemsWithPrices];
    if (sortBy === 'price-asc') {
      arr.sort(
        (a, b) => (a._inputNumeric ?? Infinity) - (b._inputNumeric ?? Infinity),
      );
    } else if (sortBy === 'price-desc') {
      arr.sort(
        (a, b) =>
          (b._inputNumeric ?? -Infinity) - (a._inputNumeric ?? -Infinity),
      );
    } else if (sortBy === 'name') {
      arr.sort((a, b) =>
        (a.model_name || '').localeCompare(b.model_name || ''),
      );
    }
    return arr;
  }, [itemsWithPrices, sortBy]);

  // Selection wired into the existing selectedRowKeys.
  const selected = useMemo(() => new Set(selectedRowKeys), [selectedRowKeys]);
  const toggleSelect = (key) => {
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return Array.from(next);
    });
  };
  const clearSelection = () => setSelectedRowKeys([]);

  // Counts + chip option lists derived from full models (not filtered) so chips don't disappear.
  const { tagOpts, providerOpts, endpointOpts, counts } = useMemo(() => {
    const tagCount = {};
    const provCount = {};
    const epCount = {};
    models.forEach((m) => {
      parseTags(m.tags).forEach((tg) => {
        tagCount[tg] = (tagCount[tg] || 0) + 1;
      });
      if (m.vendor_name) {
        provCount[m.vendor_name] = (provCount[m.vendor_name] || 0) + 1;
      }
      (m.supported_endpoint_types || []).forEach((ep) => {
        epCount[ep] = (epCount[ep] || 0) + 1;
      });
    });
    return {
      tagOpts: ['all', ...Object.keys(tagCount).sort()],
      providerOpts: ['all', ...Object.keys(provCount).sort()],
      endpointOpts: ['all', ...Object.keys(epCount).sort()],
      counts: { tagCount, provCount, epCount },
    };
  }, [models]);

  const supportsCurrencyDisplay = siteDisplayType !== 'TOKENS';

  return (
    <div className='aml-root'>
      <style>{PAGE_CSS}</style>

      <div className='aml-page'>
        {/* HEADER */}
        <header className='aml-header'>
          <div className='aml-title-block'>
            <div className='eyebrow'>{t('模型定价 · Aggre Token')}</div>
            <h1>{t('模型列表')}</h1>
            <div className='sub'>
              {t(
                '统一接入 {{count}} 个主流模型，按使用量计费，毫秒级路由切换。',
                {
                  count: models.length,
                },
              )}
            </div>
          </div>
          <div className='aml-header-tools'>
            <div className='aml-search'>
              <Icon.Search />
              <input
                placeholder={t('搜索模型名称或能力…')}
                value={searchValue}
                onChange={(e) => handleChange(e.target.value)}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
              />
            </div>
            <div className='aml-view-toggle' role='tablist'>
              <button
                type='button'
                className={view === 'list' ? 'active' : ''}
                onClick={() => setView('list')}
              >
                <Icon.ListV /> {t('列表')}
              </button>
              <button
                type='button'
                className={view === 'cards' ? 'active' : ''}
                onClick={() => setView('cards')}
              >
                <Icon.Cards /> {t('卡片')}
              </button>
              <button
                type='button'
                className={view === 'table' ? 'active' : ''}
                onClick={() => setView('table')}
              >
                <Icon.Table /> {t('表格')}
              </button>
            </div>
            <button
              type='button'
              className='aml-icon-btn'
              title={t('刷新')}
              onClick={refresh}
            >
              <Icon.Refresh />
            </button>
          </div>
        </header>

        {/* FILTER BAR */}
        <div className='aml-filter-bar'>
          <div className='aml-filter-row'>
            <span className='aml-filter-label'>{t('类型')}</span>
            <div className='aml-chip-row'>
              {endpointOpts.map((ep) => (
                <Chip
                  key={ep}
                  active={filterEndpointType === ep}
                  onClick={() => setFilterEndpointType(ep)}
                >
                  {ep === 'all' ? t('全部') : ep}
                </Chip>
              ))}
            </div>
          </div>
          <div className='aml-filter-divider' />
          <div className='aml-filter-row'>
            <span className='aml-filter-label'>{t('能力')}</span>
            <div className='aml-chip-row'>
              {tagOpts.map((tg) => (
                <Chip
                  key={tg}
                  active={filterTag === tg}
                  onClick={() => setFilterTag(tg)}
                >
                  {tg === 'all' ? t('全部') : tg}
                </Chip>
              ))}
            </div>
          </div>
          <div className='aml-filter-divider' />
          <div className='aml-filter-row'>
            <span className='aml-filter-label'>{t('提供商')}</span>
            <div className='aml-chip-row'>
              {providerOpts.map((pv) => (
                <Chip
                  key={pv}
                  active={filterVendor === pv}
                  onClick={() => setFilterVendor(pv)}
                >
                  {pv === 'all' ? t('全部') : pv}
                </Chip>
              ))}
            </div>
            {!isMobile && supportsCurrencyDisplay && (
              <div className='aml-toggle-group'>
                <Toggle
                  on={showWithRecharge}
                  onChange={setShowWithRecharge}
                  label={t('充值价格')}
                />
                {showWithRecharge && (
                  <select
                    className='aml-mini-select'
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value='USD'>USD</option>
                    <option value='CNY'>CNY</option>
                    <option value='CUSTOM'>{t('自定义')}</option>
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RESULT META */}
        <div className='aml-result-meta'>
          <div className='count'>
            {t('共')} <strong>{sortedItems.length}</strong> {t('个模型')}
            <span style={{ margin: '0 6px', color: 'var(--aml-ink-300)' }}>
              ·
            </span>
            {t('已选')} <strong>{selected.size}</strong>
          </div>
          <button
            type='button'
            className='aml-sort-select'
            onClick={() => {
              const opts = ['default', 'price-asc', 'price-desc', 'name'];
              setSortBy(opts[(opts.indexOf(sortBy) + 1) % opts.length]);
            }}
          >
            {t('排序')}：
            {
              {
                default: t('默认'),
                'price-asc': t('价格 ↑'),
                'price-desc': t('价格 ↓'),
                name: t('名称'),
              }[sortBy]
            }{' '}
            <Icon.Chevron />
          </button>
        </div>

        {/* CONTENT */}
        {loading && <div className='aml-empty'>{t('加载中…')}</div>}

        {!loading && view === 'list' && (
          <div className='aml-list'>
            {sortedItems.map((m) => (
              <ListRow
                key={m.model_name}
                m={m}
                selected={selected.has(m.model_name)}
                onToggleSelect={toggleSelect}
                onView={openModelDetail}
                t={t}
              />
            ))}
          </div>
        )}

        {!loading && view === 'cards' && (
          <div className='aml-cards'>
            {sortedItems.map((m) => (
              <CardItem
                key={m.model_name}
                m={m}
                selected={selected.has(m.model_name)}
                onToggleSelect={toggleSelect}
                onView={openModelDetail}
                t={t}
              />
            ))}
          </div>
        )}

        {!loading && view === 'table' && (
          <TableView
            items={sortedItems}
            selected={selected}
            onToggleSelect={toggleSelect}
            onView={openModelDetail}
            t={t}
          />
        )}

        {!loading && sortedItems.length === 0 && (
          <div className='aml-empty'>
            {t('没有匹配的模型，试试调整筛选条件。')}
          </div>
        )}
      </div>

      {/* SELECTION BAR — portalled to body so ancestor transforms cannot
         trap position:fixed; only mounted while there's a selection. */}
      {selected.size > 0 &&
        createPortal(
          <div className='aml-sel-bar show'>
            <span className='count-pill'>{selected.size}</span>
            <span>{t('已选模型')}</span>
            <button type='button' onClick={clearSelection}>
              {t('清空')}
            </button>
            <button
              type='button'
              className='sb-action'
              onClick={() =>
                pricingData.copyText(Array.from(selected).join(','))
              }
            >
              {t('复制名称')} <Icon.Arrow />
            </button>
          </div>,
          document.body,
        )}

      {/* Detail drawer (reused) */}
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
        usableGroup={pricingData.usableGroup}
        currency={currency}
        siteDisplayType={siteDisplayType}
        tokenUnit={tokenUnit}
        displayPrice={displayPrice}
        showRatio={false}
        vendorsMap={pricingData.vendorsMap}
        endpointMap={pricingData.endpointMap}
        autoGroups={pricingData.autoGroups}
        t={t}
      />
    </div>
  );
};

/* ─── pull a numeric value out of a formatted price string for sorting ─── */
function extractNumeric(formatted) {
  if (!formatted) return null;
  const m = String(formatted).match(/[-+]?[0-9]*\.?[0-9]+/);
  return m ? parseFloat(m[0]) : null;
}

/* ─── Page CSS — scoped under .aml-root ─── */
const PAGE_CSS = `
.aml-root {
  --aml-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --aml-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --aml-grad-softer: linear-gradient(135deg, rgba(0,114,255,0.04) 0%, rgba(0,198,255,0.04) 100%);
  --aml-blue-1: #0072ff;
  --aml-blue-2: #00c6ff;
  --aml-ink-900: #0b1a2b;
  --aml-ink-700: #2a3a4d;
  --aml-ink-500: #5b6878;
  --aml-ink-400: #8593a3;
  --aml-ink-300: #b6bfca;
  --aml-line: #e8edf3;
  --aml-line-soft: #f1f4f8;
  --aml-bg: #f7f9fc;
  --aml-card: #ffffff;
  --aml-radius: 14px;
  --aml-radius-sm: 10px;
  font-family: "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--aml-bg);
  color: var(--aml-ink-900);
  font-size: 14px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  min-height: 100%;
  flex: 1 0 auto;
}
.aml-root .mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.aml-root button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.aml-root input, .aml-root select { font-family: inherit; }

/* layout */
.aml-page { max-width: 1280px; margin: 0 auto; padding: 32px 28px 80px; box-sizing: border-box; }

/* header */
.aml-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.aml-title-block .eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--aml-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  margin-bottom: 6px;
}
.aml-title-block h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
.aml-title-block .sub { color: var(--aml-ink-500); font-size: 13px; margin-top: 6px; }
.aml-header-tools { display: flex; align-items: center; gap: 10px; }

.aml-search {
  display: flex; align-items: center; gap: 8px;
  background: var(--aml-card);
  border: 1px solid var(--aml-line);
  border-radius: 999px;
  padding: 8px 14px 8px 12px;
  width: 280px;
  transition: border-color .15s, box-shadow .15s;
}
.aml-search:focus-within {
  border-color: rgba(0,114,255,0.4);
  box-shadow: 0 0 0 4px rgba(0,114,255,0.08);
}
.aml-search svg { color: var(--aml-ink-400); flex: none; }
.aml-search input { border: none; outline: none; background: transparent; flex: 1; font-size: 13px; color: var(--aml-ink-900); min-width: 0; }
.aml-search input::placeholder { color: var(--aml-ink-400); }

.aml-icon-btn {
  width: 36px; height: 36px; border-radius: 999px;
  background: var(--aml-card); border: 1px solid var(--aml-line);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--aml-ink-500); transition: all .15s;
}
.aml-icon-btn:hover { color: var(--aml-blue-1); border-color: rgba(0,114,255,0.3); }

.aml-view-toggle {
  display: inline-flex; padding: 3px; background: var(--aml-card);
  border: 1px solid var(--aml-line); border-radius: 999px; gap: 2px;
}
.aml-view-toggle button {
  padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 500;
  color: var(--aml-ink-500); display: inline-flex; align-items: center; gap: 6px;
}
.aml-view-toggle button.active {
  background: var(--aml-grad); color: white;
  box-shadow: 0 2px 8px rgba(0,114,255,0.25);
}

/* filter bar */
.aml-filter-bar {
  background: var(--aml-card); border: 1px solid var(--aml-line);
  border-radius: var(--aml-radius); padding: 14px 16px;
  margin-bottom: 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.aml-filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.aml-filter-label {
  font-size: 12px; color: var(--aml-ink-500); font-weight: 500;
  flex: none; padding-right: 4px; min-width: 48px;
}
.aml-chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
.aml-chip {
  font-size: 12px; padding: 6px 12px; border-radius: 999px;
  background: transparent; color: var(--aml-ink-700);
  border: 1px solid transparent;
  transition: all .12s;
  font-weight: 500; white-space: nowrap;
}
.aml-chip:hover { background: var(--aml-line-soft); }
.aml-chip.active {
  background: var(--aml-grad); color: white;
  box-shadow: 0 2px 6px rgba(0,114,255,0.2);
}
.aml-chip-count {
  margin-left: 4px; font-size: 11px; opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.aml-filter-divider { height: 1px; background: var(--aml-line-soft); margin: 0 -16px; }

.aml-toggle-group { display: inline-flex; align-items: center; gap: 14px; margin-left: auto; }
.aml-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: var(--aml-ink-500); cursor: pointer; }
.aml-toggle .switch { position: relative; width: 30px; height: 16px; background: #dfe5ec; border-radius: 999px; transition: background .15s; flex: none; }
.aml-toggle .switch::after {
  content: ''; position: absolute; left: 2px; top: 2px; width: 12px; height: 12px;
  background: white; border-radius: 50%; transition: transform .15s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
}
.aml-toggle.on .switch { background: var(--aml-grad); }
.aml-toggle.on .switch::after { transform: translateX(14px); }
.aml-mini-select {
  font-size: 12px; padding: 4px 8px; border-radius: 8px;
  border: 1px solid var(--aml-line); background: var(--aml-card); color: var(--aml-ink-700);
  cursor: pointer;
}

/* result meta */
.aml-result-meta {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding: 0 4px;
}
.aml-result-meta .count { font-size: 12px; color: var(--aml-ink-500); }
.aml-result-meta .count strong { color: var(--aml-ink-900); font-weight: 600; }
.aml-sort-select {
  font-size: 12px; color: var(--aml-ink-700); background: transparent;
  border: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
}
.aml-sort-select:hover { color: var(--aml-blue-1); }

/* list view */
.aml-list { display: flex; flex-direction: column; gap: 6px; }
.aml-row {
  background: var(--aml-card); border: 1px solid var(--aml-line);
  border-radius: var(--aml-radius);
  padding: 14px 18px;
  display: grid;
  grid-template-columns: 36px minmax(220px, 1.4fr) repeat(3, 1fr) auto auto;
  gap: 18px; align-items: center;
  transition: border-color .12s, box-shadow .12s;
  position: relative;
}
.aml-row:hover {
  border-color: rgba(0,114,255,0.25);
  box-shadow: 0 4px 14px -6px rgba(0,114,255,0.18);
}
.aml-row.selected {
  border-color: rgba(0,114,255,0.5);
  background: linear-gradient(180deg, rgba(0,114,255,0.025), transparent 40%);
}
.aml-row.selected::before {
  content: ''; position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px;
  background: var(--aml-grad); border-radius: 0 3px 3px 0;
}

.aml-model-info { min-width: 0; }
.aml-model-name { font-size: 14px; font-weight: 600; color: var(--aml-ink-900); display: flex; align-items: center; gap: 8px; }
.aml-model-desc { font-size: 12px; color: var(--aml-ink-500); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aml-pill {
  font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 4px;
  background: var(--aml-line-soft); color: var(--aml-ink-500);
  text-transform: lowercase; letter-spacing: 0.02em;
}

.aml-price-cell { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.aml-price-cell .label { font-size: 10.5px; color: var(--aml-ink-400); font-weight: 500; }
.aml-price-cell .value {
  font-size: 12px; font-weight: 600;
  background: var(--aml-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
  font-feature-settings: "tnum";
  white-space: nowrap;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  letter-spacing: -0.01em;
}
.aml-price-cell .unit { font-size: 9.5px; color: var(--aml-ink-400); margin-left: 1px; font-weight: 500; font-family: 'JetBrains Mono', ui-monospace, monospace; }
.aml-price-cell.muted .value { background: none; -webkit-text-fill-color: var(--aml-ink-300); color: var(--aml-ink-300); }
.aml-price-cell.percall .label {
  display: inline-flex; align-items: center; gap: 4px;
  color: #1d8e9f; font-weight: 600;
}
.aml-price-cell.percall .label::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: #30b0c7; box-shadow: 0 0 0 2px rgba(48,176,199,0.18);
}

.aml-tag-cell { display: flex; gap: 4px; flex-wrap: wrap; max-width: 130px; justify-content: flex-end; }
.aml-tag {
  font-size: 10px; font-weight: 500;
  padding: 3px 8px; border-radius: 4px;
  background: var(--aml-grad-soft); color: var(--aml-blue-1);
  text-transform: uppercase; letter-spacing: 0.04em;
  border: 1px solid rgba(0,114,255,0.1);
  white-space: nowrap;
}
.aml-tag.alt { background: var(--aml-line-soft); color: var(--aml-ink-500); border-color: transparent; }

.aml-row-actions { display: flex; align-items: center; gap: 8px; }
/* Checkbox — selectors are scoped under .aml-root with extra specificity
   so they out-rank the .aml-root button reset (border:none; background:none)
   that would otherwise erase the box outline and surface. */
.aml-root button.aml-checkbox {
  width: 18px; height: 18px; border-radius: 4px;
  border: 1.5px solid #94a3b8;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .12s;
  background: #ffffff;
  flex: none; padding: 0;
}
.aml-root button.aml-checkbox:hover {
  border-color: var(--aml-blue-1);
  background: linear-gradient(135deg, rgba(0,114,255,0.08), rgba(0,198,255,0.08));
}
.aml-root button.aml-checkbox.checked {
  background: var(--aml-grad);
  border-color: transparent;
}
.aml-root button.aml-checkbox.checked svg { color: white; }
.aml-root button.aml-checkbox svg { opacity: 0; transition: opacity .12s; }
.aml-root button.aml-checkbox.checked svg { opacity: 1; }

.aml-btn-primary {
  background: var(--aml-grad); color: white;
  padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 5px;
  box-shadow: 0 2px 8px rgba(0,114,255,0.22);
  transition: transform .12s, box-shadow .12s;
  white-space: nowrap;
}
.aml-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,114,255,0.32); }
.aml-btn-primary svg { transition: transform .12s; }
.aml-btn-primary:hover svg { transform: translateX(2px); }

/* table view */
.aml-table-wrap { background: var(--aml-card); border: 1px solid var(--aml-line); border-radius: var(--aml-radius); overflow: hidden; }
.aml-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.aml-table thead th {
  text-align: left; font-size: 11px; font-weight: 600; color: var(--aml-ink-500);
  text-transform: uppercase; letter-spacing: 0.04em;
  padding: 12px 16px; background: #fafbfd; border-bottom: 1px solid var(--aml-line);
  white-space: nowrap;
}
.aml-table thead th.num { text-align: right; }
.aml-table tbody td { padding: 12px 16px; border-bottom: 1px solid var(--aml-line-soft); vertical-align: middle; }
.aml-table tbody tr:last-child td { border-bottom: none; }
.aml-table tbody tr:hover { background: #fafbfd; }
.aml-table tbody tr.selected { background: linear-gradient(90deg, rgba(0,114,255,0.04), transparent); }
.aml-name-cell { display: flex; align-items: center; gap: 10px; }
.aml-table .num { text-align: right; font-feature-settings: "tnum"; white-space: nowrap; }
.aml-table .grad-num { background: var(--aml-grad); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 600; }

/* card view */
.aml-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.aml-card-item {
  background: var(--aml-card); border: 1px solid var(--aml-line);
  border-radius: var(--aml-radius); padding: 16px;
  transition: border-color .12s, box-shadow .12s;
  display: flex; flex-direction: column; gap: 12px;
}
.aml-card-item:hover { border-color: rgba(0,114,255,0.25); box-shadow: 0 4px 14px -6px rgba(0,114,255,0.18); }
.aml-card-head { display: flex; gap: 12px; align-items: flex-start; }
.aml-card-head .info { flex: 1; min-width: 0; }
.aml-card-head .name {
  font-size: 13.5px; font-weight: 600;
  word-break: break-all; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.aml-card-head .desc {
  font-size: 12px; color: var(--aml-ink-500); margin-top: 4px; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.aml-card-prices {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  padding: 10px 12px; background: var(--aml-grad-softer);
  border-radius: var(--aml-radius-sm);
}
.aml-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.aml-card-foot .left { display: flex; gap: 4px; flex-wrap: wrap; }

/* selection bar — portalled to body, slides up on mount */
.aml-sel-bar {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  background: #0b1a2b; color: white;
  padding: 10px 12px 10px 18px; border-radius: 999px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 14px 40px -10px rgba(11,26,43,0.5);
  font-size: 13px;
  z-index: 1100;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  animation: aml-sel-bar-in .26s cubic-bezier(0.2, 0.9, 0.2, 1);
}
@keyframes aml-sel-bar-in {
  from { transform: translateX(-50%) translateY(140%); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0); opacity: 1; }
}
.aml-sel-bar .count-pill {
  background: var(--aml-grad); padding: 2px 10px; border-radius: 999px; font-weight: 600;
  font-size: 12px;
}
.aml-sel-bar button { color: rgba(255,255,255,0.7); font-size: 12px; padding: 4px 8px; border-radius: 6px; }
.aml-sel-bar button:hover { color: white; background: rgba(255,255,255,0.08); }
.aml-sel-bar .sb-action {
  background: var(--aml-grad); color: white; padding: 7px 14px; border-radius: 999px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 5px;
}

/* empty state */
.aml-empty {
  padding: 60px 20px; text-align: center; color: var(--aml-ink-400);
  background: var(--aml-card); border: 1px solid var(--aml-line); border-radius: var(--aml-radius);
}

/* responsive */
@media (max-width: 1100px) {
  .aml-row { grid-template-columns: 36px 1.4fr 1fr 1fr 1fr auto; }
  .aml-row .aml-cache-cell { display: none !important; }
  .aml-row .aml-tag-cell { display: none; }
}
@media (max-width: 720px) {
  .aml-cards { grid-template-columns: 1fr; }
  .aml-row { grid-template-columns: 36px 1fr auto; }
  .aml-row .aml-price-cell, .aml-row .aml-tag-cell, .aml-row .aml-cache-cell { display: none !important; }
  .aml-header { flex-direction: column; align-items: flex-start; }
  .aml-search { width: 100%; }
  .aml-page { padding: 20px 14px 80px; }
}
@media (max-width: 1100px) and (min-width: 721px) {
  .aml-cards { grid-template-columns: repeat(2, 1fr); }
}

/* ───────── Dark mode (driven by html.dark, set by ThemeToggle) ───────── */
html.dark .aml-root {
  --aml-ink-900: rgba(255,255,255,0.95);
  --aml-ink-700: rgba(255,255,255,0.78);
  --aml-ink-500: rgba(255,255,255,0.55);
  --aml-ink-400: rgba(255,255,255,0.42);
  --aml-ink-300: rgba(255,255,255,0.28);
  --aml-line: rgba(255,255,255,0.08);
  --aml-line-soft: rgba(255,255,255,0.04);
  --aml-bg: #1c1c1e;
  --aml-card: #2a2a2c;
}
html.dark .aml-root .aml-table thead th,
html.dark .aml-root .aml-table tbody tr:hover {
  background: rgba(255,255,255,0.04);
}
html.dark .aml-root .aml-table tbody tr.selected {
  background: linear-gradient(90deg, rgba(56,182,255,0.10), transparent);
}
html.dark .aml-root .aml-row.selected {
  background: linear-gradient(180deg, rgba(56,182,255,0.10), transparent 40%);
}
html.dark .aml-root .aml-pill {
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6);
}
html.dark .aml-root .aml-card-item:hover,
html.dark .aml-root .aml-row:hover {
  border-color: rgba(56,182,255,0.32);
  box-shadow: 0 4px 14px -6px rgba(0,0,0,0.4);
}
html.dark .aml-root button.aml-checkbox {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.32);
}
html.dark .aml-root button.aml-checkbox.checked {
  background: var(--aml-grad);
  border-color: transparent;
}
html.dark .aml-sel-bar {
  background: #2a2a2c;
  color: rgba(255,255,255,0.9);
  box-shadow: 0 14px 40px -10px rgba(0,0,0,0.5);
}
`;

export default PricingPage;
