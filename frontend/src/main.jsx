 if (import.meta.env.VITE_MAINTENANCE === 'true') {
  window.location.href = '/maintenance.html';
}  
import React from 'react' 
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { startKeepAlive } from './utils/keepAlive.js'

startKeepAlive();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
