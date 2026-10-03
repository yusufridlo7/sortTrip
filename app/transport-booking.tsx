import {useState} from 'react';
import {transportLink,transportAffiliateHome} from './transport-affiliate.mjs';
export default function TransportBooking({from,to,date,people}:{from:string;to:string;date:string;people:number}){
 const [open,setOpen]=useState(false);
 const url=transportLink(from,to,date,people);
 return <div className="transport-booking"><button type="button" className="secondary" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'Tutup pilihan':'Lihat transportasi'}</button>{open&&<div className="transport-booking-details"><strong>Pemesanan melalui affiliate 12Go</strong><p>{url?`Tanggal ${date} · ${people} dewasa. Rute dan tanggal diteruskan ke pencarian. Pilih moda dan jadwal yang tersedia di halaman pemesanan.`:'Tautan langsung untuk rute ini belum tersedia. Cari kota asal, tujuan, tanggal, dan penumpang di halaman pemesanan.'}</p><a className="primary" href={url||transportAffiliateHome} target="_blank" rel="noopener noreferrer sponsored">{url?'Lihat jadwal & harga':'Buka pencarian transportasi'} ↗</a><p className="inline-note">Harga akhir dan ketersediaan diperiksa sebelum pembayaran. Jika bepergian dengan anak, sesuaikan kategori penumpang. Kami dapat menerima komisi dari pemesanan yang memenuhi syarat.</p></div>}</div>;
}
