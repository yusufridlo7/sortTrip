// Read-only readiness check. Runtime configuration is never printed.
// NULL user makes the RPC reject before any counter reservation or Google call.
const emit=(code,ok=false)=>{console.info(JSON.stringify({code,ready:ok,localGoogleKeyConfigured:Boolean(process.env.GOOGLE_MAPS_API_KEY),localFeatureEnabled:process.env.GOOGLE_ROUTES_ENABLED==='true',googleRequests:0,countersChanged:false}));if(!ok)process.exitCode=1;};
const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!base||!key)emit('GOOGLE_BUDGET_CHECK_CONFIG_MISSING');
else {
 try {
  const url=new URL(base);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.username||url.password||url.search||url.hash)throw Error('invalid');
  const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  const table=await fetch(url.origin+'/rest/v1/google_routes_usage?select=requests&limit=0',{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!table.ok)emit('GOOGLE_BUDGET_TABLE_UNAVAILABLE');
  else {
   const rpc=await fetch(url.origin+'/rest/v1/rpc/consume_google_route_budget',{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(10000),body:JSON.stringify({p_user:null,p_daily:1000,p_monthly:9000,p_user_daily:5})});
   if(!rpc.ok)emit('GOOGLE_BUDGET_RPC_UNAVAILABLE');
   else {const result=await rpc.json();emit(result?.allowed===false?'GOOGLE_BUDGET_SCHEMA_REACHABLE':'GOOGLE_BUDGET_UNEXPECTED_RESPONSE',result?.allowed===false);}
  }
 }catch{emit('GOOGLE_BUDGET_NETWORK_UNAVAILABLE');}
}

if(process.argv.includes('--local-health')){await Promise.all([4173,8787].map(async port=>{try{const response=await fetch('http://127.0.0.1:'+port+'/api/health',{redirect:'error',signal:AbortSignal.timeout(3000)});console.info(JSON.stringify({phase:'local_health',port,httpStatus:response.status,googleRequests:0}));}catch{console.info(JSON.stringify({phase:'local_health',port,httpStatus:null,code:'LOCAL_HTTP_TIMEOUT_OR_UNAVAILABLE',googleRequests:0}));}}));}
