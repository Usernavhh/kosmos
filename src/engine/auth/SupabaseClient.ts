import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[supabase] URL yoki anon key yo\'q. .env ni tekshiring.');
}

export const supabase = createClient(
  SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

console.log('[supabase] Client tayyor');