// One read-only request to the documented reference-data endpoint.
// Keys are supplied by the owner at runtime, never printed or written here.
const key=process.env.LITEAPI_API_KEY?.trim();
if(!key){
 console.info(JSON.stringify({configured:false,code:'LITEAPI_KEY_NOT_CONFIGURED'}));
 process.exitCode=1;
}else{
 try{
  const response=await fetch('https://api.liteapi.travel/v3.0/data/currencies',{
   headers:{'X-API-Key':key,Accept:'application/json'},
   redirect:'error',signal:AbortSignal.timeout(20000)
  });
  if(!response.ok){
   console.info(JSON.stringify({configured:true,httpStatus:response.status,code:response.status===401||response.status===403?'LITEAPI_ACCESS_REJECTED':response.status===429?'LITEAPI_RATE_LIMITED':'LITEAPI_UNAVAILABLE'}));
   process.exitCode=1;
  }else{
   const data=await response.json();
   const currencies=Array.isArray(data)?data:Array.isArray(data.data)?data.data:[];
   console.info(JSON.stringify({configured:true,httpStatus:response.status,code:currencies.length?'LITEAPI_REFERENCE_CONNECTED':'LITEAPI_UNEXPECTED_RESPONSE',currencyCount:currencies.length,idrListed:currencies.some(c=>c?.code==='IDR'||c?.currency==='IDR'||c==='IDR'),scope:'reference_data_only',liveRatesVerified:false}));
   if(!currencies.length)process.exitCode=1;
  }
 }catch{
  // Never expose provider bodies, request headers, exception text or key values.
  console.info(JSON.stringify({configured:true,code:'LITEAPI_NETWORK_OR_RESPONSE_UNAVAILABLE'}));
  process.exitCode=1;
 }
}
