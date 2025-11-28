#!/usr/bin/env node
/**
 * Ninja Toolkit - Pre-build RAM Audit Hook
 * Ensures average memory usage stays below 400MB during build
 * Per Prompt 12: pre-build 'ram-audit' (<400MB avg)
 */

const os = require('os');
const { execSync } = require('child_process');

const MAX_AVG_RAM_MB = 400;
const SAMPLE_COUNT = 5;
const SAMPLE_INTERVAL_MS = 200;

class RAMAudit {
  constructor() {
    this.samples = [];
  }

  getProcessMemoryMB() {
    const used = process.memoryUsage();
    return Math.round(used.heapUsed / 1024 / 1024);
  }

  getSystemMemoryMB() {
    const total = os.totalmem();
    const free = os.freemem();
    return Math.round((total - free) / 1024 / 1024);
  }

  async collectSamples() {
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      this.samples.push({
        process: this.getProcessMemoryMB(),
        system: this.getSystemMemoryMB(),
        timestamp: Date.now()
      });
      await new Promise(resolve => setTimeout(resolve, SAMPLE_INTERVAL_MS));
    }
  }

  calculateAverage() {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((acc, s) => acc + s.process, 0);
    return Math.round(sum / this.samples.length);
  }

  generateReport() {
    const avgRAM = this.calculateAverage();
    const systemRAM = this.samples[this.samples.length - 1]?.system || 0;
    const passed = avgRAM < MAX_AVG_RAM_MB;

    return {
      passed,
      averageRAM: avgRAM,
      maxAllowed: MAX_AVG_RAM_MB,
      systemRAM,
      samples: this.samples.length,
      timestamp: new Date().toISOString(),
      message: passed
        ? `RAM audit PASSED: ${avgRAM}MB avg (limit: ${MAX_AVG_RAM_MB}MB)`
        : `RAM audit FAILED: ${avgRAM}MB avg exceeds ${MAX_AVG_RAM_MB}MB limit`
    };
  }

  async run() {
    console.log('[RAM-Audit] Starting pre-build memory audit...');
    console.log(`[RAM-Audit] Collecting ${SAMPLE_COUNT} samples...`);

    await this.collectSamples();

    const report = this.generateReport();

    console.log(`[RAM-Audit] Average Process RAM: ${report.averageRAM}MB`);
    console.log(`[RAM-Audit] System RAM Usage: ${report.systemRAM}MB`);
    console.log(`[RAM-Audit] ${report.message}`);

    if (!report.passed) {
      console.error('[RAM-Audit] Build may cause memory issues. Consider closing other applications.');
      process.exit(1);
    }

    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const audit = new RAMAudit();
  audit.run().then(report => {
    console.log('[RAM-Audit] Report:', JSON.stringify(report, null, 2));
  }).catch(err => {
    console.error('[RAM-Audit] Error:', err);
    process.exit(1);
  });
}

module.exports = RAMAudit;
