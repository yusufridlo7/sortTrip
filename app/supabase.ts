import {createClient} from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key && /^https:\/\//.test(url)
  ? createClient(url, key) : null;
export const setupMessage = 'Koneksi database belum diatur. Ikuti PANDUAN_DATABASE.md dan jalankan ulang server.';
