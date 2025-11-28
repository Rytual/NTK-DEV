import * as React from 'react';
import {
  Play,
  Square,
  Download,
  Filter,
  RefreshCw,
  Wifi,
  AlertTriangle,
  Activity,
  Clock,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { ScrollArea } from '../components/ui/ScrollArea';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils';

// Mock packet data
const mockPackets = [
  { id: 1, time: '00:00:01.234', source: '192.168.1.100', dest: '8.8.8.8', protocol: 'DNS', length: 74, info: 'Standard query A google.com' },
  { id: 2, time: '00:00:01.456', source: '8.8.8.8', dest: '192.168.1.100', protocol: 'DNS', length: 90, info: 'Standard query response A' },
  { id: 3, time: '00:00:02.123', source: '192.168.1.100', dest: '142.250.80.46', protocol: 'TCP', length: 66, info: '54321 → 443 [SYN]' },
  { id: 4, time: '00:00:02.234', source: '142.250.80.46', dest: '192.168.1.100', protocol: 'TCP', length: 66, info: '443 → 54321 [SYN, ACK]' },
  { id: 5, time: '00:00:02.345', source: '192.168.1.100', dest: '142.250.80.46', protocol: 'TLS', length: 583, info: 'Client Hello' },
];

// Stats component
function CaptureStats() {
  const stats = [
    { label: 'Packets Captured', value: '1,247', icon: Database },
    { label: 'Data Rate', value: '2.4 MB/s', icon: Activity },
    { label: 'Duration', value: '00:05:32', icon: Clock },
    { label: 'Anomalies', value: '3', icon: AlertTriangle, alert: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                stat.alert ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
              )}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-foreground-muted">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Packet table component
function PacketTable({ packets, selectedId, onSelect }: {
  packets: typeof mockPackets;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'TCP': return 'default';
      case 'UDP': return 'info';
      case 'DNS': return 'success';
      case 'TLS': return 'warning';
      case 'HTTP': return 'primary';
      default: return 'secondary';
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-foreground-muted">No.</th>
            <th className="px-4 py-3 text-left font-medium text-foreground-muted">Time</th>
            <th className="px-4 py-3 text-left font-medium text-foreground-muted">Source</th>
            <th className="px-4 py-3 text-left font-medium text-foreground-muted">Destination</th>
            <th className="px-4 py-3 text-left font-medium text-foreground-muted">Protocol</th>
            <th className="px-4 py-3 text-left font-medium text-foreground-muted">Length</th>
            <th className="px-4 py-3 text-left font-medium text-foreground-muted">Info</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {packets.map((packet) => (
            <tr
              key={packet.id}
              onClick={() => onSelect(packet.id)}
              className={cn(
                'cursor-pointer transition-colors',
                selectedId === packet.id
                  ? 'bg-primary/10'
                  : 'hover:bg-surface-hover'
              )}
            >
              <td className="px-4 py-2 font-mono text-foreground-muted">{packet.id}</td>
              <td className="px-4 py-2 font-mono">{packet.time}</td>
              <td className="px-4 py-2 font-mono">{packet.source}</td>
              <td className="px-4 py-2 font-mono">{packet.dest}</td>
              <td className="px-4 py-2">
                <Badge variant={getProtocolColor(packet.protocol) as any}>{packet.protocol}</Badge>
              </td>
              <td className="px-4 py-2 font-mono">{packet.length}</td>
              <td className="px-4 py-2 text-foreground-muted truncate max-w-[300px]">{packet.info}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Packet detail component
function PacketDetail({ packet }: { packet: typeof mockPackets[0] | null }) {
  if (!packet) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-foreground-muted text-sm">Select a packet to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Packet #{packet.id} Details</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <pre className="text-xs font-mono text-foreground-muted whitespace-pre-wrap">
{`Frame ${packet.id}: ${packet.length} bytes
Arrival Time: ${packet.time}
Source: ${packet.source}
Destination: ${packet.dest}
Protocol: ${packet.protocol}

Ethernet II
  Source: 00:1a:2b:3c:4d:5e
  Destination: ff:ff:ff:ff:ff:ff
  Type: IPv4 (0x0800)

Internet Protocol Version 4
  Source Address: ${packet.source}
  Destination Address: ${packet.dest}
  Time to Live: 64
  Protocol: ${packet.protocol}

${packet.info}`}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Main NinjaShark component
export default function NinjaShark() {
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [packets, setPackets] = React.useState<typeof mockPackets>([]);
  const [selectedPacket, setSelectedPacket] = React.useState<number | null>(null);
  const [filter, setFilter] = React.useState('');

  const handleStartCapture = () => {
    setIsCapturing(true);
    setPackets(mockPackets);
  };

  const handleStopCapture = () => {
    setIsCapturing(false);
  };

  const filteredPackets = packets.filter(p =>
    filter === '' ||
    p.source.includes(filter) ||
    p.dest.includes(filter) ||
    p.protocol.toLowerCase().includes(filter.toLowerCase())
  );

  const selected = packets.find(p => p.id === selectedPacket) || null;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wifi className="h-7 w-7 text-primary" />
              NinjaShark
            </h1>
            <p className="text-foreground-muted">Network packet capture and analysis</p>
          </div>
          <div className="flex items-center gap-2">
            {!isCapturing ? (
              <Button onClick={handleStartCapture}>
                <Play className="h-4 w-4 mr-2" />
                Start Capture
              </Button>
            ) : (
              <Button variant="danger" onClick={handleStopCapture}>
                <Square className="h-4 w-4 mr-2" />
                Stop Capture
              </Button>
            )}
            <Button variant="outline" disabled={packets.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        {isCapturing && <CaptureStats />}

        {/* Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <SearchInput
                placeholder="Filter packets (ip, protocol...)"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPackets(mockPackets)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Packet List */}
        {packets.length === 0 ? (
          <EmptyState
            icon={Wifi}
            title="No packets captured"
            description="Start a capture to begin analyzing network traffic"
            action={
              <Button onClick={handleStartCapture}>
                <Play className="h-4 w-4 mr-2" />
                Start Capture
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <PacketTable
              packets={filteredPackets}
              selectedId={selectedPacket}
              onSelect={setSelectedPacket}
            />
            <PacketDetail packet={selected} />
          </div>
        )}

        {/* Native Module Warning */}
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Limited Functionality</p>
                <p className="text-sm text-foreground-muted mt-1">
                  Real packet capture requires the native <code className="px-1.5 py-0.5 bg-surface rounded">cap</code> module
                  which is currently not available. The display above shows mock data for UI demonstration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
