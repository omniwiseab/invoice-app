import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { useStore } from './store/useStore';
import { isSupabaseConfigured } from './services/supabaseService';

// Eagerly load authentication pages (small and needed early)
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

// Lazy load larger components and pages
const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const InvoiceList = lazy(() => import('./pages/InvoiceList').then(m => ({ default: m.InvoiceList })));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm').then(m => ({ default: m.InvoiceForm })));
const InvoiceView = lazy(() => import('./pages/InvoiceView').then(m => ({ default: m.InvoiceView })));
const QuoteList = lazy(() => import('./pages/QuoteList').then(m => ({ default: m.QuoteList })));
const QuoteForm = lazy(() => import('./pages/QuoteForm').then(m => ({ default: m.QuoteForm })));
const QuoteView = lazy(() => import('./pages/QuoteView').then(m => ({ default: m.QuoteView })));
const QuoteItemTemplatesManager = lazy(() => import('./pages/QuoteItemTemplatesManager').then(m => ({ default: m.QuoteItemTemplatesManager })));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const Statistics = lazy(() => import('./pages/Statistics').then(m => ({ default: m.Statistics })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    flexDirection: 'column',
    gap: '20px'
  }}>
    <div className="spinner"></div>
    <p style={{ color: 'var(--gray-600)' }}>Loading...</p>
  </div>
);

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
          <Suspense fallback={<LoadingFallback />}>
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
                <Route path="quotes" element={<QuoteList />} />
                <Route path="quotes/new" element={<QuoteForm />} />
                <Route path="quotes/:id" element={<QuoteView />} />
                <Route path="quotes/:id/edit" element={<QuoteForm />} />
                <Route path="quote-templates" element={<QuoteItemTemplatesManager />} />
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
