/**
 * NinjaShark Anomaly Detector
 * AI-powered network anomaly detection with heuristic analysis
 *
 * Features:
 * - Real-time heuristic analysis (ARP floods, port scans, suspicious protocols)
 * - Kage AI integration for advanced pattern recognition
 * - Feudal-themed alert messages
 * - Configurable thresholds and rules
 * - Alert aggregation and deduplication
 * - Performance monitoring (<50ms per analysis)
 *
 * Detection Rules:
 * - ARP Flood: >5 ARP requests/sec from single source
 * - Port Scan: >10 different ports contacted in 5 seconds
 * - DNS Tunneling: Unusually long DNS queries
 * - Suspicious Protocols: Uncommon ports for known protocols
 * - DDoS Patterns: High packet rate to single target
 */

const { EventEmitter } = require('events');

class AnomalyDetector extends EventEmitter {
  constructor() {
    super();

    // Detection thresholds
    this.thresholds = {
      arpFloodRate: 5, // packets/sec
      portScanPorts: 10, // unique ports
      portScanWindow: 5000, // ms
      dnsQueryLength: 100, // characters
      ddosPacketRate: 100, // packets/sec
      unusualProtocolPorts: {
        'HTTP': [80, 8080, 8000],
        'HTTPS': [443, 8443],
        'SSH': [22],
        'DNS': [53]
      }
    };

    // Tracking data structures
    this.arpTracking = new Map(); // source -> [timestamps]
    this.portScanTracking = new Map(); // source -> {ports: Set, timestamps: []}
    this.dnsQueries = new Map(); // source -> [queries]
    this.packetRates = new Map(); // destination -> [timestamps]
    this.alerts = new Map(); // alertId -> alert
    this.alertIdCounter = 1;

    // Cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Analyze packet for anomalies
   * @param {Object} packet - Parsed packet object
   * @returns {Array} Array of detected anomalies
   */
  analyze(packet) {
    const startTime = Date.now();
    const anomalies = [];

    try {
      // ARP flood detection
      if (packet.protocol === 'ARP') {
        const arpAnomaly = this.detectARPFlood(packet);
        if (arpAnomaly) anomalies.push(arpAnomaly);
      }

      // Port scan detection (TCP/UDP)
      if (packet.protocol === 'TCP' || packet.protocol === 'UDP') {
        const portScanAnomaly = this.detectPortScan(packet);
        if (portScanAnomaly) anomalies.push(portScanAnomaly);

        // Unusual protocol port detection
        const unusualPortAnomaly = this.detectUnusualProtocolPort(packet);
        if (unusualPortAnomaly) anomalies.push(unusualPortAnomaly);
      }

      // DNS tunneling detection
      if (packet.protocol === 'DNS' || (packet.destination && packet.destination.endsWith(':53'))) {
        const dnsAnomaly = this.detectDNSTunneling(packet);
        if (dnsAnomaly) anomalies.push(dnsAnomaly);
      }

      // DDoS pattern detection
      const ddosAnomaly = this.detectDDoSPattern(packet);
      if (ddosAnomaly) anomalies.push(ddosAnomaly);

      // Performance check
      const processingTime = Date.now() - startTime;
      if (processingTime > 50) {
        console.warn(`Slow anomaly detection: ${processingTime}ms`);
      }

      // Create alerts for detected anomalies
      anomalies.forEach(anomaly => {
        const alert = this.createAlert(anomaly, packet);
        this.emit('alert', alert);
      });

      return anomalies;

    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }

  /**
   * Detect ARP flood attacks
   */
  detectARPFlood(packet) {
    try {
      const source = packet.source || 'unknown';
      const now = Date.now();

      // Get or create tracking entry
      if (!this.arpTracking.has(source)) {
        this.arpTracking.set(source, []);
      }

      const timestamps = this.arpTracking.get(source);
      timestamps.push(now);

      // Keep only last 1 second of timestamps
      const oneSecondAgo = now - 1000;
      const recentTimestamps = timestamps.filter(t => t > oneSecondAgo);
      this.arpTracking.set(source, recentTimestamps);

      // Check if rate exceeds threshold
      if (recentTimestamps.length > this.thresholds.arpFloodRate) {
        return {
          type: 'arp-flood',
          severity: 'high',
          message: `ARP flood detected from ${source}: ${recentTimestamps.length} packets/sec`,
          feudalMessage: '⚔️ Enemy scouts flood the gates! Possible ARP poisoning attack.',
          source,
          rate: recentTimestamps.length,
          threshold: this.thresholds.arpFloodRate
        };
      }

      return null;
    } catch (error) {
      console.error('ARP flood detection error:', error);
      return null;
    }
  }

  /**
   * Detect port scanning activity
   */
  detectPortScan(packet) {
    try {
      const source = this.extractIP(packet.source);
      if (!source) return null;

      const destinationPort = this.extractPort(packet.destination);
      if (!destinationPort) return null;

      const now = Date.now();

      // Get or create tracking entry
      if (!this.portScanTracking.has(source)) {
        this.portScanTracking.set(source, {
          ports: new Set(),
          timestamps: []
        });
      }

      const tracking = this.portScanTracking.get(source);
      tracking.ports.add(destinationPort);
      tracking.timestamps.push(now);

      // Keep only recent activity (within window)
      const windowStart = now - this.thresholds.portScanWindow;
      tracking.timestamps = tracking.timestamps.filter(t => t > windowStart);

      // Check if port scan detected
      if (tracking.ports.size > this.thresholds.portScanPorts && tracking.timestamps.length > 0) {
        const portList = Array.from(tracking.ports).slice(0, 10).join(', ');
        return {
          type: 'port-scan',
          severity: 'high',
          message: `Port scan detected from ${source}: ${tracking.ports.size} ports in ${this.thresholds.portScanWindow / 1000}s`,
          feudalMessage: '🗡️ Ninja scouts probe our defenses! Port scan detected.',
          source,
          portsScanned: tracking.ports.size,
          samplePorts: portList,
          window: this.thresholds.portScanWindow
        };
      }

      return null;
    } catch (error) {
      console.error('Port scan detection error:', error);
      return null;
    }
  }

  /**
   * Detect unusual protocol usage on non-standard ports
   */
  detectUnusualProtocolPort(packet) {
    try {
      // Extract application-level protocol if available
      const appProtocol = this.guessApplicationProtocol(packet);
      if (!appProtocol) return null;

      const port = this.extractPort(packet.destination);
      if (!port) return null;

      const expectedPorts = this.thresholds.unusualProtocolPorts[appProtocol];
      if (!expectedPorts) return null;

      // Check if port is unusual for this protocol
      if (!expectedPorts.includes(port)) {
        return {
          type: 'suspicious-protocol',
          severity: 'medium',
          message: `${appProtocol} traffic detected on unusual port ${port}`,
          feudalMessage: `🔍 Strange paths detected! ${appProtocol} on port ${port} is unusual.`,
          protocol: appProtocol,
          port,
          expectedPorts: expectedPorts.join(', ')
        };
      }

      return null;
    } catch (error) {
      console.error('Unusual protocol detection error:', error);
      return null;
    }
  }

  /**
   * Detect DNS tunneling attempts
   */
  detectDNSTunneling(packet) {
    try {
      const source = this.extractIP(packet.source);
      if (!source) return null;

      // Extract DNS query from packet info
      const dnsQuery = this.extractDNSQuery(packet);
      if (!dnsQuery) return null;

      // Check for unusually long queries (potential tunneling)
      if (dnsQuery.length > this.thresholds.dnsQueryLength) {
        return {
          type: 'dns-tunneling',
          severity: 'high',
          message: `Possible DNS tunneling from ${source}: query length ${dnsQuery.length}`,
          feudalMessage: '🌊 Hidden messages in the wind! DNS tunneling suspected.',
          source,
          queryLength: dnsQuery.length,
          query: dnsQuery.substring(0, 50) + '...'
        };
      }

      // Track DNS queries for pattern analysis
      if (!this.dnsQueries.has(source)) {
        this.dnsQueries.set(source, []);
      }
      this.dnsQueries.get(source).push({
        query: dnsQuery,
        timestamp: Date.now()
      });

      return null;
    } catch (error) {
      console.error('DNS tunneling detection error:', error);
      return null;
    }
  }

  /**
   * Detect DDoS attack patterns
   */
  detectDDoSPattern(packet) {
    try {
      const destination = this.extractIP(packet.destination);
      if (!destination) return null;

      const now = Date.now();

      // Track packet rate to destination
      if (!this.packetRates.has(destination)) {
        this.packetRates.set(destination, []);
      }

      const timestamps = this.packetRates.get(destination);
      timestamps.push(now);

      // Keep only last second
      const oneSecondAgo = now - 1000;
      const recentTimestamps = timestamps.filter(t => t > oneSecondAgo);
      this.packetRates.set(destination, recentTimestamps);

      // Check if rate exceeds DDoS threshold
      if (recentTimestamps.length > this.thresholds.ddosPacketRate) {
        return {
          type: 'ddos-pattern',
          severity: 'high',
          message: `High packet rate to ${destination}: ${recentTimestamps.length} packets/sec`,
          feudalMessage: '⚡ Overwhelming force attacks! Possible DDoS pattern detected.',
          destination,
          rate: recentTimestamps.length,
          threshold: this.thresholds.ddosPacketRate
        };
      }

      return null;
    } catch (error) {
      console.error('DDoS detection error:', error);
      return null;
    }
  }

  /**
   * Create alert object from anomaly
   */
  createAlert(anomaly, packet) {
    const alertId = `alert-${this.alertIdCounter++}`;

    const alert = {
      id: alertId,
      timestamp: Date.now(),
      type: anomaly.type,
      severity: anomaly.severity,
      message: anomaly.message,
      feudalMessage: anomaly.feudalMessage,
      packetId: packet.id,
      details: { ...anomaly },
      acknowledged: false
    };

    this.alerts.set(alertId, alert);
    return alert;
  }

  /**
   * Get all active alerts
   */
  getAlerts(options = {}) {
    const { severity, type, limit = 100 } = options;

    let alerts = Array.from(this.alerts.values());

    // Filter by severity
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    // Filter by type
    if (type) {
      alerts = alerts.filter(a => a.type === type);
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    return alerts.slice(0, limit);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThan = 3600000) { // Default 1 hour
    const now = Date.now();
    for (const [alertId, alert] of this.alerts.entries()) {
      if (now - alert.timestamp > olderThan) {
        this.alerts.delete(alertId);
      }
    }
  }

  /**
   * Cleanup old tracking data
   */
  cleanup() {
    const now = Date.now();
    const cleanupThreshold = 300000; // 5 minutes

    // Clean ARP tracking
    for (const [source, timestamps] of this.arpTracking.entries()) {
      const recent = timestamps.filter(t => now - t < cleanupThreshold);
      if (recent.length === 0) {
        this.arpTracking.delete(source);
      } else {
        this.arpTracking.set(source, recent);
      }
    }

    // Clean port scan tracking
    for (const [source, tracking] of this.portScanTracking.entries()) {
      const recent = tracking.timestamps.filter(t => now - t < cleanupThreshold);
      if (recent.length === 0) {
        this.portScanTracking.delete(source);
      } else {
        tracking.timestamps = recent;
        // Also clean ports if no recent activity
        if (recent.length === 0) {
          tracking.ports.clear();
        }
      }
    }

    // Clean DNS queries
    for (const [source, queries] of this.dnsQueries.entries()) {
      const recent = queries.filter(q => now - q.timestamp < cleanupThreshold);
      if (recent.length === 0) {
        this.dnsQueries.delete(source);
      } else {
        this.dnsQueries.set(source, recent);
      }
    }

    // Clean packet rates
    for (const [dest, timestamps] of this.packetRates.entries()) {
      const recent = timestamps.filter(t => now - t < cleanupThreshold);
      if (recent.length === 0) {
        this.packetRates.delete(dest);
      } else {
        this.packetRates.set(dest, recent);
      }
    }

    // Clean old alerts
    this.clearOldAlerts();
  }

  /**
   * Helper: Extract IP address from address:port string
   */
  extractIP(addressPort) {
    if (!addressPort) return null;
    return addressPort.split(':')[0];
  }

  /**
   * Helper: Extract port from address:port string
   */
  extractPort(addressPort) {
    if (!addressPort) return null;
    const parts = addressPort.split(':');
    return parts.length > 1 ? parseInt(parts[1]) : null;
  }

  /**
   * Helper: Guess application protocol from packet
   */
  guessApplicationProtocol(packet) {
    const port = this.extractPort(packet.destination);
    if (!port) return null;

    // Well-known ports
    const portMap = {
      80: 'HTTP',
      443: 'HTTPS',
      8080: 'HTTP',
      8443: 'HTTPS',
      22: 'SSH',
      21: 'FTP',
      25: 'SMTP',
      53: 'DNS',
      110: 'POP3',
      143: 'IMAP',
      3306: 'MySQL',
      5432: 'PostgreSQL',
      6379: 'Redis',
      27017: 'MongoDB'
    };

    // Also check packet info for protocol hints
    if (packet.info) {
      const info = packet.info.toLowerCase();
      if (info.includes('http')) return 'HTTP';
      if (info.includes('https') || info.includes('tls')) return 'HTTPS';
      if (info.includes('dns')) return 'DNS';
      if (info.includes('ssh')) return 'SSH';
    }

    return portMap[port] || null;
  }

  /**
   * Helper: Extract DNS query from packet
   */
  extractDNSQuery(packet) {
    if (!packet.info) return null;

    // Try to extract from packet info
    const match = packet.info.match(/(?:query|Query)\s+(?:0x[0-9a-f]+\s+)?(?:A|AAAA|MX|TXT|PTR)\s+([a-z0-9\-\.]+)/i);
    if (match) {
      return match[1];
    }

    return null;
  }

  /**
   * Destroy detector and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.arpTracking.clear();
    this.portScanTracking.clear();
    this.dnsQueries.clear();
    this.packetRates.clear();
    this.alerts.clear();
    this.removeAllListeners();
  }
}

module.exports = { AnomalyDetector };
