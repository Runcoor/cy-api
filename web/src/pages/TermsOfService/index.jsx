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

const TermsOfService = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'acceptance',
      title: t('条款接受'),
      paragraphs: [
        t(
          '欢迎使用本平台（以下简称"服务"）。本服务条款构成您（以下简称"用户"）与我们之间具有法律约束力的协议。通过注册账户、访问控制台或调用任何 API 端点，您即表示已阅读、理解并同意受本条款约束。',
        ),
        t('若您代表组织接受本条款，您声明并保证您拥有约束该组织的合法授权。'),
      ],
    },
    {
      id: 'service',
      title: t('服务说明'),
      paragraphs: [
        t(
          '我们提供统一的 AI API 网关服务，聚合并转发来自上游提供商的模型能力，包括但不限于大语言模型、图像生成、音频处理及多模态接口。服务以"现状"方式提供，我们保留持续迭代、调整功能边界及弃用特定端点的权利，并会合理提前通告。',
        ),
      ],
    },
    {
      id: 'account',
      title: t('账户与访问'),
      paragraphs: [
        t('您需对账户凭证的保密与任何通过您账户发生的活动负全部责任。'),
      ],
      list: [
        t('您必须提供真实、准确、完整的注册信息并保持更新。'),
        t('严禁共享账户凭证、转售 API Key 或以任何形式出借账户。'),
        t('发现任何未经授权的使用后，您应立即通知我们并轮换密钥。'),
        t('我们保留依据滥用证据暂停或终止账户的权利。'),
      ],
    },
    {
      id: 'acceptable-use',
      title: t('可接受使用政策'),
      paragraphs: [
        t('您承诺不会利用本服务从事以下任何活动：'),
      ],
      list: [
        t('违反任何适用法律、行政法规或行业监管要求。'),
        t('生成、传播或存储包含儿童剥削、恐怖主义、非法武器或其他明令禁止内容的材料。'),
        t('对平台或上游供应商实施拒绝服务、渗透、逆向工程或滥用行为。'),
        t('冒充他人、伪造来源或从事欺诈、洗钱等犯罪活动。'),
        t('绕过速率限制、配额或任何技术防护措施。'),
        t('未经明确授权使用服务生成的内容训练可与本服务竞争的模型。'),
      ],
      note: t('违反可接受使用政策将导致立即暂停服务，严重情形下我们将保留追究法律责任的权利。'),
    },
    {
      id: 'billing',
      title: t('计费与支付'),
      paragraphs: [
        t(
          '服务按实际用量或预付套餐计费。计费基于通过我们计量系统记录的 Token 消耗、请求次数及模型调用类型，结算口径以控制台显示的数据为准。',
        ),
      ],
      list: [
        t('预付余额不可退款，除非适用的法律强制要求或经书面双方另行约定。'),
        t('企业月结客户须在开票日起 15 个自然日内完成付款；逾期将产生滞纳金并可能导致服务暂停。'),
        t('税款由用户根据其税务辖区法规自行承担。'),
      ],
    },
    {
      id: 'sla',
      title: t('服务级别'),
      paragraphs: [
        t(
          '我们承诺企业级 99.9% 月度可用性。具体服务级别协议（SLA）、计算口径、除外情形及违约补偿方案详见单独签署的 SLA 文件。',
        ),
      ],
    },
    {
      id: 'ip',
      title: t('知识产权'),
      paragraphs: [
        t(
          '本平台的所有软件、商标、文档及视觉设计的全部知识产权归本公司及其授权方所有。您保留对您提交的请求输入以及服务返回的输出内容的权利，但您应确保这些内容不侵犯任何第三方合法权益。',
        ),
      ],
    },
    {
      id: 'open-source',
      title: t('开源声明'),
      paragraphs: [
        t(
          '本服务基于 new-api 开源项目构建，遵循 GNU Affero General Public License v3.0 (AGPL-3.0) 协议。本服务的源代码已依据协议要求公开发布。',
        ),
      ],
      list: [
        t('上游项目：https://github.com/QuantumNous/new-api'),
        t('本项目源码：https://github.com/Runcoor/aggre-api'),
      ],
    },
    {
      id: 'liability',
      title: t('免责声明与责任限制'),
      paragraphs: [
        t(
          '在适用法律允许的最大范围内，服务按"现状"和"可用"形式提供，我们不就适销性、特定用途适用性或不侵权作出任何明示或默示担保。',
        ),
        t(
          '无论基于合同、侵权或其他法律理论，我们对任何间接、附带、特殊、惩罚性或后果性损害概不负责。在任何情况下，我们对您的累计责任总额不超过事故发生前 12 个月内您向我们实际支付的费用金额。',
        ),
      ],
    },
    {
      id: 'termination',
      title: t('服务终止'),
      paragraphs: [
        t(
          '任何一方可在书面通知对方后，按约定条件终止本协议。发生重大违约时，非违约方可立即终止。终止后，您应停止使用服务，我们将依据隐私政策的保留要求处理您的数据。',
        ),
      ],
    },
    {
      id: 'governing-law',
      title: t('适用法律与争议解决'),
      paragraphs: [
        t(
          '本条款受中华人民共和国法律管辖（不含冲突法规则）。因本条款引发的争议，双方应首先友好协商解决；协商不成的，任一方可提交至平台所在地有管辖权的人民法院诉讼解决。',
        ),
      ],
    },
    {
      id: 'updates',
      title: t('条款变更'),
      paragraphs: [
        t(
          '我们可能会不时更新本条款。对于重大变更，我们会通过控制台、邮件或站内公告提前至少 15 天通知。若您不同意变更后的条款，应立即停止使用服务。',
        ),
      ],
    },
    {
      id: 'contact',
      title: t('联系我们'),
      paragraphs: [
        t('如对本服务条款有任何疑问，请通过以下方式联系我们：'),
      ],
      list: [
        t('客户支持：support@aggretoken.com'),
        t('商务合作：hello@aggretoken.com'),
        t('账单与支付：billing@aggretoken.com'),
      ],
    },
  ];

  return (
    <LegalPage
      title={t('服务条款')}
      subtitle={t(
        '规范、透明的契约关系是长期合作的基础。请在使用本服务前仔细阅读以下条款。',
      )}
      lastUpdated={t('最后更新：2026 年 4 月 10 日')}
      sections={sections}
    />
  );
};

export default TermsOfService;
