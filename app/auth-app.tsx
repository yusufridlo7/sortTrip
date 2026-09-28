import {useEffect, useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {supabase} from './supabase';
import TravelApp from './travel-app';
export default function AuthApp() {
  const [session, setSession] = useState<Session|null>(null);
  const [ready, setReady] = useState(!supabase);
  const [message, setMessage] = useState('');
  useEffect(()=>{
    if (!supabase) return;
    let alive = true;
    let eventReceived = false;
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, next)=>{
      eventReceived = true;
      if (alive) {setSession(next); setReady(true);}
    });
    supabase.auth.getSession().then(({data, error})=>{
      if (!alive || eventReceived) return;
      setSession(data.session); setReady(true);
      if (error) setMessage('Sesi tidak dapat dipulihkan. Silakan masuk kembali.');
    }).catch(()=>{if(alive){setReady(true);setMessage('Tidak dapat memuat sesi. Periksa koneksi.');}});
    return ()=>{alive=false; subscription.unsubscribe();};
  },[]);
  async function logout() {
    if (!supabase || !window.confirm('Keluar dari akun? Pastikan perubahan itinerary sudah disimpan.')) return;
    const {error} = await supabase.auth.signOut({scope:'local'});
    if (error) setMessage('Belum berhasil keluar. Periksa koneksi lalu coba kembali.');
  }
  if (!ready) return <main><p role="status">Memuat akun sortTrip…</p></main>;
  const email = session?.user.email || '';
  return <>{message && <p role="status">{message}</p>}<TravelApp key={session?.user.id || 'guest'} user={session?{id:session.user.id,name:email.split('@')[0] || 'Traveler', email}:null} onLogout={logout}/></>;
}
