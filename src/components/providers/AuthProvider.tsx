'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'executive' | 'viewer';

interface ApprovedUserInfo {
  id: string;
  email: string;
  role: UserRole;
  executiveId: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  approvedUser: ApprovedUserInfo | null;
  loading: boolean;
  isAdmin: boolean;
  isExecutive: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  approvedUser: null,
  loading: true,
  isAdmin: false,
  isExecutive: false,
  signOut: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [approvedUser, setApprovedUser] = useState<ApprovedUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkApproval = async (authUser: User | null) => {
    if (!authUser?.email) {
      setApprovedUser(null);
      return false;
    }

    try {
      const response = await fetch('/api/auth/check-approved');
      const data = await response.json();

      if (data.approved && data.user) {
        setApprovedUser(data.user);
        return true;
      } else {
        setApprovedUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking user approval:', error);
      setApprovedUser(null);
      return false;
    }
  };

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const isApproved = await checkApproval(session.user);
        if (!isApproved && pathname !== '/login') {
          // User is authenticated but not approved - sign them out
          await supabase.auth.signOut();
          router.push('/login?error=not_approved');
        }
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const isApproved = await checkApproval(session.user);
          if (!isApproved && pathname !== '/login') {
            // User is authenticated but not approved - sign them out
            await supabase.auth.signOut();
            router.push('/login?error=not_approved');
            return;
          }
        } else {
          setApprovedUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setApprovedUser(null);
    router.push('/login');
  };

  const isAdmin = approvedUser?.role === 'admin';
  const isExecutive = approvedUser?.role === 'executive' || approvedUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      approvedUser,
      loading,
      isAdmin,
      isExecutive,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}
