// Bounded read-only metadata verification, no prices/payment/customer data.
import {handleHotelContent} from '../worker/hotel-content.js';
const response=await handleHotelContent(new Request('https://sorttrip.test/api/hotels/content?hotelId=lp1f707'),{...process.env,AI_LIMITER:{limit:async()=>({success:true})}});
const body=await response.json(),h=body.hotel;
console.info(JSON.stringify({httpStatus:response.status,hotelName:h?.name||null,photos:h?.images?.length||0,roomTypes:h?.rooms?.length||0,roomsWithPhotos:h?.rooms?.filter(r=>r.images.length)?.length||0,facilities:h?.facilities?.length||0,reviews:h?.reviews?.length||0,reviewsAvailable:body.reviewsAvailable===true,paymentRequests:0,bookingRequests:0,recordsChanged:false}));
if(!response.ok)process.exitCode=1;
