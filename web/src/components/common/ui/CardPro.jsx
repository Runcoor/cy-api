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

import React, { useState } from 'react';
import { Button } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { IconChevronDown, IconChevronUp } from '@douyinfe/semi-icons';

/**
 * CardPro — macOS Vibrancy Panel Component
 *
 * A card wrapper with distinct visual sections, used by all table pages.
 * Styled as a macOS System Preferences–style panel with depth layers:
 *   - Header toolbar: bg-subtle background, separated sections
 *   - Content: bg-surface, flush table area
 *   - Footer: bg-subtle pagination strip
 *
 * Layout areas:
 * 1. statsArea (type2) — statistics display
 * 2. descriptionArea (type1, type3) — section title
 * 3. tabsArea (type3) — type tabs
 * 4. actionsArea (type1, type3) — action buttons
 * 5. searchArea — search/filter form
 * 6. paginationArea — pagination controls
 */
const CardPro = ({
  type = 'type1',
  className = '',
  children,
  // Area content
  statsArea,
  descriptionArea,
  tabsArea,
  actionsArea,
  searchArea,
  paginationArea,
  // Card props
  shadows = '',
  bordered = true,
  // Custom style
  style,
  // i18n
  t = (key) => key,
  ...props
}) => {
  const isMobile = useIsMobile();
  const [showMobileActions, setShowMobileActions] = useState(false);

  const hasMobileHideableContent = actionsArea || searchArea;

  const hasHeaderContent =
    statsArea || descriptionArea || tabsArea || actionsArea || searchArea;

  return (
    <div
      className={`mv-card-pro ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      {...props}
    >
      {/* ── Header Toolbar ── */}
      {hasHeaderContent && (
        <div
          className='mv-card-pro-header'
          style={{
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Description / Stats area — top section with title */}
          {type === 'type2' && statsArea && (
            <div className='px-4 py-3 md:px-5'>
              {statsArea}
            </div>
          )}

          {(type === 'type1' || type === 'type3') && descriptionArea && (
            <div className='px-4 py-3 md:px-5'>
              {descriptionArea}
            </div>
          )}

          {/* Separator between description/stats and toolbar */}
          {(((type === 'type1' || type === 'type3') && descriptionArea) ||
            (type === 'type2' && statsArea)) &&
            (tabsArea || actionsArea || searchArea) && (
            <div style={{ borderBottom: '1px solid var(--border-subtle)' }} />
          )}

          {/* Tabs area — type3 only */}
          {type === 'type3' && tabsArea && (
            <>
              <div className='px-4 py-2 md:px-5'>
                {tabsArea}
              </div>
              {(actionsArea || searchArea) && (
                <div style={{ borderBottom: '1px solid var(--border-subtle)' }} />
              )}
            </>
          )}

          {/* Mobile toggle for actions/search */}
          {isMobile && hasMobileHideableContent && (
            <div className='px-4 py-2'>
              <Button
                onClick={() => setShowMobileActions(!showMobileActions)}
                icon={showMobileActions ? <IconChevronUp size='small' /> : <IconChevronDown size='small' />}
                type='tertiary'
                size='small'
                theme='borderless'
                block
                style={{
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  background: 'var(--surface-hover)',
                }}
              >
                {showMobileActions ? t('隐藏操作项') : t('显示操作项')}
              </Button>
            </div>
          )}

          {/* Actions + Search toolbar area */}
          <div
            className={`flex flex-col ${isMobile && !showMobileActions ? 'hidden' : ''}`}
          >
            {/* Action buttons */}
            {(type === 'type1' || type === 'type3') && actionsArea && (
              Array.isArray(actionsArea) ? (
                actionsArea.map((area, idx) => (
                  <React.Fragment key={idx}>
                    {idx !== 0 && (
                      <div style={{ borderBottom: '1px solid var(--border-subtle)' }} />
                    )}
                    <div className='px-4 py-2.5 md:px-5'>{area}</div>
                  </React.Fragment>
                ))
              ) : (
                <div className='px-4 py-2.5 md:px-5'>{actionsArea}</div>
              )
            )}

            {/* Separator between actions and search */}
            {actionsArea && searchArea && (
              <div style={{ borderBottom: '1px solid var(--border-subtle)' }} />
            )}

            {/* Search/filter form */}
            {searchArea && (
              <div className='px-4 py-2.5 md:px-5'>{searchArea}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Content Area (table) ── */}
      <div className='mv-card-pro-body' style={{ flex: '1 1 auto' }}>
        {children}
      </div>

      {/* ── Footer — Pagination ── */}
      {paginationArea && (
        <div
          className='mv-card-pro-footer'
          style={{
            background: 'var(--bg-subtle)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className={`flex w-full px-4 py-3 md:px-5 ${
              isMobile ? 'justify-center' : 'justify-between items-center'
            }`}
          >
            {paginationArea}
          </div>
        </div>
      )}
    </div>
  );
};

CardPro.propTypes = {
  type: PropTypes.oneOf(['type1', 'type2', 'type3']),
  className: PropTypes.string,
  style: PropTypes.object,
  shadows: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  bordered: PropTypes.bool,
  statsArea: PropTypes.node,
  descriptionArea: PropTypes.node,
  tabsArea: PropTypes.node,
  actionsArea: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  searchArea: PropTypes.node,
  paginationArea: PropTypes.node,
  children: PropTypes.node,
  t: PropTypes.func,
};

export default CardPro;
