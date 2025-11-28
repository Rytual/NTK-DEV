import * as React from 'react';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Activity,
  FileWarning,
  Bug,
  Lock,
  Eye,
  Play,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { ScrollArea } from '../components/ui/ScrollArea';
import { cn } from '../lib/utils';

// Vulnerability type
interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss: number;
  cve?: string;
  affected: string;
  description: string;
  remediation: string;
  status: 'open' | 'fixed' | 'accepted';
  discoveredAt: string;
}

// Mock vulnerabilities
const mockVulnerabilities: Vulnerability[] = [
  {
    id: '1',
    title: 'Remote Code Execution in Apache Log4j',
    severity: 'critical',
    cvss: 10.0,
    cve: 'CVE-2021-44228',
    affected: 'Server-01, Server-02',
    description: 'Apache Log4j2 <=2.14.1 JNDI features do not protect against attacker-controlled LDAP and other JNDI related endpoints.',
    remediation: 'Upgrade Log4j to version 2.17.0 or later',
    status: 'open',
    discoveredAt: '2 hours ago'
  },
  {
    id: '2',
    title: 'SQL Injection in User Login',
    severity: 'high',
    cvss: 8.6,
    affected: 'WebApp-01',
    description: 'The login form is vulnerable to SQL injection attacks through the username parameter.',
    remediation: 'Use parameterized queries and input validation',
    status: 'open',
    discoveredAt: '5 hours ago'
  },
  {
    id: '3',
    title: 'Outdated SSL/TLS Configuration',
    severity: 'medium',
    cvss: 5.3,
    affected: 'Load-Balancer-01',
    description: 'Server supports TLS 1.0 and 1.1 which are deprecated and have known vulnerabilities.',
    remediation: 'Disable TLS 1.0/1.1 and enable TLS 1.3',
    status: 'fixed',
    discoveredAt: '1 day ago'
  },
  {
    id: '4',
    title: 'Missing Security Headers',
    severity: 'low',
    cvss: 3.1,
    affected: 'WebApp-01, WebApp-02',
    description: 'HTTP security headers (X-Frame-Options, CSP, etc.) are not configured.',
    remediation: 'Configure appropriate security headers in web server',
    status: 'accepted',
    discoveredAt: '3 days ago'
  },
  {
    id: '5',
    title: 'Information Disclosure',
    severity: 'info',
    cvss: 0,
    affected: 'API-Server-01',
    description: 'Server version information is exposed in HTTP headers.',
    remediation: 'Configure server to hide version information',
    status: 'open',
    discoveredAt: '1 week ago'
  },
];

// Severity badge component
function SeverityBadge({ severity }: { severity: Vulnerability['severity'] }) {
  const variants: Record<string, any> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'secondary',
    info: 'default'
  };

  return (
    <Badge variant={variants[severity]} className="uppercase text-xs">
      {severity}
    </Badge>
  );
}

// Stats overview
function SecurityStats({ vulnerabilities }: { vulnerabilities: Vulnerability[] }) {
  const stats = {
    critical: vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'open').length,
    high: vulnerabilities.filter(v => v.severity === 'high' && v.status === 'open').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium' && v.status === 'open').length,
    low: vulnerabilities.filter(v => v.severity === 'low' && v.status === 'open').length,
  };

  const total = stats.critical + stats.high + stats.medium + stats.low;
  const riskScore = Math.round((stats.critical * 40 + stats.high * 25 + stats.medium * 10 + stats.low * 5) / Math.max(total, 1));

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className={cn(riskScore > 70 ? 'border-danger/50' : riskScore > 40 ? 'border-warning/50' : 'border-success/50')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Risk Score</p>
              <p className={cn(
                'text-3xl font-bold',
                riskScore > 70 ? 'text-danger' : riskScore > 40 ? 'text-warning' : 'text-success'
              )}>{riskScore}</p>
            </div>
            <Shield className={cn(
              'h-8 w-8',
              riskScore > 70 ? 'text-danger' : riskScore > 40 ? 'text-warning' : 'text-success'
            )} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Critical</p>
              <p className="text-3xl font-bold text-danger">{stats.critical}</p>
            </div>
            <XCircle className="h-8 w-8 text-danger" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">High</p>
              <p className="text-3xl font-bold text-warning">{stats.high}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Medium</p>
              <p className="text-3xl font-bold text-info">{stats.medium}</p>
            </div>
            <FileWarning className="h-8 w-8 text-info" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Low/Info</p>
              <p className="text-3xl font-bold text-foreground-muted">{stats.low}</p>
            </div>
            <Bug className="h-8 w-8 text-foreground-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Scan configuration
function ScanConfig({ onScan }: { onScan: () => void }) {
  const [target, setTarget] = React.useState('');
  const [scanType, setScanType] = React.useState('full');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          New Scan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input
              label="Target (IP, hostname, or range)"
              placeholder="192.168.1.0/24"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
          <div className="w-48">
            <label className="text-sm font-medium mb-1.5 block">Scan Type</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
            >
              <option value="quick">Quick Scan</option>
              <option value="full">Full Scan</option>
              <option value="vuln">Vulnerability Scan</option>
              <option value="compliance">Compliance Check</option>
            </select>
          </div>
          <Button onClick={onScan}>
            <Play className="h-4 w-4 mr-2" />
            Start Scan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Vulnerability list item
function VulnerabilityItem({ vuln, onSelect, isSelected }: {
  vuln: Vulnerability;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 border-b border-border cursor-pointer transition-colors',
        isSelected ? 'bg-primary/5' : 'hover:bg-surface-hover'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SeverityBadge severity={vuln.severity} />
            {vuln.cve && (
              <Badge variant="secondary" className="font-mono text-xs">{vuln.cve}</Badge>
            )}
            <Badge
              variant={vuln.status === 'fixed' ? 'success' : vuln.status === 'accepted' ? 'secondary' : 'default'}
              className="text-xs"
            >
              {vuln.status}
            </Badge>
          </div>
          <h3 className="font-medium mb-1">{vuln.title}</h3>
          <p className="text-sm text-foreground-muted truncate">{vuln.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {vuln.affected}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {vuln.discoveredAt}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-foreground-muted">CVSS</p>
          <p className={cn(
            'text-2xl font-bold',
            vuln.cvss >= 9 ? 'text-danger' : vuln.cvss >= 7 ? 'text-warning' : vuln.cvss >= 4 ? 'text-info' : 'text-foreground-muted'
          )}>{vuln.cvss.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}

// Vulnerability details
function VulnerabilityDetails({ vuln }: { vuln: Vulnerability | null }) {
  if (!vuln) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-muted">
        Select a vulnerability to view details
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SeverityBadge severity={vuln.severity} />
          {vuln.cve && <Badge variant="secondary" className="font-mono">{vuln.cve}</Badge>}
        </div>
        <h2 className="text-xl font-bold">{vuln.title}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-foreground-muted">CVSS Score</p>
          <p className={cn(
            'text-3xl font-bold',
            vuln.cvss >= 9 ? 'text-danger' : vuln.cvss >= 7 ? 'text-warning' : 'text-info'
          )}>{vuln.cvss.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-sm text-foreground-muted">Status</p>
          <Badge
            variant={vuln.status === 'fixed' ? 'success' : vuln.status === 'accepted' ? 'secondary' : 'warning'}
            className="mt-1"
          >
            {vuln.status}
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Affected Assets
        </h3>
        <p className="text-sm text-foreground-muted">{vuln.affected}</p>
      </div>

      <div>
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Description
        </h3>
        <p className="text-sm text-foreground-muted">{vuln.description}</p>
      </div>

      <div>
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Remediation
        </h3>
        <p className="text-sm text-foreground-muted">{vuln.remediation}</p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1">
          Mark as Fixed
        </Button>
        <Button variant="outline" className="flex-1">
          Accept Risk
        </Button>
      </div>
    </div>
  );
}

// Main Security component
export default function Security() {
  const [vulnerabilities] = React.useState<Vulnerability[]>(mockVulnerabilities);
  const [selectedVuln, setSelectedVuln] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterSeverity, setFilterSeverity] = React.useState<string>('all');
  const [isScanning, setIsScanning] = React.useState(false);

  const filteredVulns = vulnerabilities.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.affected.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || v.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const selected = vulnerabilities.find(v => v.id === selectedVuln) || null;

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Shield className="h-7 w-7 text-primary" />
                Security Center
              </h1>
              <p className="text-foreground-muted">Vulnerability scanning and risk management</p>
            </div>
            <Button variant="outline" disabled={isScanning}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isScanning && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <SecurityStats vulnerabilities={vulnerabilities} />

          {/* Scan Config */}
          <ScanConfig onScan={handleScan} />

          {/* Vulnerability List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vulnerabilities</CardTitle>
                <div className="flex items-center gap-2">
                  <SearchInput
                    placeholder="Search vulnerabilities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <select
                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex">
                <div className="flex-1 border-r border-border">
                  {filteredVulns.map(vuln => (
                    <VulnerabilityItem
                      key={vuln.id}
                      vuln={vuln}
                      isSelected={selectedVuln === vuln.id}
                      onSelect={() => setSelectedVuln(vuln.id)}
                    />
                  ))}
                  {filteredVulns.length === 0 && (
                    <div className="p-8 text-center text-foreground-muted">
                      No vulnerabilities found
                    </div>
                  )}
                </div>
                <div className="w-96">
                  <VulnerabilityDetails vuln={selected} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
