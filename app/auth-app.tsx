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
  useEffect(()=>{if(!session||!supabase||session.user.user_metadata?.language===selectedLanguage)return;let timer=setTimeout(()=>{void supabase!.auth.updateUser({data:{language:selectedLanguage}}).catch(()=>{});},500);return()=>clearTimeout(timer);},[session?.user.id,selectedLanguage]);
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
  if (!ready) return <main><p role="status">{tr('ui_0070')}</p></main>;
  const email = session?.user.email || '';
  if(window.location.pathname==='/hotel-checkout')return <HotelCheckout key={session?.user.id||'guest'} signedIn={Boolean(session)}/>;
  return <>{message && <p role="status">{localize(message)}</p>}<TravelApp key={session?.user.id || 'guest'} user={session?{id:session.user.id,name:email.split('@')[0] || 'Traveler', email}:null} onLogout={logout}/></>;
}
