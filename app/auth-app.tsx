import BrandLogo from './brand-logo';
import {tr,label as localize,locale} from './i18n';
import {useEffect, useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {supabase} from './supabase';
import TravelApp from './travel-app';
import HotelCheckout from './hotel-checkout';
import i18next,{useLanguage,languageKey} from './i18n';
export default function AuthApp() {
  const selectedLanguage=useLanguage();
  const [session, setSession] = useState<Session|null>(null);
  const [ready, setReady] = useState(!supabase);
  const [message, setMessage] = useState('');
  const qaProfile=['qa-preparation','staging'].includes(import.meta.env.MODE);
  const [qaOwner,setQAOwner]=useState<string|null>(null);
  useEffect(()=>{if(!qaProfile||!session)return;const c=new AbortController();setQAOwner(null);
    void fetch('/api/staging/session',{method:'POST',headers:{Authorization:'Bearer '+session.access_token},signal:c.signal}).then(async r=>{const b=await r.json();if(!r.ok||b.ownerVerified!==true)throw Error();if(!c.signal.aborted)setQAOwner(session.user.id);}).catch(()=>{if(!c.signal.aborted)setMessage(tr('staging_owner_required'));});return()=>c.abort();
  },[qaProfile,session?.user.id,session?.access_token]);
  useEffect(()=>{if(qaProfile||!session||!supabase||session.user.user_metadata?.language===selectedLanguage)return;let timer=setTimeout(()=>{void supabase!.auth.updateUser({data:{language:selectedLanguage}}).catch(()=>{});},500);return()=>clearTimeout(timer);},[session?.user.id,selectedLanguage]);
  useEffect(()=>{
    if (!supabase) return;
    let alive = true;
    let eventReceived = false;
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, next)=>{
      eventReceived = true;
      try{if(!localStorage.getItem(languageKey)&&['id','en'].includes(next?.user.user_metadata?.language))void i18next.changeLanguage(next!.user.user_metadata.language);}catch{}
      if (alive) {setSession(next); setReady(true);}
    });
    supabase.auth.getSession().then(({data, error})=>{
      if (!alive || eventReceived) return;
      setSession(data.session); setReady(true);
      if (error) setMessage(tr('ui_0066'));
    }).catch(()=>{if(alive){setReady(true);setMessage(tr('ui_0067'));}});
    return ()=>{alive=false; subscription.unsubscribe();};
  },[]);
  async function logout() {
    if (!supabase || !window.confirm(tr('ui_0068'))) return;
    const {error} = await supabase.auth.signOut({scope:'local'});
    if (error) setMessage(tr('ui_0069'));
  }
  if (!ready) return <main className="brand-loading"><BrandLogo tagline/><p role="status">{tr('ui_0070')}</p></main>;
  const email = session?.user.email || '';
  if(qaProfile&&session&&qaOwner!==session.user.id)return <main><p role="alert">{message||tr('staging_verifying')}</p><button onClick={()=>void supabase?.auth.signOut({scope:'local'})}>{tr('ui_0575')}</button></main>;
  if(window.location.pathname==='/hotel-checkout')return <HotelCheckout key={session?.user.id||'guest'} signedIn={Boolean(session)}/>;
  return <>{qaProfile&&<p role="status" className="notice unified-owner-notice">{import.meta.env.VITE_GATE_D_LIVE==='true'?(selectedLanguage==='en'?'Gate D · owner-only local QA. One real Meta attempt. Supplier pricing, payments and bookings are disabled. Meta expires 5 November 2026, 00:00 WIB.':'Gate D · QA lokal khusus owner. Satu percobaan Meta nyata. Harga supplier, pembayaran dan booking dinonaktifkan. Meta berakhir 5 November 2026, 00.00 WIB.'):tr(import.meta.env.VITE_QA_SUPPLIER_TEST==='true'?(import.meta.env.VITE_QA_SUPPLIER_PHASE==='C2'?'qa_gate_c2_notice':'qa_gate_c_notice'):import.meta.env.VITE_QA_AUTH_READY==='true'?'qa_gate_b_notice':'qa_preparation_notice')}</p>}{message && <p role="status">{localize(message)}</p>}<TravelApp key={session?.user.id || 'guest'} user={session?{id:session.user.id,name:email.split('@')[0] || 'Traveler', email}:null} onLogout={logout}/></>;
}
