// Standard endpoint pricing verified 2026-10-22:
// https://docs.liteapi.travel/reference/api-pricing-usage-costs
// Free API access remains subject to ToS/fair use and account-specific agreements.
// This is NOT authorization for a reservation or a guarantee of zero booking costs.
const allowed = new Set([
 'api GET data/hotels',
 'api GET data/hotel',
 'api GET data/reviews',
 'api POST hotels/rates',
 'book GET bookings',
 'book POST rates/prebook',
 'book POST rates/book',
]);
export function assertLiteApiFreeEndpoint(path,method,host='api') {
 if(typeof path!=='string'||!allowed.has(`${host} ${method} ${path.split('?')[0]}`))throw Error('LITEAPI_ENDPOINT_NOT_APPROVED');
 // Keep automated review sentiment processing disabled in our content flow.
 if(path.split('?')[0]==='data/reviews'&&new URLSearchParams(path.split('?')[1]||'').get('getSentiment')!=='false')throw Error('LITEAPI_ENDPOINT_NOT_APPROVED');
}
