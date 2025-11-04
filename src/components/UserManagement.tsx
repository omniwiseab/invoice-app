import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile, UserRole } from '../types/user';
import { User, Shield, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';

export const UserManagement = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      alert('Kunde inte ladda användare');
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingUser) return;

    const { error } = await supabase
      .from('users')
      .update({
        full_name: editingUser.full_name,
        role: editingUser.role,
        is_active: editingUser.is_active,
      })
      .eq('id', editingUser.id);

    if (error) {
      console.error('Error updating user:', error);
      alert('Kunde inte uppdatera användare');
    } else {
      alert('Användare uppdaterad!');
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!supabase) return;

    if (!confirm('Är du säker på att du vill ta bort denna användare?')) {
      return;
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      alert('Kunde inte ta bort användare');
    } else {
      alert('Användare borttagen!');
      loadUsers();
    }
  };

  const getRoleBadgeClass = (role: UserRole): string => {
    switch (role) {
      case 'superadmin':
        return 'badge-superadmin';
      case 'admin':
        return 'badge-admin';
      default:
        return 'badge-user';
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'superadmin':
        return 'Superadmin';
      case 'admin':
        return 'Admin';
      default:
        return 'Användare';
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="card">
        <p style={{ color: 'var(--danger-color)' }}>
          Du har inte behörighet att se denna sida.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--gray-600)' }}>
            Laddar användare...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="card-header" style={{ marginBottom: 0 }}>
            <User size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Användarhantering
          </h2>
          <div style={{ color: 'var(--gray-600)' }}>
            Totalt: {users.length} användare
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>E-post</th>
                <th>Namn</th>
                <th>Roll</th>
                <th>Status</th>
                <th>Skapad</th>
                <th>Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.full_name || '-'}</td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      <Shield size={14} />
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    {user.is_active ? (
                      <span className="badge badge-paid">
                        <CheckCircle size={14} />
                        Aktiv
                      </span>
                    ) : (
                      <span className="badge badge-overdue">
                        <XCircle size={14} />
                        Inaktiv
                      </span>
                    )}
                  </td>
                  <td>
                    {new Date(user.created_at).toLocaleDateString('sv-SE')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="btn btn-sm btn-secondary"
                        title="Redigera användare"
                      >
                        <Edit size={14} />
                      </button>
                      {user.role !== 'superadmin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-sm btn-danger"
                          title="Ta bort användare"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Redigera användare</h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">E-post</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editingUser.email}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Namn</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingUser.full_name || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, full_name: e.target.value })
                    }
                    placeholder="Ange namn"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Roll</label>
                  <select
                    className="form-select"
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                    }
                  >
                    <option value="user">Användare</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={editingUser.is_active}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, is_active: e.target.checked })
                      }
                    />
                    Aktiv användare
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Avbryt
                </button>
                <button type="submit" className="btn btn-primary">
                  Spara ändringar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
