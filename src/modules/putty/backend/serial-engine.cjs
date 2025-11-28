/**
 * Serial Port Engine
 * RS-232, USB-Serial connectivity with hardware flow control
 *
 * Features:
 * - Multi-platform serial port support (Windows, Linux, macOS)
 * - Baud rates from 110 to 115200+
 * - Hardware/software flow control (RTS/CTS, XON/XOFF)
 * - Parity checking (none, even, odd, mark, space)
 * - Data bits (5, 6, 7, 8)
 * - Stop bits (1, 1.5, 2)
 * - Auto-detection of serial ports
 * - Raw binary and text modes
 * - Session recording
 *
 * Common Use Cases:
 * - Cisco/Juniper console access
 * - Arduino/embedded device programming
 * - PLC/SCADA connectivity
 * - Legacy equipment management
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { EventEmitter } = require('events');
const os = require('os');
const path = require('path');
const fs = require('fs');

class SerialEngine extends EventEmitter {
  constructor() {
    super();

    // Active sessions
    this.sessions = new Map();
    this.sessionIdCounter = 1;

    // Performance monitoring
    this.metrics = {
      sessionsCreated: 0,
      bytesTransmitted: 0,
      bytesReceived: 0
    };
  }

  /**
   * List available serial ports
   */
  async listPorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer || 'Unknown',
        serialNumber: port.serialNumber || 'N/A',
        pnpId: port.pnpId || 'N/A',
        vendorId: port.vendorId || 'N/A',
        productId: port.productId || 'N/A'
      }));
    } catch (error) {
      console.error('Failed to list serial ports:', error);
      return [];
    }
  }

  /**
   * Create new serial session
   */
  async createSession(options = {}) {
    const sessionId = `serial-${this.sessionIdCounter++}`;

    const {
      path: portPath,
      baudRate = 9600,
      dataBits = 8,
      stopBits = 1,
      parity = 'none',
      rtscts = false,
      xon = false,
      xoff = false,
      xany = false,
      autoOpen = true
    } = options;

    if (!portPath) {
      throw new Error('Serial port path is required');
    }

    console.log(`Creating serial session ${sessionId} on ${portPath} at ${baudRate} baud...`);

    return new Promise((resolve, reject) => {
      const port = new SerialPort({
        path: portPath,
        baudRate,
        dataBits,
        stopBits,
        parity,
        rtscts,
        xon,
        xoff,
        xany,
        autoOpen
      }, (err) => {
        if (err) {
          reject(new Error(`Failed to open serial port: ${err.message}`));
          return;
        }
      });

      const session = {
        id: sessionId,
        type: 'serial',
        port,
        portPath,
        baudRate,
        startTime: Date.now(),
        outputBuffer: '',
        recording: [],
        listeners: new Set()
      };

      // Handle port open
      port.on('open', () => {
        console.log(`Serial port ${portPath} opened successfully`);
        this.sessions.set(sessionId, session);
        this.metrics.sessionsCreated++;

        resolve({
          sessionId,
          path: portPath,
          baudRate,
          dataBits,
          stopBits,
          parity
        });
      });

      // Handle data
      port.on('data', (data) => {
        const output = data.toString('utf8');
        session.outputBuffer += output;
        session.recording.push({ timestamp: Date.now(), type: 'rx', data: output });
        this.metrics.bytesReceived += data.length;

        this.emit('output', { sessionId, data: output });
        session.listeners.forEach(callback => callback(output));
      });

      // Handle errors
      port.on('error', (err) => {
        console.error(`Serial port error on ${sessionId}:`, err.message);
        this.emit('error', { sessionId, error: err.message });
      });

      // Handle close
      port.on('close', () => {
        console.log(`Serial port ${sessionId} closed`);
        this.emit('close', { sessionId });
        this.sessions.delete(sessionId);
      });
    });
  }

  /**
   * Write data to serial port
   */
  async write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return new Promise((resolve, reject) => {
      session.port.write(data, (err) => {
        if (err) {
          reject(new Error(`Write failed: ${err.message}`));
          return;
        }

        session.recording.push({ timestamp: Date.now(), type: 'tx', data });
        this.metrics.bytesTransmitted += data.length;
        resolve({ bytes: data.length });
      });
    });
  }

  /**
   * Send command (with newline)
   */
  async sendCommand(sessionId, command) {
    return this.write(sessionId, command + '\r\n');
  }

  /**
   * Get session info
   */
  getSessionInfo(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      type: session.type,
      path: session.portPath,
      baudRate: session.baudRate,
      uptime: Date.now() - session.startTime,
      recordingSize: session.recording.length
    };
  }

  /**
   * List all sessions
   */
  listSessions() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      type: session.type,
      path: session.portPath,
      baudRate: session.baudRate,
      uptime: Date.now() - session.startTime
    }));
  }

  /**
   * Close session
   */
  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    console.log(`Closing serial session ${sessionId}...`);

    if (session.port && session.port.isOpen) {
      session.port.close();
    }

    this.sessions.delete(sessionId);
    return true;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessions.size
    };
  }

  /**
   * Cleanup all sessions
   */
  cleanup() {
    console.log('Cleaning up Serial engine...');

    for (const [sessionId] of this.sessions.entries()) {
      try {
        this.closeSession(sessionId);
      } catch (error) {
        console.error(`Failed to close session ${sessionId}:`, error);
      }
    }

    this.sessions.clear();
  }
}

module.exports = { SerialEngine };
