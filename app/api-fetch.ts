import {supabase} from './supabase';
// Only staging's owner-gated API needs a session for otherwise public reads.
export async function apiFetch(input:string,init:RequestInit={}){
 if(!['staging','qa-preparation'].includes(import.meta.env?.MODE))return fetch(input,init);
 const url=new URL(input,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))throw Error('STAGING_ORIGIN_DENIED');
 if(import.meta.env.MODE==='qa-preparation'&&['/api/locations','/api/locations/resolve','/api/staging/identity'].includes(url.pathname))return fetch(input,init); // Local static catalogue only, no upstream service.
 if(!supabase)throw Error('QA_LIVE_UNAVAILABLE');
 const {data}=await supabase.auth.getSession();const headers=new Headers(init.headers);
 if(!data.session)throw Error('AUTH_REQUIRED');headers.set('Authorization','Bearer '+data.session.access_token);
 return fetch(input,{...init,headers});
}
