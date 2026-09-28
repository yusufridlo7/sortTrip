import {useState} from 'react';
import {supabase, setupMessage} from './supabase';
export default function AuthPanel() {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) {setMessage(setupMessage); return;}
    setBusy(true); setMessage('');
    try {
      const result = signup
        ? await supabase.auth.signUp({email, password, options: {emailRedirectTo: window.location.origin}})
        : await supabase.auth.signInWithPassword({email, password});
      if (result.error) throw result.error;
      if (signup && !result.data.session) setMessage('Periksa email untuk konfirmasi akun. Setelah dikonfirmasi, masuk di halaman ini.');
    } catch (e) {setMessage(e instanceof Error ? e.message : 'Belum berhasil. Coba kembali.');}
    finally {setBusy(false);}
  }
  return <form className="sorttrip-auth" onSubmit={submit}>
    {!supabase && <p role="status">{setupMessage}</p>}
    <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Kata sandi<input required minLength={8} type="password" autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <p className="muted">Minimal 8 karakter. Gunakan kata sandi khusus untuk akun ini.</p>
    {message && <p role="status">{message}</p>}
    <button className="primary wide" disabled={busy || !supabase}>{busy?'Memproses…':signup?'Daftar akun':'Masuk'}</button>
    <button type="button" className="text-action" disabled={busy} onClick={()=>{setSignup(!signup);setMessage('');}}>{signup?'Sudah punya akun? Masuk':'Belum punya akun? Daftar'}</button>
  </form>;
}
