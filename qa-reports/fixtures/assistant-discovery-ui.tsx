// Isolated development fixture, never imported by the application/build entry.
// All service requests are simulated in this tab. No real credential or model.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import FlightSearch from '../../app/flight-search';
import WorldPlanner from '../../app/world-planner';
import {supabase} from '../../app/supabase';
import {useLanguage} from '../../app/i18n';
import LanguageSwitcher from '../../app/i18n/language-switcher';
import type {Trip} from '../../app/travel-data';
import '../../app/globals.css';
import '../../app/travel-refresh.css';
import '../../app/brand-theme.css';
import 'leaflet/dist/leaflet.css';
if(import.meta.env.MODE!=='meta-qa'||!['localhost','127.0.0.1'].includes(location.hostname))throw Error('QA only');
let modelCalls=0,searchCalls=0;
if(supabase)supabase.auth.getSession=async()=>({data:{session:{access_token:'nonsecret-fixture-token'}},error:null}) as any;
const options=[{city:'Hanoi',airport:'HAN',country:'Vietnam',days:5,summary:'SIMULATED: Hanoi museums and budget accommodation.',stops:[...Array.from({length:5},(_,i)=>({day:i+1,time:'10:00',title:'Museum '+(i+1),category:'Wisata',place:'Hanoi',note:'SIMULATED: admission not verified'})),...Array.from({length:4},(_,i)=>({day:i+1,time:'20:00',title:'Old Quarter accommodation',category:'Penginapan',place:'Old Quarter, Hanoi',note:'SIMULATED: choose a hotel'}))]}];
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
 if(url.pathname==='/api/assistant/access')return Response.json({pass:{remaining:8,requestLimit:10}});
 if(['/api/assistant/discover','/api/meta-qa/discovery-preview'].includes(url.pathname)){modelCalls++;return Response.json({options,question:'',provider:'SIMULATED',videoAccessed:false});}
 if(url.pathname==='/api/recommendations')return Response.json({stale:false,cities:[{airport:'HAN',hotelMinimum:300000,updatedAt:'2026-10-28T00:00:00Z'}]});
 if(url.pathname==='/api/flights'){searchCalls++;return Response.json({flights:[{id:'simulated-HAN',destinationId:'han',origin:'CGK',destination:'HAN',city:'Hanoi',country:'Vietnam',countryCode:'VN',destinationZone:'Asia/Bangkok',start:'2027-01-30',end:'2027-02-03',days:5,price:2500000,airline:'SIMULATED',flightNumber:'QA',departureAt:'2027-01-30T05:00:00+07:00',returnAt:'2027-02-03T19:00:00+07:00',durationTo:240,durationBack:240,transfers:0,bookingUrl:'https://www.aviasales.com/'}],fetchedAt:'2026-10-28T00:00:00Z',partial:false,limited:false});}
 throw Error('Fixture blocks real service calls');
};
function Fixture(){
 useLanguage();const [trip,setTrip]=useState<Trip|null>(null);
 return <main style={{maxWidth:1200,margin:'auto',padding:'1rem'}}><p role="status" style={{padding:'1rem',background:'#fff1cf'}}>SIMULATED QA — no real Meta, price, account, payment or Save. Model calls: {modelCalls}; flight calls: {searchCalls}.</p><LanguageSwitcher/>{trip?<><button type="button" onClick={()=>setTrip(null)}>Back to fixture</button><WorldPlanner trip={trip} onChange={setTrip} onSave={()=>{}} busy={false} dirty={true}/></>:<FlightSearch loggedIn onChoose={setTrip}/>}</main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
