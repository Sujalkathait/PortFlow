import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { requireSupabase, supabase } from '../lib/supabase';

export type Role = 'Admin' | 'Operator';

export type Profile = {
  id: string;
  full_name: string;
  role: Role;
};

export type AppUser = User | { id: string; email?: string; [key: string]: unknown };

type AuthState = {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  signInLocal: (role: Role, email: string, fullName: string) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const LOCAL_STORAGE_KEY = 'portflow_auth_session';

async function getProfile(user: User): Promise<Profile | null> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.user ?? null;
    } catch {
      return null;
    }
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.profile ?? null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => !localStorage.getItem(LOCAL_STORAGE_KEY) && Boolean(supabase));

  const signInLocal = (role: Role, email: string, fullName: string) => {
    const localUser: AppUser = {
      id: `local-${role.toLowerCase()}-01`,
      email,
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    const localProfile: Profile = {
      id: localUser.id,
      full_name: fullName,
      role,
    };
    setUser(localUser);
    setProfile(localProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: localUser, profile: localProfile }));
    setLoading(false);
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(null);
    setProfile(null);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore sign out network error
      }
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const load = async (nextUser: User | null) => {
      if (nextUser) {
        setUser(nextUser);
        try {
          const prof = await getProfile(nextUser);
          setProfile(prof);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: nextUser, profile: prof }));
        } catch {
          setProfile(null);
        }
      }
      setLoading(false);
    };

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        void load(data.user);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void load(session.user);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInLocal, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
