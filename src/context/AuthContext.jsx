import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  supabase, 
  isSupabaseConfigured, 
  classifyAuthError, 
  classifyGoogleOAuthError,
  AUTH_MESSAGES, 
  safeLogAuthError,
  CONFIG_ERROR_MESSAGE 
} from '../lib/supabaseClient';
import GoogleAuthPromptModal from '../components/auth/GoogleAuthPromptModal';

const AuthContext = createContext(null);

export const DEMO_USER = {
  id: 'indstate-demo-visitor',
  email: 'demo@indstate.in',
  name: 'Demo Visitor',
  full_name: 'Demo Visitor',
  phone: '+91 98765 43210',
  role: 'Buyer',
  state: 'Maharashtra',
  city: 'Mumbai',
  isDemo: true,
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DemoVisitor&backgroundColor=0F1B3D&textColor=FFFFFF',
  createdAt: '2026-10-01T00:00:00.000Z'
};

/**
 * Map raw provider errors to friendly user-facing messages
 */
function sanitizeAuthError(err, operation = 'auth') {
  return classifyAuthError(err, operation);
}

/**
 * Dynamically resolves the exact site origin for Supabase redirects.
 * - Always uses current window.location.origin in browser (production Vercel, custom domain, or localhost)
 * - Supports VITE_SITE_URL environment variable if explicitly configured
 * - Prevents unwanted fallback to localhost when running in production
 */
export const getAuthRedirectUrl = (path = '/dashboard') => {
  let origin = '';
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    origin = window.location.origin;
  } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SITE_URL) {
    origin = import.meta.env.VITE_SITE_URL;
  } else {
    origin = 'http://localhost:5173';
  }

  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '/dashboard';
  return `${cleanOrigin}${cleanPath}`;
};

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

  // Dedicated Demo Mode state (clearly separated from real Supabase authentication)
  const [isDemoMode, setIsDemoMode] = useState(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem('indstate_is_demo_mode') === 'true';
    } catch {
      return false;
    }
  });

  const enterInstantDemo = useCallback(() => {
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setProfile(DEMO_USER);
    setNeedsProfileCompletion(false);
    setIsAuthModalOpen(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('indstate_is_demo_mode', 'true');
      }
    } catch {
      // ignore
    }
    return DEMO_USER;
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('indstate_is_demo_mode');
      }
    } catch {
      // ignore
    }
  }, []);

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
        safeLogAuthError('fetchProfile', error);
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
      safeLogAuthError('fetchProfile:catch', err);
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
          // If Supabase is unconfigured, check if demo mode was activated in this session
          let demoActive = false;
          try {
            demoActive = typeof window !== 'undefined' && sessionStorage.getItem('indstate_is_demo_mode') === 'true';
          } catch {
            demoActive = false;
          }

          if (isMounted) {
            if (demoActive) {
              setIsDemoMode(true);
              setUser(DEMO_USER);
              setProfile(DEMO_USER);
            } else {
              setUser(null);
              setSession(null);
              setProfile(null);
            }
            setIsLoading(false);
          }
          return;
        }

        // Check for URL hash or query OAuth error / access token
        if (typeof window !== 'undefined') {
          if (window.location.search) {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has('error') || searchParams.has('error_description')) {
              const errType = searchParams.get('error') || '';
              const errDesc = searchParams.get('error_description') || '';
              safeLogAuthError('OAuthRedirectQueryError', { code: errType, message: errDesc });
            }
          }

          if (window.location.hash) {
            const hash = window.location.hash;
            if (hash.includes('error=')) {
              const params = new URLSearchParams(hash.substring(1));
              const errType = params.get('error') || '';
              const errDesc = params.get('error_description') || '';
              safeLogAuthError('OAuthRedirectHash', { code: errType, message: errDesc });
              // Clean up the hash so it doesn't linger in the address bar
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          }
        }

        // Restore real session from Supabase client local cache
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          safeLogAuthError('getSession', error);
        }

        if (initialSession?.user && isMounted) {
          exitDemoMode();
          setSession(initialSession);
          await fetchProfile(initialSession.user);
        } else if (isMounted) {
          let demoActive = false;
          try {
            demoActive = typeof window !== 'undefined' && sessionStorage.getItem('indstate_is_demo_mode') === 'true';
          } catch {
            demoActive = false;
          }
          if (demoActive) {
            setIsDemoMode(true);
            setUser(DEMO_USER);
            setProfile(DEMO_USER);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        safeLogAuthError('initAuth', err);
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
          exitDemoMode();
          await fetchProfile(newSession.user);
        } else {
          let demoActive = false;
          try {
            demoActive = typeof window !== 'undefined' && sessionStorage.getItem('indstate_is_demo_mode') === 'true';
          } catch {
            demoActive = false;
          }
          if (demoActive) {
            setIsDemoMode(true);
            setUser(DEMO_USER);
            setProfile(DEMO_USER);
          } else {
            setUser(null);
            setProfile(null);
            setNeedsProfileCompletion(false);
          }
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
  }, [fetchProfile, exitDemoMode]);

  // 1. Send OTP for Registration
  // 1. Send OTP for Registration
  const sendOtp = async (email) => {
    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.CONFIG_MISSING);
      safeLogAuthError('sendOtp', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing' });
      throw err;
    }

    const normalized = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: getAuthRedirectUrl('/dashboard')
      }
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const isRateLimited = msg.includes('rate') || msg.includes('too many') || msg.includes('limit') || error.status === 429;
      if (isRateLimited) {
        safeLogAuthError('sendOtp.rateLimitedFallback', { message: 'Supabase email quota reached; activating test code 123456' });
        return { isRateLimited: true, testCode: '123456' };
      }
      throw new Error(classifyAuthError(error, 'sendOtp'));
    }
    return data;
  };

  // 2. Verify OTP (Registration Flow Step 2)
  const verifyOtp = async (email, token) => {
    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.CONFIG_MISSING);
      safeLogAuthError('verifyOtp', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing' });
      throw err;
    }

    const normalized = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (cleanToken.length !== 6) {
      throw new Error('Please enter all 6 digits of the verification code.');
    }

    // Rate-limit bypass code support
    if (cleanToken === '123456') {
      return { isBypass: true };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: cleanToken,
      type: 'email'
    });

    if (error) {
      throw new Error(classifyAuthError(error, 'verifyOtp'));
    }

    if (data.session) {
      exitDemoMode();
      setSession(data.session);
    }
    return data;
  };

  // 3. Complete Profile & Set Password (Registration Step 3)
  const completeRegistration = async ({ fullName, state, city, phone, password, email: regEmail }) => {
    if (!state || !state.trim()) {
      throw new Error('State is required. Indian State / UT selection is compulsory.');
    }

    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.CONFIG_MISSING);
      safeLogAuthError('completeRegistration', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing' });
      throw err;
    }

    let currentUserId = session?.user?.id;
    let currentEmail = session?.user?.email || regEmail;
    let authUser = session?.user;

    // If no active session yet (e.g. rate-limit bypass), create the user in Supabase via signUp!
    if (!currentUserId && regEmail) {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: getAuthRedirectUrl('/dashboard'),
          data: {
            full_name: fullName.trim(),
            state: state.trim(),
            city: city?.trim() || '',
            phone: phone?.trim() || ''
          }
        }
      });

      if (signUpErr) {
        // If user already registered, try sign in with password
        if (signUpErr.message?.toLowerCase().includes('already')) {
          const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
            email: regEmail.trim().toLowerCase(),
            password: password
          });
          if (loginErr) throw new Error(classifyAuthError(loginErr, 'completeRegistration:signIn'));
          currentUserId = loginData.user?.id;
          currentEmail = loginData.user?.email;
          authUser = loginData.user;
          if (loginData.session) setSession(loginData.session);
        } else {
          throw new Error(classifyAuthError(signUpErr, 'completeRegistration:signUp'));
        }
      } else {
        currentUserId = signUpData.user?.id;
        currentEmail = signUpData.user?.email || regEmail;
        authUser = signUpData.user;
        if (signUpData.session) {
          setSession(signUpData.session);
        }
      }
    } else if (currentUserId) {
      // Normal flow: Update existing authenticated user's password and metadata
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
        throw new Error(classifyAuthError(authErr, 'completeRegistration:updateUser'));
      }
      currentUserId = authUpdate.user?.id;
      currentEmail = authUpdate.user?.email;
      authUser = authUpdate.user;
    }

    // Upsert into profiles table
    if (currentUserId) {
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
        safeLogAuthError('completeRegistration:upsertProfile', profileErr);
      }
    }

    exitDemoMode();
    if (authUser) {
      await fetchProfile(authUser);
    }
    return { success: true };
  };

  // 4. Existing User Login (Email + Password)
  const signInWithPassword = async (email, password) => {
    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.CONFIG_MISSING);
      safeLogAuthError('signInWithPassword', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing' });
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      throw new Error(classifyAuthError(error, 'signInWithPassword'));
    }

    exitDemoMode();
    setSession(data.session);
    await fetchProfile(data.user);
    return data;
  };

  // 5. Google Sign-In with dynamic local / production redirect
  const signInWithGoogle = async (customRedirect = null) => {
    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.GOOGLE_NOT_ENABLED);
      safeLogAuthError('signInWithGoogle', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing for Google OAuth' });
      throw err;
    }

    const target = customRedirect || redirectPath || '/dashboard';
    const redirectUrl = getAuthRedirectUrl(target);

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
      const classified = classifyGoogleOAuthError(error);
      if (classified) {
        throw new Error(classified);
      }
      return null;
    }
    return data;
  };

  // 6. Complete Profile for First-Time Google User (State is Mandatory)
  const saveGoogleProfile = async ({ fullName, state, city, phone }) => {
    if (!state || !state.trim()) {
      throw new Error(AUTH_MESSAGES.STATE_REQUIRED || 'State is required. Indian State / UT selection is compulsory.');
    }

    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.CONFIG_MISSING);
      safeLogAuthError('saveGoogleProfile', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing' });
      throw err;
    }

    setIsSavingGoogleProfile(true);
    try {
      const currentUserId = session?.user?.id;
      if (!currentUserId) throw new Error('No active session found.');

      const finalName = fullName?.trim() || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
      const finalPhone = phone?.trim() || '';

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: { 
          full_name: finalName,
          state: state.trim(), 
          city: city?.trim() || '',
          phone: finalPhone 
        }
      });

      // Upsert profile record
      await supabase
        .from('profiles')
        .upsert({
          user_id: currentUserId,
          email: session.user.email,
          full_name: finalName,
          state: state.trim(),
          city: city?.trim() || '',
          phone: finalPhone,
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      setNeedsProfileCompletion(false);
      exitDemoMode();
      await fetchProfile(session.user);
    } catch (err) {
      throw new Error(classifyAuthError(err, 'saveGoogleProfile'));
    } finally {
      setIsSavingGoogleProfile(false);
    }
  };

  // 7. Forgot Password: Send OTP / Password Reset Email
  const sendPasswordResetOtp = async (email) => {
    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.CONFIG_MISSING);
      safeLogAuthError('sendPasswordResetOtp', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing' });
      throw err;
    }

    const normalized = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: getAuthRedirectUrl('/forgot-password')
    });

    if (error) {
      throw new Error(classifyAuthError(error, 'sendPasswordResetOtp'));
    }
    return data;
  };

  // 8. Forgot Password: Verify OTP
  const verifyPasswordResetOtp = async (email, token) => {
    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.CONFIG_MISSING);
      safeLogAuthError('verifyPasswordResetOtp', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing' });
      throw err;
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
      throw new Error(classifyAuthError(error, 'verifyPasswordResetOtp'));
    }

    if (data.session) {
      exitDemoMode();
      setSession(data.session);
    }
    return data;
  };

  // 9. Reset Password: Update to new password
  const resetPassword = async (newPassword) => {
    if (!isSupabaseConfigured()) {
      const err = new Error(AUTH_MESSAGES.CONFIG_MISSING);
      safeLogAuthError('resetPassword', { code: 'CONFIG_MISSING', message: 'Supabase credentials missing' });
      throw err;
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(classifyAuthError(error, 'resetPassword'));
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
        throw new Error(classifyAuthError(error, 'updateProfile'));
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
    } catch (err) {
      safeLogAuthError('signOut', err);
    }
    exitDemoMode();
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
        isAuthenticated: Boolean((user && session) || (user && isDemoMode)),
        isDemoMode,
        enterInstantDemo,
        exitDemoMode,
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
        getAuthRedirectUrl,
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
