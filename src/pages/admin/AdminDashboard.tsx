import React from 'react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../hooks/useAuth';

export const AdminDashboard: React.FC = () => {
  const { email, role } = useAuth();

  return (
    <AdminLayout active="dashboard" permission="dashboard">
      <h2 className="mb-2 text-2xl font-bold">Welcome back</h2>
      <p className="mb-8 text-slate-400">Logged in as {email} ({role})</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="font-semibold text-purple-400">Site Settings</h3>
          <p className="mt-1 text-sm text-slate-400">Logo, site name, IPs, socials.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="font-semibold text-purple-400">Game Modes</h3>
          <p className="mt-1 text-sm text-slate-400">Add, edit or remove gamemodes.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="font-semibold text-purple-400">Roles</h3>
          <p className="mt-1 text-sm text-slate-400">Assign gamemod/admin roles.</p>
        </div>
      </div>
    </AdminLayout>
  );
};