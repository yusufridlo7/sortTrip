export function hotelCheckoutUrl(hotelId,checkin,checkout,people){return '/hotel-checkout?'+new URLSearchParams({hotelId,checkin,checkout,people:String(people)});}
export function checkoutStartParams(params){return {hotelId:params.get('hotelId'),checkin:params.get('checkin'),checkout:params.get('checkout'),people:Number(params.get('people'))};}
export function checkoutResumeId(params){const id=params.get('checkoutId');return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'')?id:null;}
// Use the application's visible origin, never the API proxy's Worker origin.
export function checkoutReturnUrl(origin,id){
 if(!checkoutResumeId(new URLSearchParams({checkoutId:id})))throw Error('hotel_checkout_invalid');
 const base=new URL(origin);
 if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw Error('hotel_checkout_invalid');
 return new URL('/hotel-checkout?checkoutId='+encodeURIComponent(id),base.origin).href;
}
