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
 * CardPageLayout — page shell for card-based list pages.
 *
 * Matches the Tailwind HTML mockup the user shared:
 *   <main class="max-w-[1440px] mx-auto px-8 py-12">
 *     <header>… title + subtitle + primary button …</header>
 *     <filter-bar class="mt-8 p-6 bg-surface-container-low rounded-xl">…</filter-bar>
 *     <list>…</list>
 *     <pagination-footer>…</pagination-footer>
 *   </main>
 *
 * Slots:
 *   title         string         H1 text (Manrope-style, extrabold)
 *   subtitle      string|node    muted subtitle
 *   primaryAction node           gradient CTA button (optional)
 *   filterBar     node           a CardFilterBar or any JSX
 *   footer        node           pagination or totals row
 *   children      node           the list itself
 */

import React from 'react';

const LAYOUT_STYLES = `
.cp-layout {
  width: 100%;
  max-width: 1440px;
  margin-left: auto;
  margin-right: auto;
  padding: 32px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
@media (min-width: 768px) {
  .cp-layout { padding: 40px 32px 48px; gap: 28px; }
}
@media (min-width: 1280px) {
  .cp-layout { padding: 48px 40px 56px; gap: 32px; }
}

.cp-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
@media (min-width: 768px) {
  .cp-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }
}

.cp-header-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.cp-title {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: var(--text-primary);
  margin: 0;
}
@media (min-width: 768px) {
  .cp-title { font-size: 32px; }
}
.cp-subtitle {
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.cp-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Primary gradient CTA — matches the HTML mockup's "Export Report" button */
.cp-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: -0.005em;
  color: #ffffff;
  background: var(--accent-gradient);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow:
    0 8px 20px -8px rgba(0, 114, 255, 0.35),
    0 2px 6px -2px rgba(0, 114, 255, 0.15);
  white-space: nowrap;
}
.cp-primary-btn:hover {
  box-shadow:
    0 12px 28px -8px rgba(0, 114, 255, 0.45),
    0 2px 6px -2px rgba(0, 114, 255, 0.2);
}
.cp-primary-btn:active { transform: scale(0.97); }

.cp-ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--ease-micro), border-color var(--ease-micro);
  white-space: nowrap;
}
.cp-ghost-btn:hover {
  background: var(--surface-hover);
}
.cp-ghost-btn.danger {
  color: #ff3b30;
  border-color: color-mix(in srgb, #ff3b30 30%, var(--border-default));
}
.cp-ghost-btn.danger:hover {
  background: rgba(255, 59, 48, 0.08);
}

/* Filter bar container — soft gray rounded box */
.cp-filter-bar {
  padding: 16px 18px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
@media (min-width: 768px) {
  .cp-filter-bar { padding: 18px 20px; }
}

.cp-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

/* Search pill — white bg, subtle, icon prefix */
.cp-search {
  position: relative;
  flex: 1 1 280px;
  min-width: 240px;
}
.cp-search input {
  width: 100%;
  padding: 11px 14px 11px 40px;
  background: var(--surface);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--ease-micro), box-shadow var(--ease-micro);
}
.cp-search input::placeholder {
  color: var(--text-muted);
}
.cp-search input:focus {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
}
.cp-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
  display: inline-flex;
  align-items: center;
}
.cp-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
}
.cp-search-clear:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* Pill-style selectors in the filter bar (mirror the HTML mockup's "System" / "Date Range" chips) */
.cp-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--ease-micro), border-color var(--ease-micro);
  white-space: nowrap;
}
.cp-pill:hover {
  border-color: var(--border-default);
}
.cp-pill .cp-pill-icon {
  color: var(--accent);
  display: inline-flex;
  align-items: center;
}

/* Icon-only refresh button */
.cp-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color var(--ease-micro), border-color var(--ease-micro),
              transform var(--ease-micro);
}
.cp-icon-btn:hover {
  border-color: var(--border-default);
}
.cp-icon-btn:active { transform: scale(0.95); }

/* Footer / pagination row */
.cp-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px 0;
}
@media (min-width: 640px) {
  .cp-footer {
    flex-direction: row;
  }
}
.cp-footer-count {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-secondary);
}
.cp-footer-count strong {
  color: var(--text-primary);
  font-weight: 700;
}
`;

let stylesInjected = false;
const ensureStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-card-page-layout', 'true');
  style.textContent = LAYOUT_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
};

const CardPageLayout = ({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  filterBar,
  footer,
  children,
}) => {
  ensureStyles();
  return (
    <div className='cp-layout'>
      <header className='cp-header'>
        <div className='cp-header-text'>
          <h1 className='cp-title'>{title}</h1>
          {subtitle && <p className='cp-subtitle'>{subtitle}</p>}
        </div>
        {(primaryAction || secondaryActions) && (
          <div className='cp-header-actions'>
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </header>
      {filterBar}
      {children}
      {footer}
    </div>
  );
};

export default CardPageLayout;
