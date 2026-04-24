/*
Copyright (C) 2025 QuantumNous

Mobile-only social-post modal. Fullscreen, vertical layout, big tap
targets. Independent state from desktop.
*/

import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Popconfirm, Spin, Tag } from '@douyinfe/semi-ui';
import {
  IconClose,
  IconImage,
  IconRefresh,
  IconDownload,
} from '@douyinfe/semi-icons';
import { API, showError, showSuccess } from '../../../helpers';

const SOCIAL_KIND_LABELS = {
  image_only: '纯图卡片',
  text_image: '图文笔记',
};

const MobileSocialPostModal = ({ briefing, onClose, t }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef(null);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchPost = async (id) => {
    const res = await API.get(`/api/ai-news/admin/briefings/${id}/social`);
    if (!res?.data?.success) return null;
    return res.data.data?.exists ? res.data.data.post : null;
  };

  const startPoll = (id) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const p = await fetchPost(id);
        if (!p) return;
        setPost(p);
        if (p.status === 'ready') {
          stopPoll();
          setGenerating(false);
          showSuccess(t('生成完成'));
        } else if (p.status === 'failed') {
          stopPoll();
          setGenerating(false);
          showError(p.error_msg || t('生成失败'));
        }
      } catch (e) {
        // transient
      }
    }, 4000);
  };

  useEffect(() => {
    if (!briefing) {
      stopPoll();
      setPost(null);
      setGenerating(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await fetchPost(briefing.id);
        if (cancelled) return;
        setPost(p);
        if (p?.status === 'generating') {
          setGenerating(true);
          startPoll(briefing.id);
        }
      } catch (e) {
        // first-time = no row yet, OK
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      stopPoll();
    };
  }, [briefing]);

  const onGenerate = async () => {
    if (!briefing) return;
    setGenerating(true);
    try {
      const res = await API.post(`/api/ai-news/admin/briefings/${briefing.id}/social`);
      if (res?.data?.success) {
        setPost(res.data.data);
        startPoll(briefing.id);
      } else {
        setGenerating(false);
        showError(res?.data?.message || t('生成失败'));
      }
    } catch (e) {
      setGenerating(false);
      showError(e);
    }
  };

  const onDownload = () => {
    if (!briefing) return;
    window.open(
      `/api/ai-news/admin/briefings/${briefing.id}/social/zip`,
      '_blank',
    );
  };

  const status = post?.status || null;
  const isReady = status === 'ready';
  const isFailed = status === 'failed';
  const isGenerating = status === 'generating' || generating;
  const isBusy = loading || isGenerating;

  return (
    <Modal
      visible={!!briefing}
      onCancel={onClose}
      fullScreen
      footer={null}
      header={null}
      title={null}
      bodyStyle={{ padding: 0, height: '100%', overflow: 'hidden' }}
    >
      {!briefing ? null : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--surface, #fff)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Button
              icon={<IconClose />}
              theme='borderless'
              size='small'
              onClick={onClose}
            />
            <Tag color='violet' size='small'>{t('社交发布')}</Tag>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              #{briefing.id}
            </span>
            <div style={{ flex: 1 }} />
            {isReady ? (
              <Popconfirm
                title={t('重新生成会替换现有图片,是否继续?')}
                onConfirm={onGenerate}
              >
                <Button
                  size='small'
                  theme='borderless'
                  icon={<IconRefresh />}
                  loading={isGenerating}
                />
              </Popconfirm>
            ) : null}
            {isFailed ? (
              <Button
                size='small'
                theme='borderless'
                icon={<IconRefresh />}
                onClick={onGenerate}
                loading={isGenerating}
              />
            ) : null}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isBusy ? (
              <LoadingPane generating={isGenerating} t={t} />
            ) : isFailed ? (
              <FailedPane post={post} onGenerate={onGenerate} t={t} />
            ) : isReady ? (
              <ReadyPane post={post} t={t} />
            ) : (
              <EmptyPane onGenerate={onGenerate} t={t} />
            )}
          </div>

          {/* Sticky download */}
          {isReady ? (
            <div
              style={{
                padding: '10px 12px max(10px, env(safe-area-inset-bottom))',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--surface, #fff)',
              }}
            >
              <Button
                theme='solid'
                type='primary'
                icon={<IconDownload />}
                onClick={onDownload}
                size='large'
                block
              >
                {t('下载 ZIP')}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
};

const LoadingPane = ({ generating, t }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 40,
      color: 'var(--text-muted)',
      minHeight: 320,
    }}
  >
    <Spin size='large' />
    <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
      {generating
        ? t('后台正在生成,大约 1 到 3 分钟,你可以关闭此窗口稍后回来查看...')
        : t('加载中...')}
    </div>
  </div>
);

const FailedPane = ({ post, onGenerate, t }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 24,
      minHeight: 360,
    }}
  >
    <div style={{ fontSize: 14, color: 'var(--semi-color-danger)', fontWeight: 600 }}>
      {t('生成失败')}
    </div>
    <div
      style={{
        fontSize: 12,
        color: 'var(--text-primary)',
        background: 'var(--semi-color-danger-light-default, #fef2f2)',
        border: '1px solid var(--semi-color-danger-light-active, #fecaca)',
        borderRadius: 8,
        padding: '10px 12px',
        width: '100%',
        wordBreak: 'break-word',
        lineHeight: 1.6,
      }}
    >
      {post?.error_msg || t('未知错误')}
    </div>
    <Button
      theme='solid'
      type='primary'
      icon={<IconRefresh />}
      onClick={onGenerate}
      size='large'
    >
      {t('重新生成')}
    </Button>
  </div>
);

const EmptyPane = ({ onGenerate, t }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 30,
      minHeight: 360,
    }}
  >
    <IconImage size='extra-large' style={{ color: 'var(--text-muted)' }} />
    <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
      {t('尚未生成社交帖')}
    </div>
    <div
      style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        maxWidth: 280,
        textAlign: 'center',
        lineHeight: 1.6,
      }}
    >
      {t('每条最多 3 张图。LLM 会改写为小红书风格文案 + 配图,完成后可下载 ZIP。')}
    </div>
    <Button
      theme='solid'
      type='primary'
      icon={<IconImage />}
      onClick={onGenerate}
      size='large'
    >
      {t('生成')}
    </Button>
  </div>
);

const ReadyPane = ({ post, t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 12 }}>
    {/* meta */}
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Tag color={post.kind === 'image_only' ? 'orange' : 'cyan'} size='small'>
        {t(SOCIAL_KIND_LABELS[post.kind] || post.kind)}
      </Tag>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {(post.images || []).length} {t('张图')}
      </span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {new Date((post.updated_at || post.created_at) * 1000).toLocaleDateString()}
      </span>
    </div>

    {/* title */}
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
        {t('标题')}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary)',
          padding: '12px 14px',
          background: 'var(--bg-subtle, #fafafa)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          lineHeight: 1.4,
        }}
      >
        {post.title}
      </div>
    </div>

    {/* body */}
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
        {t('正文')}
      </div>
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--bg-subtle, #fafafa)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          whiteSpace: 'pre-wrap',
          fontSize: 13,
          lineHeight: 1.7,
          color: 'var(--text-primary)',
        }}
      >
        {post.body}
      </div>
    </div>

    {/* tags */}
    {(post.tags || []).length > 0 ? (
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
          {t('话题标签')}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {post.tags.map((tag, i) => (
            <Tag key={i} color='blue' size='small'>
              #{tag.replace(/^#/, '')}
            </Tag>
          ))}
        </div>
      </div>
    ) : null}

    {/* images */}
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
        {t('配图')} ({(post.images || []).length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(post.images || []).map((img) => (
          <ImageCard key={img.position} img={img} t={t} />
        ))}
      </div>
    </div>
  </div>
);

const ImageCard = ({ img, t }) => {
  const src = `/api/ai-news/admin/social/images/${img.rel_path}`;
  return (
    <div
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--surface, #fff)',
      }}
    >
      <img
        src={src}
        alt={img.caption || `image ${img.position}`}
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          objectFit: 'cover',
          display: 'block',
          background: '#f5f5f5',
        }}
      />
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
          {img.position}. {img.caption || t('未命名')}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 4,
            wordBreak: 'break-word',
          }}
        >
          {img.prompt}
        </div>
      </div>
    </div>
  );
};

export default MobileSocialPostModal;
