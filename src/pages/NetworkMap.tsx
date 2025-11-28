import * as React from 'react';
import {
  Network,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Download,
  Server,
  Router,
  Monitor,
  Wifi,
  HardDrive,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { ScrollArea } from '../components/ui/ScrollArea';
import { cn } from '../lib/utils';

// Device type
interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  mac: string;
  type: 'server' | 'router' | 'switch' | 'workstation' | 'printer' | 'wireless';
  status: 'online' | 'offline' | 'warning';
  vendor?: string;
  lastSeen: string;
  ports?: number[];
}

// Mock devices
const mockDevices: NetworkDevice[] = [
  { id: '1', name: 'Core-Router-01', ip: '192.168.1.1', mac: '00:1A:2B:3C:4D:5E', type: 'router', status: 'online', vendor: 'Cisco', lastSeen: 'Now', ports: [22, 80, 443] },
  { id: '2', name: 'Main-Switch-01', ip: '192.168.1.2', mac: '00:2B:3C:4D:5E:6F', type: 'switch', status: 'online', vendor: 'Ubiquiti', lastSeen: 'Now', ports: [22, 80] },
  { id: '3', name: 'DC-Server-01', ip: '192.168.1.10', mac: '00:3C:4D:5E:6F:70', type: 'server', status: 'online', vendor: 'Dell', lastSeen: 'Now', ports: [22, 80, 443, 3389] },
  { id: '4', name: 'File-Server-01', ip: '192.168.1.11', mac: '00:4D:5E:6F:70:81', type: 'server', status: 'online', vendor: 'HP', lastSeen: 'Now', ports: [22, 445, 3389] },
  { id: '5', name: 'Workstation-01', ip: '192.168.1.100', mac: '00:5E:6F:70:81:92', type: 'workstation', status: 'online', vendor: 'Dell', lastSeen: '2 min ago' },
  { id: '6', name: 'Workstation-02', ip: '192.168.1.101', mac: '00:6F:70:81:92:A3', type: 'workstation', status: 'warning', vendor: 'Lenovo', lastSeen: '5 min ago' },
  { id: '7', name: 'Printer-Office', ip: '192.168.1.200', mac: '00:70:81:92:A3:B4', type: 'printer', status: 'online', vendor: 'HP', lastSeen: 'Now', ports: [9100] },
  { id: '8', name: 'WiFi-AP-01', ip: '192.168.1.250', mac: '00:81:92:A3:B4:C5', type: 'wireless', status: 'online', vendor: 'Ubiquiti', lastSeen: 'Now', ports: [22, 80] },
  { id: '9', name: 'Old-Server', ip: '192.168.1.50', mac: '00:92:A3:B4:C5:D6', type: 'server', status: 'offline', vendor: 'Dell', lastSeen: '3 days ago' },
];

// Device icon component
function DeviceIcon({ type, status }: { type: NetworkDevice['type']; status: NetworkDevice['status'] }) {
  const iconProps = { className: 'h-6 w-6' };

  const getIcon = () => {
    switch (type) {
      case 'server': return <Server {...iconProps} />;
      case 'router': return <Router {...iconProps} />;
      case 'switch': return <Network {...iconProps} />;
      case 'workstation': return <Monitor {...iconProps} />;
      case 'printer': return <Printer {...iconProps} />;
      case 'wireless': return <Wifi {...iconProps} />;
      default: return <HardDrive {...iconProps} />;
    }
  };

  return (
    <div className={cn(
      'p-3 rounded-xl',
      status === 'online' && 'bg-success/10 text-success',
      status === 'warning' && 'bg-warning/10 text-warning',
      status === 'offline' && 'bg-danger/10 text-danger'
    )}>
      {getIcon()}
    </div>
  );
}

// Network visualization (simplified)
function NetworkVisualization({ devices }: { devices: NetworkDevice[] }) {
  return (
    <div className="relative h-full bg-background-secondary rounded-lg overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Center hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Router in center */}
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
            <Router className="h-8 w-8 text-primary" />
          </div>

          {/* Connection lines and devices */}
          {devices.slice(0, 8).map((device, i) => {
            const angle = (i * 360 / 8) * (Math.PI / 180);
            const radius = 150;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <React.Fragment key={device.id}>
                {/* Connection line */}
                <svg
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  width={radius * 2 + 50}
                  height={radius * 2 + 50}
                  style={{ zIndex: 0 }}
                >
                  <line
                    x1={radius + 25}
                    y1={radius + 25}
                    x2={radius + 25 + x}
                    y2={radius + 25 + y}
                    stroke={device.status === 'online' ? 'var(--success)' : device.status === 'warning' ? 'var(--warning)' : 'var(--danger)'}
                    strokeWidth="2"
                    strokeDasharray={device.status === 'offline' ? '5,5' : undefined}
                    opacity="0.5"
                  />
                </svg>

                {/* Device node */}
                <div
                  className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
                  style={{
                    left: x,
                    top: y,
                    zIndex: 1
                  }}
                  title={`${device.name}\n${device.ip}`}
                >
                  <div className={cn(
                    'w-full h-full rounded-full flex items-center justify-center border-2',
                    device.status === 'online' && 'bg-success/10 border-success text-success',
                    device.status === 'warning' && 'bg-warning/10 border-warning text-warning',
                    device.status === 'offline' && 'bg-danger/10 border-danger text-danger'
                  )}>
                    <DeviceIcon type={device.type} status={device.status} />
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <Button variant="outline" size="icon">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-foreground-muted mb-2">Status</p>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span>Online</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-danger" />
          <span>Offline</span>
        </div>
      </div>
    </div>
  );
}

// Device list item
function DeviceListItem({ device, isSelected, onSelect }: {
  device: NetworkDevice;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-primary/10' : 'hover:bg-surface-hover'
      )}
      onClick={onSelect}
    >
      <DeviceIcon type={device.type} status={device.status} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{device.name}</p>
        <p className="text-sm text-foreground-muted font-mono">{device.ip}</p>
      </div>
      <div className="flex items-center gap-1">
        {device.status === 'online' && <CheckCircle2 className="h-4 w-4 text-success" />}
        {device.status === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
        {device.status === 'offline' && <XCircle className="h-4 w-4 text-danger" />}
      </div>
    </div>
  );
}

// Device details panel
function DeviceDetails({ device }: { device: NetworkDevice | null }) {
  if (!device) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-muted">
        Select a device to view details
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <DeviceIcon type={device.type} status={device.status} />
        <div>
          <h3 className="font-bold">{device.name}</h3>
          <Badge variant={device.status === 'online' ? 'success' : device.status === 'warning' ? 'warning' : 'danger'}>
            {device.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground-muted">IP Address</span>
          <span className="font-mono">{device.ip}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground-muted">MAC Address</span>
          <span className="font-mono">{device.mac}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground-muted">Type</span>
          <span className="capitalize">{device.type}</span>
        </div>
        {device.vendor && (
          <div className="flex justify-between">
            <span className="text-foreground-muted">Vendor</span>
            <span>{device.vendor}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-foreground-muted">Last Seen</span>
          <span>{device.lastSeen}</span>
        </div>
        {device.ports && device.ports.length > 0 && (
          <div>
            <span className="text-foreground-muted block mb-2">Open Ports</span>
            <div className="flex flex-wrap gap-1">
              {device.ports.map(port => (
                <Badge key={port} variant="secondary" className="font-mono">{port}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main NetworkMap component
export default function NetworkMap() {
  const [devices] = React.useState<NetworkDevice[]>(mockDevices);
  const [selectedDevice, setSelectedDevice] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isScanning, setIsScanning] = React.useState(false);

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ip.includes(searchQuery)
  );

  const selected = devices.find(d => d.id === selectedDevice) || null;

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    warning: devices.filter(d => d.status === 'warning').length,
    offline: devices.filter(d => d.status === 'offline').length,
  };

  return (
    <div className="h-full flex">
      {/* Device List Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              Network Map
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsScanning(true)}
              disabled={isScanning}
            >
              <RefreshCw className={cn('h-4 w-4', isScanning && 'animate-spin')} />
            </Button>
          </div>
          <SearchInput
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 p-4 border-b border-border">
          <div className="text-center">
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-xs text-foreground-muted">Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-success">{stats.online}</p>
            <p className="text-xs text-foreground-muted">Online</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-warning">{stats.warning}</p>
            <p className="text-xs text-foreground-muted">Warning</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-danger">{stats.offline}</p>
            <p className="text-xs text-foreground-muted">Offline</p>
          </div>
        </div>

        {/* Device List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredDevices.map(device => (
              <DeviceListItem
                key={device.id}
                device={device}
                isSelected={selectedDevice === device.id}
                onSelect={() => setSelectedDevice(device.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Network Visualization */}
        <div className="flex-1 p-4">
          <NetworkVisualization devices={devices} />
        </div>
      </div>

      {/* Details Panel */}
      <div className="w-72 border-l border-border p-4">
        <h2 className="font-bold mb-4">Device Details</h2>
        <DeviceDetails device={selected} />
      </div>
    </div>
  );
}
