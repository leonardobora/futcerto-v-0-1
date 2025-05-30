import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: 'player' | 'manager';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Omit<Profile, 'id' | 'email'> & { email: string }) => Promise<void>; // Ensure email is part of userData for profile
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
      }
      setLoading(false);
    };

    fetchInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setLoading(true); // Set loading true while fetching new profile
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setLoading(false); // Set loading false if no user
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 is when no rows are found, which can happen
        throw error;
      }
      setProfile(data || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null); // Ensure profile is null on error
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Omit<Profile, 'id' | 'email'> & { email: string }) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: userData.name,
            email: userData.email, // Ensure email is from userData for profile
            phone: userData.phone,
            user_type: userData.user_type,
          },
        ]);

      if (profileError) {
        // Potentially delete the user if profile creation fails, or handle more gracefully
        console.error("Error creating profile, user might be orphaned:", profileError);
        throw profileError;
      }
      // Manually set user and profile here if needed, or let onAuthStateChange handle it
      // await fetchProfile(authData.user.id); // Optionally fetch profile immediately
    } else {
        throw new Error("Sign up successful but no user data returned.");
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    // onAuthStateChange will handle setting user and profile
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null); // Clear profile on sign out
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
