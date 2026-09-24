import React from 'react';
import {createRoot} from 'react-dom/client';
import TravelApp from './app/travel-app';
import {brandName} from './app/brand';
import './app/globals.css';
document.title = `${brandName} · versi lokal`;
// Identitas demo lokal. Ini bukan login atau akun pengguna produksi.
const localUser={name:'Pengguna lokal',email:'demo@localhost'};
createRoot(document.getElementById('root')).render(<TravelApp user={localUser}/>);
