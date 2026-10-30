import {useState} from 'react';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {supabase} from './supabase';
import {tr} from './i18n';
import {fixtureData,QA_RLS_KIND,parseRlsReference,probeForeign,probeGuest,verifyOwn,type RlsReference,type RlsResult} from '../lib/qa-rls-probe.mjs';
const QA_URL='https://aytrcvfncsklhqozreyk.supabase.co';
function apiFor(client:SupabaseClient){
 const sanitize=(r:any)=>({rows:r.data||[],...(r.error?{code:['42501','PGRST301','PGRST302'].includes(r.error.code)?r.error.code:'REQUEST_FAILED'}:{})});
 return {
  read:async(id:string)=>sanitize(await client.from('trips').select('id,user_id,data').eq('id',id)),
  update:async(id:string,data:Record<string,unknown>)=>sanitize(await client.from('trips').update({data}).eq('id',id).select('id')),
  remove:async(id:string)=>sanitize(await client.from('trips').delete().eq('id',id).select('id')),
  insert:async(owner:string,data:Record<string,unknown>)=>sanitize(await client.from('trips').insert({user_id:owner,data}).select('id,user_id,data'))
 };
}
export default function MetaQARLS(){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[reference,setReference]=useState<RlsReference|null>(null),[foreign,setForeign]=useState(''),[results,setResults]=useState<RlsResult[]>([]),[problem,setProblem]=useState('');
 async function run(action:'create'|'foreign'|'verify'){
  if(busy)return;setBusy(true);setProblem('');setResults([]);
  try{
   if(import.meta.env.MODE!=='meta-qa'||import.meta.env.VITE_SUPABASE_URL!==QA_URL||!supabase)throw Error('QA_ONLY');
   const {data,error}=await supabase.auth.getUser();if(error||!data.user)throw Error('AUTH_REQUIRED');
   const ownId=data.user.id,api=apiFor(supabase);
   if(action==='create'){
    if(reference)throw Error('FIXTURE_EXISTS');
    const created=await api.insert(ownId,fixtureData(1));
    if(created.code||created.rows.length!==1||created.rows[0].user_id!==ownId)throw Error('CREATE_FAILED');
    const ref=parseRlsReference(JSON.stringify({kind:QA_RLS_KIND,fixtureId:created.rows[0].id,ownerId:ownId}));setReference(ref);
    // Confirm an actual owner UPDATE, then separately SELECT the stored value.
    const updated=await api.update(ref.fixtureId,fixtureData());
    const own=await verifyOwn(api,ownId,ref);
    const guest=createClient(QA_URL,import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'sorttrip-qa-rls-guest'}});
    try{
     const guestSession=await guest.auth.getSession();if(guestSession.data.session)throw Error('GUEST_NOT_ANONYMOUS');
     setResults([{test:'own_insert',passed:true,category:'OWN_ROW_CREATED'},{test:'own_update',passed:!updated.code&&updated.rows.length===1,category:!updated.code&&updated.rows.length===1?'ONE_ROW_UPDATED':'REQUEST_FAILED'},own,await probeGuest(apiFor(guest),ref)]);
    }finally{await guest.auth.stopAutoRefresh();}
   }else if(action==='foreign'){
    if(!reference)throw Error('REFERENCE_REQUIRED');
    const control=await verifyOwn(api,ownId,reference);if(!control.passed)throw Error('OWNER_CONTROL_FAILED');
    setResults([control,...await probeForeign(api,ownId,parseRlsReference(foreign))]);
   }
   else {if(!reference)throw Error('REFERENCE_REQUIRED');setResults([await verifyOwn(api,ownId,reference)]);}
  }catch(error){const code=error instanceof Error?error.message:'';setProblem(['AUTH_REQUIRED','DISTINCT_ACCOUNT_REQUIRED','INVALID_REFERENCE','CREATE_FAILED','REFERENCE_REQUIRED','FIXTURE_EXISTS','GUEST_NOT_ANONYMOUS'].includes(code)?code:'QA_FAILED');}
  finally{setBusy(false);}
 }
 return <><div className="search-information"><button type="button" className="secondary" onClick={()=>setOpen(true)}>{tr('qa_rls_title')}</button></div><Dialog open={open} onOpenChange={setOpen}><DialogContent className="meta-qa-dialog"><DialogTitle>{tr('qa_rls_title')}</DialogTitle><DialogDescription>{tr('qa_rls_description')}</DialogDescription><button type="button" className="secondary" disabled={busy||!!reference} onClick={()=>void run('create')}>{tr('qa_rls_create')}</button>{reference&&<><label>{tr('qa_rls_own_reference')}<textarea readOnly value={JSON.stringify(reference)} rows={4}/></label><button type="button" className="secondary" disabled={busy} onClick={()=>void run('verify')}>{tr('qa_rls_verify')}</button></>}<label>{tr('qa_rls_foreign_reference')}<textarea maxLength={500} rows={4} disabled={busy} value={foreign} onChange={event=>setForeign(event.target.value)}/></label><p>{tr('qa_rls_warning')}</p><button type="button" className="primary" disabled={busy||!foreign.trim()} onClick={()=>void run('foreign')}>{tr('qa_rls_probe')}</button>{busy&&<p role="status">{tr('video_processing')}</p>}{problem&&<p role="status">{tr('qa_rls_problem',{code:problem})}</p>}{!!results.length&&<pre aria-label={tr('qa_rls_results')}>{JSON.stringify(results,null,2)}</pre>}</DialogContent></Dialog></>;
}
