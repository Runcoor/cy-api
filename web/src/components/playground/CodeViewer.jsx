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

import React, { useState, useMemo, useCallback } from 'react';
import { Button, Tooltip, Toast } from '@douyinfe/semi-ui';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { copy } from '../../helpers';

const PERFORMANCE_CONFIG = {
  MAX_DISPLAY_LENGTH: 50000, // 最大显示字符数
  PREVIEW_LENGTH: 5000, // 预览长度
  VERY_LARGE_MULTIPLIER: 2, // 超大内容倍数
};

/* ---------- Theme-aware style objects ---------- */
const codeThemeStyles = {
  container: {
    backgroundColor: 'var(--bg-base)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '1.4',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-default)',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'auto',
    padding: '16px',
    margin: 0,
    whiteSpace: 'pre',
    wordBreak: 'normal',
    background: 'var(--bg-base)',
  },
  actionButton: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'var(--surface-active)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    transition: 'background-color 150ms ease-out',
  },
  actionButtonHover: {
    backgroundColor: 'var(--surface-hover)',
    borderColor: 'var(--border-default)',
  },
  noContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontStyle: 'italic',
    backgroundColor: 'var(--surface-hover)',
    borderRadius: 'var(--radius-md)',
  },
  performanceWarning: {
    padding: '8px 12px',
    backgroundColor: 'var(--warning-light)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--warning)',
    fontSize: '12px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

const escapeHtml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/*
 * JSON syntax highlighting using CSS variables for theme-awareness.
 * We use classes instead of inline colors, styled via index.css.
 * Fallback: semantic inline colors that work in both light & dark.
 */
const highlightJson = (str) => {
  const tokenRegex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(str)) !== null) {
    // Escape non-token text (structural chars like {, }, [, ], :, comma, whitespace)
    result += escapeHtml(str.slice(lastIndex, match.index));

    const token = match[0];
    let cls = 'mv-json-number';
    if (/^"/.test(token)) {
      cls = /:$/.test(token) ? 'mv-json-key' : 'mv-json-string';
    } else if (/true|false|null/.test(token)) {
      cls = 'mv-json-keyword';
    }
    // Escape token content before wrapping in span
    result += `<span class="${cls}">${escapeHtml(token)}</span>`;
    lastIndex = tokenRegex.lastIndex;
  }

  // Escape remaining text
  result += escapeHtml(str.slice(lastIndex));
  return result;
};

const linkRegex = /(https?:\/\/(?:[^\s<"'\]),;&}]|&amp;)+)/g;

const linkifyHtml = (html) => {
  const parts = html.split(/(<[^>]+>)/g);
  return parts
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part.replace(
        linkRegex,
        (url) => `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`,
      );
    })
    .join('');
};

const isJsonLike = (content, language) => {
  if (language === 'json') return true;
  const trimmed = content.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
};

const formatContent = (content) => {
  if (!content) return '';

  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      return String(content);
    }
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return content;
    }
  }

  return String(content);
};

const CodeViewer = ({ content, title, language = 'json' }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isHoveringCopy, setIsHoveringCopy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formattedContent = useMemo(() => formatContent(content), [content]);

  const contentMetrics = useMemo(() => {
    const length = formattedContent.length;
    const isLarge = length > PERFORMANCE_CONFIG.MAX_DISPLAY_LENGTH;
    const isVeryLarge =
      length >
      PERFORMANCE_CONFIG.MAX_DISPLAY_LENGTH *
        PERFORMANCE_CONFIG.VERY_LARGE_MULTIPLIER;
    return { length, isLarge, isVeryLarge };
  }, [formattedContent.length]);

  const displayContent = useMemo(() => {
    if (!contentMetrics.isLarge || isExpanded) {
      return formattedContent;
    }
    return (
      formattedContent.substring(0, PERFORMANCE_CONFIG.PREVIEW_LENGTH) +
      '\n\n// ... 内容被截断以提升性能 ...'
    );
  }, [formattedContent, contentMetrics.isLarge, isExpanded]);

  const highlightedContent = useMemo(() => {
    if (contentMetrics.isVeryLarge && !isExpanded) {
      return escapeHtml(displayContent);
    }

    if (isJsonLike(displayContent, language)) {
      return highlightJson(displayContent);
    }

    return escapeHtml(displayContent);
  }, [displayContent, language, contentMetrics.isVeryLarge, isExpanded]);

  const renderedContent = useMemo(() => {
    return linkifyHtml(highlightedContent);
  }, [highlightedContent]);

  const handleCopy = useCallback(async () => {
    try {
      const textToCopy =
        typeof content === 'object' && content !== null
          ? JSON.stringify(content, null, 2)
          : content;

      const success = await copy(textToCopy);
      setCopied(true);
      Toast.success(t('已复制到剪贴板'));
      setTimeout(() => setCopied(false), 2000);

      if (!success) {
        throw new Error('Copy operation failed');
      }
    } catch (err) {
      Toast.error(t('复制失败'));
      console.error('Copy failed:', err);
    }
  }, [content, t]);

  const handleToggleExpand = useCallback(() => {
    if (contentMetrics.isVeryLarge && !isExpanded) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsExpanded(true);
        setIsProcessing(false);
      }, 100);
    } else {
      setIsExpanded(!isExpanded);
    }
  }, [isExpanded, contentMetrics.isVeryLarge]);

  if (!content) {
    const placeholderText =
      {
        preview: t('正在构造请求体预览...'),
        request: t('暂无请求数据'),
        response: t('暂无响应数据'),
      }[title] || t('暂无数据');

    return (
      <div style={codeThemeStyles.noContent}>
        <span>{placeholderText}</span>
      </div>
    );
  }

  const warningTop = contentMetrics.isLarge ? '52px' : '12px';
  const contentPadding = contentMetrics.isLarge ? '52px' : '16px';

  return (
    <div style={codeThemeStyles.container} className='h-full'>
      {/* Performance warning */}
      {contentMetrics.isLarge && (
        <div style={codeThemeStyles.performanceWarning}>
          <span style={{ color: 'var(--warning)' }}>&#9889;</span>
          <span>
            {contentMetrics.isVeryLarge
              ? t('内容较大，已启用性能优化模式')
              : t('内容较大，部分功能可能受限')}
          </span>
        </div>
      )}

      {/* Copy button */}
      <div
        style={{
          ...codeThemeStyles.actionButton,
          ...(isHoveringCopy ? codeThemeStyles.actionButtonHover : {}),
          top: warningTop,
          right: '12px',
        }}
        onMouseEnter={() => setIsHoveringCopy(true)}
        onMouseLeave={() => setIsHoveringCopy(false)}
      >
        <Tooltip content={copied ? t('已复制') : t('复制代码')}>
          <Button
            icon={<Copy size={14} />}
            onClick={handleCopy}
            size='small'
            theme='borderless'
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: copied ? 'var(--success)' : 'var(--text-secondary)',
              padding: '6px',
            }}
          />
        </Tooltip>
      </div>

      {/* Code content */}
      <div
        style={{
          ...codeThemeStyles.content,
          paddingTop: contentPadding,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        className='model-settings-scroll'
      >
        {isProcessing ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: 'var(--text-muted)',
              gap: '10px',
            }}
          >
            <div className='mv-loader' style={{ width: '20px', height: '20px' }} />
            {t('正在处理大内容...')}
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
        )}
      </div>

      {/* Expand/collapse button */}
      {contentMetrics.isLarge && !isProcessing && (
        <div
          style={{
            ...codeThemeStyles.actionButton,
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Tooltip content={isExpanded ? t('收起内容') : t('显示完整内容')}>
            <Button
              icon={
                isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
              }
              onClick={handleToggleExpand}
              size='small'
              theme='borderless'
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '6px 12px',
              }}
            >
              {isExpanded ? t('收起') : t('展开')}
              {!isExpanded && (
                <span
                  style={{ fontSize: '11px', opacity: 0.7, marginLeft: '4px' }}
                >
                  (+
                  {Math.round(
                    (contentMetrics.length -
                      PERFORMANCE_CONFIG.PREVIEW_LENGTH) /
                      1000,
                  )}
                  K)
                </span>
              )}
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default CodeViewer;
