import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Expose React for remote ESM apps that may reference global React
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).React = React;


