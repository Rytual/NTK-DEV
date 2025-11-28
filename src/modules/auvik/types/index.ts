/**
 * Network Mapping Module Type Definitions
 * Nmap, SNMP, and 3D Topology types
 */

// ============================================================================
// Device and Node Types
// ============================================================================

export type DeviceType = 'gateway' | 'network-device' | 'server' | 'workstation' | 'device' | 'unknown';

export interface NetworkDevice {
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  os?: string;
  type: DeviceType;
  ports: PortInfo[];
  services: string[];
  lastSeen: number;
}

export interface PortInfo {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'closed' | 'filtered';
  service: string;
  version?: string;
}

export interface SNMPDevice extends NetworkDevice {
  sysDescr?: string;
  sysObjectID?: string;
  uptime?: number;
  contact?: string;
  location?: string;
  interfaces: NetworkInterface[];
  neighbors: NeighborInfo[];
}

export interface NetworkInterface {
  index: string;
  description: string;
  type: number;
  mtu: number;
  speed: number;
  mac: string;
  adminStatus: 'up' | 'down';
  operStatus: 'up' | 'down';
}

export interface NeighborInfo {
  protocol: 'LLDP' | 'CDP';
  name: string;
  interface: string;
}

// ============================================================================
// Nmap Scanning
// ============================================================================

export type NmapScanType = 'ping' | 'port' | 'full' | 'os';
export type NmapTiming = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface NmapScanOptions {
  scanType?: NmapScanType;
  ports?: string;
  timing?: NmapTiming;
  osDetection?: boolean;
  serviceVersion?: boolean;
  aggressive?: boolean;
}

export interface NmapScanResult {
  scanId: string;
  target: string;
  devicesFound: number;
  executionTime: number;
  devices: NetworkDevice[];
}

export interface NmapScan {
  id: string;
  target: string;
  startTime: number;
  type: NmapScanType;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  output: string;
  devices: NetworkDevice[];
}

// ============================================================================
// SNMP Discovery
// ============================================================================

export type SNMPVersion = '1' | '2c' | '3';

export interface SNMPOptions {
  community?: string;
  version?: SNMPVersion;
  port?: number;
  timeout?: number;
  retries?: number;
}

export interface SNMPSession {
  id: string;
  target: string;
  created: number;
}

export interface SNMPQueryResult {
  oid: string;
  value: any;
}

export interface SNMPBulkResult {
  successful: SNMPDevice[];
  failed: Array<{
    target: string;
    error: string;
  }>;
}

export interface SNMPPerformanceData {
  target: string;
  timestamp: number;
  cpuLoad?: number;
  memoryUsed?: number;
  memoryTotal?: number;
  memoryUsage?: number;
}

// ============================================================================
// Topology Graph
// ============================================================================

export interface TopologyNode {
  id: string;
  name: string;
  ip: string;
  type: DeviceType;
  vendor?: string;
  os?: string;
  color: string;
  size: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface TopologyLink {
  id: string;
  source: string;
  target: string;
  type: 'network' | 'lldp' | 'cdp' | 'unknown';
  color: string;
  width: number;
  interface?: string;
  discovered: number;
}

export interface Topology {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export interface TopologyRaw {
  nodes: TopologyNodeRaw[];
  links: TopologyLink[];
  subnets: SubnetInfo[];
  clusters: ClusterInfo[];
}

export interface TopologyNodeRaw {
  id: string;
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  os?: string;
  type: DeviceType;
  ports?: PortInfo[];
  services?: string[];
  interfaces?: NetworkInterface[];
  neighbors?: NeighborInfo[];
  source: 'nmap' | 'snmp';
  snmpData?: {
    sysObjectID?: string;
    uptime?: number;
    contact?: string;
    location?: string;
  };
  lastSeen: number;
  metadata: Record<string, any>;
}

// ============================================================================
// Network Structure
// ============================================================================

export interface SubnetInfo {
  subnet: string;
  nodes: string[];
  gateway: string | null;
  size: number;
}

export interface ClusterInfo {
  id: string;
  name: string;
  nodes: string[];
  size: number;
  type: 'subnet' | 'vlan' | 'datacenter';
}

// ============================================================================
// Topology Building
// ============================================================================

export interface TopologyBuildOptions {
  nmapScan?: boolean;
  snmpDiscovery?: boolean;
  portScan?: boolean;
  osDetection?: boolean;
}

export interface TopologyBuildResult {
  nodes: number;
  links: number;
  subnets: number;
  buildTime: number;
}

// ============================================================================
// Export Formats
// ============================================================================

export type TopologyExportFormat = 'json' | 'graphml' | 'cytoscape' | 'raw';

export interface GraphMLExport {
  xml: string;
}

export interface CytoscapeExport {
  elements: {
    nodes: Array<{
      data: {
        id: string;
        label: string;
        type: string;
        vendor?: string;
      };
    }>;
    edges: Array<{
      data: {
        id: string;
        source: string;
        target: string;
        type: string;
      };
    }>;
  };
}

// ============================================================================
// Search and Filtering
// ============================================================================

export interface TopologySearchResult {
  nodes: TopologyNodeRaw[];
  links: TopologyLink[];
}

export interface TopologyFilter {
  deviceTypes?: DeviceType[];
  vendors?: string[];
  subnets?: string[];
  minPorts?: number;
  hasServices?: string[];
}

// ============================================================================
// Metrics and Monitoring
// ============================================================================

export interface NetworkMapperMetrics {
  scansCompleted: number;
  devicesDiscovered: number;
  portsScanned: number;
  totalScanTime: number;
  activeScans: number;
  averageScanTime: number;
}

export interface SNMPEngineMetrics {
  queriesCompleted: number;
  devicesDiscovered: number;
  snmpQueries: number;
  totalQueryTime: number;
  failedQueries: number;
  activeSessions: number;
  totalDevices: number;
  averageQueryTime: number;
  successRate: string;
}

export interface TopologyMetrics {
  nodesTotal: number;
  linksTotal: number;
  subnetsDiscovered: number;
  clustersDetected: number;
  lastUpdate: number | null;
  buildTime: number;
  nmapMetrics: NetworkMapperMetrics;
  snmpMetrics: SNMPEngineMetrics;
}

// ============================================================================
// Events
// ============================================================================

export interface ScanCompleteEvent {
  scanId: string;
  devices: NetworkDevice[];
  executionTime: number;
}

export interface ScanErrorEvent {
  scanId: string;
  error: string;
}

export interface DeviceDiscoveredEvent {
  target: string;
  device: SNMPDevice;
}

export interface TopologyBuiltEvent {
  nodes: number;
  links: number;
  subnets: number;
  buildTime: number;
}

// ============================================================================
// 3D Visualization
// ============================================================================

export interface Force3DGraphData {
  nodes: Force3DNode[];
  links: Force3DLink[];
}

export interface Force3DNode {
  id: string;
  name: string;
  ip: string;
  type: DeviceType;
  vendor?: string;
  os?: string;
  color: string;
  size: number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface Force3DLink {
  source: string | Force3DNode;
  target: string | Force3DNode;
  type: string;
  color: string;
  width: number;
}

export interface VisualizationConfig {
  nodeSize: number;
  linkWidth: number;
  enableLabels: boolean;
  enableTooltips: boolean;
  backgroundColor: string;
  cameraDistance: number;
  enablePhysics: boolean;
  chargeStrength: number;
  linkDistance: number;
}

// ============================================================================
// Discovery Profiles
// ============================================================================

export interface DiscoveryProfile {
  name: string;
  description?: string;
  subnet: string;
  nmapOptions: NmapScanOptions;
  snmpOptions: SNMPOptions;
  schedule?: DiscoverySchedule;
  created: number;
  lastUsed?: number;
}

export interface DiscoverySchedule {
  enabled: boolean;
  interval: number; // milliseconds
  lastRun?: number;
  nextRun?: number;
}

// ============================================================================
// Network Documentation
// ============================================================================

export interface NetworkDocumentation {
  subnet: string;
  gateway: string;
  devices: NetworkDevice[];
  topology: Topology;
  generatedAt: number;
  metadata: {
    totalDevices: number;
    totalServices: number;
    uniqueVendors: string[];
    operatingSystems: string[];
  };
}

// ============================================================================
// Change Detection
// ============================================================================

export interface TopologySnapshot {
  timestamp: number;
  nodes: TopologyNodeRaw[];
  links: TopologyLink[];
  checksum: string;
}

export interface TopologyChange {
  timestamp: number;
  type: 'node-added' | 'node-removed' | 'node-changed' | 'link-added' | 'link-removed';
  before?: any;
  after?: any;
  nodeId?: string;
  linkId?: string;
}

export interface ChangeDetectionResult {
  changes: TopologyChange[];
  newDevices: string[];
  removedDevices: string[];
  modifiedDevices: string[];
}

// ============================================================================
// Network Health
// ============================================================================

export interface NetworkHealth {
  overallScore: number;
  metrics: {
    availabilityScore: number;
    performanceScore: number;
    securityScore: number;
  };
  issues: HealthIssue[];
  recommendations: string[];
  timestamp: number;
}

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'info';
  type: string;
  device?: string;
  message: string;
  timestamp: number;
}

// ============================================================================
// Integration Types
// ============================================================================

export interface NetworkMapperConfig {
  nmapPath?: string;
  snmpCommunity?: string;
  defaultTiming?: NmapTiming;
  maxConcurrentScans?: number;
  scanTimeout?: number;
}

export interface DatabaseRecord {
  id: string;
  type: 'device' | 'scan' | 'topology' | 'snapshot';
  data: any;
  created: number;
  updated: number;
}
