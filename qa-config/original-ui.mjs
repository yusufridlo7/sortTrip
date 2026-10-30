import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {searchLocations,destinationsFromText} from '../worker/location-search.js';
import {loadGateAConfig,evaluateGateA} from './gate-a.mjs';
import {localGateBSession} from './gate-b-session.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export const QA_URL='https://aytrcvfncsklhqozreyk.supabase.co';
// Only the explicit ignored Gate A public config is read; no root env inheritance.
export function originalQAConfig({outDir='dist-qa-preparation',port=5176,environment='local',allowAuthentication=false,gateBAuthorization='',gateSource=loadGateAConfig(),supplierFactory=null,assistantFactory=null}={}){
 const gateBApproved=environment==='local'&&port===5176&&gateBAuthorization==='GATE_B_QA_AUTH'&&allowAuthentication===true;
 const stagingApproved=environment==='staging'&&gateBAuthorization==='STAGING_OWNER_AUTH'&&allowAuthentication===true;
 const config=gateBApproved&&gateSource.config?{...gateSource.config,review:{...gateSource.config.review,nextStepAuthorization:'GATE_B_QA_AUTH'}}:gateSource.config;
 const gate=evaluateGateA(config,{environment,allowAuthentication:gateBApproved||stagingApproved});
 const status=gateSource.status==='CONFIG_INVALID'?'CONFIG_INVALID':gate.status;
 const supplier=gateBApproved&&gate.authEnabled&&supplierFactory?supplierFactory(config):null;
 const assistant=gateBApproved&&gate.authEnabled&&assistantFactory?assistantFactory(config):null;
 return {envDir:false,envPrefix:[],
  define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(QA_URL),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify(gate.eligible?gate.publishableKey:''),'import.meta.env.VITE_QA_AUTH_READY':JSON.stringify(String(gate.authEnabled)),'import.meta.env.VITE_QA_SUPPLIER_TEST':JSON.stringify(String(Boolean(supplier))),'import.meta.env.VITE_QA_SUPPLIER_PHASE':JSON.stringify(supplier?.phase||'C')},
  plugins:[react(),{name:'original-qa-preparation',
   transformIndexHtml:{order:'pre',handler:html=>html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi,(block,attributes)=>/type=["']module["']/i.test(attributes)?block:'').replaceAll('https://sorttrip.yusufridlo7.workers.dev','').replace('</head>',`<meta name="sorttrip-qa-project" content="${QA_URL}"><meta name="sorttrip-qa-auth-ready" content="${gate.authEnabled}"></head>`)},
   configureServer(server){server.httpServer?.once('close',()=>{void assistant?.close();});server.middlewares.use(async(req,res,next)=>{
    res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws://127.0.0.1:${port}${gate.authEnabled?' '+QA_URL:''}; font-src 'self' data:; frame-src 'none'; form-action 'self'`);
    const url=new URL(req.url||'/','http://127.0.0.1:'+port);
    if(!url.pathname.startsWith('/api/'))return next();
    const send=(body,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));};
    if(req.headers.origin&&req.headers.origin!=='http://127.0.0.1:'+port)return send({code:'ORIGIN_DENIED'},403);
    if(url.pathname==='/api/staging/identity'&&req.method==='GET')return send({environment:assistant?'qa-gate-d-local':gate.authEnabled?'qa-gate-b-local':'qa-preparation',supabaseURL:QA_URL,configurationStatus:status,ownerAccessVerified:false,authReady:gate.authEnabled,generationEnabled:Boolean(assistant),supplierReadsEnabled:supplier?.enabled()===true});
    if(url.pathname==='/api/staging/session'){
     const response=await localGateBSession({url:url.href,host:req.headers.host,origin:req.headers.origin,remoteAddress:req.socket.remoteAddress,authorization:req.headers.authorization,method:req.method},config,{enabled:gateBApproved&&gate.authEnabled});
     return send(await response.json(),response.status);
    }
    if(url.pathname==='/api/locations'&&req.method==='GET')return send({locations:searchLocations(url.searchParams.get('q')||'')});
    if(assistant&&['/api/assistant/access','/api/assistant/discover'].includes(url.pathname)){
     if(req.method!=='POST')return send({code:'METHOD_NOT_ALLOWED'},405);
     try{let bytes=0,body='';for await(const chunk of req){bytes+=Buffer.byteLength(chunk);if(bytes>8000)return send({code:'INVALID_INPUT'},400);body+=chunk;}
      const response=await assistant.handle(req,url,body);return send(await response.json(),response.status);
     }catch(error){return send({code:['META_AI_EXPIRED','META_AI_CUTOFF_INVALID'].includes(error?.code)?error.code:'QA_BACKEND_UNAVAILABLE'},503);}
    }
    if(supplier&&['/api/flights','/api/hotels/search'].includes(url.pathname)){
     try{let bytes=0,body='';for await(const chunk of req){bytes+=Buffer.byteLength(chunk);if(bytes>3000)return send({code:'INVALID_INPUT'},400);body+=chunk;}
      const response=await supplier.handle(new Request(url,{method:req.method,headers:req.headers}),body,{host:req.headers.host,remoteAddress:req.socket.remoteAddress});return send(await response.json(),response.status);
     }catch{return send({code:'GATE_C_UNAVAILABLE'},503);}
    }
    if(url.pathname==='/api/locations/resolve'&&req.method==='POST'){
     try{let bytes=0,text='';for await(const chunk of req){bytes+=Buffer.byteLength(chunk);if(bytes>8192)throw Error();text+=chunk;}const body=JSON.parse(text);return send({locations:destinationsFromText(body.text||body.prompt||'',body.origin||'CGK')});}catch{return send({code:'INVALID_INPUT'},400);}
    }
    return send({code:'QA_LIVE_UNAVAILABLE',error:'QA live access is not configured or authorized.',errorKey:'qa_preparation_notice'},503);
   });}}],
  resolve:{alias:{'@':root}},server:{host:'127.0.0.1',port,strictPort:true,forwardConsole:false,fs:{deny:['.env','.env.*','.dev.vars','.dev.vars.*','**/.dev.vars*','*.{crt,pem}','**/.git/**','**/.sorttrip-qa/**']}},build:{outDir,emptyOutDir:true}
 };
}
