const normalize=value=>String(value||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const aliases=item=>[item.title,item.location].filter(Boolean).flatMap(value=>[normalize(value),normalize(value.replace(/\([^)]*\)/g,''))]).filter(value=>value.length>=8&&value.split(' ').length>=2);
const matches=(place,item)=>aliases(item).some(alias=>normalize(place)===alias);

// Validate order, not an invented journey duration. Provider-backed duration
// checks remain separate; unknown travel times may never be called feasible.
export function validateTransferOrder(activities){
 for(const transfer of activities.filter(item=>item.category==='Transfer')){
  const visits=activities.filter(item=>item.day===transfer.day&&item.category==='Wisata');
  const origins=visits.filter(item=>matches(transfer.fromPlace,item));
  const destinations=visits.filter(item=>matches(transfer.toPlace,item));
  if(origins.length&&origins.every(item=>item.time>transfer.time)||destinations.length&&destinations.every(item=>item.time<=transfer.time))throw Error('Urutan perpindahan tidak sesuai kunjungan.');
 }
}
