export function watchGuideLocation(geolocation:Geolocation|undefined,onPosition:(p:{lat:number;lng:number;accuracy:number;timestamp:number})=>void,onUnavailable:()=>void):()=>void;
