export function hotelCheckoutUrl(hotelId:string,checkin:string,checkout:string,people:number):string;
export function checkoutStartParams(params:URLSearchParams):{hotelId:string|null;checkin:string|null;checkout:string|null;people:number};
export function checkoutResumeId(params:URLSearchParams):string|null;
export function checkoutReturnUrl(origin:string,id:string):string;
