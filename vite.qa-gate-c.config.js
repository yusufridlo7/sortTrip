import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {originalQAConfig} from './qa-config/original-ui.mjs';
import {createGateCLive} from './qa-config/gate-c-live.mjs';
// Explicit owner Gate C authorization 29Oct2026. Server-only selected bindings;
// envDir/envPrefix stay disabled and no credential enters client define/bundle.
export default defineConfig(originalQAConfig({allowAuthentication:true,gateBAuthorization:'GATE_B_QA_AUTH',supplierFactory:config=>createGateCLive(config,{directory:fileURLToPath(new URL('./.sorttrip-qa/gate-c-2026-10-29',import.meta.url)),bindings:{TRAVELPAYOUTS_API_TOKEN:process.env.TRAVELPAYOUTS_API_TOKEN,LITEAPI_API_KEY:process.env.LITEAPI_API_KEY}})}));
