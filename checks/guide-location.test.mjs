import {test} from 'node:test';
import assert from 'node:assert/strict';
import {watchGuideLocation} from '../shared/guide-location.mjs';
test('foreground GPS watch handles granted permission and clears exactly once; late callbacks ignored',()=>{
 let ok,failed,cleared=0;const samples=[];
 const geo={watchPosition(a,b,options){ok=a;failed=b;assert.equal(options.maximumAge,60000);return 17},clearWatch(id){assert.equal(id,17);cleared++}};
 const stop=watchGuideLocation(geo,p=>samples.push(p),()=>assert.fail('unexpected denial'));
 const p={coords:{latitude:3,longitude:101,accuracy:15},timestamp:42};ok(p);assert.deepEqual(samples,[{lat:3,lng:101,accuracy:15,timestamp:42}]);stop();stop();ok(p);failed();assert.equal(cleared,1);assert.equal(samples.length,1);
});
test('denied or unavailable GPS reports unknown location without model, network or itinerary writes',()=>{
 let denied=0,error;watchGuideLocation(undefined,()=>assert.fail(),()=>denied++);
 const stop=watchGuideLocation({watchPosition(a,b){error=b;return 3},clearWatch(){}},()=>assert.fail(),()=>denied++);error({code:1});stop();assert.equal(denied,2);
});
