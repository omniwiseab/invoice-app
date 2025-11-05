import type { Quote, CompanyInfo } from '../types';
import { formatCurrency, calculateQuoteTotals } from '../utils/quoteCalculations';
import { format } from 'date-fns';

interface QuotePreviewProps {
  quote: Quote;
  companyInfo: CompanyInfo | null;
}

export const QuotePreview = ({ quote, companyInfo }: QuotePreviewProps) => {
  if (!companyInfo) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
        Configure company information in Settings to see preview
      </div>
    );
  }

  const totals = calculateQuoteTotals(quote.items, quote.discount, quote.discountAmount);

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Logo */}
      {companyInfo.logo && (
        <div style={{ marginBottom: '20px' }}>
          <img
            src={companyInfo.logo}
            alt="Logo"
            style={{ height: '60px', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        {/* Company Info */}
        <div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
            {companyInfo.name}
          </h3>
          <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>{companyInfo.address}</p>
          <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>
            {companyInfo.postalCode} {companyInfo.city}
          </p>
          <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>
            Org.nr: {companyInfo.organizationNumber}
          </p>
          <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>{companyInfo.email}</p>
        </div>

        {/* Quote Title & Info */}
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: '0 0 20px 0', fontSize: '32px', fontWeight: 'bold', color: '#3B82F6' }}>
            QUOTE
          </h1>
          <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <div><strong>Quote Number:</strong> {quote.quoteNumber}</div>
            <div><strong>Quote Date:</strong> {format(new Date(quote.quoteDate), 'yyyy-MM-dd')}</div>
            <div style={{ color: '#EF4444', fontWeight: '600' }}>
              <strong>Valid Until:</strong> {format(new Date(quote.validUntil), 'yyyy-MM-dd')}
            </div>
            {quote.deliveryTime && (
              <div><strong>Delivery Time:</strong> {quote.deliveryTime}</div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>To:</p>
        <p style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 'bold' }}>{quote.customer.name}</p>
        <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>{quote.customer.address}</p>
        <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>
          {quote.customer.postalCode} {quote.customer.city}
        </p>
        {quote.customer.organizationNumber && (
          <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>
            Org.nr: {quote.customer.organizationNumber}
          </p>
        )}
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Description
            </th>
            {quote.items.some(item => item.category) && (
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
                Category
              </th>
            )}
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Quantity
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Unit Price
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              VAT %
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px 8px', fontSize: '13px' }}>{item.description}</td>
              {quote.items.some(item => item.category) && (
                <td style={{ padding: '12px 8px', fontSize: '13px', color: '#6B7280' }}>{item.category || '-'}</td>
              )}
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px' }}>{item.quantity}</td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px' }}>
                {formatCurrency(item.unitPrice, quote.currency)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px' }}>{item.vatRate}%</td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px' }}>
                {formatCurrency(item.total, quote.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div style={{ minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '14px' }}>Subtotal:</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {formatCurrency(totals.subtotal, quote.currency)}
            </span>
          </div>
          {totals.discountApplied > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb', color: '#10B981' }}>
              <span style={{ fontSize: '14px' }}>
                Discount {quote.discount ? `(${quote.discount}%)` : ''}:
              </span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                -{formatCurrency(totals.discountApplied, quote.currency)}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '14px' }}>VAT:</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {formatCurrency(totals.vatAmount, quote.currency)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #374151' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total:</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#3B82F6' }}>
              {formatCurrency(totals.total, quote.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      {quote.paymentTerms && (
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '4px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
            Payment Terms
          </h3>
          <p style={{ margin: '0', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
            {quote.paymentTerms}
          </p>
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div style={{ padding: '15px', backgroundColor: '#EFF6FF', borderRadius: '4px', borderLeft: '4px solid #3B82F6', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#1E40AF' }}>
            Notes:
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#1E3A8A', whiteSpace: 'pre-wrap' }}>
            {quote.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
        <p style={{ margin: '0 0 5px 0' }}>
          This quote is valid until {format(new Date(quote.validUntil), 'yyyy-MM-dd')}
        </p>
        <p style={{ margin: '0' }}>
          For questions, contact us at {companyInfo.email} or {companyInfo.phone}
        </p>
      </div>
    </div>
  );
};
