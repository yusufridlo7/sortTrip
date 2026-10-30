import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),file=root+'.dev.vars.gate-c';
let valid=false;try{const s=fs.lstatSync(file);valid=s.isFile()&&!s.isSymbolicLink()&&s.size<16384;}catch{}
if(!valid){console.error('GATE_C_PRIVATE_BINDING_REQUIRED');process.exitCode=1;}
else{
 const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
 const child=spawn(process.execPath,['--env-file='+file,root+'node_modules/vite/bin/vite.js','--config',process.argv[2]==='--c2'?'vite.qa-gate-c2.config.js':'vite.qa-gate-c.config.js','--mode','qa-preparation'],{cwd:root,env,stdio:['inherit','pipe','pipe'],windowsHide:true});
 child.stdout.on('data',()=>{});child.stderr.on('data',()=>{}); // Vite/parser exceptions never print private configuration.
 child.on('spawn',()=>console.log('GATE_C_LOCAL_STARTING: http://127.0.0.1:5176/ (check safe identity endpoint)'));
 child.on('error',()=>console.error('GATE_C_LOCAL_START_FAILED'));
 child.on('exit',code=>{console.log('GATE_C_LOCAL_STOPPED');process.exitCode=code??1;});
 process.on('SIGINT',()=>child.kill('SIGINT'));
}
