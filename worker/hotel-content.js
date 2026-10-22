import {assertLiteApiFreeEndpoint} from './liteapi-cost-policy.js';
const text=(v,max=1500)=>typeof v==='string'?v.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
const number=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max?v:null;
export function hotelImage(v){try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password||u.port||/^(localhost|[\d.]+$|\[)|\.local$/i.test(u.hostname))return null;return u.href;}catch{return null;}}
export function hotelPreview(h){return {photo:hotelImage(h.main_photo||h.thumbnail),stars:number(h.starRating,5),rating:number(h.rating,10),reviewCount:number(h.reviewCount,1e7),address:text(h.address,300)};}
export function hotelContent(h,reviews){
 const photos=items=>(Array.isArray(items)?items:[]).slice(0,24).map(p=>({url:hotelImage(p.urlHd||p.hd_url||p.url),caption:text(p.caption||p.imageDescription,160)})).filter(p=>p.url);
 return {id:h.id,name:text(h.name,160),...hotelPreview(h),description:text(h.hotelDescription,5000),images:photos(h.hotelImages),facilities:(Array.isArray(h.hotelFacilities)?h.hotelFacilities:[]).slice(0,40).map(f=>text(typeof f==='string'?f:f.name,100)).filter(Boolean),rooms:(Array.isArray(h.rooms)?h.rooms:[]).slice(0,20).map(r=>({name:text(r.roomName,160),description:text(r.description),images:photos(r.photos),facilities:(Array.isArray(r.roomAmenities)?r.roomAmenities:[]).slice(0,12).map(a=>text(a.name,100)).filter(Boolean)})),reviews:(Array.isArray(reviews)?reviews:[]).slice(0,10).map(r=>({score:number(r.averageScore,10),date:text(r.date,10),headline:text(r.headline,200),pros:text(r.pros,1200),cons:text(r.cons,1200)}))};
}
export async function handleHotelContent(request,env,fetcher=fetch){
 const reply=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='GET')return reply({error:'hotel_invalid_search'},405);
 const u=new URL(request.url),id=u.searchParams.get('hotelId');
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==u.origin)return reply({error:'hotel_origin_rejected'},403);
 if(!/^[A-Za-z0-9_-]{1,100}$/.test(id||''))return reply({error:'hotel_invalid_search'},400);
 if(typeof env.LITEAPI_API_KEY!=='string'||env.LITEAPI_API_KEY.length<9||!(env.LITEAPI_ENABLED==='true'||env.LITEAPI_CHECKOUT_ENABLED==='true'))return reply({error:'hotel_search_unavailable'},503);
 if(!env.AI_LIMITER||(await env.AI_LIMITER.limit({key:'hotel-content:'+(request.headers.get('CF-Connecting-IP')||'unknown')})).success!==true)return reply({error:'hotel_search_limit'},429);
 async function api(path){assertLiteApiFreeEndpoint('data/'+path,'GET');const r=await fetcher('https://api.liteapi.travel/v3.0/data/'+path,{redirect:'manual',headers:{'X-API-Key':env.LITEAPI_API_KEY,Accept:'application/json'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const raw=await r.text();if(raw.length>2000000||raw.includes(env.LITEAPI_API_KEY))throw Error();return JSON.parse(raw).data;}
 try{const [detail,reviews]=await Promise.allSettled([api('hotel?'+new URLSearchParams({hotelId:id})),api('reviews?'+new URLSearchParams({hotelId:id,limit:'10',getSentiment:'false'}))]);if(detail.status!=='fulfilled'||detail.value?.id!==id)throw Error();return reply({hotel:hotelContent(detail.value,reviews.status==='fulfilled'?reviews.value:[]),reviewsAvailable:reviews.status==='fulfilled'});}catch{return reply({error:'hotel_search_unavailable'},502);}
}
