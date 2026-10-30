import test from 'node:test';
import assert from 'node:assert/strict';
import {kingstoneMetadata,KINGSTONE_QUERY} from '../qa-config/gate-c-metadata.mjs';
test('fixed Kingstone metadata query, claim before network, whitelist response',async()=>{
 const events=[];const result=await kingstoneMetadata({key:'fixture-key-not-real',budget:{claim(v){events.push(v);}},fetcher:async(u,i)=>{events.push('fetch');assert.equal(u,KINGSTONE_QUERY);assert.equal(i.redirect,'manual');assert.equal(i.method,'GET');assert.equal(i.headers['X-API-Key'],'fixture-key-not-real');return Response.json({data:[{id:'hotel-public',name:'Kingstone Hotel',city:'Kuala Lumpur',country:'MY',address:'public',secret:'must not survive'}]});}});
 assert.deepEqual(events,['hotel-metadata','fetch']);assert.equal(result.upstreamRequests,1);assert.equal(result.http,200);assert.equal(result.hotels[0].id,'hotel-public');assert.equal(JSON.stringify(result).includes('must not survive'),false);
});
test('empty metadata remains empty, no discovery fallback',async()=>{
 let calls=0;const r=await kingstoneMetadata({key:'fixture-key',budget:{claim(){}},fetcher:async()=>{calls++;return Response.json({data:[]});}});assert.equal(r.status,'EMPTY');assert.equal(calls,1);
});
test('used reservation and missing binding prevent network',async()=>{
 let calls=0;const fetcher=async()=>{calls++;};
 assert.equal((await kingstoneMetadata({key:'fixture-key',budget:{claim(){throw Error();}},fetcher})).upstreamRequests,0);
 assert.equal((await kingstoneMetadata({key:'',budget:{claim(){assert.fail();}},fetcher})).upstreamRequests,0);assert.equal(calls,0);
});
test('HTTP error, redirect and transport failure count once; never expose upstream error',async()=>{
 for(const fetcher of [async()=>new Response('private upstream',{status:401}),async()=>new Response(null,{status:302,headers:{Location:'https://evil.invalid'}}),async()=>{throw Error('private upstream');}]){
  const r=await kingstoneMetadata({key:'fixture-key',budget:{claim(){}},fetcher});assert.equal(r.upstreamRequests,1);assert.equal(JSON.stringify(r).includes('private upstream'),false);
 }
});
