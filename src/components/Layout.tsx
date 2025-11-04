import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  Settings,
  BarChart3,
  Home,
  DollarSign,
  LogOut,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout = () => {
  const { user, isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <DollarSign size={24} style={{ display: 'inline', marginRight: '8px' }} />
          FakturaApp
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Home size={20} />
            <span>Översikt</span>
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <FileText size={20} />
            <span>Fakturor</span>
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Users size={20} />
            <span>Kunder</span>
          </NavLink>
          <NavLink to="/statistics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <BarChart3 size={20} />
            <span>Statistik</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Settings size={20} />
            <span>Inställningar</span>
          </NavLink>

          {/* Admin link - only visible for superadmins */}
          {isSuperAdmin && (
            <>
              <div style={{ borderTop: '1px solid var(--gray-200)', margin: '12px 0' }}></div>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active nav-item-admin' : 'nav-item nav-item-admin'}>
                <Shield size={20} />
                <span>Admin Panel</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User info and logout */}
        <div className="sidebar-footer">
          <div className="user-info">
            <User size={16} />
            <span className="user-email">{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Logga ut</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
