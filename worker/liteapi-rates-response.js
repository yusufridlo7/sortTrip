// Rates can return HTTP200 + error.code2001 for a genuine empty availability.
// Never forward supplier error text, IDs or raw envelopes to the client.
export function liteRatesEnvelope(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('lite_rates_invalid_envelope');
 if([true,1,'true','1'].includes(raw.sandbox))throw Error('lite_production_required');
 if(raw.error!=null){if(Number(raw.error?.code)===2001)return {...raw,data:[],noAvailability:true};throw Error('lite_rates_api_error');}
 if(!Array.isArray(raw.data))throw Error('lite_rates_invalid_envelope');
 return raw;
}
