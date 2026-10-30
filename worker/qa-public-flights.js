import {parseQuery} from './index.js';
import {boundedBytes} from '../lib/video-itinerary.mjs';
// Fixed anonymous read-only public endpoint. Never forwards a QA JWT, cookies,
// arbitrary URL, server binding, account ID, prompt, payment or booking request.
export async function qaPublicFlights(request,{fetcher=fetch}={}){
 const reply=(data,status)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='GET')return reply({error:'Metode tidak didukung.'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Origin tidak diizinkan.'},403);
 let query;try{query=parseQuery(request.url);}catch{return reply({error:'Parameter pencarian tidak valid.'},400);}
 const upstream=new URL('https://sorttrip.yusufridlo7.workers.dev/api/flights');
 for(const [key,value] of Object.entries(query))upstream.searchParams.set(key,String(value));
 try{
  const signal=AbortSignal.any([request.signal,AbortSignal.timeout(18000)]);
  const response=await fetcher(upstream.href,{method:'GET',redirect:'manual',signal,headers:{Accept:'application/json','X-SortTrip-Language':request.headers.get('X-SortTrip-Language')==='en'?'en':'id'}});
  if(!response.ok)return reply({error:'Pencarian tiket belum tersedia. Coba lagi.'},502);
  const body=JSON.parse(new TextDecoder().decode(await boundedBytes(response.body,1000000,signal)));
  if(!Array.isArray(body.flights)||!body.flights.every(f=>typeof f.destination==='string'&&Number.isFinite(f.price)&&f.price>0))throw Error();
  return reply({...body,qaReadOnlyPublicSource:true},200);
 }catch{return reply({error:'Pencarian tiket belum dapat dihubungi. Coba lagi.'},502);}
}
