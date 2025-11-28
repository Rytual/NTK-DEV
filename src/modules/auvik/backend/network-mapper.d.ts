/**
 * Type declarations for Network Mapper
 */

import { EventEmitter } from 'events';

export interface ScanOptions {
  targets: string[];
  ports?: string;
  timing?: number;
  osDetection?: boolean;
  serviceDetection?: boolean;
}

export interface ScanResult {
  host: string;
  status: string;
  ports: Array<{
    port: number;
    protocol: string;
    state: string;
    service?: string;
  }>;
  os?: string;
  mac?: string;
  vendor?: string;
}

export class NetworkMapper extends EventEmitter {
  constructor();

  scan(options: ScanOptions): Promise<ScanResult[]>;
  cancelScan(): void;
  getProgress(): number;
}

export default NetworkMapper;
