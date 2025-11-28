/**
 * Kage Forge Renderer Entry Point
 * @version 8.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../components/App';

// Initialize React application
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hot Module Replacement (HMR)
if (module.hot) {
  module.hot.accept('../components/App', () => {
    const NextApp = require('../components/App').default;
    root.render(
      <React.StrictMode>
        <NextApp />
      </React.StrictMode>
    );
  });
}
