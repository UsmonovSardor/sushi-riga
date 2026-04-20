import React, { useEffect, useState } from 'react';

export default function Notification({ message, onDone }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setShow(false); onDone?.(); }, 2000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return <div className="toast">✅ {message}</div>;
}
