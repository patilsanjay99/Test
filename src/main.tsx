import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import 'react-datepicker/dist/react-datepicker.css';
import './index.css';

// Intercept fetch to override PUT and DELETE methods since IIS often blocks them
const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  value: async function(input: RequestInfo | URL, init?: RequestInit) {
    if (init && (init.method === 'PUT' || init.method === 'DELETE')) {
      const newHeaders = new Headers(init.headers);
      newHeaders.set('X-HTTP-Method-Override', init.method);
      init.headers = newHeaders;
      
      // Remove URL appending as it can trigger WAFs. We will rely entirely on X-HTTP-Method-Override header.
      init.method = 'POST';
    }
    return originalFetch.call(window, input, init);
  },
  writable: true,
  configurable: true
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for Progressive Web App (PWA) support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

