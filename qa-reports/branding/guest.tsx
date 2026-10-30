// Local QA entry only: real guest components, without AuthApp's account metadata sync.
// Vite production build does not include this unlinked review entry.
import React from 'react';
import {createRoot} from 'react-dom/client';
import TravelApp from '../../app/travel-app';
import '../../app/globals.css';
import '../../app/travel-refresh.css';
import '../../app/brand-theme.css';
createRoot(document.getElementById('root')!).render(<TravelApp user={null} onLogout={()=>{}}/>);
