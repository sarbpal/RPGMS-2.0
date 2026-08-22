import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variable extraction with safe fallback for testing / development
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://placeholder-rpgms.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'placeholder-anon-key';

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Returns the singleton instance of the Supabase client.
 * Infrastructure layer adapter for Supabase PostgreSQL persistence.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!cachedClient) {
    cachedClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedClient;
}

export const supabaseClient = getSupabaseClient();
