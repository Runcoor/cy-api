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

import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  API,
  showError,
  showSuccess,
  timestamp2string,
  renderGroupOption,
  renderQuota,
  getModelCategories,
  selectFilter,
} from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { SideSheet, Select, DatePicker, Spin } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../../../context/Status';
import TokenCreatedModal from './TokenCreatedModal';
import { TokenDrawerStyles, TkIcons as I } from '../_shared/TokenDrawerStyles';

const EXPIRY_PRESETS = [
  { v: 'never', label: '永不过期', month: 0, day: 0, hour: 0 },
  { v: '1m', label: '一个月', month: 1, day: 0, hour: 0 },
  { v: '7d', label: '七天', month: 0, day: 7, hour: 0 },
  { v: '1d', label: '一天', month: 0, day: 1, hour: 0 },
  { v: '1h', label: '一小时', month: 0, day: 0, hour: 1 },
  { v: 'custom', label: '自定义', month: -1 },
];

const QUOTA_PRESETS = [
  { value: 500000, label: '$1' },
  { value: 5000000, label: '$10' },
  { value: 25000000, label: '$50' },
  { value: 50000000, label: '$100' },
  { value: 250000000, label: '$500' },
  { value: 500000000, label: '$1000' },
];

const generateRandomSuffix = () => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const EditTokenModal = (props) => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  const [models, setModels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [createdKeys, setCreatedKeys] = useState([]);
  const [showCreatedModal, setShowCreatedModal] = useState(false);

  const isEdit = props.editingToken.id !== undefined;

  const initValues = () => ({
    name: '',
    remain_quota: 0,
    expired_time: -1,
    unlimited_quota: true,
    model_limits_enabled: false,
    model_limits: [],
    allow_ips: '',
    group: '',
    cross_group_retry: false,
    tokenCount: 1,
  });

  const [form, setForm] = useState(initValues());
  const [activePreset, setActivePreset] = useState('never');
  const [nameError, setNameError] = useState('');
  const [quotaError, setQuotaError] = useState('');
  const [expiryError, setExpiryError] = useState('');

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const applyPreset = (preset) => {
    setActivePreset(preset.v);
    setExpiryError('');
    if (preset.v === 'never') {
      update({ expired_time: -1 });
      return;
    }
    if (preset.v === 'custom') {
      // leave existing expired_time; user will pick
      return;
    }
    const now = new Date();
    let seconds = preset.month * 30 * 24 * 60 * 60;
    seconds += preset.day * 24 * 60 * 60;
    seconds += preset.hour * 60 * 60;
    const ts = now.getTime() / 1000 + seconds;
    update({ expired_time: timestamp2string(ts) });
  };

  const loadModels = async () => {
    let res = await API.get(`/api/user/models`);
    const { success, message, data } = res.data;
    if (success) {
      const categories = getModelCategories(t);
      const localModelOptions = data.map((model) => {
        let icon = null;
        for (const [key, category] of Object.entries(categories)) {
          if (key !== 'all' && category.filter({ model_name: model })) {
            icon = category.icon;
            break;
          }
        }
        return {
          label: (
            <span className='flex items-center gap-1'>
              {icon}
              {model}
            </span>
          ),
          value: model,
        };
      });
      setModels(localModelOptions);
    } else {
      showError(t(message));
    }
  };

  const loadGroups = async () => {
    let res = await API.get(`/api/user/self/groups`);
    const { success, message, data } = res.data;
    if (success) {
      let localGroupOptions = Object.entries(data).map(([group, info]) => ({
        label: info.desc,
        value: group,
        ratio: info.ratio,
      }));
      if (statusState?.status?.default_use_auto_group) {
        if (localGroupOptions.some((group) => group.value === 'auto')) {
          localGroupOptions.sort((a, b) => (a.value === 'auto' ? -1 : 1));
        }
      }
      setGroups(localGroupOptions);
    } else {
      showError(t(message));
    }
  };

  const loadToken = async () => {
    setLoading(true);
    let res = await API.get(`/api/token/${props.editingToken.id}`);
    const { success, message, data } = res.data;
    if (success) {
      if (data.expired_time !== -1) {
        data.expired_time = timestamp2string(data.expired_time);
        setActivePreset('custom');
      } else {
        setActivePreset('never');
      }
      data.model_limits =
        data.model_limits !== '' ? data.model_limits.split(',') : [];
      setForm({ ...initValues(), ...data });
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadModels();
    loadGroups();
  }, [props.editingToken.id]);

  useEffect(() => {
    if (props.visiable) {
      if (isEdit) {
        loadToken();
      } else {
        setForm(initValues());
        setActivePreset('never');
      }
      setNameError('');
      setQuotaError('');
      setExpiryError('');
    }
  }, [props.visiable, props.editingToken.id]);

  const handleClose = () => {
    props.handleClose();
  };

  const validate = () => {
    let ok = true;
    if (!form.name || form.name.trim() === '') {
      if (isEdit) {
        setNameError(t('请输入名称'));
        ok = false;
      } else {
        setNameError('');
      }
    } else {
      setNameError('');
    }
    if (form.expired_time !== -1) {
      const time = Date.parse(form.expired_time);
      if (isNaN(time)) {
        setExpiryError(t('过期时间格式错误！'));
        ok = false;
      } else if (time <= Date.now()) {
        setExpiryError(t('过期时间不能早于当前时间！'));
        ok = false;
      } else {
        setExpiryError('');
      }
    } else {
      setExpiryError('');
    }
    if (!form.unlimited_quota) {
      const q = parseInt(form.remain_quota, 10);
      if (isNaN(q) || q < 0) {
        setQuotaError(t('请输入额度'));
        ok = false;
      } else {
        setQuotaError('');
      }
    } else {
      setQuotaError('');
    }
    return ok;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        const { tokenCount: _tc, ...localInputs } = form;
        localInputs.remain_quota = parseInt(localInputs.remain_quota) || 0;
        if (localInputs.expired_time !== -1) {
          const time = Date.parse(localInputs.expired_time);
          localInputs.expired_time = Math.ceil(time / 1000);
        }
        const ml = Array.isArray(localInputs.model_limits)
          ? localInputs.model_limits
          : [];
        localInputs.model_limits = ml.join(',');
        localInputs.model_limits_enabled = ml.length > 0;
        const res = await API.put(`/api/token/`, {
          ...localInputs,
          id: parseInt(props.editingToken.id),
        });
        const { success, message } = res.data;
        if (success) {
          showSuccess(t('令牌更新成功！'));
          props.refresh();
          props.handleClose();
        } else {
          showError(t(message));
        }
      } else {
        const count = parseInt(form.tokenCount, 10) || 1;
        let successCount = 0;
        const collectedKeys = [];
        for (let i = 0; i < count; i++) {
          const { tokenCount: _tc, ...localInputs } = form;
          const baseName =
            (form.name || '').trim() === '' ? 'default' : form.name.trim();
          if (i !== 0 || (form.name || '').trim() === '') {
            localInputs.name = `${baseName}-${generateRandomSuffix()}`;
          } else {
            localInputs.name = baseName;
          }
          localInputs.remain_quota = parseInt(localInputs.remain_quota) || 0;
          if (localInputs.expired_time !== -1) {
            const time = Date.parse(localInputs.expired_time);
            localInputs.expired_time = Math.ceil(time / 1000);
          }
          const ml = Array.isArray(localInputs.model_limits)
            ? localInputs.model_limits
            : [];
          localInputs.model_limits = ml.join(',');
          localInputs.model_limits_enabled = ml.length > 0;
          const res = await API.post(`/api/token/`, localInputs);
          const { success, message, data } = res.data;
          if (success) {
            successCount++;
            if (data) collectedKeys.push(data);
          } else {
            showError(t(message));
            break;
          }
        }
        if (successCount > 0) {
          props.refresh();
          props.handleClose();
          if (collectedKeys.length > 0) {
            setCreatedKeys(collectedKeys);
            setShowCreatedModal(true);
          } else {
            showSuccess(t('令牌创建成功，请在列表页面点击复制获取令牌！'));
          }
        }
      }
    } finally {
      setLoading(false);
      setForm(initValues());
      setActivePreset('never');
    }
  };

  const summary = useMemo(() => {
    const count = parseInt(form.tokenCount, 10) || 1;
    const quotaText = form.unlimited_quota
      ? t('无限额度')
      : `${(parseInt(form.remain_quota, 10) || 0).toLocaleString()} ${t(
          'tokens',
        )}`;
    const expiryText =
      form.expired_time === -1
        ? t('永不过期')
        : t('到期') + ` ${form.expired_time}`;
    return { count, quotaText, expiryText };
  }, [form, t]);

  return (
    <>
      <SideSheet
        placement={isEdit ? 'right' : 'left'}
        visible={props.visiable}
        width={isMobile ? '100%' : 520}
        onCancel={handleClose}
        closable={false}
        headerStyle={{ display: 'none' }}
        bodyStyle={{ padding: 0, height: '100%' }}
        footer={null}
        mask
      >
        <TokenDrawerStyles />
        <div className='tk-root'>
          <Spin
            spinning={loading}
            wrapperClassName='tk-spin'
            style={{ height: '100%' }}
          >
            <div className='tk-head'>
              <div className='tk-head-left'>
                <div className='tk-head-icon'>
                  <I.Key />
                </div>
                <div className='tk-head-text'>
                  <h3>
                    {isEdit ? t('更新令牌信息') : t('创建新的令牌')}
                    <span
                      className={`tk-head-tag ${isEdit ? 'edit' : 'create'}`}
                    >
                      {isEdit ? t('更新') : t('新建')}
                    </span>
                  </h3>
                  <p>
                    {isEdit
                      ? t('修改后立即生效，已签发的密钥保持不变')
                      : t('令牌创建后仅显示一次完整密钥，请妥善保管')}
                  </p>
                </div>
              </div>
              <button
                type='button'
                className='tk-head-close'
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                aria-label={t('关闭')}
              >
                <I.Close />
              </button>
            </div>

            <div className='tk-body'>
              {/* Section 1: 基本信息 */}
              <div className='tk-section'>
                <div className='tk-section-head'>
                  <span className='tk-section-num'>1</span>
                  <span className='tk-section-title'>{t('基本信息')}</span>
                  <span className='tk-section-sub'>
                    {t('名称、分组与过期时间')}
                  </span>
                </div>

                <div className='tk-row'>
                  <label className='tk-label'>
                    {t('名称')}
                    {isEdit && <span className='req'>*</span>}
                  </label>
                  <input
                    className={`tk-input ${nameError ? 'error' : ''}`}
                    placeholder={t('请输入名称')}
                    value={form.name}
                    onChange={(e) => {
                      update({ name: e.target.value });
                      if (nameError) setNameError('');
                    }}
                  />
                  {nameError && (
                    <div className='tk-hint tk-hint-error'>{nameError}</div>
                  )}
                </div>

                <div className={`tk-row ${isEdit ? '' : 'tk-grid-2'}`}>
                  <div>
                    <label className='tk-label'>{t('令牌分组')}</label>
                    <Select
                      value={form.group || undefined}
                      placeholder={
                        groups.length > 0
                          ? t('令牌分组，默认为用户的分组')
                          : t('管理员未设置用户可选分组')
                      }
                      disabled={groups.length === 0}
                      optionList={groups}
                      renderOptionItem={renderGroupOption}
                      showClear
                      onChange={(v) => update({ group: v || '' })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  {!isEdit && (
                    <div>
                      <label className='tk-label'>
                        {t('新建数量')} <span className='req'>*</span>
                      </label>
                      <div className='tk-stepper'>
                        <button
                          type='button'
                          onClick={() =>
                            update({
                              tokenCount: Math.max(
                                1,
                                (parseInt(form.tokenCount, 10) || 1) - 1,
                              ),
                            })
                          }
                          disabled={(parseInt(form.tokenCount, 10) || 1) <= 1}
                        >
                          −
                        </button>
                        <input
                          type='number'
                          value={form.tokenCount}
                          onChange={(e) =>
                            update({
                              tokenCount: Math.max(
                                1,
                                parseInt(e.target.value, 10) || 1,
                              ),
                            })
                          }
                        />
                        <button
                          type='button'
                          onClick={() =>
                            update({
                              tokenCount:
                                (parseInt(form.tokenCount, 10) || 1) + 1,
                            })
                          }
                        >
                          +
                        </button>
                      </div>
                      <div className='tk-hint'>
                        {t('批量创建时会在名称后自动添加随机后缀')}
                      </div>
                    </div>
                  )}
                </div>

                {form.group === 'auto' && (
                  <div className='tk-row'>
                    <div className='tk-toggle-row'>
                      <div className='tk-toggle-text'>
                        <div className='tk-toggle-title'>{t('跨分组重试')}</div>
                        <div className='tk-hint' style={{ marginTop: 2 }}>
                          {t(
                            '开启后，当前分组渠道失败时会按顺序尝试下一个分组的渠道',
                          )}
                        </div>
                      </div>
                      <button
                        type='button'
                        className={`tk-switch ${form.cross_group_retry ? 'on' : ''}`}
                        onClick={() =>
                          update({ cross_group_retry: !form.cross_group_retry })
                        }
                        aria-label={t('跨分组重试')}
                      >
                        <span className='tk-switch-knob' />
                      </button>
                    </div>
                  </div>
                )}

                <div className='tk-row'>
                  <label className='tk-label'>
                    {t('过期时间')} <span className='req'>*</span>
                  </label>
                  <div className='tk-chip-group'>
                    {EXPIRY_PRESETS.map((p) => (
                      <button
                        key={p.v}
                        type='button'
                        className={`tk-chip ${activePreset === p.v ? 'active' : ''}`}
                        onClick={() => applyPreset(p)}
                      >
                        {t(p.label)}
                      </button>
                    ))}
                  </div>
                  {activePreset === 'custom' && (
                    <div style={{ marginTop: 8 }}>
                      <DatePicker
                        type='dateTime'
                        value={
                          form.expired_time !== -1
                            ? form.expired_time
                            : undefined
                        }
                        placeholder={t('请选择过期时间')}
                        onChange={(v) => {
                          if (!v) {
                            update({ expired_time: -1 });
                          } else if (typeof v === 'string') {
                            update({ expired_time: v });
                          } else {
                            update({
                              expired_time: timestamp2string(
                                v.getTime() / 1000,
                              ),
                            });
                          }
                          if (expiryError) setExpiryError('');
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                  {expiryError && (
                    <div className='tk-hint tk-hint-error'>{expiryError}</div>
                  )}
                </div>
              </div>

              {/* Section 2: 额度设置 */}
              <div className='tk-section'>
                <div className='tk-section-head'>
                  <span className='tk-section-num'>2</span>
                  <span className='tk-section-title'>{t('额度设置')}</span>
                  <span className='tk-section-sub'>
                    {t('令牌可用额度上限')}
                  </span>
                </div>

                <div className='tk-row'>
                  <div className='tk-toggle-row'>
                    <div className='tk-toggle-text'>
                      <div className='tk-toggle-title'>{t('无限额度')}</div>
                      <div className='tk-hint' style={{ marginTop: 2 }}>
                        {t(
                          '令牌的额度仅用于限制令牌本身的最大额度使用量，实际的使用受到账户的剩余额度限制',
                        )}
                      </div>
                    </div>
                    <button
                      type='button'
                      className={`tk-switch ${form.unlimited_quota ? 'on' : ''}`}
                      onClick={() => {
                        update({ unlimited_quota: !form.unlimited_quota });
                        if (quotaError) setQuotaError('');
                      }}
                      aria-label={t('无限额度')}
                    >
                      <span className='tk-switch-knob' />
                    </button>
                  </div>
                </div>

                {!form.unlimited_quota && (
                  <>
                    <div className='tk-row tk-grid-2'>
                      <div>
                        <label className='tk-label'>{t('额度')}</label>
                        <div
                          className={`tk-input-suffix ${
                            quotaError ? 'error' : ''
                          }`}
                        >
                          <input
                            type='number'
                            value={form.remain_quota}
                            placeholder='0'
                            onChange={(e) => {
                              update({ remain_quota: e.target.value });
                              if (quotaError) setQuotaError('');
                            }}
                          />
                          <span className='tk-suffix'>{t('额度')}</span>
                        </div>
                      </div>
                      <div>
                        <label className='tk-label'>{t('等价金额')}</label>
                        <div className='tk-readout'>
                          <span className='tk-readout-curr'>≈</span>
                          <span className='tk-readout-val'>
                            {renderQuota(
                              parseInt(form.remain_quota, 10) || 0,
                              2,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='tk-quota-presets'>
                      {QUOTA_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type='button'
                          onClick={() => {
                            update({ remain_quota: p.value });
                            if (quotaError) setQuotaError('');
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {quotaError && (
                      <div className='tk-hint tk-hint-error'>{quotaError}</div>
                    )}
                  </>
                )}
              </div>

              {/* Section 3: 访问限制 */}
              <div className='tk-section'>
                <div className='tk-section-head'>
                  <span className='tk-section-num'>3</span>
                  <span className='tk-section-title'>{t('访问限制')}</span>
                  <span className='tk-section-sub'>
                    {t('可选 · 模型与 IP 白名单')}
                  </span>
                </div>

                <div className='tk-row'>
                  <label className='tk-label'>{t('模型限制列表')}</label>
                  <Select
                    multiple
                    value={form.model_limits}
                    placeholder={t('请选择该令牌支持的模型，留空支持所有模型')}
                    optionList={models}
                    filter={selectFilter}
                    autoClearSearchValue={false}
                    searchPosition='dropdown'
                    showClear
                    onChange={(v) => update({ model_limits: v || [] })}
                    style={{ width: '100%' }}
                  />
                  <div className='tk-hint'>
                    {t('非必要，不建议启用模型限制')}
                  </div>
                </div>

                <div className='tk-row'>
                  <label className='tk-label'>
                    {t('IP白名单')}
                    <span className='tk-label-sub'>
                      {t('支持 CIDR 表达式')}
                    </span>
                  </label>
                  <textarea
                    className='tk-textarea'
                    placeholder={t('允许的IP，一行一个，不填写则不限制')}
                    value={form.allow_ips}
                    onChange={(e) => update({ allow_ips: e.target.value })}
                  />
                  <div className='tk-hint tk-hint-warn'>
                    <I.AlertTriangle />
                    {t(
                      '请勿过度信任此功能，IP可能被伪造，请配合nginx和cdn等网关使用',
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className='tk-foot'>
              <div className='tk-summary'>
                {isEdit ? (
                  <>
                    <span>{t('保存为')}</span>
                    <strong>{summary.quotaText}</strong>
                    <span className='tk-summary-sep'>·</span>
                    <span>{summary.expiryText}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {t('将创建')} <strong>{summary.count}</strong>{' '}
                      {t('个令牌')}
                    </span>
                    <span className='tk-summary-sep'>·</span>
                    <span>{summary.quotaText}</span>
                    <span className='tk-summary-sep'>·</span>
                    <span>
                      {form.expired_time === -1
                        ? t('永不过期')
                        : EXPIRY_PRESETS.find((p) => p.v === activePreset)
                              ?.label
                          ? t(
                              EXPIRY_PRESETS.find((p) => p.v === activePreset)
                                .label,
                            )
                          : t('自定义')}
                    </span>
                  </>
                )}
              </div>
              <div className='tk-actions'>
                <button
                  type='button'
                  className='tk-btn tk-btn-ghost'
                  onClick={handleClose}
                  disabled={loading}
                >
                  {t('取消')}
                </button>
                <button
                  type='button'
                  className='tk-btn tk-btn-primary'
                  onClick={submit}
                  disabled={loading}
                >
                  {isEdit ? <I.Save /> : <I.Plus />}
                  {isEdit ? t('保存修改') : t('创建令牌')}
                </button>
              </div>
            </div>
          </Spin>
        </div>
      </SideSheet>

      <TokenCreatedModal
        visible={showCreatedModal}
        onClose={() => {
          setShowCreatedModal(false);
          setCreatedKeys([]);
        }}
        tokenKeys={createdKeys}
        t={t}
      />
    </>
  );
};

export default EditTokenModal;
