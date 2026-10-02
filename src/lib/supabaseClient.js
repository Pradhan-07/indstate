import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const CONFIG_ERROR_MESSAGE = 'Supabase configuration is missing. Add the required environment variables and restart the development server.';

/**
 * Validates whether real Supabase credentials have been configured
 * Checks for non-empty and non-placeholder values
 */
export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  
  const cleanUrl = supabaseUrl.trim();
  const cleanKey = supabaseAnonKey.trim();

  if (cleanUrl === '' || cleanKey === '') return false;
  if (cleanUrl.includes('YOUR_PROJECT') || cleanUrl.includes('your-project')) return false;
  if (cleanKey.includes('YOUR_PUBLIC_ANON_KEY') || cleanKey.includes('your-anon-key')) return false;
  if (cleanUrl.includes('placeholder') || cleanKey.includes('placeholder')) return false;

  return cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
};

// Safe fallback URL for client initialization if environment variables are not yet populated
const activeUrl = isSupabaseConfigured() ? supabaseUrl.trim() : 'https://placeholder.supabase.co';
const activeKey = isSupabaseConfigured() ? supabaseAnonKey.trim() : 'placeholder-anon-key';

// Single Supabase client instance across the application
export const supabase = createClient(activeUrl, activeKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});
