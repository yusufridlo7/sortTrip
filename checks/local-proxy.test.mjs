import {test} from 'node:test';
import assert from 'node:assert/strict';
import config from '../vite.config.js';

test('both dev and build preview forward API to the local Worker',()=>{
 for(const surface of [config.server,config.preview]){
  assert.equal(surface.proxy['/api'].target,'http://127.0.0.1:8787');
 }
});
test('proxy translates matching local frontend origins only, preserving foreign origins',()=>{
 for(const surface of [config.server,config.preview]){
  let callback;
  surface.proxy['/api'].configure({on(event,fn){assert.equal(event,'proxyReq');callback=fn;}});
  for(const port of [5173,4173]){
   const writes=[];
   callback({setHeader:(...args)=>writes.push(args)},{headers:{host:`127.0.0.1:${port}`,origin:`http://127.0.0.1:${port}`}});
   assert.deepEqual(writes,[['Origin','http://127.0.0.1:8787']]);
  }
  for(const headers of [{host:'127.0.0.1:4173',origin:'https://foreign.test'},{host:'foreign.test',origin:'http://foreign.test'},{host:'127.0.0.1:4173'},{host:'127.0.0.1:4173',origin:'http://127.0.0.1:5173'}]){
   callback({setHeader(){assert.fail('Foreign/missing/mismatched origin must not be translated');}},{headers});
  }
 }
});
