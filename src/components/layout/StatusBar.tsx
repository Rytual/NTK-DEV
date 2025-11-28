import * as React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  HardDrive,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatBytes } from '../../lib/utils';
import { MODULES } from '../../lib/constants';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className }: StatusBarProps) {
  const location = useLocation();
  const [time, setTime] = React.useState(new Date());
  const [memoryUsage, setMemoryUsage] = React.useState(0);
  const [ipcStatus, setIpcStatus] = React.useState<'connected' | 'disconnected' | 'error'>('connected');

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor memory usage
  React.useEffect(() => {
    const updateMemory = () => {
      if ((performance as any).memory) {
        setMemoryUsage((performance as any).memory.usedJSHeapSize);
      }
    };
    updateMemory();
    const timer = setInterval(updateMemory, 5000);
    return () => clearInterval(timer);
  }, []);

  // Get current module
  const currentModule = MODULES.find((m) => m.path === location.pathname);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <footer
      className={cn(
        'flex items-center justify-between h-7 px-3 bg-background-secondary border-t border-border text-xs',
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Active Module */}
        {currentModule && (
          <div className="flex items-center gap-1.5 text-foreground-muted">
            <currentModule.icon className="w-3.5 h-3.5" />
            <span>{currentModule.name}</span>
          </div>
        )}

        {/* IPC Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-foreground-muted">
              {ipcStatus === 'connected' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-success" />
                  <span className="text-success">IPC Connected</span>
                </>
              ) : ipcStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-destructive">IPC Error</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-warning" />
                  <span className="text-warning">IPC Disconnected</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Inter-Process Communication Status
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Center Section - Notifications */}
      <div className="flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-foreground-muted animate-pulse" />
        <span className="text-foreground-muted">Ready</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Memory Usage */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-foreground-muted">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{formatBytes(memoryUsage)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Memory Usage</TooltipContent>
        </Tooltip>

        {/* Platform */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-foreground-muted">
              <Cpu className="w-3.5 h-3.5" />
              <span>Electron</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Platform: Electron + React</TooltipContent>
        </Tooltip>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-foreground-muted">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{formatTime(time)}</span>
        </div>
      </div>
    </footer>
  );
}
