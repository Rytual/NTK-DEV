/**
 * Type declarations for Topology Builder
 */

import { EventEmitter } from 'events';

export interface TopologyNode {
  id: string;
  label: string;
  type: string;
  ip?: string;
  mac?: string;
  vendor?: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  weight?: number;
}

export interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    scanId?: string;
  };
}

export class TopologyBuilder extends EventEmitter {
  constructor();

  build(scanResults: any[]): Topology;
  addNode(node: TopologyNode): void;
  addEdge(edge: TopologyEdge): void;
  getTopology(): Topology;
  clear(): void;
  exportToJSON(): string;
}

export default TopologyBuilder;
