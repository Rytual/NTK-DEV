# NetworkMap Module - AI Context Documentation

## Module Overview

**NetworkMap** provides network topology visualization, device discovery, and infrastructure monitoring with an interactive graph view showing device relationships and status.

### Core Purpose
- Network topology visualization
- Device discovery and inventory
- Real-time status monitoring
- Infrastructure relationship mapping

---

## File Structure

```
src/pages/NetworkMap.tsx       # Main frontend component (388 lines)
```

*Note: NetworkMap is primarily a frontend module that would integrate with backend discovery engines in a full implementation.*

---

## Frontend Component

### NetworkMap (pages/NetworkMap.tsx)

**Key Features**:
- Interactive radial network visualization
- Device list with search and filtering
- Device detail panel
- Status indicators (online/warning/offline)
- Zoom and pan controls

**Device Types**:
```typescript
type DeviceType = 'server' | 'router' | 'switch' | 'workstation' | 'printer' | 'wireless';
type DeviceStatus = 'online' | 'offline' | 'warning';
```

**Device Object Structure**:
```typescript
interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  mac: string;
  type: DeviceType;
  status: DeviceStatus;
  vendor?: string;
  lastSeen: string;
  ports?: number[];
}
```

**UI Components**:

| Component | Purpose |
|-----------|---------|
| `NetworkVisualization` | Radial graph with device nodes |
| `DeviceListItem` | Device row in sidebar list |
| `DeviceDetails` | Detailed device information panel |
| `DeviceIcon` | Type-specific icon with status color |

**State Management**:
```typescript
const [devices] = useState<NetworkDevice[]>(mockDevices);
const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [isScanning, setIsScanning] = useState(false);
```

**Statistics**:
```typescript
const stats = {
  total: devices.length,
  online: devices.filter(d => d.status === 'online').length,
  warning: devices.filter(d => d.status === 'warning').length,
  offline: devices.filter(d => d.status === 'offline').length,
};
```

---

## Visualization

**Radial Layout**:
- Central router hub
- Devices arranged in circle
- Connection lines with status colors
- Dashed lines for offline devices

**Device Positioning**:
```typescript
// Calculate position around center
const angle = (i * 360 / 8) * (Math.PI / 180);
const radius = 150;
const x = Math.cos(angle) * radius;
const y = Math.sin(angle) * radius;
```

**Status Colors**:
- Online: `var(--success)` (green)
- Warning: `var(--warning)` (yellow)
- Offline: `var(--danger)` (red)

---

## IPC Channels (Planned)

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `network:scan` | Renderer → Main | `{subnet}` | `Device[]` |
| `network:getDevices` | Renderer → Main | none | `Device[]` |
| `network:pingDevice` | Renderer → Main | `{ip}` | `{alive, latency}` |
| `network:getTopology` | Renderer → Main | none | `Topology` |
| `network:scanPorts` | Renderer → Main | `{ip, ports}` | `PortScan` |

---

## Integration Points

### With NinjaShark
- Traffic analysis per device
- Anomaly detection on network nodes

### With Security
- Vulnerability scanning integration
- Port scan results
- Security status per device

### With Remote Access
- Quick SSH/RDP to devices
- Console access from topology

### With Auvik (External)
- Real-time topology sync
- SNMP discovery
- Device metrics

---

## Current State

### Implemented
- Interactive radial visualization
- Device list with search
- Status filtering
- Detail panel
- Mock device data

### Placeholder/Mock
- Network scanning (uses mock data)
- Device discovery
- Port scanning
- Real-time updates

---

## Backend Requirements (For Full Implementation)

### Discovery Engine
```javascript
class DiscoveryEngine {
  // ARP scan
  scanSubnet(subnet) {}

  // SNMP discovery
  snmpWalk(ip, community) {}

  // Port scanning
  scanPorts(ip, ports) {}

  // Device fingerprinting
  fingerprint(ip) {}
}
```

### Topology Engine
```javascript
class TopologyEngine {
  // Build topology from discovered devices
  buildTopology(devices) {}

  // Calculate device relationships
  detectConnections(devices) {}

  // Export topology data
  exportTopology(format) {}
}
```

---

## Improvement Opportunities

1. **Real Discovery**: Implement ARP/SNMP scanning
2. **Layer 2 Mapping**: Switch port to MAC mapping
3. **Auto Layout**: Force-directed graph layout
4. **Multiple Views**: Tree, hierarchical, geographic
5. **Device Groups**: VLAN, department, location grouping
6. **History**: Track device changes over time
7. **Alerts**: Notify on new/missing devices
8. **IPAM Integration**: IP address management
9. **Documentation**: Auto-generate network diagrams
10. **Monitoring**: Integrate with PRTG, Zabbix, etc.
