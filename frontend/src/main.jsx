// 🔥 MAINTENANCE MODE (FINAL, BUG-FREE)
const isMaintenance = import.meta.env.VITE_MAINTENANCE === 'true';
const isMaintenancePage = window.location.pathname === '/maintenance.html';

// ❗ Agar maintenance ON va biz maintenance sahifada EMAS bo‘lsak → redirect
if (isMaintenance && !isMaintenancePage) {
  window.location.replace('/maintenance.html');
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { startKeepAlive } from './utils/keepAlive.js';

// optional (agar ishlatayotgan bo‘lsang)
startKeepAlive();

// 🔥 APP RENDER
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
