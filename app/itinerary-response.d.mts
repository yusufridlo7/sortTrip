export function itineraryResponse(response:Response,onProgress?:(stage:string)=>void):Promise<{status:number;ok:boolean;body:any}>;
