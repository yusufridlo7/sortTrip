// OWNER-RUN setup only. Do not run from the autonomous agent or Telegram queue.
// Read only the dedicated support variables supplied to this process; never print them.
try {
 const {SUPPORT_TELEGRAM_BOT_TOKEN:token,SUPPORT_TELEGRAM_WEBHOOK_SECRET:secret,SUPPORT_WEBHOOK_URL:address}=process.env;
 const url=new URL(address||'');
 if(!token||!secret||secret.length<32||!/^[A-Za-z0-9_-]+$/.test(secret)||url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/api/support/telegram/webhook'||/^(localhost|127\.|\[?::1)/i.test(url.hostname))throw Error('CONFIG');
 if(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_BOT_TOKEN===token)throw Error('SEPARATE_BOT');
 const health=await fetch(new URL('/api/support/config',url),{signal:AbortSignal.timeout(10000)});
 if(!health.ok||(await health.json()).enabled!==true)throw Error('DEPLOY_FIRST');
 const response=await fetch('https://api.telegram.org/bot'+token+'/setWebhook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href,secret_token:secret,allowed_updates:['message'],drop_pending_updates:false}),signal:AbortSignal.timeout(12000)});
 if(!response.ok||(await response.json()).ok!==true)throw Error('WEBHOOK');
 console.log('SUPPORT_WEBHOOK_REGISTERED');
} catch {console.error('SUPPORT_WEBHOOK_SETUP_FAILED: verify dedicated support configuration and deployed endpoint privately.');process.exitCode=1;}
