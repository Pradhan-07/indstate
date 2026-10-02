// Re-export from canonical client at src/lib/supabaseClient.js to maintain a single Supabase instance
export { 
  supabase, 
  isSupabaseConfigured, 
  CONFIG_ERROR_MESSAGE 
} from '../lib/supabaseClient';
