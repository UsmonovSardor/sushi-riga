const API = import.meta.env.VITE_API_URL || '';
if (API) {
  const ping = () => fetch(`${API}/health`).catch(() => {});
  ping();
  setInterval(ping, 10 * 60 * 1000);
}
