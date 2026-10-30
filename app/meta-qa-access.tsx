import {useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {supabase} from './supabase';
import {tr} from './i18n';
export default function MetaQAAccess(){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[diagnostic,setDiagnostic]=useState('');
 const [budgetResult,setBudgetResult]=useState<{key:string;values?:Record<string,string>;diagnostic?:string}|null>(null),[budgetAttempted,setBudgetAttempted]=useState(false);
 async function checkBudget(readOnly=false){
  if(busy||!readOnly&&budgetAttempted)return;setBusy(true);if(!readOnly)setBudgetAttempted(true);setBudgetResult(null);
  try{
   const session=await supabase?.auth.getSession();const token=session?.data.session?.access_token;
   if(!token){setBudgetResult({key:'video_error_AUTH_REQUIRED'});return;}
   const response=await fetch('/api/meta-qa/budget-probe',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({confirm:readOnly?'read-status':'allocate-005-no-refund'}),signal:AbortSignal.timeout(30000)}),data=await response.json();
   const stage=['qa-auth','budget-read','budget-reserve','budget-settle','budget-after'].includes(data.stage)?data.stage:'';
   const success=response.ok&&data.metaCalls===0&&(readOnly?data.readVerified===true:data.reserveVerified===true&&data.settleVerified===true);
   setBudgetResult(success?{key:readOnly?'meta_qa_budget_status':'meta_qa_budget_success',values:{allocated:Number(data.allocatedUSD).toFixed(2),remaining:Number(data.remainingUSD).toFixed(2),blocked:String(data.blocked)}}:{key:'meta_qa_budget_failed',diagnostic:' · HTTP '+response.status+(stage?' · '+stage:'')+(Number.isInteger(data.providerStatus)?' · upstream HTTP '+data.providerStatus:'')+(['DATABASE_PERMISSION_DENIED','SERVER_KEY_BROWSER_CONTEXT_DENIED','SERVER_AUTH_REJECTED'].includes(data.reason)?' · '+data.reason:'')});
  }catch{setBudgetResult({key:'meta_qa_budget_failed'});}finally{setBusy(false);}
 }
 async function check(){
  if(busy)return;setBusy(true);setMessage('');setDiagnostic('');
  try{
   const session=await supabase?.auth.getSession();const token=session?.data.session?.access_token;
   if(!token){setMessage('video_error_AUTH_REQUIRED');return;}
   const response=await fetch('/api/meta-qa/model-access',{method:'POST',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)}),data=await response.json();
   if(!response.ok){const code=['METHOD_NOT_ALLOWED','ORIGIN_DENIED','AUTH_REQUIRED','QA_CONFIG_REQUIRED','RATE_LIMITED','MODEL_ACCESS_REQUIRED','MODEL_UNAVAILABLE','MODEL_METADATA_FAILED','QA_ROUTE_UNAVAILABLE','QA_ISOLATION_REQUIRED'].includes(data.code)?data.code:'UNKNOWN';const stage=['qa-auth-request','qa-auth-response','qa-rate-limit','meta-metadata','meta-response'].includes(data.stage)?data.stage:'';const upstream=Number.isInteger(data.providerStatus)&&data.providerStatus>=100&&data.providerStatus<=599?data.providerStatus:null;setDiagnostic(code+' · HTTP '+response.status+(stage?' · '+stage:'')+(upstream?' · upstream HTTP '+upstream:''));}
   setMessage(response.ok&&data.metadataAccessible===true&&data.model==='muse-spark-1.3'&&data.inferencePerformed===false?'meta_qa_access_success':data.code==='AUTH_REQUIRED'?'video_error_AUTH_REQUIRED':data.code==='MODEL_ACCESS_REQUIRED'?'video_error_MODEL_ACCESS_REQUIRED':data.code==='RATE_LIMITED'?'video_error_RATE_LIMITED':'meta_qa_access_failed');
  }catch{setMessage('meta_qa_access_failed');}finally{setBusy(false);}
 }
 return <><div className="search-information"><button type="button" className="secondary" onClick={()=>setOpen(true)}>{tr('meta_qa_access_title')}</button></div><Dialog open={open} onOpenChange={setOpen}><DialogContent className="meta-qa-dialog"><DialogTitle>{tr('meta_qa_access_title')}</DialogTitle><DialogDescription>{tr('meta_qa_access_description')}</DialogDescription><button type="button" className="primary" disabled={busy} onClick={()=>void check()}>{tr(busy?'video_processing':'meta_qa_access_check')}</button>{message&&<p role="status">{tr(message)}{diagnostic&&<small style={{display:'block'}}>{diagnostic}</small>}</p>}<p>{tr('meta_qa_budget_description')}</p><button type="button" className="secondary" disabled={busy||budgetAttempted} onClick={()=>void checkBudget()}>{tr('meta_qa_budget_check')}</button><button type="button" className="secondary" disabled={busy} onClick={()=>void checkBudget(true)}>{tr('meta_qa_budget_read')}</button>{budgetResult&&<p role="status">{tr(budgetResult.key,budgetResult.values)}{budgetResult.diagnostic}</p>}</DialogContent></Dialog></>;
}
