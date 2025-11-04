import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Customer } from '../types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export const Customers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, invoices } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Sverige',
    organizationNumber: '',
    group: '',
  });

  const groups: string[] = ['all', ...Array.from(new Set(customers.map(c => c.group).filter((g): g is string => g !== undefined)))];

  const filteredCustomers = filterGroup === 'all'
    ? customers
    : customers.filter(c => c.group === filterGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, formData);
    } else {
      await addCustomer(formData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Sverige',
      organizationNumber: '',
      group: '',
    });
    setEditingCustomer(null);
    setShowModal(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode,
      country: customer.country,
      organizationNumber: customer.organizationNumber || '',
      group: customer.group || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const hasInvoices = invoices.some(inv => inv.customerId === id);
    if (hasInvoices) {
      alert('Kan inte radera kund med befintliga fakturor');
      return;
    }
    if (window.confirm('Är du säker på att du vill radera denna kund?')) {
      await deleteCustomer(id);
    }
  };

  const getCustomerInvoiceCount = (customerId: string) => {
    return invoices.filter(inv => inv.customerId === customerId).length;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kunder</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={20} />
          Ny kund
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setFilterGroup(group)}
              className={`btn ${filterGroup === group ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              {group === 'all' ? 'Alla' : group}
            </button>
          ))}
        </div>

        {filteredCustomers.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '40px' }}>
            Inga kunder hittades
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Namn</th>
                  <th>Email</th>
                  <th>Telefon</th>
                  <th>Stad</th>
                  <th>Grupp</th>
                  <th>Fakturor</th>
                  <th>Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>{customer.city}</td>
                    <td>{customer.group || '-'}</td>
                    <td>{getCustomerInvoiceCount(customer.id)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCustomer ? 'Redigera kund' : 'Ny kund'}</h2>
              <button onClick={resetForm} className="btn btn-secondary btn-sm">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-2">
                  <div className="form-group">
                    <label className="form-label">Namn *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefon</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Organisationsnummer</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.organizationNumber}
                      onChange={(e) => setFormData({ ...formData, organizationNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Adress *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Postnummer *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stad *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Land *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Grupp</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.group}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                      placeholder="t.ex. VIP, Partner, etc."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Avbryt
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Uppdatera' : 'Skapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
