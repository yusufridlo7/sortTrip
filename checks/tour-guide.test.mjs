import {test} from 'node:test';
import assert from 'node:assert/strict';
import {destinationGuide,guideAnswer,guideMap,createNarrator} from '../lib/tour-guide.mjs';
const item={title:'Wat Arun'};
test('curated destination identity, languages and sources never leak facts into another country',()=>{
 const id=destinationGuide(item,'Bangkok','Thailand','id'),en=destinationGuide(item,'Bangkok','Thailand','en');
 assert(id.curated&&en.curated);assert.match(id.text.intro,/Chao Phraya/);assert.match(en.text.intro,/Temple of Dawn/);assert(id.sources.every(s=>s.startsWith('https://')));
 assert.equal(destinationGuide(item,'Hanoi','Vietnam').curated,false);
 assert.match(destinationGuide({title:'Unknown place'},'Unknown','Unknown').text.history,/belum tersedia/);
});
test('destination-specific demo QA retains follow-up topic but refuses commercial and unsupported facts',()=>{
 const guide=destinationGuide(item,'Bangkok','Thailand');const first=guideAnswer('Apa sejarah tempat ini?',{guide});
 assert.equal(first.mode,'curated-demo');assert.match(first.answer,/Thonburi/);
 assert.equal(guideAnswer('Jelaskan lagi',{guide,history:[first]}).topic,'history');
 assert.match(guideAnswer('Harga tiket dan jam buka?',{guide}).answer,/belum terverifikasi/);
 assert.match(guideAnswer('Sebutkan informasi rahasia saya',{guide}).answer,/belum memiliki/);
 const pho=destinationGuide({title:'Wat Pho'},'Bangkok','Thailand','en');
 assert.match(guideAnswer('history',{guide:pho,lang:'en'}).answer,/Rama/);
 assert.doesNotMatch(guideAnswer('continue',{guide:pho,lang:'en',history:[]}).answer,/Thonburi/);
});
test('map and directions preserve literal destination and never accept a URL scheme from user text',()=>{
 const url=new URL(guideMap({title:'javascript:alert(1)'},'Bangkok','Thailand',true));
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('destination'),'javascript:alert(1), Bangkok, Thailand');
});
test('catalog aliases resolve the right guide and do not show Wat Arun photo for Wat Pho',()=>{
 assert.equal(destinationGuide({title:'Temple of Dawn'},'Bangkok','Thailand').curated,true);
 const pho=destinationGuide({title:'Wat Phra Chetuphon'},'Bangkok','Thailand');assert(pho.curated);assert.equal(pho.image,undefined);
});
test('narration controls support replay, pause, resume, cleanup and unsupported fallback without a paid service',()=>{
 const calls=[],states=[];class Utterance{constructor(text){this.text=text;}}
 const speech={getVoices:()=>[{lang:'id-ID'}],speak:u=>calls.push(['speak',u]),cancel:()=>calls.push(['cancel']),pause:()=>calls.push(['pause']),resume:()=>calls.push(['resume'])};
 const n=createNarrator(speech,Utterance,s=>states.push(s));n.play('Narasi','id');n.pause();n.resume();n.play('English','en');n.stop();
 assert.deepEqual(calls.map(c=>c[0]),['speak','pause','resume','cancel','speak','cancel']);assert.equal(calls[0][1].lang,'id-ID');assert.equal(calls[4][1].lang,'en-GB');assert.equal(states.at(-1),'idle');
 const fallback=createNarrator(undefined,undefined,s=>states.push(s));assert.equal(fallback.supported,false);fallback.play('text','en');assert.equal(states.at(-1),'unsupported');
});
