import * as React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TooltipProvider } from '../components/ui/Tooltip';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Sidebar, TopBar, StatusBar, ChatPanel } from '../components/layout';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy load modules
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const NinjaShark = React.lazy(() => import('../pages/NinjaShark'));
const PowerShell = React.lazy(() => import('../pages/PowerShell'));
const RemoteAccess = React.lazy(() => import('../pages/RemoteAccess'));
const NetworkMap = React.lazy(() => import('../pages/NetworkMap'));
const Security = React.lazy(() => import('../pages/Security'));
const Azure = React.lazy(() => import('../pages/Azure'));
const AIManager = React.lazy(() => import('../pages/AIManager'));
const Ticketing = React.lazy(() => import('../pages/Ticketing'));
const Academy = React.lazy(() => import('../pages/Academy'));

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// Loading fallback
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-surface-hover" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-foreground-muted">Loading module...</p>
      </div>
    </div>
  );
}

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-1 overflow-hidden"
      >
        <React.Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<ErrorBoundary moduleName="Dashboard"><Dashboard /></ErrorBoundary>} />
            <Route path="/ninjashark" element={<ErrorBoundary moduleName="NinjaShark"><NinjaShark /></ErrorBoundary>} />
            <Route path="/powershell" element={<ErrorBoundary moduleName="PowerShell"><PowerShell /></ErrorBoundary>} />
            <Route path="/remote-access" element={<ErrorBoundary moduleName="RemoteAccess"><RemoteAccess /></ErrorBoundary>} />
            <Route path="/network-map" element={<ErrorBoundary moduleName="NetworkMap"><NetworkMap /></ErrorBoundary>} />
            <Route path="/security" element={<ErrorBoundary moduleName="Security"><Security /></ErrorBoundary>} />
            <Route path="/azure" element={<ErrorBoundary moduleName="Azure"><Azure /></ErrorBoundary>} />
            <Route path="/ai-manager" element={<ErrorBoundary moduleName="AIManager"><AIManager /></ErrorBoundary>} />
            <Route path="/ticketing" element={<ErrorBoundary moduleName="Ticketing"><Ticketing /></ErrorBoundary>} />
            <Route path="/academy" element={<ErrorBoundary moduleName="Academy"><Academy /></ErrorBoundary>} />
          </Routes>
        </React.Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

// Main layout
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B to toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
      // Ctrl+Shift+C to toggle chat
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setChatOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar
          onChatToggle={() => setChatOpen((prev) => !prev)}
          chatOpen={chatOpen}
        />

        {/* Content + Chat */}
        <div className="flex-1 flex overflow-hidden">
          {/* Page Content */}
          <AnimatedRoutes />

          {/* Chat Panel */}
          <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
        </div>

        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
}

// Root App component
export default function App() {
  return (
    <ErrorBoundary moduleName="Application Root">
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider delayDuration={300}>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
