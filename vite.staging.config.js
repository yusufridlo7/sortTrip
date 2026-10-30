import {defineConfig} from 'vite';
import {originalQAConfig} from './qa-config/original-ui.mjs';
import {loadStagingGateAConfig} from './qa-config/gate-a.mjs';
// Original index.html -> main.jsx -> AuthApp -> TravelApp. No alternate shell.
// Remote identity/redirect/Access attestations must pass independently of local QA.
export default defineConfig(originalQAConfig({outDir:'dist-staging',environment:'staging',allowAuthentication:true,gateBAuthorization:'STAGING_OWNER_AUTH',gateSource:loadStagingGateAConfig()}));
