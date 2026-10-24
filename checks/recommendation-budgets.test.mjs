import {test} from 'node:test';
import assert from 'node:assert/strict';
import {statistics,combineStatistics,publishBudgets,monthlyRecommendationRefresh,recommendationResponse,collectRecommendationSnapshot} from '../worker/recommendation-budgets.js';
const sample=(month,hotel=200000,fares=[1000000,2000000,3000000])=>({month,capturedAt:month+'-24T01:00:00Z',cities:[{id:'kl',hotelMinimum:hotel,flight:statistics(fares),tickets:[{series:'v:1',kind:'attraction',basis:'starting_price',title:'A',stats:statistics([100000])}]}]});
test('collector respects disabled and sandbox hotel gates; no ticket supplier call without production config',async()=>{
 for(const env of [{},{LITEAPI_ENABLED:'true',LITEAPI_API_KEY:'sandbox_fixture_key'}]){
  let flights=0;const result=await collectRecommendationSnapshot(env,{},async()=>{flights++;return Response.json({flights:[]})},()=>{assert.fail('disabled supplier must not be called')},new Date('2026-10-24'));
  assert.equal(flights,9);assert.ok(result.cities.every(c=>c.hotelMinimum===null&&c.flight===null&&c.tickets.length===0));
 }
});
test('sample deviation and pooled ticket statistics use n-1 and reject invalid values',()=>{
 assert.deepEqual(statistics([0,-1,NaN,Infinity]),null);assert.equal(statistics([9]).sd,null);
 const a=statistics([1,2]),b=statistics([3,4]),all=statistics([1,2,3,4]);
 assert.deepEqual(combineStatistics([a,b,null,{n:3,mean:2,m2:0}]),all);
 assert.equal(all.sd,Math.sqrt(5/3));
});
test('hotel uses latest minimum below cap, never historical mean; unrelated tickets stay separate',()=>{
 const first=sample('2026-09',100000),second=sample('2026-10',300000);
 second.cities[0].tickets.push({series:'v:2',kind:'attraction',basis:'starting_price',stats:statistics([9000000])});
 const city=publishBudgets([first,second]).cities[0];
 assert.equal(city.hotelMinimum,300000);assert.equal(city.flight.n,6);
 assert.equal(city.tickets[0].stats.n,2);assert.equal(city.tickets[0].stats.mean,100000);assert.equal(city.tickets[1].stats.n,1);
 assert.equal(city.budget,Math.ceil((Math.max(city.flight.min,city.flight.mean-city.flight.sd)+900000+400000)/50000)*50000);
 assert.equal('hotelMean' in city,false);assert.equal('hotelSD' in city,false);
});
test('missing hotel never publishes a numeric budget; higher minimum is allowed and flagged; one fare has no invented deviation',()=>{
 for(const s of [sample('2026-10',null),sample('2026-10',300000,[])])assert.equal(publishBudgets([s]).cities[0].budget,null);
 const expensive=publishBudgets([sample('2026-10',600000)]).cities[0];assert.equal(expensive.hotelAboveTarget,true);assert.ok(expensive.budget>0);
 const city=publishBudgets([sample('2026-10',300000,[1000000])]).cities[0];assert.equal(city.budget,2300000);assert.equal(city.flight.sd,null);
});
test('Hanoi uses five-day return series and four hotel nights; prior four-day samples do not leak in',()=>{
 const older={month:'2026-09',capturedAt:'2026-09-24T01:00Z',cities:[{id:'hanoi',tripDays:4,hotelMinimum:100000,flight:statistics([1000000])}]};
 const current={month:'2026-10',capturedAt:'2026-10-24T01:00Z',cities:[{id:'hanoi',tripDays:5,hotelMinimum:350000,flight:statistics([5300000])}]};
 const h=publishBudgets([older,current]).cities.find(c=>c.id==='hanoi');
 assert.equal(h.days,5);assert.equal(h.nights,4);assert.equal(h.journey,'return');assert.equal(h.flight.n,1);assert.equal(h.flightEstimate,5300000);assert.equal(h.hotelTotal,1400000);assert.equal(h.foodTotal,400000);assert.equal(h.budget,7100000);
 const missing=publishBudgets([current,{...current,cities:[]}]).cities.find(c=>c.id==='hanoi');assert.equal(missing.budget,null);assert.equal(missing.hotelTotal,null);
});
test('monthly collection runs once, deduplicates history, and caps retry frequency',async()=>{
 const values=new Map(),kv={get:async(k,type)=>values.has(k)?type==='json'?JSON.parse(values.get(k)):values.get(k):null,put:async(k,v)=>values.set(k,v),list:async()=>({keys:[]})};
 let calls=0;const collect=async()=>{calls++;return sample('2026-10')},env={RECOMMENDATION_BUDGETS:kv,RECOMMENDATIONS_REFRESH_ENABLED:'true'};
 await monthlyRecommendationRefresh(env,{},null,new Date('2026-10-24'),collect);await monthlyRecommendationRefresh(env,{},null,new Date('2026-10-24'),collect);
 assert.equal(calls,1);assert.equal(JSON.parse(values.get('published')).cities[0].flight.n,3);
 assert.equal(JSON.parse(values.get('history')).filter(s=>s.month==='2026-10').length,1);
 values.clear();calls=0;const noData=async()=>{calls++;return {cities:[]}};
 await monthlyRecommendationRefresh(env,{},null,new Date('2026-10-24'),noData);await monthlyRecommendationRefresh(env,{},null,new Date('2026-10-24T01:00Z'),noData);assert.equal(calls,1);
});
test('public budget read does not collect prices; stale budgets are hidden and writes denied',async()=>{
 const data=publishBudgets([sample('2026-08')]);
 const r=await recommendationResponse(new Request('https://test/api/recommendations'),{RECOMMENDATION_BUDGETS:{get:async()=>data}},new Date('2026-10-25'));
 assert.equal(r.status,200);const b=await r.json();assert.equal(b.stale,true);assert.equal(b.cities[0].budget,null);
 assert.equal((await recommendationResponse(new Request('https://test/api/recommendations',{method:'POST'}),{})).status,405);
});
