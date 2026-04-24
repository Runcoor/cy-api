/*
Copyright (C) 2025 QuantumNous

Mobile-only settings view. Single-column form, full bleed, no max-width
constraint, larger tap targets. Identical data path to the desktop
SettingsTab — just a different presentation.
*/

import React, { useEffect, useState } from 'react';
import {
  Button,
  InputNumber,
  Input,
  RadioGroup,
  Radio,
  Select,
  Switch,
  Spin,
  Banner,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../../helpers';

const Section = ({ title, children }) => (
  <div
    style={{
      background: 'var(--surface, #fff)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}
  >
    {title ? (
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 12,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </div>
    ) : null}
    {children}
  </div>
);

const Row = ({ label, hint, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-primary)',
        marginBottom: 6,
      }}
    >
      {label}
    </label>
    {children}
    {hint ? (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
        {hint}
      </div>
    ) : null}
  </div>
);

const MobileSettingsTab = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [channels, setChannels] = useState([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testModel, setTestModel] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/ai-news/admin/settings');
      if (res?.data?.success) setSettings(res.data.data || {});
      else showError(res?.data?.message || t('加载失败'));
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      const res = await API.get('/api/channel/?page=1&page_size=200');
      if (res?.data?.success) {
        const items = res.data.data?.items || res.data.data || [];
        setChannels(items.filter((c) => c.status === 1));
      }
    } catch (e) {
      // non-fatal
    }
  };

  useEffect(() => {
    loadSettings();
    loadChannels();
  }, []);

  const onTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const body = testModel.trim() ? { model: testModel.trim() } : {};
      const res = await API.post('/api/ai-news/admin/test-llm', body);
      if (res?.data?.success) setTestResult(res.data.data);
      else showError(res?.data?.message || t('测试失败'));
    } catch (e) {
      showError(e);
    } finally {
      setTesting(false);
    }
  };

  const onSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await API.put('/api/ai-news/admin/settings', settings);
      if (res?.data?.success) {
        showSuccess(t('已保存'));
        setSettings(res.data.data || settings);
      } else {
        showError(res?.data?.message || t('保存失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin />
      </div>
    );
  }

  const update = (patch) => setSettings({ ...settings, ...patch });

  return (
    <div style={{ paddingBottom: 100 }}>
      <Banner
        type='info'
        description={t('Jina API key 可选;LLM 可用平台已有渠道,或自定义 OpenAI 兼容端点')}
        style={{ marginBottom: 12, borderRadius: 8 }}
      />

      <Section title={t('采集与抓取')}>
        <Row label={t('Jina API Key (可选)')} hint={t('用于 r.jina.ai 抓正文 + s.jina.ai 搜索')}>
          <Input
            value={settings.jina_api_key || ''}
            onChange={(v) => update({ jina_api_key: v })}
            placeholder='jina_xxxxxxxx'
            mode='password'
            size='large'
          />
        </Row>
      </Section>

      <Section title={t('LLM 配置')}>
        <Row label={t('LLM 来源')}>
          <RadioGroup
            value={settings.llm_source}
            onChange={(e) => update({ llm_source: e.target.value })}
          >
            <Radio value='channel'>{t('使用平台已有渠道')}</Radio>
            <Radio value='custom'>{t('自定义 base_url + key')}</Radio>
          </RadioGroup>
        </Row>

        {settings.llm_source === 'custom' ? (
          <>
            <Row label={t('自定义 LLM Base URL')} hint='e.g. https://api.openai.com'>
              <Input
                value={settings.llm_custom_base_url || ''}
                onChange={(v) => update({ llm_custom_base_url: v })}
                placeholder='https://...'
                size='large'
              />
            </Row>
            <Row label={t('自定义 LLM API Key')}>
              <Input
                value={settings.llm_custom_api_key || ''}
                onChange={(v) => update({ llm_custom_api_key: v })}
                placeholder='sk-...'
                mode='password'
                size='large'
              />
            </Row>
          </>
        ) : (
          <Row label={t('选择渠道')} hint={t('使用该渠道的 base_url + key')}>
            <Select
              value={settings.llm_channel_id || undefined}
              onChange={(v) => update({ llm_channel_id: v })}
              placeholder={t('选择一个已启用的渠道')}
              style={{ width: '100%' }}
              size='large'
              optionList={channels.map((c) => ({
                label: `#${c.id} · ${c.name}`,
                value: c.id,
              }))}
            />
          </Row>
        )}

        <Row label={t('深度分析模型')} hint={t('用于生成深度分析,推荐能力强的大模型')}>
          <Input
            value={settings.llm_deep_model || ''}
            onChange={(v) => update({ llm_deep_model: v })}
            placeholder='claude-opus-4-7'
            size='large'
          />
        </Row>

        <Row label={t('简单总结模型')} hint={t('用于生成简短日报,推荐快速模型')}>
          <Input
            value={settings.llm_simple_model || ''}
            onChange={(v) => update({ llm_simple_model: v })}
            placeholder='claude-haiku-4-5'
            size='large'
          />
        </Row>

        <Row
          label={t('LLM API 模式')}
          hint={t('上游是 reasoning 模型但 chat.completions 返回 content=null 时改 responses')}
        >
          <RadioGroup
            value={settings.llm_api_mode || 'auto'}
            onChange={(e) => update({ llm_api_mode: e.target.value })}
            direction='vertical'
          >
            <Radio value='auto'>auto</Radio>
            <Radio value='chat'>chat</Radio>
            <Radio value='responses'>responses</Radio>
          </RadioGroup>
        </Row>

        <Row label={t('测试 LLM')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              value={testModel}
              onChange={setTestModel}
              placeholder={t('测试用模型(留空 = 深度模型)')}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              size='large'
            />
            <Button loading={testing} onClick={onTest} size='large' block>
              {t('测试 LLM')}
            </Button>
          </div>
          {testResult ? (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-subtle, #fafafa)',
                fontSize: 12,
              }}
            >
              <div>{t('模型')}: {testResult.model || '-'}</div>
              <div style={{ wordBreak: 'break-all', marginTop: 4 }}>
                Base URL: {testResult.base_url || '-'}
              </div>
              <MobileTestResult label='/v1/chat/completions' data={testResult.chat} t={t} />
              <MobileTestResult label='/v1/responses' data={testResult.responses} t={t} />
            </div>
          ) : null}
        </Row>
      </Section>

      <Section title={t('图像生成接口 (用于发布社交平台)')}>
        <Row
          label={t('图像生成 Base URL')}
          hint={t('OpenAI 兼容的 /v1/images/generations 端点,留空则禁用社交发布功能')}
        >
          <Input
            value={settings.image_gen_base_url || ''}
            onChange={(v) => update({ image_gen_base_url: v })}
            placeholder='http://172.17.0.1:8317'
            size='large'
          />
        </Row>
        <Row label={t('图像生成 API Key')}>
          <Input
            value={settings.image_gen_api_key || ''}
            onChange={(v) => update({ image_gen_api_key: v })}
            placeholder='sk-...'
            mode='password'
            size='large'
          />
        </Row>
        <Row label={t('图像生成模型')} hint={t('如 gpt-image-2 / dall-e-3 / stable-diffusion-3')}>
          <Input
            value={settings.image_gen_model || ''}
            onChange={(v) => update({ image_gen_model: v })}
            placeholder='gpt-image-2'
            size='large'
          />
        </Row>
      </Section>

      <Section title={t('订阅与定时')}>
        <Row label={t('管理员预览邮箱')} hint={t('生成草稿后会发邮件到这些地址,逗号分隔')}>
          <Input
            value={(settings.admin_preview_emails || []).join(',')}
            onChange={(v) =>
              update({
                admin_preview_emails: v.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder='admin@example.com'
            size='large'
          />
        </Row>

        <Row label={t('每日定时')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Switch
              checked={!!settings.cron_enabled}
              onChange={(v) => update({ cron_enabled: v })}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {settings.cron_enabled ? t('已启用') : t('已停用')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13 }}>{t('每天')}</span>
            <InputNumber
              min={0}
              max={23}
              value={settings.cron_hour ?? 9}
              onChange={(v) => update({ cron_hour: Number(v) || 0 })}
              style={{ width: 80 }}
              size='large'
            />
            <span>:</span>
            <InputNumber
              min={0}
              max={59}
              value={settings.cron_minute ?? 0}
              onChange={(v) => update({ cron_minute: Number(v) || 0 })}
              style={{ width: 80 }}
              size='large'
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {t('(服务器本地时间)')}
          </div>
        </Row>
      </Section>

      {/* Sticky save bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 12px max(12px, env(safe-area-inset-bottom))',
          background: 'var(--surface, #fff)',
          borderTop: '1px solid var(--border-subtle)',
          zIndex: 10,
        }}
      >
        <Button
          theme='solid'
          type='primary'
          loading={saving}
          onClick={onSave}
          size='large'
          block
        >
          {t('保存设置')}
        </Button>
      </div>
    </div>
  );
};

const MobileTestResult = ({ label, data, t }) => {
  if (!data?.tried) return null;
  const ok = !!data.ok;
  return (
    <div
      style={{
        marginTop: 8,
        padding: 8,
        borderRadius: 6,
        background: ok ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
        border: `1px solid ${ok ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`,
        fontSize: 12,
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
        [{ok ? t('成功') : t('失败')}] {label} · {data.duration}
      </div>
      {ok ? (
        <div style={{ whiteSpace: 'pre-wrap' }}>{t('回复')}: {data.reply}</div>
      ) : (
        <div style={{ color: '#dc2626', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {data.error}
        </div>
      )}
    </div>
  );
};

export default MobileSettingsTab;
