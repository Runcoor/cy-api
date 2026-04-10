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

const Security = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'philosophy',
      title: t('安全理念'),
      paragraphs: [
        t(
          '安全不是附加功能，而是我们产品的基础架构。我们以"默认安全、纵深防御、最小权限、持续验证"为核心原则，从基础设施、应用层到运维流程构建多层防护体系，为企业级客户提供值得信赖的 AI 基础设施。',
        ),
      ],
    },
    {
      id: 'infrastructure',
      title: t('基础设施安全'),
      paragraphs: [
        t(
          '我们的生产环境部署于具备国际权威认证的数据中心，物理访问严格受控并全程视频监控。',
        ),
      ],
      list: [
        t('数据中心通过 ISO 27001、SOC 2 Type II 及 CSA STAR 认证。'),
        t('多可用区部署，自动故障切换，承诺 99.9% 月度可用性 SLA。'),
        t('专用 VPC 网络隔离，生产与开发环境严格分离。'),
        t('全链路 DDoS 防护，实时流量清洗与异常流量自动阻断。'),
      ],
    },
    {
      id: 'encryption',
      title: t('加密与密钥管理'),
      list: [
        t('传输层：所有 API 流量强制启用 TLS 1.3，禁用弱密码套件，支持前向保密。'),
        t('静态数据：数据库与对象存储采用 AES-256 加密，密钥由 HSM 硬件模块管理。'),
        t('API Key：使用 Argon2id 哈希存储，不以明文形式保留；密钥泄露可一键失效并重新签发。'),
        t('机密管理：所有服务凭证通过 Vault 集中管理，自动轮换，最小权限授予。'),
      ],
    },
    {
      id: 'access-control',
      title: t('身份认证与访问控制'),
      list: [
        t('支持 OAuth 2.0、OIDC、SAML 2.0 单点登录，兼容主流企业身份提供商。'),
        t('强制可选的双因素认证（TOTP、WebAuthn/Passkey），防范凭证盗用。'),
        t('基于角色的访问控制（RBAC），支持组织、团队、子账户多层级权限划分。'),
        t('IP 白名单、API Key 作用域限制与过期策略，精细化控制访问边界。'),
        t('所有管理操作与权限变更均生成不可篡改的审计日志，保留至少 180 天。'),
      ],
    },
    {
      id: 'data-protection',
      title: t('数据保护'),
      paragraphs: [
        t(
          '我们坚持"默认不保留请求内容"原则。除非您显式开启日志记录，API 请求与响应正文不会持久化存储，仅用于完成本次转发。',
        ),
      ],
      list: [
        t('敏感字段（如令牌、身份信息）在日志与监控指标中自动脱敏。'),
        t('跨境数据传输遵循标准合同条款（SCCs）与本地化合规要求。'),
        t('支持客户自带密钥（BYOK）与数据驻留区域选择，满足行业监管要求。'),
      ],
      note: t(
        '我们郑重承诺：您的任何请求内容、业务数据绝不会用于模型训练或商业分析。'
      ),
    },
    {
      id: 'secure-sdlc',
      title: t('安全开发生命周期'),
      list: [
        t('所有代码变更必须经至少一位资深工程师代码审查并通过自动化安全扫描。'),
        t('CI/CD 流水线集成 SAST、DAST、SCA 及容器镜像漏洞检测。'),
        t('依赖库与基础镜像每日同步漏洞情报，重大漏洞在 48 小时内修复。'),
        t('生产发布采用灰度策略，具备秒级回滚能力。'),
      ],
    },
    {
      id: 'monitoring',
      title: t('安全监控与事件响应'),
      paragraphs: [
        t(
          '我们建立 7×24 小时安全运营中心（SOC），通过 SIEM 平台实时聚合日志与指标，基于机器学习的异常检测可识别账户滥用、暴力破解、异常流量等威胁。',
        ),
      ],
      list: [
        t('安全事件响应流程符合 NIST SP 800-61 框架。'),
        t('严重事件首次响应时间承诺 < 15 分钟。'),
        t('受影响客户将在 72 小时内得到书面通知（符合 GDPR 第 33 条）。'),
        t('每季度开展红蓝对抗演练与应急预案复盘。'),
      ],
    },
    {
      id: 'compliance',
      title: t('合规与认证'),
      paragraphs: [
        t('我们持续投入合规建设，已获得或对齐以下框架与标准：'),
      ],
      list: [
        t('ISO/IEC 27001 信息安全管理体系'),
        t('SOC 2 Type II（安全性、可用性、保密性原则）'),
        t('GDPR 与中华人民共和国《个人信息保护法》'),
        t('《网络安全法》《数据安全法》及等级保护 2.0 三级'),
        t('HIPAA 合规路径支持（针对医疗行业客户，需签署 BAA）'),
      ],
    },
    {
      id: 'responsible-disclosure',
      title: t('漏洞披露计划'),
      paragraphs: [
        t(
          '我们欢迎并感谢安全研究社区的贡献。如您发现潜在安全漏洞，请通过安全邮箱负责任地披露。我们承诺：',
        ),
      ],
      list: [
        t('24 小时内确认收到报告。'),
        t('不对善意研究人员采取法律行动。'),
        t('根据漏洞严重程度提供致谢或赏金（参见漏洞赏金政策）。'),
        t('在修复完成后的合理时间内公开致谢。'),
      ],
    },
    {
      id: 'contact',
      title: t('安全联系方式'),
      paragraphs: [
        t(
          '如需报告安全漏洞、申请渗透测试授权、获取合规文档或进行安全评估，请通过以下方式联系我们的安全团队：',
        ),
      ],
      list: [
        t('安全漏洞报告与紧急响应：support@aggretoken.com'),
      ],
      note: t('我们承诺 24 小时内确认收到安全报告，并依据严重程度启动对应响应流程。'),
    },
  ];

  return (
    <LegalPage
      title={t('安全')}
      subtitle={t(
        '企业级安全承诺。从基础设施、加密、访问控制到事件响应，全栈纵深防御。',
      )}
      lastUpdated={t('最后更新：2026 年 4 月 10 日')}
      sections={sections}
    />
  );
};

export default Security;
