export function hotelCheckoutUrl(hotelId:string,checkin:string,checkout:string,people:number,context?:{tripId:string;itemId:string}):string;
export function checkoutStartParams(params:URLSearchParams):{hotelId:string|null;checkin:string|null;checkout:string|null;people:number;tripId?:string;itemId?:string};
export function checkoutResumeId(params:URLSearchParams):string|null;
export function checkoutReturnUrl(origin:string,id:string):string;
