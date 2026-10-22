import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertLiteApiFreeEndpoint as allow} from '../worker/liteapi-cost-policy.js';
test('allow only reviewed free hotel API endpoint and method/host combinations',()=>{
 for(const path of ['data/hotel?hotelId=test','data/hotels?countryCode=MY','data/reviews?hotelId=test&getSentiment=false'])assert.doesNotThrow(()=>allow(path,'GET'));
 assert.doesNotThrow(()=>allow('hotels/rates','POST'));
 for(const path of ['rates/prebook','rates/book'])assert.doesNotThrow(()=>allow(path,'POST','book'));
 assert.doesNotThrow(()=>allow('bookings?clientReference=test','GET','book'));
});
test('paid, unknown, flight and alternate-host paths are blocked before outbound fetch',()=>{
 for(const path of ['data/places','data/places?text=Paris','data/places/test','pricing/index','hotels/pricing/index','flights/rates','unknown','https://api.liteapi.travel/v3.0/data/hotels','data/../places','data/hotels/../places','data/hotels#other'])assert.throws(()=>allow(path,'GET'),/LITEAPI_ENDPOINT_NOT_APPROVED/);
 assert.throws(()=>allow('hotels/rates','GET'));
 assert.throws(()=>allow('data/hotel','GET','book'));
 assert.throws(()=>allow('data/reviews?getSentiment=true','GET'));
});
