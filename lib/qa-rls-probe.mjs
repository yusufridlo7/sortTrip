// Disposable nonproduction fixtures only. No service role, auth secrets or logs.
export const QA_RLS_KIND='sorttrip-phase2c-rls-v1';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function fixtureData(revision=2){return {items:[],destination:'qa-rls-fixture',destinationMeta:{city:'QA RLS fixture',country:'QA',code:''},origin:'CGK',start:'2026-10-27',days:1,people:1,budget:0,estimateIncomplete:true,version:2,qaRlsProbe:QA_RLS_KIND,qaRlsRevision:revision};}
export function parseRlsReference(text){
 let ref;try{if(typeof text!=='string'||text.length>500)throw 0;ref=JSON.parse(text);}catch{throw Error('INVALID_REFERENCE');}
 if(!ref||Object.keys(ref).sort().join('|')!=='fixtureId|kind|ownerId'||ref.kind!==QA_RLS_KIND||!uuid(ref.fixtureId)||!uuid(ref.ownerId))throw Error('INVALID_REFERENCE');
 return {...ref,fixtureId:ref.fixtureId.toLowerCase(),ownerId:ref.ownerId.toLowerCase()};
}
// Result shape deliberately omits row content, IDs, email and backend messages.
// An expired/invalid JWT or network/schema failure is NOT proof that RLS works.
const denied=result=>result?.code==='42501';
const empty=result=>!result?.code&&Array.isArray(result?.rows)&&result.rows.length===0;
// jsonb can reorder object keys; object order is not a data change. Array order is.
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export async function probeForeign(api,ownId,reference){
 const ref=parseRlsReference(JSON.stringify(reference));
 if(!uuid(ownId)||ownId.toLowerCase()===ref.ownerId)throw Error('DISTINCT_ACCOUNT_REQUIRED');
 const results=[];
 for(const [test,perform] of [
  ['foreign_select',()=>api.read(ref.fixtureId)],
  ['foreign_update',()=>api.update(ref.fixtureId,fixtureData(999))],
  ['foreign_delete',()=>api.remove(ref.fixtureId)],
  ['foreign_owner_insert',()=>api.insert(ref.ownerId,fixtureData(999))]
 ]){
  const result=await perform();
  // INSERT must return a definite access denial, never an empty representation.
  const passed=denied(result)||(test!=='foreign_owner_insert'&&empty(result));
  results.push({test,passed,category:denied(result)?'ACCESS_DENIED':empty(result)?'ZERO_ROWS':result?.code?'REQUEST_FAILED':'UNEXPECTED_ACCESS'});
  if(!passed)break; // Stop immediately if access succeeds or network is uncertain.
 }
 return results;
}
export async function probeGuest(api,reference){
 const ref=parseRlsReference(JSON.stringify(reference));
 const result=await api.read(ref.fixtureId);
 return {test:'guest_select',passed:denied(result)||empty(result),category:denied(result)?'ACCESS_DENIED':empty(result)?'ZERO_ROWS':result?.code?'REQUEST_FAILED':'UNEXPECTED_ACCESS'};
}
export async function verifyOwn(api,ownId,reference){
 const ref=parseRlsReference(JSON.stringify(reference));
 if(!uuid(ownId)||ref.ownerId!==ownId.toLowerCase())throw Error('DISTINCT_ACCOUNT_REQUIRED');
 const result=await api.read(ref.fixtureId);
 const rows=result?.rows;
 const passed=Boolean(!result?.code&&Array.isArray(rows)&&rows.length===1&&rows[0].user_id===ownId&&JSON.stringify(canonical(rows[0].data))===JSON.stringify(canonical(fixtureData())));
 return {test:'own_fixture_unchanged',passed,category:passed?'OWN_ROW_INTACT':'OWN_ROW_MISSING_OR_CHANGED'};
}
