// Build from the live schema: the current API calls the booking discriminator
// sub_type, while some documentation/examples call it action_type.
export function bookingStatisticsQuery(fields,subId,now=Date.now()){
 const find=name=>fields.find(f=>f.name===name);
 const supports=(name,op)=>find(name)?.filters.includes(op);
 const discriminator=['sub_type','action_type'].find(name=>supports(name,'eq')&&(!find(name).values?.length||find(name).values.includes('booking')));
 const selected=['action_id','type','campaign_id',discriminator,'sub_id','state','date','updated_at'].filter(name=>name&&find(name));
 if(!discriminator||!['action_id','type','campaign_id','sub_id','state','date'].every(name=>selected.includes(name))||!['type','campaign_id','sub_id'].every(name=>supports(name,'eq'))||!supports('date','ge'))throw Error('schema');
 return {
  fields:selected,
  filters:[{field:'type',op:'eq',value:'action'},{field:'campaign_id',op:'eq',value:100},{field:discriminator,op:'eq',value:'booking'},{field:'sub_id',op:'eq',value:'.'+subId},{field:'date',op:'ge',value:new Date(now-30*86400000).toISOString().slice(0,10)}],
  sort:[{field:'date',order:'desc'}],offset:0,limit:100
 };
}

export function bookingStatisticsRows(data,query){
 if(!Array.isArray(data?.results)||data.results.length>query.limit||Number(data.total_rows||0)>query.limit)throw Error('results');
 const discriminator=query.filters.find(f=>['sub_type','action_type'].includes(f.field))?.field;
 if(!discriminator)throw Error('schema');
 // An accepted query is not evidence by itself: inspect each returned row.
 // Missing subtype, generic actions and paid clicks can never imply a purchase.
 return data.results.filter(r=>r&&r.type==='action'&&Number(r.campaign_id)===100&&r[discriminator]==='booking').map(r=>({action_id:r.action_id,action_type:'booking',sub_id:r.sub_id,state:r.state,date:r.date,updated_at:r.updated_at}));
}
