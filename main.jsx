import React from 'react';
import {createRoot} from 'react-dom/client';
import AuthApp from './app/auth-app';
import {brandName} from './app/brand';
import 'leaflet/dist/leaflet.css';
import './app/globals.css';
import './app/travel-refresh.css';
import './app/i18n';
createRoot(document.getElementById('root')).render(<AuthApp/>);
