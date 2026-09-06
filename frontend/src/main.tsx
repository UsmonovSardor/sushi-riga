// 🔥 MAINTENANCE MODE (FINAL, BUG-FREE)
const isMaintenance = import.meta.env.VITE_MAINTENANCE === 'true';
const isMaintenancePage = window.location.pathname === '/maintenance.html';

// ❗ Agar maintenance ON va biz maintenance sahifada EMAS bo'lsak → redirect
if (isMaintenance && !isMaintenancePage) {
  window.location.replace('/maintenance.html');
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';
import { startKeepAlive } from './utils/keepAlive.js';

// Error monitoring — no-op when VITE_SENTRY_DSN is unset (local dev, or before
// the DSN is configured in the deploy env), so nothing breaks without it.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.1,
    // Record a session replay only when an error happens (privacy + quota).
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

// optional (agar ishlatayotgan bo'lsang)
startKeepAlive();

// 🔥 APP RENDER
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
