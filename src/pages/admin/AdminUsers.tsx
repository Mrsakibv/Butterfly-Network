import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { AdminPermission, useAuth } from '../../hooks/useAuth';
import { Trash2 } from 'lucide-react';
import { logAdminActivity } from '../../lib/adminActivity';

interface UserRow {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string;
}

interface CustomRole {
  id: string;
  name: string;
  permissions: AdminPermission[];
}

const PERMISSIONS: { key: AdminPermission; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'settings', label: 'Site Settings' },
  { key: 'gamemodes', label: 'Game Modes' },
  { key: 'pages', label: 'Pages' },
  { key: 'rules', label: 'Rules Content' },
  { key: 'terms', label: 'Terms Content' },
  { key: 'contact', label: 'Contact Content' },
  { key: 'events', label: 'Events Content' },
  { key: 'gallery', label: 'Gallery Content' },
  { key: 'commands', label: 'Commands Content' },
  { key: 'vote', label: 'Vote Content' },
  { key: 'users', label: 'Manage Users' },
];

export const AdminUsers: React.FC = () => {
  const { canManageUsers } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<AdminPermission[]>([]);

  const load = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, role')
      .order('created_at', { ascending: false });

    if (!error && data) setUsers(data as UserRow[]);
    const { data: roles } = await supabase.from('custom_roles').select('id, name, permissions').order('name');
    if (roles) setCustomRoles(roles as CustomRole[]);
    setLoading(false);
  };

  const createRole = async () => {
    const name = roleName.trim();
    if (!name || rolePermissions.length === 0) {
      setMessage('Enter a role name and select at least one permission.');
      return;
    }
    const { error } = await supabase.from('custom_roles').insert({ name, permissions: rolePermissions });
    if (error) setMessage(`Error: ${error.message}`);
    else {
      await logAdminActivity({ action: 'created', section: 'Manage Roles', itemName: name, details: { permissions: rolePermissions } });
      setMessage('Custom role created.');
      setRoleName('');
      setRolePermissions([]);
      load();
    }
  };

  const deleteRole = async (id: string) => {
    const { data: customRole } = await supabase.from('custom_roles').select('name, permissions').eq('id', id).maybeSingle();
    const { error } = await supabase.from('custom_roles').delete().eq('id', id);
    if (!error) {
      await logAdminActivity({ action: 'deleted', section: 'Manage Roles', itemName: customRole?.name || id, details: customRole || { id } });
    }
    setMessage(error ? `Error: ${error.message}` : 'Custom role deleted.');
    load();
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (id: string, role: string) => {
    const { data: user } = await supabase.from('profiles').select('username, full_name, role').eq('id', id).maybeSingle();
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      await logAdminActivity({
        action: 'role_changed',
        section: 'Manage Roles',
        itemName: user?.full_name || user?.username || id,
        details: { previousRole: user?.role, newRole: role },
      });
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
    <AdminLayout active="users" permission="users">
      <h2 className="mb-6 text-2xl font-bold">Manage Roles</h2>

      {message && (
        <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          {message}
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="mb-4 font-semibold">Create Custom Role</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Role name, e.g. Content Manager" className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-purple-500" />
          <button onClick={createRole} className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold hover:bg-purple-500">Create Role</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {PERMISSIONS.map((permission) => (
            <label key={permission.key} className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={rolePermissions.includes(permission.key)} onChange={(e) => setRolePermissions((current) => e.target.checked ? [...current, permission.key] : current.filter((item) => item !== permission.key))} className="h-4 w-4" />
              {permission.label}
            </label>
          ))}
        </div>
        {customRoles.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
            {customRoles.map((customRole) => (
              <div key={customRole.id} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm">
                <span><strong>{customRole.name}</strong> <span className="text-slate-500">({customRole.permissions.join(', ')})</span></span>
                <button onClick={() => deleteRole(customRole.id)} className="p-1 text-red-400 hover:bg-red-500/10" aria-label={`Delete ${customRole.name}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </section>

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
                {customRoles.map((customRole) => <option key={customRole.id} value={customRole.name}>{customRole.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};