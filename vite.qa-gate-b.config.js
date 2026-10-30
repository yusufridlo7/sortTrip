import {defineConfig} from 'vite';
import {originalQAConfig} from './qa-config/original-ui.mjs';
// Owner authorized Gate B on 2026-10-29: local QA login + one disposable trip.
// No mutation of the private config or authorization of remote deployment/AI.
export default defineConfig(originalQAConfig({allowAuthentication:true,gateBAuthorization:'GATE_B_QA_AUTH'}));
