import {handleVideoItinerary} from './video-itinerary.js';
import {handleMetaQAAccess,probeQANetwork} from './meta-qa-access.js';
import {handleQABudget} from './meta-qa-budget.js';
import {searchLocations,resolveLocations} from './location-search.js';
import {qaPublicFlights} from './qa-public-flights.js';
import {handleAssistantDiscovery} from './assistant-discovery.js';
import {recommendationResponse} from './recommendation-budgets.js';
const QA_URL='https://aytrcvfncsklhqozreyk.supabase.co';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {async fetch(request,env){
 const url=new URL(request.url);
 // This entry is local-only and does not expose booking/payment/planner routes.
 if(!['127.0.0.1','localhost'].includes(url.hostname)||env.SUPABASE_URL!==QA_URL||env.META_VIDEO_NONPRODUCTION!=='true')return reply({code:'QA_ISOLATION_REQUIRED'},503);
 if(request.method==='GET'&&url.pathname==='/api/meta-qa/status')return reply({environment:'meta-qa-local',project:'aytrcvfncsklhqozreyk',analysisEnabled:env.META_VIDEO_TEXT_ENABLED==='true',framesEnabled:env.META_VIDEO_FRAMES_ENABLED==='true',budgetMarkedReady:env.META_VIDEO_BUDGET_READY==='true'});
 if(url.pathname==='/api/meta-qa/model-access')return handleMetaQAAccess(request,env);
 if(url.pathname==='/api/meta-qa/budget-probe')return handleQABudget(request,env);
 if(request.method==='GET'&&url.pathname==='/api/meta-qa/network-status'){
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return reply({code:'ORIGIN_DENIED'},403);
  return probeQANetwork(fetch,env);
 }
 if(url.pathname==='/api/video-itinerary')return handleVideoItinerary(request,env);
 if(['/api/assistant/discover','/api/assistant/access'].includes(url.pathname))return handleAssistantDiscovery(request,env);
 if(url.pathname==='/api/meta-qa/discovery-preview')return handleAssistantDiscovery(request,env,{qaPreview:true});
 if(request.method==='GET'&&url.pathname==='/api/locations')return reply({locations:searchLocations(url.searchParams.get('q')||'')});
 if(url.pathname==='/api/locations/resolve')return resolveLocations(request);
 if(url.pathname==='/api/flights')return qaPublicFlights(request);
 if(url.pathname==='/api/recommendations')return recommendationResponse(request,env);
 return reply({code:'QA_ROUTE_UNAVAILABLE'},404);
}};
