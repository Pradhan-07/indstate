import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, CONFIG_ERROR_MESSAGE } from '../lib/supabaseClient';
import GoogleAuthPromptModal from '../components/auth/GoogleAuthPromptModal';

const AuthContext = createContext(null);

/**
 * Map raw provider errors to friendly user-facing messages
 */
function sanitizeAuthError(err) {
  if (!err) return '';
  const raw = typeof err === 'string' ? err : err.message || '';
  const message = raw.toLowerCase();

  if (message.includes('supabase configuration is missing') || message.includes('configuration is missing')) {
    return CONFIG_ERROR_MESSAGE;
  }
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Incorrect email or password. Please verify and try again.';
  }
  if (message.includes('token has expired') || message.includes('otp expired') || message.includes('expired')) {
    return 'Verification code expired. Please request a new OTP.';
  }
  if (message.includes('token is invalid') || message.includes('invalid token') || message.includes('bad code')) {
    return 'Invalid verification code. Please check and try again.';
  }
  if (message.includes('over_email_send_rate_limit') || message.includes('rate limit') || message.includes('too many')) {
    return 'Too many OTP requests. Please wait a moment before trying again.';
  }
  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'An account already exists with this email. Please sign in instead.';
  }
  if (message.includes('email address') || message.includes('invalid email')) {
    return 'Invalid email address. Please enter a valid email.';
  }
  if (message.includes('password should be') || message.includes('password does not meet')) {
    return 'Password does not meet requirements (minimum 8 characters with uppercase, lowercase, and number).';
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return 'Unable to connect to authentication server. Please check your internet connection.';
  }
  return raw || 'Authentication request failed. Please try again.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot-password'
  const [redirectPath, setRedirectPath] = useState(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [isSavingGoogleProfile, setIsSavingGoogleProfile] = useState(false);

  // Load user profile from Supabase profiles table
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      return null;
    }

    try {
      if (!isSupabaseConfigured()) {
        const fallbackUser = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          phone: authUser.user_metadata?.phone || '',
          role: authUser.user_metadata?.role || 'Buyer',
          state: authUser.user_metadata?.state || '',
          city: authUser.user_metadata?.city || '',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.email)}&backgroundColor=0F1B3D&textColor=FFFFFF`,
          createdAt: authUser.created_at
        };
        setUser(fallbackUser);
        return fallbackUser;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[AuthContext] Profile lookup warning:', error.message);
      }

      const userProfile = data || {
        user_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
        state: authUser.user_metadata?.state || '',
        city: authUser.user_metadata?.city || '',
        phone: authUser.user_metadata?.phone || '',
        role: authUser.user_metadata?.role || 'Buyer',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
        created_at: authUser.created_at
      };

      setProfile(data);

      // Build unified user object for INDSTATE components
      const unifiedUser = {
        id: authUser.id,
        email: authUser.email,
        name: userProfile.full_name || 'INDSTATE Member',
        phone: userProfile.phone || '',
        role: userProfile.role || 'Buyer',
        state: userProfile.state || '',
        city: userProfile.city || '',
        avatar: userProfile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.full_name || authUser.email)}&backgroundColor=0F1B3D&textColor=FFFFFF`,
        createdAt: userProfile.created_at || authUser.created_at
      };

      setUser(unifiedUser);

      // Check if user came from Google OAuth and needs mandatory State
      if (!userProfile.state || userProfile.state.trim() === '') {
        setNeedsProfileCompletion(true);
      } else {
        setNeedsProfileCompletion(false);
      }

      return unifiedUser;
    } catch (err) {
      console.warn('[AuthContext] Error in fetchProfile:', err);
      const fallbackUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        phone: authUser.user_metadata?.phone || '',
        role: authUser.user_metadata?.role || 'Buyer',
        state: authUser.user_metadata?.state || '',
        city: authUser.user_metadata?.city || '',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.email)}&backgroundColor=0F1B3D&textColor=FFFFFF`,
        createdAt: authUser.created_at
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  // Initialize session on application mount and restore persistent auth
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        // Restore real session from Supabase client local cache
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthContext] getSession warning:', error.message);
        }

        if (initialSession?.user && isMounted) {
          setSession(initialSession);
          await fetchProfile(initialSession.user);
        } else if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('[AuthContext] Boot error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    if (isSupabaseConfigured()) {
      // Listen for auth state changes (login, logout, token refresh, OAuth redirect return)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);

        if (newSession?.user) {
          await fetchProfile(newSession.user);
        } else {
          setUser(null);
          setProfile(null);
          setNeedsProfileCompletion(false);
        }
        setIsLoading(false);
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    } else {
      return () => {
        isMounted = false;
      };
    }
  }, [fetchProfile]);

  // 1. Send OTP for Registration
  const sendOtp = async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    const normalized = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }
    return data;
  };

  // 2. Verify OTP (Registration Flow Step 2)
  const verifyOtp = async (email, token) => {
    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    const normalized = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (cleanToken.length !== 6) {
      throw new Error('Please enter all 6 digits of the verification code.');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: cleanToken,
      type: 'email'
    });

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }

    if (data.session) {
      setSession(data.session);
    }
    return data;
  };

  // 3. Complete Profile & Set Password (Registration Step 3)
  const completeRegistration = async ({ fullName, state, city, phone, password }) => {
    if (!state || !state.trim()) {
      throw new Error('State is required. Indian State / UT selection is compulsory.');
    }

    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    // Set user's password and metadata in Supabase Auth
    const { data: authUpdate, error: authErr } = await supabase.auth.updateUser({
      password: password,
      data: {
        full_name: fullName.trim(),
        state: state.trim(),
        city: city?.trim() || '',
        phone: phone?.trim() || ''
      }
    });

    if (authErr) {
      throw new Error(sanitizeAuthError(authErr));
    }

    const currentUserId = authUpdate.user?.id || session?.user?.id;
    const currentEmail = authUpdate.user?.email || session?.user?.email;

    if (!currentUserId) {
      throw new Error('Session expired. Please request a new OTP to continue.');
    }

    // Upsert into profiles table
    const profilePayload = {
      user_id: currentUserId,
      email: currentEmail,
      full_name: fullName.trim(),
      state: state.trim(),
      city: city?.trim() || '',
      phone: phone?.trim() || '',
      role: 'Buyer',
      updated_at: new Date().toISOString()
    };

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'user_id' });

    if (profileErr) {
      console.warn('[AuthContext] Profile upsert warning:', profileErr.message);
    }

    await fetchProfile(authUpdate.user || session.user);
    return { success: true };
  };

  // 4. Existing User Login (Email + Password)
  const signInWithPassword = async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }

    setSession(data.session);
    await fetchProfile(data.user);
    return data;
  };

  // 5. Google Sign-In with dynamic local / production redirect
  const signInWithGoogle = async (customRedirect = null) => {
    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    const target = customRedirect || redirectPath || '/dashboard';
    const redirectUrl = `${window.location.origin}${target.startsWith('/') ? target : `/${target}`}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }
    return data;
  };

  // 6. Complete Profile for First-Time Google User (State is Mandatory)
  const saveGoogleProfile = async ({ state, city }) => {
    if (!state || !state.trim()) {
      throw new Error('State is required. Indian State / UT selection is compulsory.');
    }

    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    setIsSavingGoogleProfile(true);
    try {
      const currentUserId = session?.user?.id;
      if (!currentUserId) throw new Error('No active session found.');

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: { state: state.trim(), city: city?.trim() || '' }
      });

      // Upsert profile record
      await supabase
        .from('profiles')
        .upsert({
          user_id: currentUserId,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0],
          state: state.trim(),
          city: city?.trim() || '',
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      setNeedsProfileCompletion(false);
      await fetchProfile(session.user);
    } catch (err) {
      throw new Error(sanitizeAuthError(err));
    } finally {
      setIsSavingGoogleProfile(false);
    }
  };

  // 7. Forgot Password: Send OTP / Password Reset Email
  const sendPasswordResetOtp = async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    const normalized = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.resetPasswordForEmail(normalized);

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }
    return data;
  };

  // 8. Forgot Password: Verify OTP
  const verifyPasswordResetOtp = async (email, token) => {
    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    const normalized = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (cleanToken.length !== 6) {
      throw new Error('Please enter all 6 digits of the verification code.');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: cleanToken,
      type: 'recovery'
    });

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }

    if (data.session) {
      setSession(data.session);
    }
    return data;
  };

  // 9. Reset Password: Update to new password
  const resetPassword = async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw new Error(CONFIG_ERROR_MESSAGE);
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }
    return data;
  };

  // 10. Update Profile (Name, State, City, Phone)
  const updateProfile = async (updates) => {
    if (!isSupabaseConfigured()) {
      const updatedUser = { ...(user || {}), ...updates };
      setUser(updatedUser);
      return updatedUser;
    }

    if (session?.user) {
      const updatePayload = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('user_id', session.user.id)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(sanitizeAuthError(error));
      }

      await fetchProfile(session.user);
      return data;
    }

    return user;
  };

  // 11. Switch Role (Buyer, Agent, Owner, Builder)
  const switchRole = async (newRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);

      if (isSupabaseConfigured() && session?.user) {
        try {
          await supabase
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('user_id', session.user.id);
        } catch {
          // ignore background role update error
        }
      }
    }
  };

  // 12. Sign Out
  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore network errors on signout
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setNeedsProfileCompletion(false);
    setIsAuthModalOpen(false);
  };

  // Modal helpers for navigation/triggering
  const openAuthModal = (mode = 'login', redirect = null) => {
    setAuthMode(mode);
    if (redirect) setRedirectPath(redirect);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAuthenticated: Boolean(user && session),
        isLoading,
        isConfigured: isSupabaseConfigured(),
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        openAuthModal,
        closeAuthModal,
        redirectPath,
        setRedirectPath,
        sendOtp,
        verifyOtp,
        completeRegistration,
        signIn: signInWithPassword,
        signInWithPassword,
        signInWithGoogle,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPassword,
        updateProfile,
        switchRole,
        signOut,
        logout: signOut,
        login: signInWithPassword
      }}
    >
      {children}

      {/* Mandatory State prompt for first-time Google sign-ins */}
      <GoogleAuthPromptModal
        isOpen={needsProfileCompletion}
        user={session?.user}
        onSave={saveGoogleProfile}
        isLoading={isSavingGoogleProfile}
      />
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
