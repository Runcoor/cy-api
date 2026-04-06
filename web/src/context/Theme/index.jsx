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

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
} from 'react';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

const ActualThemeContext = createContext(null);
export const useActualTheme = () => useContext(ActualThemeContext);

const SetThemeContext = createContext(null);
export const useSetTheme = () => useContext(SetThemeContext);

const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
};

/**
 * Apply theme to DOM — sets html.dark class, body theme-mode attribute,
 * and updates meta theme-color for the browser chrome.
 */
const applyThemeToDOM = (resolvedTheme) => {
  const html = document.documentElement;
  const body = document.body;
  const meta = document.getElementById('meta-theme-color');

  if (resolvedTheme === 'dark') {
    html.classList.add('dark');
    body.setAttribute('theme-mode', 'dark');
    if (meta) meta.setAttribute('content', '#1c1c1e');
  } else {
    html.classList.remove('dark');
    body.removeAttribute('theme-mode');
    if (meta) meta.setAttribute('content', '#F5F5F7');
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, _setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme-mode') || 'auto';
    } catch {
      return 'auto';
    }
  });

  const [systemTheme, setSystemTheme] = useState(getSystemTheme());

  const actualTheme = theme === 'auto' ? systemTheme : theme;

  // Listen for system theme changes (for auto mode)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleSystemThemeChange = (e) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);

      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, []);

  // Apply theme to DOM synchronously to avoid flash.
  // The inline script in index.html handles the very first paint;
  // useLayoutEffect handles React-driven updates (toggle, system change).
  useLayoutEffect(() => {
    applyThemeToDOM(actualTheme);
  }, [actualTheme]);

  const setTheme = useCallback((newTheme) => {
    let themeValue;

    if (typeof newTheme === 'boolean') {
      // Backward compatibility with boolean parameter
      themeValue = newTheme ? 'dark' : 'light';
    } else if (typeof newTheme === 'string') {
      themeValue = newTheme;
    } else {
      themeValue = 'auto';
    }

    _setTheme(themeValue);
    localStorage.setItem('theme-mode', themeValue);
  }, []);

  return (
    <SetThemeContext.Provider value={setTheme}>
      <ActualThemeContext.Provider value={actualTheme}>
        <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
      </ActualThemeContext.Provider>
    </SetThemeContext.Provider>
  );
};
