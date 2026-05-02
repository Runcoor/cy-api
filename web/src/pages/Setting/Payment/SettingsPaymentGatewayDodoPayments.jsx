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
import { Banner, Button, Form, Row, Col, Typography } from '@douyinfe/semi-ui';
const { Text } = Typography;
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import MacSpinner from '../../../components/common/ui/MacSpinner';

export default function SettingsPaymentGatewayDodoPayments(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    DodoPaymentsEnabled: false,
    DodoPaymentsApiKey: '',
    DodoPaymentsWebhookSecret: '',
    DodoPaymentsSandbox: false,
    DodoPaymentsTopUpProductId: '',
    DodoPaymentsNotifyUrl: '',
    DodoPaymentsReturnUrl: '',
    DodoPaymentsCancelUrl: '',
    DodoPaymentsUnitPrice: 1.0,
    DodoPaymentsMinTopUp: 1,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        DodoPaymentsEnabled:
          props.options.DodoPaymentsEnabled !== undefined
            ? props.options.DodoPaymentsEnabled === true ||
              props.options.DodoPaymentsEnabled === 'true'
            : false,
        DodoPaymentsApiKey: props.options.DodoPaymentsApiKey || '',
        DodoPaymentsWebhookSecret:
          props.options.DodoPaymentsWebhookSecret || '',
        DodoPaymentsSandbox:
          props.options.DodoPaymentsSandbox !== undefined
            ? props.options.DodoPaymentsSandbox === true ||
              props.options.DodoPaymentsSandbox === 'true'
            : false,
        DodoPaymentsTopUpProductId:
          props.options.DodoPaymentsTopUpProductId || '',
        DodoPaymentsNotifyUrl: props.options.DodoPaymentsNotifyUrl || '',
        DodoPaymentsReturnUrl: props.options.DodoPaymentsReturnUrl || '',
        DodoPaymentsCancelUrl: props.options.DodoPaymentsCancelUrl || '',
        DodoPaymentsUnitPrice:
          props.options.DodoPaymentsUnitPrice !== undefined
            ? parseFloat(props.options.DodoPaymentsUnitPrice)
            : 1.0,
        DodoPaymentsMinTopUp:
          props.options.DodoPaymentsMinTopUp !== undefined
            ? parseFloat(props.options.DodoPaymentsMinTopUp)
            : 1,
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitDodoSetting = async () => {
    if (props.options.ServerAddress === '') {
      showError(t('请先填写服务器地址'));
      return;
    }
    setLoading(true);
    try {
      const options = [];

      if (originInputs.DodoPaymentsEnabled !== inputs.DodoPaymentsEnabled) {
        options.push({
          key: 'DodoPaymentsEnabled',
          value: inputs.DodoPaymentsEnabled ? 'true' : 'false',
        });
      }
      if (originInputs.DodoPaymentsSandbox !== inputs.DodoPaymentsSandbox) {
        options.push({
          key: 'DodoPaymentsSandbox',
          value: inputs.DodoPaymentsSandbox ? 'true' : 'false',
        });
      }
      if (inputs.DodoPaymentsApiKey && inputs.DodoPaymentsApiKey !== '') {
        options.push({
          key: 'DodoPaymentsApiKey',
          value: inputs.DodoPaymentsApiKey,
        });
      }
      if (
        inputs.DodoPaymentsWebhookSecret &&
        inputs.DodoPaymentsWebhookSecret !== ''
      ) {
        options.push({
          key: 'DodoPaymentsWebhookSecret',
          value: inputs.DodoPaymentsWebhookSecret,
        });
      }
      if (
        inputs.DodoPaymentsTopUpProductId !==
        originInputs.DodoPaymentsTopUpProductId
      ) {
        options.push({
          key: 'DodoPaymentsTopUpProductId',
          value: inputs.DodoPaymentsTopUpProductId || '',
        });
      }
      if (inputs.DodoPaymentsNotifyUrl !== originInputs.DodoPaymentsNotifyUrl) {
        options.push({
          key: 'DodoPaymentsNotifyUrl',
          value: removeTrailingSlash(inputs.DodoPaymentsNotifyUrl || ''),
        });
      }
      if (inputs.DodoPaymentsReturnUrl !== originInputs.DodoPaymentsReturnUrl) {
        options.push({
          key: 'DodoPaymentsReturnUrl',
          value: removeTrailingSlash(inputs.DodoPaymentsReturnUrl || ''),
        });
      }
      if (inputs.DodoPaymentsCancelUrl !== originInputs.DodoPaymentsCancelUrl) {
        options.push({
          key: 'DodoPaymentsCancelUrl',
          value: removeTrailingSlash(inputs.DodoPaymentsCancelUrl || ''),
        });
      }
      if (
        inputs.DodoPaymentsUnitPrice !== undefined &&
        inputs.DodoPaymentsUnitPrice !== null
      ) {
        options.push({
          key: 'DodoPaymentsUnitPrice',
          value: inputs.DodoPaymentsUnitPrice.toString(),
        });
      }
      if (
        inputs.DodoPaymentsMinTopUp !== undefined &&
        inputs.DodoPaymentsMinTopUp !== null
      ) {
        options.push({
          key: 'DodoPaymentsMinTopUp',
          value: inputs.DodoPaymentsMinTopUp.toString(),
        });
      }

      const requestQueue = options.map((opt) =>
        API.put('/api/option/', { key: opt.key, value: opt.value }),
      );
      const results = await Promise.all(requestQueue);
      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => showError(res.data.message));
      } else {
        showSuccess(t('更新成功'));
        setOriginInputs({ ...inputs });
        props.refresh?.();
      }
    } catch (error) {
      showError(t('更新失败'));
    }
    setLoading(false);
  };

  const webhookUrl = props.options?.ServerAddress
    ? `${removeTrailingSlash(props.options.ServerAddress)}/api/dodopayments/webhook`
    : t('网站地址') + '/api/dodopayments/webhook';

  return (
    <MacSpinner spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={t('Dodo Payments 信用卡 / 全球支付')}>
          <Text>
            {t(
              'Dodo Payments 是一个支持信用卡及全球本地支付方式的 MoR 支付网关，处理 KYC、税费与发票。',
            )}
            {t('请先到')}
            <a
              href='https://app.dodopayments.com/'
              target='_blank'
              rel='noreferrer'
            >
              Dodo Payments 控制台
            </a>
            {t(
              ' 在 Developer → API 创建 API Key，并在 Developer → Webhooks 添加下方 Webhook URL，记录其 signing secret。',
            )}
          </Text>
          <Banner
            type='info'
            description={`${t('Webhook 回调地址（请在 Dodo Payments → Developer → Webhooks 添加此 endpoint，并复制 signing secret）')}: ${webhookUrl}`}
            style={{ marginTop: 12 }}
          />
          <Banner
            type='warning'
            description={t(
              '充值需要在 Dashboard 创建一个 “Pay What You Want” 类型的一次性产品（建议设最低 $1），把 product_id 填到下方“充值产品 ID”。订阅每个套餐对应一个 Subscription 产品，product_id 在 “订阅套餐管理” 编辑页填写。',
            )}
            style={{ marginTop: 8 }}
          />
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='DodoPaymentsEnabled'
                label={t('启用 Dodo Payments')}
                size='default'
                checkedText='｜'
                uncheckedText='〇'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='DodoPaymentsSandbox'
                label={t('沙盒模式')}
                size='default'
                checkedText='｜'
                uncheckedText='〇'
                extraText={t('开启使用 test.dodopayments.com')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='DodoPaymentsTopUpProductId'
                label={t('充值产品 ID（PWYW）')}
                placeholder={t('例如 pdt_xxx，留空则禁用充值入口')}
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='DodoPaymentsApiKey'
                label='API Key'
                placeholder={t(
                  'Dodo Payments → Developer → API，敏感信息不显示',
                )}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='DodoPaymentsWebhookSecret'
                label='Webhook Signing Secret'
                placeholder={t(
                  'Dodo Payments → Developer → Webhooks，可能以 whsec_ 开头',
                )}
                type='password'
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='DodoPaymentsUnitPrice'
                precision={2}
                label={t('充值价格（x USD/单位）')}
                placeholder={t('1 单位 = 多少 USD，默认 1.0')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='DodoPaymentsMinTopUp'
                label={t('最低充值数量')}
                placeholder={t('默认 1')}
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='DodoPaymentsNotifyUrl'
                label={t('自定义 Webhook 回调地址（可选）')}
                placeholder={t('留空自动使用服务器地址')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='DodoPaymentsReturnUrl'
                label={t('支付成功跳转地址（可选）')}
                placeholder={t('留空跳转到充值页')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='DodoPaymentsCancelUrl'
                label={t('用户取消跳转地址（可选）')}
                placeholder={t('留空跳转到充值页')}
              />
            </Col>
          </Row>
          <Button onClick={submitDodoSetting} style={{ marginTop: 16 }}>
            {t('更新 Dodo Payments 设置')}
          </Button>
        </Form.Section>
      </Form>
    </MacSpinner>
  );
}
