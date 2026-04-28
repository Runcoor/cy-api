import React, { useRef } from 'react';
import { Modal, Button } from '@douyinfe/semi-ui';
import { Printer, Download } from 'lucide-react';
import { timestamp2string } from '../../../helpers';
import { useIsMobile } from '../../../hooks/common/useIsMobile';

const PAYMENT_CURRENCY = {
  alipay: 'CNY',
  wxpay: 'CNY',
  stripe: 'USD',
  creem: 'USD',
  waffo: 'USD',
};

const PAYMENT_METHOD_LABEL = {
  stripe: 'Stripe',
  creem: 'Creem',
  waffo: 'Waffo',
  alipay: 'Alipay',
  wxpay: 'WeChat Pay',
};

function getServiceDescription(record) {
  const tradeNo = (record?.trade_no || '').toLowerCase();
  if (tradeNo.startsWith('sub')) {
    return {
      zh: 'AGGRETOKEN 订阅服务',
      en: 'AGGRETOKEN Subscription Service',
    };
  }
  return {
    zh: 'AGGRETOKEN 平台额度充值',
    en: 'AGGRETOKEN Platform Credit',
  };
}

function pad(n, width = 2) {
  const s = String(n);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

function buildReceiptNo(record) {
  const ts = record?.complete_time || record?.create_time || Math.floor(Date.now() / 1000);
  const d = new Date(ts * 1000);
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const tradeTail = String(record?.trade_no || '').slice(-6).toUpperCase() || '000000';
  return `RCPT-${ymd}-${tradeTail}`;
}

function formatIssueDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ReceiptModal = ({ visible, onCancel, record, userInfo, t }) => {
  const receiptRef = useRef(null);
  const isMobile = useIsMobile();

  if (!record) return null;

  const currency = PAYMENT_CURRENCY[record.payment_method] || 'USD';
  const currencySymbol = currency === 'CNY' ? '¥' : '$';
  const service = getServiceDescription(record);
  const receiptNo = buildReceiptNo(record);
  const totalPaid = Number(record.money || 0);
  const issueDate = formatIssueDate(record.complete_time || record.create_time);
  const customerRef = userInfo?.email || (userInfo?.id ? `UID-${userInfo.id}` : '—');

  const printOrSave = () => {
    const element = receiptRef.current;
    if (!element) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset='utf-8' />
        <title>${receiptNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #fff; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4; margin: 16mm; }
          }
        </style>
      </head>
      <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  const seal = (
    <svg width='110' height='110' viewBox='0 0 110 110' style={{ overflow: 'visible' }}>
      <defs>
        <path id='rcpt-circle-top' d='M 55,55 m -42,0 a 42,42 0 1,1 84,0' />
        <path id='rcpt-circle-bot' d='M 55,55 m -42,0 a 42,42 0 1,0 84,0' />
      </defs>
      <circle cx='55' cy='55' r='50' fill='none' stroke='#b91c1c' strokeWidth='2.5' />
      <circle cx='55' cy='55' r='44' fill='none' stroke='#b91c1c' strokeWidth='1' />
      <text fill='#b91c1c' fontSize='9' fontWeight='700' letterSpacing='2'>
        <textPath href='#rcpt-circle-top' startOffset='50%' textAnchor='middle'>
          AGGRETOKEN · OFFICIAL RECEIPT
        </textPath>
      </text>
      <text fill='#b91c1c' fontSize='8' fontWeight='600' letterSpacing='1.5'>
        <textPath href='#rcpt-circle-bot' startOffset='50%' textAnchor='middle'>
          PAYMENT CONFIRMED · 付款确认
        </textPath>
      </text>
      <polygon points='55,30 58,40 68,40 60,46 63,56 55,50 47,56 50,46 42,40 52,40' fill='#b91c1c' />
      <text x='55' y='75' textAnchor='middle' fill='#b91c1c' fontSize='14' fontWeight='800' letterSpacing='2'>
        PAID
      </text>
    </svg>
  );

  const labelStyle = {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 600,
    marginBottom: 4,
  };
  const valueStyle = {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: 500,
  };

  return (
    <Modal
      title={
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
          {t('收据 / Official Receipt')}
        </span>
      }
      visible={visible}
      onCancel={onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>{t('关闭')}</Button>
          <Button
            type='primary'
            theme='solid'
            icon={<Download size={14} />}
            onClick={printOrSave}
          >
            {t('下载收据 PDF')}
          </Button>
        </div>
      }
      size={isMobile ? 'full-width' : 'large'}
      style={{ maxWidth: 760 }}
    >
      {/* ===== Receipt Content ===== */}
      <div
        ref={receiptRef}
        style={{
          padding: 36,
          background: '#fff',
          color: '#0f172a',
          fontFamily: "'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                background: '#0f172a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: -1,
              }}
            >
              AT
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: '#0f172a' }}>
                AGGRETOKEN
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Cloud AI Platform · 云端 AI 服务
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, color: '#0f172a' }}>
              RECEIPT
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, letterSpacing: 2 }}>
              收 据
            </div>
          </div>
        </div>

        <div style={{ height: 3, background: '#0f172a', marginBottom: 22 }} />

        {/* Meta block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 28 }}>
          <div>
            <div style={labelStyle}>{t('Receipt No. / 收据编号')}</div>
            <div style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 12 }}>{receiptNo}</div>
          </div>
          <div>
            <div style={labelStyle}>{t('Issue Date / 开具日期')}</div>
            <div style={valueStyle}>{issueDate}</div>
          </div>
          <div>
            <div style={labelStyle}>{t('Currency / 币种')}</div>
            <div style={valueStyle}>{currency}</div>
          </div>
        </div>

        {/* Received from */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>
            {t('Received From / 付款方')}
          </div>
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '14px 18px',
              background: '#f8fafc',
            }}
          >
            <div style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 13 }}>{customerRef}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              {t('Account Reference')}
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>
            {t('Payment Details / 付款明细')}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, letterSpacing: 0.5 }}>
                  {t('Description / 项目说明')}
                </th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, letterSpacing: 0.5 }}>
                  {t('Method / 支付方式')}
                </th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, letterSpacing: 0.5 }}>
                  {t('Amount / 金额')}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '14px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{service.zh}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{service.en}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, fontFamily: 'monospace' }}>
                    Ref: {record.trade_no}
                  </div>
                </td>
                <td style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', color: '#374151' }}>
                  {PAYMENT_METHOD_LABEL[record.payment_method] || record.payment_method || '—'}
                </td>
                <td
                  style={{
                    padding: '14px',
                    borderBottom: '1px solid #e2e8f0',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  {currencySymbol}
                  {totalPaid.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div
            style={{
              minWidth: 280,
              border: '2px solid #0f172a',
              padding: '14px 20px',
              borderRadius: 6,
              background: '#0f172a',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7, fontWeight: 600 }}>
              {t('TOTAL RECEIVED / 实收总额')}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', marginTop: 4, letterSpacing: -1 }}>
              {currencySymbol}
              {totalPaid.toFixed(2)}{' '}
              <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.7, letterSpacing: 1 }}>
                {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Statement + Seal */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 28 }}>
          <div style={{ flex: 1, fontSize: 11, color: '#475569', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 6 }}>
              {t('AGGRETOKEN hereby acknowledges receipt of the payment indicated above for the services rendered.')}
            </p>
            <p style={{ marginBottom: 6 }}>
              {t('AGGRETOKEN 兹确认已收到上述款项，对应服务已按约提供。')}
            </p>
            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' }}>
              {t('This document is a payment receipt for record purposes only and does not constitute a tax invoice. 本收据仅为付款凭证，不作为税务发票使用。')}
            </p>
          </div>
          <div style={{ width: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ transform: 'rotate(-12deg)' }}>{seal}</div>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, fontWeight: 600 }}>
              {issueDate}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            AGGRETOKEN · {t('Cloud AI Platform')}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            https://aggretoken.com/ · support@aggretoken.com
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
