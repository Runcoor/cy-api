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

import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';
import { API, showSuccess, showError } from '../../../../helpers';
import { UserContext } from '../../../../context/User';
import { normalizeLanguage } from '../../../../i18n/language';

// Language options with native names and a short 2-letter badge shown
// inside each option pill. The badge is purely visual, not a flag.
const languageOptions = [
  { value: 'zh-CN', label: '简体中文', shortCode: '中', english: 'Simplified Chinese' },
  { value: 'zh-TW', label: '繁體中文', shortCode: '繁', english: 'Traditional Chinese' },
  { value: 'en',    label: 'English',  shortCode: 'EN', english: 'English' },
  { value: 'fr',    label: 'Français', shortCode: 'FR', english: 'French' },
  { value: 'ru',    label: 'Русский',  shortCode: 'RU', english: 'Russian' },
  { value: 'ja',    label: '日本語',   shortCode: '日', english: 'Japanese' },
  { value: 'vi',    label: 'Tiếng Việt', shortCode: 'VI', english: 'Vietnamese' },
];

const PreferencesSettings = ({ t }) => {
  const { i18n } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  const [currentLanguage, setCurrentLanguage] = useState(
    normalizeLanguage(i18n.language) || 'zh-CN',
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userState?.user?.setting) {
      try {
        const settings = JSON.parse(userState.user.setting);
        if (settings.language) {
          const lang = normalizeLanguage(settings.language);
          setCurrentLanguage(lang);
          if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [userState?.user?.setting, i18n]);

  const handleLanguagePreferenceChange = async (lang) => {
    if (lang === currentLanguage) return;

    setLoading(true);
    const previousLang = currentLanguage;

    try {
      setCurrentLanguage(lang);
      i18n.changeLanguage(lang);
      localStorage.setItem('i18nextLng', lang);

      const res = await API.put('/api/user/self', { language: lang });

      if (res.data.success) {
        showSuccess(t('语言偏好已保存'));
        let settings = {};
        if (userState?.user?.setting) {
          try {
            settings = JSON.parse(userState.user.setting) || {};
          } catch (e) {
            settings = {};
          }
        }
        settings.language = lang;
        const nextUser = { ...userState.user, setting: JSON.stringify(settings) };
        userDispatch({ type: 'login', payload: nextUser });
        localStorage.setItem('user', JSON.stringify(nextUser));
      } else {
        showError(res.data.message || t('保存失败'));
        setCurrentLanguage(previousLang);
        i18n.changeLanguage(previousLang);
        localStorage.setItem('i18nextLng', previousLang);
      }
    } catch (error) {
      showError(t('保存失败，请重试'));
      setCurrentLanguage(previousLang);
      i18n.changeLanguage(previousLang);
      localStorage.setItem('i18nextLng', previousLang);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      {/* Section header — two-column layout matching the rest of the page */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
        <div className='lg:col-span-1'>
          <h2
            className='mb-3'
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "PingFang SC", sans-serif',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {t('偏好与界面')}
          </h2>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--text-muted)',
              margin: '8px 0 0 0',
            }}
          >
            {t(
              '自定义界面语言、主题等偏好设置。语言偏好会同步到您登录的所有设备。',
            )}
          </p>
        </div>

        <div className='lg:col-span-2 flex flex-col gap-3'>
          {/* Language preference card */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
            }}
          >
            <div className='flex items-center gap-3 mb-4'>
              <div
                className='flex items-center justify-center flex-shrink-0'
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                }}
              >
                <Globe size={18} />
              </div>
              <div className='flex-grow min-w-0'>
                <h4
                  className='mb-0'
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {t('显示语言')}
                </h4>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    margin: '2px 0 0 0',
                  }}
                >
                  {t('当前使用')}:{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {
                      languageOptions.find((o) => o.value === currentLanguage)
                        ?.label || currentLanguage
                    }
                  </span>
                </p>
              </div>
            </div>

            <div
              className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2'
            >
              {languageOptions.map((opt) => {
                const active = currentLanguage === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleLanguagePreferenceChange(opt.value)}
                    disabled={loading}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${active ? 'transparent' : 'var(--border-default)'}`,
                      background: active
                        ? 'var(--accent-light)'
                        : 'var(--bg-subtle)',
                      color: active ? 'var(--accent)' : 'var(--text-primary)',
                      cursor: loading ? 'wait' : 'pointer',
                      opacity: loading && !active ? 0.5 : 1,
                      transition:
                        'background-color var(--ease-micro), border-color var(--ease-micro), transform var(--ease-micro)',
                      textAlign: 'left',
                      minHeight: 48,
                      boxShadow: active
                        ? '0 0 0 1px var(--accent), 0 4px 12px -4px rgba(0,114,255,0.2)'
                        : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!active && !loading) {
                        e.currentTarget.style.borderColor =
                          'color-mix(in srgb, var(--border-default) 150%, transparent)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor =
                          'var(--border-default)';
                      }
                    }}
                  >
                    {/* Two-letter code pill */}
                    <span
                      style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: active
                          ? 'var(--accent-gradient)'
                          : 'var(--surface)',
                        color: active ? '#fff' : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: opt.shortCode.length > 1 ? '0.04em' : 0,
                        border: active
                          ? 'none'
                          : '1px solid var(--border-default)',
                      }}
                    >
                      {opt.shortCode}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {opt.label}
                    </span>
                    {active && (
                      <Check
                        size={14}
                        style={{
                          flexShrink: 0,
                          color: 'var(--accent)',
                          strokeWidth: 3,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <p
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                margin: '12px 0 0 0',
                lineHeight: 1.5,
              }}
            >
              {t('提示：语言偏好会同步到您登录的所有设备，并影响API返回的错误消息语言。')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreferencesSettings;
