/**
 * Security Suite Module Type Definitions
 * Vulnerability scanning, compliance checking, and risk scoring types
 */

// ============================================================================
// Vulnerability Scanning Types
// ============================================================================

export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type VulnerabilityCategory =
  | 'injection'
  | 'broken-auth'
  | 'sensitive-data'
  | 'xxe'
  | 'broken-access'
  | 'security-misconfig'
  | 'xss'
  | 'insecure-deserialization'
  | 'components-vuln'
  | 'insufficient-logging'
  | 'network'
  | 'cryptographic'
  | 'other';

export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ScanPhase = 'service-detection' | 'port-analysis' | 'ssl-tls-check' | 'cve-lookup' | 'config-check' | 'completed';

export interface VulnerabilityScan {
  id: string;
  target: string;
  startTime: number;
  endTime?: number;
  status: ScanStatus;
  phase: ScanPhase;
  progress: number;
  options: ScanOptions;
  findings: VulnerabilityFinding[];
  statistics: ScanStatistics;
}

export interface ScanOptions {
  scanType?: 'quick' | 'standard' | 'thorough' | 'custom';
  portRange?: string;
  serviceDetection?: boolean;
  osDetection?: boolean;
  sslTlsCheck?: boolean;
  cveLookup?: boolean;
  configAudit?: boolean;
  aggressive?: boolean;
  timeout?: number;
  maxThreads?: number;
}

export interface ScanStatistics {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  portsScanned: number;
  servicesDetected: number;
  cveChecked: number;
  executionTime: number;
}

export interface VulnerabilityFinding {
  id: string;
  scanId: string;
  target: string;
  type: VulnerabilityCategory;
  severity: VulnerabilitySeverity;
  title: string;
  description: string;
  port?: number;
  protocol?: 'tcp' | 'udp';
  service?: string;
  cve?: CVEReference[];
  cvssScore?: number;
  cvssVector?: string;
  exploitAvailable?: boolean;
  exploitMaturity?: 'unproven' | 'proof-of-concept' | 'functional' | 'high';
  affectedComponent: string;
  evidence: string[];
  recommendation: string;
  references: string[];
  discovered: number;
  verified: boolean;
  falsePositive: boolean;
  mitigated: boolean;
  metadata: Record<string, any>;
}

export interface CVEReference {
  id: string;
  description: string;
  published: string;
  modified: string;
  cvssV3Score?: number;
  cvssV3Vector?: string;
  cvssV2Score?: number;
  cvssV2Vector?: string;
  cwe?: string[];
  references: string[];
  vendorAdvisory?: string[];
  patches?: PatchInfo[];
  affectedVersions: string[];
  fixedVersions?: string[];
}

export interface PatchInfo {
  vendor: string;
  product: string;
  version: string;
  patchUrl: string;
  releaseDate?: string;
}

export interface SSLTLSVulnerability {
  type: 'heartbleed' | 'poodle' | 'drown' | 'freak' | 'logjam' | 'beast' | 'crime' | 'breach' | 'weak-cipher' | 'expired-cert' | 'self-signed' | 'protocol-vuln';
  severity: VulnerabilitySeverity;
  name: string;
  description: string;
  detected: boolean;
  port: number;
  protocol: string;
  cipherSuite?: string;
  tlsVersion?: string;
  certificateIssues?: CertificateIssue[];
  recommendation: string;
}

export interface CertificateIssue {
  type: 'expired' | 'self-signed' | 'weak-signature' | 'hostname-mismatch' | 'untrusted-ca' | 'revoked';
  description: string;
  severity: VulnerabilitySeverity;
}

export interface PortVulnerability {
  port: number;
  protocol: 'tcp' | 'udp';
  service: string;
  version?: string;
  vulnerabilities: VulnerabilityFinding[];
  exposureRisk: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface ConfigurationIssue {
  type: 'security-misconfig' | 'weak-password' | 'default-credentials' | 'unnecessary-service' | 'excessive-permissions' | 'missing-patch' | 'outdated-software';
  severity: VulnerabilitySeverity;
  component: string;
  description: string;
  currentValue?: string;
  recommendedValue?: string;
  remediation: string;
}

// ============================================================================
// CVE Database Types
// ============================================================================

export interface CVEDatabase {
  version: string;
  lastUpdate: number;
  totalEntries: number;
  entries: Map<string, CVEEntry>;
}

export interface CVEEntry {
  id: string;
  description: string;
  published: string;
  modified: string;
  cvssV3?: CVSSv3Metrics;
  cvssV2?: CVSSv2Metrics;
  cwe: string[];
  references: CVEExternalReference[];
  configurations: CPEConfiguration[];
  impact: CVEImpact;
  exploitability?: ExploitabilityMetrics;
}

export interface CVSSv3Metrics {
  baseScore: number;
  baseSeverity: VulnerabilitySeverity;
  vectorString: string;
  attackVector: 'network' | 'adjacent' | 'local' | 'physical';
  attackComplexity: 'low' | 'high';
  privilegesRequired: 'none' | 'low' | 'high';
  userInteraction: 'none' | 'required';
  scope: 'unchanged' | 'changed';
  confidentialityImpact: 'none' | 'low' | 'high';
  integrityImpact: 'none' | 'low' | 'high';
  availabilityImpact: 'none' | 'low' | 'high';
  exploitabilityScore?: number;
  impactScore?: number;
}

export interface CVSSv2Metrics {
  baseScore: number;
  vectorString: string;
  accessVector: 'network' | 'adjacent-network' | 'local';
  accessComplexity: 'low' | 'medium' | 'high';
  authentication: 'none' | 'single' | 'multiple';
  confidentialityImpact: 'none' | 'partial' | 'complete';
  integrityImpact: 'none' | 'partial' | 'complete';
  availabilityImpact: 'none' | 'partial' | 'complete';
}

export interface CVEExternalReference {
  source: string;
  url: string;
  tags?: string[];
}

export interface CPEConfiguration {
  vulnerable: boolean;
  cpe23Uri: string;
  versionStartIncluding?: string;
  versionEndIncluding?: string;
  versionStartExcluding?: string;
  versionEndExcluding?: string;
}

export interface CVEImpact {
  baseMetricV3?: {
    cvssV3: CVSSv3Metrics;
    exploitabilityScore: number;
    impactScore: number;
  };
  baseMetricV2?: {
    cvssV2: CVSSv2Metrics;
    severity: string;
    exploitabilityScore: number;
    impactScore: number;
  };
}

export interface ExploitabilityMetrics {
  exploitAvailable: boolean;
  exploitMaturity: 'unproven' | 'proof-of-concept' | 'functional' | 'high' | 'not-defined';
  remediationLevel: 'official-fix' | 'temporary-fix' | 'workaround' | 'unavailable' | 'not-defined';
  reportConfidence: 'confirmed' | 'reasonable' | 'unknown' | 'not-defined';
}

// ============================================================================
// Compliance Checking Types
// ============================================================================

export type ComplianceFramework =
  | 'pci-dss'
  | 'hipaa'
  | 'iso-27001'
  | 'soc-2'
  | 'gdpr'
  | 'cis'
  | 'nist-csf'
  | 'nist-800-53'
  | 'fedramp'
  | 'ccpa';

export type ComplianceStatus = 'compliant' | 'non-compliant' | 'partial' | 'not-applicable' | 'not-assessed';
export type ControlCategory =
  | 'access-control'
  | 'audit-logging'
  | 'data-protection'
  | 'network-security'
  | 'vulnerability-management'
  | 'incident-response'
  | 'configuration-management'
  | 'physical-security'
  | 'risk-assessment'
  | 'business-continuity'
  | 'supplier-management'
  | 'human-resources'
  | 'cryptography'
  | 'operations-security';

export interface ComplianceAssessment {
  id: string;
  framework: ComplianceFramework;
  version: string;
  target: string;
  startTime: number;
  endTime?: number;
  status: ScanStatus;
  overallCompliance: number;
  results: ControlAssessmentResult[];
  gaps: ComplianceGap[];
  recommendations: string[];
  assessor?: string;
  metadata: Record<string, any>;
}

export interface ControlAssessmentResult {
  controlId: string;
  controlName: string;
  category: ControlCategory;
  description: string;
  requirement: string;
  status: ComplianceStatus;
  complianceScore: number;
  findings: ControlFinding[];
  evidence: Evidence[];
  lastAssessed: number;
  assessmentMethod: 'automated' | 'manual' | 'hybrid';
  notes?: string;
}

export interface ControlFinding {
  id: string;
  severity: VulnerabilitySeverity;
  description: string;
  impact: string;
  recommendation: string;
  affectedAssets: string[];
  discovered: number;
  remediated: boolean;
}

export interface Evidence {
  type: 'configuration' | 'log' | 'screenshot' | 'document' | 'testimony' | 'scan-result';
  description: string;
  source: string;
  timestamp: number;
  content?: string;
  fileRef?: string;
}

export interface ComplianceGap {
  controlId: string;
  framework: ComplianceFramework;
  severity: VulnerabilitySeverity;
  description: string;
  currentState: string;
  requiredState: string;
  remediationSteps: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  priority: number;
  dueDate?: number;
}

export interface ComplianceFrameworkDefinition {
  id: ComplianceFramework;
  name: string;
  version: string;
  description: string;
  applicability: string[];
  controls: ComplianceControl[];
  totalControls: number;
  lastUpdated: number;
}

export interface ComplianceControl {
  id: string;
  name: string;
  category: ControlCategory;
  description: string;
  requirement: string;
  guideline: string;
  testingProcedures: string[];
  automatable: boolean;
  references: string[];
  relatedControls?: string[];
}

// ============================================================================
// Risk Scoring Types
// ============================================================================

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'negligible';
export type AssetCriticality = 'mission-critical' | 'high' | 'medium' | 'low';
export type ThreatType = 'spoofing' | 'tampering' | 'repudiation' | 'information-disclosure' | 'denial-of-service' | 'elevation-of-privilege';

export interface RiskAssessment {
  id: string;
  target: string;
  timestamp: number;
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  assetCriticality: AssetCriticality;
  vulnerabilityScore: number;
  threatScore: number;
  impactScore: number;
  likelihoodScore: number;
  risks: IdentifiedRisk[];
  threats: ThreatAssessment[];
  mitigations: Mitigation[];
  residualRisk: number;
  acceptableRisk: number;
  riskHeatMap: RiskHeatMapData;
}

export interface IdentifiedRisk {
  id: string;
  name: string;
  description: string;
  category: string;
  riskScore: number;
  riskLevel: RiskLevel;
  likelihood: number;
  impact: number;
  cvssScore?: number;
  affectedAssets: string[];
  vulnerabilities: string[];
  threats: string[];
  businessImpact: BusinessImpact;
  currentControls: string[];
  controlEffectiveness: number;
  residualRisk: number;
  recommendedActions: string[];
  owner?: string;
  dueDate?: number;
}

export interface ThreatAssessment {
  id: string;
  type: ThreatType;
  name: string;
  description: string;
  likelihood: number;
  impact: number;
  threatScore: number;
  threatActors: string[];
  attackVectors: string[];
  affectedAssets: string[];
  existingControls: string[];
  controlGaps: string[];
  recommendations: string[];
}

export interface BusinessImpact {
  financial: number;
  reputational: number;
  operational: number;
  legal: number;
  safety: number;
  overallScore: number;
  description: string;
}

export interface Mitigation {
  id: string;
  riskId: string;
  type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  description: string;
  implementation: string;
  effectiveness: number;
  cost: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  status: 'planned' | 'in-progress' | 'implemented' | 'verified';
  owner?: string;
  dueDate?: number;
  completedDate?: number;
}

export interface RiskHeatMapData {
  zones: RiskZone[];
  risks: RiskPlotPoint[];
}

export interface RiskZone {
  name: string;
  likelihoodRange: [number, number];
  impactRange: [number, number];
  color: string;
  level: RiskLevel;
}

export interface RiskPlotPoint {
  riskId: string;
  name: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  level: RiskLevel;
}

export interface CVSSCalculation {
  version: '3.1' | '3.0' | '2.0';
  vectorString: string;
  baseScore: number;
  temporalScore?: number;
  environmentalScore?: number;
  baseSeverity: VulnerabilitySeverity;
  metrics: CVSSv3Metrics;
  subscores: {
    exploitability: number;
    impact: number;
  };
}

export interface STRIDEAnalysis {
  target: string;
  threats: STRIDEThreat[];
  overallScore: number;
  recommendations: string[];
}

export interface STRIDEThreat {
  category: ThreatType;
  description: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  existingControls: string[];
  gaps: string[];
  recommendations: string[];
}

// ============================================================================
// Security Assessment Types
// ============================================================================

export interface SecurityAssessment {
  id: string;
  name: string;
  target: string;
  startTime: number;
  endTime?: number;
  status: ScanStatus;
  type: 'vulnerability' | 'compliance' | 'risk' | 'comprehensive';
  vulnerabilityScan?: VulnerabilityScan;
  complianceAssessments?: ComplianceAssessment[];
  riskAssessment?: RiskAssessment;
  overallScore: number;
  summary: AssessmentSummary;
  reports: ReportReference[];
}

export interface AssessmentSummary {
  totalFindings: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  complianceScore?: number;
  riskScore?: number;
  securityPosture: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  topRisks: string[];
  immediateActions: string[];
}

export interface ReportReference {
  id: string;
  type: 'pdf' | 'html' | 'json' | 'xml' | 'csv';
  name: string;
  path: string;
  generated: number;
  size: number;
}

// ============================================================================
// Reporting Types
// ============================================================================

export interface SecurityReport {
  id: string;
  title: string;
  assessmentId: string;
  generated: number;
  author: string;
  format: 'pdf' | 'html' | 'json' | 'xml' | 'csv';
  sections: ReportSection[];
  executiveSummary: string;
  findings: VulnerabilityFinding[];
  recommendations: Recommendation[];
  appendices: Appendix[];
}

export interface ReportSection {
  title: string;
  content: string;
  subsections?: ReportSection[];
  charts?: ChartData[];
  tables?: TableData[];
}

export interface Recommendation {
  priority: number;
  category: string;
  description: string;
  rationale: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface Appendix {
  title: string;
  content: string;
  type: 'technical-details' | 'methodology' | 'tools' | 'references' | 'glossary';
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
  title: string;
  data: any[];
  labels?: string[];
}

export interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
}

// ============================================================================
// Scanner Configuration Types
// ============================================================================

export interface ScannerConfig {
  maxConcurrentScans: number;
  defaultTimeout: number;
  cveDatabasePath: string;
  cveDatabaseUpdateInterval: number;
  enableSSLTLSChecks: boolean;
  enableConfigAudit: boolean;
  enableCVELookup: boolean;
  userAgent?: string;
  proxySettings?: ProxyConfig;
  rateLimit?: RateLimitConfig;
}

export interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
}

export interface RateLimitConfig {
  enabled: boolean;
  requestsPerSecond: number;
  burstSize: number;
}

export interface ComplianceCheckerConfig {
  frameworks: ComplianceFramework[];
  dataPath: string;
  enabledCategories: ControlCategory[];
  automatedOnly: boolean;
}

export interface RiskScorerConfig {
  cvssVersion: '3.1' | '3.0' | '2.0';
  enableSTRIDE: boolean;
  defaultAssetCriticality: AssetCriticality;
  riskTolerance: number;
  businessImpactWeights: {
    financial: number;
    reputational: number;
    operational: number;
    legal: number;
    safety: number;
  };
}

// ============================================================================
// Event Types
// ============================================================================

export interface ScanStartedEvent {
  scanId: string;
  target: string;
  timestamp: number;
}

export interface ScanProgressEvent {
  scanId: string;
  phase: ScanPhase;
  progress: number;
  message: string;
}

export interface ScanCompletedEvent {
  scanId: string;
  executionTime: number;
  findingsCount: number;
}

export interface VulnerabilityFoundEvent {
  scanId: string;
  finding: VulnerabilityFinding;
}

export interface ComplianceGapFoundEvent {
  assessmentId: string;
  gap: ComplianceGap;
}

export interface RiskIdentifiedEvent {
  assessmentId: string;
  risk: IdentifiedRisk;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface VulnerabilityScannerMetrics {
  totalScans: number;
  completedScans: number;
  failedScans: number;
  activeScans: number;
  totalFindings: number;
  findingsBySeverity: Record<VulnerabilitySeverity, number>;
  averageScanTime: number;
  cveChecks: number;
  lastUpdate: number;
}

export interface ComplianceCheckerMetrics {
  totalAssessments: number;
  assessmentsByFramework: Record<ComplianceFramework, number>;
  averageComplianceScore: number;
  totalGaps: number;
  gapsBySeverity: Record<VulnerabilitySeverity, number>;
  lastAssessment: number;
}

export interface RiskScorerMetrics {
  totalRiskAssessments: number;
  averageRiskScore: number;
  risksByLevel: Record<RiskLevel, number>;
  criticalRisks: number;
  mitigationsImplemented: number;
  lastAssessment: number;
}

export interface SecurityMetrics {
  vulnerabilityMetrics: VulnerabilityScannerMetrics;
  complianceMetrics: ComplianceCheckerMetrics;
  riskMetrics: RiskScorerMetrics;
  overallSecurityScore: number;
  trend: 'improving' | 'stable' | 'degrading';
}

// ============================================================================
// Database Types
// ============================================================================

export interface DatabaseRecord {
  id: string;
  type: 'scan' | 'assessment' | 'finding' | 'risk' | 'report';
  data: any;
  created: number;
  updated: number;
  tags?: string[];
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
