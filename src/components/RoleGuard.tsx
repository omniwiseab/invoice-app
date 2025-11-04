import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/user';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallbackPath?: string;
}

export const RoleGuard = ({
  children,
  requiredRole,
  fallbackPath = '/'
}: RoleGuardProps) => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--gray-600)' }}>Kontrollerar behörighet...</p>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    admin: 2,
    superadmin: 3,
  };

  const hasAccess = roleHierarchy[role] >= roleHierarchy[requiredRole];

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
