import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MODULES, CATEGORY_LABELS, APP_CONFIG, type ModuleConfig } from '../../lib/constants';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { ScrollArea } from '../ui/ScrollArea';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const sidebarVariants = {
  expanded: { width: 280 },
  collapsed: { width: 72 },
};

const logoVariants = {
  expanded: { opacity: 1, x: 0 },
  collapsed: { opacity: 0, x: -20 },
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  // Group modules by category
  const groupedModules = React.useMemo(() => {
    const groups: Record<string, ModuleConfig[]> = {};
    MODULES.forEach((module) => {
      if (!groups[module.category]) {
        groups[module.category] = [];
      }
      groups[module.category].push(module);
    });
    return groups;
  }, []);

  return (
    <motion.aside
      initial={false}
      animate={collapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-background-secondary border-r border-border relative z-30"
    >
      {/* Logo Section */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-glow">
            <span className="text-xl font-bold text-white">N</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
              >
                <span className="font-bold text-foreground whitespace-nowrap">
                  {APP_CONFIG.name}
                </span>
                <span className="text-2xs text-foreground-muted whitespace-nowrap">
                  v{APP_CONFIG.version}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-6">
          {Object.entries(groupedModules).map(([category, modules]) => (
            <div key={category}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-2 text-xs font-semibold text-foreground-muted uppercase tracking-wider"
                  >
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                  </motion.h3>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {modules.map((module) => (
                  <NavItem
                    key={module.id}
                    module={module}
                    collapsed={collapsed}
                    isActive={location.pathname === module.path}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <NavItemButton
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
          onClick={() => {}}
        />
        <NavItemButton
          icon={HelpCircle}
          label="Help & Support"
          collapsed={collapsed}
          onClick={() => {}}
        />
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-surface-hover"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </motion.aside>
  );
}

interface NavItemProps {
  module: ModuleConfig;
  collapsed: boolean;
  isActive: boolean;
}

function NavItem({ module, collapsed, isActive }: NavItemProps) {
  const Icon = module.icon;

  const content = (
    <NavLink
      to={module.path}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <Icon
        className={cn(
          'flex-shrink-0 w-5 h-5 transition-colors',
          isActive ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground'
        )}
      />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 text-sm font-medium truncate"
          >
            {module.name}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && module.status !== 'active' && (
        <Badge variant={module.status === 'beta' ? 'warning' : 'secondary'} className="text-2xs">
          {module.status === 'beta' ? 'Beta' : 'Soon'}
        </Badge>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {module.name}
          {module.shortcut && (
            <kbd className="ml-2 px-1.5 py-0.5 text-2xs bg-surface-hover rounded">
              {module.shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

interface NavItemButtonProps {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  onClick: () => void;
}

function NavItemButton({ icon: Icon, label, collapsed, onClick }: NavItemButtonProps) {
  const content = (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all duration-200"
    >
      <Icon className="flex-shrink-0 w-5 h-5" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
