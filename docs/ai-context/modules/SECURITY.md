# Security Module - AI Context Documentation

## Module Overview

**Security Module** provides comprehensive security vulnerability detection, OWASP Top 10 assessment, CVE database integration, compliance checking, and risk scoring for network and web application security.

### Core Purpose
- Network vulnerability scanning
- SSL/TLS security assessment
- Web application security testing
- OWASP Top 10 compliance
- CVE database integration
- Risk scoring and reporting

---

## File Structure

```
src/modules/security/
├── backend/
│   ├── vulnerability-scanner.cjs  # Main scanner (1271 lines)
│   ├── compliance-checker.cjs     # Compliance assessment
│   └── risk-scorer.cjs            # Risk scoring engine
├── types/
│   └── index.ts                   # TypeScript interfaces
└── index.tsx                      # Module entry point
```

---

## Backend Components

### VulnerabilityScanner (vulnerability-scanner.cjs)

**Purpose**: Comprehensive security vulnerability detection and analysis.

**Key Class**: `VulnerabilityScanner`

**OWASP Top 10 (2021) Coverage**:
```javascript
owaspTop10 = {
  A01_2021: {
    name: 'Broken Access Control',
    severity: 'CRITICAL',
    indicators: ['Missing authentication', 'Insecure direct object refs', 'Path traversal'],
    cweIds: ['CWE-22', 'CWE-284', 'CWE-639']
  },
  A02_2021: {
    name: 'Cryptographic Failures',
    severity: 'HIGH',
    indicators: ['Weak encryption', 'Hardcoded secrets', 'Deprecated TLS'],
    cweIds: ['CWE-259', 'CWE-327', 'CWE-326']
  },
  A03_2021: {
    name: 'Injection',
    severity: 'CRITICAL',
    indicators: ['SQL injection', 'Command injection', 'Template injection'],
    cweIds: ['CWE-79', 'CWE-89', 'CWE-73']
  },
  A04_2021: {
    name: 'Insecure Design',
    severity: 'MEDIUM',
    indicators: ['Missing rate limiting', 'No security logging'],
    cweIds: ['CWE-209', 'CWE-256', 'CWE-501']
  },
  A05_2021: {
    name: 'Security Misconfiguration',
    severity: 'HIGH',
    indicators: ['Default credentials', 'Verbose errors', 'Missing headers'],
    cweIds: ['CWE-16', 'CWE-611', 'CWE-614']
  },
  // ... A06-A10
};
```

**Scan Types**:

| Scan Type | Description |
|-----------|-------------|
| `network` | Port scanning, service detection |
| `ssl` | SSL/TLS certificate and protocol analysis |
| `service` | Service version CVE lookup |
| `web` | HTTP security headers, OWASP checks |
| `config` | Configuration best practices |
| `comprehensive` | All scan types combined |

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `scanTarget(target, options)` | host/IP, `{scanType}` | `ScanResult` | Full vulnerability scan |
| `scanNetworkVulnerabilities(target)` | host/IP | `Vulnerability[]` | Network/port scan |
| `scanSSLTLSVulnerabilities(target)` | host/IP | `Vulnerability[]` | SSL/TLS assessment |
| `scanServiceVulnerabilities(target)` | host/IP | `Vulnerability[]` | Service CVE lookup |
| `scanWebVulnerabilities(target)` | host/URL | `Vulnerability[]` | Web security scan |
| `checkSecurityHeaders(target)` | host/URL | `Vulnerability[]` | HTTP header check |
| `exportResults(scanId, format)` | scan ID, 'json'\|'html'\|'csv' | `string` | Export report |

**Vulnerability Object Structure**:
```javascript
{
  id: 'SSL-001',
  type: 'ssl' | 'network' | 'web' | 'service' | 'cve' | 'owasp',
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO',
  title: 'Weak SSL/TLS Protocol Version',
  description: 'Server supports deprecated protocol TLSv1.0',
  impact: 'Vulnerable to POODLE, BEAST attacks',
  recommendation: 'Disable TLSv1.0/1.1, use TLSv1.2+',
  references: ['CVE-2014-3566', 'https://...'],
  cvssScore?: number,
  port?: number,
  service?: string
}
```

**Scan Result Structure**:
```javascript
{
  scanId: 'uuid',
  target: 'example.com',
  timestamp: 'ISO date',
  scanType: 'comprehensive',
  duration: 12345,  // ms
  vulnerabilities: Vulnerability[],
  summary: {
    critical: 0,
    high: 2,
    medium: 5,
    low: 3,
    info: 10
  },
  recommendations: [
    {
      priority: 'IMMEDIATE',
      title: 'Address Critical Vulnerabilities',
      actions: ['Update SSL', 'Patch services']
    }
  ]
}
```

**Network Scanning**:
```javascript
// Common ports checked
const commonPorts = [
  { port: 21, service: 'FTP', vulns: ['Anonymous access'] },
  { port: 22, service: 'SSH', vulns: ['Weak key exchange'] },
  { port: 23, service: 'Telnet', vulns: ['Unencrypted'] },
  { port: 80, service: 'HTTP', vulns: ['Missing headers'] },
  { port: 443, service: 'HTTPS', vulns: ['Weak ciphers'] },
  { port: 445, service: 'SMB', vulns: ['EternalBlue'] },
  { port: 3306, service: 'MySQL', vulns: ['Default creds'] },
  { port: 3389, service: 'RDP', vulns: ['BlueKeep'] },
  // ... more ports
];
```

**SSL/TLS Checks**:
- Protocol version (SSLv2/3, TLSv1.0/1.1 = vulnerable)
- Cipher suite strength
- Certificate expiration
- Certificate chain validation
- Self-signed detection
- Signature algorithm (SHA1/MD5 = weak)
- Key size (< 2048 bits = weak)
- Heartbleed, DROWN, FREAK, Logjam detection

**HTTP Security Headers**:
```javascript
const requiredHeaders = [
  'strict-transport-security',      // HSTS
  'x-frame-options',                // Clickjacking
  'x-content-type-options',         // MIME sniffing
  'content-security-policy',        // XSS prevention
  'x-xss-protection'                // XSS filter
];
```

---

## IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `security:scan` | Renderer → Main | `{target, scanType}` | `ScanResult` |
| `security:getScanHistory` | Renderer → Main | none | `ScanResult[]` |
| `security:exportScan` | Renderer → Main | `{scanId, format}` | `string` |
| `security:checkHeaders` | Renderer → Main | `{url}` | `HeaderResult` |
| `security:checkSSL` | Renderer → Main | `{host}` | `SSLResult` |

---

## Integration Points

### With NinjaShark
- Share detected network anomalies
- Correlate packet analysis with vulnerabilities
- Security events from traffic analysis

### With NetworkMap
- Scan discovered hosts
- Visualize vulnerabilities on topology

### With Remote Access
- Security audit of remote connections
- Credential policy enforcement

### With KageForge
- AI-assisted vulnerability analysis
- Natural language security queries

---

## Current State

### Implemented
- OWASP Top 10 2021 framework
- Port scanning with service detection
- SSL/TLS comprehensive assessment
- HTTP security header validation
- CVE database integration (placeholder)
- Service fingerprinting
- End-of-life software detection
- Multi-format export (JSON, HTML, CSV)

### Placeholder/Partial
- CVE database (needs external feed)
- Heartbleed/DROWN checks (simplified)
- SFTP file integrity scanning

---

## Improvement Opportunities

1. **CVE Integration**: Live CVE database updates
2. **Exploit Database**: Reference to known exploits
3. **Compliance Frameworks**: CIS, NIST, PCI-DSS
4. **Active Testing**: Authenticated scans
5. **Scheduled Scans**: Automated recurring scans
6. **Delta Reports**: Compare scan results over time
7. **API Integration**: REST API for CI/CD pipelines
8. **Remediation Tracking**: Track fix status
