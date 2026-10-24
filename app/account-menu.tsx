import {useEffect,useState} from 'react';
import {DropdownMenu} from 'radix-ui';
import {UserRound,Bookmark,Ticket,TrendingDown,LifeBuoy,LogOut,ChevronDown} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {tr,locale,language} from './i18n';
import LanguageSwitcher from './i18n/language-switcher';
import {supabase} from './supabase';
import {boundedFetch} from './bounded-fetch';

type User={name:string;email:string};
type Pass={remaining:number;requestLimit:number;expiresAt:string;test?:boolean};

function AccountPass(){
 const [state,setState]=useState<{loading:boolean;error:boolean;pass:Pass|null}>({loading:true,error:false,pass:null});
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController();setState({loading:true,error:false,pass:null});
  async function load(){try{
   if(!supabase)throw Error('unavailable');
   const {data}=await supabase.auth.getSession();if(!data.session)throw Error('session');
   const r=await boundedFetch('/api/payments/access',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','X-SortTrip-Language':language(),Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({scope:'account'})});
   if(!r.ok)throw Error('access');const result=await r.json();
   if(!controller.signal.aborted)setState({loading:false,error:false,pass:result.pass});
  }catch{if(!controller.signal.aborted)setState({loading:false,error:true,pass:null});}}
  void load();return()=>controller.abort();
 },[attempt]);
 if(state.loading)return <p role="status">{tr('account_pass_loading')}</p>;
 if(state.error)return <div role="alert"><p>{tr('account_pass_error')}</p><button type="button" className="secondary" onClick={()=>setAttempt(x=>x+1)}>{tr('account_retry')}</button></div>;
 return <><div className="account-pass-summary"><strong>{tr(state.pass?'account_pass_active':'account_pass_none')}</strong>{state.pass&&<><span>{tr('account_pass_remaining',{count:state.pass.remaining})}</span><span>{tr('account_pass_expiry',{date:new Date(state.pass.expiresAt).toLocaleDateString(locale(),{day:'numeric',month:'long',year:'numeric'})})}</span>{state.pass.test&&<small>{tr('account_pass_test')}</small>}</>}</div><p className="muted">{tr('account_pass_manage')}</p></>;
}

export default function AccountMenu({user,busy=false,onTrips,onWatch,onHelp,onLogout}:{user:User;busy?:boolean;onTrips:()=>void;onWatch:()=>void;onHelp:()=>void;onLogout:()=>void}){
 const [dialog,setDialog]=useState<'profile'|'pass'|null>(null);
 return <><DropdownMenu.Root><DropdownMenu.Trigger className="account account-menu-trigger" aria-label={tr('ui_0573')} disabled={busy}><span className="avatar">{user.name.slice(0,1).toUpperCase()}</span><span className="account-full">{tr('ui_0573')}</span><ChevronDown size={14}/></DropdownMenu.Trigger>
  <DropdownMenu.Portal><DropdownMenu.Content className="account-dropdown" sideOffset={10} align="end" collisionPadding={12}>
   <DropdownMenu.Label className="account-menu-identity"><strong>{user.name}</strong><span>{user.email}</span></DropdownMenu.Label>
   <DropdownMenu.Separator className="account-menu-divider"/>
   <DropdownMenu.Item className="account-menu-item" onSelect={()=>setDialog('profile')}><UserRound size={17}/>{tr('account_profile')}</DropdownMenu.Item>
   <DropdownMenu.Item className="account-menu-item" onSelect={onTrips}><Bookmark size={17}/>{tr('ui_0572')}</DropdownMenu.Item>
   <DropdownMenu.Item className="account-menu-item" onSelect={()=>setDialog('pass')}><Ticket size={17}/>{tr('account_pass')}</DropdownMenu.Item>
   <DropdownMenu.Item className="account-menu-item" onSelect={onWatch}><TrendingDown size={17}/>{tr('ui_0576')}</DropdownMenu.Item>
   <DropdownMenu.Item className="account-menu-item" onSelect={onHelp}><LifeBuoy size={17}/>{tr('support_nav')}</DropdownMenu.Item>
   <DropdownMenu.Separator className="account-menu-divider"/>
   <DropdownMenu.Item className="account-menu-item account-menu-logout" onSelect={onLogout}><LogOut size={17}/>{tr('ui_0575')}</DropdownMenu.Item>
  </DropdownMenu.Content></DropdownMenu.Portal>
 </DropdownMenu.Root>
 <Dialog open={dialog!==null} onOpenChange={open=>!open&&setDialog(null)}><DialogContent className="account-dialog"><DialogTitle>{tr(dialog==='pass'?'account_pass':'account_profile')}</DialogTitle><DialogDescription>{tr(dialog==='pass'?'account_pass_description':'account_profile_description')}</DialogDescription>
  {dialog==='profile'?<><dl className="account-profile"><div><dt>{tr('account_name')}</dt><dd>{user.name}</dd></div><div><dt>{tr('ui_0072')}</dt><dd>{user.email}</dd></div><div><dt>{tr('account_currency')}</dt><dd>{tr('account_currency_idr')}</dd></div></dl><LanguageSwitcher/></>:dialog==='pass'?<AccountPass/>:null}
 </DialogContent></Dialog></>;
}
