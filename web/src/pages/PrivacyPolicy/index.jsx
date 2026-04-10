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
import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalPage from '../Legal/LegalPage';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'overview',
      title: t('概述'),
      paragraphs: [
        t(
          '我们坚信，隐私是一项基本权利。本隐私政策阐述了我们在您使用本平台的 API 服务、控制台及相关产品时，如何收集、使用、存储与保护您的个人信息及业务数据。',
        ),
        t(
          '我们遵循最小必要原则，仅收集提供服务所必需的数据，并通过严格的组织与技术措施确保数据安全。使用本服务即表示您已阅读并理解本政策。',
        ),
      ],
    },
    {
      id: 'collection',
      title: t('我们收集的信息'),
      paragraphs: [
        t('为提供、维护和改进服务，我们可能收集以下类别的信息：'),
      ],
      list: [
        t('账户信息：注册邮箱、用户名、加密存储的登录凭证、企业联系人信息。'),
        t('身份验证：IP 地址、设备指纹、双因素认证元数据，用于防范未授权访问。'),
        t('账单数据：计费周期、用量聚合、发票信息（不存储完整银行卡号，支付由合规第三方处理）。'),
        t('API 请求元数据：时间戳、模型标识、Token 消耗、延迟指标，用于计费、审计与容量规划。'),
        t('请求与响应内容：仅在您显式开启日志记录功能时留存，默认不持久化存储。'),
      ],
    },
    {
      id: 'usage',
      title: t('信息的使用方式'),
      paragraphs: [
        t('我们使用所收集的信息用于以下合法目的：'),
      ],
      list: [
        t('提供、运维与持续改进核心 API 网关及上游路由服务。'),
        t('计费结算、用量分析及滥用检测。'),
        t('安全事件响应、系统异常排查与法律合规审计。'),
        t('在您明确同意的前提下，向您发送产品更新、安全通告与服务公告。'),
      ],
      note: t(
        '我们绝不会将您的请求内容用于模型训练，也不会出售您的个人信息给第三方。'
      ),
    },
    {
      id: 'storage',
      title: t('数据存储与保留'),
      paragraphs: [
        t(
          '所有数据均存储于具备 ISO 27001、SOC 2 Type II 认证的数据中心，跨区域加密备份，静态数据采用 AES-256 加密，传输数据全程启用 TLS 1.3。',
        ),
        t(
          '账单与审计日志按法律法规要求保留，API 调用元数据默认保留 90 天，请求内容日志（如已开启）可由您自行配置保留周期或随时删除。',
        ),
      ],
    },
    {
      id: 'sharing',
      title: t('信息共享与披露'),
      paragraphs: [
        t(
          '我们不会出售、出租或交易您的个人信息。仅在以下严格限定的情形下，信息可能会被共享：',
        ),
      ],
      list: [
        t('您已给予明确授权。'),
        t('为完成服务交付，必须与上游模型供应商交换经最小化处理的请求内容。'),
        t('应有效法律程序（如法院命令、监管要求）要求披露，且我们会在允许范围内通知您。'),
        t('为保护平台、用户或公众的合法权益与人身安全。'),
      ],
    },
    {
      id: 'rights',
      title: t('您的权利'),
      paragraphs: [
        t('在适用的数据保护法律框架下，您享有以下权利：'),
      ],
      list: [
        t('访问并获取您的个人数据副本。'),
        t('更正不准确或不完整的个人信息。'),
        t('在符合法定条件下请求删除您的数据（被遗忘权）。'),
        t('限制或反对特定处理活动。'),
        t('将数据以结构化、通用格式携带至其他服务。'),
      ],
    },
    {
      id: 'cookies',
      title: t('Cookie 与追踪技术'),
      paragraphs: [
        t(
          '我们仅使用严格必要的会话 Cookie 维持登录态与安全防护，不使用任何第三方广告或跨站追踪 Cookie。您可以通过浏览器设置管理 Cookie，但这可能影响部分功能的可用性。',
        ),
      ],
    },
    {
      id: 'changes',
      title: t('政策变更'),
      paragraphs: [
        t(
          '我们可能会不时更新本政策。重大变更将通过控制台通知、邮件或站内公告提前告知。继续使用服务即视为您接受更新后的条款。',
        ),
      ],
    },
    {
      id: 'contact',
      title: t('联系我们'),
      paragraphs: [
        t(
          '如对本隐私政策或您的个人数据有任何疑问，请通过以下方式联系我们。我们将在 30 个工作日内响应您的请求。',
        ),
      ],
      list: [
        t('隐私与数据保护咨询：support@aggretoken.com'),
        t('账单与支付相关：billing@aggretoken.com'),
      ],
    },
  ];

  return (
    <LegalPage
      title={t('隐私政策')}
      subtitle={t(
        '保护您的数据是我们全部工作的起点。本政策详细说明我们如何收集、处理、存储和保护您的信息。',
      )}
      lastUpdated={t('最后更新：2026 年 4 月 10 日')}
      sections={sections}
    />
  );
};

export default PrivacyPolicy;
