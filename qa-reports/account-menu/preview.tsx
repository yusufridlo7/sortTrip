// Isolated local QA: dummy identity and callbacks; no logout/account writes.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import AccountMenu from '../../app/account-menu';
import LanguageSwitcher from '../../app/i18n/language-switcher';
import {tr,useLanguage} from '../../app/i18n';
import '../../app/globals.css';
import '../../app/travel-refresh.css';
import '../../app/brand-theme.css';
function Preview(){useLanguage();const [action,setAction]=useState(''),[busy,setBusy]=useState(false);return <><header className="header"><strong>SortTrip · QA</strong><LanguageSwitcher/><AccountMenu user={{name:'Traveler',email:'traveler@example.com'}} busy={busy} onTrips={()=>setAction('trips')} onWatch={()=>setAction('watch')} onHelp={()=>setAction('help')} onLogout={()=>setAction('logout')}/></header><main><h1>Account menu QA</h1><p role="status">{action}</p><button onClick={()=>setBusy(x=>!x)}>Toggle busy</button></main></>};
createRoot(document.getElementById('root')!).render(<Preview/>);
