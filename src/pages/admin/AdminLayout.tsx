import React from 'react';
import { AdminPermission, useAuth } from '../../hooks/useAuth';
import { useRouter } from '../../hooks/useRouter';
import {
  LayoutDashboard,
  Settings,
  Gamepad2,
  FileText,
  Users,
  LogOut,
  ArrowLeft,
  Scale,
  FileSignature,
  Mail,
  CalendarDays,
  Image,
  Terminal,
  Vote,
  CircleHelp,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/Logo';
import { AnimatePresence, motion } from 'motion/react';

interface AdminLayoutProps {
  children: React.ReactNode;
  active: AdminSectionKey;
  permission?: AdminPermission;
}

export type AdminSectionKey =
  | 'dashboard'
  | 'settings'
  | 'gamemodes'
  | 'pages'
  | 'rules'
  | 'terms'
  | 'contact'
  | 'faq'
  | 'events'
  | 'gallery'
  | 'commands'
  | 'vote'
  | 'store'
  | 'home'
  | 'blog'
  | 'users'
  | 'social';

const ADMIN_NAV_ITEMS: {
  key: AdminSectionKey;
  permission: AdminPermission;
  label: string;
  icon: React.ElementType;
  path: string;
}[] = [
  {
    key: 'dashboard',
    permission: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    key: 'settings',
    permission: 'settings',
    label: 'Site Settings',
    icon: Settings,
    path: '/admin/settings',
  },
  {
    key: 'gamemodes',
    permission: 'gamemodes',
    label: 'Game Modes',
    icon: Gamepad2,
    path: '/admin/gamemodes',
  },
  {
    key: 'pages',
    permission: 'pages',
    label: 'Pages',
    icon: FileText,
    path: '/admin/pages',
  },
  {
    key: 'home',
    permission: 'home',
    label: 'Home Content',
    icon: LayoutDashboard,
    path: '/admin/home',
  },
  {
    key: 'rules',
    permission: 'rules',
    label: 'Rules Content',
    icon: Scale,
    path: '/admin/rules',
  },
  {
    key: 'terms',
    permission: 'terms',
    label: 'Terms Content',
    icon: FileSignature,
    path: '/admin/terms',
  },
  {
    key: 'contact',
    permission: 'contact',
    label: 'Contact Content',
    icon: Mail,
    path: '/admin/contact',
  },
  {
    key: 'faq',
    permission: 'faq',
    label: 'FAQ Content',
    icon: CircleHelp,
    path: '/admin/faq',
  },
  {
    key: 'events',
    permission: 'events',
    label: 'Events Content',
    icon: CalendarDays,
    path: '/admin/events',
  },
  {
    key: 'gallery',
    permission: 'gallery',
    label: 'Gallery Content',
    icon: Image,
    path: '/admin/gallery',
  },
  {
    key: 'commands',
    permission: 'commands',
    label: 'Commands Content',
    icon: Terminal,
    path: '/admin/commands',
  },
  {
    key: 'vote',
    permission: 'vote',
    label: 'Vote Content',
    icon: Vote,
    path: '/admin/vote',
  },
  {
    key: 'store',
    permission: 'store',
    label: 'Minecraft Store',
    icon: ShoppingBag,
        path: '/admin/store',
  },
  {
    key: 'blog',
    permission: 'blog',
    label: 'Blog Content',
    icon: FileText,
    path: '/admin/blog',
  },
  {
    key: 'social',
    permission: 'social',
    label: 'Social Management',
    icon: MessageSquare,
    path: '/admin/social',
  },
  {
    key: 'users',
    permission: 'users',
    label: 'Manage Roles',
    icon: Users,
    path: '/admin/users',
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  active,
  permission,
}) => {
  const { loading, isStaff, can, email, role, permissions } = useAuth();
  const { navigate, path } = useRouter();

  // The page's own permission is always used.
  // No permission inheritance.
  const accessPermission: AdminPermission = permission ?? active;

  const firstAllowedItem = ADMIN_NAV_ITEMS.find((item) =>
    can(item.permission)
  );

  React.useEffect(() => {
    if (loading) return;

    // Not logged in / not staff.
    if (!isStaff) {
      navigate('/login');
      return;
    }

    // User is staff but does not have this specific permission.
    if (!can(accessPermission)) {
      // If they have another permission, send them to the first
      // page they actually have access to.
      if (firstAllowedItem) {
        navigate(firstAllowedItem.path);
      } else {
        navigate('/login');
      }
    }
  }, [
    loading,
    isStaff,
    can,
    accessPermission,
    firstAllowedItem,
    navigate,
  ]);

  if (
    loading ||
    !isStaff ||
    !can(accessPermission)
  ) {
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

  const navItems = ADMIN_NAV_ITEMS.filter((item) =>
    can(item.permission)
  );

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
          <p className="truncate text-xs text-slate-500">
            {email}
          </p>

          <p className="text-xs text-purple-400">
            {role}
          </p>

          {permissions.length > 0 && (
            <p className="mt-1 text-[10px] text-slate-600">
              {permissions.length} permission
              {permissions.length !== 1 ? 's' : ''}
            </p>
          )}

          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
              duration: 0.24,
              ease: 'easeOut',
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};