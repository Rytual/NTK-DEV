/**
 * Ninja Toolkit v11 - React Entry Point
 * Bootstrap file for the renderer process
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element. Check index.html for <div id="root"></div>');
}

// Create React 19 root and render
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log startup
console.log('[Renderer] Ninja Toolkit v11 renderer initialized');
