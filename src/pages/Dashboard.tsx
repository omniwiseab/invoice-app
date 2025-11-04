import { useStore } from '../store/useStore';
import { formatCurrency, getInvoiceStatus } from '../utils/invoiceCalculations';
import { FileText, Users, DollarSign, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { invoices, customers } = useStore();

  const stats = {
    totalInvoices: invoices.length,
    totalCustomers: customers.length,
    unpaidInvoices: invoices.filter(inv => getInvoiceStatus(inv) !== 'paid').length,
    overdueInvoices: invoices.filter(inv => getInvoiceStatus(inv) === 'overdue').length,
    totalRevenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    pendingRevenue: invoices
      .filter(inv => inv.status === 'sent' || getInvoiceStatus(inv) === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0),
  };

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Översikt</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Totala fakturor</div>
              <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>{stats.totalInvoices}</div>
            </div>
            <FileText size={40} style={{ color: 'var(--primary-color)' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Kunder</div>
              <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>{stats.totalCustomers}</div>
            </div>
            <Users size={40} style={{ color: 'var(--secondary-color)' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Total omsättning</div>
              <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px' }}>
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
            <DollarSign size={40} style={{ color: 'var(--secondary-color)' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Förfallna fakturor</div>
              <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '8px', color: 'var(--danger-color)' }}>
                {stats.overdueInvoices}
              </div>
            </div>
            <AlertCircle size={40} style={{ color: 'var(--danger-color)' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Senaste fakturor</div>
        {recentInvoices.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>Inga fakturor än. Skapa din första faktura!</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fakturanummer</th>
                  <th>Kund</th>
                  <th>Datum</th>
                  <th>Förfallodatum</th>
                  <th>Belopp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(invoice => {
                  const status = getInvoiceStatus(invoice);
                  return (
                    <tr key={invoice.id}>
                      <td>
                        <Link to={`/invoices/${invoice.id}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
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
