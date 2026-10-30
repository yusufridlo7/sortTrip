import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {originalQAConfig} from './qa-config/original-ui.mjs';
import {createGateC2Live} from './qa-config/gate-c2-live.mjs';
export default defineConfig(originalQAConfig({allowAuthentication:true,gateBAuthorization:'GATE_B_QA_AUTH',supplierFactory:config=>createGateC2Live(config,{directory:fileURLToPath(new URL('./.sorttrip-qa/gate-c2-2026-10-29',import.meta.url)),bindings:{TRAVELPAYOUTS_API_TOKEN:process.env.TRAVELPAYOUTS_API_TOKEN,LITEAPI_API_KEY:process.env.LITEAPI_API_KEY}})}));
