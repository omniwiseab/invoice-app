import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { InvoiceList } from './pages/InvoiceList';
import { InvoiceForm } from './pages/InvoiceForm';
import { InvoiceView } from './pages/InvoiceView';
import { Customers } from './pages/Customers';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { useStore } from './store/useStore';
import { isSupabaseConfigured } from './services/supabaseService';
import { migrateLocalStorageToSupabase } from './utils/migrateToSupabase';

function App() {
  const loadCustomers = useStore((state) => state.loadCustomers);
  const loadInvoices = useStore((state) => state.loadInvoices);
  const loadCompanyInfo = useStore((state) => state.loadCompanyInfo);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      if (!isSupabaseConfigured()) return;

      console.log('Loading data from Supabase...');

      // Först, ladda befintlig data från Supabase
      await loadCustomers();
      await loadInvoices();
      await loadCompanyInfo();

      // Kolla om vi behöver migrera från localStorage
      const hasLocalData = localStorage.getItem('invoice-app-storage');
      const migrationCompleted = localStorage.getItem('supabase-migration-completed');

      // Hämta nuvarande state för att kolla om Supabase är tom
      const currentCustomers = useStore.getState().customers;
      const hasSupabaseData = currentCustomers.length > 0;

      if (hasLocalData && !migrationCompleted && !hasSupabaseData) {
        console.log('Migrerar data från localStorage till Supabase...');
        setIsMigrating(true);

        // Hämta temporärt user ID
        const tempUserId = localStorage.getItem('temp_user_id') || crypto.randomUUID();
        localStorage.setItem('temp_user_id', tempUserId);

        const result = await migrateLocalStorageToSupabase(tempUserId);

        if (result.success) {
          console.log('Migration lyckades!', result.message);
          setMigrationMessage(result.message);
          localStorage.setItem('supabase-migration-completed', 'true');

          // Ladda om data efter migrationen
          await loadCustomers();
          await loadInvoices();
          await loadCompanyInfo();

          // Visa meddelande i 5 sekunder
          setTimeout(() => setMigrationMessage(null), 5000);
        } else {
          console.error('Migration misslyckades:', result.message);
          alert('Migration misslyckades: ' + result.message);
        }

        setIsMigrating(false);
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Kör bara en gång vid mount

  return (
    <AuthProvider>
      {isMigrating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <h2 style={{ marginBottom: '16px' }}>Migrerar data till Supabase...</h2>
            <p style={{ color: 'var(--gray-600)' }}>
              Din befintliga data flyttas till databasen. Detta kan ta några sekunder.
            </p>
            <div style={{ marginTop: '20px' }}>
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      )}

      {migrationMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'var(--success)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          maxWidth: '400px'
        }}>
          <strong>✓ Migration klar!</strong>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>{migrationMessage}</p>
        </div>
      )}

      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/new" element={<InvoiceForm />} />
            <Route path="invoices/:id" element={<InvoiceView />} />
            <Route path="invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="customers" element={<Customers />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="settings" element={<Settings />} />

            {/* Admin routes - requires superadmin role */}
            <Route
              path="admin"
              element={
                <RoleGuard requiredRole="superadmin">
                  <AdminPanel />
                </RoleGuard>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
