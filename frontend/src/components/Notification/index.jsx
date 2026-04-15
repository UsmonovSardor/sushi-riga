import React, { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);
export const useNotif = () => useContext(Ctx);

export function NotifProvider({ children }) {
  const [notif, setNotif] = useState(null);
  const show = useCallback((text, type = 'success') => {
    setNotif({ text, type });
    setTimeout(() => setNotif(null), 3000);
  }, []);
  return <Ctx.Provider value={{ show }}>{children}<NotifDisplay notif={notif} /></Ctx.Provider>;
}

function NotifDisplay({ notif }) {
  if (!notif) return null;
  return (
    <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background: notif.type === 'success' ? '#222' : '#e31e24', color:'#fff', borderRadius:12, padding:'12px 20px', display:'flex', alignItems:'center', gap:10, fontWeight:600, zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,.25)', transition:'all .3s' }}>
      {notif.type === 'success' ? '✅' : '❌'} {notif.text}
    </div>
  );
}

export default function Notification() { return null; }
