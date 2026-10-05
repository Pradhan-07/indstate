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

const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) || 
              (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

export const CONFIG_ERROR_MESSAGE = isDev
  ? 'Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart the server.'
  : 'Service temporarily unavailable. Please try again later.';

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
