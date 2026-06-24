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
      
      // Also append to URL to bypass strict WAF rules
      if (typeof input === 'string') {
        const separator = input.includes('?') ? '&' : '?';
        input = input + separator + '_method=' + init.method;
      } else if (input instanceof URL) {
        input.searchParams.set('_method', init.method);
      } else if (input instanceof Request) {
        // We can't easily modify a Request object's URL without recreating it, 
        // but fetch(Request) usually doesn't happen with our API calls
      }
      
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
