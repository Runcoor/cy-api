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

import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Input,
  ScrollList,
  ScrollItem,
} from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
  IconFile,
  IconCopy,
} from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
} from '@lobehub/icons';

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const endpointItems = API_ENDPOINTS.map((e) => ({ value: e }));
  const [endpointIndex, setEndpointIndex] = useState(0);
  const isChinese = i18n.language.startsWith('zh');

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // 如果内容是 URL，则发送主题模式
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      showSuccess(t('已复制到剪切板'));
    }
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  /* ---- Provider icon data (avoids 20x copy-paste divs) ---- */
  const providerIcons = [
    <Moonshot size={36} key="moonshot" />,
    <OpenAI size={36} key="openai" />,
    <XAI size={36} key="xai" />,
    <Zhipu.Color size={36} key="zhipu" />,
    <Volcengine.Color size={36} key="volcengine" />,
    <Cohere.Color size={36} key="cohere" />,
    <Claude.Color size={36} key="claude" />,
    <Gemini.Color size={36} key="gemini" />,
    <Suno size={36} key="suno" />,
    <Minimax.Color size={36} key="minimax" />,
    <Wenxin.Color size={36} key="wenxin" />,
    <Spark.Color size={36} key="spark" />,
    <Qingyan.Color size={36} key="qingyan" />,
    <DeepSeek.Color size={36} key="deepseek" />,
    <Qwen.Color size={36} key="qwen" />,
    <Midjourney size={36} key="midjourney" />,
    <Grok size={36} key="grok" />,
    <AzureAI.Color size={36} key="azureai" />,
    <Hunyuan.Color size={36} key="hunyuan" />,
    <Xinference.Color size={36} key="xinference" />,
  ];

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full overflow-x-hidden'>
          {/* ===== Hero Section ===== */}
          <div
            className='w-full min-h-[520px] md:min-h-[600px] lg:min-h-[680px] relative overflow-hidden'
            style={{
              background: 'var(--bg-base)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div className='flex items-center justify-center h-full px-5 py-20 md:py-24 lg:py-32 mt-10'>
              {/* Centered content */}
              <div className='flex flex-col items-center justify-center text-center max-w-3xl mx-auto'>

                {/* Main heading — serif, restrained */}
                <div className='flex flex-col items-center justify-center mb-8 md:mb-10'>
                  <h1
                    className={`text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight ${isChinese ? 'tracking-wide' : ''}`}
                    style={{
                      fontFamily: 'var(--font-serif)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {t('统一的')}
                    <br />
                    <span style={{ color: 'var(--accent)' }}>
                      {t('大模型接口网关')}
                    </span>
                  </h1>

                  <p
                    className='text-sm md:text-base lg:text-lg mt-4 md:mt-5 max-w-lg'
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t('更好的价格，更好的稳定性，只需要将模型基址替换为：')}
                  </p>

                  {/* BASE URL input — macOS style */}
                  <div className='flex flex-col md:flex-row items-center justify-center gap-3 w-full mt-5 md:mt-6 max-w-md'>
                    <Input
                      readonly
                      value={serverAddress}
                      size={isMobile ? 'default' : 'large'}
                      style={{
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                      }}
                      suffix={
                        <div className='flex items-center gap-1.5'>
                          <ScrollList
                            bodyHeight={32}
                            style={{ border: 'unset', boxShadow: 'unset' }}
                          >
                            <ScrollItem
                              mode='wheel'
                              cycled={true}
                              list={endpointItems}
                              selectedIndex={endpointIndex}
                              onSelect={({ index }) => setEndpointIndex(index)}
                            />
                          </ScrollList>
                          <Button
                            type='primary'
                            onClick={handleCopyBaseURL}
                            icon={<IconCopy />}
                            style={{
                              borderRadius: 'var(--radius-sm)',
                              minWidth: '32px',
                              height: '32px',
                            }}
                          />
                        </div>
                      }
                    />
                  </div>
                </div>

                {/* CTA buttons — macOS restrained */}
                <div className='flex flex-row gap-3 justify-center items-center'>
                  <Link to='/console'>
                    <Button
                      theme='solid'
                      type='primary'
                      size={isMobile ? 'default' : 'large'}
                      icon={<IconPlay />}
                      style={{
                        borderRadius: 'var(--radius-md)',
                        padding: '0 24px',
                        background: 'var(--accent-gradient)',
                        border: 'none',
                      }}
                    >
                      {t('获取密钥')}
                    </Button>
                  </Link>
                  {isDemoSiteMode && statusState?.status?.version ? (
                    <Button
                      size={isMobile ? 'default' : 'large'}
                      icon={<IconGithubLogo />}
                      style={{
                        borderRadius: 'var(--radius-md)',
                        padding: '0 20px',
                        background: 'var(--surface-active)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)',
                      }}
                      onClick={() =>
                        window.open(
                          'https://github.com/QuantumNous/aggre-api',
                          '_blank',
                        )
                      }
                    >
                      {statusState.status.version}
                    </Button>
                  ) : (
                    docsLink && (
                      <Button
                        size={isMobile ? 'default' : 'large'}
                        icon={<IconFile />}
                        style={{
                          borderRadius: 'var(--radius-md)',
                          padding: '0 20px',
                          background: 'var(--surface-active)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-default)',
                        }}
                        onClick={() => window.open(docsLink, '_blank')}
                      >
                        {t('文档')}
                      </Button>
                    )
                  )}
                </div>

                {/* ===== Provider Icons Section ===== */}
                <div className='mt-14 md:mt-18 lg:mt-20 w-full'>
                  <p
                    className='text-xs uppercase tracking-widest mb-6 md:mb-8'
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {t('支持众多的大模型供应商')}
                  </p>
                  <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-5 md:gap-6 max-w-3xl mx-auto px-4'>
                    {providerIcons.map((icon, i) => (
                      <div
                        key={i}
                        className='w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center transition-colors duration-150'
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          opacity: 0.75,
                        }}
                      >
                        {icon}
                      </div>
                    ))}
                    <div
                      className='w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center'
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    >
                      <span
                        className='text-base sm:text-lg md:text-xl font-semibold'
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        30+
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
