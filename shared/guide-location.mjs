// Foreground lifecycle only; geolocation is supplied by the browser, never a model tool.
export function watchGuideLocation(geolocation,onPosition,onUnavailable){
 if(!geolocation){onUnavailable();return ()=>{};}
 let stopped=false;
 const id=geolocation.watchPosition(p=>{if(!stopped)onPosition({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,timestamp:p.timestamp});},()=>{if(!stopped)onUnavailable();},{enableHighAccuracy:false,maximumAge:60000,timeout:15000});
 return ()=>{if(!stopped){stopped=true;geolocation.clearWatch(id);}};
}
