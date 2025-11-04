import { useStore } from '../store/useStore';
import { formatCurrency, getInvoiceStatus } from '../utils/invoiceCalculations';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

export const Statistics = () => {
  const { invoices, customers } = useStore();

  const now = new Date();
  const last6Months = eachMonthOfInterval({
    start: subMonths(now, 5),
    end: now
  });

  const monthlyStats = last6Months.map(month => {
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.invoiceDate);
      return invDate >= startOfMonth(month) && invDate <= endOfMonth(month);
    });

    const paidInvoices = monthInvoices.filter(inv => inv.status === 'paid');

    return {
      month: format(month, 'MMM yyyy'),
      totalInvoices: monthInvoices.length,
      totalRevenue: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
      paidCount: paidInvoices.length,
    };
  });

  const topCustomers = customers.map(customer => {
    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
    const paidInvoices = customerInvoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    return {
      customer,
      invoiceCount: customerInvoices.length,
      totalRevenue,
    };
  })
  .filter(c => c.invoiceCount > 0)
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 10);

  const totalStats = {
    totalRevenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    pendingRevenue: invoices.filter(inv => inv.status === 'sent' || getInvoiceStatus(inv) === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0),
    overdueRevenue: invoices.filter(inv => getInvoiceStatus(inv) === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0),
    averageInvoiceValue: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Statistik</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="card">
          <h3 style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '8px' }}>Total omsättning (betald)</h3>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--secondary-color)' }}>
            {formatCurrency(totalStats.totalRevenue)}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '8px' }}>Väntande betalningar</h3>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--primary-color)' }}>
            {formatCurrency(totalStats.pendingRevenue)}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '8px' }}>Förfallna betalningar</h3>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--danger-color)' }}>
            {formatCurrency(totalStats.overdueRevenue)}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '8px' }}>Genomsnittligt fakturavärde</h3>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>
            {formatCurrency(totalStats.averageInvoiceValue)}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-header">Månadsöversikt (senaste 6 månaderna)</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Månad</th>
                <th>Antal fakturor</th>
                <th>Antal betalda</th>
                <th>Total omsättning</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map((stat, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{stat.month}</td>
                  <td>{stat.totalInvoices}</td>
                  <td>{stat.paidCount}</td>
                  <td>{formatCurrency(stat.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="card-header">Topp 10 kunder</h2>
        {topCustomers.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>Ingen kunddata tillgänglig än</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kund</th>
                  <th>Antal fakturor</th>
                  <th>Total omsättning</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((item, idx) => (
                  <tr key={item.customer.id}>
                    <td>{idx + 1}</td>
                    <td>{item.customer.name}</td>
                    <td>{item.invoiceCount}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(item.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
