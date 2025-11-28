import * as React from 'react';
import {
  Monitor,
  Plus,
  Trash2,
  Settings,
  Wifi,
  WifiOff,
  Server,
  Key,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ScrollArea } from '../components/ui/ScrollArea';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils';

// Session type
interface Session {
  id: string;
  name: string;
  host: string;
  port: number;
  type: 'ssh' | 'telnet' | 'serial';
  status: 'connected' | 'disconnected' | 'connecting';
  lastConnected?: string;
}

// Mock sessions
const mockSessions: Session[] = [
  { id: '1', name: 'Production Server', host: '192.168.1.10', port: 22, type: 'ssh', status: 'connected', lastConnected: '2 min ago' },
  { id: '2', name: 'Dev Server', host: '192.168.1.20', port: 22, type: 'ssh', status: 'disconnected', lastConnected: '1 hour ago' },
  { id: '3', name: 'Router Console', host: 'COM3', port: 9600, type: 'serial', status: 'disconnected', lastConnected: '3 days ago' },
  { id: '4', name: 'Legacy System', host: '10.0.0.50', port: 23, type: 'telnet', status: 'disconnected', lastConnected: '1 week ago' },
];

// Session card component
function SessionCard({
  session,
  onConnect,
  onDisconnect,
  onDelete,
  isSelected,
  onSelect
}: {
  session: Session;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const getTypeIcon = () => {
    switch (session.type) {
      case 'ssh': return <Key className="h-4 w-4" />;
      case 'telnet': return <Globe className="h-4 w-4" />;
      case 'serial': return <Server className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'secondary';
    }
  };

  return (
    <Card
      hover
      className={cn(
        'cursor-pointer transition-all',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              session.status === 'connected' ? 'bg-success/10 text-success' : 'bg-surface text-foreground-muted'
            )}>
              {session.status === 'connected' ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-medium">{session.name}</h3>
              <p className="text-sm text-foreground-muted font-mono">
                {session.host}:{session.port}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor() as any} className="text-xs">
                  {getTypeIcon()}
                  <span className="ml-1 uppercase">{session.type}</span>
                </Badge>
                {session.lastConnected && (
                  <span className="text-xs text-foreground-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.lastConnected}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getStatusColor() as any}>
              {session.status}
            </Badge>
            <div className="flex items-center gap-1">
              {session.status === 'connected' ? (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDisconnect(); }}>
                  <WifiOff className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onConnect(); }}>
                  <Wifi className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// New session form
function NewSessionForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = React.useState({
    name: '',
    host: '',
    port: '22',
    type: 'ssh' as const,
    username: '',
    password: ''
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>New Connection</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Session Name"
            placeholder="My Server"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium mb-1.5 block">Connection Type</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="ssh">SSH</option>
              <option value="telnet">Telnet</option>
              <option value="serial">Serial</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              label="Host / IP Address"
              placeholder="192.168.1.1"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            />
          </div>
          <Input
            label="Port"
            placeholder="22"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Username"
            placeholder="admin"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>
            <Wifi className="h-4 w-4 mr-2" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Terminal view for connected session
function SessionTerminal({ session }: { session: Session }) {
  return (
    <Card className="h-full">
      <CardHeader className="py-2 px-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="font-medium">{session.name}</span>
            <span className="text-sm text-foreground-muted">({session.host})</span>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-52px)]">
        <div className="h-full bg-[#0c0c0c] p-4 font-mono text-sm text-[#cccccc]">
          <p>Connected to {session.host}:{session.port}</p>
          <p className="text-success">Last login: Thu Nov 28 09:30:00 2025</p>
          <p>&nbsp;</p>
          <p className="text-[#ffff00]">[admin@{session.name.toLowerCase().replace(' ', '-')} ~]$</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Main RemoteAccess component
export default function RemoteAccess() {
  const [sessions, setSessions] = React.useState<Session[]>(mockSessions);
  const [selectedSession, setSelectedSession] = React.useState<string | null>(null);
  const [showNewForm, setShowNewForm] = React.useState(false);

  const selected = sessions.find(s => s.id === selectedSession);
  const connectedSession = sessions.find(s => s.status === 'connected');

  return (
    <div className="h-full flex">
      {/* Sessions List */}
      <div className="w-96 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Monitor className="h-6 w-6 text-primary" />
                Remote Access
              </h1>
              <p className="text-sm text-foreground-muted">SSH, Telnet & Serial connections</p>
            </div>
          </div>
          <Button className="w-full" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Connection
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {showNewForm && (
              <NewSessionForm onClose={() => setShowNewForm(false)} />
            )}
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isSelected={selectedSession === session.id}
                onSelect={() => setSelectedSession(session.id)}
                onConnect={() => {
                  setSessions(sessions.map(s =>
                    s.id === session.id ? { ...s, status: 'connected' as const } : s
                  ));
                }}
                onDisconnect={() => {
                  setSessions(sessions.map(s =>
                    s.id === session.id ? { ...s, status: 'disconnected' as const } : s
                  ));
                }}
                onDelete={() => {
                  setSessions(sessions.filter(s => s.id !== session.id));
                  if (selectedSession === session.id) setSelectedSession(null);
                }}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Warning */}
        <div className="p-4 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-foreground-muted">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
            <span>Serial port connections require the <code className="px-1 bg-surface rounded">serialport</code> module.</span>
          </div>
        </div>
      </div>

      {/* Terminal Area */}
      <div className="flex-1 p-4">
        {connectedSession ? (
          <SessionTerminal session={connectedSession} />
        ) : (
          <EmptyState
            icon={Monitor}
            title="No active connection"
            description="Select a saved session or create a new connection to get started"
            action={
              <Button onClick={() => setShowNewForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Connection
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
