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

const bars = Array.from({ length: 12 });

const sizeMap = {
  small: 'mv-loader-small',
  medium: 'mv-loader-medium',
  large: 'mv-loader-large',
};

/**
 * macOS-style 12-bar radiating activity indicator.
 *
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {boolean} fullscreen - If true, covers entire viewport (initial app load).
 *                                If false (default), fills parent container (route Suspense).
 */
const Loading = ({ size = 'medium', fullscreen = false }) => {
  const className = fullscreen
    ? 'fixed inset-0 w-screen h-screen flex items-center justify-center'
    : 'flex items-center justify-center w-full';

  return (
    <div
      className={className}
      style={{
        background: fullscreen ? 'var(--bg-base)' : 'transparent',
        minHeight: fullscreen ? undefined : '320px',
      }}
    >
      <div className={`mv-loader ${sizeMap[size] || sizeMap.medium}`}>
        {bars.map((_, i) => (
          <span key={i} className='mv-loader-bar' />
        ))}
      </div>
    </div>
  );
};

export default Loading;
