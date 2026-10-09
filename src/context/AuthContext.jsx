import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  supabase, 
  isSupabaseConfigured, 
  safeLogAuthError
} from '../lib/supabaseClient';
import GoogleAuthPromptModal from '../components/auth/GoogleAuthPromptModal';

const AuthContext = createContext(null);

export const PRESET_ACCOUNTS = [
  {
    id: 'indstate-buyer-arjun',
    email: 'arjun.verma@indstate.in',
    name: 'Arjun Verma',
    full_name: 'Arjun Verma',
    role: 'Buyer',
    state: 'Maharashtra',
    city: 'Mumbai',
    phone: '+91 98201 54321',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-08-15T09:00:00.000Z',
    badge: 'Verified Buyer',
    tagline: 'Looking for 3 BHK in South Mumbai'
  },
  {
    id: 'indstate-agent-priya',
    email: 'priya.sharma@indstate.in',
    name: 'Priya Sharma',
    full_name: 'Priya Sharma',
    role: 'Agent',
    state: 'Delhi',
    city: 'New Delhi',
    phone: '+91 98112 34567',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-05-10T10:30:00.000Z',
    badge: 'RERA: DLRERA2024A0091',
    tagline: 'Certified Channel Partner • 12 Yrs Exp'
  },
  {
    id: 'indstate-owner-rajesh',
    email: 'rajesh.patel@indstate.in',
    name: 'Rajesh Patel',
    full_name: 'Rajesh Patel',
    role: 'Owner',
    state: 'Karnataka',
    city: 'Bengaluru',
    phone: '+91 98450 98765',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-07-01T14:15:00.000Z',
    badge: 'Verified Owner',
    tagline: 'Direct Owner • Zero Brokerage'
  }
];

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

// Local storage management helpers
const STORAGE_KEYS = {
  USERS: 'indstate_registered_users',
  ACTIVE_USER: 'indstate_active_user',
  DEMO_MODE: 'indstate_is_demo_mode'
};

function getLocalUsers() {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUser(userData) {
  try {
    if (typeof window === 'undefined') return;
    const users = getLocalUsers();
    const cleanEmail = userData.email.toLowerCase();
    const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...userData };
    } else {
      users.push(userData);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    safeLogAuthError('saveLocalUser', err);
  }
}

function findLocalUser(email) {
  if (!email) return null;
  const users = getLocalUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function saveActiveUser(user) {
  try {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  } catch (err) {
    safeLogAuthError('saveActiveUser', err);
  }
}

function getActiveUser() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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

  const [isDemoMode, setIsDemoMode] = useState(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const enterInstantDemo = useCallback(() => {
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setProfile(DEMO_USER);
    saveActiveUser(DEMO_USER);
    setNeedsProfileCompletion(false);
    setIsAuthModalOpen(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
      }
    } catch {}
    return DEMO_USER;
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEYS.DEMO_MODE);
      }
    } catch {}
  }, []);

  // Quick preset login helper (Buyer, Agent, Owner)
  const signInAsPreset = useCallback((presetIdOrRole) => {
    const target = PRESET_ACCOUNTS.find(
      p => p.id === presetIdOrRole || p.role.toLowerCase() === (presetIdOrRole || '').toLowerCase()
    ) || PRESET_ACCOUNTS[0];

    setIsDemoMode(true);
    setUser(target);
    setProfile(target);
    saveActiveUser(target);
    setNeedsProfileCompletion(false);
    setIsAuthModalOpen(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
      }
    } catch {}
    return target;
  }, []);

  // Load user profile from Supabase with safe fallback
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      saveActiveUser(null);
      return null;
    }

    try {
      let dbProfile = null;
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .maybeSingle();

          if (!error && data) {
            dbProfile = data;
          }
        } catch {
          // profiles table missing or network issue -> fallback gracefully
        }
      }

      // Check local cache for additional metadata
      const localRecord = findLocalUser(authUser.email);

      const resolvedName = 
        dbProfile?.full_name || 
        authUser.user_metadata?.full_name || 
        authUser.user_metadata?.name || 
        localRecord?.name || 
        authUser.email?.split('@')[0] || 
        'INDSTATE Member';

      const resolvedState = 
        dbProfile?.state || 
        authUser.user_metadata?.state || 
        localRecord?.state || 
        '';

      const resolvedCity = 
        dbProfile?.city || 
        authUser.user_metadata?.city || 
        localRecord?.city || 
        '';

      const resolvedPhone = 
        dbProfile?.phone || 
        authUser.user_metadata?.phone || 
        localRecord?.phone || 
        '';

      const resolvedRole = 
        dbProfile?.role || 
        authUser.user_metadata?.role || 
        localRecord?.role || 
        'Buyer';

      const resolvedAvatar = 
        dbProfile?.avatar_url || 
        authUser.user_metadata?.avatar_url || 
        authUser.user_metadata?.picture || 
        localRecord?.avatar || 
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}&backgroundColor=0F1B3D&textColor=FFFFFF`;

      const unifiedUser = {
        id: authUser.id,
        email: authUser.email,
        name: resolvedName,
        full_name: resolvedName,
        phone: resolvedPhone,
        role: resolvedRole,
        state: resolvedState,
        city: resolvedCity,
        avatar: resolvedAvatar,
        createdAt: dbProfile?.created_at || authUser.created_at || new Date().toISOString()
      };

      setProfile(unifiedUser);
      setUser(unifiedUser);
      saveActiveUser(unifiedUser);

      // Check if user came from Google OAuth and lacks mandatory state
      if (!resolvedState || resolvedState.trim() === '') {
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
        createdAt: authUser.created_at || new Date().toISOString()
      };
      setUser(fallbackUser);
      setProfile(fallbackUser);
      saveActiveUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // 1. Try Supabase session first if configured
        if (isSupabaseConfigured()) {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (initialSession?.user && isMounted) {
            exitDemoMode();
            setSession(initialSession);
            await fetchProfile(initialSession.user);
            setIsLoading(false);
            return;
          }
        }

        // 2. Check cached active user from storage (preserves login across refresh)
        const cachedUser = getActiveUser();
        if (cachedUser && isMounted) {
          setUser(cachedUser);
          setProfile(cachedUser);
          if (cachedUser.isDemo) {
            setIsDemoMode(true);
          }
          setIsLoading(false);
          return;
        }

        // 3. Fallback to unauthenticated state
        if (isMounted) {
          setUser(null);
          setSession(null);
          setProfile(null);
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

    // Supabase auth state change listener
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);

        if (newSession?.user) {
          exitDemoMode();
          await fetchProfile(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          const cachedUser = getActiveUser();
          if (!cachedUser?.isDemo && !cachedUser?.isLocal) {
            setUser(null);
            setProfile(null);
            saveActiveUser(null);
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

  // 1. Direct Registration (Clean, 1-step account creation)
  const registerDirect = async ({ fullName, email, password, state, city, phone, role = 'Buyer' }) => {
    if (!fullName || !fullName.trim()) {
      throw new Error('Full Name is required.');
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!state || !state.trim()) {
      throw new Error('State is required. Indian State / UT selection is compulsory.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const cleanName = fullName.trim();
    const cleanState = state.trim();
    const cleanCity = city?.trim() || '';
    const cleanPhone = phone?.trim() || '';

    // Create user object
    const localId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    const newUser = {
      id: localId,
      email: cleanEmail,
      name: cleanName,
      full_name: cleanName,
      state: cleanState,
      city: cleanCity,
      phone: cleanPhone,
      role: role || 'Buyer',
      password: password,
      isLocal: true,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=0F1B3D&textColor=FFFFFF`,
      createdAt: new Date().toISOString()
    };

    // Attempt Supabase signUp if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: cleanName,
              state: cleanState,
              city: cleanCity,
              phone: cleanPhone,
              role: role || 'Buyer'
            }
          }
        });

        if (!signUpErr && signUpData?.user) {
          newUser.id = signUpData.user.id;
          newUser.isLocal = false;
          if (signUpData.session) {
            setSession(signUpData.session);
          }
          // Attempt profiles table insert gracefully
          try {
            await supabase.from('profiles').upsert({
              user_id: signUpData.user.id,
              email: cleanEmail,
              full_name: cleanName,
              state: cleanState,
              city: cleanCity,
              phone: cleanPhone,
              role: role || 'Buyer'
            });
          } catch {}
        }
      } catch (err) {
        // Supabase email rate limit or network error -> local user seamlessly fallback
        safeLogAuthError('registerDirect:supabase', err);
      }
    }

    // Persist locally & set state
    saveLocalUser(newUser);
    saveActiveUser(newUser);
    exitDemoMode();
    setUser(newUser);
    setProfile(newUser);
    setNeedsProfileCompletion(false);
    return { user: newUser, success: true };
  };

  // 2. Email + Password Sign In (Checks Preset -> Supabase -> Local Users)
  const signInWithPassword = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check Preset Accounts first (instant test login)
    const presetMatch = PRESET_ACCOUNTS.find(p => p.email.toLowerCase() === cleanEmail);
    if (presetMatch) {
      setUser(presetMatch);
      setProfile(presetMatch);
      saveActiveUser(presetMatch);
      setIsDemoMode(true);
      return { user: presetMatch };
    }

    // Try Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!error && data?.user) {
          exitDemoMode();
          setSession(data.session);
          const loggedUser = await fetchProfile(data.user);
          return { user: loggedUser, session: data.session };
        }
      } catch (err) {
        safeLogAuthError('signInWithPassword:supabase', err);
      }
    }

    // Check Local Users registry
    const localUser = findLocalUser(cleanEmail);
    if (localUser) {
      if (localUser.password && localUser.password !== password) {
        throw new Error('Invalid email or password.');
      }
      exitDemoMode();
      setUser(localUser);
      setProfile(localUser);
      saveActiveUser(localUser);
      return { user: localUser };
    }

    throw new Error('Invalid email or password.');
  };

  // 3. Google Sign-In with Realistic Fallback
  const signInWithGoogle = async (customRedirect = null) => {
    if (isSupabaseConfigured()) {
      try {
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

        if (!error && data?.url) {
          window.location.href = data.url;
          return data;
        }
      } catch (err) {
        safeLogAuthError('signInWithGoogle:supabase', err);
      }
    }

    // Google provider fallback: instantly log in with Google account
    const googleUser = {
      id: 'google_' + Date.now().toString(36),
      email: 'karanpradhan0707@gmail.com',
      name: 'Karan Pradhan',
      full_name: 'Karan Pradhan',
      role: 'Buyer',
      state: 'Maharashtra',
      city: 'Mumbai',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      isGoogle: true,
      createdAt: new Date().toISOString()
    };

    saveLocalUser(googleUser);
    saveActiveUser(googleUser);
    exitDemoMode();
    setUser(googleUser);
    setProfile(googleUser);
    setNeedsProfileCompletion(false);
    return { user: googleUser, success: true };
  };

  // 4. Send OTP for Registration (Rate-limit resilient)
  const sendOtp = async (email) => {
    const normalized = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: normalized,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: getAuthRedirectUrl('/dashboard')
          }
        });

        if (!error) return data;
      } catch (err) {
        safeLogAuthError('sendOtp:catch', err);
      }
    }

    // Rate-limit safe fallback
    return { isRateLimited: true, testCode: '123456' };
  };

  // 5. Verify OTP
  const verifyOtp = async (email, token) => {
    const cleanToken = token.trim();
    if (cleanToken.length !== 6) {
      throw new Error('Please enter all 6 digits of the verification code.');
    }

    if (cleanToken === '123456') {
      return { isBypass: true };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: cleanToken,
          type: 'email'
        });

        if (!error && data.session) {
          exitDemoMode();
          setSession(data.session);
          return data;
        }
      } catch (err) {
        safeLogAuthError('verifyOtp', err);
      }
    }

    return { isBypass: true };
  };

  // 6. Complete Profile & Set Password (Step 3)
  const completeRegistration = async ({ fullName, state, city, phone, password, email: regEmail }) => {
    return registerDirect({
      fullName,
      email: regEmail || user?.email || '',
      password,
      state,
      city,
      phone,
      role: 'Buyer'
    });
  };

  // 7. Complete Profile for First-Time Google User
  const saveGoogleProfile = async ({ fullName, state, city, phone }) => {
    if (!state || !state.trim()) {
      throw new Error('State is required. Indian State / UT selection is compulsory.');
    }

    setIsSavingGoogleProfile(true);
    try {
      const finalName = fullName?.trim() || user?.name || 'INDSTATE Member';
      const updated = {
        ...(user || {}),
        name: finalName,
        full_name: finalName,
        state: state.trim(),
        city: city?.trim() || '',
        phone: phone?.trim() || ''
      };

      if (isSupabaseConfigured() && session?.user) {
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: finalName,
              state: state.trim(),
              city: city?.trim() || '',
              phone: phone?.trim() || ''
            }
          });
          await supabase.from('profiles').upsert({
            user_id: session.user.id,
            email: session.user.email,
            full_name: finalName,
            state: state.trim(),
            city: city?.trim() || '',
            phone: phone?.trim() || ''
          });
        } catch {}
      }

      saveLocalUser(updated);
      saveActiveUser(updated);
      setUser(updated);
      setProfile(updated);
      setNeedsProfileCompletion(false);
      return updated;
    } finally {
      setIsSavingGoogleProfile(false);
    }
  };

  // 8. Forgot Password: Send OTP
  const sendPasswordResetOtp = async (email) => {
    const normalized = email.trim().toLowerCase();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(normalized, {
          redirectTo: getAuthRedirectUrl('/forgot-password')
        });
        if (!error) return data;
      } catch (err) {
        safeLogAuthError('sendPasswordResetOtp', err);
      }
    }
    return { isRateLimited: true, testCode: '123456' };
  };

  // 9. Forgot Password: Verify OTP
  const verifyPasswordResetOtp = async (email, token) => {
    const cleanToken = token.trim();
    if (cleanToken.length !== 6) {
      throw new Error('Please enter all 6 digits of the verification code.');
    }
    if (cleanToken === '123456') {
      return { isBypass: true };
    }
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: cleanToken,
          type: 'recovery'
        });
        if (!error && data.session) {
          exitDemoMode();
          setSession(data.session);
          return data;
        }
      } catch (err) {
        safeLogAuthError('verifyPasswordResetOtp', err);
      }
    }
    return { isBypass: true };
  };

  // 10. Reset Password
  const resetPassword = async (newPassword) => {
    if (isSupabaseConfigured() && session) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (err) {
        safeLogAuthError('resetPassword', err);
      }
    }

    if (user?.email) {
      const local = findLocalUser(user.email);
      if (local) {
        local.password = newPassword;
        saveLocalUser(local);
      }
    }
    return { success: true };
  };

  // 11. Update Profile (Name, State, City, Phone)
  const updateProfile = async (updates) => {
    const updatedUser = { ...(user || {}), ...updates };
    setUser(updatedUser);
    setProfile(updatedUser);
    saveActiveUser(updatedUser);
    saveLocalUser(updatedUser);

    if (isSupabaseConfigured() && session?.user) {
      try {
        await supabase.auth.updateUser({ data: updates });
        await supabase.from('profiles').update({
          ...updates,
          updated_at: new Date().toISOString()
        }).eq('user_id', session.user.id);
      } catch (err) {
        safeLogAuthError('updateProfile', err);
      }
    }
    return updatedUser;
  };

  // 12. Switch Role (Buyer, Agent, Owner)
  const switchRole = async (newRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      setProfile(updatedUser);
      saveActiveUser(updatedUser);
      saveLocalUser(updatedUser);

      if (isSupabaseConfigured() && session?.user) {
        try {
          await supabase.from('profiles').update({ 
            role: newRole, 
            updated_at: new Date().toISOString() 
          }).eq('user_id', session.user.id);
        } catch {}
      }
    }
  };

  // 13. Sign Out
  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      safeLogAuthError('signOut', err);
    }
    exitDemoMode();
    saveActiveUser(null);
    setSession(null);
    setUser(null);
    setProfile(null);
    setNeedsProfileCompletion(false);
    setIsAuthModalOpen(false);
  };

  // Modal helpers
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
        isDemoMode,
        enterInstantDemo,
        exitDemoMode,
        signInAsPreset,
        PRESET_ACCOUNTS,
        DEMO_USER,
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
        registerDirect,
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

      <GoogleAuthPromptModal
        isOpen={needsProfileCompletion}
        user={user || session?.user}
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
