// User-confirmed destination only. No model, offers, hotel inventory or prices.
export function manualItinerary(location,preferences){
 if(!location||!['city','country','code'].every(k=>typeof location[k]==='string'&&location[k].trim())||!/^[A-Z]{3}$/.test(location.code))throw Error('DESTINATION_REQUIRED');
 const {start,days,people,budget=0,origin='CGK'}=preferences||{};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(Date.parse(start))||new Date(start).toISOString().slice(0,10)!==start||!Number.isInteger(days)||days<1||days>365||!Number.isInteger(people)||people<1||people>8||!Number.isFinite(budget)||budget<0||budget>1e9||!['CGK','SUB','DPS'].includes(origin))throw Error('INVALID_MANUAL_TRIP');
 return {destination:'manual-'+location.code.toLowerCase(),destinationMeta:{city:location.city,country:location.country,code:location.code},origin,start,days,people,budget,items:[],version:2,estimateIncomplete:true};
}
