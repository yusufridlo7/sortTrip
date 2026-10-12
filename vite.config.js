import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
const apiProxy=()=>({'/api':{
 target:'http://127.0.0.1:8787',changeOrigin:true,
 configure(proxy){proxy.on('proxyReq',(outgoing,incoming)=>{
  // Translate only the trusted frontend origin. Foreign origins stay rejected by Worker.
  const frontendHost=incoming.headers.host;
  if(['127.0.0.1:5173','127.0.0.1:4173'].includes(frontendHost)&&incoming.headers.origin===`http://${frontendHost}`)outgoing.setHeader('Origin','http://127.0.0.1:8787');
 });}
}});
export default defineConfig({plugins:[react()],server:{forwardConsole:false,proxy:apiProxy()},preview:{proxy:apiProxy()},resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}}});
