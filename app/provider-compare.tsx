'use client';
import {useState} from 'react';
import {Trip,money,flightBookingUrl} from './travel-data';
import {providerOffers,selectProvider} from './provider-data';
import {Choice} from './flight-search';
export default function ProviderCompare({trip,onChange,allowItinerary=true}:{trip:Trip;onChange:(t:Trip)=>void;allowItinerary?:boolean}){
 const [sort,setSort]=useState('price');const item=trip.items.find(x=>x.category==='Pesawat');if(!item||!trip.flight)return null;
 const validRows=providerOffers(trip);const cheapest=validRows[0].total;if(sort==='name')validRows.sort((a,b)=>a.name.localeCompare(b.name));
 return <section className="city-planner"><div className="city-planner-heading"><div><h2>Harga di platform pemesanan</h2><p>Penerbangan yang sama · {trip.journey==='oneway'?'sekali jalan':'PP'} / orang · seluruh angka contoh, bukan penawaran penyedia.</p></div><Choice label="Urutkan penyedia" value={sort} onChange={setSort} options={[["price","Total termurah"],["name","Nama platform"]]}/></div><div className="provider-list">{validRows.map(r=><div className="provider-row" key={r.name}><div><strong>{r.name}</strong>{r.price+r.fee===cheapest&&<small>Termurah dalam simulasi</small>}<small>Tiket {money(r.price)} + biaya contoh {money(r.fee)}</small></div><strong>{money(r.price+r.fee)}</strong>{allowItinerary&&<button className="secondary" disabled={item.paid} onClick={()=>onChange(selectProvider(trip,r))}>Susun itinerary</button>}<a className="item-booking" href={r.url} target="_blank" rel="noreferrer">Beli langsung ↗</a></div>)}</div><p className="inline-note">Pilihan ini masih berupa simulasi. Bagasi, pajak, refund, dan biaya pembayaran aktual harus diverifikasi sebelum perbandingan final. Traveloka meneruskan rute dan tanggal; penyedia lain masih membuka halaman pencarian umum, belum deep link.</p></section>
}
