import React from 'react';
import {createRoot} from 'react-dom/client';
import AuthApp from './app/auth-app';
import {brandName} from './app/brand';
import './app/globals.css';
document.title = `${brandName} · versi lokal`;
createRoot(document.getElementById('root')).render(<AuthApp/>);
