// Discovery hints, NOT injected evidence, live prices or checked navigation.
// Official public pages reviewed 2026-11-03; the model must retrieve/cite relevant evidence.
export function transportResearchHints(q){
 const hints={requiredConnections:(q.routeRequests||[]).slice(0,30).map(r=>({day:r.day,from:r.from,to:r.to,mode:r.mode})),candidateSources:[]};
 if(!/^(kuala lumpur|kl)$/i.test(q.city||''))return hints;
 const labels=[q.interests,...(q.routingTargets||[]).map(r=>r.place),...(q.requestedStops||[]).map(r=>r.title),...(q.retained||[]).map(r=>r.title)].join(' ');
 if(/muzium negara|national museum|pasar seni/i.test(labels))hints.candidateSources.push(
  {url:'https://www.mymrt.com.my/projects/kajang-line/stations/',purpose:'MRT Corp Kajang line stations; verify exact Pasar Seni and Muzium Negara connection, not a generic city guide.'},
  {url:'https://www.muziumnegara.gov.my/en/how-get-national-museum',purpose:'Museum official access, including the last walking leg; not a fare or availability quote.'});
 if(/travelodge kuala lumpur city centre/i.test(labels))hints.candidateSources.push({url:'https://travelodgehotels.asia/hotel/malaysia/travelodge-kuala-lumpur-city-centre/',purpose:'Retained hotel official address and nearby rail access only; do not research room offers or replace the hotel.'});
 return hints;
}
