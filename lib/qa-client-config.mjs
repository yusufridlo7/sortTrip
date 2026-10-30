export const QA_SUPABASE_URL='https://aytrcvfncsklhqozreyk.supabase.co';
// Public binding validation only, NOT JWT/session authentication. Never log keys.
export function qaClientReady(url,key,authorized){
 if(authorized!=='true'||url!==QA_SUPABASE_URL||typeof key!=='string'||key.length>4096)return false;
 if(/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key))return true; // Project ownership still needs owner verification.
 try{
  const parts=key.split('.');if(parts.length!==3||!parts.every(v=>/^[A-Za-z0-9_-]+$/.test(v)))return false;
  const raw=parts[1].replace(/-/g,'+').replace(/_/g,'/');
  const claims=JSON.parse(atob(raw.padEnd(Math.ceil(raw.length/4)*4,'=')));
  return claims.role==='anon'&&claims.ref==='aytrcvfncsklhqozreyk';
 }catch{return false;}
}
