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

import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess, showWarning } from '../../../helpers';
import MacSpinner from '../../../components/common/ui/MacSpinner';

const INITIAL_INPUTS = {
  QuotaForNewUser: '',
  PreConsumedQuota: '',
  QuotaForInviter: '',
  QuotaForInvitee: '',
  AffTierEnabled: false,
  AffTiers: '',
  'quota_setting.enable_free_model_pre_consume': true,
};
// Stable whitelist of fields this section owns. Used to filter parent
// options so the section only writes its own keys, and as the union for
// change detection below — using live `inputs` here was buggy because
// setInputs() replaces the state object, dropping any key the backend
// hasn't returned yet (e.g. newly-added AffTierEnabled / AffTiers on a
// fresh deploy).
const FIELD_KEYS = Object.keys(INITIAL_INPUTS);

export default function SettingsCreditLimit(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    // Compare against the union of known fields so newly-added keys
    // (those absent from inputsRow on a fresh deploy) still register
    // as a change.
    const updateArray = [];
    for (const key of FIELD_KEYS) {
      const before = inputsRow[key];
      const after = inputs[key];
      if (String(before ?? '') !== String(after ?? '')) {
        updateArray.push({ key, oldValue: before, newValue: after });
      }
    }
    if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else {
        value = inputs[item.key];
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined))
            return showError(t('部分保存失败，请重试'));
        }
        showSuccess(t('保存成功'));
        props.refresh();
      })
      .catch(() => {
        showError(t('保存失败，请重试'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    // Always seed every owned field — fall back to the initial default
    // when the backend hasn't sent a value yet. Coerce booleans so the
    // Switch reflects state correctly even when the API returns the
    // string "true"/"false".
    const currentInputs = { ...INITIAL_INPUTS };
    for (const key of FIELD_KEYS) {
      const v = props.options?.[key];
      if (v === undefined || v === null) continue;
      if (typeof INITIAL_INPUTS[key] === 'boolean') {
        currentInputs[key] = v === true || v === 'true';
      } else {
        currentInputs[key] = v;
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current?.setValues(currentInputs);
  }, [props.options]);
  return (
    <>
      <MacSpinner spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('额度设置')}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t('新用户初始额度')}
                  field={'QuotaForNewUser'}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  placeholder={''}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      QuotaForNewUser: String(value),
                    })
                  }
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t('请求预扣费额度')}
                  field={'PreConsumedQuota'}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  extraText={t('请求结束后多退少补')}
                  placeholder={''}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      PreConsumedQuota: String(value),
                    })
                  }
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t('邀请新用户奖励额度')}
                  field={'QuotaForInviter'}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  extraText={''}
                  placeholder={t('例如：2000')}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      QuotaForInviter: String(value),
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={6}>
                <Form.InputNumber
                  label={t('新用户使用邀请码奖励额度')}
                  field={'QuotaForInvitee'}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  extraText={''}
                  placeholder={t('例如：1000')}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      QuotaForInvitee: String(value),
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Switch
                  label={t('对免费模型启用预消耗')}
                  field={'quota_setting.enable_free_model_pre_consume'}
                  extraText={t(
                    '开启后，对免费模型（倍率为0，或者价格为0）的模型也会预消耗额度',
                  )}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'quota_setting.enable_free_model_pre_consume': value,
                    })
                  }
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  label={t('启用邀请阶梯奖励')}
                  field={'AffTierEnabled'}
                  extraText={t(
                    '启用后，用户邀请人数命中下方阶梯时一次性追加奖励到邀请额度',
                  )}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      AffTierEnabled: value,
                    })
                  }
                />
              </Col>
              <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                <Form.TextArea
                  label={t('阶梯奖励配置 (JSON)')}
                  field={'AffTiers'}
                  rows={3}
                  extraText={t(
                    '格式：[{"count":3,"bonus":1000000}, ...]，bonus 为 quota（500000 = $1）',
                  )}
                  placeholder='[{"count":3,"bonus":1000000},{"count":10,"bonus":5000000},{"count":25,"bonus":15000000},{"count":50,"bonus":40000000}]'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      AffTiers: value,
                    })
                  }
                />
              </Col>
            </Row>

            <Row>
              <Button size='default' onClick={onSubmit}>
                {t('保存额度设置')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </MacSpinner>
    </>
  );
}
