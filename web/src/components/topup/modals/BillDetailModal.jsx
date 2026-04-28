import React, { useRef, useState } from 'react';
import { Modal, Button } from '@douyinfe/semi-ui';
import { Download, Printer, Receipt } from 'lucide-react';
import { timestamp2string } from '../../../helpers';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import ReceiptModal from './ReceiptModal';

const STATUS_MAP = {
  success: { zh: '已支付', en: 'Paid', color: '#34C759' },
  pending: { zh: '待支付', en: 'Pending', color: '#FF9500' },
  failed: { zh: '失败', en: 'Failed', color: '#FF3B30' },
  expired: { zh: '已过期', en: 'Expired', color: '#FF3B30' },
};

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
  alipay: '支付宝 / Alipay',
  wxpay: '微信支付 / WeChat Pay',
};

function getServiceType(record) {
  const tradeNo = (record?.trade_no || '').toLowerCase();
  if (tradeNo.startsWith('sub')) {
    return { zh: '订阅套餐', en: 'Monthly Subscription' };
  }
  return { zh: 'API 额度充值', en: 'API Token Recharge' };
}

function getBillingMethod(record) {
  const tradeNo = (record?.trade_no || '').toLowerCase();
  if (tradeNo.startsWith('sub')) {
    return { zh: '包月', en: 'Monthly' };
  }
  return { zh: '充值', en: 'Recharge' };
}

const BillDetailModal = ({ visible, onCancel, record, userInfo, t }) => {
  const billRef = useRef(null);
  const isMobile = useIsMobile();
  const [receiptVisible, setReceiptVisible] = useState(false);

  if (!record) return null;

  const isPaid = record.status === 'success';

  const status = STATUS_MAP[record.status] || STATUS_MAP.pending;
  const currency = PAYMENT_CURRENCY[record.payment_method] || 'USD';
  const currencySymbol = currency === 'CNY' ? '¥' : '$';
  const service = getServiceType(record);
  const billing = getBillingMethod(record);
  const billNo = `BILL-${record.trade_no}`;

  const quantity = record.amount || 0;
  const totalPaid = record.money || 0;
  const unitPrice = quantity > 0 ? totalPaid / quantity : 0;

  const handlePrint = () => {
    const element = billRef.current;
    if (!element) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${billNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

  // Styles for the invoice
  const sectionTitle = {
    fontSize: 13,
    fontWeight: 700,
    color: '#1a1a1a',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: 6,
    marginBottom: 12,
  };

  const labelStyle = {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 160,
    display: 'inline-block',
  };

  const valueStyle = {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: 500,
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
  };

  return (
    <>
    <Modal
      title={
        <div className='flex items-center justify-between w-full'>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            {t('bill.title')}
          </span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>{t('取消')}</Button>
          {isPaid && (
            <Button
              theme='light'
              icon={<Receipt size={14} />}
              onClick={() => setReceiptVisible(true)}
            >
              {t('开具收据')}
            </Button>
          )}
          <Button
            type='primary'
            theme='solid'
            icon={<Printer size={14} />}
            onClick={handlePrint}
          >
            {t('bill.downloadPDF')}
          </Button>
        </div>
      }
      size={isMobile ? 'full-width' : 'large'}
      style={{ maxWidth: 720 }}
    >
      {/* ===== Invoice Content ===== */}
      <div ref={billRef} style={{ padding: 24, background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: '3px solid #111' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0, letterSpacing: -0.5 }}>AGGRETOKEN</h1>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>https://aggretoken.com/</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>support@aggretoken.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>
              {t('bill.invoiceTitle')}
            </h2>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>BILL / INVOICE</p>
          </div>
        </div>

        {/* Bill Info + Customer Info — Two Column */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
          {/* Bill Info */}
          <div style={{ flex: 1 }}>
            <div style={sectionTitle}>{t('bill.orderInfo')}</div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.billNo')}</span>
              <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 11 }}>{billNo}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.orderId')}</span>
              <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 11 }}>{record.trade_no}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.transactionId')}</span>
              <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 11 }}>{record.trade_no}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.createTime')}</span>
              <span style={valueStyle}>{timestamp2string(record.create_time)}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.paymentTime')}</span>
              <span style={valueStyle}>{record.complete_time ? timestamp2string(record.complete_time) : '—'}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.paymentStatus')}</span>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: status.color,
                background: status.color + '18',
                padding: '2px 10px',
                borderRadius: 4,
              }}>
                {status.zh} / {status.en}
              </span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.currency')}</span>
              <span style={valueStyle}>{currency}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.paymentMethod')}</span>
              <span style={valueStyle}>{PAYMENT_METHOD_LABEL[record.payment_method] || record.payment_method || '—'}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ flex: 1 }}>
            <div style={sectionTitle}>{t('bill.customerInfo')}</div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.customerName')}</span>
              <span style={valueStyle}>{userInfo?.display_name || userInfo?.username || '—'}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.customerEmail')}</span>
              <span style={valueStyle}>{userInfo?.email || '—'}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.userId')}</span>
              <span style={{ ...valueStyle, fontFamily: 'monospace' }}>{userInfo?.id || '—'}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.customerNote')}</span>
              <span style={valueStyle}>—</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('bill.companyName')}</span>
              <span style={valueStyle}>—</span>
            </div>
          </div>
        </div>

        {/* Service Detail Table */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>{t('bill.serviceDetail')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                  {t('bill.serviceName')}
                </th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                  {t('bill.servicePeriod')}
                </th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                  {t('bill.billingMethod')}
                </th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                  {t('bill.quantity')}
                </th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                  {t('bill.unitPrice')}
                </th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                  {t('bill.subtotal')}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#111' }}>
                  {service.zh}<br/>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{service.en}</span>
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center', color: '#374151' }}>
                  {timestamp2string(record.create_time).split(' ')[0]}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center', color: '#374151' }}>
                  {billing.zh} / {billing.en}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'monospace', color: '#111' }}>
                  {quantity}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'monospace', color: '#111' }}>
                  {currencySymbol}{unitPrice.toFixed(4)}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#111' }}>
                  {currencySymbol}{totalPaid.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#6b7280' }}>
              <span>{t('bill.subtotalLabel')}</span>
              <span style={{ fontFamily: 'monospace', color: '#374151' }}>{currencySymbol}{totalPaid.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#6b7280' }}>
              <span>{t('bill.discount')}</span>
              <span style={{ fontFamily: 'monospace', color: '#374151' }}>—</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: 4,
              borderTop: '2px solid #111', fontSize: 14, fontWeight: 700, color: '#111',
            }}>
              <span>{t('bill.totalPaid')}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 16 }}>{currencySymbol}{totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
            {t('bill.footerNote')}
          </p>
          <p style={{ fontSize: 10, color: '#d1d5db', margin: '6px 0 0' }}>
            AGGRETOKEN &middot; https://aggretoken.com/ &middot; support@aggretoken.com
          </p>
        </div>
      </div>
    </Modal>
    <ReceiptModal
      visible={receiptVisible}
      onCancel={() => setReceiptVisible(false)}
      record={record}
      userInfo={userInfo}
      t={t}
    />
    </>
  );
};

export default BillDetailModal;
