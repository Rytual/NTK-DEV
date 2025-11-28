import {
  LayoutDashboard,
  Network,
  Terminal,
  Globe,
  Map,
  Shield,
  Cloud,
  Brain,
  Ticket,
  GraduationCap,
  MessageSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  category: 'core' | 'network' | 'security' | 'integration' | 'ai';
  status: 'active' | 'beta' | 'coming-soon' | 'disabled';
  shortcut?: string;
}

export const MODULES: ModuleConfig[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'System overview and metrics',
    icon: LayoutDashboard,
    path: '/',
    category: 'core',
    status: 'active',
    shortcut: 'Ctrl+1',
  },
  {
    id: 'ninjashark',
    name: 'NinjaShark',
    description: 'Network packet capture and analysis',
    icon: Network,
    path: '/ninjashark',
    category: 'network',
    status: 'active',
    shortcut: 'Ctrl+2',
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    description: 'Terminal emulation with history',
    icon: Terminal,
    path: '/powershell',
    category: 'core',
    status: 'active',
    shortcut: 'Ctrl+3',
  },
  {
    id: 'remote-access',
    name: 'Remote Access',
    description: 'SSH and Telnet client',
    icon: Globe,
    path: '/remote-access',
    category: 'network',
    status: 'active',
    shortcut: 'Ctrl+4',
  },
  {
    id: 'network-map',
    name: 'Network Map',
    description: 'Infrastructure monitoring and topology',
    icon: Map,
    path: '/network-map',
    category: 'network',
    status: 'active',
    shortcut: 'Ctrl+5',
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Vulnerability scanning and compliance',
    icon: Shield,
    path: '/security',
    category: 'security',
    status: 'active',
    shortcut: 'Ctrl+6',
  },
  {
    id: 'azure',
    name: 'Azure / M365',
    description: 'Microsoft 365 and Azure administration',
    icon: Cloud,
    path: '/azure',
    category: 'integration',
    status: 'active',
    shortcut: 'Ctrl+7',
  },
  {
    id: 'ai-manager',
    name: 'AI Manager',
    description: 'Multi-provider AI management',
    icon: Brain,
    path: '/ai-manager',
    category: 'ai',
    status: 'active',
    shortcut: 'Ctrl+8',
  },
  {
    id: 'ticketing',
    name: 'Ticketing',
    description: 'ConnectWise PSA integration',
    icon: Ticket,
    path: '/ticketing',
    category: 'integration',
    status: 'active',
    shortcut: 'Ctrl+9',
  },
  {
    id: 'academy',
    name: 'Academy',
    description: 'Training and certification platform',
    icon: GraduationCap,
    path: '/academy',
    category: 'core',
    status: 'active',
    shortcut: 'Ctrl+0',
  },
];

export const CATEGORY_LABELS: Record<ModuleConfig['category'], string> = {
  core: 'Core',
  network: 'Network',
  security: 'Security',
  integration: 'Integrations',
  ai: 'AI & Automation',
};

export const STATUS_LABELS: Record<ModuleConfig['status'], string> = {
  active: 'Active',
  beta: 'Beta',
  'coming-soon': 'Coming Soon',
  disabled: 'Disabled',
};

export const APP_CONFIG = {
  name: 'Ninja Toolkit',
  version: '11.0.0',
  description: 'MSP Management Suite',
  tagline: 'Feudal Tokyo Dark Theme',
};

export const KEYBOARD_SHORTCUTS = {
  toggleSidebar: 'Ctrl+B',
  toggleTheme: 'Ctrl+Shift+T',
  openSearch: 'Ctrl+K',
  openChat: 'Ctrl+Shift+C',
  openSettings: 'Ctrl+,',
};
