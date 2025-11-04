import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserManagement } from '../components/UserManagement';
import {
  Shield,
  Users,
  Building,
  FileText,
  Activity,
  TrendingUp,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalInvoices: number;
  totalCustomers: number;
}

export const AdminPanel = () => {
  const { isSuperAdmin, userProfile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalInvoices: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdminStats();
    }
  }, [isSuperAdmin]);

  const loadAdminStats = async () => {
    if (!supabase) return;

    setLoading(true);

    try {
      // Hämta antal användare
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Hämta antal aktiva användare
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Hämta antal fakturor
      const { count: totalInvoices } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });

      // Hämta antal kunder
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalInvoices: totalInvoices || 0,
        totalCustomers: totalCustomers || 0,
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div>
        <h1 className="page-title">Administratörspanel</h1>
        <div className="card">
          <p style={{ color: 'var(--danger-color)' }}>
            Du har inte behörighet att se denna sida. Kontakta en administratör.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Shield size={32} style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
          Administratörspanel
        </h1>
      </div>

      {/* Welcome Section */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)', color: 'white' }}>
        <h2 style={{ color: 'white', marginBottom: '8px' }}>
          Välkommen, {userProfile?.full_name || userProfile?.email}!
        </h2>
        <p style={{ opacity: 0.9 }}>
          Du är inloggad som <strong>Superadmin</strong> med fullständiga rättigheter.
        </p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={18} />
          Översikt
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Användarhantering
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {loading ? (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '16px', color: 'var(--gray-600)' }}>
                  Laddar statistik...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2" style={{ gap: '20px', marginBottom: '24px' }}>
                <div className="stat-card stat-card-primary">
                  <div className="stat-icon">
                    <Users size={32} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Totalt användare</div>
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-sublabel">
                      {stats.activeUsers} aktiva
                    </div>
                  </div>
                </div>

                <div className="stat-card stat-card-success">
                  <div className="stat-icon">
                    <Building size={32} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Totalt kunder</div>
                    <div className="stat-value">{stats.totalCustomers}</div>
                  </div>
                </div>

                <div className="stat-card stat-card-info">
                  <div className="stat-icon">
                    <FileText size={32} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Totalt fakturor</div>
                    <div className="stat-value">{stats.totalInvoices}</div>
                  </div>
                </div>

                <div className="stat-card stat-card-warning">
                  <div className="stat-icon">
                    <TrendingUp size={32} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Systemhälsa</div>
                    <div className="stat-value">100%</div>
                    <div className="stat-sublabel">Alla system operationella</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="card-header">Snabbåtgärder</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    <Users size={18} />
                    Hantera användare
                  </button>
                  <button
                    onClick={() => window.location.href = '/customers'}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    <Building size={18} />
                    Visa alla kunder
                  </button>
                  <button
                    onClick={() => window.location.href = '/invoices'}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    <FileText size={18} />
                    Visa alla fakturor
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UserManagement />
      )}
    </div>
  );
};
