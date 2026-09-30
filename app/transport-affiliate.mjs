// Public affiliate identifier, not a secret. Slugs are explicit, never guessed from user text.
const places = {kl:'kuala-lumpur',bkk:'bangkok',sin:'singapore',melaka:'malacca',bangkok:'bangkok','chiang-mai':'chiang-mai','kuala-lumpur':'kuala-lumpur',singapore:'singapore',malacca:'malacca'};
export function transportLink(from,to,date,people){
 const origin=places[from],destination=places[to];
 if(!origin||!destination||origin===destination)return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return null;
 if(!Number.isInteger(people)||people<1||people>8)return null;
 const url=new URL(`https://12go.asia/in/travel/${origin}/${destination}`);
 url.search=new URLSearchParams({date,people:String(people),adults:String(people),vehclasses_tab:'all',z:'17068680'}).toString();
 return url.href;
}
