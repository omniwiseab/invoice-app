import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { InvoicePreview } from '../components/InvoicePreview';
import { ArrowLeft, Edit, Download, Mail, Trash2 } from 'lucide-react';
import { downloadInvoicePDF } from '../services/pdfService';
import { generateInvoiceWord } from '../services/wordService';
import { formatCurrency } from '../utils/invoiceCalculations';
import { format } from 'date-fns';

export const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInvoiceById, companyInfo, deleteInvoice } = useStore();

  const invoice = id ? getInvoiceById(id) : null;

  if (!invoice) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Faktura hittades inte</h2>
        <Link to="/invoices" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Tillbaka till fakturor
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('Är du säker på att du vill radera denna faktura?')) {
      await deleteInvoice(invoice.id);
      navigate('/invoices');
    }
  };

  const handleDownloadPDF = () => {
    if (!companyInfo) {
      alert('Vänligen konfigurera företagsinformation först i Inställningar');
      return;
    }
    downloadInvoicePDF(invoice, companyInfo);
  };

  const handleDownloadWord = async () => {
    if (!companyInfo) {
      alert('Vänligen konfigurera företagsinformation först i Inställningar');
      return;
    }
    await generateInvoiceWord(invoice, companyInfo);
  };

  const handleSendEmail = async () => {
    if (!companyInfo) {
      alert('Vänligen konfigurera företagsinformation först i Inställningar');
      return;
    }

    // Skapa email-innehåll
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

    // Öppna email-klient med förberedd text
    const mailtoLink = `mailto:${invoice.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    // Uppdatera fakturastatus till "skickad"
    if (invoice.status === 'draft') {
      const { updateInvoice } = useStore.getState();
      await updateInvoice(invoice.id, {
        status: 'sent',
        sentAt: new Date()
      });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/invoices" className="btn btn-secondary">
            <ArrowLeft size={20} />
            Tillbaka
          </Link>
          <h1 className="page-title">Faktura {invoice.invoiceNumber}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to={`/invoices/${invoice.id}/edit`} className="btn btn-secondary">
            <Edit size={20} />
            Redigera
          </Link>
          <button onClick={handleSendEmail} className="btn btn-success">
            <Mail size={20} />
            Skicka via email
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-secondary">
            <Download size={20} />
            Ladda ner PDF
          </button>
          <button onClick={handleDownloadWord} className="btn btn-secondary">
            <Download size={20} />
            Ladda ner Word
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            <Trash2 size={20} />
            Radera
          </button>
        </div>
      </div>

      <div className="card">
        <InvoicePreview invoice={invoice} companyInfo={companyInfo} />
      </div>
    </div>
  );
};
