import type { Invoice, CompanyInfo } from '../types';
import { formatCurrency } from '../utils/invoiceCalculations';
import { format } from 'date-fns';

interface InvoicePreviewProps {
  invoice: Invoice;
  companyInfo: CompanyInfo | null;
}

export const InvoicePreview = ({ invoice, companyInfo }: InvoicePreviewProps) => {
  if (!companyInfo) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
        Konfigurera företagsinformation i Inställningar för att se förhandsgranskning
      </div>
    );
  }

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

        {/* Invoice Title & Info */}
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: '0 0 20px 0', fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
            FAKTURA
          </h1>
          <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <div><strong>Fakturanummer:</strong> {invoice.invoiceNumber}</div>
            <div><strong>Fakturadatum:</strong> {format(new Date(invoice.invoiceDate), 'yyyy-MM-dd')}</div>
            <div><strong>Förfallodatum:</strong> {format(new Date(invoice.dueDate), 'yyyy-MM-dd')}</div>
            <div><strong>Betalningsvillkor:</strong> {invoice.paymentTerms} dagar</div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Till:</p>
        <p style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 'bold' }}>{invoice.customer.name}</p>
        <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>{invoice.customer.address}</p>
        <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>
          {invoice.customer.postalCode} {invoice.customer.city}
        </p>
        {invoice.customer.organizationNumber && (
          <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>
            Org.nr: {invoice.customer.organizationNumber}
          </p>
        )}
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Beskrivning
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Antal
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Pris
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Moms %
            </th>
            <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#374151' }}>
              Summa
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px 8px', fontSize: '13px' }}>{item.description}</td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px' }}>{item.quantity}</td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px' }}>
                {formatCurrency(item.unitPrice, invoice.currency)}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px' }}>{item.vatRate}%</td>
              <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '13px' }}>
                {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <div style={{ minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '14px' }}>Delsumma:</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '14px' }}>Moms:</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {formatCurrency(invoice.vatAmount, invoice.currency)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #374151' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Att betala:</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {formatCurrency(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '4px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
          Betalningsinformation
        </h3>
        <p style={{ margin: '5px 0', fontSize: '13px' }}>
          <strong>Bankgiro/Plusgiro:</strong> {companyInfo.bankAccount}
        </p>
        <p style={{ margin: '5px 0', fontSize: '13px' }}>
          <strong>OCR/Meddelande:</strong> {invoice.invoiceNumber}
        </p>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ padding: '15px', backgroundColor: '#fef3c7', borderRadius: '4px', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#92400e' }}>
            Meddelande:
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350f', whiteSpace: 'pre-wrap' }}>
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
};
