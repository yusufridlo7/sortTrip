// Dedicated customer support bridge. Never imports or dispatches the local agent queue.
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const reply=(data,status=200)=>Response.json({...data,...(/^SUPPORT_[A-Z_]+$/.test(data.error||'')?{code:data.error}:{})},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export const supportConfigured=env=>Boolean(env.SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY&&env.SUPABASE_PUBLISHABLE_KEY&&env.SUPPORT_TELEGRAM_BOT_TOKEN&&env.SUPPORT_TELEGRAM_BOT_TOKEN!==env.TELEGRAM_BOT_TOKEN&&/^[1-9]\d{0,19}$/.test(env.SUPPORT_TELEGRAM_CHAT_ID||'')&&/^[A-Za-z0-9_-]{32,256}$/.test(env.SUPPORT_TELEGRAM_WEBHOOK_SECRET||''));
export function safeSupportText(value){
 if(typeof value!=='string')throw Error('SUPPORT_INVALID');const text=value.trim();
 if(!text||text.length>1600||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))throw Error('SUPPORT_INVALID');
 // Reject recognizable secrets/payment data before either persistence or Telegram delivery.
 if(/\b(?:sk-[\w-]{12,}|eyJ[\w-]+\.[\w-]+\.[\w-]+)|-----BEGIN [\w ]*PRIVATE KEY-----|\b(?:authorization\s*:\s*bearer|cookie\s*:|(?:api[ _-]?key|password|passwd|token|otp|kode verifikasi|recovery code)\s*[:=]\s*\S+)|\b(?:otp|kode verifikasi)\D{0,20}\d{4,8}\b|\b(?:\d[ -]?){13,19}\b|https?:\/\/\S*[?&](?:token|key|secret|session|code)=/i.test(text))throw Error('SUPPORT_SENSITIVE');
 return text;
}
async function db(env,path,body){
 const r=await fetch(env.SUPABASE_URL+'/rest/v1/'+path,{method:body?'POST':'GET',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
 if(!r.ok){let code='SUPPORT_DATABASE';try{const e=await r.json();if(String(e.message).includes('SUPPORT_RATE_LIMIT'))code='SUPPORT_RATE_LIMIT';else if(String(e.message).includes('SUPPORT_NOT_FOUND'))code='SUPPORT_NOT_FOUND';else if(String(e.message).includes('SUPPORT_CLOSED'))code='SUPPORT_CLOSED';}catch{}throw Error(code);}return r.json();
}
async function user(request,env){const auth=request.headers.get('Authorization')||'';if(!/^Bearer [\w.-]+$/.test(auth))return null;const r=await fetch(env.SUPABASE_URL+'/auth/v1/user',{headers:{Authorization:auth,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});if(!r.ok)return null;const u=await r.json();return uuid(u.id)?u.id:null;}
async function body(request){if(!request.body)throw Error('SUPPORT_INVALID');const reader=request.body.getReader(),chunks=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();throw Error('SUPPORT_INVALID');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));}catch{throw Error('SUPPORT_INVALID');}finally{reader.releaseLock();}}
export async function runSupportOutbox(env){
 if(!supportConfigured(env))return;
 let entries;try{entries=await db(env,'rpc/support_claim_outbox',{});}catch{return;}
 for(const entry of entries){let telegramId=null;
  try{const text=safeSupportText(entry.body);const notice=`SortTrip Support #${entry.conversation_id.slice(0,8)}\n${entry.language==='en'?'English':'Indonesia'}\n\n${text}\n\nReply untuk menjawab. Reply /close untuk menutup percakapan.`;
   const r=await fetch('https://api.telegram.org/bot'+env.SUPPORT_TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.SUPPORT_TELEGRAM_CHAT_ID,text:notice,protect_content:true,link_preview_options:{is_disabled:true}}),signal:AbortSignal.timeout(10000)});if(r.ok){const result=await r.json();if(result.ok&&Number.isSafeInteger(result.result?.message_id))telegramId=result.result.message_id;}
  }catch{}
  try{await db(env,'rpc/support_finish_outbox',{p_id:entry.id,p_lease:entry.lease,p_telegram_message_id:telegramId,p_chat_id:env.SUPPORT_TELEGRAM_CHAT_ID});}catch{} // Lease expires; provider acceptance plus DB failure may produce a duplicate notification.
 }
}
async function webhook(request,env){
 if(request.method!=='POST')return reply({error:'Metode tidak didukung.'},405);
 if(!env.SUPPORT_TELEGRAM_WEBHOOK_SECRET||request.headers.get('X-Telegram-Bot-Api-Secret-Token')!==env.SUPPORT_TELEGRAM_WEBHOOK_SECRET)return reply({error:'SUPPORT_FORBIDDEN'},403);
 if(!supportConfigured(env))return reply({error:'SUPPORT_UNAVAILABLE'},503);
 try{const update=await body(request),m=update.message;
  // Support owner private chat only. Other chats/users and bot messages are ignored.
  if(!Number.isSafeInteger(update.update_id)||!m||m.chat?.type!=='private'||String(m.chat.id)!==env.SUPPORT_TELEGRAM_CHAT_ID||String(m.from?.id)!==env.SUPPORT_TELEGRAM_CHAT_ID||m.from?.is_bot||!Number.isSafeInteger(m.reply_to_message?.message_id))return reply({ok:true});
  const closed=m.text?.trim()==='/close';const text=closed?'':safeSupportText(m.text);
  await db(env,'rpc/support_admin_reply',{p_update_id:update.update_id,p_chat_id:env.SUPPORT_TELEGRAM_CHAT_ID,p_reply_to:m.reply_to_message.message_id,p_body:text,p_close:closed});
  return reply({ok:true});
 }catch(e){if(['SUPPORT_INVALID','SUPPORT_SENSITIVE','SUPPORT_NOT_FOUND','SUPPORT_CLOSED'].includes(e.message))return reply({ok:true});return reply({error:'SUPPORT_UNAVAILABLE'},503);}
}
export async function handleSupport(request,env,ctx){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/support/telegram/webhook')return webhook(request,env);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return reply({error:'SUPPORT_FORBIDDEN'},403);
 if(path==='/api/support/config'&&request.method==='GET')return reply({enabled:supportConfigured(env)});
 if(!supportConfigured(env))return reply({error:'SUPPORT_UNAVAILABLE'},503);
 try{const id=await user(request,env);if(!id)return reply({error:'SUPPORT_AUTH'},401);
  if(path==='/api/support/conversations'&&request.method==='GET'){const rows=await db(env,'support_conversations?'+new URLSearchParams({select:'id,status,language,created_at,updated_at',user_id:'eq.'+id,order:'updated_at.desc',limit:'20'}));return reply({conversations:rows});}
  const match=path.match(/^\/api\/support\/conversations\/([^/]+)$/);
  if(match&&request.method==='GET'){
   if(!uuid(match[1]))return reply({error:'SUPPORT_NOT_FOUND'},404);
   const conversations=await db(env,'support_conversations?'+new URLSearchParams({select:'id,status,language,created_at,updated_at',user_id:'eq.'+id,id:'eq.'+match[1]}));if(!conversations.length)return reply({error:'SUPPORT_NOT_FOUND'},404);
   const messages=await db(env,'support_messages?'+new URLSearchParams({select:'id,role,body,created_at',conversation_id:'eq.'+match[1],order:'created_at.desc,id.desc',limit:'100'}));return reply({conversation:conversations[0],messages:messages.reverse()});
  }
  if(path==='/api/support/conversations'&&request.method==='POST'){
   const input=await body(request),text=safeSupportText(input.message);if(!uuid(input.requestId)||(input.conversationId&&!uuid(input.conversationId)))return reply({error:'SUPPORT_INVALID'},400);
   const saved=await db(env,'rpc/support_customer_send',{p_user_id:id,p_conversation_id:input.conversationId||null,p_body:text,p_language:input.language==='en'?'en':'id',p_request_id:input.requestId});
   ctx.waitUntil(runSupportOutbox(env));return reply({conversationId:saved.conversation_id,messageId:saved.message_id},201);
  }
  return reply({error:'Metode tidak didukung.'},405);
 }catch(e){const status={SUPPORT_INVALID:400,SUPPORT_SENSITIVE:400,SUPPORT_RATE_LIMIT:429,SUPPORT_NOT_FOUND:404,SUPPORT_CLOSED:409}[e.message]||503;return reply({error:status===503?'SUPPORT_UNAVAILABLE':e.message},status);}
}
