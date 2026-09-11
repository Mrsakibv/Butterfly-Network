import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Role = 'owner' | 'admin' | 'gamemod' | 'user';

interface AuthContextValue {
  userId: string | null;
  email: string | null;
  role: Role | null;
  loading: boolean;
  isStaff: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  email: null,
  role: null,
  loading: true,
  isStaff: false,
  canManageSettings: false,
  canManageUsers: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
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

      if (mounted) {
        setRole((profile?.role as Role) ?? 'user');
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

  const isStaff = role === 'owner' || role === 'admin' || role === 'gamemod';
  const canManageSettings = role === 'owner' || role === 'admin';
  const canManageUsers = role === 'owner';

  return (
    <AuthContext.Provider value={{ userId, email, role, loading, isStaff, canManageSettings, canManageUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}