import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import 'react-datepicker/dist/react-datepicker.css';
import './index.css';

// Intercept fetch to override PUT and DELETE methods since IIS often blocks them
const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  if (init && (init.method === 'PUT' || init.method === 'DELETE')) {
    init.headers = {
      ...init.headers,
      'X-HTTP-Method-Override': init.method
    };
    init.method = 'POST';
  }
  return originalFetch.apply(this, [input, init] as any);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
