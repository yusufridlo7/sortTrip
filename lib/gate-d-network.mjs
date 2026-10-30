export const GATE_D_QA='https://aytrcvfncsklhqozreyk.supabase.co';
export function gateDDemoEnabled(mode,flag,project){return mode==='qa-preparation'&&flag==='true'&&project===GATE_D_QA;}
// Complements QA CSP/server deny-by-default. No ledger or entitlement bypass.
export function gateDFetch(fetcher,origin){return (input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,origin);
 const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
 const local=url.origin===origin&&['/api/assistant/access','/api/assistant/discover','/api/staging/session','/api/staging/identity'].includes(url.pathname);
 const qa=url.origin===GATE_D_QA&&(url.pathname.startsWith('/auth/v1/')||url.pathname==='/rest/v1/trips');
 if(!qa&&!local||local&&url.pathname.startsWith('/api/assistant/')&&method!=='POST')return Promise.reject(Error('GATE_D_NETWORK_DENIED'));
 return fetcher(input,{...init,redirect:'error'});
};}
