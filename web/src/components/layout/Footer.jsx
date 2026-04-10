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

import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { getFooterHTML, getLogo, getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';

const footerLinkStyle = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '13px',
  transition: 'color 150ms ease-out',
};

const footerLinkHover = (e) => {
  e.currentTarget.style.color = 'var(--text-primary)';
};
const footerLinkLeave = (e) => {
  e.currentTarget.style.color = 'var(--text-secondary)';
};

const sectionTitleStyle = {
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-serif)',
  fontWeight: 600,
  fontSize: '13px',
  marginBottom: '12px',
  letterSpacing: '-0.01em',
};

const FooterBar = () => {
  const { t } = useTranslation();
  const [footer, setFooter] = useState(getFooterHTML());
  const systemName = getSystemName();
  const logo = getLogo();
  const [statusState] = useContext(StatusContext);
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;

  const loadFooter = () => {
    let footer_html = localStorage.getItem('footer_html');
    if (footer_html) {
      setFooter(footer_html);
    }
  };

  const currentYear = new Date().getFullYear();

  const customFooter = useMemo(
    () => (
      <footer
        className='w-full'
        style={{
          padding: '40px 24px 24px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div className='max-w-5xl mx-auto'>
          {isDemoSiteMode && (
            <div className='flex flex-col md:flex-row justify-between w-full mb-10 gap-8'>
              <div className='flex-shrink-0'>
                <img
                  src={logo}
                  alt={systemName}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full'>
                <div className='text-left'>
                  <p style={sectionTitleStyle}>
                    {t('关于我们')}
                  </p>
                  <div className='flex flex-col gap-3'>
                    <a
                      href='https://docs.newapi.pro/wiki/project-introduction/'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      {t('关于项目')}
                    </a>
                    <a
                      href='https://docs.newapi.pro/support/community-interaction/'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      {t('联系我们')}
                    </a>
                    <a
                      href='https://docs.newapi.pro/wiki/features-introduction/'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      {t('功能特性')}
                    </a>
                  </div>
                </div>

                <div className='text-left'>
                  <p style={sectionTitleStyle}>
                    {t('文档')}
                  </p>
                  <div className='flex flex-col gap-3'>
                    <a
                      href='https://docs.newapi.pro/getting-started/'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      {t('快速开始')}
                    </a>
                    <a
                      href='https://docs.newapi.pro/installation/'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      {t('安装指南')}
                    </a>
                    <a
                      href='https://docs.newapi.pro/api/'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      {t('API 文档')}
                    </a>
                  </div>
                </div>

                <div className='text-left'>
                  <p style={sectionTitleStyle}>
                    {t('相关项目')}
                  </p>
                  <div className='flex flex-col gap-3'>
                    <a
                      href='https://github.com/songquanpeng/one-api'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      One API
                    </a>
                    <a
                      href='https://github.com/novicezk/midjourney-proxy'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      Midjourney-Proxy
                    </a>
                    <a
                      href='https://github.com/QuantumNous/neko-api-key-tool'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      neko-api-key-tool
                    </a>
                  </div>
                </div>

                <div className='text-left'>
                  <p style={sectionTitleStyle}>
                    {t('友情链接')}
                  </p>
                  <div className='flex flex-col gap-3'>
                    <a
                      href='https://github.com/QuantumNous/aggre-api-horizon'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      aggre-api-horizon
                    </a>
                    <a
                      href='https://github.com/coaidev/coai'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      CoAI
                    </a>
                    <a
                      href='https://www.gpt-load.com/'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={footerLinkStyle}
                      onMouseEnter={footerLinkHover}
                      onMouseLeave={footerLinkLeave}
                    >
                      GPT-Load
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Copyright and credits are shown on the public homepage;
              no need to duplicate them in this layout footer. */}
        </div>
      </footer>
    ),
    [logo, systemName, t, currentYear, isDemoSiteMode],
  );

  useEffect(() => {
    loadFooter();
  }, []);

  return (
    <div className='w-full'>
      {footer ? (
        <footer
          className='w-full'
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div className='flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mx-auto gap-4'>
            <div
              className='custom-footer na-cb6feafeb3990c78'
              style={{ color: 'var(--text-muted)', fontSize: '12px' }}
              dangerouslySetInnerHTML={{ __html: footer }}
            ></div>
            {/* "设计与开发由" credit removed — shown on the public homepage */}
          </div>
        </footer>
      ) : (
        customFooter
      )}
    </div>
  );
};

export default FooterBar;
