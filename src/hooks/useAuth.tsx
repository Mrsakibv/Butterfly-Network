import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AdminPermission =
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

const VALID_PERMISSIONS: AdminPermission[] = [
  'dashboard',
  'settings',
  'gamemodes',
  'pages',
  'rules',
  'terms',
  'contact',
  'faq',
  'events',
  'gallery',
  'commands',
  'vote',
  'store',
  'home',
  'blog',
  'users',
  'social',
];

interface AuthContextValue {
  user: { id: string } | null;
  userId: string | null;
  email: string | null;
  role: string | null;
  permissions: AdminPermission[];
  loading: boolean;
  isStaff: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  can: (permission: AdminPermission) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userId: null,
  email: null,
  role: null,
  permissions: [],
  loading: true,
  isStaff: false,
  canManageSettings: false,
  canManageUsers: false,
  can: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const user = userId ? { id: userId } : null;

  const loadSession = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Auth user error:', userError);
      }

      if (!authUser) {
        setUserId(null);
        setEmail(null);
        setRole(null);
        setPermissions([]);
        return;
      }

      setUserId(authUser.id);
      setEmail(authUser.email ?? null);

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile loading error:', profileError);
        setRole(null);
        setPermissions([]);
        return;
      }

      const currentRole = profile?.role ?? 'user';

      setRole(currentRole);

      // Built-in roles do not use custom_roles permissions.
      if (
        currentRole === 'owner' ||
        currentRole === 'admin' ||
        currentRole === 'gamemod' ||
        currentRole === 'user'
      ) {
        setPermissions([]);
        return;
      }

      const {
        data: customRole,
        error: customRoleError,
      } = await supabase
        .from('custom_roles')
        .select('permissions')
        .eq('name', currentRole)
        .maybeSingle();

      if (customRoleError) {
        console.error('Custom role loading error:', customRoleError);
        setPermissions([]);
        return;
      }

      const customPermissions: AdminPermission[] = Array.isArray(customRole?.permissions)
        ? customRole.permissions.filter(
            (permission): permission is AdminPermission =>
              VALID_PERMISSIONS.includes(permission as AdminPermission)
          )
        : [];

      setPermissions(customPermissions);
    } catch (error) {
      console.error('Session loading error:', error);
      setUserId(null);
      setEmail(null);
      setRole(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (mounted) {
        await loadSession();
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        loadSession();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadSession]);

  const can = useCallback(
    (permission: AdminPermission) => {
      // Owner has complete access.
      if (role === 'owner') {
        return true;
      }

      // Built-in admin permissions.
      if (role === 'admin') {
        return permission !== 'users';
      }

      // Built-in gamemod permissions.
      if (role === 'gamemod') {
        return permission === 'dashboard' || permission === 'gamemodes';
      }

      // CUSTOM ROLES:
      // Exact permissions only.
      // No inheritance.
      // No automatic dashboard.
      // No automatic settings access.
      return permissions.includes(permission);
    },
    [permissions, role]
  );

  const canManageSettings = can('settings');
  const canManageUsers = can('users');

  const isStaff =
    role === 'owner' ||
    role === 'admin' ||
    role === 'gamemod' ||
    permissions.length > 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        email,
        role,
        permissions,
        loading,
        isStaff,
        canManageSettings,
        canManageUsers,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}