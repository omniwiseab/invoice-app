import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
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

function App() {
  const loadCustomers = useStore((state) => state.loadCustomers);
  const loadInvoices = useStore((state) => state.loadInvoices);
  const loadCompanyInfo = useStore((state) => state.loadCompanyInfo);

  useEffect(() => {
    const initializeApp = async () => {
      if (!isSupabaseConfigured()) return;

      console.log('Loading data from Supabase...');

      // Load existing data from Supabase
      await loadCustomers();
      await loadInvoices();
      await loadCompanyInfo();
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <ErrorBoundary>
      <AuthProvider>
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
    </ErrorBoundary>
  );
}

export default App;
