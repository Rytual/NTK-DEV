/**
 * Ninja Toolkit - Content Router Component
 * Center pane module loader with lazy loading and Suspense
 *
 * Features:
 * - React.lazy() for code splitting
 * - Suspense with shuriken loading fallback
 * - useTransition for <100ms module swaps
 * - Recharts support for data visualization
 * - Error boundaries for graceful failure
 * - Performance monitoring
 */

import React, { lazy, Suspense, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface ContentRouterProps {
  activeModule: string | null;
  onModuleChange: (moduleId: string) => void;
  isPending: boolean;
}

/**
 * Lazy-loaded module components
 * These will be code-split and loaded on demand
 */
const DashboardModule = lazy(() => import('../modules/Dashboard'));
const NinjaSharkModule = lazy(() => import('../modules/NinjaShark'));
const PowerShellModule = lazy(() => import('../modules/PowerShell'));
const RemoteAccessModule = lazy(() => import('../modules/RemoteAccess'));
const NetworkMapModule = lazy(() => import('../modules/NetworkMap'));
const SecurityModule = lazy(() => import('../modules/Security'));
const AzureModule = lazy(() => import('../modules/Azure'));
const AIManagerModule = lazy(() => import('../modules/AIManager'));
const ConnectWiseModule = lazy(() => import('../modules/ConnectWise'));
const TrainingModule = lazy(() => import('../modules/Training'));

/**
 * Shuriken Loading Fallback Component
 */
const ShurikenLoader: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-ninja-gray">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Spinning Shuriken */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="w-24 h-24 relative"
        >
          <svg viewBox="0 0 64 64" className="w-full h-full text-emerald-500">
            <defs>
              <linearGradient id="shurikenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#00ff88" />
              </linearGradient>
            </defs>
            <path
              fill="url(#shurikenGradient)"
              d="M32 8 L36 28 L56 24 L40 32 L56 40 L36 36 L32 56 L28 36 L8 40 L24 32 L8 24 L28 28 Z"
              filter="drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))"
            />
          </svg>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-emerald-400 font-medium text-lg">Loading module...</p>
          <p className="text-gray-500 text-sm mt-1">Preparing the blade</p>
        </motion.div>

        {/* Pulsing dots */}
        <motion.div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

/**
 * Empty State Component (no module selected)
 */
const EmptyState: React.FC<{ onModuleSelect: (id: string) => void }> = ({ onModuleSelect }) => {
  const quickActions = [
    { id: 'powershell', label: 'PowerShell Terminal', icon: '📜' },
    { id: 'ninjashark', label: 'Packet Analysis', icon: '🦈' },
    { id: 'security', label: 'Security Scan', icon: '🛡️' },
    { id: 'network-map', label: 'Network Mapping', icon: '🗺️' }
  ];

  return (
    <div className="flex-1 flex items-center justify-center bg-ninja-gray p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-block mb-4"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/50">
              <span className="text-6xl">忍</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Welcome, Shinobi
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-lg"
          >
            Select a module from the blade to begin your mission
          </motion.p>
        </div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4"
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              onClick={() => onModuleSelect(action.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-800 hover:bg-gray-700 border border-shadow-gray hover:border-emerald-600 rounded-lg p-6 text-left transition-all duration-200 group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <div className="text-white font-medium text-lg group-hover:text-emerald-400 transition-colors">
                {action.label}
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Feudal Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 text-center"
        >
          <blockquote className="text-emerald-400 italic text-sm font-mono">
            "The blade drawn • Ready to strike swiftly • Choose your path well"
          </blockquote>
          <p className="text-gray-600 text-xs mt-2">— Kage, AI Sensei</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

/**
 * Error Boundary Fallback
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ModuleErrorBoundary extends React.Component<
  { children: React.ReactNode; moduleId: string },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Module loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-ninja-gray p-8">
          <div className="max-w-lg text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Module Failed to Load</h2>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || 'An unknown error occurred'}
            </p>
            <div className="bg-gray-800 border border-red-600 rounded-lg p-4 text-left">
              <p className="text-red-400 text-sm font-mono">
                Module: {this.props.moduleId}
              </p>
              {this.state.error && (
                <pre className="text-xs text-gray-500 mt-2 overflow-auto">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-6 italic">
              🗡️ The blade has faltered. Return to the forge and try again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Content Router Component
 */
const ContentRouter: React.FC<ContentRouterProps> = ({
  activeModule,
  onModuleChange,
  isPending
}) => {
  /**
   * Get component for active module
   */
  const getModuleComponent = () => {
    if (!activeModule) {
      return <EmptyState onModuleSelect={onModuleChange} />;
    }

    switch (activeModule) {
      case 'home':
        return <DashboardModule />;
      case 'ninjashark':
        return <NinjaSharkModule />;
      case 'powershell':
        return <PowerShellModule />;
      case 'remote-access':
        return <RemoteAccessModule />;
      case 'network-map':
        return <NetworkMapModule />;
      case 'security':
        return <SecurityModule />;
      case 'azure':
        return <AzureModule />;
      case 'ai-manager':
        return <AIManagerModule />;
      case 'connectwise':
        return <ConnectWiseModule />;
      case 'training':
        return <TrainingModule />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-ninja-gray">
            <p className="text-gray-400">Module not found: {activeModule}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-ninja-gray relative overflow-hidden">
      {/* Pending Indicator */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent z-50"
          >
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Content with Suspense */}
      <ModuleErrorBoundary moduleId={activeModule || 'none'}>
        <Suspense fallback={<ShurikenLoader />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule || 'empty'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {getModuleComponent()}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </ModuleErrorBoundary>
    </div>
  );
};

export default ContentRouter;
