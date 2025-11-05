import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { QuotePreview } from '../components/QuotePreview';
import { ArrowLeft, Edit, Download, Mail, Trash2, Check, X, FileText } from 'lucide-react';
import { formatCurrency, getDaysUntilExpiration, getQuoteStatus, canDeleteQuote, canConvertToInvoice, canEditQuote } from '../utils/quoteCalculations';
import { format } from 'date-fns';
import { downloadQuotePDF } from '../services/quotePdfService';
import { convertQuoteToInvoice } from '../utils/quoteToInvoice';

export const QuoteView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getQuoteById, companyInfo, deleteQuote, updateQuote, invoices, addInvoice } = useStore();

  const quote = id ? getQuoteById(id) : null;

  if (!quote) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Quote not found</h2>
        <Link to="/quotes" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Quotes
        </Link>
      </div>
    );
  }

  const statusInfo = getQuoteStatus(quote);
  const daysUntilExpiration = getDaysUntilExpiration(quote);
  const canDelete = canDeleteQuote(quote);
  const canConvert = canConvertToInvoice(quote);
  const canEdit = canEditQuote(quote);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      await deleteQuote(quote.id);
      navigate('/quotes');
    }
  };

  const handleAccept = async () => {
    if (window.confirm(`Accept quote ${quote.quoteNumber}?`)) {
      await updateQuote(quote.id, {
        status: 'accepted',
        respondedAt: new Date()
      });
    }
  };

  const handleReject = async () => {
    if (window.confirm(`Reject quote ${quote.quoteNumber}?`)) {
      await updateQuote(quote.id, {
        status: 'rejected',
        respondedAt: new Date()
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!companyInfo) {
      alert('Please configure company information first in Settings');
      return;
    }
    downloadQuotePDF(quote, companyInfo);
  };

  const handleConvertToInvoice = async () => {
    if (!canConvert) {
      alert('This quote cannot be converted to an invoice');
      return;
    }

    if (!window.confirm(`Convert quote ${quote.quoteNumber} to invoice?`)) {
      return;
    }

    try {
      // Convert quote to invoice
      const invoiceData = convertQuoteToInvoice(quote, invoices);

      // Create the invoice
      await addInvoice(invoiceData);

      // Get the newly created invoice ID from the store
      const newInvoice = invoices[invoices.length - 1];

      // Update quote status to converted
      await updateQuote(quote.id, {
        status: 'converted',
        convertedToInvoiceId: newInvoice?.id
      });

      // Navigate to the new invoice
      if (newInvoice) {
        navigate(`/invoices/${newInvoice.id}`);
      } else {
        alert('Invoice created successfully!');
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      alert('Failed to convert quote to invoice. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    if (!companyInfo) {
      alert('Please configure company information first in Settings');
      return;
    }

    const subject = `Quote ${quote.quoteNumber} from ${companyInfo.name}`;
    const body = `Hello ${quote.customer.name},

Please find attached the quote from ${companyInfo.name}.

Quote Number: ${quote.quoteNumber}
Quote Date: ${format(new Date(quote.quoteDate), 'yyyy-MM-dd')}
Valid Until: ${format(new Date(quote.validUntil), 'yyyy-MM-dd')} (${daysUntilExpiration} days)
Total Amount: ${formatCurrency(quote.total, quote.currency)}

${quote.deliveryTime ? `Delivery Time: ${quote.deliveryTime}\n` : ''}${quote.paymentTerms ? `Payment Terms: ${quote.paymentTerms}\n` : ''}
${quote.notes ? `Notes:\n${quote.notes}\n\n` : ''}If you have any questions, please contact us at ${companyInfo.email} or ${companyInfo.phone}.

Best regards,
${companyInfo.name}`;

    const mailtoLink = `mailto:${quote.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    // Update quote status to "sent"
    if (quote.status === 'draft') {
      await updateQuote(quote.id, {
        status: 'sent',
        sentAt: new Date()
      });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/quotes" className="btn btn-secondary">
            <ArrowLeft size={20} />
            Back
          </Link>
          <div>
            <h1 className="page-title">Quote {quote.quoteNumber}</h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
              <span
                className="badge"
                style={{
                  backgroundColor: statusInfo.color,
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {statusInfo.label}
              </span>
              {quote.status === 'sent' && daysUntilExpiration > 0 && daysUntilExpiration <= 7 && (
                <span style={{ fontSize: '14px', color: daysUntilExpiration <= 3 ? '#EF4444' : '#F59E0B' }}>
                  {daysUntilExpiration} days until expiration
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canEdit && (
            <Link to={`/quotes/${quote.id}/edit`} className="btn btn-secondary">
              <Edit size={20} />
              Edit
            </Link>
          )}
          {(quote.status === 'draft' || quote.status === 'sent') && (
            <button onClick={handleSendEmail} className="btn btn-success">
              <Mail size={20} />
              Send via Email
            </button>
          )}
          <button onClick={handleDownloadPDF} className="btn btn-secondary">
            <Download size={20} />
            Download PDF
          </button>
          {quote.status === 'sent' && (
            <>
              <button onClick={handleAccept} className="btn btn-success">
                <Check size={20} />
                Accept
              </button>
              <button onClick={handleReject} className="btn btn-danger">
                <X size={20} />
                Reject
              </button>
            </>
          )}
          {canConvert && (
            <button onClick={handleConvertToInvoice} className="btn btn-primary">
              <FileText size={20} />
              Convert to Invoice
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="btn btn-danger">
              <Trash2 size={20} />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Quote Details Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 className="card-header">Quote Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>Quote Date</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {format(new Date(quote.quoteDate), 'yyyy-MM-dd')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>Valid Until</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {format(new Date(quote.validUntil), 'yyyy-MM-dd')}
            </div>
          </div>
          {quote.deliveryTime && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>Delivery Time</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>{quote.deliveryTime}</div>
            </div>
          )}
          {quote.paymentTerms && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>Payment Terms</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>{quote.paymentTerms}</div>
            </div>
          )}
          {quote.sentAt && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>Sent At</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {format(new Date(quote.sentAt), 'yyyy-MM-dd HH:mm')}
              </div>
            </div>
          )}
          {quote.respondedAt && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>Responded At</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {format(new Date(quote.respondedAt), 'yyyy-MM-dd HH:mm')}
              </div>
            </div>
          )}
          {quote.convertedToInvoiceId && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '4px' }}>Converted to Invoice</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                <Link to={`/invoices/${quote.convertedToInvoiceId}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                  View Invoice
                </Link>
              </div>
            </div>
          )}
        </div>
        {quote.internalNotes && (
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--gray-50)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '8px' }}>
              Internal Notes (not visible to customer):
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray-600)', whiteSpace: 'pre-wrap' }}>
              {quote.internalNotes}
            </div>
          </div>
        )}
      </div>

      {/* Quote Preview Card */}
      <div className="card">
        <QuotePreview quote={quote} companyInfo={companyInfo} />
      </div>
    </div>
  );
};
