// Isolated status probe. Never return provider text, session identifiers or credentials.
import {limits,launch} from '@cloudflare/playwright';
export default {async fetch(request,env){
 try{
  const current=await limits(env.HOTEL_BROWSER);
  const safe={activeCount:Array.isArray(current.activeSessions)?current.activeSessions.length:null,maxConcurrentSessions:typeof current.maxConcurrentSessions==='number'?current.maxConcurrentSessions:null,allowedBrowserAcquisitions:typeof current.allowedBrowserAcquisitions==='number'?current.allowedBrowserAcquisitions:null,waitMs:typeof current.timeUntilNextAllowedBrowserAcquisition==='number'?current.timeUntilNextAllowedBrowserAcquisition:null};
  if(safe.allowedBrowserAcquisitions===0)return Response.json({...safe,launch:'RATE_OR_CONCURRENCY_LIMIT'});
  let browser;
  try{browser=await launch(env.HOTEL_BROWSER);return Response.json({...safe,launch:'AVAILABLE'});}
  catch(error){const text=String(error?.message||'');return Response.json({...safe,launch:/browser time limit exceeded for today|daily.*(?:time|limit)|time.*limit.*today/i.test(text)?'DAILY_BROWSER_TIME_LIMIT':/concurr|already.*browser/i.test(text)?'CONCURRENCY_LIMIT':/rate limit|too many requests/i.test(text)?'LAUNCH_RATE_LIMIT':/code:\s*429/.test(text)?'OTHER_LIMIT':'UNAVAILABLE'});}
  finally{await browser?.close().catch(()=>{});}
 }catch{return Response.json({launch:'LIMIT_STATUS_UNAVAILABLE'},{status:502});}
}};
