import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from '../../hooks/useRouter';
import { LayoutDashboard, Settings, Gamepad2, Users, LogOut, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/Logo';

interface AdminLayoutProps {
  children: React.ReactNode;
  active: 'dashboard' | 'settings' | 'gamemodes' | 'users';
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, active }) => {
  const { loading, isStaff, canManageUsers, email, role } = useAuth();
  const { navigate } = useRouter();

  React.useEffect(() => {
    if (!loading && !isStaff) {
      navigate('/login');
    }
  }, [loading, isStaff, navigate]);

  if (loading || !isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        Loading...
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { key: 'settings', label: 'Site Settings', icon: Settings, path: '/admin/settings' },
    { key: 'gamemodes', label: 'Game Modes', icon: Gamepad2, path: '/admin/gamemodes' },
    ...(canManageUsers ? [{ key: 'users', label: 'Manage Roles', icon: Users, path: '/admin/users' }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <aside className="w-64 shrink-0 border-r border-white/10 bg-black/40 p-5">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </button>

        <div className="mb-6">
          <Logo size="sm" showText={false} />
          <p className="mt-2 text-sm font-bold tracking-wide text-purple-400">
            Admin Panel
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/10 pt-4">
          <p className="truncate text-xs text-slate-500">{email}</p>
          <p className="text-xs text-purple-400">{role}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
};