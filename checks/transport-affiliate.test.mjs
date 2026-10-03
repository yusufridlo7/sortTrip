import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transportLink} from '../app/transport-affiliate.mjs';
test('preserves partner id, itinerary date and adult count',()=>{const u=new URL(transportLink('bangkok','chiang-mai','2026-10-05',2));assert.equal(u.pathname,'/in/travel/bangkok/chiang-mai');assert.equal(u.searchParams.get('z'),'17068680');assert.equal(u.searchParams.get('date'),'2026-10-05');assert.equal(u.searchParams.get('adults'),'2');assert.equal(u.searchParams.get('people'),'2');});
test('maps saved itinerary ids to partner location names',()=>{assert.equal(new URL(transportLink('kl','melaka','2027-01-01',1)).pathname,'/in/travel/kuala-lumpur/malacca');assert.equal(new URL(transportLink('sin','bkk','2027-01-01',1)).pathname,'/in/travel/singapore/bangkok');});
test('unknown, identical or injected locations do not fabricate route links',()=>{for(const [a,b] of [['unknown','kl'],['kl','kl'],['https://evil.test','sin']])assert.equal(transportLink(a,b,'2027-01-01',1),null)});
test('invalid dates and passenger counts are rejected',()=>{for(const d of ['2026-02-30','bad','2026-1-1'])assert.equal(transportLink('kl','sin',d,1),null);for(const n of [0,9,1.5,NaN])assert.equal(transportLink('kl','sin','2027-01-01',n),null)});

test('fallback home also retains the existing public affiliate identifier',async()=>{const {transportAffiliateHome}=await import('../app/transport-affiliate.mjs');const u=new URL(transportAffiliateHome);assert.equal(u.origin,'https://12go.asia');assert.equal(u.searchParams.get('z'),'17068680');});
