import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types/user';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile from database - NON-BLOCKING
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) {
      console.warn('Supabase not configured, skipping profile fetch');
      return null;
    }

    try {
      console.log('Attempting to fetch user profile for:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Could not fetch user profile (non-critical):', error.message);
        console.log('User can still use the app without profile');
        return null;
      }

      console.log('User profile fetched successfully');
      return data as UserProfile;
    } catch (err) {
      console.warn('Error fetching profile (non-critical):', err);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabase) {
      console.error('Supabase is not configured. Auth will not work.');
      setLoading(false);
      return;
    }

    console.log('Initializing auth...');

    // Get current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Session check:', session ? 'Logged in' : 'Not logged in');

      setSession(session);
      setUser(session?.user ?? null);

      // Try to fetch profile but don't block on it
      if (session?.user) {
        console.log('Fetching user profile (non-blocking)...');
        fetchUserProfile(session.user.id).then(profile => {
          setUserProfile(profile);
          console.log('Profile loaded:', profile ? 'Yes' : 'No (using default)');
        });
      }

      setLoading(false);
      console.log('Auth ready - user can proceed');
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      setSession(session);
      setUser(session?.user ?? null);

      // Try to fetch profile but don't block
      if (session?.user) {
        console.log('Auth changed, fetching profile (non-blocking)...');
        fetchUserProfile(session.user.id).then(profile => {
          setUserProfile(profile);
        });
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      console.error('Supabase is not configured!');
      return { error: { message: 'Supabase not configured', name: 'ConfigError', status: 500 } as AuthError };
    }

    console.log('Signing in:', email);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in failed:', error.message);
        return { error };
      }

      console.log('Sign in successful!');
      return { error: null };
    } catch (err) {
      console.error('Unexpected sign in error:', err);
      return { error: { message: 'Unexpected error during sign in', name: 'UnknownError', status: 500 } as AuthError };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured', name: 'ConfigError', status: 500 } as AuthError };
    }

    console.log('Signing up:', email);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Sign up failed:', error.message);
    } else {
      console.log('Sign up successful!');
    }

    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;

    console.log('Signing out...');
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured', name: 'ConfigError', status: 500 } as AuthError };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured', name: 'ConfigError', status: 500 } as AuthError };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  };

  // Default to 'user' role if profile doesn't exist
  const role = userProfile?.role ?? 'user';
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || role === 'superadmin';

  const value = {
    user,
    userProfile,
    session,
    loading,
    role,
    isSuperAdmin,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
