# NinjaShark Module - AI Context Documentation

## Module Overview

**NinjaShark** is a network packet capture and analysis module inspired by Wireshark. It provides real-time packet capture using libpcap bindings, protocol dissection, anomaly detection, and export capabilities.

### Core Purpose
- Real-time network traffic monitoring
- Protocol analysis and packet inspection
- Security anomaly detection (port scans, DDoS, DNS tunneling)
- Packet export to multiple formats

---

## File Structure

```
src/modules/ninjashark/
├── backend/
│   ├── capture-engine.cjs    # Core packet capture (524 lines)
│   ├── anomaly-detector.cjs  # AI-powered threat detection (533 lines)
│   └── export-handler.cjs    # Multi-format export (68 lines)
├── types/
│   └── index.ts              # TypeScript interfaces (76 lines)
└── [frontend in src/pages/NinjaShark.tsx]
```

---

## Backend Components

### 1. CaptureEngine (capture-engine.cjs)

**Purpose**: Real packet capture using libpcap with graceful fallback to simulation mode.

**Key Class**: `CaptureEngine extends EventEmitter`

**Native Dependencies**:
- `cap` - Node.js libpcap bindings
- Requires: libpcap-dev (Linux), WinPcap/Npcap (Windows)
- Falls back to simulation mode if cap library unavailable

**Configuration**:
```javascript
this.ringBufferSize = 512 * 1024 * 1024; // 512MB ring buffer
```

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getInterfaces()` | none | `Promise<Array>` | List available network interfaces |
| `startCapture(sessionId, interfaceId, filter, onPacket)` | session ID, interface, BPF filter, callback | `Promise<Session>` | Start capture session |
| `stopCapture(sessionId)` | session ID | `Promise<Stats>` | Stop capture and return statistics |
| `validateFilter(filterExpr)` | BPF expression | `{valid, error}` | Validate BPF filter syntax |
| `getSessionStats(sessionId)` | session ID | `Stats | null` | Get capture statistics |

**Protocol Support**:
- Layer 2: Ethernet II, ARP
- Layer 3: IPv4
- Layer 4: TCP, UDP, ICMP
- Application: DNS, HTTP (via port detection)

**Packet Parsing Flow**:
```
Raw Buffer → Ethernet → IPv4 → TCP/UDP → Application Layer
                ↓
         Protocol Detection
                ↓
         Packet Object with Layers
```

**Session Object Structure**:
```javascript
{
  id: string,
  interface: string,
  filter: string,
  startTime: number,
  packetCount: number,
  bytesCount: number,
  droppedPackets: number,
  active: boolean
}
```

**Performance Targets**:
- Packet processing: <100ms per packet
- Ring buffer: 512MB for high-throughput capture

---

### 2. AnomalyDetector (anomaly-detector.cjs)

**Purpose**: AI-powered network anomaly detection with heuristic analysis.

**Key Class**: `AnomalyDetector extends EventEmitter`

**Detection Rules**:

| Attack Type | Threshold | Detection Method |
|-------------|-----------|------------------|
| ARP Flood | >5 ARP/sec from single source | Timestamp tracking per source |
| Port Scan | >10 ports in 5 seconds | Unique port tracking per source |
| DNS Tunneling | Query >100 chars | Query length analysis |
| DDoS Pattern | >100 packets/sec to single target | Packet rate tracking per destination |
| Suspicious Protocol | Wrong port for protocol | Port/protocol mapping |

**Configuration**:
```javascript
this.thresholds = {
  arpFloodRate: 5,           // packets/sec
  portScanPorts: 10,         // unique ports
  portScanWindow: 5000,      // ms
  dnsQueryLength: 100,       // characters
  ddosPacketRate: 100,       // packets/sec
  unusualProtocolPorts: {
    'HTTP': [80, 8080, 8000],
    'HTTPS': [443, 8443],
    'SSH': [22],
    'DNS': [53]
  }
};
```

**Alert Object Structure**:
```javascript
{
  id: string,
  timestamp: number,
  type: 'arp-flood' | 'port-scan' | 'dns-tunneling' | 'ddos-pattern' | 'suspicious-protocol',
  severity: 'low' | 'medium' | 'high',
  message: string,
  feudalMessage: string,  // Themed alert message
  packetId: number,
  details: object,
  acknowledged: boolean
}
```

**Feudal Theme Messages**:
```javascript
'arp-flood': '⚔️ Enemy scouts flood the gates! Possible ARP poisoning attack.'
'port-scan': '🗡️ Ninja scouts probe our defenses! Port scan detected.'
'dns-tunneling': '🌊 Hidden messages in the wind! DNS tunneling suspected.'
'ddos-pattern': '⚡ Overwhelming force attacks! Possible DDoS pattern detected.'
'suspicious-protocol': '🔍 Strange paths detected! {protocol} on port {port} is unusual.'
```

**Memory Management**:
- Automatic cleanup every 60 seconds
- Tracking data expires after 5 minutes
- Alerts expire after 1 hour

---

### 3. ExportHandler (export-handler.cjs)

**Purpose**: Export captured packets to multiple formats.

**Supported Formats**:

| Format | Extension | Description |
|--------|-----------|-------------|
| JSON | .json | Full packet data with all fields |
| CSV | .csv | Tabular format (No, Time, Source, Dest, Protocol, Length, Info) |
| PDF | .pdf | Human-readable report (placeholder implementation) |
| PCAPNG | .pcapng | Wireshark-compatible (placeholder, exports JSON with note) |

**Usage**:
```javascript
const handler = new ExportHandler();
await handler.export(packets, 'json', '/path/to/export.json');
```

---

## TypeScript Interfaces (types/index.ts)

```typescript
interface NetworkInterface {
  id: string;
  name: string;
  description: string;
  addresses: string[];
  active: boolean;
  flags?: number;
}

interface Packet {
  id: number;
  sessionId?: string;
  timestamp: number;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  hex: Uint8Array | Buffer;
  truncated?: boolean;
  layers: PacketLayer[];
}

interface PacketLayer {
  name: string;
  fields: PacketField[];
  children?: PacketLayer[];
}

interface CaptureSession {
  id: string;
  interface: string;
  filter: string;
  startTime: number;
  packetCount: number;
  bytesCount: number;
  droppedPackets?: number;
  active: boolean;
}

interface AnomalyAlert {
  id: string;
  timestamp: number;
  type: 'arp-flood' | 'port-scan' | 'dns-tunneling' | 'ddos-pattern' | 'suspicious-protocol' | 'custom';
  severity: 'low' | 'medium' | 'high';
  message: string;
  feudalMessage: string;
  packetId?: number;
  details: any;
  acknowledged: boolean;
}
```

---

## Frontend Component (pages/NinjaShark.tsx)

**UI Components**:
- `CaptureStats` - Real-time statistics display (packets, data rate, duration, anomalies)
- `PacketTable` - Sortable packet list with protocol color coding
- `PacketDetail` - Detailed packet inspection panel

**Protocol Color Coding**:
```typescript
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
```

**State Management**:
```typescript
const [isCapturing, setIsCapturing] = React.useState(false);
const [packets, setPackets] = React.useState<Packet[]>([]);
const [selectedPacket, setSelectedPacket] = React.useState<number | null>(null);
const [filter, setFilter] = React.useState('');
```

---

## IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `ninjashark:getInterfaces` | Renderer → Main | none | `NetworkInterface[]` |
| `ninjashark:startCapture` | Renderer → Main | `{sessionId, interfaceId, filter}` | `CaptureSession` |
| `ninjashark:stopCapture` | Renderer → Main | `{sessionId}` | `Stats` |
| `ninjashark:getStats` | Renderer → Main | `{sessionId}` | `Stats` |
| `ninjashark:getAlerts` | Renderer → Main | `{options}` | `AnomalyAlert[]` |
| `ninjashark:acknowledgeAlert` | Renderer → Main | `{alertId}` | `boolean` |
| `ninjashark:export` | Renderer → Main | `{packets, format, filepath}` | `ExportResult` |

---

## Integration Points

### With Security Module
- Share detected anomalies
- Contribute to threat intelligence
- Security events from packet analysis

### With KageChat
- Natural language packet queries
- "Show me all DNS packets to Google"
- Alert explanations

### With Dashboard
- Network health metrics
- Real-time packet counts
- Anomaly summary statistics

---

## Current State

### Implemented
- Full capture engine with simulation fallback
- Comprehensive anomaly detection (5 attack types)
- Multi-format export handler
- TypeScript interfaces
- Basic frontend UI

### Placeholder/Mock
- Frontend uses mock packets for UI demo
- PDF export is text-only
- PCAPNG export saves as JSON with note
- IPC integration not fully wired

### Requirements for Full Functionality
1. Install `cap` package: `npm install cap`
2. Install system dependencies:
   - Windows: Npcap (https://npcap.com)
   - Linux: `sudo apt install libpcap-dev`
   - macOS: `brew install libpcap`
3. Run application with admin/root privileges for real capture

---

## Performance Considerations

- **Ring Buffer**: 512MB allocated for high-throughput capture
- **Packet Processing**: Target <100ms per packet
- **Anomaly Detection**: Target <50ms per analysis
- **Memory Cleanup**: Automatic every 60 seconds
- **Alert Retention**: 1 hour default

---

## Improvement Opportunities

1. **Real PCAPNG Export**: Implement binary PCAPNG format
2. **Deep Packet Inspection**: HTTP content analysis, SSL/TLS inspection
3. **Machine Learning**: Train on traffic patterns for advanced anomaly detection
4. **Protocol Plugins**: Extensible protocol dissector system
5. **Capture Filters**: Full BPF filter builder UI
6. **Statistics Dashboard**: Bandwidth graphs, protocol distribution
7. **Alert Notifications**: Desktop notifications for high-severity alerts
