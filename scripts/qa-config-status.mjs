import {loadGateAConfig,evaluateGateA,publicKeyFingerprint} from '../qa-config/gate-a.mjs';
import {qaClientReady,QA_SUPABASE_URL} from '../lib/qa-client-config.mjs';
const loaded=loadGateAConfig();
if(process.argv.includes('--fingerprint')){
 if(!qaClientReady(loaded.config?.supabaseURL,loaded.config?.publishableKey,'true')){console.error('PUBLIC_KEY_UNAVAILABLE_OR_REJECTED');process.exitCode=1;}
 else console.log(publicKeyFingerprint(loaded.config.publishableKey)); // Owner-local digest, never the key.
}else{
 const state=evaluateGateA(loaded.config,{environment:process.argv.includes('--staging')?'staging':'local'});
 console.log(JSON.stringify({status:loaded.status==='CONFIG_INVALID'?'CONFIG_INVALID':state.status,qaProjectOnly:loaded.config?.supabaseURL===QA_SUPABASE_URL,publicBindingPresent:typeof loaded.config?.publishableKey==='string'&&loaded.config.publishableKey.length>0,eligibleForNextReview:state.eligible,authenticationEnabled:false,remoteAccessActuallyVerified:false}));
}
