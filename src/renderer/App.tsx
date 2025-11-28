import * as React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TooltipProvider } from '../components/ui/Tooltip';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Sidebar, TopBar, StatusBar, ChatPanel } from '../components/layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { prefetchModule, PerformanceMetrics } from '../lib/utils';

// Performance metrics instance
const perfMetrics = PerformanceMetrics.getInstance();

// Module import functions for prefetching
const moduleImports = {
  Dashboard: () => import('../pages/Dashboard'),
  NinjaShark: () => import('../pages/NinjaShark'),
  PowerShell: () => import('../pages/PowerShell'),
  RemoteAccess: () => import('../pages/RemoteAccess'),
  NetworkMap: () => import('../pages/NetworkMap'),
  Security: () => import('../pages/Security'),
  Azure: () => import('../pages/Azure'),
  AIManager: () => import('../pages/AIManager'),
  Ticketing: () => import('../pages/Ticketing'),
  Academy: () => import('../pages/Academy'),
};

// Lazy load modules with performance tracking
const Dashboard = React.lazy(() => {
  const start = performance.now();
  return moduleImports.Dashboard().then((mod) => {
    perfMetrics.record('module-load:Dashboard', performance.now() - start);
    return mod;
  });
});
const NinjaShark = React.lazy(() => {
  const start = performance.now();
  return moduleImports.NinjaShark().then((mod) => {
    perfMetrics.record('module-load:NinjaShark', performance.now() - start);
    return mod;
  });
});
const PowerShell = React.lazy(() => {
  const start = performance.now();
  return moduleImports.PowerShell().then((mod) => {
    perfMetrics.record('module-load:PowerShell', performance.now() - start);
    return mod;
  });
});
const RemoteAccess = React.lazy(() => {
  const start = performance.now();
  return moduleImports.RemoteAccess().then((mod) => {
    perfMetrics.record('module-load:RemoteAccess', performance.now() - start);
    return mod;
  });
});
const NetworkMap = React.lazy(() => {
  const start = performance.now();
  return moduleImports.NetworkMap().then((mod) => {
    perfMetrics.record('module-load:NetworkMap', performance.now() - start);
    return mod;
  });
});
const Security = React.lazy(() => {
  const start = performance.now();
  return moduleImports.Security().then((mod) => {
    perfMetrics.record('module-load:Security', performance.now() - start);
    return mod;
  });
});
const Azure = React.lazy(() => {
  const start = performance.now();
  return moduleImports.Azure().then((mod) => {
    perfMetrics.record('module-load:Azure', performance.now() - start);
    return mod;
  });
});
const AIManager = React.lazy(() => {
  const start = performance.now();
  return moduleImports.AIManager().then((mod) => {
    perfMetrics.record('module-load:AIManager', performance.now() - start);
    return mod;
  });
});
const Ticketing = React.lazy(() => {
  const start = performance.now();
  return moduleImports.Ticketing().then((mod) => {
    perfMetrics.record('module-load:Ticketing', performance.now() - start);
    return mod;
  });
});
const Academy = React.lazy(() => {
  const start = performance.now();
  return moduleImports.Academy().then((mod) => {
    perfMetrics.record('module-load:Academy', performance.now() - start);
    return mod;
  });
});

// Route to module mapping for prefetching adjacent modules
const routeModuleMap: Record<string, (keyof typeof moduleImports)[]> = {
  '/': ['NinjaShark', 'PowerShell', 'Academy'],
  '/ninjashark': ['Dashboard', 'Security', 'NetworkMap'],
  '/powershell': ['Dashboard', 'RemoteAccess', 'Security'],
  '/remote-access': ['PowerShell', 'NetworkMap'],
  '/network-map': ['Security', 'NinjaShark', 'RemoteAccess'],
  '/security': ['NinjaShark', 'NetworkMap', 'PowerShell'],
  '/azure': ['Ticketing', 'Dashboard'],
  '/ai-manager': ['Dashboard', 'Academy'],
  '/ticketing': ['Azure', 'Dashboard'],
  '/academy': ['Dashboard', 'AIManager'],
};

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

// Animated routes wrapper with prefetching
function AnimatedRoutes() {
  const location = useLocation();

  // Prefetch adjacent modules when route changes
  React.useEffect(() => {
    const modulesToPrefetch = routeModuleMap[location.pathname];
    if (modulesToPrefetch) {
      // Prefetch after a short delay to not interfere with current module load
      const timeoutId = setTimeout(() => {
        modulesToPrefetch.forEach((moduleName) => {
          prefetchModule(moduleImports[moduleName]);
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname]);

  // Track route transition time
  const transitionStart = React.useRef<number>(performance.now());
  React.useEffect(() => {
    const duration = performance.now() - transitionStart.current;
    perfMetrics.record('route-transition', duration);
    transitionStart.current = performance.now();
  }, [location.pathname]);

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
