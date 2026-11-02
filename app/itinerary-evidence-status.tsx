import {connectionGaps,usableActivitySource} from '../worker/itinerary-evidence.mjs';
import {tr} from './i18n';
import type {Trip} from './travel-data';
export default function ItineraryEvidenceStatus({trip}:{trip:Trip}){
 if(!trip.aiPlan)return null;
 const gaps=connectionGaps(trip.items.map(x=>({...x,location:x.place,category:x.category==='Transportasi'?'Transfer':x.category})),{...trip,city:trip.destinationMeta?.city||trip.aiPlan.context.city,airport:trip.flight?.destinationCode,airportLabel:trip.aiPlan.context.airportLabel,arrival:trip.flight?.arrive,arrivalDay:trip.flight?.arrivalDay,oneWay:trip.journey==='oneway',retained:[]});
 const unknown=trip.items.filter(x=>x.aiGenerated&&x.category==='Wisata'&&!usableActivitySource(x,trip.aiPlan?.sources||[]));
 const legs=trip.items.flatMap(x=>x.routeOptions?.[x.selectedRoute||0]?.legs||[]).filter(x=>x.sourceRelevant===false).length;
 if(!gaps.length&&!unknown.length&&!legs)return null;
 return <details className="city-warning itinerary-evidence-status"><summary>{tr('ai_evidence_review',{routes:gaps.length,sources:unknown.length,legs})}</summary>
 {legs>0&&<p>{tr('route_source_unverified')}</p>}
 {unknown.map(x=><p key={x.id}>{x.title}: {tr('ai_source_unverified')}</p>)}
 {gaps.map((g,i)=><p key={i}>{tr('ai_connection_gap',{day:g.day,from:g.from,to:g.to})}{' '}<a target="_blank" rel="noopener noreferrer" href={'https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',origin:g.from,destination:g.to,travelmode:'transit'})}>{tr('ui_0009')}</a></p>)}
 </details>;
}
