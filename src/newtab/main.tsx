import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '../styles/index.css';

declare global {
  interface Window {
    __NEBULA_DEV__: boolean;
  }
  interface ImportMetaEnv {
    readonly DEV: boolean;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

if (import.meta.env.DEV) {
  window.__NEBULA_DEV__ = true;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);