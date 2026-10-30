import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
// Only checks existence; never parses/prints the credential file. Wrangler's
// environment-specific file excludes .dev.vars; absent file must fail closed.
if(!existsSync(resolve(root,'.dev.vars.meta-qa'))){console.error('QA_PRIVATE_CONFIG_REQUIRED: owner must create .dev.vars.meta-qa privately. No server started.');process.exitCode=1;}
else{
 const child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config','wrangler.meta-qa.jsonc','--env','meta-qa','--local','--ip','127.0.0.1','--port','8790','--log-level','error'],{cwd:root,windowsHide:true,stdio:'inherit',env:{...process.env,CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:'false',CLOUDFLARE_INCLUDE_PROCESS_ENV:'false'}});
 child.on('exit',code=>{process.exitCode=code??1;});child.on('error',()=>{console.error('QA_START_FAILED');process.exitCode=1;});
}
