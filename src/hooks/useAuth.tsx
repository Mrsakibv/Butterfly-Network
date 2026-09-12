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
  | 'events'
  | 'gallery'
  | 'commands'
  | 'vote'
  | 'users';

interface AuthContextValue {
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

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setUserId(null);
        setEmail(null);
        setRole(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const { data: customRole } = await supabase
        .from('custom_roles')
        .select('permissions')
        .eq('name', profile?.role ?? '')
        .maybeSingle();

      const customPermissions = Array.isArray(customRole?.permissions)
        ? customRole.permissions.filter((permission): permission is AdminPermission =>
            ['dashboard', 'settings', 'gamemodes', 'pages', 'rules', 'terms', 'contact', 'events', 'gallery', 'commands', 'vote', 'users'].includes(permission)
          )
        : [];

      if (mounted) {
        setRole(profile?.role ?? 'user');
        setPermissions(customPermissions);
        setLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const can = useCallback((permission: AdminPermission) => {
    if (role === 'owner') return true;
    if (role === 'admin') return permission !== 'users';
    if (role === 'gamemod') return permission === 'dashboard' || permission === 'gamemodes';
    return permissions.includes(permission) || (
      ['pages', 'rules', 'terms', 'contact', 'events', 'gallery', 'commands', 'vote'].includes(permission)
      && permissions.includes('settings')
    );
  }, [permissions, role]);
  const isStaff = role === 'owner' || role === 'admin' || role === 'gamemod' || permissions.length > 0;
  const canManageSettings = can('settings');
  const canManageUsers = can('users');

  return (
    <AuthContext.Provider value={{ userId, email, role, permissions, loading, isStaff, canManageSettings, canManageUsers, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}