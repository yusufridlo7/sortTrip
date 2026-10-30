export const FRAME_LIMITS:{count:number;bytes:number;width:number;height:number;totalBody:number};
export function jpegDimensions(bytes:Uint8Array):{width:number;height:number};
export function preparedFrames(body:unknown):{frames:{seconds:number;image:string}[];text:string;durationSeconds:number};
