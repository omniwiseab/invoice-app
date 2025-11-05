import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, getQuoteStatus, getDaysUntilExpiration, canDeleteQuote, canConvertToInvoice } from '../utils/quoteCalculations';
import { Plus, Eye, Edit, Trash2, Mail, Download, Check, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Quote } from '../types';
import { downloadQuotePDF } from '../services/quotePdfService';
import { convertQuoteToInvoice } from '../utils/quoteToInvoice';

export const QuoteList = () => {
  const navigate = useNavigate();
  const { quotes, loadQuotes, deleteQuote, updateQuote, companyInfo, invoices, addInvoice } = useStore();
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await loadQuotes();
      setLoading(false);
    };
    loadData();
  }, [loadQuotes]);

  const filteredQuotes = quotes.filter(quote => {
    if (filter === 'all') return true;
    return getQuoteStatus(quote).status === filter;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      await deleteQuote(id);
    }
  };

  const handleAccept = async (quote: Quote) => {
    if (window.confirm(`Accept quote ${quote.quoteNumber}?`)) {
      await updateQuote(quote.id, {
        status: 'accepted',
        respondedAt: new Date()
      });
    }
  };

  const handleReject = async (quote: Quote) => {
    if (window.confirm(`Reject quote ${quote.quoteNumber}?`)) {
      await updateQuote(quote.id, {
        status: 'rejected',
        respondedAt: new Date()
      });
    }
  };

  const handleSendEmail = async (quote: Quote) => {
    if (!companyInfo) {
      alert('Please configure company information first in Settings');
      return;
    }

    const daysValid = getDaysUntilExpiration(quote);
    const subject = `Quote ${quote.quoteNumber} from ${companyInfo.name}`;
    const body = `Hello ${quote.customer.name},

Please find attached the quote from ${companyInfo.name}.

Quote Number: ${quote.quoteNumber}
Quote Date: ${format(new Date(quote.quoteDate), 'yyyy-MM-dd')}
Valid Until: ${format(new Date(quote.validUntil), 'yyyy-MM-dd')} (${daysValid} days)
Total Amount: ${formatCurrency(quote.total, quote.currency)}

${quote.deliveryTime ? `Delivery Time: ${quote.deliveryTime}\n` : ''}${quote.paymentTerms ? `Payment Terms: ${quote.paymentTerms}\n` : ''}
${quote.notes ? `Notes:\n${quote.notes}\n\n` : ''}If you have any questions, please contact us at ${companyInfo.email} or ${companyInfo.phone}.

Best regards,
${companyInfo.name}`;

    const mailtoLink = `mailto:${quote.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    if (quote.status === 'draft') {
      await updateQuote(quote.id, {
        status: 'sent',
        sentAt: new Date()
      });
    }
  };

  const handleDownloadPDF = (quote: Quote) => {
    if (!companyInfo) {
      alert('Please configure company information first in Settings');
      return;
    }
    downloadQuotePDF(quote, companyInfo);
  };

  const handleConvertToInvoice = async (quote: Quote) => {
    if (!canConvertToInvoice(quote)) {
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

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading quotes...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quotes</h1>
        <Link to="/quotes/new" className="btn btn-primary">
          <Plus size={20} />
          New Quote
        </Link>
      </div>

      <div className="card">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['all', 'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              {status === 'all' ? 'All' :
               status === 'draft' ? 'Drafts' :
               status === 'sent' ? 'Sent' :
               status === 'accepted' ? 'Accepted' :
               status === 'rejected' ? 'Rejected' :
               status === 'expired' ? 'Expired' : 'Converted'}
            </button>
          ))}
        </div>

        {filteredQuotes.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '40px' }}>
            No quotes found
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Quote Date</th>
                  <th>Valid Until</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map(quote => {
                  const statusInfo = getQuoteStatus(quote);
                  const daysUntilExpiration = getDaysUntilExpiration(quote);
                  const canDelete = canDeleteQuote(quote);
                  const canConvert = canConvertToInvoice(quote);

                  return (
                    <tr key={quote.id}>
                      <td>{quote.quoteNumber}</td>
                      <td>{quote.customer.name}</td>
                      <td>{new Date(quote.quoteDate).toLocaleDateString('sv-SE')}</td>
                      <td>
                        {new Date(quote.validUntil).toLocaleDateString('sv-SE')}
                        {quote.status === 'sent' && daysUntilExpiration > 0 && daysUntilExpiration <= 3 && (
                          <span style={{ color: '#EF4444', fontSize: '0.85em', marginLeft: '8px' }}>
                            ({daysUntilExpiration}d left)
                          </span>
                        )}
                      </td>
                      <td>{formatCurrency(quote.total, quote.currency)}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: statusInfo.color,
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85em'
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Link
                            to={`/quotes/${quote.id}`}
                            className="btn btn-secondary btn-sm"
                            title="View"
                          >
                            <Eye size={16} />
                          </Link>

                          {quote.status === 'draft' && (
                            <Link
                              to={`/quotes/${quote.id}/edit`}
                              className="btn btn-secondary btn-sm"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </Link>
                          )}

                          {(quote.status === 'draft' || quote.status === 'sent') && (
                            <button
                              onClick={() => handleSendEmail(quote)}
                              className="btn btn-success btn-sm"
                              title="Send via email"
                            >
                              <Mail size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDownloadPDF(quote)}
                            className="btn btn-secondary btn-sm"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>

                          {quote.status === 'sent' && (
                            <>
                              <button
                                onClick={() => handleAccept(quote)}
                                className="btn btn-success btn-sm"
                                title="Accept quote"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(quote)}
                                className="btn btn-danger btn-sm"
                                title="Reject quote"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}

                          {canConvert && (
                            <button
                              onClick={() => handleConvertToInvoice(quote)}
                              className="btn btn-primary btn-sm"
                              title="Convert to invoice"
                            >
                              <FileText size={16} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(quote.id)}
                              className="btn btn-danger btn-sm"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
