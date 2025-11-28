/**
 * Type declarations for SNMP Engine
 */

import { EventEmitter } from 'events';

export interface SNMPConfig {
  community?: string;
  version?: '1' | '2c' | '3';
  timeout?: number;
  retries?: number;
}

export interface SNMPResult {
  oid: string;
  value: any;
  type: string;
}

export class SNMPEngine extends EventEmitter {
  constructor(config?: SNMPConfig);

  get(host: string, oids: string[]): Promise<SNMPResult[]>;
  walk(host: string, oid: string): Promise<SNMPResult[]>;
  getBulk(host: string, oids: string[], maxRepetitions?: number): Promise<SNMPResult[]>;
}

export default SNMPEngine;
