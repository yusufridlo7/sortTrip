// Read-only schema/configuration readiness. No supplier/payment requests.
import {checkoutMode} from '../worker/hotel-checkout.js';
const output=(code,ready=false)=>{console.info(JSON.stringify({code,schemaReady:ready,checkoutMode:checkoutMode(process.env),ownerTestConfigured:/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(process.env.OWNER_USER_ID||''),supplierRequests:0,bookingRequests:0}));if(!ready)process.exitCode=1;};
const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!base||!key)output('HOTEL_CHECKOUT_CHECK_CONFIG_MISSING');
else try{
 const url=new URL(base);
 if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.username||url.password||url.search||url.hash)throw Error();
 const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 const table=await fetch(url.origin+'/rest/v1/hotel_checkouts?select=id&limit=0',{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!table.ok)output('HOTEL_CHECKOUT_TABLE_UNAVAILABLE');
 else{
  // NULL identity can never match a primary key or reserve an attempt.
  const rpc=await fetch(url.origin+'/rest/v1/rpc/claim_hotel_checkout',{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(10000),body:JSON.stringify({p_id:null,p_user:null,p_environment:'sandbox',p_from:'selected',p_to:'prebooking'})});
  if(!rpc.ok)output('HOTEL_CHECKOUT_RPC_UNAVAILABLE');
  else{const data=await rpc.json();const empty=Array.isArray(data)&&data.length===0;output(empty?'HOTEL_CHECKOUT_SCHEMA_REACHABLE':'HOTEL_CHECKOUT_UNEXPECTED_RESPONSE',empty);
   const at=process.argv.indexOf('--status'),id=process.argv[at+1];
   if(empty&&at>=0&&/^[0-9a-f-]{36}$/i.test(id||'')&&/^[0-9a-f-]{36}$/i.test(process.env.OWNER_USER_ID||'')){
    const query=new URLSearchParams({id:'eq.'+id,user_id:'eq.'+process.env.OWNER_USER_ID,select:'state,expires_at,prebookFailure:summary->>prebookFailure,supplierStatus:summary->>supplierStatus'});
    const result=await fetch(url.origin+'/rest/v1/hotel_checkouts?'+query,{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
    if(result.ok){const rows=await result.json();console.info(JSON.stringify({phase:'owner_checkout_status',found:rows.length===1,state:rows[0]?.state||null,prebookFailure:['selection_decode','supplier_request','room_price_validation','payable_total_validation'].includes(rows[0]?.prebookFailure)?rows[0].prebookFailure:null,expired:rows[0]?Date.parse(rows[0].expires_at)<=Date.now():null,supplierStatus:Number.isInteger(Number(rows[0]?.supplierStatus))&&Number(rows[0]?.supplierStatus)>=300&&Number(rows[0]?.supplierStatus)<=599?Number(rows[0].supplierStatus):null,recordsChanged:false}));}
   }
  }
 }
}catch{output('HOTEL_CHECKOUT_NETWORK_UNAVAILABLE');}
