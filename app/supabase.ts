import {createClient} from '@supabase/supabase-js';
import {boundedFetch} from './bounded-fetch';
import {qaClientReady} from '../lib/qa-client-config.mjs';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const isolated=['qa-preparation','staging'].includes(import.meta.env.MODE);
const qaReady=!isolated||qaClientReady(url,key,import.meta.env.VITE_QA_AUTH_READY);
export const supabase = qaReady && url && key && /^https:\/\//.test(url)
  ? createClient(url, key,{global:{fetch:boundedFetch},...(isolated?{auth:{detectSessionInUrl:false,storageKey:'sorttrip-qa-gate-b-auth'}}:{})}) : null;
export const setupMessage = 'Koneksi database belum diatur. Ikuti PANDUAN_DATABASE.md dan jalankan ulang server.';
