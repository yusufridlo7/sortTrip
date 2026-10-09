// Public affiliate identifier, not a secret. Slugs are explicit, never guessed from user text.
export const transportAffiliateHome='https://12go.asia/?z=17068680';
const places = {kl:'kuala-lumpur',bkk:'bangkok',sin:'singapore',melaka:'malacca',bangkok:'bangkok','chiang-mai':'chiang-mai','kuala-lumpur':'kuala-lumpur',singapore:'singapore',malacca:'malacca','johor-bahru':'johor-bahru'};
export function transportLink(from,to,date,people){
 const origin=places[from],destination=places[to];
 if(!origin||!destination||origin===destination)return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return null;
 if(!Number.isInteger(people)||people<1||people>8)return null;
 const url=new URL(transportAffiliateHome);url.pathname=`/in/travel/${origin}/${destination}`;
 url.search=new URLSearchParams({date,people:String(people),adults:String(people),vehclasses_tab:'all',z:'17068680'}).toString();
 return url.href;
}

// Only audited city/terminal aliases; unrelated local places never become guessed slugs.
export function transportPlace(value){
 const s=String(value||'').trim().toLowerCase();
 if(places[s])return s;
 for(const [pattern,key] of [[/\b(johor bahru|johor-bahru|larkin sentral|terminal larkin|jb sentral)\b/,'johor-bahru'],[/\b(melaka|malacca)\b/,'malacca'],[/\b(singapura|singapore)\b/,'singapore'],[/\b(kuala lumpur|kuala-lumpur)\b/,'kuala-lumpur'],[/\bbangkok\b/,'bangkok'],[/\bchiang mai\b/,'chiang-mai']])if(pattern.test(s))return key;
 return s;
}
export function transportLegLink(leg,date,people){
 const from=transportPlace(leg.fromPlace),to=transportPlace(leg.toPlace);
 const named=transportLink(from,to,date,people);if(named)return named;
 // Grounded provider route references may resolve terminals outside the small alias catalog.
 try{const source=new URL(leg.sourceUrl);if(source.hostname!=='12go.asia'||source.protocol!=='https:'||source.username||source.password)return null;
 const match=source.pathname.match(/^\/(?:en|in|ms)\/travel\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/);if(!match||match[1]===match[2])return null;
 const valid=transportLink('sin','melaka',date,people);if(!valid)return null;
 const url=new URL(valid);url.pathname='/en/travel/'+match[1]+'/'+match[2];return url.href;
 }catch{return null;}
}
