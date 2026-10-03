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
  return 'Something went wrong. Please try again.';
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Non-fatal, profile might not exist yet
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

      // Check if user came from Google and needs State
      if (!userProfile.state) {
        setNeedsProfileCompletion(true);
      } else {
        setNeedsProfileCompletion(false);
      }

      return unifiedUser;
    } catch {
      // In case of network/fetch issue, retain basic auth identity
      const fallbackUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        phone: authUser.user_metadata?.phone || '',
        role: authUser.user_metadata?.role || 'Buyer',
        state: authUser.user_metadata?.state || '',
        city: authUser.user_metadata?.city || '',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.email)}`,
        createdAt: authUser.created_at
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  // Initialize session on application mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          // Restore local demo session if available
          try {
            const saved = localStorage.getItem('indstate_user_v1');
            if (saved) {
              const parsedUser = JSON.parse(saved);
              if (parsedUser && isMounted) {
                setUser(parsedUser);
                setSession({ user: parsedUser, access_token: 'demo-token' });
              }
            }
          } catch {
            // Ignore parse errors
          }
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          // session error handled silently
        }

        if (initialSession?.user && isMounted) {
          setSession(initialSession);
          await fetchProfile(initialSession.user);
        }
      } catch {
        // catch block for unhandled boot errors
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    if (isSupabaseConfigured()) {
      // Listen for auth state changes (login, logout, token refresh, OAuth return)
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

  // 1. Send OTP for Registration / Login
  const sendOtp = async (email) => {
    const normalized = email.trim().toLowerCase();

    // Demo Mode Fallback
    if (!isSupabaseConfigured()) {
      return { success: true, email: normalized, demoCode: '123456' };
    }

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

  // 2. Verify OTP (Registration Flow)
  const verifyOtp = async (email, token) => {
    const normalized = email.trim().toLowerCase();
    const cleanToken = token.trim();

    // Demo Mode Fallback
    if (!isSupabaseConfigured()) {
      if (cleanToken.length !== 6) {
        throw new Error('Please enter all 6 digits of the verification code.');
      }
      const demoUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        email: normalized,
        name: normalized.split('@')[0],
        role: 'Buyer'
      };
      const demoSession = { user: demoUser, access_token: 'demo-otp-token' };
      setSession(demoSession);
      return { session: demoSession };
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
    if (!state) {
      throw new Error('State is required. Indian State / UT selection is compulsory.');
    }

    // Demo Mode Fallback
    if (!isSupabaseConfigured()) {
      const regUser = {
        id: session?.user?.id || `usr-${Date.now().toString().slice(-4)}`,
        email: session?.user?.email || 'user@indstate.in',
        name: fullName.trim(),
        phone: phone?.trim() || '+91 98765 43210',
        role: 'Buyer',
        state: state,
        city: city?.trim() || '',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}&backgroundColor=0F1B3D&textColor=FFFFFF`,
        createdAt: new Date().toISOString()
      };
      const demoSession = { user: regUser, access_token: 'demo-reg-token' };
      setUser(regUser);
      setSession(demoSession);
      localStorage.setItem('indstate_user_v1', JSON.stringify(regUser));
      return { success: true, user: regUser };
    }

    // Set user's password and metadata in Supabase Auth
    const { data: authUpdate, error: authErr } = await supabase.auth.updateUser({
      password: password,
      data: {
        full_name: fullName.trim(),
        state: state,
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

    // Insert or update profiles table
    const profilePayload = {
      user_id: currentUserId,
      email: currentEmail,
      full_name: fullName.trim(),
      state: state,
      city: city?.trim() || '',
      phone: phone?.trim() || '',
      role: 'Buyer',
      updated_at: new Date().toISOString()
    };

    const { data: _profileData, error: _profileErr } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (_profileErr) {
      // If table has RLS issue or not created yet, we still update in-memory state
    }

    await fetchProfile(authUpdate.user || session.user);
    return { success: true };
  };

  // 4. Existing User Login (Email + Password)
  const signInWithPassword = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Demo Mode Fallback
    if (!isSupabaseConfigured()) {
      const displayName = cleanEmail.split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()) || 'INDSTATE Member';

      const demoUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        email: cleanEmail,
        name: displayName,
        phone: '+91 98765 43210',
        role: 'Buyer',
        state: 'Maharashtra',
        city: 'Mumbai',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0F1B3D&textColor=FFFFFF`,
        createdAt: new Date().toISOString()
      };
      const demoSession = { user: demoUser, access_token: 'demo-password-token' };
      setUser(demoUser);
      setSession(demoSession);
      localStorage.setItem('indstate_user_v1', JSON.stringify(demoUser));
      return { user: demoUser, session: demoSession };
    }

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
    // Demo Mode Fallback
    if (!isSupabaseConfigured()) {
      const googleDemoUser = {
        id: 'usr-google-demo',
        email: 'arjun.verma@example.com',
        name: 'Arjun Verma',
        phone: '+91 98765 43210',
        role: 'Buyer',
        state: 'Maharashtra',
        city: 'Mumbai',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        createdAt: new Date().toISOString()
      };
      const demoSession = { user: googleDemoUser, access_token: 'demo-google-token' };
      setUser(googleDemoUser);
      setSession(demoSession);
      localStorage.setItem('indstate_user_v1', JSON.stringify(googleDemoUser));
      return { user: googleDemoUser, session: demoSession };
    }

    const target = customRedirect || redirectPath || '/dashboard';
    const redirectUrl = `${window.location.origin}${target.startsWith('/') ? target : `/${target}`}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }
    return data;
  };

  // 6. Complete Profile for First-Time Google User
  const saveGoogleProfile = async ({ state, city }) => {
    if (!state) {
      throw new Error('State is required.');
    }

    setIsSavingGoogleProfile(true);
    try {
      if (!isSupabaseConfigured()) {
        if (user) {
          const updated = { ...user, state, city: city?.trim() || '' };
          setUser(updated);
          localStorage.setItem('indstate_user_v1', JSON.stringify(updated));
        }
        setNeedsProfileCompletion(false);
        return;
      }

      const currentUserId = session?.user?.id;
      if (!currentUserId) throw new Error('No active session found.');

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: { state, city: city?.trim() || '' }
      });

      // Upsert profile record
      await supabase
        .from('profiles')
        .upsert({
          user_id: currentUserId,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0],
          state: state,
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

  // 7. Forgot Password: Send OTP
  const sendPasswordResetOtp = async (email) => {
    const normalized = email.trim().toLowerCase();

    // Demo Mode Fallback
    if (!isSupabaseConfigured()) {
      return { success: true, email: normalized, demoCode: '123456' };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(normalized);

    if (error) {
      throw new Error(sanitizeAuthError(error));
    }
    return data;
  };

  // 8. Forgot Password: Verify OTP
  const verifyPasswordResetOtp = async (email, token) => {
    const normalized = email.trim().toLowerCase();
    const cleanToken = token.trim();

    // Demo Mode Fallback
    if (!isSupabaseConfigured()) {
      if (cleanToken.length !== 6) {
        throw new Error('Please enter all 6 digits of the verification code.');
      }
      const demoSession = { user: { email: normalized }, access_token: 'demo-reset-token' };
      setSession(demoSession);
      return { success: true, session: demoSession };
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
      return { success: true };
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
    const updatedUser = {
      ...(user || {}),
      ...updates
    };
    setUser(updatedUser);
    localStorage.setItem('indstate_user_v1', JSON.stringify(updatedUser));

    if (isSupabaseConfigured() && session?.user) {
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

    return updatedUser;
  };

  // 11. Switch Role (Buyer, Agent, Owner, Builder)
  const switchRole = async (newRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem('indstate_user_v1', JSON.stringify(updatedUser));

      if (isSupabaseConfigured() && session?.user) {
        try {
          await supabase
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('user_id', session.user.id);
        } catch {
          // ignore background update error
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
    localStorage.removeItem('indstate_user_v1');
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
        isAuthenticated: Boolean(user),
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
        logout: signOut, // backward compatibility with Navbar/TopBar
        login: signInWithPassword // backward compatibility
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
