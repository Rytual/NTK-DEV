/**
 * NinjaShark Type Definitions
 */

export interface NetworkInterface {
  id: string;
  name: string;
  description: string;
  addresses: string[];
  active: boolean;
  flags?: number;
}

export interface Packet {
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

export interface PacketLayer {
  name: string;
  fields: PacketField[];
  children?: PacketLayer[];
}

export interface PacketField {
  name: string;
  value: string;
  size?: number;
  offset?: number;
}

export interface CaptureSession {
  id: string;
  interface: string;
  filter: string;
  startTime: number;
  packetCount: number;
  bytesCount: number;
  droppedPackets?: number;
  active: boolean;
}

export interface AnomalyAlert {
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

export interface NetworkStats {
  protocols: Record<string, number>;
  endpoints: Array<{ address: string; packets: number; bytes: number }>;
  conversations: Array<{ source: string; destination: string; packets: number; bytes: number }>;
  timeline: Array<{ timestamp: number; packets: number; bytes: number }>;
}

export interface BPFFilter {
  expression: string;
  valid: boolean;
  error?: string;
}
