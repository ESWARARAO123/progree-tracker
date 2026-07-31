import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { UserPlus, Shield, User as UserIcon, ToggleLeft, ToggleRight, Pencil, Trash2, X } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  is_active: boolean;
}

export const UsersPage: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'EMPLOYEE', department: '', designation: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    designation: '',
    is_active: true,
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadUsers = async () => {
    if (!token) return;
    try {
      const data = await api.getUsers(token);
      setUsers(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createUser(token!, {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department || undefined,
        designation: form.designation || undefined,
      });
      setForm({ full_name: '', email: '', password: '', role: 'EMPLOYEE', department: '', designation: '' });
      setShowForm(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (u: User) => {
    setEditingUser(u);
    setEditForm({
      full_name: u.full_name,
      email: u.email,
      password: '',
      role: u.role,
      department: u.department || '',
      designation: u.designation || '',
      is_active: u.is_active,
    });
    setEditError('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser) return;
    setEditError('');
    setEditSubmitting(true);
    try {
      await api.updateUser(token, editingUser.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        password: editForm.password ? editForm.password : undefined,
        role: editForm.role,
        department: editForm.department || undefined,
        designation: editForm.designation || undefined,
        is_active: editForm.is_active,
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!token) return;
    if (currentUser?.id === userId) {
      alert('Cannot delete your own logged-in admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteUser(token, userId);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleToggle = async (userId: string) => {
    if (!token) return;
    try {
      await api.toggleUserStatus(token, userId);
      await loadUsers();
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-sm text-slate-400 mt-1">Manage system users, edit profiles, and control roles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Create New User</h3>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text" required value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
              <input
                type="text" value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Designation</label>
              <input
                type="text" value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit User Profile</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 rounded-lg">{editError}</div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text" required value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email" required value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={editForm.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                  <input
                    type="text" value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Designation</label>
                  <input
                    type="text" value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  New Password <span className="text-slate-500 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password" value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button" onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Department</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Designation</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/40 transition">
                <td className="px-4 py-3 text-white font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                    {u.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    <span>{u.role}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{u.department || '-'}</td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{u.designation || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggle(u.id)}
                    className={`inline-flex items-center space-x-1 text-xs font-semibold transition ${u.is_active ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'}`}
                    title={u.is_active ? 'Deactivate user' : 'Activate user'}
                  >
                    {u.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => startEditing(u)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:border-blue-500/30 border border-slate-700 text-slate-300 hover:text-blue-400 transition"
                      title="Edit user"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.full_name)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 hover:border-rose-500/30 border border-slate-700 text-slate-300 hover:text-rose-400 transition"
                      title="Delete user"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
