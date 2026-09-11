import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface UserRow {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string;
}

export const AdminUsers: React.FC = () => {
  const { canManageUsers } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, role')
      .order('created_at', { ascending: false });

    if (!error && data) setUsers(data as UserRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Role updated.');
      load();
    }
  };

  if (!canManageUsers) {
    return (
      <AdminLayout active="users">
        <p className="text-slate-400">Only the owner can manage roles.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="users">
      <h2 className="mb-6 text-2xl font-bold">Manage Roles</h2>

      {message && (
        <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div>
                <p className="font-semibold">{u.full_name || u.username || u.id}</p>
                <p className="text-xs text-slate-500">@{u.username}</p>
              </div>
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-purple-500"
              >
                <option value="user">user</option>
                <option value="gamemod">gamemod</option>
                <option value="admin">admin</option>
                <option value="owner">owner</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};