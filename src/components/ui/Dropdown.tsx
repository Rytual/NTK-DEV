import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface DropdownProps {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ open, onClose, trigger, children, align = 'right', className }: DropdownProps) {
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <div ref={dropdownRef} className="relative">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute top-full mt-2 z-50',
              'bg-background-secondary rounded-lg shadow-xl border border-border',
              'min-w-[280px] overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownHeaderProps {
  children: React.ReactNode;
}

export function DropdownHeader({ children }: DropdownHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-border">
      <h3 className="text-sm font-semibold text-foreground">{children}</h3>
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownItem({ children, onClick, className }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 text-left text-sm text-foreground-muted',
        'hover:bg-surface-hover hover:text-foreground transition-colors',
        'flex items-start gap-3',
        className
      )}
    >
      {children}
    </button>
  );
}

interface DropdownEmptyProps {
  children: React.ReactNode;
}

export function DropdownEmpty({ children }: DropdownEmptyProps) {
  return (
    <div className="px-4 py-8 text-center text-sm text-foreground-muted">
      {children}
    </div>
  );
}

interface DropdownFooterProps {
  children: React.ReactNode;
}

export function DropdownFooter({ children }: DropdownFooterProps) {
  return (
    <div className="px-4 py-2 border-t border-border bg-surface-hover/50">
      {children}
    </div>
  );
}
