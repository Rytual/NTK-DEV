/**
 * Script Runner Component
 * Interactive PowerShell script execution interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: ScriptParameter[];
}

interface ScriptParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
}

interface ExecutionResult {
  executionId: string;
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  startTime: Date;
  endTime: Date;
}

const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'createUser',
    name: 'Create User Account',
    description: 'Creates a new user in Microsoft 365',
    category: 'user-management',
    parameters: [
      { name: 'DisplayName', type: 'string', required: true },
      { name: 'UserPrincipalName', type: 'string', required: true },
      { name: 'MailNickname', type: 'string', required: true },
      { name: 'Password', type: 'password', required: true },
      { name: 'Department', type: 'string', required: false },
      { name: 'JobTitle', type: 'string', required: false }
    ]
  },
  {
    id: 'assignLicense',
    name: 'Assign License',
    description: 'Assigns a Microsoft 365 license to a user',
    category: 'licensing',
    parameters: [
      { name: 'UserId', type: 'string', required: true },
      { name: 'SkuId', type: 'string', required: true }
    ]
  },
  {
    id: 'createMailbox',
    name: 'Create Shared Mailbox',
    description: 'Creates a shared mailbox in Exchange Online',
    category: 'exchange',
    parameters: [
      { name: 'Name', type: 'string', required: true },
      { name: 'Alias', type: 'string', required: true },
      { name: 'PrimarySmtpAddress', type: 'string', required: true }
    ]
  },
  {
    id: 'createTeam',
    name: 'Create Team',
    description: 'Creates a new Microsoft Teams team',
    category: 'teams',
    parameters: [
      { name: 'DisplayName', type: 'string', required: true },
      { name: 'Description', type: 'string', required: false },
      { name: 'Visibility', type: 'select', required: false, default: 'Private' },
      { name: 'Owner', type: 'string', required: true }
    ]
  },
  {
    id: 'bulkUserCreation',
    name: 'Bulk User Creation',
    description: 'Creates multiple users from CSV file',
    category: 'user-management',
    parameters: [
      { name: 'CsvPath', type: 'file', required: true },
      { name: 'UsageLocation', type: 'string', required: false, default: 'US' }
    ]
  },
  {
    id: 'resetPassword',
    name: 'Reset User Password',
    description: 'Resets a user password',
    category: 'user-management',
    parameters: [
      { name: 'UserId', type: 'string', required: true },
      { name: 'NewPassword', type: 'password', required: true },
      { name: 'ForceChangePassword', type: 'boolean', required: false, default: true }
    ]
  },
  {
    id: 'auditMailboxAccess',
    name: 'Audit Mailbox Access',
    description: 'Retrieves mailbox access audit logs',
    category: 'compliance',
    parameters: [
      { name: 'Mailbox', type: 'string', required: true },
      { name: 'StartDate', type: 'date', required: true },
      { name: 'EndDate', type: 'date', required: true }
    ]
  },
  {
    id: 'exportGroupMembers',
    name: 'Export Group Members',
    description: 'Exports all members of a Microsoft 365 group',
    category: 'reporting',
    parameters: [
      { name: 'GroupId', type: 'string', required: true },
      { name: 'OutputPath', type: 'file', required: true }
    ]
  }
];

const CATEGORIES = ['user-management', 'licensing', 'exchange', 'teams', 'compliance', 'reporting'];

export const ScriptRunner: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [liveOutput, setLiveOutput] = useState<string>('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTemplate) {
      const defaultParams: Record<string, any> = {};
      selectedTemplate.parameters.forEach(param => {
        if (param.default !== undefined) {
          defaultParams[param.name] = param.default;
        }
      });
      setParameters(defaultParams);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [liveOutput]);

  const executeScript = async () => {
    if (!selectedTemplate) return;

    // Validate required parameters
    const missingParams = selectedTemplate.parameters
      .filter(p => p.required && !parameters[p.name])
      .map(p => p.name);

    if (missingParams.length > 0) {
      alert(`Missing required parameters: ${missingParams.join(', ')}`);
      return;
    }

    setIsExecuting(true);
    setShowOutput(true);
    setLiveOutput('Initializing script execution...\n');

    // Simulate script execution
    const startTime = new Date();

    // Simulate output streaming
    const outputLines = [
      'Connecting to Microsoft Graph...',
      'Authentication successful.',
      'Executing script commands...',
      `Processing ${selectedTemplate.name}...`,
      'Validating parameters...',
      'Applying changes...',
      'Operation completed successfully.'
    ];

    for (let i = 0; i < outputLines.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLiveOutput(prev => prev + outputLines[i] + '\n');
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const result: ExecutionResult = {
      executionId: `exec_${Date.now()}`,
      success: true,
      exitCode: 0,
      stdout: liveOutput,
      stderr: '',
      duration: duration,
      startTime: startTime,
      endTime: endTime
    };

    setExecutionResult(result);
    setExecutionHistory(prev => [result, ...prev].slice(0, 10));
    setIsExecuting(false);
  };

  const stopExecution = () => {
    setIsExecuting(false);
    setLiveOutput(prev => prev + '\n\n[Execution stopped by user]\n');
  };

  const updateParameter = (name: string, value: any) => {
    setParameters(prev => ({ ...prev, [name]: value }));
  };

  const filteredTemplates = selectedCategory
    ? SCRIPT_TEMPLATES.filter(t => t.category === selectedCategory)
    : SCRIPT_TEMPLATES;

  const renderParameterInput = (param: ScriptParameter) => {
    const value = parameters[param.name] || '';

    switch (param.type) {
      case 'password':
        return (
          <input
            type="password"
            value={value}
            onChange={(e) => updateParameter(param.name, e.target.value)}
            className="param-input"
            required={param.required}
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateParameter(param.name, e.target.checked)}
            className="param-checkbox"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => updateParameter(param.name, e.target.value)}
            className="param-input"
            required={param.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateParameter(param.name, e.target.value)}
            className="param-input"
            required={param.required}
          >
            <option value="">Select...</option>
            <option value="Private">Private</option>
            <option value="Public">Public</option>
          </select>
        );

      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => updateParameter(param.name, e.target.files?.[0]?.name)}
            className="param-input"
            required={param.required}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateParameter(param.name, e.target.value)}
            className="param-input"
            required={param.required}
          />
        );
    }
  };

  return (
    <div className="script-runner">
      <div className="runner-header">
        <div className="header-content">
          <h1 className="runner-title">
            <PlayIcon className="title-icon" />
            PowerShell Script Runner
          </h1>
          <p className="runner-subtitle">
            Execute administrative scripts for Microsoft 365
          </p>
        </div>
      </div>

      <div className="runner-grid">
        <div className="templates-section">
          <h2 className="section-title">
            <DocumentTextIcon className="section-icon" />
            Script Templates
          </h2>

          <div className="category-filter">
            <button
              className={`category-button ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="templates-list">
            {filteredTemplates.map(template => (
              <motion.div
                key={template.id}
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="template-header">
                  <h3 className="template-name">{template.name}</h3>
                  <span className="template-category">{template.category}</span>
                </div>
                <p className="template-description">{template.description}</p>
                <div className="template-params">
                  {template.parameters.length} parameters
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="execution-section">
          <AnimatePresence mode="wait">
            {selectedTemplate ? (
              <motion.div
                key="parameters"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="parameters-panel">
                  <h2 className="section-title">{selectedTemplate.name}</h2>
                  <p className="panel-description">{selectedTemplate.description}</p>

                  <div className="parameters-form">
                    {selectedTemplate.parameters.map(param => (
                      <div key={param.name} className="param-field">
                        <label className="param-label">
                          {param.name}
                          {param.required && <span className="required">*</span>}
                        </label>
                        {renderParameterInput(param)}
                      </div>
                    ))}
                  </div>

                  <div className="execution-controls">
                    {!isExecuting ? (
                      <button onClick={executeScript} className="execute-button">
                        <PlayIcon className="button-icon" />
                        Execute Script
                      </button>
                    ) : (
                      <button onClick={stopExecution} className="stop-button">
                        <StopIcon className="button-icon" />
                        Stop Execution
                      </button>
                    )}
                  </div>
                </div>

                {showOutput && (
                  <div className="output-panel">
                    <div className="output-header">
                      <h3>Execution Output</h3>
                      {isExecuting && (
                        <span className="executing-badge">
                          <ArrowPathIcon className="spin-icon" />
                          Executing...
                        </span>
                      )}
                    </div>

                    <div ref={outputRef} className="output-content">
                      <pre>{liveOutput}</pre>
                    </div>

                    {executionResult && (
                      <div className="result-summary">
                        <div className={`result-badge ${executionResult.success ? 'success' : 'error'}`}>
                          {executionResult.success ? (
                            <>
                              <CheckCircleIcon className="badge-icon" />
                              Success
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="badge-icon" />
                              Failed
                            </>
                          )}
                        </div>
                        <div className="result-info">
                          <ClockIcon className="info-icon" />
                          Duration: {executionResult.duration}ms
                        </div>
                        <div className="result-info">
                          Exit Code: {executionResult.exitCode}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="placeholder"
              >
                <FolderIcon className="placeholder-icon" />
                <h3>Select a Script Template</h3>
                <p>Choose a template from the list to configure and execute</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {executionHistory.length > 0 && (
        <div className="history-section">
          <h2 className="section-title">
            <ClockIcon className="section-icon" />
            Execution History
          </h2>

          <div className="history-list">
            {executionHistory.map(result => (
              <div key={result.executionId} className="history-item">
                <div className="history-status">
                  {result.success ? (
                    <CheckCircleIcon className="status-icon success" />
                  ) : (
                    <XCircleIcon className="status-icon error" />
                  )}
                </div>
                <div className="history-details">
                  <div className="history-id">{result.executionId}</div>
                  <div className="history-time">
                    {result.startTime.toLocaleString()}
                  </div>
                </div>
                <div className="history-duration">
                  {result.duration}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .script-runner {
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .runner-header {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .runner-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 2rem;
          font-weight: bold;
          color: #1a202c;
          margin: 0;
        }

        .title-icon {
          width: 2.5rem;
          height: 2.5rem;
          color: #667eea;
        }

        .runner-subtitle {
          color: #718096;
          margin: 0.5rem 0 0 0;
        }

        .runner-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .templates-section,
        .execution-section {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          color: #1a202c;
        }

        .section-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #667eea;
        }

        .category-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .category-button {
          padding: 0.5rem 1rem;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
          text-transform: capitalize;
        }

        .category-button.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .templates-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 600px;
          overflow-y: auto;
        }

        .template-card {
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-card:hover {
          border-color: #667eea;
        }

        .template-card.selected {
          background: #f0f4ff;
          border-color: #667eea;
        }

        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.5rem;
        }

        .template-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
        }

        .template-category {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: #e2e8f0;
          border-radius: 0.25rem;
          text-transform: capitalize;
        }

        .template-description {
          font-size: 0.875rem;
          color: #718096;
          margin: 0 0 0.5rem 0;
        }

        .template-params {
          font-size: 0.75rem;
          color: #a0aec0;
        }

        .execution-section {
          min-height: 500px;
        }

        .parameters-panel {
          margin-bottom: 2rem;
        }

        .panel-description {
          color: #718096;
          margin-bottom: 1.5rem;
        }

        .parameters-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .param-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .param-label {
          font-weight: 500;
          color: #1a202c;
        }

        .required {
          color: #e53e3e;
          margin-left: 0.25rem;
        }

        .param-input,
        .param-checkbox {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;
        }

        .execution-controls {
          display: flex;
          gap: 1rem;
        }

        .execute-button,
        .stop-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .execute-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .stop-button {
          background: #fed7d7;
          color: #c53030;
        }

        .button-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .output-panel {
          background: #1a202c;
          border-radius: 0.5rem;
          padding: 1rem;
          color: #e2e8f0;
        }

        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #4a5568;
        }

        .output-header h3 {
          margin: 0;
          color: white;
        }

        .executing-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #4a5568;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .spin-icon {
          width: 1rem;
          height: 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .output-content {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 1rem;
        }

        .output-content pre {
          margin: 0;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .result-summary {
          display: flex;
          gap: 1rem;
          align-items: center;
          padding: 1rem;
          background: #2d3748;
          border-radius: 0.5rem;
        }

        .result-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
        }

        .result-badge.success {
          background: #276749;
          color: #9ae6b4;
        }

        .result-badge.error {
          background: #742a2a;
          color: #fc8181;
        }

        .badge-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .result-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .info-icon {
          width: 1rem;
          height: 1rem;
        }

        .placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #a0aec0;
        }

        .placeholder-icon {
          width: 4rem;
          height: 4rem;
          margin-bottom: 1rem;
        }

        .history-section {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 0.5rem;
        }

        .history-status {
          flex-shrink: 0;
        }

        .status-icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .status-icon.success {
          color: #48bb78;
        }

        .status-icon.error {
          color: #f56565;
        }

        .history-details {
          flex: 1;
        }

        .history-id {
          font-weight: 500;
          color: #1a202c;
        }

        .history-time {
          font-size: 0.875rem;
          color: #718096;
        }

        .history-duration {
          font-weight: 600;
          color: #667eea;
        }
      `}</style>
    </div>
  );
};

export default ScriptRunner;
