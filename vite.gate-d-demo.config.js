import {defineConfig} from 'vite';
import {originalQAConfig} from './qa-config/original-ui.mjs';
// No inference proxy/secret loader: preparation backend stays closed.
const config=originalQAConfig({outDir:'dist-gate-d-demo',allowAuthentication:true,gateBAuthorization:'GATE_B_QA_AUTH'});
config.define['import.meta.env.VITE_GATE_D_DEMO']='"true"';
export default defineConfig(config);
