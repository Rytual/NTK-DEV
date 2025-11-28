/**
 * Network Mapping Module
 * Nmap + SNMP discovery with 3D topology visualization
 */

import React from 'react';

export const NetworkMapperModule: React.FC = () => {
  return (
    <div className="network-mapper-module">
      <h1>Network Mapping Module</h1>
      <p>Nmap + SNMP discovery with 3D topology visualization</p>
    </div>
  );
};

export default NetworkMapperModule;

// Export backend engines
export { NetworkMapper } from './backend/network-mapper';
export { SNMPEngine } from './backend/snmp-engine';
export { TopologyBuilder } from './backend/topology-builder';

// Export types
export * from './types/index';
