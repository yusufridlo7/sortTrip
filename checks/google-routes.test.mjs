import {test} from 'node:test';
import assert from 'node:assert/strict';
import {googleRouteLimits,validateGoogleRoute,safeGoogleRoutes,handleGoogleRoutes} from '../worker/google-routes.js';
const user='00000000-0000-4000-8000-000000000001';
const env={GOOGLE_ROUTES_ENABLED:'true',GOOGLE_MAPS_API_KEY:'fixture-secret',SUPABASE_URL:'https://db.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',AI_LIMITER:{limit:async()=>({success:true})}};
const query={from:'KLCC Kuala Lumpur',to:'Pasar Seni Kuala Lumpur',mode:'TRANSIT',departureTime:new Date(Date.now()+86400000).toISOString().replace(/\.\d{3}Z$/,'Z')};
const request=(q=query)=>new Request('https://sorttrip.test/api/routes/google',{method:'POST',headers:{Origin:'https://sorttrip.test',Authorization:'Bearer fixture'},body:JSON.stringify(q)});
test('controlled route defaults, strict date/mode boundaries and no uncontrolled fields',()=>{
 assert.deepEqual(googleRouteLimits({}),{daily:1000,monthly:9000,userDaily:5});assert.deepEqual(googleRouteLimits({GOOGLE_ROUTES_DAILY_LIMIT:100000,GOOGLE_ROUTES_MONTHLY_LIMIT:-1,GOOGLE_ROUTES_USER_DAILY_LIMIT:'bad'}),{daily:1000,monthly:9000,userDaily:5});
 assert.equal(googleRouteLimits({GOOGLE_ROUTES_MONTHLY_LIMIT:10001}).monthly,9000);
 assert.equal(googleRouteLimits({GOOGLE_ROUTES_MONTHLY_LIMIT:10000}).monthly,9000);
 assert.equal(googleRouteLimits({GOOGLE_ROUTES_MONTHLY_LIMIT:9001}).monthly,9000);
 assert.equal(googleRouteLimits({GOOGLE_ROUTES_MONTHLY_LIMIT:9000}).monthly,9000);
 assert.equal(validateGoogleRoute(query).travelMode,'TRANSIT');assert.equal(validateGoogleRoute({...query,mode:'DRIVE',key:'malicious'}).key,undefined);
 const drive={...query,mode:'DRIVE'};
 assert.deepEqual(validateGoogleRoute({...drive,routingPreference:'TRAFFIC_AWARE_OPTIMAL',optimizeWaypointOrder:true,intermediates:Array(25).fill({address:'Extra stop'}),extraComputations:['TOLLS','TRAFFIC_ON_POLYLINE'],routeModifiers:{vehicleInfo:{emissionType:'DIESEL'}}}),validateGoogleRoute(drive));
 for(const invalid of [{...query,mode:'FLIGHT'},{...query,to:query.from},{...query,departureTime:'2020-01-01T00:00:00Z'},{...query,from:'https://evil.test'}])assert.throws(()=>validateGoogleRoute(invalid));
});
test('route response contains bounded facts and no raw errors, identifiers, polylines or secret echoes',()=>{
 const result=safeGoogleRoutes({routes:[{duration:'120s',distanceMeters:300,polyline:{encodedPolyline:'private'},legs:[{steps:[{travelMode:'TRANSIT',navigationInstruction:{instructions:'fixture-secret'},transitDetails:{transitLine:{nameShort:'MRT'}}}]}]}]},env.GOOGLE_MAPS_API_KEY);
 assert.equal(result[0].fare,null);assert.equal(result[0].durationSeconds,120);assert.equal(result[0].steps[0].instruction,'');assert.equal(result[0].polyline,undefined);
 assert.deepEqual(safeGoogleRoutes({routes:[{duration:'invalid',distanceMeters:1}]},'fixture'),[]);
});
test('unconfigured/unauthenticated/foreign/invalid routes cause no billable upstream request',async()=>{
 const fail=async()=>{throw Error('Unexpected provider request');};
 assert.equal((await handleGoogleRoutes(request(),{},fail)).status,503);
 assert.equal((await handleGoogleRoutes(new Request('https://sorttrip.test/api/routes/google',{method:'POST',body:JSON.stringify(query)}),env,fail)).status,401);
 assert.equal((await handleGoogleRoutes(new Request('https://sorttrip.test/api/routes/google',{method:'POST',headers:{Origin:'https://other.test'},body:JSON.stringify(query)}),env,fail)).status,403);
 assert.equal((await handleGoogleRoutes(request({...query,mode:'INVALID'}),env,fail)).status,400);
});
test('budget missing/exhausted blocks Google; reservation precedes one billable call and never touches AI result quota',async()=>{
 for(const budgetStatus of ['missing','full','allowed','upstream-fail']){
  const calls=[];
  const fetcher=async(url,options)=>{
   calls.push(String(url));
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:user});
   if(String(url).includes('consume_google_route_budget')){assert.equal(JSON.parse(options.body).p_daily,1000);assert.equal(JSON.parse(options.body).p_monthly,9000);return budgetStatus==='missing'?new Response('',{status:404}):Response.json({allowed:budgetStatus!=='full',dailyRemaining:999,monthlyRemaining:8999,userDailyRemaining:4});}
   assert.equal(String(url),'https://routes.googleapis.com/directions/v2:computeRoutes');assert.equal(options.headers['X-Goog-Api-Key'],env.GOOGLE_MAPS_API_KEY);assert.equal(options.redirect,'manual');return budgetStatus==='upstream-fail'?Response.json({error:{message:'fixture-secret'}},{status:403}):Response.json({routes:[{duration:'600s',distanceMeters:2000,legs:[],travelAdvisory:{transitFare:{currencyCode:'MYR',units:'3',nanos:500000000}}}]});
  };
  const response=await handleGoogleRoutes(request(),env,fetcher);assert.equal(response.status,budgetStatus==='missing'?503:budgetStatus==='full'?429:budgetStatus==='upstream-fail'?502:200);
  const body=await response.json();assert.ok(!JSON.stringify(body).includes('fixture-secret'));assert.ok(!calls.some(u=>u.includes('reserve_ai_request')));assert.equal(calls.filter(u=>u.includes('googleapis')).length,['allowed','upstream-fail'].includes(budgetStatus)?1:0);
  if(budgetStatus==='allowed'){assert.equal(body.routes[0].fare.amount,3.5);assert.equal(body.remaining.monthly,8999);}
 }
});

test('database origin normalizes trailing slash and invalid budget responses cannot reach Google',async()=>{for(const validBudget of [true,false]){const urls=[];const r=await handleGoogleRoutes(request(),{...env,SUPABASE_URL:'https://db.test/'},async(u,o)=>{urls.push(String(u));assert.equal(o.redirect,'manual');if(String(u).endsWith('/auth/v1/user'))return Response.json({id:user});if(String(u).includes('/rpc/'))return Response.json(validBudget?{allowed:true,dailyRemaining:999,monthlyRemaining:8999,userDailyRemaining:4}:{allowed:true});return Response.json({routes:[]});});assert.equal(r.status,validBudget?200:503);assert.ok(urls.every(u=>!new URL(u).pathname.includes('//')));assert.equal(urls.filter(u=>u.includes('googleapis')).length,validBudget?1:0);}});


test('transit accepts the exact millisecond timestamp emitted by browser Date.toISOString',()=>{
 const now=Date.parse('2026-10-24T10:00:00Z');
 const timestamp=new Date(now+86400000).toISOString();
 assert.equal(validateGoogleRoute({...query,departureTime:timestamp},now).departureTime,timestamp);
 for(const invalid of ['2026-10-25T10:00:00.abcZ','2026-10-25T10:00:00','2027-10-25T10:00:00.000Z'])assert.throws(()=>validateGoogleRoute({...query,departureTime:invalid},now));
});
