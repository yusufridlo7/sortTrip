import {build} from 'esbuild';
// Local compilation only: no Wrangler execution, credential loading or deploy.
await build({entryPoints:['worker/staging.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'artifacts/staging-worker.mjs',external:['cloudflare:*','node:*','@cloudflare/playwright'],logLevel:'error'});
console.log('STAGING_WORKER_BUNDLE_OK: local compilation only');
