'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader, Search, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id: number;
  username: string;
  fullName: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  _count: { orders: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      setUpdating(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      const updated = await response.json();

      setUsers(users.map(u => u.id === userId ? { ...u, ...updated } : u));
    } catch (err) {
      console.error('Error updating user role:', err);
      alert(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setUpdating(null);
    }
  };

  const updateUserStatus = async (userId: number, newStatus: string) => {
    try {
      setUpdating(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      const updated = await response.json();

      setUsers(users.map(u => u.id === userId ? { ...u, ...updated } : u));
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">User Management</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Name, email, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Orders</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Last Login</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.fullName || user.username}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={updating === user.id}
                    className="px-3 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.status}
                    onChange={(e) => updateUserStatus(user.id, e.target.value)}
                    disabled={updating === user.id}
                    className="px-3 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user._count.orders}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  {updating === user.id && <Loader className="h-4 w-4 animate-spin" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            No users found
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Admins</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Active Users</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.status === 'ACTIVE').length}</p>
        </div>
      </div>
    </div>
  );
}
