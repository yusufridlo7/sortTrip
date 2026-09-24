import type {Trip} from './travel-data';
const key='langkah-local-trips-v1';
// Demo satu browser. Tidak terhubung database, akun, atau server produksi.
export async function localTrips(_url:string, options?:RequestInit):Promise<Response>{
 try {
  const trips:Trip[]=JSON.parse(localStorage.getItem(key)||'[]');
  if(!Array.isArray(trips))throw Error('Format simpanan lokal tidak valid.');
  if(!options?.method||options.method==='GET')return Response.json({trips});
  if(options.method!=='POST')return Response.json({error:'Metode tidak didukung.'},{status:405});
  const trip:Trip=JSON.parse(String(options.body));
  if(!trip||!Array.isArray(trip.items)||!trip.start)return Response.json({error:'Itinerary tidak valid.'},{status:400});
  const id=trip.id||crypto.randomUUID(),next={...trip,id},index=trips.findIndex(t=>t.id===id);
  if(index<0)trips.unshift(next);else trips[index]=next;
  localStorage.setItem(key,JSON.stringify(trips));return Response.json({id});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Gagal menyimpan di browser.'},{status:500});}
}
