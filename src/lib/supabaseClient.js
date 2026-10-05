import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) || 
                     (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  CONFIG_MISSING: isDev
    ? 'Authentication configuration is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart the development server.'
    : 'Authentication configuration is missing.',
  GOOGLE_NOT_ENABLED: 'Google sign-in is not configured yet. Please try email and password.',
  GOOGLE_REDIRECT_INVALID: 'Google sign-in could not be completed. Please check the Google OAuth configuration.',
  GOOGLE_NETWORK_ERROR: 'Unable to connect to the sign-in service. Please check your internet connection.',
  NETWORK_FAILURE: 'Unable to connect to the authentication service. Please check your internet connection.',
  SERVICE_UNAVAILABLE: 'The authentication service is temporarily unavailable.',
  RATE_LIMITED: 'Too many attempts. Please wait and try again.',
  TOKEN_EXPIRED: 'Verification code expired. Please request a new OTP.',
  TOKEN_INVALID: 'Invalid verification code. Please check and try again.',
  USER_EXISTS: 'An account already exists with this email. Please sign in instead.',
  INVALID_EMAIL: 'Invalid email address. Please enter a valid email.',
  WEAK_PASSWORD: 'Password does not meet requirements (minimum 8 characters with uppercase, lowercase, and number).',
  STATE_REQUIRED: 'State is required. Indian State / UT selection is compulsory.',
  UNKNOWN: 'Something went wrong. Please try again.'
};

export const CONFIG_ERROR_MESSAGE = AUTH_MESSAGES.CONFIG_MISSING;

/**
 * Classifies Google OAuth specific errors
 * Returns null if user cancelled (so no scary error banner is displayed)
 */
export function classifyGoogleOAuthError(err) {
  if (!err) return null;
  safeLogAuthError('signInWithGoogle', err);

  const raw = typeof err === 'string' ? err : err.message || '';
  const message = raw.toLowerCase();

  // User cancelled - silent return, no scary banner
  if (
    message.includes('access_denied') || 
    message.includes('cancelled') || 
    message.includes('canceled') ||
    message.includes('user closed') ||
    message.includes('popup closed')
  ) {
    return null;
  }

  // Network failure
  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('networkerror') ||
    message.includes('connection refused') ||
    message.includes('load failed') ||
    (err?.name === 'TypeError' && message.includes('fetch'))
  ) {
    return AUTH_MESSAGES.GOOGLE_NETWORK_ERROR;
  }

  // Provider not enabled / configured
  if (
    message.includes('not configured') ||
    message.includes('not enabled') ||
    message.includes('unsupported provider') ||
    message.includes('provider is not enabled') ||
    message.includes('config_missing') ||
    message.includes('configuration is missing') ||
    message.includes('placeholder')
  ) {
    return AUTH_MESSAGES.GOOGLE_NOT_ENABLED;
  }

  // Redirect URI mismatch or OAuth config issue
  if (
    message.includes('redirect') ||
    message.includes('redirect_uri') ||
    message.includes('oauth') ||
    message.includes('unauthorized_client') ||
    message.includes('invalid_client')
  ) {
    return AUTH_MESSAGES.GOOGLE_REDIRECT_INVALID;
  }

  return AUTH_MESSAGES.GOOGLE_REDIRECT_INVALID;
}

/**
 * Safely logs operational authentication errors in development
 * NEVER logs passwords, OTP codes, or secret tokens.
 */
export function safeLogAuthError(operation, err) {
  if (isDev && typeof console !== 'undefined' && console.error) {
    const status = err?.status || err?.statusCode || (err?.code ? String(err.code) : undefined);
    const code = err?.code || err?.error_code;
    const message = err?.message || (typeof err === 'string' ? err : 'Unknown error');
    
    console.error(`[INDSTATE Auth - ${operation}]`, {
      operation,
      status,
      code,
      message
    });
  }
}

/**
 * Classifies auth errors into user-friendly messages
 */
export function classifyAuthError(err, operation = 'auth') {
  if (!err) return '';
  safeLogAuthError(operation, err);

  const raw = typeof err === 'string' ? err : err.message || '';
  const message = raw.toLowerCase();
  const status = Number(err?.status || err?.statusCode || 0);

  // 1. Supabase not configured
  if (
    message.includes('authentication configuration is missing') ||
    message.includes('supabase configuration is missing') || 
    message.includes('configuration is missing') ||
    message.includes('missing supabase') ||
    message.includes('config_missing') ||
    message.includes('placeholder')
  ) {
    return AUTH_MESSAGES.CONFIG_MISSING;
  }

  // 2. Invalid credentials (Exact text requested: "Invalid email or password.")
  if (
    message.includes('invalid login credentials') || 
    message.includes('invalid credentials') ||
    message.includes('invalid email or password') ||
    message.includes('invalid_grant') ||
    (status === 400 && message.includes('credentials'))
  ) {
    return AUTH_MESSAGES.INVALID_CREDENTIALS;
  }

  // 3. Network failure / connection lost
  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('networkerror') ||
    message.includes('connection refused') ||
    message.includes('load failed') ||
    (err?.name === 'TypeError' && message.includes('fetch'))
  ) {
    return AUTH_MESSAGES.NETWORK_FAILURE;
  }

  // 4. Rate limited
  if (
    status === 429 ||
    message.includes('over_email_send_rate_limit') ||
    message.includes('rate limit') ||
    message.includes('too many') ||
    message.includes('rate_limit')
  ) {
    return AUTH_MESSAGES.RATE_LIMITED;
  }

  // 5. Database / backend service unavailable (HTTP 500, 502, 503, 504)
  if (
    status >= 500 ||
    message.includes('service unavailable') ||
    message.includes('bad gateway') ||
    message.includes('gateway timeout') ||
    message.includes('database error') ||
    message.includes('server error')
  ) {
    return AUTH_MESSAGES.SERVICE_UNAVAILABLE;
  }

  // 6. Token / OTP expired
  if (message.includes('token has expired') || message.includes('otp expired') || message.includes('expired')) {
    return AUTH_MESSAGES.TOKEN_EXPIRED;
  }

  // 7. Token / OTP invalid
  if (message.includes('token is invalid') || message.includes('invalid token') || message.includes('bad code') || message.includes('otp invalid')) {
    return AUTH_MESSAGES.TOKEN_INVALID;
  }

  // 8. User already exists
  if (message.includes('user already registered') || message.includes('already exists') || message.includes('email exists')) {
    return AUTH_MESSAGES.USER_EXISTS;
  }

  // 9. Invalid email
  if (message.includes('email address') || message.includes('invalid email')) {
    return AUTH_MESSAGES.INVALID_EMAIL;
  }

  // 10. Password requirements
  if (message.includes('password should be') || message.includes('password does not meet')) {
    return AUTH_MESSAGES.WEAK_PASSWORD;
  }

  // 11. Clean friendly messages passed directly
  if (raw && !raw.includes('{') && raw.length < 120 && !message.includes('error:')) {
    return raw;
  }

  // 12. Fallback unknown error
  return AUTH_MESSAGES.UNKNOWN;
}

/**
 * Validates whether real Supabase credentials have been configured
 * Checks for non-empty and non-placeholder values
 */
export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  
  const cleanUrl = supabaseUrl.trim();
  const cleanKey = supabaseAnonKey.trim();

  if (cleanUrl === '' || cleanKey === '') return false;
  if (cleanUrl.includes('YOUR_PROJECT') || cleanUrl.includes('your-project') || cleanUrl.includes('YOUR_SUPABASE_PROJECT_URL')) return false;
  if (cleanKey.includes('YOUR_PUBLIC_ANON_KEY') || cleanKey.includes('your-anon-key') || cleanKey.includes('YOUR_SUPABASE_ANON_KEY')) return false;
  if (cleanUrl.includes('placeholder') || cleanKey.includes('placeholder')) return false;

  return cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
};

// Safe fallback URL for client initialization if environment variables are not yet populated
const activeUrl = isSupabaseConfigured() ? supabaseUrl.trim() : 'https://placeholder.supabase.co';
const activeKey = isSupabaseConfigured() ? supabaseAnonKey.trim() : 'placeholder-anon-key';

const customStorage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined;

function getSupabaseSingleton() {
  if (typeof window !== 'undefined') {
    if (!window.__INDSTATE_SUPABASE_CLIENT__) {
      window.__INDSTATE_SUPABASE_CLIENT__ = createClient(activeUrl, activeKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          ...(customStorage ? { storage: customStorage } : {})
        }
      });
    }
    return window.__INDSTATE_SUPABASE_CLIENT__;
  }
  return createClient(activeUrl, activeKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

// Single Supabase client instance across the application
export const supabase = getSupabaseSingleton();
