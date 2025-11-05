import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Quote, QuoteItem } from '../types';
import { calculateQuoteTotals, generateQuoteNumber } from '../utils/quoteCalculations';
import { Plus, Trash2, Save, Package } from 'lucide-react';
import { generateId } from '../utils/generateId';

export const QuoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, addQuote, updateQuote, getQuoteById, quoteItemTemplates, loadQuoteItemTemplates } = useStore();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default 30 days validity
    return date.toISOString().split('T')[0];
  });
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, vatRate: 25, total: 0 }
  ]);
  const [showTemplates, setShowTemplates] = useState(false);

  const existingQuote = id ? getQuoteById(id) : null;

  useEffect(() => {
    loadQuoteItemTemplates();
  }, [loadQuoteItemTemplates]);

  useEffect(() => {
    if (existingQuote) {
      setSelectedCustomerId(existingQuote.customerId);
      setQuoteDate(new Date(existingQuote.quoteDate).toISOString().split('T')[0]);
      setValidUntil(new Date(existingQuote.validUntil).toISOString().split('T')[0]);
      setDeliveryTime(existingQuote.deliveryTime || '');
      setPaymentTerms(existingQuote.paymentTerms || '');
      setNotes(existingQuote.notes || '');
      setInternalNotes(existingQuote.internalNotes || '');
      setItems(existingQuote.items);

      if (existingQuote.discount) {
        setDiscountType('percentage');
        setDiscountValue(existingQuote.discount);
      } else if (existingQuote.discountAmount) {
        setDiscountType('amount');
        setDiscountValue(existingQuote.discountAmount);
      }
    }
  }, [existingQuote]);

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

  const addItemFromTemplate = (templateId: string) => {
    const template = quoteItemTemplates.find(t => t.id === templateId);
    if (!template) return;

    const newItem: QuoteItem = {
      id: generateId(),
      description: template.description,
      quantity: template.defaultQuantity,
      unitPrice: template.defaultUnitPrice,
      vatRate: template.defaultVatRate,
      total: template.defaultQuantity * template.defaultUnitPrice,
      category: template.category,
    };

    setItems([...items, newItem]);
    setShowTemplates(false);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: Quote['status'] = 'draft') => {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const discount = discountType === 'percentage' ? discountValue : undefined;
    const discountAmount = discountType === 'amount' ? discountValue : undefined;

    const totals = calculateQuoteTotals(items, discount, discountAmount);

    if (existingQuote) {
      // Update existing quote
      await updateQuote(existingQuote.id, {
        items,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        quoteDate: new Date(quoteDate),
        validUntil: new Date(validUntil),
        deliveryTime,
        paymentTerms,
        notes,
        internalNotes,
        status,
        discount,
        discountAmount,
        sentAt: status === 'sent' ? new Date() : existingQuote.sentAt,
      });
    } else {
      // Create new quote
      const quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
        quoteNumber: generateQuoteNumber(),
        customerId: selectedCustomerId,
        customer,
        items,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        currency: 'SEK',
        quoteDate: new Date(quoteDate),
        validUntil: new Date(validUntil),
        deliveryTime,
        paymentTerms,
        notes,
        internalNotes,
        status,
        discount,
        discountAmount,
        sentAt: status === 'sent' ? new Date() : undefined,
      };
      await addQuote(quoteData);
    }

    navigate('/quotes');
  };

  const discount = discountType === 'percentage' ? discountValue : undefined;
  const discountAmount = discountType === 'amount' ? discountValue : undefined;
  const totals = calculateQuoteTotals(items, discount, discountAmount);

  // Group templates by category
  const templatesByCategory = quoteItemTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof quoteItemTemplates>);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{id ? 'Edit Quote' : 'New Quote'}</h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'draft')}>
        <div className="card">
          <h2 className="card-header">Customer Information</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quote Date *</label>
              <input
                type="date"
                className="form-input"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valid Until *</label>
              <input
                type="date"
                className="form-input"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Time</label>
              <input
                type="text"
                className="form-input"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g., 2-3 weeks"
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Payment Terms</label>
              <input
                type="text"
                className="form-input"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g., 50% upfront, 50% on delivery"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="card-header" style={{ marginBottom: 0 }}>Quote Items</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="btn btn-secondary btn-sm"
              >
                <Package size={16} />
                {showTemplates ? 'Hide Templates' : 'Add from Templates'}
              </button>
              <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
                <Plus size={16} />
                Add Row
              </button>
            </div>
          </div>

          {showTemplates && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'var(--gray-50)',
              borderRadius: '8px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Templates</h3>
              {Object.keys(templatesByCategory).length === 0 ? (
                <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
                  No templates available. Create templates in the Templates page.
                </p>
              ) : (
                Object.entries(templatesByCategory).map(([category, templates]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '8px' }}>
                      {category}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                      {templates.map(template => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => addItemFromTemplate(template.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#fff',
                            border: '1px solid var(--gray-300)',
                            borderRadius: '6px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--gray-300)';
                            e.currentTarget.style.backgroundColor = '#fff';
                          }}
                        >
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{template.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-600)' }}>
                            {template.defaultQuantity} × {template.defaultUnitPrice.toFixed(2)} kr
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Description</th>
                  <th style={{ width: '10%' }}>Quantity</th>
                  <th style={{ width: '12%' }}>Unit Price</th>
                  <th style={{ width: '10%' }}>VAT %</th>
                  <th style={{ width: '15%' }}>Category</th>
                  <th style={{ width: '12%' }}>Total</th>
                  <th style={{ width: '6%' }}></th>
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
                        placeholder="Description"
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
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={item.category || ''}
                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                        placeholder="Category"
                      />
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

          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div className="form-group" style={{ maxWidth: '400px', marginBottom: 0 }}>
                <label className="form-label">Discount</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                    style={{ width: '140px' }}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="amount">Fixed Amount</option>
                  </select>
                  <input
                    type="number"
                    className="form-input"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={{ minWidth: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                  <strong>Subtotal:</strong>
                  <span>{totals.subtotal.toFixed(2)} kr</span>
                </div>
                {totals.discountApplied > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)', color: 'var(--success)' }}>
                    <strong>Discount:</strong>
                    <span>-{totals.discountApplied.toFixed(2)} kr</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                  <strong>VAT:</strong>
                  <span>{totals.vatAmount.toFixed(2)} kr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '20px', fontWeight: '700' }}>
                  <strong>Total:</strong>
                  <span>{totals.total.toFixed(2)} kr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-header">Notes</h2>
          <div className="form-group">
            <label className="form-label">Customer Notes (visible to customer)</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes or message to customer..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Internal Notes (not visible to customer)</label>
            <textarea
              className="form-textarea"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Internal notes for your reference..."
              rows={3}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/quotes')} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={20} />
            Save as Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, 'sent')}
            className="btn btn-success"
          >
            Save and Mark as Sent
          </button>
        </div>
      </form>
    </div>
  );
};
