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
import {
  Banner,
  Button,
  Form,
  Row,
  Col,
  Typography,
} from '@douyinfe/semi-ui';
const { Text } = Typography;
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import MacSpinner from '../../../components/common/ui/MacSpinner';

export default function SettingsPaymentGatewayNowPayments(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    NowPaymentsEnabled: false,
    NowPaymentsApiKey: '',
    NowPaymentsIpnSecret: '',
    NowPaymentsSandbox: false,
    NowPaymentsPayCurrency: '',
    NowPaymentsOrderCurrency: 'USD',
    NowPaymentsNotifyUrl: '',
    NowPaymentsReturnUrl: '',
    NowPaymentsCancelUrl: '',
    NowPaymentsUnitPrice: 1.0,
    NowPaymentsMinTopUp: 1,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        NowPaymentsEnabled:
          props.options.NowPaymentsEnabled !== undefined
            ? props.options.NowPaymentsEnabled === true ||
              props.options.NowPaymentsEnabled === 'true'
            : false,
        NowPaymentsApiKey: props.options.NowPaymentsApiKey || '',
        NowPaymentsIpnSecret: props.options.NowPaymentsIpnSecret || '',
        NowPaymentsSandbox:
          props.options.NowPaymentsSandbox !== undefined
            ? props.options.NowPaymentsSandbox === true ||
              props.options.NowPaymentsSandbox === 'true'
            : false,
        NowPaymentsPayCurrency: props.options.NowPaymentsPayCurrency || '',
        NowPaymentsOrderCurrency:
          props.options.NowPaymentsOrderCurrency || 'USD',
        NowPaymentsNotifyUrl: props.options.NowPaymentsNotifyUrl || '',
        NowPaymentsReturnUrl: props.options.NowPaymentsReturnUrl || '',
        NowPaymentsCancelUrl: props.options.NowPaymentsCancelUrl || '',
        NowPaymentsUnitPrice:
          props.options.NowPaymentsUnitPrice !== undefined
            ? parseFloat(props.options.NowPaymentsUnitPrice)
            : 1.0,
        NowPaymentsMinTopUp:
          props.options.NowPaymentsMinTopUp !== undefined
            ? parseFloat(props.options.NowPaymentsMinTopUp)
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

  const submitNowPaymentsSetting = async () => {
    if (props.options.ServerAddress === '') {
      showError(t('请先填写服务器地址'));
      return;
    }

    setLoading(true);
    try {
      const options = [];

      if (originInputs.NowPaymentsEnabled !== inputs.NowPaymentsEnabled) {
        options.push({
          key: 'NowPaymentsEnabled',
          value: inputs.NowPaymentsEnabled ? 'true' : 'false',
        });
      }
      if (originInputs.NowPaymentsSandbox !== inputs.NowPaymentsSandbox) {
        options.push({
          key: 'NowPaymentsSandbox',
          value: inputs.NowPaymentsSandbox ? 'true' : 'false',
        });
      }
      if (inputs.NowPaymentsApiKey && inputs.NowPaymentsApiKey !== '') {
        options.push({
          key: 'NowPaymentsApiKey',
          value: inputs.NowPaymentsApiKey,
        });
      }
      if (inputs.NowPaymentsIpnSecret && inputs.NowPaymentsIpnSecret !== '') {
        options.push({
          key: 'NowPaymentsIpnSecret',
          value: inputs.NowPaymentsIpnSecret,
        });
      }
      if (
        inputs.NowPaymentsPayCurrency !== originInputs.NowPaymentsPayCurrency
      ) {
        options.push({
          key: 'NowPaymentsPayCurrency',
          value: inputs.NowPaymentsPayCurrency || '',
        });
      }
      if (
        inputs.NowPaymentsOrderCurrency !==
        originInputs.NowPaymentsOrderCurrency
      ) {
        options.push({
          key: 'NowPaymentsOrderCurrency',
          value: inputs.NowPaymentsOrderCurrency || 'USD',
        });
      }
      if (inputs.NowPaymentsNotifyUrl !== originInputs.NowPaymentsNotifyUrl) {
        options.push({
          key: 'NowPaymentsNotifyUrl',
          value: removeTrailingSlash(inputs.NowPaymentsNotifyUrl || ''),
        });
      }
      if (inputs.NowPaymentsReturnUrl !== originInputs.NowPaymentsReturnUrl) {
        options.push({
          key: 'NowPaymentsReturnUrl',
          value: removeTrailingSlash(inputs.NowPaymentsReturnUrl || ''),
        });
      }
      if (inputs.NowPaymentsCancelUrl !== originInputs.NowPaymentsCancelUrl) {
        options.push({
          key: 'NowPaymentsCancelUrl',
          value: removeTrailingSlash(inputs.NowPaymentsCancelUrl || ''),
        });
      }
      if (
        inputs.NowPaymentsUnitPrice !== undefined &&
        inputs.NowPaymentsUnitPrice !== null
      ) {
        options.push({
          key: 'NowPaymentsUnitPrice',
          value: inputs.NowPaymentsUnitPrice.toString(),
        });
      }
      if (
        inputs.NowPaymentsMinTopUp !== undefined &&
        inputs.NowPaymentsMinTopUp !== null
      ) {
        options.push({
          key: 'NowPaymentsMinTopUp',
          value: inputs.NowPaymentsMinTopUp.toString(),
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
    ? `${removeTrailingSlash(props.options.ServerAddress)}/api/nowpayments/webhook`
    : t('网站地址') + '/api/nowpayments/webhook';

  return (
    <MacSpinner spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={t('NowPayments 加密货币支付')}>
          <Text>
            {t(
              'NowPayments 是一个支持 USDT / USDC / BTC / ETH 等主流币种的加密货币支付网关。',
            )}
            {t('请先到')}
            <a
              href='https://account.nowpayments.io/'
              target='_blank'
              rel='noreferrer'
            >
              NowPayments 控制台
            </a>
            {t(
              ' 完成 KYC、配置 Coins Settings 与 API Keys，并把下方 Webhook URL 填入 Store Settings → IPN。',
            )}
          </Text>
          <Banner
            type='info'
            description={`${t('IPN Webhook 回调地址（请填到 NowPayments 控制台 Store Settings → IPN）')}: ${webhookUrl}`}
            style={{ marginTop: 12 }}
          />
          <Banner
            type='warning'
            description={t(
              'Webhook 格式请选择 “All strings (所有字符串)”，签名校验最稳定。同时建议开启 “定期通知” 以便 webhook 丢失时自动重发。',
            )}
            style={{ marginTop: 8 }}
          />
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='NowPaymentsEnabled'
                label={t('启用 NowPayments')}
                size='default'
                checkedText='｜'
                uncheckedText='〇'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='NowPaymentsSandbox'
                label={t('沙盒模式')}
                size='default'
                checkedText='｜'
                uncheckedText='〇'
                extraText={t('上线前先用沙盒账号测试一遍')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='NowPaymentsOrderCurrency'
                label={t('报价币种')}
                placeholder={t('默认 USD，也支持 EUR 等')}
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='NowPaymentsApiKey'
                label='API Key'
                placeholder={t(
                  'NowPayments 后台 → Store Settings → API Keys，敏感信息不显示',
                )}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='NowPaymentsIpnSecret'
                label='IPN Secret Key'
                placeholder={t(
                  'NowPayments 后台 → Store Settings → IPN，敏感信息不显示',
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
              <Form.Input
                field='NowPaymentsPayCurrency'
                label={t('默认收款币种')}
                placeholder={t('例如：usdttrc20（留空让用户自选）')}
                extraText={t('常用: usdttrc20 / usdterc20 / usdcerc20 / btc')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='NowPaymentsUnitPrice'
                precision={2}
                label={t('充值价格（x USD/单位）')}
                placeholder={t('1 单位 = 多少 USD，默认 1.0')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='NowPaymentsMinTopUp'
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
                field='NowPaymentsNotifyUrl'
                label={t('自定义 IPN 回调地址（可选）')}
                placeholder={t('留空自动使用服务器地址')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='NowPaymentsReturnUrl'
                label={t('支付成功跳转地址（可选）')}
                placeholder={t('留空跳转到充值页')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='NowPaymentsCancelUrl'
                label={t('用户取消跳转地址（可选）')}
                placeholder={t('留空跳转到充值页')}
              />
            </Col>
          </Row>
          <Button
            onClick={submitNowPaymentsSetting}
            style={{ marginTop: 16 }}
          >
            {t('更新 NowPayments 设置')}
          </Button>
        </Form.Section>
      </Form>
    </MacSpinner>
  );
}
