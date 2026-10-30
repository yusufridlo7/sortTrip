import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {qaClientReady,QA_SUPABASE_URL} from '../lib/qa-client-config.mjs';
export const QA_LOCAL_ORIGIN='http://127.0.0.1:5176';
export const QA_STAGING_ORIGIN='https://sorttrip-staging.yusufridlo7.workers.dev';
export const GATE_A_FILE=fileURLToPath(new URL('../.sorttrip-qa/public-connection.local.json',import.meta.url));
export const STAGING_GATE_A_FILE=fileURLToPath(new URL('../.sorttrip-qa/staging-connection.local.json',import.meta.url));
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keysOnly=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
export const publicKeyFingerprint=key=>createHash('sha256').update(key).digest('hex');
// Owner review is an attestation, not proof of dashboard state or JWT authentication.
export function evaluateGateA(config,{environment='local',allowAuthentication=false}={}){
 const blocked=reason=>({status:reason,eligible:false,authEnabled:false,publishableKey:'',supabaseURL:QA_SUPABASE_URL});
 if(!config)return blocked('CONFIG_MISSING');
 if(!['local','staging'].includes(environment)||!keysOnly(config,['version','targetOrigin','supabaseURL','publishableKey','owner','review']))return blocked('CONFIG_INVALID');
 const {owner,review}=config;
 if(!keysOnly(owner,['email','qaUserId'])||!keysOnly(review,['qaProjectVerified','publicKeyProjectVerified','publicKeySHA256','ownerIdentityVerified','redirectsVerified','siteURL','redirectURLs','noProductionResourcesVerified','accessVerified','accessIssuer','accessAudience','accessOwnerEmail','accessOwnerQAUserId','nextStepAuthorization']))return blocked('CONFIG_INVALID');
 const origin=environment==='local'?QA_LOCAL_ORIGIN:QA_STAGING_ORIGIN;
 if(config.version!==1||config.supabaseURL!==QA_SUPABASE_URL||config.targetOrigin!==origin)return blocked('PROJECT_OR_ORIGIN_REJECTED');
 if(!qaClientReady(config.supabaseURL,config.publishableKey,'true'))return blocked('PUBLIC_KEY_REJECTED');
 if(review.qaProjectVerified!==true||review.publicKeyProjectVerified!==true||review.publicKeySHA256!==publicKeyFingerprint(config.publishableKey))return blocked('OWNER_KEY_REVIEW_REQUIRED');
 if(!uuid.test(owner.qaUserId||'')||!/^\S+@\S+\.\S+$/.test(owner.email||'')||review.ownerIdentityVerified!==true)return blocked('OWNER_IDENTITY_REQUIRED');
 // Exact URL list, no wildcard/production/alternate-loopback redirect allowed.
 if(review.redirectsVerified!==true||review.siteURL!==origin+'/'||!Array.isArray(review.redirectURLs)||review.redirectURLs.length!==1||review.redirectURLs[0]!==origin+'/')return blocked('AUTH_REDIRECT_REVIEW_REQUIRED');
 if(review.noProductionResourcesVerified!==true)return blocked('RESOURCE_REVIEW_REQUIRED');
 if(environment==='staging'&&(review.accessVerified!==true||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(review.accessIssuer||'')||!/^[a-f0-9]{64}$/i.test(review.accessAudience||'')||review.accessOwnerEmail!==owner.email||review.accessOwnerQAUserId!==owner.qaUserId))return blocked('REMOTE_ACCESS_REVIEW_REQUIRED');
 if(review.nextStepAuthorization!=='GATE_B_QA_AUTH')return blocked('NEXT_STEP_APPROVAL_REQUIRED');
 return {status:allowAuthentication===true?'AUTH_ACTIVATION_AUTHORIZED':'READY_FOR_GATE_B_REVIEW',eligible:true,authEnabled:allowAuthentication===true,publishableKey:config.publishableKey,supabaseURL:QA_SUPABASE_URL};
}
// Fixed ignored owner-managed file only. Never reads .env or process credentials.
export function loadGateAConfig({read=()=>{
 if(!fs.existsSync(GATE_A_FILE))return null;
 const stat=fs.lstatSync(GATE_A_FILE);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>16384)throw Error();
 const real=fs.realpathSync(GATE_A_FILE),dir=path.dirname(GATE_A_FILE)+path.sep;
 if(!real.startsWith(dir))throw Error();return fs.readFileSync(GATE_A_FILE,'utf8');
}}={}){
 try{const raw=read();if(raw===null)return {config:null,status:'CONFIG_MISSING'};if(typeof raw!=='string'||Buffer.byteLength(raw)>16384)throw Error();return {config:JSON.parse(raw),status:'LOADED_FOR_VALIDATION'};}catch{return {config:null,status:'CONFIG_INVALID'};}
}
// Separate owner-reviewed remote configuration; never substitutes localhost.
export function loadStagingGateAConfig(){return loadGateAConfig({read:()=>{
 if(!fs.existsSync(STAGING_GATE_A_FILE))return null;
 const stat=fs.lstatSync(STAGING_GATE_A_FILE);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>16384)throw Error();
 const real=fs.realpathSync(STAGING_GATE_A_FILE),dir=path.dirname(STAGING_GATE_A_FILE)+path.sep;
 if(!real.startsWith(dir))throw Error();return fs.readFileSync(STAGING_GATE_A_FILE,'utf8');
}});}
