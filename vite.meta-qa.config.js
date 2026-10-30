import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
// Owner creates .env.meta-qa.local in this separate directory with ONLY the
// QA publishable key. Root .env files and production proxy are not inherited.
export default defineConfig({
 plugins:[react()],
 envDir:fileURLToPath(new URL('./qa-config/meta/',import.meta.url)),
 define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('https://aytrcvfncsklhqozreyk.supabase.co')},
 server:{host:'127.0.0.1',port:5174,strictPort:true,forwardConsole:false,proxy:{'/api':{target:'http://127.0.0.1:8790',changeOrigin:true,configure(proxy){proxy.on('proxyReq',(outgoing,incoming)=>{if(['127.0.0.1:5174','localhost:5174'].includes(incoming.headers.host)&&incoming.headers.origin==='http://'+incoming.headers.host)outgoing.setHeader('Origin','http://127.0.0.1:8790');});}}}},
 resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}}
});
