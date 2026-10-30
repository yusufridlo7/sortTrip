import {defineConfig} from 'vite';
import {originalQAConfig} from './qa-config/original-ui.mjs';
import {gateDLive} from './qa-config/gate-d-live.mjs';
const config=originalQAConfig({outDir:'dist-gate-d-demo',allowAuthentication:true,gateBAuthorization:'GATE_B_QA_AUTH',assistantFactory:gateDLive});
config.define['import.meta.env.VITE_GATE_D_DEMO']='"true"';
config.define['import.meta.env.VITE_GATE_D_LIVE']='"true"';
export default defineConfig(config);
