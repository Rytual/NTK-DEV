#!/usr/bin/env node
/**
 * Ninja Toolkit - Security Audit
 * Per Prompt 12: 'deploy-security-skill' (Sandbox/keytar/UAC gate)
 *
 * Audits application security for MSP deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityAudit {
  constructor() {
    this.findings = [];
    this.score = 100;
  }

  /**
   * Check Electron security fuses
   */
  checkSecurityFuses() {
    const forgeConfig = path.join(__dirname, '..', 'forge.config.js');

    try {
      const config = fs.readFileSync(forgeConfig, 'utf8');

      const fuses = {
        RunAsNode: config.includes('RunAsNode]: false'),
        CookieEncryption: config.includes('EnableCookieEncryption]: true'),
        NodeOptions: config.includes('EnableNodeOptionsEnvironmentVariable]: false'),
        NodeCliInspect: config.includes('EnableNodeCliInspectArguments]: false'),
        AsarIntegrity: config.includes('EnableEmbeddedAsarIntegrityValidation]: true'),
        OnlyLoadFromAsar: config.includes('OnlyLoadAppFromAsar]: true')
      };

      const allEnabled = Object.values(fuses).every(v => v);

      this.findings.push({
        category: 'Electron Fuses',
        status: allEnabled ? 'pass' : 'warn',
        message: allEnabled
          ? 'All security fuses properly configured'
          : 'Some security fuses not optimally configured',
        details: fuses
      });

      if (!allEnabled) this.score -= 10;
    } catch (error) {
      this.findings.push({
        category: 'Electron Fuses',
        status: 'error',
        message: 'Could not read forge.config.js',
        error: error.message
      });
      this.score -= 15;
    }
  }

  /**
   * Check preload script security
   */
  checkPreloadSecurity() {
    const preloadPaths = [
      path.join(__dirname, '..', 'src', 'preload.js'),
      path.join(__dirname, '..', 'src', 'preload.ts')
    ];

    let preloadContent = null;
    let preloadPath = null;

    for (const p of preloadPaths) {
      if (fs.existsSync(p)) {
        preloadContent = fs.readFileSync(p, 'utf8');
        preloadPath = p;
        break;
      }
    }

    if (!preloadContent) {
      this.findings.push({
        category: 'Preload Security',
        status: 'error',
        message: 'No preload script found'
      });
      this.score -= 20;
      return;
    }

    const checks = {
      usesContextBridge: preloadContent.includes('contextBridge'),
      noNodeIntegration: !preloadContent.includes('nodeIntegration: true'),
      hasChannelWhitelist: preloadContent.includes('ALLOWED_CHANNELS') ||
                          preloadContent.includes('validChannels') ||
                          preloadContent.includes('INVOKE_CHANNELS'),
      noEval: !preloadContent.includes('eval('),
      noRemoteModule: !preloadContent.includes('remote.require')
    };

    const allSecure = Object.values(checks).every(v => v);

    this.findings.push({
      category: 'Preload Security',
      status: allSecure ? 'pass' : 'warn',
      message: allSecure
        ? 'Preload script follows security best practices'
        : 'Some preload security concerns detected',
      details: checks
    });

    if (!checks.usesContextBridge) this.score -= 15;
    if (!checks.hasChannelWhitelist) this.score -= 10;
    if (!checks.noEval) this.score -= 20;
  }

  /**
   * Check for hardcoded secrets
   */
  checkHardcodedSecrets() {
    const srcDir = path.join(__dirname, '..', 'src');
    const patterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret\s*[:=]\s*['"][^'"]{20,}['"]/gi,
      /token\s*[:=]\s*['"][^'"]{20,}['"]/gi,
      /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g
    ];

    let secretsFound = 0;

    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory() && !file.name.includes('node_modules')) {
          scanDir(fullPath);
        } else if (file.isFile() && /\.(js|ts|jsx|tsx|json)$/.test(file.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            for (const pattern of patterns) {
              const matches = content.match(pattern);
              if (matches) {
                secretsFound += matches.length;
              }
            }
          } catch (e) {}
        }
      }
    };

    scanDir(srcDir);

    this.findings.push({
      category: 'Hardcoded Secrets',
      status: secretsFound === 0 ? 'pass' : 'fail',
      message: secretsFound === 0
        ? 'No hardcoded secrets detected'
        : `Found ${secretsFound} potential hardcoded secrets`,
      count: secretsFound
    });

    if (secretsFound > 0) this.score -= 25;
  }

  /**
   * Check UAC requirements
   */
  checkUACRequirements() {
    const manifestPath = path.join(__dirname, '..', 'app.manifest');
    const nsisPath = path.join(__dirname, '..', 'build', 'installer.nsi');

    let requiresAdmin = false;

    if (fs.existsSync(nsisPath)) {
      const nsisContent = fs.readFileSync(nsisPath, 'utf8');
      requiresAdmin = nsisContent.includes('RequestExecutionLevel admin') ||
                     nsisContent.includes('UserInfo::GetAccountType');
    }

    this.findings.push({
      category: 'UAC Gate',
      status: 'pass',
      message: requiresAdmin
        ? 'Installer requests admin elevation for system-wide install'
        : 'Per-user installation available (no UAC required)',
      requiresAdmin
    });
  }

  /**
   * Check sandbox configuration
   */
  checkSandbox() {
    const mainPaths = [
      path.join(__dirname, '..', 'src', 'main.ts'),
      path.join(__dirname, '..', 'src', 'main.js')
    ];

    let mainContent = null;

    for (const p of mainPaths) {
      if (fs.existsSync(p)) {
        mainContent = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!mainContent) {
      this.findings.push({
        category: 'Sandbox Configuration',
        status: 'warn',
        message: 'Could not verify sandbox configuration'
      });
      return;
    }

    const checks = {
      sandboxEnabled: mainContent.includes('sandbox: true') ||
                     !mainContent.includes('sandbox: false'),
      contextIsolation: mainContent.includes('contextIsolation: true') ||
                       !mainContent.includes('contextIsolation: false'),
      webSecurity: !mainContent.includes('webSecurity: false')
    };

    const allSecure = Object.values(checks).every(v => v);

    this.findings.push({
      category: 'Sandbox Configuration',
      status: allSecure ? 'pass' : 'warn',
      message: allSecure
        ? 'Renderer process sandbox properly configured'
        : 'Some sandbox settings may be insecure',
      details: checks
    });

    if (!checks.sandboxEnabled) this.score -= 15;
    if (!checks.contextIsolation) this.score -= 15;
    if (!checks.webSecurity) this.score -= 20;
  }

  /**
   * Check dependency vulnerabilities
   */
  async checkDependencies() {
    try {
      const result = execSync('npm audit --json 2>/dev/null', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        timeout: 60000
      });

      const audit = JSON.parse(result);
      const vulns = audit.metadata?.vulnerabilities || {};
      const total = (vulns.high || 0) + (vulns.critical || 0);

      this.findings.push({
        category: 'Dependency Vulnerabilities',
        status: total === 0 ? 'pass' : 'warn',
        message: total === 0
          ? 'No high/critical vulnerabilities found'
          : `${total} high/critical vulnerabilities detected`,
        details: vulns
      });

      if (vulns.critical > 0) this.score -= 20;
      if (vulns.high > 0) this.score -= 10;
    } catch (error) {
      this.findings.push({
        category: 'Dependency Vulnerabilities',
        status: 'info',
        message: 'npm audit check skipped (offline or no package-lock.json)'
      });
    }
  }

  /**
   * Run full security audit
   */
  async run() {
    console.log('[Security-Audit] Starting security audit...');

    this.checkSecurityFuses();
    this.checkPreloadSecurity();
    this.checkHardcodedSecrets();
    this.checkUACRequirements();
    this.checkSandbox();
    await this.checkDependencies();

    return this.generateReport();
  }

  /**
   * Generate audit report
   */
  generateReport() {
    const passed = this.findings.filter(f => f.status === 'pass').length;
    const warnings = this.findings.filter(f => f.status === 'warn').length;
    const failed = this.findings.filter(f => f.status === 'fail').length;

    this.score = Math.max(0, Math.min(100, this.score));

    return {
      timestamp: new Date().toISOString(),
      score: this.score,
      grade: this.score >= 90 ? 'A' :
             this.score >= 80 ? 'B' :
             this.score >= 70 ? 'C' :
             this.score >= 60 ? 'D' : 'F',
      summary: {
        total: this.findings.length,
        passed,
        warnings,
        failed
      },
      findings: this.findings,
      recommendation: this.score >= 80
        ? 'Application passes security requirements for MSP deployment'
        : 'Address security findings before MSP deployment'
    };
  }
}

// Run if called directly
if (require.main === module) {
  const audit = new SecurityAudit();

  audit.run().then(report => {
    console.log('\n' + '='.repeat(60));
    console.log('[Security-Audit] AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`Security Score: ${report.score}/100 (Grade: ${report.grade})`);
    console.log(`Checks: ${report.summary.passed} passed, ${report.summary.warnings} warnings, ${report.summary.failed} failed`);
    console.log('\nFindings:');

    for (const finding of report.findings) {
      const icon = finding.status === 'pass' ? '[PASS]' :
                   finding.status === 'warn' ? '[WARN]' :
                   finding.status === 'fail' ? '[FAIL]' : '[INFO]';
      console.log(`  ${icon} ${finding.category}: ${finding.message}`);
    }

    console.log(`\nRecommendation: ${report.recommendation}`);

    // Write report to file
    const reportPath = path.join(__dirname, '..', 'build', 'security-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved: ${reportPath}`);
  }).catch(err => {
    console.error('[Security-Audit] Error:', err);
    process.exit(1);
  });
}

module.exports = SecurityAudit;
