import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {collectHotelObservations,validateRequest} from './service.mjs';

export function createHotelServer({token='',localOnly=true,collect=collectHotelObservations,launch}={}){
 if(!localOnly&&(!token||token.length<32))throw Error('SERVICE_AUTH_REQUIRED');
 let active=false;
 const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 return http.createServer(async(req,res)=>{
  const address=req.socket.remoteAddress;
  if(localOnly&&!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address))return reply(res,403,{code:'FORBIDDEN'});
  const host=req.headers.host||'';
  // Prevent browser-origin calls and DNS rebinding to the unauthenticated local service.
  if(localOnly&&!/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host))return reply(res,403,{code:'FORBIDDEN'});
  if(req.headers.origin||req.headers['sec-fetch-site'])return reply(res,403,{code:'FORBIDDEN'});
  if(!localOnly){
   const supplied=Buffer.from(req.headers.authorization||''),expected=Buffer.from('Bearer '+token);
   if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return reply(res,401,{code:'UNAUTHORIZED'});
  }
  if(req.method==='GET'&&req.url==='/health')return reply(res,200,{ok:true,provider:'local-chromium',active});
  if(req.method!=='POST'||req.url!=='/v1/hotel-prices')return reply(res,404,{code:'NOT_FOUND'});
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(res,415,{code:'JSON_REQUIRED'});
  if(active)return reply(res,429,{code:'SERVICE_BUSY'});
  // Reserve before body read: a slow client cannot accumulate concurrent browser jobs.
  active=true;
  try{
   let body='',bytes=0;
   for await(const chunk of req){bytes+=chunk.length;if(bytes>12000){reply(res,413,{code:'REQUEST_TOO_LARGE'});return;}body+=chunk.toString('utf8');}
   let input;try{input=validateRequest(JSON.parse(body));}catch{return reply(res,400,{code:'INVALID_REQUEST'});}
   const result=await collect(input,launch);
   reply(res,200,result);
  }catch{reply(res,502,{code:'BROWSER_UNAVAILABLE'});}
  finally{active=false;}
 });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {chromium}=await import('playwright');
 const localOnly=process.env.HOTEL_SERVICE_PUBLIC!=='true';
 const server=createHotelServer({localOnly,token:process.env.HOTEL_PRICE_SERVICE_TOKEN||'',launch:()=>chromium.launch({headless:true})});
 server.requestTimeout=15000;server.headersTimeout=10000;
 const port=Number(process.env.HOTEL_SERVICE_PORT||8794);
 server.listen(port,localOnly?'127.0.0.1':'0.0.0.0',()=>console.info(localOnly?'HOTEL_SERVICE_LOCAL_READY':'HOTEL_SERVICE_READY'));
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
