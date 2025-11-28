import * as React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Monitor,
  Bell,
  MessageSquare,
  Command,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MODULES } from '../../lib/constants';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/Tooltip';
import { useTheme } from '../../contexts/ThemeContext';

interface TopBarProps {
  onChatToggle: () => void;
  chatOpen: boolean;
}

export function TopBar({ onChatToggle, chatOpen }: TopBarProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [searchValue, setSearchValue] = React.useState('');
  const [searchFocused, setSearchFocused] = React.useState(false);

  // Get current module info
  const currentModule = MODULES.find((m) => m.path === location.pathname);

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-background border-b border-border">
      {/* Left Section - Breadcrumb */}
      <div className="flex items-center gap-3">
        {currentModule && (
          <>
            <div className="flex items-center gap-2">
              <currentModule.icon className="w-5 h-5 text-primary" />
              <h1 className="font-semibold text-foreground">
                {currentModule.name}
              </h1>
            </div>
            {currentModule.status !== 'active' && (
              <Badge variant="warning" className="text-2xs">
                {currentModule.status === 'beta' ? 'Beta' : 'Coming Soon'}
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <SearchInput
            placeholder="Search modules, commands, settings..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClear={() => setSearchValue('')}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'transition-all duration-200',
              searchFocused ? 'ring-2 ring-primary' : ''
            )}
          />
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 text-foreground-muted">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-surface-hover px-1.5 text-2xs">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              className="relative"
            >
              <ThemeIcon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* AI Chat Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={chatOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={onChatToggle}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {chatOpen ? 'Close AI Chat' : 'Open AI Chat'}
            <kbd className="ml-2 px-1.5 py-0.5 text-2xs bg-surface-hover rounded">
              Ctrl+Shift+C
            </kbd>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-2" />

        {/* User Menu */}
        <button className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors">
          <Avatar size="sm">
            <AvatarImage src="" alt="User" />
            <AvatarFallback>NT</AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">Ninja User</span>
            <span className="text-2xs text-foreground-muted">Administrator</span>
          </div>
        </button>
      </div>
    </header>
  );
}
