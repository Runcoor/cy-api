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
import { API, showError, showSuccess } from '../../helpers';

const Field = ({ label, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
      {label}
    </label>
    {children}
    {hint ? (
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</span>
    ) : null}
  </div>
);

const SettingsTab = () => {
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
      if (res?.data?.success) {
        setSettings(res.data.data || {});
      } else {
        showError(res?.data?.message || t('加载失败'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      // Channels endpoint returns paginated; fetch a generous page
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
      if (res?.data?.success) {
        setTestResult(res.data.data);
      } else {
        showError(res?.data?.message || t('测试失败'));
      }
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  const update = (patch) => setSettings({ ...settings, ...patch });

  return (
    <div style={{ maxWidth: 720, padding: 12 }}>
      <Banner
        type='info'
        description={t(
          'Jina API key 可选(留空走免费 tier)。LLM 可选自定义 OpenAI 兼容端点,或直接选用平台已有渠道',
        )}
        style={{ marginBottom: 24 }}
      />

      <Field label={t('Jina API Key (可选)')} hint={t('用于 r.jina.ai 抓正文 + s.jina.ai 搜索')}>
        <Input
          value={settings.jina_api_key || ''}
          onChange={(v) => update({ jina_api_key: v })}
          placeholder='jina_xxxxxxxx'
          mode='password'
        />
      </Field>

      <Field label={t('LLM 来源')}>
        <RadioGroup
          value={settings.llm_source}
          onChange={(e) => update({ llm_source: e.target.value })}
        >
          <Radio value='channel'>{t('使用平台已有渠道')}</Radio>
          <Radio value='custom'>{t('自定义 base_url + key')}</Radio>
        </RadioGroup>
      </Field>

      {settings.llm_source === 'custom' ? (
        <>
          <Field label={t('自定义 LLM Base URL')} hint='e.g. https://api.openai.com'>
            <Input
              value={settings.llm_custom_base_url || ''}
              onChange={(v) => update({ llm_custom_base_url: v })}
              placeholder='https://...'
            />
          </Field>
          <Field label={t('自定义 LLM API Key')}>
            <Input
              value={settings.llm_custom_api_key || ''}
              onChange={(v) => update({ llm_custom_api_key: v })}
              placeholder='sk-...'
              mode='password'
            />
          </Field>
        </>
      ) : (
        <Field label={t('选择渠道')} hint={t('使用该渠道的 base_url + key')}>
          <Select
            value={settings.llm_channel_id || undefined}
            onChange={(v) => update({ llm_channel_id: v })}
            placeholder={t('选择一个已启用的渠道')}
            style={{ width: '100%' }}
            optionList={channels.map((c) => ({
              label: `#${c.id} · ${c.name}`,
              value: c.id,
            }))}
          />
        </Field>
      )}

      <Field
        label={t('深度分析模型')}
        hint={t('用于生成深度分析,推荐能力强的大模型')}
      >
        <Input
          value={settings.llm_deep_model || ''}
          onChange={(v) => update({ llm_deep_model: v })}
          placeholder='claude-opus-4-7'
        />
      </Field>

      <Field
        label={t('简单总结模型')}
        hint={t('用于生成简短日报,推荐快速模型')}
      >
        <Input
          value={settings.llm_simple_model || ''}
          onChange={(v) => update({ llm_simple_model: v })}
          placeholder='claude-haiku-4-5'
        />
      </Field>

      <Field
        label={t('LLM API 模式')}
        hint={t(
          '默认 auto:模型名以 gpt-5 / o1 / o3 / o4 开头自动走 /v1/responses,其它走 /v1/chat/completions。如果上游是 reasoning 模型但 chat.completions 返回 content=null,改成 responses。',
        )}
      >
        <RadioGroup
          value={settings.llm_api_mode || 'auto'}
          onChange={(e) => update({ llm_api_mode: e.target.value })}
        >
          <Radio value='auto'>{t('auto (按模型名自动判断)')}</Radio>
          <Radio value='chat'>{t('chat (/v1/chat/completions)')}</Radio>
          <Radio value='responses'>{t('responses (/v1/responses)')}</Radio>
        </RadioGroup>
      </Field>

      <div
        style={{
          marginTop: 24,
          marginBottom: 12,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {t('图像生成接口 (用于发布社交平台)')}
      </div>

      <Field
        label={t('图像生成 Base URL')}
        hint={t('OpenAI 兼容的 /v1/images/generations 端点,留空则禁用社交发布功能')}
      >
        <Input
          value={settings.image_gen_base_url || ''}
          onChange={(v) => update({ image_gen_base_url: v })}
          placeholder='http://172.17.0.1:8317'
        />
      </Field>

      <Field label={t('图像生成 API Key')}>
        <Input
          value={settings.image_gen_api_key || ''}
          onChange={(v) => update({ image_gen_api_key: v })}
          placeholder='sk-...'
          mode='password'
        />
      </Field>

      <Field label={t('图像生成模型')} hint={t('如 gpt-image-2 / dall-e-3 / stable-diffusion-3')}>
        <Input
          value={settings.image_gen_model || ''}
          onChange={(v) => update({ image_gen_model: v })}
          placeholder='gpt-image-2'
        />
      </Field>

      <Field
        label={t('管理员预览邮箱')}
        hint={t('生成草稿后会发邮件到这些地址,逗号分隔')}
      >
        <Input
          value={(settings.admin_preview_emails || []).join(',')}
          onChange={(v) =>
            update({
              admin_preview_emails: v
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder='admin@example.com, ops@example.com'
        />
      </Field>

      <Field label={t('每日定时')}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Switch
            checked={!!settings.cron_enabled}
            onChange={(v) => update({ cron_enabled: v })}
          />
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {t('每天')}
          </span>
          <InputNumber
            min={0}
            max={23}
            value={settings.cron_hour ?? 9}
            onChange={(v) => update({ cron_hour: Number(v) || 0 })}
            style={{ width: 80 }}
          />
          <span style={{ fontSize: 13 }}>:</span>
          <InputNumber
            min={0}
            max={59}
            value={settings.cron_minute ?? 0}
            onChange={(v) => update({ cron_minute: Number(v) || 0 })}
            style={{ width: 80 }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {t('(服务器本地时间)')}
          </span>
        </div>
      </Field>

      <div style={{ marginTop: 24, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          theme='solid'
          type='primary'
          loading={saving}
          onClick={onSave}
        >
          {t('保存设置')}
        </Button>
        <div style={{ flex: 1 }} />
        <Input
          value={testModel}
          onChange={setTestModel}
          placeholder={t('测试用模型(留空 = 深度模型)')}
          style={{ width: 280, fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
        <Button loading={testing} onClick={onTest}>
          {t('测试 LLM')}
        </Button>
      </div>

      {testResult ? (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            background: 'var(--bg-subtle, #fafafa)',
          }}
        >
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            {t('测试模型')}: <strong>{testResult.model || '-'}</strong>
            {' · '}
            {t('Base URL')}: <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{testResult.base_url || '-'}</span>
            {' · '}
            {t('优先模式')}: <strong>{testResult.preferred_mode}</strong>
            {testResult.is_reasoning ? (
              <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                ({t('检测为 reasoning 模型')})
              </span>
            ) : null}
          </div>
          <TestEndpointResult label='/v1/chat/completions' data={testResult.chat} t={t} />
          <TestEndpointResult label='/v1/responses' data={testResult.responses} t={t} />
        </div>
      ) : null}
    </div>
  );
};

const TestEndpointResult = ({ label, data, t }) => {
  if (!data?.tried) return null;
  const ok = !!data.ok;
  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        borderRadius: 6,
        background: ok
          ? 'var(--semi-color-success-light-default, #f0fdf4)'
          : 'var(--semi-color-danger-light-default, #fef2f2)',
        border: `1px solid ${ok ? 'var(--semi-color-success-light-active, #bbf7d0)' : 'var(--semi-color-danger-light-active, #fecaca)'}`,
      }}
    >
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
        {ok ? '✓ ' : '✗ '} {label}
        {' · '}
        <span style={{ color: 'var(--text-muted)' }}>{data.duration}</span>
      </div>
      {ok ? (
        <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
          {t('回复')}: {data.reply}
        </div>
      ) : (
        <div
          style={{
            fontSize: 12,
            color: 'var(--semi-color-danger, #dc2626)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {data.error}
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
