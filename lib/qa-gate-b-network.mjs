export const GATE_B_QA_ORIGIN='https://aytrcvfncsklhqozreyk.supabase.co';
// Browser SDK requests only. No service role, paid API or non-trips mutation.
export function gateBRequestAllowed(value,method='GET'){
 try{const u=new URL(value);method=method.toUpperCase();if(u.origin!==GATE_B_QA_ORIGIN||u.username||u.password)return false;
  if(u.pathname==='/auth/v1/user')return method==='GET';
  if(u.pathname==='/auth/v1/token')return method==='POST'&&['password','refresh_token'].includes(u.searchParams.get('grant_type'));
  if(u.pathname==='/auth/v1/logout')return method==='POST';
  return u.pathname==='/rest/v1/trips'&&['GET','POST','PATCH'].includes(method);
 }catch{return false;}
}
