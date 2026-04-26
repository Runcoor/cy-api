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

export const TOKEN_DRAWER_STYLES = `
/* Drawer container — the .tk-create-sheet className lives on the
   outermost wrapper (Semi puts it there alongside .semi-sidesheet).
   These descendant selectors out-specificity the global
   .semi-sidesheet-inner { border-radius: var(--radius-lg) !important }
   rule from web/src/index.css. */
.tk-create-sheet.semi-sidesheet,
.tk-create-sheet .semi-sidesheet-inner,
.tk-create-sheet .semi-sidesheet-content,
.tk-create-sheet .semi-sidesheet-body {
  border-radius: 0 !important;
}
.tk-create-sheet .semi-sidesheet-body {
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}

/* Spin inside body must not break the parent flex column. */
.tk-body .tk-spin-body,
.tk-body .semi-spin-wrapper,
.tk-body .semi-spin-children {
  width: 100%;
}

.tk-root {
  --tk-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --tk-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --tk-grad-softer: linear-gradient(135deg, rgba(0,114,255,0.04) 0%, rgba(0,198,255,0.04) 100%);
  --tk-blue-1: #0072ff;
  --tk-blue-2: #00c6ff;
  --tk-ink-900: #0b1a2b;
  --tk-ink-700: #2a3a4d;
  --tk-ink-500: #5b6878;
  --tk-ink-400: #8593a3;
  --tk-ink-300: #b6bfca;
  --tk-line: #e8edf3;
  --tk-line-soft: #f1f4f8;
  --tk-bg: #f6f8fc;
  --tk-card: #ffffff;
  --tk-danger: #ef5b5b;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--tk-card);
  color: var(--tk-ink-900);
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  font-size: 13px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Header */
.tk-head {
  padding: 20px 24px;
  border-bottom: 1px solid var(--tk-line);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex: none;
}
.tk-head-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}
.tk-head-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--tk-grad-soft);
  color: var(--tk-blue-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.tk-head-icon svg {
  width: 18px;
  height: 18px;
}
.tk-head-text {
  min-width: 0;
}
.tk-head h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--tk-ink-900);
  display: flex;
  align-items: center;
  gap: 8px;
}
.tk-head-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.tk-head-tag.create {
  background: var(--tk-grad);
  color: white;
  box-shadow: 0 2px 6px rgba(0, 114, 255, 0.3);
}
.tk-head-tag.edit {
  background: rgba(20, 184, 108, 0.12);
  color: #0f9b5b;
}
.tk-head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--tk-ink-500);
  line-height: 1.55;
}
.tk-head-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--tk-ink-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  flex: none;
  background: transparent;
  border: none;
  cursor: pointer;
}
.tk-head-close:hover {
  background: var(--tk-bg);
  color: var(--tk-ink-900);
}

/* Body */
.tk-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 24px 16px;
}

.tk-section {
  padding: 18px 0;
}
.tk-section + .tk-section {
  border-top: 1px solid var(--tk-line);
}
.tk-section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.tk-section-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--tk-grad);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex: none;
  box-shadow: 0 2px 6px rgba(0, 114, 255, 0.3);
}
.tk-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--tk-ink-900);
}
.tk-section-sub {
  font-size: 12px;
  color: var(--tk-ink-500);
  margin-left: auto;
}

.tk-row {
  margin-bottom: 14px;
}
.tk-row:last-child {
  margin-bottom: 0;
}
.tk-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tk-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--tk-ink-700);
  margin-bottom: 6px;
  display: block;
}
.tk-label .req {
  color: #dc2626;
  margin-left: 2px;
}
.tk-label-sub {
  font-size: 11px;
  color: var(--tk-ink-500);
  font-weight: 400;
  margin-left: 4px;
}
.tk-hint {
  font-size: 11px;
  color: var(--tk-ink-500);
  margin-top: 6px;
  line-height: 1.5;
}
.tk-hint-warn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #d97706;
}
.tk-hint-error {
  color: #dc2626;
}
.tk-hint svg {
  flex: none;
}

/* Inputs */
.tk-input,
.tk-textarea {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--tk-line);
  border-radius: 9px;
  font-size: 13px;
  font-family: inherit;
  background: white;
  transition: all 0.12s;
  outline: none;
  color: var(--tk-ink-900);
  box-sizing: border-box;
}
.tk-textarea {
  height: 90px;
  padding: 10px 12px;
  resize: vertical;
  line-height: 1.5;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
}
.tk-input::placeholder,
.tk-textarea::placeholder {
  color: var(--tk-ink-400);
}
.tk-input:focus,
.tk-textarea:focus {
  border-color: rgba(0, 114, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 114, 255, 0.1);
}
.tk-input.error,
.tk-textarea.error {
  border-color: rgba(220, 38, 38, 0.5);
}

/* Stepper */
.tk-stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--tk-line);
  border-radius: 9px;
  height: 38px;
  overflow: hidden;
  background: white;
}
.tk-stepper button {
  width: 38px;
  height: 100%;
  color: var(--tk-ink-700);
  font-size: 16px;
  font-weight: 500;
  transition: background 0.12s;
  background: transparent;
  border: none;
  cursor: pointer;
}
.tk-stepper button:hover {
  background: var(--tk-bg);
  color: var(--tk-blue-1);
}
.tk-stepper button:disabled {
  color: var(--tk-ink-300);
  cursor: not-allowed;
}
.tk-stepper input {
  flex: 1;
  min-width: 0;
  height: 100%;
  width: 100%;
  border: none;
  outline: none;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  border-left: 1px solid var(--tk-line);
  border-right: 1px solid var(--tk-line);
  -moz-appearance: textfield;
  color: var(--tk-ink-900);
  background: white;
}
.tk-stepper input::-webkit-outer-spin-button,
.tk-stepper input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Chip group */
.tk-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tk-chip {
  padding: 7px 14px;
  border: 1px solid var(--tk-line);
  border-radius: 8px;
  background: white;
  font-size: 12px;
  font-weight: 500;
  color: var(--tk-ink-700);
  transition: all 0.12s;
  cursor: pointer;
}
.tk-chip:hover {
  border-color: rgba(0, 114, 255, 0.3);
  color: var(--tk-blue-1);
}
.tk-chip.active {
  border-color: var(--tk-blue-1);
  background: var(--tk-grad-soft);
  color: var(--tk-blue-1);
  font-weight: 600;
  box-shadow: 0 0 0 3px rgba(0, 114, 255, 0.08);
}

/* Toggle row + switch */
.tk-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    rgba(0, 114, 255, 0.04),
    rgba(0, 198, 255, 0.03)
  );
  border: 1px solid rgba(0, 114, 255, 0.12);
}
.tk-toggle-text {
  min-width: 0;
}
.tk-toggle-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--tk-ink-900);
}
.tk-switch {
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: var(--tk-ink-300);
  position: relative;
  transition: background 0.2s;
  flex: none;
  cursor: pointer;
  border: none;
  padding: 0;
}
.tk-switch.on {
  background: var(--tk-grad);
}
.tk-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tk-switch.on .tk-switch-knob {
  transform: translateX(16px);
}

/* Suffix input + readout */
.tk-input-suffix {
  display: flex;
  align-items: center;
  border: 1px solid var(--tk-line);
  border-radius: 9px;
  height: 38px;
  overflow: hidden;
  background: white;
  transition: all 0.12s;
}
.tk-input-suffix:focus-within {
  border-color: rgba(0, 114, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 114, 255, 0.1);
}
.tk-input-suffix input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--tk-ink-900);
  background: transparent;
  -moz-appearance: textfield;
}
.tk-input-suffix input::-webkit-outer-spin-button,
.tk-input-suffix input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.tk-input-suffix .tk-suffix {
  padding: 0 12px;
  color: var(--tk-ink-500);
  font-size: 11px;
  border-left: 1px solid var(--tk-line);
  height: 100%;
  display: inline-flex;
  align-items: center;
  background: var(--tk-bg);
}
.tk-readout {
  display: flex;
  align-items: baseline;
  gap: 2px;
  height: 38px;
  padding: 0 12px;
  border-radius: 9px;
  background: var(--tk-bg);
  border: 1px dashed var(--tk-line);
}
.tk-readout-curr {
  font-size: 13px;
  color: var(--tk-ink-500);
}
.tk-readout-val {
  font-size: 18px;
  font-weight: 700;
  background: var(--tk-grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-feature-settings: 'tnum';
}

/* Quota presets */
.tk-quota-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.tk-quota-presets button {
  padding: 4px 10px;
  border: 1px solid var(--tk-line);
  border-radius: 6px;
  background: white;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--tk-ink-500);
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition: all 0.12s;
}
.tk-quota-presets button:hover {
  color: var(--tk-blue-1);
  border-color: rgba(0, 114, 255, 0.3);
  background: var(--tk-grad-softer);
}

/* Semi UI overrides — group/model selects + datepicker
   Single border on outermost element only; inner wrappers are border-less. */
.tk-root .semi-select,
.tk-root .semi-datepicker {
  width: 100% !important;
}
.tk-root .semi-select,
.tk-root .semi-datepicker .semi-input-wrapper,
.tk-root .semi-input-wrapper {
  border: 1px solid var(--tk-line) !important;
  border-radius: 9px !important;
  min-height: 38px !important;
  background: white !important;
  box-shadow: none !important;
  transition: all 0.12s;
  outline: none !important;
}
.tk-root .semi-select-selection,
.tk-root .semi-select-selection-multiple {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  min-height: 36px !important;
  padding: 0 8px !important;
}
.tk-root .semi-select:hover,
.tk-root .semi-datepicker:hover .semi-input-wrapper,
.tk-root .semi-input-wrapper:hover {
  border-color: rgba(0, 114, 255, 0.3) !important;
}
.tk-root .semi-select-focus,
.tk-root .semi-select-open,
.tk-root .semi-input-wrapper-focus,
.tk-root .semi-datepicker .semi-input-wrapper-focus {
  border-color: rgba(0, 114, 255, 0.5) !important;
  box-shadow: 0 0 0 3px rgba(0, 114, 255, 0.1) !important;
}
.tk-root .semi-select-focus .semi-select-selection,
.tk-root .semi-select-open .semi-select-selection {
  border: none !important;
  box-shadow: none !important;
}
.tk-root .semi-select-selection-text,
.tk-root .semi-input {
  font-size: 13px !important;
  color: var(--tk-ink-900) !important;
}
.tk-root .semi-tag {
  background: var(--tk-grad-soft) !important;
  border: 1px solid rgba(0, 114, 255, 0.2) !important;
  border-radius: 6px !important;
  color: var(--tk-blue-1) !important;
  font-family: 'JetBrains Mono', ui-monospace, monospace !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  padding: 2px 4px 2px 8px !important;
}
.tk-root .semi-tag .semi-tag-close {
  color: var(--tk-blue-1) !important;
}

/* Footer */
.tk-foot {
  padding: 14px 24px;
  border-top: 1px solid var(--tk-line);
  background: #fbfcfe;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.tk-summary {
  font-size: 11.5px;
  color: var(--tk-ink-500);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}
.tk-summary strong {
  color: var(--tk-blue-1);
  font-weight: 700;
}
.tk-summary-sep {
  color: var(--tk-ink-300);
}
.tk-actions {
  display: flex;
  gap: 8px;
  flex: none;
}
.tk-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 36px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  font-family: inherit;
  white-space: nowrap;
}
.tk-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.tk-btn-ghost {
  background: white;
  color: var(--tk-ink-700);
  border-color: var(--tk-line);
}
.tk-btn-ghost:hover:not(:disabled) {
  color: var(--tk-blue-1);
  border-color: rgba(0, 114, 255, 0.3);
}
.tk-btn-primary {
  background: var(--tk-grad);
  color: white;
  box-shadow: 0 4px 12px -3px rgba(0, 114, 255, 0.4);
}
.tk-btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: 0 6px 16px -3px rgba(0, 114, 255, 0.5);
}

@media (max-width: 640px) {
  .tk-head,
  .tk-body,
  .tk-foot {
    padding-left: 16px;
    padding-right: 16px;
  }
  .tk-grid-2 {
    grid-template-columns: 1fr;
  }
  .tk-foot {
    flex-direction: column;
    align-items: stretch;
  }
  .tk-summary {
    justify-content: center;
  }
  .tk-actions {
    justify-content: flex-end;
  }
}
`;

export const TkIcons = {
  Key: (p) => (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <circle cx='8' cy='15' r='4' />
      <path d='m11 12 9-9 2 2-2 2 2 2-3 3-3-3' />
    </svg>
  ),
  Close: (p) => (
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
      <path d='M6 6l12 12M18 6 6 18' />
    </svg>
  ),
  Plus: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      {...p}
    >
      <path d='M12 5v14M5 12h14' />
    </svg>
  ),
  AlertTriangle: (p) => (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' />
      <path d='M12 9v4M12 17h.01' />
    </svg>
  ),
  Save: (p) => (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...p}
    >
      <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' />
      <path d='M17 21v-8H7v8M7 3v5h8' />
    </svg>
  ),
};

export const TokenDrawerStyles = () => <style>{TOKEN_DRAWER_STYLES}</style>;
