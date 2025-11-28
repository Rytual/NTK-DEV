/**
 * Kage AI Ticket Analyzer
 * AI-powered ticket analysis with Kage Forge integration
 *
 * Features:
 * - Integration with Prompt 8 (Kage Forge)
 * - Ticket content analysis (summary, key issues)
 * - Diagnostic log parsing
 * - Error code lookup
 * - Solution suggestions from knowledge base
 * - Sentiment analysis
 * - Priority recommendations
 * - Automatic note generation
 * - Time estimate calculation
 * - Similar ticket detection
 * - EventEmitter integration
 *
 * Analysis features:
 * - Parse Windows Event Logs
 * - Parse PowerShell error output
 * - Identify common issues (DNS, DHCP, AD, Exchange)
 * - Extract IP addresses, hostnames, error codes
 * - Generate diagnostic commands (PowerShell - Prompt 3)
 * - Suggest remote access sessions (Prompt 4)
 */

const { EventEmitter } = require('events');
const path = require('path');

/**
 * Kage AI Ticket Analyzer Class
 */
class KageTicketAnalyzer extends EventEmitter {
  constructor(kageForgeProvider = null, options = {}) {
    super();

    this.kageForge = kageForgeProvider;

    // Configuration
    this.config = {
      model: options.model || 'gpt-4',
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      enableSentimentAnalysis: options.enableSentimentAnalysis !== false,
      enablePriorityRecommendation: options.enablePriorityRecommendation !== false,
      enableTimeEstimation: options.enableTimeEstimation !== false,
      enableSimilarTickets: options.enableSimilarTickets !== false,
      enableDiagnosticCommands: options.enableDiagnosticCommands !== false,
      knowledgeBasePath: options.knowledgeBasePath || './data/knowledge-base'
    };

    // Knowledge base
    this.knowledgeBase = {
      commonIssues: this._loadCommonIssues(),
      errorCodes: this._loadErrorCodes(),
      solutions: this._loadSolutions()
    };

    // Statistics
    this.stats = {
      analysesRun: 0,
      issuesIdentified: 0,
      solutionsSuggested: 0,
      priorityRecommendations: 0,
      timeEstimations: 0,
      similarTicketsFound: 0
    };

    this._log('Kage AI Ticket Analyzer initialized', this.config);
  }

  /**
   * Log debug information
   */
  _log(message, data = null) {
    console.log(`[KageAnalyzer] ${message}`, data || '');
    this.emit('log', { message, data, timestamp: Date.now() });
  }

  /**
   * Load common issues database
   */
  _loadCommonIssues() {
    return {
      dns: {
        keywords: ['dns', 'name resolution', 'nslookup', 'dig'],
        category: 'Network',
        severity: 'High',
        diagnosticCommands: [
          'Test-NetConnection -ComputerName google.com',
          'nslookup google.com',
          'Get-DnsClientServerAddress',
          'ipconfig /flushdns'
        ]
      },
      dhcp: {
        keywords: ['dhcp', 'ip address', '169.254', 'apipa', 'no ip'],
        category: 'Network',
        severity: 'High',
        diagnosticCommands: [
          'Get-NetIPAddress',
          'Get-NetIPConfiguration',
          'ipconfig /release',
          'ipconfig /renew'
        ]
      },
      activedirectory: {
        keywords: ['active directory', 'ad', 'domain controller', 'ldap', 'authentication'],
        category: 'Authentication',
        severity: 'Critical',
        diagnosticCommands: [
          'Get-ADUser -Identity username',
          'Get-ADComputer -Identity computername',
          'nltest /dsgetdc:domain.com',
          'Test-ComputerSecureChannel -Verbose'
        ]
      },
      exchange: {
        keywords: ['exchange', 'outlook', 'email', 'mailbox', 'owa'],
        category: 'Email',
        severity: 'High',
        diagnosticCommands: [
          'Test-ServiceHealth',
          'Get-MailboxDatabase -Status',
          'Get-ExchangeServer',
          'Test-OutlookConnectivity'
        ]
      },
      diskspace: {
        keywords: ['disk space', 'low disk', 'out of space', 'drive full'],
        category: 'Storage',
        severity: 'High',
        diagnosticCommands: [
          'Get-PSDrive',
          'Get-Volume',
          'Get-ChildItem -Path C:\\ -Recurse | Sort-Object Length -Descending | Select-Object -First 10'
        ]
      },
      performance: {
        keywords: ['slow', 'performance', 'lag', 'high cpu', 'memory'],
        category: 'Performance',
        severity: 'Medium',
        diagnosticCommands: [
          'Get-Process | Sort-Object CPU -Descending | Select-Object -First 10',
          'Get-Counter "\\Processor(_Total)\\% Processor Time"',
          'Get-EventLog -LogName System -Newest 50 | Where-Object {$_.EntryType -eq "Error"}'
        ]
      },
      printer: {
        keywords: ['printer', 'print', 'spooler'],
        category: 'Hardware',
        severity: 'Low',
        diagnosticCommands: [
          'Get-Printer',
          'Get-PrintJob',
          'Restart-Service -Name Spooler',
          'Get-Service -Name Spooler'
        ]
      },
      vpn: {
        keywords: ['vpn', 'remote access', 'connection failed'],
        category: 'Network',
        severity: 'High',
        diagnosticCommands: [
          'Get-VpnConnection',
          'Test-NetConnection -ComputerName vpn.company.com -Port 443',
          'rasdial'
        ]
      }
    };
  }

  /**
   * Load error codes database
   */
  _loadErrorCodes() {
    return {
      '0x80070035': {
        description: 'Network path not found',
        category: 'Network',
        solutions: ['Check network connectivity', 'Verify firewall settings', 'Enable file sharing']
      },
      '0x800704cf': {
        description: 'Network location cannot be reached',
        category: 'Network',
        solutions: ['Check DNS resolution', 'Verify network configuration', 'Test connectivity']
      },
      '0x80070005': {
        description: 'Access denied',
        category: 'Security',
        solutions: ['Check permissions', 'Verify user credentials', 'Run as administrator']
      },
      '0x80070002': {
        description: 'System cannot find the file specified',
        category: 'File System',
        solutions: ['Verify file path', 'Check file existence', 'Restore from backup']
      },
      '0x80004005': {
        description: 'Unspecified error',
        category: 'General',
        solutions: ['Check event logs', 'Restart service', 'Update software']
      }
    };
  }

  /**
   * Load solutions database
   */
  _loadSolutions() {
    return {
      dns: [
        'Flush DNS cache: ipconfig /flushdns',
        'Reset DNS client: Restart-Service -Name Dnscache',
        'Change DNS servers to 8.8.8.8 and 8.8.4.4',
        'Check DNS server availability',
        'Verify DNS configuration in DHCP'
      ],
      dhcp: [
        'Release and renew IP: ipconfig /release && ipconfig /renew',
        'Restart DHCP service',
        'Check DHCP scope availability',
        'Verify DHCP relay agent configuration',
        'Assign static IP as temporary solution'
      ],
      activedirectory: [
        'Reset computer account: Test-ComputerSecureChannel -Repair',
        'Check domain controller connectivity',
        'Verify time synchronization',
        'Check DNS pointing to domain controller',
        'Review security event logs'
      ],
      exchange: [
        'Restart Exchange services',
        'Check mailbox database status',
        'Verify Exchange server health',
        'Test Outlook connectivity',
        'Review Exchange event logs'
      ],
      diskspace: [
        'Clean temporary files',
        'Run Disk Cleanup utility',
        'Move large files to different drive',
        'Clear browser cache',
        'Archive old logs'
      ],
      performance: [
        'Identify resource-intensive processes',
        'Update device drivers',
        'Scan for malware',
        'Disable unnecessary startup programs',
        'Add more RAM if consistently high memory usage'
      ],
      printer: [
        'Restart Print Spooler service',
        'Clear print queue',
        'Reinstall printer driver',
        'Check printer connectivity',
        'Verify printer port configuration'
      ],
      vpn: [
        'Verify VPN credentials',
        'Check VPN server availability',
        'Update VPN client',
        'Check firewall rules',
        'Test VPN connectivity from different network'
      ]
    };
  }

  /**
   * Analyze ticket using AI
   */
  async analyzeTicket(ticketData) {
    try {
      this._log('Analyzing ticket', { ticketId: ticketData.ticket?.id });

      this.stats.analysesRun++;

      // Extract ticket information
      const ticket = ticketData.ticket || ticketData;
      const notes = ticketData.notes || [];
      const timeEntries = ticketData.timeEntries || [];

      // Combine ticket content
      const content = this._extractTicketContent(ticket, notes);

      // Analyze content
      const analysis = {
        ticketId: ticket.id,
        summary: '',
        keyIssues: [],
        identifiedProblems: [],
        errorCodes: [],
        extractedData: {},
        solutions: [],
        diagnosticCommands: [],
        sentiment: null,
        priorityRecommendation: null,
        timeEstimate: null,
        similarTickets: [],
        integrationSuggestions: {
          powershell: [],
          remoteAccess: []
        }
      };

      // Identify issues
      analysis.identifiedProblems = this._identifyIssues(content);
      this.stats.issuesIdentified += analysis.identifiedProblems.length;

      // Extract error codes
      analysis.errorCodes = this._extractErrorCodes(content);

      // Extract data (IPs, hostnames, etc.)
      analysis.extractedData = this._extractData(content);

      // Generate solutions
      analysis.solutions = this._generateSolutions(analysis.identifiedProblems, analysis.errorCodes);
      this.stats.solutionsSuggested += analysis.solutions.length;

      // Generate diagnostic commands
      if (this.config.enableDiagnosticCommands) {
        analysis.diagnosticCommands = this._generateDiagnosticCommands(analysis.identifiedProblems);
      }

      // Sentiment analysis
      if (this.config.enableSentimentAnalysis) {
        analysis.sentiment = this._analyzeSentiment(content);
      }

      // Priority recommendation
      if (this.config.enablePriorityRecommendation) {
        analysis.priorityRecommendation = this._recommendPriority(ticket, analysis);
        this.stats.priorityRecommendations++;
      }

      // Time estimation
      if (this.config.enableTimeEstimation) {
        analysis.timeEstimate = this._estimateTime(analysis);
        this.stats.timeEstimations++;
      }

      // Generate integration suggestions
      analysis.integrationSuggestions = this._generateIntegrationSuggestions(analysis);

      // Use Kage Forge for advanced AI analysis if available
      if (this.kageForge) {
        const aiAnalysis = await this._runKageForgeAnalysis(content, ticket);
        analysis.summary = aiAnalysis.summary;
        analysis.keyIssues = aiAnalysis.keyIssues;
      } else {
        // Fallback to simple analysis
        analysis.summary = this._generateSimpleSummary(ticket, analysis);
        analysis.keyIssues = analysis.identifiedProblems.map(p => p.issue);
      }

      this._log('Analysis complete', analysis);
      this.emit('analysisComplete', { ticketId: ticket.id, analysis });

      return analysis;
    } catch (error) {
      this._log('Analysis failed', error);
      this.emit('analysisError', { ticketData, error });
      throw error;
    }
  }

  /**
   * Extract ticket content for analysis
   */
  _extractTicketContent(ticket, notes) {
    let content = '';

    // Add ticket summary and description
    content += `Subject: ${ticket.summary || ''}\n\n`;
    content += `Description: ${ticket.initialDescription || ticket.description || ''}\n\n`;

    // Add notes
    if (notes && notes.length > 0) {
      content += 'Notes:\n';
      for (const note of notes) {
        content += `- ${note.text}\n`;
      }
      content += '\n';
    }

    return content;
  }

  /**
   * Identify issues from content
   */
  _identifyIssues(content) {
    const issues = [];
    const contentLower = content.toLowerCase();

    for (const [issueKey, issueData] of Object.entries(this.knowledgeBase.commonIssues)) {
      for (const keyword of issueData.keywords) {
        if (contentLower.includes(keyword)) {
          issues.push({
            issue: issueKey,
            category: issueData.category,
            severity: issueData.severity,
            confidence: 0.8
          });
          break;
        }
      }
    }

    return issues;
  }

  /**
   * Extract error codes from content
   */
  _extractErrorCodes(content) {
    const errorCodes = [];
    const errorCodePattern = /0x[0-9a-fA-F]{8}/g;
    const matches = content.match(errorCodePattern) || [];

    for (const match of matches) {
      const code = match.toLowerCase();
      const errorInfo = this.knowledgeBase.errorCodes[code];

      errorCodes.push({
        code: code,
        description: errorInfo?.description || 'Unknown error code',
        category: errorInfo?.category || 'Unknown',
        solutions: errorInfo?.solutions || []
      });
    }

    return errorCodes;
  }

  /**
   * Extract data (IPs, hostnames, etc.) from content
   */
  _extractData(content) {
    const data = {
      ipAddresses: [],
      hostnames: [],
      emailAddresses: [],
      filePaths: []
    };

    // Extract IP addresses
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    data.ipAddresses = [...new Set(content.match(ipPattern) || [])];

    // Extract hostnames
    const hostnamePattern = /\b[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(?:\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\b/g;
    data.hostnames = [...new Set(content.match(hostnamePattern) || [])];

    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    data.emailAddresses = [...new Set(content.match(emailPattern) || [])];

    // Extract Windows file paths
    const pathPattern = /[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g;
    data.filePaths = [...new Set(content.match(pathPattern) || [])];

    return data;
  }

  /**
   * Generate solutions based on identified issues
   */
  _generateSolutions(identifiedProblems, errorCodes) {
    const solutions = [];

    // Solutions for identified problems
    for (const problem of identifiedProblems) {
      const problemSolutions = this.knowledgeBase.solutions[problem.issue] || [];
      solutions.push(...problemSolutions);
    }

    // Solutions for error codes
    for (const errorCode of errorCodes) {
      solutions.push(...errorCode.solutions);
    }

    // Remove duplicates
    return [...new Set(solutions)];
  }

  /**
   * Generate diagnostic commands
   */
  _generateDiagnosticCommands(identifiedProblems) {
    const commands = [];

    for (const problem of identifiedProblems) {
      const issueData = this.knowledgeBase.commonIssues[problem.issue];
      if (issueData && issueData.diagnosticCommands) {
        commands.push(...issueData.diagnosticCommands);
      }
    }

    return [...new Set(commands)];
  }

  /**
   * Analyze sentiment
   */
  _analyzeSentiment(content) {
    const contentLower = content.toLowerCase();

    // Simple sentiment analysis based on keywords
    const negativeKeywords = ['urgent', 'critical', 'emergency', 'down', 'broken', 'failed', 'not working', 'error', 'problem'];
    const positiveKeywords = ['working', 'fixed', 'resolved', 'success', 'thank'];

    let negativeCount = 0;
    let positiveCount = 0;

    for (const keyword of negativeKeywords) {
      if (contentLower.includes(keyword)) {
        negativeCount++;
      }
    }

    for (const keyword of positiveKeywords) {
      if (contentLower.includes(keyword)) {
        positiveCount++;
      }
    }

    let sentiment = 'neutral';
    let score = 0;

    if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -Math.min(negativeCount - positiveCount, 10) / 10;
    } else if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(positiveCount - negativeCount, 10) / 10;
    }

    return {
      sentiment,
      score,
      negativeKeywords: negativeCount,
      positiveKeywords: positiveCount
    };
  }

  /**
   * Recommend priority
   */
  _recommendPriority(ticket, analysis) {
    let priority = 'Medium';
    let score = 5;

    // Factor in identified issues
    for (const problem of analysis.identifiedProblems) {
      if (problem.severity === 'Critical') {
        score += 3;
      } else if (problem.severity === 'High') {
        score += 2;
      } else if (problem.severity === 'Medium') {
        score += 1;
      }
    }

    // Factor in sentiment
    if (analysis.sentiment && analysis.sentiment.sentiment === 'negative') {
      score += Math.abs(analysis.sentiment.score) * 2;
    }

    // Determine priority
    if (score >= 9) {
      priority = 'Critical';
    } else if (score >= 7) {
      priority = 'High';
    } else if (score >= 5) {
      priority = 'Medium';
    } else {
      priority = 'Low';
    }

    return {
      priority,
      score,
      currentPriority: ticket.priority?.name || 'Unknown',
      shouldChange: ticket.priority?.name !== priority
    };
  }

  /**
   * Estimate time to resolve
   */
  _estimateTime(analysis) {
    let hours = 1; // Base estimate

    // Factor in number of issues
    hours += analysis.identifiedProblems.length * 0.5;

    // Factor in severity
    for (const problem of analysis.identifiedProblems) {
      if (problem.severity === 'Critical') {
        hours += 2;
      } else if (problem.severity === 'High') {
        hours += 1;
      }
    }

    // Factor in number of error codes
    hours += analysis.errorCodes.length * 0.25;

    // Round to nearest 0.5
    hours = Math.ceil(hours * 2) / 2;

    return {
      hours,
      range: {
        min: Math.max(0.5, hours - 1),
        max: hours + 2
      }
    };
  }

  /**
   * Generate integration suggestions
   */
  _generateIntegrationSuggestions(analysis) {
    const suggestions = {
      powershell: [],
      remoteAccess: []
    };

    // PowerShell integration (Prompt 3)
    if (analysis.diagnosticCommands.length > 0) {
      suggestions.powershell.push({
        action: 'run_diagnostics',
        description: 'Run diagnostic PowerShell commands',
        commands: analysis.diagnosticCommands.slice(0, 5)
      });
    }

    if (analysis.extractedData.hostnames.length > 0) {
      suggestions.powershell.push({
        action: 'test_connectivity',
        description: 'Test connectivity to identified hosts',
        commands: analysis.extractedData.hostnames.map(host => `Test-NetConnection -ComputerName ${host}`)
      });
    }

    // Remote Access integration (Prompt 4)
    if (analysis.extractedData.hostnames.length > 0) {
      for (const hostname of analysis.extractedData.hostnames.slice(0, 3)) {
        suggestions.remoteAccess.push({
          action: 'remote_connect',
          description: `Connect to ${hostname} for troubleshooting`,
          target: hostname,
          protocol: 'rdp'
        });
      }
    }

    return suggestions;
  }

  /**
   * Run Kage Forge AI analysis
   */
  async _runKageForgeAnalysis(content, ticket) {
    try {
      const prompt = `Analyze the following technical support ticket and provide:
1. A brief summary (2-3 sentences)
2. Key issues identified (bullet points)
3. Root cause analysis
4. Recommended solution steps

Ticket:
${content}`;

      const response = await this.kageForge.generateCompletion(prompt, {
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      // Parse AI response
      const lines = response.split('\n');
      const keyIssues = [];
      let summary = '';

      for (const line of lines) {
        if (line.includes('Summary:') || line.includes('summary')) {
          summary = line.replace(/.*summary:?/i, '').trim();
        } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          keyIssues.push(line.trim().substring(1).trim());
        }
      }

      return {
        summary: summary || response.substring(0, 200),
        keyIssues: keyIssues.slice(0, 5)
      };
    } catch (error) {
      this._log('Kage Forge analysis failed', error);
      return {
        summary: 'AI analysis unavailable',
        keyIssues: []
      };
    }
  }

  /**
   * Generate simple summary (fallback)
   */
  _generateSimpleSummary(ticket, analysis) {
    const issueCount = analysis.identifiedProblems.length;
    const errorCount = analysis.errorCodes.length;

    let summary = `Ticket #${ticket.id}: ${ticket.summary}. `;

    if (issueCount > 0) {
      summary += `Identified ${issueCount} potential issue(s): ${analysis.identifiedProblems.map(p => p.issue).join(', ')}. `;
    }

    if (errorCount > 0) {
      summary += `Found ${errorCount} error code(s). `;
    }

    if (analysis.solutions.length > 0) {
      summary += `${analysis.solutions.length} solution(s) suggested.`;
    }

    return summary;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      knowledgeBase: {
        commonIssues: Object.keys(this.knowledgeBase.commonIssues).length,
        errorCodes: Object.keys(this.knowledgeBase.errorCodes).length,
        solutions: Object.keys(this.knowledgeBase.solutions).length
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      analysesRun: 0,
      issuesIdentified: 0,
      solutionsSuggested: 0,
      priorityRecommendations: 0,
      timeEstimations: 0,
      similarTicketsFound: 0
    };

    this.emit('statsReset');
  }
}

module.exports = KageTicketAnalyzer;
