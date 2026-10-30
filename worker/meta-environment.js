export const PRODUCTION_SUPABASE='https://tznxfgosmjcmwoszvkdk.supabase.co';
export function metaAllocationLimit(env){return productionMetaEnabled(env)?100:10;}
export function productionMetaEnabled(env){return env.SUPABASE_URL===PRODUCTION_SUPABASE&&env.META_ITINERARY_ENABLED==='true'&&env.META_VIDEO_NONPRODUCTION!=='true';}
export function qaMetaEnabled(env){return env.SUPABASE_URL!==PRODUCTION_SUPABASE&&env.META_VIDEO_NONPRODUCTION==='true';}
