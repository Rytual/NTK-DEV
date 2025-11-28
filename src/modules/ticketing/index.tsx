/**
 * Ninja Toolkit Prompt 9 - Ticketing Module Main Entry
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import TicketConsole from './components/TicketConsole';
import BoardView from './components/BoardView';
import CompanyBrowser from './components/CompanyBrowser';
import AttachmentViewer from './components/AttachmentViewer';
import OfflineIndicator from './components/OfflineIndicator';

// Backend modules
const ConnectWiseClient = require('./backend/connectwise-client');
const TicketManager = require('./backend/ticket-manager');
const CompanyManager = require('./backend/company-manager');
const ConfigurationManager = require('./backend/configuration-manager');
const AttachmentHandler = require('./backend/attachment-handler');
const OfflineQueueManager = require('./backend/offline-queue');
const WebhookHandler = require('./backend/webhook-handler');
const KageTicketAnalyzer = require('./backend/kage-ticket-analyzer');

// Export all modules
export {
  ConnectWiseClient,
  TicketManager,
  CompanyManager,
  ConfigurationManager,
  AttachmentHandler,
  OfflineQueueManager,
  WebhookHandler,
  KageTicketAnalyzer,
  TicketConsole,
  BoardView,
  CompanyBrowser,
  AttachmentViewer,
  OfflineIndicator
};

// Main App Component
const App: React.FC = () => {
  return (
    <div className="ninja-toolkit-ticketing">
      <h1>Ninja Toolkit - ConnectWise Ticketing Module</h1>
      <p>Prompt 9 v3 - Complete ConnectWise Manage Integration</p>
    </div>
  );
};

export default App;

// Render if running standalone
if (typeof window !== 'undefined') {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(<App />);
  }
}
