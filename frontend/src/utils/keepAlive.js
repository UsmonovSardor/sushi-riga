const API = import.meta.env.VITE_API_URL || 'https://sushi-riga-api-production-7b54.up.railway.app';

// Warm up the backend immediately and every 4 minutes to prevent cold starts
export function startKeepAlive() {
  const ping = () => fetch(`${API}/health`, { method:'GET', cache:'no-cache' }).catch(()=>{});
  ping(); // immediate on load
  setInterval(ping, 4 * 60 * 1000); // every 4 minutes
}
