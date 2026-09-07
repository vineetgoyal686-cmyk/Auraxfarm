import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If these are missing the app still runs in "local only" mode so you can
// develop the UI before Supabase is wired up. Every write is queued locally
// and will sync automatically the moment real keys are supplied and the
// app is reloaded.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null
