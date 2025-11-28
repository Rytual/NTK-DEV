/**
 * Ninja Toolkit - Security Suite Module Entry Point
 * Comprehensive security scanning, compliance checking, and risk assessment
 */

import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

// Backend imports
const VulnerabilityScanner = require('./backend/vulnerability-scanner');
const ComplianceChecker = require('./backend/compliance-checker');
const RiskScorer = require('./backend/risk-scorer');

/**
 * Security Suite Main Component
 */
export const SecuritySuiteModule: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'scanner' | 'compliance' | 'risk'>('scanner');
  const [scanResults, setScanResults] = React.useState<any>(null);
  const [complianceResults, setComplianceResults] = React.useState<any>(null);
  const [riskResults, setRiskResults] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="security-suite-container">
      <header className="suite-header">
        <div className="header-content">
          <Shield className="header-icon" size={32} />
          <h1>Security Suite</h1>
          <p>Comprehensive vulnerability scanning, compliance checking, and risk assessment</p>
        </div>
      </header>

      <nav className="suite-navigation">
        <button
          className={`nav-button ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <AlertTriangle size={20} />
          Vulnerability Scanner
        </button>
        <button
          className={`nav-button ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          <CheckCircle size={20} />
          Compliance Checker
        </button>
        <button
          className={`nav-button ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          <Activity size={20} />
          Risk Assessment
        </button>
      </nav>

      <main className="suite-content">
        {activeTab === 'scanner' && (
          <VulnerabilityScannerPanel
            results={scanResults}
            setResults={setScanResults}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        {activeTab === 'compliance' && (
          <ComplianceCheckerPanel
            results={complianceResults}
            setResults={setComplianceResults}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        {activeTab === 'risk' && (
          <RiskAssessmentPanel
            results={riskResults}
            setResults={setRiskResults}
            loading={loading}
            setLoading={setLoading}
          />
        )}
      </main>
    </div>
  );
};

/**
 * Vulnerability Scanner Panel Component
 */
const VulnerabilityScannerPanel: React.FC<{
  results: any;
  setResults: (results: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}> = ({ results, setResults, loading, setLoading }) => {
  const [target, setTarget] = React.useState('');
  const [scanType, setScanType] = React.useState('comprehensive');

  const scanner = React.useMemo(() => new VulnerabilityScanner(), []);

  const handleScan = async () => {
    if (!target) {
      alert('Please enter a target to scan');
      return;
    }

    setLoading(true);
    try {
      const scanResults = await scanner.scanTarget(target, { scanType });
      setResults(scanResults);
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-panel">
      <div className="panel-header">
        <h2>Vulnerability Scanner</h2>
        <p>Scan networks, services, and applications for security vulnerabilities</p>
      </div>

      <div className="scan-controls">
        <div className="form-group">
          <label>Target (IP/Hostname):</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="192.168.1.1 or example.com"
            className="input-field"
          />
        </div>

        <div className="form-group">
          <label>Scan Type:</label>
          <select
            value={scanType}
            onChange={(e) => setScanType(e.target.value)}
            className="select-field"
          >
            <option value="comprehensive">Comprehensive</option>
            <option value="network">Network Only</option>
            <option value="ssl">SSL/TLS Only</option>
            <option value="service">Service Only</option>
            <option value="web">Web Only</option>
            <option value="config">Configuration Only</option>
          </select>
        </div>

        <button
          onClick={handleScan}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>

      {results && (
        <div className="scan-results">
          <div className="results-summary">
            <h3>Scan Summary</h3>
            <div className="summary-grid">
              <div className="summary-card critical">
                <span className="count">{results.summary.critical}</span>
                <span className="label">Critical</span>
              </div>
              <div className="summary-card high">
                <span className="count">{results.summary.high}</span>
                <span className="label">High</span>
              </div>
              <div className="summary-card medium">
                <span className="count">{results.summary.medium}</span>
                <span className="label">Medium</span>
              </div>
              <div className="summary-card low">
                <span className="count">{results.summary.low}</span>
                <span className="label">Low</span>
              </div>
            </div>
          </div>

          <div className="vulnerabilities-list">
            <h3>Vulnerabilities ({results.vulnerabilities.length})</h3>
            {results.vulnerabilities.map((vuln: any, index: number) => (
              <div key={index} className={`vulnerability-item ${vuln.severity.toLowerCase()}`}>
                <div className="vuln-header">
                  <span className="vuln-id">{vuln.id}</span>
                  <span className={`vuln-severity ${vuln.severity.toLowerCase()}`}>
                    {vuln.severity}
                  </span>
                </div>
                <h4>{vuln.title}</h4>
                <p>{vuln.description}</p>
                <div className="vuln-details">
                  {vuln.port && <span>Port: {vuln.port}</span>}
                  {vuln.service && <span>Service: {vuln.service}</span>}
                  {vuln.cvssScore && <span>CVSS: {vuln.cvssScore}</span>}
                </div>
                <div className="vuln-recommendation">
                  <strong>Recommendation:</strong> {vuln.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compliance Checker Panel Component
 */
const ComplianceCheckerPanel: React.FC<{
  results: any;
  setResults: (results: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}> = ({ results, setResults, loading, setLoading }) => {
  const [framework, setFramework] = React.useState('PCIDSS');

  const checker = React.useMemo(() => {
    const instance = new ComplianceChecker();
    instance.initialize();
    return instance;
  }, []);

  const handleAssess = async () => {
    setLoading(true);
    try {
      const assessment = await checker.assessCompliance(framework, {});
      setResults(assessment);
    } catch (error) {
      console.error('Assessment failed:', error);
      alert('Assessment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compliance-panel">
      <div className="panel-header">
        <h2>Compliance Checker</h2>
        <p>Assess compliance with industry standards and regulations</p>
      </div>

      <div className="compliance-controls">
        <div className="form-group">
          <label>Compliance Framework:</label>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className="select-field"
          >
            <option value="PCIDSS">PCI-DSS v4.0</option>
            <option value="HIPAA">HIPAA Security Rule</option>
            <option value="ISO27001">ISO 27001:2022</option>
            <option value="SOC2">SOC 2</option>
            <option value="GDPR">GDPR</option>
            <option value="CIS">CIS Controls v8</option>
            <option value="NIST">NIST Cybersecurity Framework</option>
          </select>
        </div>

        <button
          onClick={handleAssess}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Assessing...' : 'Start Assessment'}
        </button>
      </div>

      {results && (
        <div className="compliance-results">
          <div className="results-summary">
            <h3>Compliance Score</h3>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-value">{results.complianceScore}%</span>
              </div>
            </div>
            <div className="summary-grid">
              <div className="summary-card compliant">
                <span className="count">{results.summary.compliant}</span>
                <span className="label">Compliant</span>
              </div>
              <div className="summary-card non-compliant">
                <span className="count">{results.summary.nonCompliant}</span>
                <span className="label">Non-Compliant</span>
              </div>
              <div className="summary-card partial">
                <span className="count">{results.summary.partiallyCompliant}</span>
                <span className="label">Partial</span>
              </div>
              <div className="summary-card na">
                <span className="count">{results.summary.notApplicable}</span>
                <span className="label">N/A</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Risk Assessment Panel Component
 */
const RiskAssessmentPanel: React.FC<{
  results: any;
  setResults: (results: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}> = ({ results, setResults, loading, setLoading }) => {
  const scorer = React.useMemo(() => new RiskScorer(), []);

  const handleAssess = async () => {
    setLoading(true);
    try {
      const assessment = await scorer.performRiskAssessment({
        scope: 'full',
        assets: [
          {
            id: '1',
            name: 'Web Server',
            type: 'server',
            businessCriticality: 'high',
            dataClassification: 'confidential',
            availabilityRequirement: '24x7',
            internetFacing: true
          }
        ],
        vulnerabilities: []
      });
      setResults(assessment);
    } catch (error) {
      console.error('Risk assessment failed:', error);
      alert('Risk assessment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="risk-panel">
      <div className="panel-header">
        <h2>Risk Assessment</h2>
        <p>Comprehensive risk scoring and threat modeling</p>
      </div>

      <div className="risk-controls">
        <button
          onClick={handleAssess}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Assessing...' : 'Start Risk Assessment'}
        </button>
      </div>

      {results && (
        <div className="risk-results">
          <div className="results-summary">
            <h3>Risk Summary</h3>
            <div className="summary-grid">
              <div className="summary-card critical">
                <span className="count">{results.summary.criticalRisks}</span>
                <span className="label">Critical</span>
              </div>
              <div className="summary-card high">
                <span className="count">{results.summary.highRisks}</span>
                <span className="label">High</span>
              </div>
              <div className="summary-card medium">
                <span className="count">{results.summary.mediumRisks}</span>
                <span className="label">Medium</span>
              </div>
              <div className="summary-card low">
                <span className="count">{results.summary.lowRisks}</span>
                <span className="label">Low</span>
              </div>
            </div>
          </div>

          {results.remediationCosts && (
            <div className="remediation-costs">
              <h3>Remediation Costs</h3>
              <p className="total-cost">${results.remediationCosts.totalCost.toLocaleString()}</p>
              <p className="total-hours">{results.remediationCosts.totalHours} hours</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Export main component and utilities
export default SecuritySuiteModule;

export {
  VulnerabilityScanner,
  ComplianceChecker,
  RiskScorer
};
