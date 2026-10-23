import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bookingStatisticsQuery,bookingStatisticsRows} from '../worker/travelpayouts-bookings.js';

// Safe public metadata observed from the real campaign100 API on 2026-10-23.
// No selectable action_type; sub_type supports equality without an enum list.
const schema=['action_id','campaign_id','date','state','sub_id','sub_type','type','updated_at'].map(name=>({name,filters:name==='date'?['eq','ne','ge','gt','le','lt']:['eq','ne']}));
const subId='stf_'+'a'.repeat(32);
const row={action_id:'fixture-order',type:'action',campaign_id:100,sub_type:'booking',sub_id:'.'+subId,state:'paid',date:'2026-10-23'};

test('observed live schema produces supported booking subtype, campaign, scoped subID and bounded dates',()=>{
 const query=bookingStatisticsQuery(schema,subId,Date.parse('2026-10-23T12:00:00Z'));
 assert.ok(!query.fields.includes('action_type'));
 assert.ok(query.fields.includes('sub_type'));
 assert.deepEqual(query.filters,[{field:'type',op:'eq',value:'action'},{field:'campaign_id',op:'eq',value:100},{field:'sub_type',op:'eq',value:'booking'},{field:'sub_id',op:'eq',value:'.'+subId},{field:'date',op:'ge',value:'2026-09-23'}]);
 assert.equal(query.limit,100);assert.equal(query.offset,0);
 assert.equal(bookingStatisticsRows({results:[row]},query)[0].action_type,'booking');
 assert.deepEqual(bookingStatisticsRows({results:[],total_rows:0},query),[]);
});

test('unsupported filters and missing discriminator fail before a statistics request can be built',()=>{
 for(const changed of [schema.filter(f=>f.name!=='sub_type'),schema.map(f=>f.name==='sub_type'?{...f,values:['paid_click']}:f),schema.map(f=>f.name==='date'?{...f,filters:['eq']}:f),schema.filter(f=>f.name!=='sub_id')])assert.throws(()=>bookingStatisticsQuery(changed,subId));
 const alternate=schema.map(f=>f.name==='sub_type'?{...f,name:'action_type',values:['booking','paid_click']}:f);
 const query=bookingStatisticsQuery(alternate,subId);
 assert.ok(query.filters.some(f=>f.field==='action_type'&&f.value==='booking'));
 assert.equal(bookingStatisticsRows({results:[{...row,action_type:'booking'}]},query).length,1);
});

test('accepted queries cannot turn paid clicks, missing subtype or another campaign into booking evidence',()=>{
 const query=bookingStatisticsQuery(schema,subId);
 for(const changed of [{...row,sub_type:'paid_click'},{...row,sub_type:'advertise_profit'},{...row,sub_type:undefined},{...row,type:'redirect'},{...row,type:undefined},{...row,campaign_id:101},{...row,campaign_id:undefined}])assert.deepEqual(bookingStatisticsRows({results:[changed]},query),[]);
 assert.throws(()=>bookingStatisticsRows({results:[row],total_rows:101},query));
 assert.throws(()=>bookingStatisticsRows({results:null},query));
 assert.throws(()=>bookingStatisticsRows({results:Array(101).fill(row)},query));
});
