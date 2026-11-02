// Transient numeric diagnostics only. Never record prompts, IDs, media or credentials.
const stats={startedAt:0,metaAttempts:0,metaUsageResponses:0,openaiAttempts:0,metaInputTokens:0,metaOutputTokens:0,last:null};
export function noteAIEgress(provider){if(provider==='meta')stats.metaAttempts++;else if(provider==='openai')stats.openaiAttempts++;}
export function noteAIPhase(phase,status=0,code=''){
 const safePhase=['count','inference','usage','tools','complete','halt'].includes(phase)?phase:'halt';
 const safeCode=/^(?:AI_[A-Z_]+|META_AI_EXPIRED)$/.test(code)?code:'';
 stats.last={phase:safePhase,status:Number.isInteger(status)&&status>=0&&status<=599?status:0,code:safeCode};
}
export function noteAIUsage(usage){
 if([usage?.input_tokens,usage?.output_tokens].every(v=>Number.isSafeInteger(v)&&v>=0&&v<=10000000)){stats.metaUsageResponses++;stats.metaInputTokens+=usage.input_tokens;stats.metaOutputTokens+=usage.output_tokens;}
}
export function noteAIResponse(result,maxOutput,structured){
 stats.lastResponse={stage:structured?'structured':'research',status:['completed','incomplete','failed'].includes(result.status)?result.status:'other',reason:['max_output_tokens','content_filter'].includes(result.incomplete_details?.reason)?result.incomplete_details.reason:'other',maxOutput,outputTokens:Number.isSafeInteger(result.usage?.output_tokens)?result.usage.output_tokens:0};
}
export function localAIStats(request){if(!stats.startedAt)stats.startedAt=Date.now();return ['127.0.0.1','localhost','[::1]'].includes(new URL(request.url).hostname)?structuredClone(stats):undefined;}
