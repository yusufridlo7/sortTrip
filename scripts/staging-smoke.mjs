import {STAGING_ORIGIN} from '../worker/staging-access.js';
// Negative smoke only. Does not authenticate, call Meta, reserve, Save or pay.
export async function lockedStagingSmoke(fetcher=fetch){
 const results=[];for(const path of ['/','/api/staging/identity','/api/assistant/discover','/api/payments/checkout']){
  const r=await fetcher(STAGING_ORIGIN+path,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(8000)});
  let denied=[401,403,503].includes(r.status);if([301,302,303].includes(r.status)){try{const target=new URL(r.headers.get('Location'));denied=target.protocol==='https:'&&/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(target.hostname);}catch{denied=false;}}await r.body?.cancel();if(!denied)throw Error('STAGING_NOT_LOCKED');results.push({path,http:r.status,denied});
 }return results;
}
if(process.argv.includes('--remote-approved')){try{console.log(JSON.stringify(await lockedStagingSmoke()));}catch{console.error('STAGING_SMOKE_FAILED');process.exitCode=1;}}
else if(process.argv[1]?.endsWith('staging-smoke.mjs'))console.log('NOT_RUN: deployment and explicit owner approval required before --remote-approved');
