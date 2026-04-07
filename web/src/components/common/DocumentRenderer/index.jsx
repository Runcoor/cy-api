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

import React, { useEffect, useState } from 'react';
import { API, showError } from '../../../helpers';
import { Empty } from '@douyinfe/semi-ui';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import { useTranslation } from 'react-i18next';
import MarkdownRenderer from '../markdown/MarkdownRenderer';

// 检查是否为 URL
const isUrl = (content) => {
  try {
    new URL(content.trim());
    return true;
  } catch {
    return false;
  }
};

// 检查是否为 HTML 内容
const isHtmlContent = (content) => {
  if (!content || typeof content !== 'string') return false;

  // 检查是否包含HTML标签
  const htmlTagRegex = /<\/?[a-z][\s\S]*>/i;
  return htmlTagRegex.test(content);
};

// 安全地渲染HTML内容
const sanitizeHtml = (html) => {
  // 创建一个临时元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // 提取样式
  const styles = Array.from(tempDiv.querySelectorAll('style'))
    .map((style) => style.innerHTML)
    .join('\n');

  // 提取body内容，如果没有body标签则使用全部内容
  const bodyContent = tempDiv.querySelector('body');
  const content = bodyContent ? bodyContent.innerHTML : html;

  return { content, styles };
};

/* ─── Shared panel wrapper ─── */
const DocumentPanel = ({ title, children }) => (
  <div className='min-h-screen' style={{ background: 'var(--bg-base)' }}>
    <div className='max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
      <div
        className='overflow-hidden'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Panel header — serif title with subtle separator */}
        <div
          className='px-8 py-5'
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h2
            className='text-center text-xl font-semibold'
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h2>
        </div>
        {/* Panel body */}
        <div className='px-8 py-6'>
          {children}
        </div>
      </div>
    </div>
  </div>
);

/**
 * 通用文档渲染组件
 * @param {string} apiEndpoint - API 接口地址
 * @param {string} title - 文档标题
 * @param {string} cacheKey - 本地存储缓存键
 * @param {string} emptyMessage - 空内容时的提示消息
 */
const DocumentRenderer = ({ apiEndpoint, title, cacheKey, emptyMessage }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [htmlStyles, setHtmlStyles] = useState('');
  const [processedHtmlContent, setProcessedHtmlContent] = useState('');

  const loadContent = async () => {
    // 先从缓存中获取
    const cachedContent = localStorage.getItem(cacheKey) || '';
    if (cachedContent) {
      setContent(cachedContent);
      processContent(cachedContent);
      setLoading(false);
    }

    try {
      const res = await API.get(apiEndpoint);
      const { success, message, data } = res.data;
      if (success && data) {
        setContent(data);
        processContent(data);
        localStorage.setItem(cacheKey, data);
      } else {
        if (!cachedContent) {
          showError(message || emptyMessage);
          setContent('');
        }
      }
    } catch (error) {
      if (!cachedContent) {
        showError(emptyMessage);
        setContent('');
      }
    } finally {
      setLoading(false);
    }
  };

  const processContent = (rawContent) => {
    if (isHtmlContent(rawContent)) {
      const { content: htmlContent, styles } = sanitizeHtml(rawContent);
      setProcessedHtmlContent(htmlContent);
      setHtmlStyles(styles);
    } else {
      setProcessedHtmlContent('');
      setHtmlStyles('');
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // 处理HTML样式注入
  useEffect(() => {
    const styleId = `document-renderer-styles-${cacheKey}`;

    if (htmlStyles) {
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.type = 'text/css';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = htmlStyles;
    } else {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    }

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [htmlStyles, cacheKey]);

  // 显示加载状态 — macOS activity indicator
  if (loading) {
    const loaderBars = Array.from({ length: 12 });
    return (
      <div
        className='flex flex-col items-center justify-center min-h-screen gap-3'
        style={{ background: 'var(--bg-base)' }}
      >
        <div className='mv-loader mv-loader-large'>
          {loaderBars.map((_, i) => (
            <span key={i} className='mv-loader-bar' />
          ))}
        </div>
      </div>
    );
  }

  // 如果没有内容，显示空状态
  if (!content || content.trim() === '') {
    return (
      <div className='flex justify-center items-center min-h-screen' style={{ background: 'var(--bg-base)' }}>
        <Empty
          title={t('管理员未设置' + title + '内容')}
          image={
            <IllustrationConstruction style={{ width: 150, height: 150 }} />
          }
          darkModeImage={
            <IllustrationConstructionDark style={{ width: 150, height: 150 }} />
          }
          className='p-8'
        />
      </div>
    );
  }

  // 如果是 URL，显示链接卡片 — macOS panel style
  if (isUrl(content)) {
    return (
      <div
        className='flex justify-center items-center min-h-screen p-4'
        style={{ background: 'var(--bg-base)' }}
      >
        <div
          className='max-w-md w-full overflow-hidden'
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          {/* Card header */}
          <div
            className='px-6 py-4'
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h3
              className='text-center text-lg font-semibold'
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h3>
          </div>
          {/* Card body */}
          <div className='px-6 py-6 text-center'>
            <p
              className='text-sm mb-5'
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('管理员设置了外部链接，点击下方按钮访问')}
            </p>
            <a
              href={content.trim()}
              target='_blank'
              rel='noopener noreferrer'
              title={content.trim()}
              aria-label={`${t('访问' + title)}: ${content.trim()}`}
              className='inline-block px-6 py-2.5 text-sm font-medium'
              style={{
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                transition: 'opacity 150ms ease-out',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {t('访问' + title)}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 如果是 HTML 内容，直接渲染
  if (isHtmlContent(content)) {
    const { content: htmlContent, styles } = sanitizeHtml(content);

    // 设置样式（如果有的话）
    useEffect(() => {
      if (styles && styles !== htmlStyles) {
        setHtmlStyles(styles);
      }
    }, [content, styles, htmlStyles]);

    return (
      <DocumentPanel title={title}>
        <div
          className='prose prose-lg max-w-none'
          style={{ color: 'var(--text-primary)', fontSize: '14px' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </DocumentPanel>
    );
  }

  // 其他内容统一使用 Markdown 渲染器
  return (
    <DocumentPanel title={title}>
      <div
        className='prose prose-lg max-w-none'
        style={{ color: 'var(--text-primary)', fontSize: '14px' }}
      >
        <MarkdownRenderer content={content} />
      </div>
    </DocumentPanel>
  );
};

export default DocumentRenderer;
