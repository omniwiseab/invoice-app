import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, getInvoiceStatus } from '../utils/invoiceCalculations';
import { Plus, Download, Eye, Trash2, Mail } from 'lucide-react';
import { downloadInvoicePDF } from '../services/pdfService';
import { generateInvoiceWord } from '../services/wordService';
import { format } from 'date-fns';

export const InvoiceList = () => {
  const { invoices, deleteInvoice, companyInfo, updateInvoice } = useStore();
  const [filter, setFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true;
    return getInvoiceStatus(inv) === filter;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Är du säker på att du vill radera denna faktura?')) {
      await deleteInvoice(id);
    }
  };

  const handleDownloadPDF = (invoice: any) => {
    if (!companyInfo) {
      alert('Vänligen konfigurera företagsinformation först i Inställningar');
      return;
    }
    downloadInvoicePDF(invoice, companyInfo);
  };

  const handleDownloadWord = async (invoice: any) => {
    if (!companyInfo) {
      alert('Vänligen konfigurera företagsinformation först i Inställningar');
      return;
    }
    await generateInvoiceWord(invoice, companyInfo);
  };

  const handleSendEmail = async (invoice: any) => {
    if (!companyInfo) {
      alert('Vänligen konfigurera företagsinformation först i Inställningar');
      return;
    }

    const subject = `Faktura ${invoice.invoiceNumber} från ${companyInfo.name}`;
    const body = `Hej ${invoice.customer.name},

Bifogat finner du faktura från ${companyInfo.name}.

Fakturanummer: ${invoice.invoiceNumber}
Fakturadatum: ${format(new Date(invoice.invoiceDate), 'yyyy-MM-dd')}
Förfallodatum: ${format(new Date(invoice.dueDate), 'yyyy-MM-dd')}
Belopp att betala: ${formatCurrency(invoice.total, invoice.currency)}

Betalningsinformation:
Bankgiro/Plusgiro: ${companyInfo.bankAccount}
OCR/Meddelande: ${invoice.invoiceNumber}

${invoice.notes ? `Meddelande:\n${invoice.notes}\n\n` : ''}Vid frågor, kontakta oss gärna på ${companyInfo.email} eller ${companyInfo.phone}.

Med vänlig hälsning,
${companyInfo.name}`;

    const mailtoLink = `mailto:${invoice.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    if (invoice.status === 'draft') {
      await updateInvoice(invoice.id, {
        status: 'sent',
        sentAt: new Date()
      });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fakturor</h1>
        <Link to="/invoices/new" className="btn btn-primary">
          <Plus size={20} />
          Ny faktura
        </Link>
      </div>

      <div className="card">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          {['all', 'draft', 'sent', 'paid', 'overdue'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              {status === 'all' ? 'Alla' :
               status === 'draft' ? 'Utkast' :
               status === 'sent' ? 'Skickade' :
               status === 'paid' ? 'Betalda' : 'Förfallna'}
            </button>
          ))}
        </div>

        {filteredInvoices.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '40px' }}>
            Inga fakturor hittades
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nr</th>
                  <th>Kund</th>
                  <th>Datum</th>
                  <th>Förfallodatum</th>
                  <th>Belopp</th>
                  <th>Status</th>
                  <th>Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => {
                  const status = getInvoiceStatus(invoice);
                  return (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.customer.name}</td>
                      <td>{new Date(invoice.invoiceDate).toLocaleDateString('sv-SE')}</td>
                      <td>{new Date(invoice.dueDate).toLocaleDateString('sv-SE')}</td>
                      <td>{formatCurrency(invoice.total, invoice.currency)}</td>
                      <td>
                        <span className={`badge badge-${status}`}>
                          {status === 'draft' ? 'Utkast' :
                           status === 'sent' ? 'Skickad' :
                           status === 'paid' ? 'Betald' :
                           status === 'overdue' ? 'Förfallen' : 'Avbruten'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/invoices/${invoice.id}`} className="btn btn-secondary btn-sm" title="Visa">
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => handleSendEmail(invoice)}
                            className="btn btn-success btn-sm"
                            title="Skicka via email"
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            className="btn btn-secondary btn-sm"
                            title="Ladda ner PDF"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="btn btn-danger btn-sm"
                            title="Radera"
                          >
                            <Trash2 size={16} />
                          </button>
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
