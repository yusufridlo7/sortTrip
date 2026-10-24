import BrandLogo from './brand-logo';
import {tr,label as localize,locale,language} from './i18n';
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
        ? await supabase.auth.signUp({email, password, options: {emailRedirectTo: window.location.origin,data:{language:language()}}})
        : await supabase.auth.signInWithPassword({email, password});
      if (result.error) throw result.error;
      if (signup && !result.data.session) setMessage(tr('ui_0071'));
    } catch (e) {setMessage(e instanceof Error ? e.message : 'Belum berhasil. Coba kembali.');}
    finally {setBusy(false);}
  }
  return <form className="sorttrip-auth" onSubmit={submit}><BrandLogo tagline/>
    {!supabase && <p role="status">{localize(setupMessage)}</p>}
    <label>{tr('ui_0072')}<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>{tr('ui_0073')}<input required minLength={8} type="password" autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <p className="muted">{tr('ui_0074')}</p>
    {message && <p role="status">{localize(message)}</p>}
    <button className="primary wide" disabled={busy || !supabase}>{busy?tr('ui_0075'):signup?tr('ui_0076'):tr('ui_0077')}</button>
    <button type="button" className="text-action" disabled={busy} onClick={()=>{setSignup(!signup);setMessage('');}}>{signup?tr('ui_0078'):tr('ui_0079')}</button>
  </form>;
}
