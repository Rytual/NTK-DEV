/**
 * Ninja Toolkit - Advanced Risk Scoring Engine
 * CVSS 3.1 calculator, threat modeling, business impact analysis
 * Risk heat maps, vulnerability prioritization, remediation cost estimation
 */

const crypto = require('crypto');

/**
 * Main Risk Scorer Class
 */
class RiskScorer {
  constructor() {
    this.assessments = [];
    this.assetCriticality = new Map();
    this.threatModels = new Map();
    this.riskThresholds = {
      critical: 9.0,
      high: 7.0,
      medium: 4.0,
      low: 0.1
    };
  }

  /**
   * Calculate CVSS 3.1 Base Score
   */
  calculateCVSS31BaseScore(metrics) {
    const {
      attackVector,       // AV: N(Network), A(Adjacent), L(Local), P(Physical)
      attackComplexity,   // AC: L(Low), H(High)
      privilegesRequired, // PR: N(None), L(Low), H(High)
      userInteraction,    // UI: N(None), R(Required)
      scope,             // S: U(Unchanged), C(Changed)
      confidentiality,   // C: N(None), L(Low), H(High)
      integrity,         // I: N(None), L(Low), H(High)
      availability       // A: N(None), L(Low), H(High)
    } = metrics;

    // Numerical values for metrics
    const avValues = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
    const acValues = { L: 0.77, H: 0.44 };
    const prValues = {
      U: { N: 0.85, L: 0.62, H: 0.27 },
      C: { N: 0.85, L: 0.68, H: 0.5 }
    };
    const uiValues = { N: 0.85, R: 0.62 };
    const ciaValues = { N: 0, L: 0.22, H: 0.56 };

    // Get numerical values
    const av = avValues[attackVector];
    const ac = acValues[attackComplexity];
    const pr = prValues[scope][privilegesRequired];
    const ui = uiValues[userInteraction];
    const c = ciaValues[confidentiality];
    const i = ciaValues[integrity];
    const a = ciaValues[availability];

    // Calculate Exploitability
    const exploitability = 8.22 * av * ac * pr * ui;

    // Calculate Impact
    let impact;
    if (scope === 'U') {
      impact = 6.42 * (1 - (1 - c) * (1 - i) * (1 - a));
    } else {
      impact = 7.52 * (1 - (1 - c) * (1 - i) * (1 - a)) - 0.029 - 3.25 * Math.pow(1 - (1 - c) * (1 - i) * (1 - a) - 0.02, 15);
    }

    // Calculate Base Score
    let baseScore;
    if (impact <= 0) {
      baseScore = 0;
    } else if (scope === 'U') {
      baseScore = Math.min(impact + exploitability, 10);
    } else {
      baseScore = Math.min(1.08 * (impact + exploitability), 10);
    }

    // Round up to one decimal
    baseScore = Math.ceil(baseScore * 10) / 10;

    return {
      baseScore,
      baseSeverity: this.getCVSSSeverity(baseScore),
      exploitabilityScore: Math.round(exploitability * 10) / 10,
      impactScore: Math.round(impact * 10) / 10,
      vector: this.generateCVSSVector(metrics)
    };
  }

  /**
   * Calculate CVSS 3.1 Temporal Score
   */
  calculateCVSS31TemporalScore(baseScore, temporal) {
    const {
      exploitCodeMaturity,  // E: X(Not Defined), H(High), F(Functional), P(Proof-of-Concept), U(Unproven)
      remediationLevel,     // RL: X(Not Defined), U(Unavailable), W(Workaround), T(Temporary), O(Official)
      reportConfidence      // RC: X(Not Defined), C(Confirmed), R(Reasonable), U(Unknown)
    } = temporal;

    const eValues = { X: 1, H: 1, F: 0.97, P: 0.94, U: 0.91 };
    const rlValues = { X: 1, U: 1, W: 0.97, T: 0.96, O: 0.95 };
    const rcValues = { X: 1, C: 1, R: 0.96, U: 0.92 };

    const e = eValues[exploitCodeMaturity];
    const rl = rlValues[remediationLevel];
    const rc = rcValues[reportConfidence];

    const temporalScore = Math.ceil(baseScore * e * rl * rc * 10) / 10;

    return {
      temporalScore,
      temporalSeverity: this.getCVSSSeverity(temporalScore)
    };
  }

  /**
   * Calculate CVSS 3.1 Environmental Score
   */
  calculateCVSS31EnvironmentalScore(baseMetrics, temporal, environmental) {
    const {
      confidentialityRequirement, // CR: X(Not Defined), L(Low), M(Medium), H(High)
      integrityRequirement,       // IR: X(Not Defined), L(Low), M(Medium), H(High)
      availabilityRequirement,    // AR: X(Not Defined), L(Low), M(Medium), H(High)
      modifiedAttackVector,       // MAV: X(Not Defined), N, A, L, P
      modifiedAttackComplexity,   // MAC: X(Not Defined), L, H
      modifiedPrivilegesRequired, // MPR: X(Not Defined), N, L, H
      modifiedUserInteraction,    // MUI: X(Not Defined), N, R
      modifiedScope,             // MS: X(Not Defined), U, C
      modifiedConfidentiality,   // MC: X(Not Defined), N, L, H
      modifiedIntegrity,         // MI: X(Not Defined), N, L, H
      modifiedAvailability       // MA: X(Not Defined), N, L, H
    } = environmental;

    const crValues = { X: 1, L: 0.5, M: 1, H: 1.5 };
    const irValues = { X: 1, L: 0.5, M: 1, H: 1.5 };
    const arValues = { X: 1, L: 0.5, M: 1, H: 1.5 };

    // Use modified metrics if defined, otherwise use base metrics
    const modifiedMetrics = {
      attackVector: modifiedAttackVector === 'X' ? baseMetrics.attackVector : modifiedAttackVector,
      attackComplexity: modifiedAttackComplexity === 'X' ? baseMetrics.attackComplexity : modifiedAttackComplexity,
      privilegesRequired: modifiedPrivilegesRequired === 'X' ? baseMetrics.privilegesRequired : modifiedPrivilegesRequired,
      userInteraction: modifiedUserInteraction === 'X' ? baseMetrics.userInteraction : modifiedUserInteraction,
      scope: modifiedScope === 'X' ? baseMetrics.scope : modifiedScope,
      confidentiality: modifiedConfidentiality === 'X' ? baseMetrics.confidentiality : modifiedConfidentiality,
      integrity: modifiedIntegrity === 'X' ? baseMetrics.integrity : modifiedIntegrity,
      availability: modifiedAvailability === 'X' ? baseMetrics.availability : modifiedAvailability
    };

    // Calculate modified impact
    const avValues = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
    const acValues = { L: 0.77, H: 0.44 };
    const prValues = {
      U: { N: 0.85, L: 0.62, H: 0.27 },
      C: { N: 0.85, L: 0.68, H: 0.5 }
    };
    const uiValues = { N: 0.85, R: 0.62 };
    const ciaValues = { N: 0, L: 0.22, H: 0.56 };

    const mav = avValues[modifiedMetrics.attackVector];
    const mac = acValues[modifiedMetrics.attackComplexity];
    const mpr = prValues[modifiedMetrics.scope][modifiedMetrics.privilegesRequired];
    const mui = uiValues[modifiedMetrics.userInteraction];
    const mc = ciaValues[modifiedMetrics.confidentiality];
    const mi = ciaValues[modifiedMetrics.integrity];
    const ma = ciaValues[modifiedMetrics.availability];

    const cr = crValues[confidentialityRequirement];
    const ir = irValues[integrityRequirement];
    const ar = arValues[availabilityRequirement];

    // Calculate modified exploitability
    const modifiedExploitability = 8.22 * mav * mac * mpr * mui;

    // Calculate modified impact
    let modifiedImpact;
    if (modifiedMetrics.scope === 'U') {
      modifiedImpact = 6.42 * (1 - (1 - mc * cr) * (1 - mi * ir) * (1 - ma * ar));
    } else {
      const impactBase = 1 - (1 - mc * cr) * (1 - mi * ir) * (1 - ma * ar);
      modifiedImpact = 7.52 * (impactBase - 0.029) - 3.25 * Math.pow(impactBase - 0.02, 15);
    }

    // Apply temporal metrics
    const eValues = { X: 1, H: 1, F: 0.97, P: 0.94, U: 0.91 };
    const rlValues = { X: 1, U: 1, W: 0.97, T: 0.96, O: 0.95 };
    const rcValues = { X: 1, C: 1, R: 0.96, U: 0.92 };

    const e = eValues[temporal.exploitCodeMaturity];
    const rl = rlValues[temporal.remediationLevel];
    const rc = rcValues[temporal.reportConfidence];

    // Calculate environmental score
    let environmentalScore;
    if (modifiedImpact <= 0) {
      environmentalScore = 0;
    } else if (modifiedMetrics.scope === 'U') {
      environmentalScore = Math.min((modifiedImpact + modifiedExploitability) * e * rl * rc, 10);
    } else {
      environmentalScore = Math.min(1.08 * (modifiedImpact + modifiedExploitability) * e * rl * rc, 10);
    }

    environmentalScore = Math.ceil(environmentalScore * 10) / 10;

    return {
      environmentalScore,
      environmentalSeverity: this.getCVSSSeverity(environmentalScore),
      modifiedImpactScore: Math.round(modifiedImpact * 10) / 10,
      modifiedExploitabilityScore: Math.round(modifiedExploitability * 10) / 10
    };
  }

  /**
   * Generate CVSS vector string
   */
  generateCVSSVector(metrics) {
    return `CVSS:3.1/AV:${metrics.attackVector}/AC:${metrics.attackComplexity}/PR:${metrics.privilegesRequired}/UI:${metrics.userInteraction}/S:${metrics.scope}/C:${metrics.confidentiality}/I:${metrics.integrity}/A:${metrics.availability}`;
  }

  /**
   * Get CVSS severity rating from score
   */
  getCVSSSeverity(score) {
    if (score === 0) return 'None';
    if (score >= 0.1 && score <= 3.9) return 'Low';
    if (score >= 4.0 && score <= 6.9) return 'Medium';
    if (score >= 7.0 && score <= 8.9) return 'High';
    if (score >= 9.0 && score <= 10.0) return 'Critical';
    return 'Unknown';
  }

  /**
   * Perform comprehensive risk assessment
   */
  async performRiskAssessment(options) {
    const assessmentId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`Starting risk assessment ${assessmentId}`);

    const assessment = {
      assessmentId,
      timestamp: new Date().toISOString(),
      scope: options.scope || 'full',
      assets: [],
      threats: [],
      vulnerabilities: [],
      risks: [],
      heatMap: null,
      summary: {
        criticalRisks: 0,
        highRisks: 0,
        mediumRisks: 0,
        lowRisks: 0
      },
      recommendations: []
    };

    try {
      // Identify assets
      assessment.assets = await this.identifyAssets(options.assets);

      // Perform threat modeling
      assessment.threats = await this.performThreatModeling(assessment.assets);

      // Assess vulnerabilities
      if (options.vulnerabilities) {
        assessment.vulnerabilities = options.vulnerabilities;
      }

      // Calculate risk scores
      assessment.risks = this.calculateRisks(
        assessment.assets,
        assessment.threats,
        assessment.vulnerabilities
      );

      // Generate risk heat map
      assessment.heatMap = this.generateRiskHeatMap(assessment.risks);

      // Calculate summary
      assessment.risks.forEach(risk => {
        const severity = risk.severity.toLowerCase();
        const key = `${severity}Risks`;
        if (assessment.summary[key] !== undefined) {
          assessment.summary[key]++;
        }
      });

      // Prioritize risks
      assessment.prioritizedRisks = this.prioritizeRisks(assessment.risks);

      // Generate recommendations
      assessment.recommendations = this.generateRiskRecommendations(assessment.risks);

      // Estimate remediation costs
      assessment.remediationCosts = this.estimateRemediationCosts(assessment.risks);

      assessment.duration = Date.now() - startTime;
      assessment.status = 'completed';

      this.assessments.push(assessment);
      return assessment;

    } catch (error) {
      console.error('Risk assessment failed:', error);
      assessment.status = 'failed';
      assessment.error = error.message;
      return assessment;
    }
  }

  /**
   * Identify and classify assets
   */
  async identifyAssets(assetList) {
    const assets = [];

    for (const asset of assetList || []) {
      const classifiedAsset = {
        id: asset.id || crypto.randomUUID(),
        name: asset.name,
        type: asset.type || 'unknown',
        criticality: this.classifyAssetCriticality(asset),
        value: asset.value || 0,
        confidentiality: asset.confidentiality || 'medium',
        integrity: asset.integrity || 'medium',
        availability: asset.availability || 'medium',
        dataClassification: asset.dataClassification || 'internal',
        businessImpact: this.assessBusinessImpact(asset)
      };

      assets.push(classifiedAsset);
      this.assetCriticality.set(classifiedAsset.id, classifiedAsset.criticality);
    }

    return assets;
  }

  /**
   * Classify asset criticality
   */
  classifyAssetCriticality(asset) {
    let criticalityScore = 0;

    // Business criticality
    const businessCriticality = {
      'mission-critical': 5,
      'high': 4,
      'medium': 3,
      'low': 2,
      'minimal': 1
    };
    criticalityScore += businessCriticality[asset.businessCriticality] || 3;

    // Data sensitivity
    const dataSensitivity = {
      'highly-confidential': 5,
      'confidential': 4,
      'internal': 3,
      'public': 1
    };
    criticalityScore += dataSensitivity[asset.dataClassification] || 3;

    // Availability requirement
    const availabilityRequirement = {
      '24x7': 5,
      'business-hours': 3,
      'best-effort': 1
    };
    criticalityScore += availabilityRequirement[asset.availabilityRequirement] || 3;

    // Calculate final criticality
    const averageScore = criticalityScore / 3;

    if (averageScore >= 4.5) return 'critical';
    if (averageScore >= 3.5) return 'high';
    if (averageScore >= 2.5) return 'medium';
    return 'low';
  }

  /**
   * Assess business impact
   */
  assessBusinessImpact(asset) {
    return {
      financialImpact: this.calculateFinancialImpact(asset),
      reputationalImpact: this.calculateReputationalImpact(asset),
      operationalImpact: this.calculateOperationalImpact(asset),
      complianceImpact: this.calculateComplianceImpact(asset)
    };
  }

  /**
   * Calculate financial impact
   */
  calculateFinancialImpact(asset) {
    const value = asset.value || 0;
    const revenueImpact = asset.revenueImpact || 0;
    const recoveryGhost = asset.recoveryCost || 0;

    const totalImpact = value + revenueImpact + recoveryCost;

    if (totalImpact > 1000000) return 'critical';
    if (totalImpact > 100000) return 'high';
    if (totalImpact > 10000) return 'medium';
    return 'low';
  }

  /**
   * Calculate reputational impact
   */
  calculateReputationalImpact(asset) {
    const visibility = asset.publicVisibility || 'low';
    const userBase = asset.userBase || 0;

    if (visibility === 'high' || userBase > 1000000) return 'critical';
    if (visibility === 'medium' || userBase > 10000) return 'high';
    if (userBase > 1000) return 'medium';
    return 'low';
  }

  /**
   * Calculate operational impact
   */
  calculateOperationalImpact(asset) {
    const downtime = asset.maxTolerableDowntime || 'high';
    const dependents = asset.dependentSystems || 0;

    if (downtime === 'zero' || dependents > 10) return 'critical';
    if (downtime === 'low' || dependents > 5) return 'high';
    if (dependents > 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate compliance impact
   */
  calculateComplianceImpact(asset) {
    const regulations = asset.regulatoryRequirements || [];

    if (regulations.includes('HIPAA') || regulations.includes('PCI-DSS')) return 'critical';
    if (regulations.includes('GDPR') || regulations.includes('SOC2')) return 'high';
    if (regulations.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Perform threat modeling using STRIDE framework
   */
  async performThreatModeling(assets) {
    const threats = [];

    const strideCategories = {
      Spoofing: {
        description: 'Impersonating something or someone else',
        examples: [
          'Authentication bypass',
          'Session hijacking',
          'Man-in-the-middle attacks',
          'IP spoofing',
          'Email spoofing'
        ],
        likelihood: 'medium',
        mitigation: 'Strong authentication, encryption, certificate validation'
      },
      Tampering: {
        description: 'Modifying data or code',
        examples: [
          'SQL injection',
          'Code injection',
          'Parameter tampering',
          'Configuration file modification',
          'Data corruption'
        ],
        likelihood: 'high',
        mitigation: 'Input validation, integrity checks, digital signatures'
      },
      Repudiation: {
        description: 'Claiming not to have performed an action',
        examples: [
          'Denying transactions',
          'Unauthorized actions without audit trail',
          'Log tampering',
          'Non-logged administrative actions'
        ],
        likelihood: 'medium',
        mitigation: 'Comprehensive logging, digital signatures, audit trails'
      },
      InformationDisclosure: {
        description: 'Exposing information to unauthorized individuals',
        examples: [
          'Data breaches',
          'Unencrypted communications',
          'Information leakage',
          'Directory traversal',
          'Verbose error messages'
        ],
        likelihood: 'high',
        mitigation: 'Encryption, access controls, data classification'
      },
      DenialOfService: {
        description: 'Denying or degrading service to users',
        examples: [
          'Resource exhaustion',
          'Application crashes',
          'Network flooding',
          'Algorithmic complexity attacks',
          'Storage consumption'
        ],
        likelihood: 'medium',
        mitigation: 'Rate limiting, resource quotas, redundancy, monitoring'
      },
      ElevationOfPrivilege: {
        description: 'Gaining unauthorized capabilities',
        examples: [
          'Privilege escalation',
          'Buffer overflows',
          'Path traversal',
          'Insecure defaults',
          'Credential theft'
        ],
        likelihood: 'high',
        mitigation: 'Principle of least privilege, input validation, secure coding'
      }
    };

    // Generate threats for each asset
    for (const asset of assets) {
      for (const [category, details] of Object.entries(strideCategories)) {
        threats.push({
          id: crypto.randomUUID(),
          category,
          assetId: asset.id,
          assetName: asset.name,
          description: details.description,
          examples: details.examples,
          likelihood: this.calculateThreatLikelihood(asset, category),
          impact: this.calculateThreatImpact(asset, category),
          mitigation: details.mitigation
        });
      }
    }

    return threats;
  }

  /**
   * Calculate threat likelihood
   */
  calculateThreatLikelihood(asset, threatCategory) {
    let likelihood = 3; // Default medium

    // Adjust based on asset exposure
    if (asset.internetFacing) likelihood += 2;
    if (asset.publiclyAccessible) likelihood += 1;

    // Adjust based on security controls
    if (asset.hasFirewall) likelihood -= 1;
    if (asset.hasIDS) likelihood -= 1;
    if (asset.hasWAF) likelihood -= 1;

    // Adjust based on threat category
    const highLikelihoodThreats = ['Tampering', 'InformationDisclosure', 'ElevationOfPrivilege'];
    if (highLikelihoodThreats.includes(threatCategory)) {
      likelihood += 1;
    }

    // Normalize to 1-5 scale
    likelihood = Math.max(1, Math.min(5, likelihood));

    const likelihoodMap = {
      1: 'very-low',
      2: 'low',
      3: 'medium',
      4: 'high',
      5: 'very-high'
    };

    return likelihoodMap[likelihood];
  }

  /**
   * Calculate threat impact
   */
  calculateThreatImpact(asset, threatCategory) {
    const impactMapping = {
      'Spoofing': asset.confidentiality,
      'Tampering': asset.integrity,
      'Repudiation': asset.integrity,
      'InformationDisclosure': asset.confidentiality,
      'DenialOfService': asset.availability,
      'ElevationOfPrivilege': 'critical'
    };

    const impact = impactMapping[threatCategory] || 'medium';

    // Adjust based on asset criticality
    const criticalityMultiplier = {
      'critical': 2,
      'high': 1.5,
      'medium': 1,
      'low': 0.5
    };

    const baseImpact = {
      'critical': 5,
      'high': 4,
      'medium': 3,
      'low': 2,
      'very-low': 1
    };

    let impactScore = (baseImpact[impact] || 3) * (criticalityMultiplier[asset.criticality] || 1);
    impactScore = Math.max(1, Math.min(5, Math.round(impactScore)));

    const impactMap = {
      1: 'very-low',
      2: 'low',
      3: 'medium',
      4: 'high',
      5: 'very-high'
    };

    return impactMap[impactScore];
  }

  /**
   * Calculate risks from assets, threats, and vulnerabilities
   */
  calculateRisks(assets, threats, vulnerabilities) {
    const risks = [];

    // Create risk matrix
    const likelihoodValues = {
      'very-low': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'very-high': 5
    };

    const impactValues = {
      'very-low': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'very-high': 5
    };

    // Calculate risk for each threat
    for (const threat of threats) {
      const likelihood = likelihoodValues[threat.likelihood] || 3;
      const impact = impactValues[threat.impact] || 3;
      const riskScore = likelihood * impact;

      let severity;
      if (riskScore >= 20) severity = 'critical';
      else if (riskScore >= 15) severity = 'high';
      else if (riskScore >= 8) severity = 'medium';
      else severity = 'low';

      risks.push({
        id: crypto.randomUUID(),
        threatId: threat.id,
        assetId: threat.assetId,
        assetName: threat.assetName,
        threatCategory: threat.category,
        description: `${threat.category} threat to ${threat.assetName}`,
        likelihood: threat.likelihood,
        likelihoodScore: likelihood,
        impact: threat.impact,
        impactScore: impact,
        riskScore,
        severity,
        mitigation: threat.mitigation,
        residualRisk: this.calculateResidualRisk(riskScore)
      });
    }

    // Add risks from vulnerabilities
    for (const vuln of vulnerabilities) {
      const asset = assets.find(a => a.id === vuln.assetId);
      if (!asset) continue;

      const cvssScore = vuln.cvssScore || 5.0;
      const likelihood = this.cvssToLikelihood(cvssScore);
      const impact = this.cvssToImpact(cvssScore, asset);

      const likelihoodScore = likelihoodValues[likelihood];
      const impactScore = impactValues[impact];
      const riskScore = likelihoodScore * impactScore;

      let severity;
      if (riskScore >= 20) severity = 'critical';
      else if (riskScore >= 15) severity = 'high';
      else if (riskScore >= 8) severity = 'medium';
      else severity = 'low';

      risks.push({
        id: crypto.randomUUID(),
        vulnerabilityId: vuln.id,
        assetId: asset.id,
        assetName: asset.name,
        description: vuln.title || vuln.description,
        likelihood,
        likelihoodScore,
        impact,
        impactScore,
        riskScore,
        severity,
        cvssScore,
        mitigation: vuln.recommendation,
        residualRisk: this.calculateResidualRisk(riskScore)
      });
    }

    return risks;
  }

  /**
   * Convert CVSS score to likelihood
   */
  cvssToLikelihood(cvssScore) {
    if (cvssScore >= 9.0) return 'very-high';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    if (cvssScore >= 0.1) return 'low';
    return 'very-low';
  }

  /**
   * Convert CVSS score to impact based on asset
   */
  cvssToImpact(cvssScore, asset) {
    let baseImpact;
    if (cvssScore >= 9.0) baseImpact = 'very-high';
    else if (cvssScore >= 7.0) baseImpact = 'high';
    else if (cvssScore >= 4.0) baseImpact = 'medium';
    else if (cvssScore >= 0.1) baseImpact = 'low';
    else baseImpact = 'very-low';

    // Adjust based on asset criticality
    const impactValues = { 'very-low': 1, 'low': 2, 'medium': 3, 'high': 4, 'very-high': 5 };
    const criticalityMultiplier = { 'low': 0.5, 'medium': 1, 'high': 1.5, 'critical': 2 };

    let impactScore = impactValues[baseImpact] * (criticalityMultiplier[asset.criticality] || 1);
    impactScore = Math.max(1, Math.min(5, Math.round(impactScore)));

    const impactMap = { 1: 'very-low', 2: 'low', 3: 'medium', 4: 'high', 5: 'very-high' };
    return impactMap[impactScore];
  }

  /**
   * Calculate residual risk after mitigation
   */
  calculateResidualRisk(initialRiskScore) {
    // Assume 60% risk reduction with proper mitigation
    const residualScore = Math.round(initialRiskScore * 0.4);

    let severity;
    if (residualScore >= 20) severity = 'critical';
    else if (residualScore >= 15) severity = 'high';
    else if (residualScore >= 8) severity = 'medium';
    else severity = 'low';

    return {
      score: residualScore,
      severity
    };
  }

  /**
   * Generate risk heat map
   */
  generateRiskHeatMap(risks) {
    const heatMap = {
      matrix: [],
      distribution: {
        'very-low-very-low': [],
        'very-low-low': [],
        'very-low-medium': [],
        'very-low-high': [],
        'very-low-very-high': [],
        'low-very-low': [],
        'low-low': [],
        'low-medium': [],
        'low-high': [],
        'low-very-high': [],
        'medium-very-low': [],
        'medium-low': [],
        'medium-medium': [],
        'medium-high': [],
        'medium-very-high': [],
        'high-very-low': [],
        'high-low': [],
        'high-medium': [],
        'high-high': [],
        'high-very-high': [],
        'very-high-very-low': [],
        'very-high-low': [],
        'very-high-medium': [],
        'very-high-high': [],
        'very-high-very-high': []
      }
    };

    // Populate heat map
    for (const risk of risks) {
      const key = `${risk.likelihood}-${risk.impact}`;
      if (heatMap.distribution[key]) {
        heatMap.distribution[key].push(risk.id);
      }
    }

    // Generate matrix visualization
    const levels = ['very-low', 'low', 'medium', 'high', 'very-high'];
    for (let i = levels.length - 1; i >= 0; i--) {
      const row = [];
      for (let j = 0; j < levels.length; j++) {
        const key = `${levels[j]}-${levels[i]}`;
        const count = heatMap.distribution[key].length;
        const score = (j + 1) * (i + 1);

        let color;
        if (score >= 20) color = 'red';
        else if (score >= 15) color = 'orange';
        else if (score >= 8) color = 'yellow';
        else color = 'green';

        row.push({
          likelihood: levels[j],
          impact: levels[i],
          count,
          score,
          color,
          risks: heatMap.distribution[key]
        });
      }
      heatMap.matrix.push(row);
    }

    return heatMap;
  }

  /**
   * Prioritize risks for remediation
   */
  prioritizeRisks(risks) {
    const prioritized = [...risks];

    // Sort by multiple criteria
    prioritized.sort((a, b) => {
      // First by risk score
      if (b.riskScore !== a.riskScore) {
        return b.riskScore - a.riskScore;
      }

      // Then by exploitability (if CVSS available)
      if (b.cvssScore && a.cvssScore) {
        return b.cvssScore - a.cvssScore;
      }

      // Then by likelihood
      const likelihoodOrder = { 'very-high': 5, 'high': 4, 'medium': 3, 'low': 2, 'very-low': 1 };
      return likelihoodOrder[b.likelihood] - likelihoodOrder[a.likelihood];
    });

    // Add priority ranking
    prioritized.forEach((risk, index) => {
      risk.priority = index + 1;
      if (index < 5) risk.priorityLevel = 'immediate';
      else if (index < 15) risk.priorityLevel = 'high';
      else if (index < 30) risk.priorityLevel = 'medium';
      else risk.priorityLevel = 'low';
    });

    return prioritized;
  }

  /**
   * Generate risk-based recommendations
   */
  generateRiskRecommendations(risks) {
    const recommendations = [];

    // Group risks by severity
    const criticalRisks = risks.filter(r => r.severity === 'critical');
    const highRisks = risks.filter(r => r.severity === 'high');

    if (criticalRisks.length > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        title: 'Address Critical Risks',
        description: `${criticalRisks.length} critical risks require immediate attention`,
        actions: criticalRisks.slice(0, 5).map(r => ({
          risk: r.description,
          mitigation: r.mitigation,
          estimatedEffort: this.estimateEffort(r)
        }))
      });
    }

    if (highRisks.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Remediate High-Risk Issues',
        description: `${highRisks.length} high risks identified`,
        actions: highRisks.slice(0, 5).map(r => ({
          risk: r.description,
          mitigation: r.mitigation,
          estimatedEffort: this.estimateEffort(r)
        }))
      });
    }

    // Strategic recommendations
    recommendations.push({
      priority: 'STRATEGIC',
      title: 'Implement Defense-in-Depth Strategy',
      actions: [
        'Establish layered security controls',
        'Implement zero-trust architecture',
        'Deploy continuous monitoring',
        'Establish incident response capabilities',
        'Conduct regular security assessments',
        'Implement security awareness program'
      ]
    });

    return recommendations;
  }

  /**
   * Estimate effort for risk remediation
   */
  estimateEffort(risk) {
    const baseEffort = {
      'critical': 40,
      'high': 24,
      'medium': 8,
      'low': 2
    };

    const hours = baseEffort[risk.severity] || 8;

    let complexity = 'medium';
    if (hours > 30) complexity = 'high';
    else if (hours < 10) complexity = 'low';

    return {
      hours,
      complexity,
      estimatedCost: hours * 150 // Assume $150/hour
    };
  }

  /**
   * Estimate remediation costs
   */
  estimateRemediationCosts(risks) {
    let totalCost = 0;
    let totalHours = 0;

    const costBreakdown = {
      critical: { count: 0, cost: 0, hours: 0 },
      high: { count: 0, cost: 0, hours: 0 },
      medium: { count: 0, cost: 0, hours: 0 },
      low: { count: 0, cost: 0, hours: 0 }
    };

    risks.forEach(risk => {
      const effort = this.estimateEffort(risk);
      totalCost += effort.estimatedCost;
      totalHours += effort.hours;

      const severity = risk.severity;
      if (costBreakdown[severity]) {
        costBreakdown[severity].count++;
        costBreakdown[severity].cost += effort.estimatedCost;
        costBreakdown[severity].hours += effort.hours;
      }
    });

    return {
      totalCost,
      totalHours,
      breakdown: costBreakdown,
      phased: {
        immediate: costBreakdown.critical.cost,
        shortTerm: costBreakdown.high.cost,
        mediumTerm: costBreakdown.medium.cost,
        longTerm: costBreakdown.low.cost
      }
    };
  }

  /**
   * Export risk assessment
   */
  exportAssessment(assessmentId, format = 'json') {
    const assessment = this.assessments.find(a => a.assessmentId === assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    if (format === 'json') {
      return JSON.stringify(assessment, null, 2);
    } else if (format === 'html') {
      return this.generateHTMLReport(assessment);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Generate HTML risk report
   */
  generateHTMLReport(assessment) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Risk Assessment Report - ${assessment.assessmentId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .critical { color: #d32f2f; background-color: #ffebee; }
        .high { color: #f57c00; background-color: #fff3e0; }
        .medium { color: #fbc02d; background-color: #fffde7; }
        .low { color: #388e3c; background-color: #e8f5e9; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .summary-card { padding: 15px; border-radius: 5px; flex: 1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #333; color: white; }
    </style>
</head>
<body>
    <h1>Risk Assessment Report</h1>
    <p><strong>Assessment ID:</strong> ${assessment.assessmentId}</p>
    <p><strong>Timestamp:</strong> ${assessment.timestamp}</p>
    <p><strong>Duration:</strong> ${assessment.duration}ms</p>

    <h2>Risk Summary</h2>
    <div class="summary">
        <div class="summary-card critical">
            <h3>Critical</h3>
            <p>${assessment.summary.criticalRisks}</p>
        </div>
        <div class="summary-card high">
            <h3>High</h3>
            <p>${assessment.summary.highRisks}</p>
        </div>
        <div class="summary-card medium">
            <h3>Medium</h3>
            <p>${assessment.summary.mediumRisks}</p>
        </div>
        <div class="summary-card low">
            <h3>Low</h3>
            <p>${assessment.summary.lowRisks}</p>
        </div>
    </div>

    <h2>Remediation Costs</h2>
    <p><strong>Total Cost:</strong> $${assessment.remediationCosts.totalCost.toLocaleString()}</p>
    <p><strong>Total Hours:</strong> ${assessment.remediationCosts.totalHours}</p>

    <h2>Top Risks</h2>
    <table>
        <tr>
            <th>Priority</th>
            <th>Severity</th>
            <th>Description</th>
            <th>Risk Score</th>
            <th>Mitigation</th>
        </tr>
        ${assessment.prioritizedRisks.slice(0, 10).map(risk => `
        <tr>
            <td>${risk.priority}</td>
            <td class="${risk.severity}">${risk.severity.toUpperCase()}</td>
            <td>${risk.description}</td>
            <td>${risk.riskScore}</td>
            <td>${risk.mitigation || 'N/A'}</td>
        </tr>
        `).join('')}
    </table>
</body>
</html>`;
  }
}

module.exports = RiskScorer;
