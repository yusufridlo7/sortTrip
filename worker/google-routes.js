const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const limit=(value,fallback,max)=>{const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=max?n:fallback;};
// Compute Routes Essentials free cap verified 2026-10-14. Other billing-account
// usage shares that cap; owner must lower this allowance when it exists.
export function googleRouteLimits(env){return {daily:limit(env.GOOGLE_ROUTES_DAILY_LIMIT,1000,1000),monthly:limit(env.GOOGLE_ROUTES_MONTHLY_LIMIT,9000,9000),userDaily:limit(env.GOOGLE_ROUTES_USER_DAILY_LIMIT,5,50)};}
export function validateGoogleRoute(input,now=Date.now()){
 const text=v=>typeof v==='string'&&v.trim().length>=2&&v.length<=180&&!/[\x00-\x1f]/.test(v)&&!/^https?:/i.test(v);
 if(!input||!text(input.from)||!text(input.to)||input.from.trim().toLowerCase()===input.to.trim().toLowerCase()||!['TRANSIT','WALK','DRIVE'].includes(input.mode))throw Error('INVALID');
 const body={origin:{address:input.from.trim()},destination:{address:input.to.trim()},travelMode:input.mode,computeAlternativeRoutes:input.mode!=='WALK',languageCode:input.language==='en'?'en':'id',units:'METRIC'};
 if(input.mode==='TRANSIT'){
  const d=Date.parse(input.departureTime);
  if(typeof input.departureTime!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(input.departureTime)||!Number.isFinite(d)||d<now-7*86400000||d>now+100*86400000)throw Error('DATE');
  body.departureTime=new Date(d).toISOString();body.transitPreferences={routingPreference:'FEWER_TRANSFERS'};
 }
 return body;
}
export function safeGoogleRoutes(data,key){
 const text=v=>typeof v==='string'&&!v.includes(key)&&v.length<240?v.replace(/[\x00-\x1f]/g,' '):'';
 return (Array.isArray(data.routes)?data.routes:[]).slice(0,4).flatMap(r=>{
  if(!/^\d+(?:\.\d+)?s$/.test(r.duration||'')||Number(r.duration.slice(0,-1))>604800||!Number.isFinite(r.distanceMeters)||r.distanceMeters<0||r.distanceMeters>20000000)return [];
  const fare=r.travelAdvisory?.transitFare;
  const knownFare=fare&&/^[A-Z]{3}$/.test(fare.currencyCode||'')&&/^\d+$/.test(String(fare.units))&&Number(fare.units)<1e9&&Number.isInteger(fare.nanos??0)&&(fare.nanos??0)>=0&&(fare.nanos??0)<1e9;
  return [{durationSeconds:Number(r.duration.slice(0,-1)),distanceMeters:r.distanceMeters,fare:knownFare?{currency:fare.currencyCode,amount:Number(fare.units)+(fare.nanos||0)/1e9}:null,steps:(r.legs||[]).flatMap(l=>l.steps||[]).slice(0,40).map(s=>({mode:['TRANSIT','WALK','DRIVE'].includes(s.travelMode)?s.travelMode:'',instruction:text(s.navigationInstruction?.instructions),line:text(s.transitDetails?.transitLine?.nameShort||s.transitDetails?.transitLine?.name),fromStop:text(s.transitDetails?.stopDetails?.departureStop?.name),toStop:text(s.transitDetails?.stopDetails?.arrivalStop?.name)}))}];
 });
}
export async function handleGoogleRoutes(request,env,fetcher=fetch){
 if(request.method!=='POST')return reply({error:'google_route_method'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'google_route_origin'},403);
 if(env.GOOGLE_ROUTES_ENABLED!=='true'||!env.GOOGLE_MAPS_API_KEY||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)return reply({error:'google_route_not_ready'},503);
 let databaseOrigin;try{const u=new URL(env.SUPABASE_URL);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error();databaseOrigin=u.origin;}catch{return reply({error:'google_route_budget_not_ready'},503);}
 const auth=request.headers.get('Authorization')||'';if(!/^Bearer [\w.-]+$/.test(auth))return reply({error:'google_route_login'},401);
 try{
  const raw=await request.text();if(raw.length>2000)return reply({error:'google_route_invalid'},400);
  let body;try{body=validateGoogleRoute(JSON.parse(raw));}catch(e){return reply({error:e.message==='DATE'?'google_route_date':'google_route_invalid'},400);}
  const userResponse=await fetcher(databaseOrigin+'/auth/v1/user',{redirect:'manual',headers:{Authorization:auth,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});
  if(!userResponse.ok)return reply({error:'google_route_login'},401);
  const user=await userResponse.json();if(!/^[0-9a-f-]{36}$/i.test(user.id||''))return reply({error:'google_route_login'},401);
  if(!env.AI_LIMITER||(await env.AI_LIMITER.limit({key:'google-route:'+user.id})).success!==true)return reply({error:'google_route_limit'},429);
  const limits=googleRouteLimits(env);
  const budgetResponse=await fetcher(databaseOrigin+'/rest/v1/rpc/consume_google_route_budget',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,apikey:env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_user:user.id,p_daily:limits.daily,p_monthly:limits.monthly,p_user_daily:limits.userDaily}),signal:AbortSignal.timeout(10000)});
  if(!budgetResponse.ok)return reply({error:'google_route_budget_not_ready'},503);
  const budget=await budgetResponse.json();if(budget.allowed!==true)return reply({error:'google_route_limit'},429);
  if(![['dailyRemaining',limits.daily],['monthlyRemaining',limits.monthly],['userDailyRemaining',limits.userDaily]].every(([key,max])=>Number.isInteger(budget[key])&&budget[key]>=0&&budget[key]<max))return reply({error:'google_route_budget_not_ready'},503);
  // Attempts count even on failure, since upstream may charge. No automatic retry.
  const response=await fetcher('https://routes.googleapis.com/directions/v2:computeRoutes',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json','X-Goog-Api-Key':env.GOOGLE_MAPS_API_KEY,'X-Goog-FieldMask':'routes.duration,routes.distanceMeters,routes.legs.steps.travelMode,routes.legs.steps.navigationInstruction,routes.legs.steps.transitDetails,routes.travelAdvisory.transitFare'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if(!response.ok)return reply({error:'google_route_unavailable'},502);
  const rawResponse=await response.text();if(rawResponse.length>250000)return reply({error:'google_route_unavailable'},502);
  const routes=safeGoogleRoutes(JSON.parse(rawResponse),env.GOOGLE_MAPS_API_KEY);
  return reply({provider:'Google Maps',routes,remaining:{daily:budget.dailyRemaining,monthly:budget.monthlyRemaining,userDaily:budget.userDailyRemaining},checkedAt:new Date().toISOString()});
 }catch{return reply({error:'google_route_unavailable'},502);}
}
