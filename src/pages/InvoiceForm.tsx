import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Invoice, InvoiceItem } from '../types';
import { calculateInvoiceTotals, generateInvoiceNumber } from '../utils/invoiceCalculations';
import { Plus, Trash2, Save, Eye } from 'lucide-react';
import { generateId } from '../utils/generateId';
import { InvoicePreview } from '../components/InvoicePreview';

export const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, customers, addInvoice, updateInvoice, getInvoiceById, companyInfo } = useStore();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, vatRate: 25, total: 0 }
  ]);
  const [showPreview, setShowPreview] = useState(false);

  const existingInvoice = id ? getInvoiceById(id) : null;

  useEffect(() => {
    if (existingInvoice) {
      setSelectedCustomerId(existingInvoice.customerId);
      setInvoiceDate(new Date(existingInvoice.invoiceDate).toISOString().split('T')[0]);
      setPaymentTerms(existingInvoice.paymentTerms);
      setNotes(existingInvoice.notes || '');
      setItems(existingInvoice.items);
    }
  }, [existingInvoice]);

  const addItem = () => {
    setItems([...items, {
      id: generateId(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 25,
      total: 0
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: Invoice['status'] = 'draft') => {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert('Vänligen välj en kund');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const totals = calculateInvoiceTotals(items);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);

    if (existingInvoice) {
      // Update existing invoice
      await updateInvoice(existingInvoice.id, {
        items,
        ...totals,
        invoiceDate: new Date(invoiceDate),
        dueDate,
        paymentTerms,
        notes,
        status,
        sentAt: status === 'sent' ? new Date() : existingInvoice.sentAt,
      });
    } else {
      // Create new invoice
      const invoiceData = {
        invoiceNumber: generateInvoiceNumber(invoices[invoices.length - 1]?.invoiceNumber),
        customerId: selectedCustomerId,
        customer,
        items,
        ...totals,
        currency: 'SEK' as const,
        invoiceDate: new Date(invoiceDate),
        dueDate,
        paymentTerms,
        notes,
        status,
        sentAt: status === 'sent' ? new Date() : undefined,
      };
      await addInvoice(invoiceData);
    }

    navigate('/invoices');
  };

  const totals = calculateInvoiceTotals(items);

  // Create preview invoice
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const previewInvoice: Invoice | null = selectedCustomer ? {
    id: existingInvoice?.id || 'preview',
    invoiceNumber: existingInvoice?.invoiceNumber || 'INV-XXXX-XXXX',
    customerId: selectedCustomerId,
    customer: selectedCustomer,
    items,
    ...totals,
    currency: 'SEK',
    invoiceDate: new Date(invoiceDate),
    dueDate: (() => {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + paymentTerms);
      return date;
    })(),
    paymentTerms,
    notes,
    status: 'draft',
    createdAt: existingInvoice?.createdAt || new Date(),
    updatedAt: new Date(),
  } : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{id ? 'Redigera faktura' : 'Ny faktura'}</h1>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="btn btn-secondary"
        >
          <Eye size={20} />
          {showPreview ? 'Dölj förhandsgranskning' : 'Visa förhandsgranskning'}
        </button>
      </div>

      {showPreview && previewInvoice && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 className="card-header">Förhandsgranskning</h2>
          <InvoicePreview invoice={previewInvoice} companyInfo={companyInfo} />
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'draft')}>
        <div className="card">
          <h2 className="card-header">Kundinformation</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="form-group">
              <label className="form-label">Kund *</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Välj kund...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fakturadatum *</label>
              <input
                type="date"
                className="form-input"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Betalningsvillkor (dagar) *</label>
              <input
                type="number"
                className="form-input"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(parseInt(e.target.value))}
                min="0"
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="card-header" style={{ marginBottom: 0 }}>Fakturarader</h2>
            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
              <Plus size={16} />
              Lägg till rad
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Beskrivning</th>
                  <th style={{ width: '10%' }}>Antal</th>
                  <th style={{ width: '15%' }}>Pris</th>
                  <th style={{ width: '10%' }}>Moms %</th>
                  <th style={{ width: '15%' }}>Summa</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Beskrivning"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={item.vatRate}
                        onChange={(e) => updateItem(item.id, 'vatRate', parseFloat(e.target.value))}
                      >
                        <option value="0">0%</option>
                        <option value="6">6%</option>
                        <option value="12">12%</option>
                        <option value="25">25%</option>
                      </select>
                    </td>
                    <td>{item.total.toFixed(2)} kr</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="btn btn-danger btn-sm"
                        disabled={items.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <div style={{ display: 'inline-block', minWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                <strong>Delsumma:</strong>
                <span>{totals.subtotal.toFixed(2)} kr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                <strong>Moms:</strong>
                <span>{totals.vatAmount.toFixed(2)} kr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '20px', fontWeight: '700' }}>
                <strong>Totalt:</strong>
                <span>{totals.total.toFixed(2)} kr</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-header">Anteckningar</h2>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Valfria anteckningar eller meddelande till kund..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/invoices')} className="btn btn-secondary">
            Avbryt
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={20} />
            Spara som utkast
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, 'sent')}
            className="btn btn-success"
          >
            Spara och markera som skickad
          </button>
        </div>
      </form>
    </div>
  );
};
