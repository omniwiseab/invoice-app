import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/user';

export const useRole = () => {
  const { role, isSuperAdmin, isAdmin, userProfile } = useAuth();

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role) return false;

    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      admin: 2,
      superadmin: 3,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const canAccessAdminPanel = (): boolean => {
    return isAdmin || isSuperAdmin;
  };

  const canManageUsers = (): boolean => {
    return isSuperAdmin;
  };

  const canManageCompanies = (): boolean => {
    return isSuperAdmin;
  };

  const canEditUser = (userId: string): boolean => {
    if (isSuperAdmin) return true;
    return userProfile?.id === userId;
  };

  return {
    role,
    isSuperAdmin,
    isAdmin,
    hasRole,
    canAccessAdminPanel,
    canManageUsers,
    canManageCompanies,
    canEditUser,
  };
};
