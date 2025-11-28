import * as React from 'react';
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ScrollArea } from '../components/ui/ScrollArea';
import { cn } from '../lib/utils';

// Terminal output line type
interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

// Mock terminal history
const mockHistory: TerminalLine[] = [
  { id: 1, type: 'output', content: 'Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n', timestamp: new Date() },
  { id: 2, type: 'output', content: 'Try the new cross-platform PowerShell https://aka.ms/pscore6\n', timestamp: new Date() },
  { id: 3, type: 'input', content: 'PS C:\\Dev\\NinjaToolKit> Get-Process | Select-Object -First 5', timestamp: new Date() },
  { id: 4, type: 'output', content: `
Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
-------  ------    -----      -----     ------     --  -- -----------
    523      28    52348      71248      12.45   1234   1 chrome
    234      15    23456      34567       3.21   2345   1 code
    156      12    12345      23456       1.45   3456   1 explorer
    345      18    34567      45678       5.67   4567   1 node
     89       8     8901      12345       0.89   5678   1 powershell
`, timestamp: new Date() },
  { id: 5, type: 'input', content: 'PS C:\\Dev\\NinjaToolKit> Get-Service | Where-Object {$_.Status -eq "Running"} | Measure-Object', timestamp: new Date() },
  { id: 6, type: 'output', content: `
Count    : 156
Average  :
Sum      :
Maximum  :
Minimum  :
Property :
`, timestamp: new Date() },
];

// Tab interface
interface TerminalTab {
  id: string;
  title: string;
  lines: TerminalLine[];
}

// Terminal Tab Bar
function TabBar({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
  onNewTab
}: {
  tabs: TerminalTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
}) {
  return (
    <div className="flex items-center gap-1 p-2 bg-background-secondary border-b border-border">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors group',
            activeTab === tab.id
              ? 'bg-surface text-foreground'
              : 'text-foreground-muted hover:bg-surface-hover'
          )}
          onClick={() => onTabChange(tab.id)}
        >
          <TerminalIcon className="h-3.5 w-3.5" />
          <span className="text-sm">{tab.title}</span>
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNewTab}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Terminal Output
function TerminalOutput({ lines }: { lines: TerminalLine[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <ScrollArea className="flex-1 bg-[#0c0c0c]" ref={scrollRef}>
      <div className="p-4 font-mono text-sm">
        {lines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'whitespace-pre-wrap',
              line.type === 'input' && 'text-[#ffff00]',
              line.type === 'output' && 'text-[#cccccc]',
              line.type === 'error' && 'text-[#ff6b6b]'
            )}
          >
            {line.content}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Terminal Input
function TerminalInput({
  onSubmit,
  disabled
}: {
  onSubmit: (command: string) => void;
  disabled?: boolean;
}) {
  const [command, setCommand] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onSubmit(command);
      setCommand('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center bg-[#0c0c0c] border-t border-border p-2">
      <span className="text-[#ffff00] font-mono text-sm mr-2">PS&gt;</span>
      <input
        ref={inputRef}
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        disabled={disabled}
        className={cn(
          'flex-1 bg-transparent text-[#cccccc] font-mono text-sm outline-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        placeholder={disabled ? 'Terminal not available...' : 'Enter command...'}
        autoFocus
      />
    </form>
  );
}

// Main PowerShell component
export default function PowerShell() {
  const [tabs, setTabs] = React.useState<TerminalTab[]>([
    { id: '1', title: 'PowerShell 1', lines: mockHistory }
  ]);
  const [activeTab, setActiveTab] = React.useState('1');
  const [isMaximized, setIsMaximized] = React.useState(false);

  const currentTab = tabs.find(t => t.id === activeTab);

  const handleNewTab = () => {
    const newId = String(Date.now());
    setTabs([...tabs, {
      id: newId,
      title: `PowerShell ${tabs.length + 1}`,
      lines: [{ id: 1, type: 'output', content: 'Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n', timestamp: new Date() }]
    }]);
    setActiveTab(newId);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter(t => t.id !== id);
      setTabs(newTabs);
      if (activeTab === id) {
        setActiveTab(newTabs[0].id);
      }
    }
  };

  const handleCommand = (command: string) => {
    setTabs(tabs.map(tab => {
      if (tab.id === activeTab) {
        const newLines = [
          ...tab.lines,
          { id: Date.now(), type: 'input' as const, content: `PS C:\\Dev\\NinjaToolKit> ${command}`, timestamp: new Date() },
          { id: Date.now() + 1, type: 'output' as const, content: `Command "${command}" executed (mock output)\n`, timestamp: new Date() }
        ];
        return { ...tab, lines: newLines };
      }
      return tab;
    }));
  };

  return (
    <div className={cn(
      'h-full flex flex-col',
      isMaximized && 'fixed inset-0 z-50 bg-background'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <TerminalIcon className="h-6 w-6 text-primary" />
            PowerShell Terminal
          </h1>
          <p className="text-sm text-foreground-muted">Interactive command-line interface</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)}>
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onTabClose={handleCloseTab}
        onNewTab={handleNewTab}
      />

      {/* Terminal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentTab && <TerminalOutput lines={currentTab.lines} />}
        <TerminalInput onSubmit={handleCommand} disabled />
      </div>

      {/* Warning */}
      <Card className="m-4 border-warning/50 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Limited Functionality</p>
              <p className="text-sm text-foreground-muted mt-1">
                Full terminal emulation requires the native <code className="px-1.5 py-0.5 bg-surface rounded">node-pty</code> module.
                The display above shows mock output for UI demonstration. Commands are not actually executed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
