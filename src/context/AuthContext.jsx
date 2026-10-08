import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { DEMO_ACCOUNTS } from '../lib/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted && currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadProfile(currentSession.user.id, currentSession.user);
        } else if (mounted) {
          // Default to student demo user if nothing logged in for immediate hackathon demo readiness
          const stored = localStorage.getItem('pulse_last_demo_role');
          if (stored) {
            await quickSwitchDemo(stored);
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        await loadProfile(newSession.user.id, newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  async function loadProfile(userId, authUser) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        // Construct fallback profile from auth metadata if not yet created in table
        const meta = authUser?.user_metadata || {};
        const fallback = {
          id: userId,
          email: authUser?.email || '',
          full_name: meta.full_name || authUser?.email?.split('@')[0] || 'Campus Member',
          department: meta.department || 'General',
          phone: meta.phone || '+91 98421 00000',
          role: authUser?.email?.includes('admin') ? 'admin' : (meta.role || 'student'),
          blood_group: meta.blood_group || 'O+',
          skills: meta.skills || [],
          is_available: meta.role === 'volunteer',
          lat: 11.0827,
          lng: 77.1420,
        };
        setProfile(fallback);
      }
    } catch (err) {
      console.warn('Error loading profile:', err);
    }
  }

  async function signIn({ email, password }) {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }

  async function signUp({ email, password, fullName, department, phone, role = 'student', bloodGroup = 'O+' }) {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            department,
            phone,
            role,
            blood_group: bloodGroup,
          },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    try {
      localStorage.removeItem('pulse_last_demo_role');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(updates) {
    if (!user) return { error: { message: 'Not logged in' } };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      setProfile((prev) => ({ ...prev, ...updates }));
      return { data, error: null };
    } catch (err) {
      console.error('Update profile error:', err);
      return { data: null, error: err };
    }
  }

  async function toggleAvailability(newVal) {
    const updated = typeof newVal === 'boolean' ? newVal : !profile?.is_available;
    return updateProfile({ is_available: updated });
  }

  async function quickSwitchDemo(target) {
    setLoading(true);
    try {
      let demoAccount = DEMO_ACCOUNTS.find(
        (a) => a.role === target || a.email === target
      );
      if (!demoAccount) {
        demoAccount = DEMO_ACCOUNTS[0]; // Student fallback
      }

      localStorage.setItem('pulse_last_demo_role', demoAccount.email);
      const res = await signIn({
        email: demoAccount.email,
        password: 'Demo@12345',
      });
      return res;
    } catch (err) {
      console.error('Quick switch demo error:', err);
    } finally {
      setLoading(false);
    }
  }

  const role = profile?.role || user?.user_metadata?.role || 'student';
  const isAvailable = Boolean(profile?.is_available);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAvailable,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        updateProfile,
        toggleAvailability,
        quickSwitchDemo,
        reloadProfile: () => user && loadProfile(user.id, user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
