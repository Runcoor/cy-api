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
 * CardRow — a log-entry card that matches the "Live Streams" mockup at
 * tmp/image-008.png and the Tailwind HTML shared by the user.
 *
 * Visual spec (translated from that HTML into our design tokens):
 *   • Background          : var(--surface) — pure white in light mode
 *   • Border              : 1px solid transparent (becomes visible on hover)
 *   • Radius              : var(--radius-lg) — project-wide 12px
 *   • Padding             : 24px
 *   • Gap between blocks  : 32px
 *   • Status icon         : 48px circle, rounded-full, tinted bg + fg
 *   • Field label         : 10px uppercase, letter-spacing 0.12em, text-muted
 *   • Field value         : 13.5px semibold, text-primary
 *   • Hover               : soft shadow lift + visible hairline border,
 *                           background stays white (no grey wash)
 *   • Actions             : absolute-positioned top/right, fade in on hover,
 *                           always-visible on mobile
 *   • Items vertically centered inside the card
 */

import React from 'react';
import { useIsMobile } from '../../../hooks/common/useIsMobile';

const STATUS_COLORS = {
  success: { bg: 'rgba(52, 199, 89, 0.14)', fg: '#34c759' },
  error:   { bg: 'rgba(255, 59, 48, 0.14)', fg: '#ff3b30' },
  warning: { bg: 'rgba(255, 149, 0, 0.14)', fg: '#ff9500' },
  accent:  { bg: 'var(--accent-light)',     fg: 'var(--accent)' },
  muted:   { bg: 'var(--surface-active)',   fg: 'var(--text-muted)' },
};

const EMPHASIS_COLORS = {
  normal:  'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  primary: 'var(--accent)',
  danger:  '#ff3b30',
  warning: '#ff9500',
  success: '#34c759',
};

const MODAL_STYLES = `
.cr-row {
  position: relative;
  background: var(--surface);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  transition:
    border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow  220ms cubic-bezier(0.22, 1, 0.36, 1),
    transform   220ms cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 0;
}
.cr-row.is-clickable { cursor: pointer; }

/* Hover — keep background WHITE, add hairline border + soft lift shadow.
   No grey wash (per user feedback). */
.cr-row:hover,
.cr-row:focus-within {
  border-color: var(--border-default);
  box-shadow: 0 12px 32px -12px rgba(25, 28, 29, 0.08),
              0 2px 6px -2px rgba(25, 28, 29, 0.04);
}
html.dark .cr-row:hover,
html.dark .cr-row:focus-within {
  border-color: color-mix(in srgb, var(--border-default) 160%, transparent);
  box-shadow: 0 16px 40px -16px rgba(0, 0, 0, 0.55),
              0 2px 6px -2px rgba(0, 0, 0, 0.25);
}

.cr-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.cr-row:hover .cr-icon {
  transform: scale(1.04);
}

.cr-body {
  flex: 1 1 0;
  min-width: 0;
  display: grid;
  gap: 28px;
  align-items: center;
}

.cr-field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}
.cr-field.align-end { align-items: flex-end; text-align: right; }

.cr-field-label {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cr-field-value {
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.35;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cr-field-value.cr-mono {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.01em;
}
.cr-field-value.cr-headline {
  font-weight: 700;
  font-size: 14.5px;
  letter-spacing: -0.01em;
}

/* Hover-revealed action buttons, absolute top/right (desktop) */
.cr-actions {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow:
    0 12px 32px -12px rgba(25, 28, 29, 0.12),
    0 2px 6px -2px rgba(25, 28, 29, 0.04),
    0 0 0 1px var(--border-default);
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
html.dark .cr-actions {
  background: var(--surface);
  box-shadow:
    0 16px 40px -16px rgba(0, 0, 0, 0.65),
    0 0 0 1px color-mix(in srgb, var(--border-default) 160%, transparent);
}
.cr-row:hover .cr-actions,
.cr-row:focus-within .cr-actions,
.cr-actions.cr-actions-visible {
  opacity: 1;
  pointer-events: auto;
}

/* ───── Desktop grid columns are set inline based on field count ───── */

/* ───── Mobile layout ───── */
@media (max-width: 767px) {
  .cr-row {
    padding: 18px 16px 20px;
    gap: 14px;
    align-items: flex-start;
    flex-direction: row;
  }
  .cr-body {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 14px 16px;
  }
  .cr-field.hide-on-mobile { display: none; }
  .cr-actions {
    position: static;
    transform: none;
    opacity: 1;
    pointer-events: auto;
    padding: 0;
    background: transparent;
    box-shadow: none;
    margin-top: 10px;
    grid-column: 1 / -1;
    justify-content: flex-end;
    width: 100%;
  }
}

/* ───── Skeleton ───── */
.cr-skeleton {
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.cr-skeleton-block {
  background: var(--surface-active);
  border-radius: var(--radius-sm);
  animation: cr-pulse 1.4s ease-in-out infinite;
}
@keyframes cr-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}
`;

let stylesInjected = false;
const ensureStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-cardrow', 'true');
  style.textContent = MODAL_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
};

const CardRow = ({
  statusIcon,
  statusColor = 'muted',
  fields = [],
  actions = null,
  actionsAlwaysVisible = false,
  onClick,
  className = '',
  style,
}) => {
  ensureStyles();
  const isMobile = useIsMobile();
  const colors = STATUS_COLORS[statusColor] || STATUS_COLORS.muted;

  // Build grid template on desktop — clamp 1..6. Each field occupies one
  // column by default; fields with span: 2 occupy two.
  const totalSpans = fields.reduce((sum, f) => sum + (f.span || 1), 0);
  const cols = Math.max(1, Math.min(totalSpans, 6));
  const gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div
      className={`cr-row${onClick ? ' is-clickable' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      style={style}
    >
      {statusIcon && (
        <div
          className='cr-icon'
          style={{ background: colors.bg, color: colors.fg }}
        >
          {statusIcon}
        </div>
      )}
      <div
        className='cr-body'
        style={{ gridTemplateColumns }}
      >
        {fields.map((f, i) => {
          const alignClass = f.align === 'end' ? ' align-end' : '';
          const mobileHideClass = f.hideOnMobile ? ' hide-on-mobile' : '';
          const valueClasses = [
            'cr-field-value',
            f.mono ? 'cr-mono' : '',
            f.headline ? 'cr-headline' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div
              key={i}
              className={`cr-field${alignClass}${mobileHideClass}`}
              style={{
                gridColumn: f.span ? `span ${f.span}` : undefined,
              }}
            >
              <div className='cr-field-label'>{f.label}</div>
              <div
                className={valueClasses}
                style={{
                  color: EMPHASIS_COLORS[f.emphasis || 'normal'],
                  justifyContent: f.align === 'end' ? 'flex-end' : 'flex-start',
                }}
              >
                {f.value}
              </div>
            </div>
          );
        })}
        {isMobile && actions && (
          <div className='cr-actions cr-actions-visible'>{actions}</div>
        )}
      </div>
      {!isMobile && actions && (
        <div
          className={`cr-actions${actionsAlwaysVisible ? ' cr-actions-visible' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
};

CardRow.Skeleton = () => {
  ensureStyles();
  return (
    <div className='cr-skeleton'>
      <div
        className='cr-skeleton-block'
        style={{ width: 48, height: 48, borderRadius: 9999 }}
      />
      <div
        className='flex-1 flex gap-6'
        style={{ width: '100%' }}
      >
        <div className='cr-skeleton-block' style={{ flex: 1, height: 36 }} />
        <div className='cr-skeleton-block' style={{ flex: 1, height: 36 }} />
        <div className='cr-skeleton-block' style={{ flex: 1, height: 36 }} />
        <div className='cr-skeleton-block' style={{ flex: 1, height: 36 }} />
      </div>
    </div>
  );
};

export default CardRow;
