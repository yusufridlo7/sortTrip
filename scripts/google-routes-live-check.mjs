// Explicit owner QA only. One public route and one budgeted Google attempt.
// No user auth bypass: this is a provider/budget integration probe, not a
// simulated authenticated request to the application endpoint.
import {googleRouteLimits,validateGoogleRoute,safeGoogleRoutes} from '../worker/google-routes.js';
const env=process.env,emit=v=>console.info(JSON.stringify(v));
const index=process.argv.indexOf('--expected-attempts'),expected=index<0?0:Number(process.argv[index+1]);
if(!Number.isInteger(expected)||expected<0||expected>10)throw Error('INVALID_EXPECTED_ATTEMPTS');
if(env.GOOGLE_ROUTES_ENABLED!=='true'||!env.GOOGLE_MAPS_API_KEY||!env.SUPABASE_SERVICE_ROLE_KEY||!/^[0-9a-f-]{36}$/i.test(env.OWNER_USER_ID||'')){emit({code:'LIVE_QA_CONFIG_REQUIRED',googleRequests:0});process.exit(1);}
try{
 const database=new URL(env.SUPABASE_URL);if(database.protocol!=='https:'||!database.hostname.endsWith('.supabase.co')||database.username||database.password||database.search||database.hash||database.pathname!=='/')throw Error();
 const limits=googleRouteLimits(env),headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'};
 const month=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit'}).formatToParts(new Date());
 const monthStart=month.find(p=>p.type==='year').value+'-'+month.find(p=>p.type==='month').value+'-01';
 const before=await fetch(database.origin+'/rest/v1/google_routes_usage?scope=eq.global-month&select=requests&period_start=eq.'+monthStart+'&limit=1',{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!before.ok)throw Error();const prior=await before.json();
 // Do not stack a fresh Google call over an earlier app attempt during this QA.
 const attempts=prior[0]?.requests||0;emit({phase:'budget_before',monthAttempts:attempts,googleRequests:0});
 if(attempts!==expected){emit({code:'EXISTING_ATTEMPT_REQUIRES_REVIEW',googleRequests:0});process.exit(1);}
 const reservation=await fetch(database.origin+'/rest/v1/rpc/consume_google_route_budget',{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(10000),body:JSON.stringify({p_user:env.OWNER_USER_ID,p_daily:limits.daily,p_monthly:limits.monthly,p_user_daily:limits.userDaily})});
 if(!reservation.ok)throw Error();const budget=await reservation.json();
 if(budget.allowed!==true){emit({code:'GOOGLE_QA_BUDGET_BLOCKED',googleRequests:0});process.exit(1);}
 const body=validateGoogleRoute({from:'Travelodge Kuala Lumpur City Centre, Kuala Lumpur, Malaysia',to:'KLCC Park, Kuala Lumpur, Malaysia',mode:'TRANSIT',departureTime:new Date(Date.now()+86400000).toISOString().replace(/\.\d{3}Z$/,'Z'),language:'id'});
 const r=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','X-Goog-Api-Key':env.GOOGLE_MAPS_API_KEY,'X-Goog-FieldMask':'routes.duration,routes.distanceMeters,routes.legs.steps.travelMode,routes.legs.steps.navigationInstruction,routes.legs.steps.transitDetails,routes.travelAdvisory.transitFare'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 const raw=await r.text();if(raw.length>250000)throw Error();const data=JSON.parse(raw);
 if(!r.ok){const reasons=new Set(['API_KEY_INVALID','API_KEY_SERVICE_BLOCKED','API_KEY_HTTP_REFERRER_BLOCKED','API_KEY_IP_ADDRESS_BLOCKED','SERVICE_DISABLED','BILLING_DISABLED','RATE_LIMIT_EXCEEDED']);const info=data.error?.details?.find(d=>reasons.has(d.reason));const reason=info?.reason;const service=/^[a-z0-9.-]+\.googleapis\.com$/.test(info?.metadata?.service||'')?info.metadata.service:null;const consumer=String(info?.metadata?.consumer||'').match(/^projects\/(\d{6,20})$/);emit({service,consumerProjectNumber:consumer?.[1]||null,phase:'google',httpStatus:r.status,reason:reason||'PROVIDER_REJECTED',googleRequests:1,budgetReserved:true});process.exitCode=1;}
 else{const routes=safeGoogleRoutes(data,env.GOOGLE_MAPS_API_KEY);emit({phase:'google',httpStatus:r.status,routeCount:routes.length,transitSteps:routes.flatMap(r=>r.steps).filter(s=>s.mode==='TRANSIT').length,fareAvailable:routes.some(r=>r.fare!==null),remaining:budget.userDailyRemaining,googleRequests:1,budgetReserved:true,aiQuotaChanged:false,itineraryChanged:false});}
}catch{emit({code:'LIVE_QA_NETWORK_OR_RESPONSE_FAILED',automaticRetry:false});process.exitCode=1;}
