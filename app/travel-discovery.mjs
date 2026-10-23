export const southeastAsia=['ID','MY','SG','TH','VN','PH','KH','LA','MM','BN','TL'];
export function rankedHotels(hotels,sort='price'){
 const cheapest=Math.min(...hotels.map(h=>h.amountIDR));
 const score=h=>.65*(h.amountIDR/Math.max(cheapest,1))+.35*(h.rating==null?1.4:Math.max(0,10-h.rating)/10);
 return [...hotels].sort((a,b)=>sort==='rating'?(b.rating??-1)-(a.rating??-1)||a.amountIDR-b.amountIDR:sort==='balanced'?score(a)-score(b)||a.amountIDR-b.amountIDR:a.amountIDR-b.amountIDR);
}
export function rankedFlights(flights,sort='price'){
 const cheapest=Math.min(...flights.map(f=>f.price)),timed=flights.filter(f=>f.durationTo>0),fastest=Math.min(...timed.map(f=>f.durationTo));
 const score=f=>.6*(f.price/Math.max(cheapest,1))+.3*(f.durationTo>0&&Number.isFinite(fastest)?f.durationTo/fastest:3)+.1*(f.transfers==null?2:f.transfers);
 return [...flights].sort((a,b)=>sort==='duration'?(a.durationTo??Infinity)-(b.durationTo??Infinity)||a.price-b.price:sort==='balanced'?score(a)-score(b)||a.price-b.price:a.price-b.price);
}
