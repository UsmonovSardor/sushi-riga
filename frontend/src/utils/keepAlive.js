const API = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';
if (typeof window !== 'undefined') {
  const ping = () => fetch(`${API}/health`).catch(() => {});
  ping();
  setInterval(ping, 8 * 60 * 1000);
}
