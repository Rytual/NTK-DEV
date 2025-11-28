/**
 * PowerShell Script Runner Engine
 * Executes PowerShell scripts for M365 administration tasks
 * Includes template library, validation, logging, and rollback capabilities
 *
 * @module script-runner
 * @version 3.0.0
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

/**
 * PowerShell Script Runner
 * Manages PowerShell script execution with comprehensive features
 */
class ScriptRunner extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.powerShellPath = config.powerShellPath || 'pwsh';
    this.scriptsDir = config.scriptsDir || path.join(__dirname, '../../scripts');
    this.logsDir = config.logsDir || path.join(__dirname, '../../logs');
    this.maxExecutionTime = config.maxExecutionTime || 300000; // 5 minutes
    this.executionHistory = [];
    this.activeExecutions = new Map();
    this.scriptTemplates = this.loadScriptTemplates();

    this.initializeDirectories();
  }

  /**
   * Initialize required directories
   */
  initializeDirectories() {
    [this.scriptsDir, this.logsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load PowerShell script templates
   */
  loadScriptTemplates() {
    return {
      createUser: {
        name: 'Create User Account',
        description: 'Creates a new user in Microsoft 365',
        category: 'user-management',
        parameters: [
          { name: 'DisplayName', type: 'string', required: true },
          { name: 'UserPrincipalName', type: 'string', required: true },
          { name: 'MailNickname', type: 'string', required: true },
          { name: 'Password', type: 'securestring', required: true },
          { name: 'UsageLocation', type: 'string', required: false, default: 'US' },
          { name: 'Department', type: 'string', required: false },
          { name: 'JobTitle', type: 'string', required: false }
        ],
        script: `
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "User.ReadWrite.All"

# Create password profile
$PasswordProfile = @{
    Password = "{{Password}}"
    ForceChangePasswordNextSignIn = $true
}

# Create user
$userParams = @{
    DisplayName = "{{DisplayName}}"
    UserPrincipalName = "{{UserPrincipalName}}"
    MailNickname = "{{MailNickname}}"
    PasswordProfile = $PasswordProfile
    AccountEnabled = $true
    UsageLocation = "{{UsageLocation}}"
}

{{#if Department}}
$userParams.Department = "{{Department}}"
{{/if}}

{{#if JobTitle}}
$userParams.JobTitle = "{{JobTitle}}"
{{/if}}

try {
    $newUser = New-MgUser @userParams
    Write-Output "User created successfully: $($newUser.Id)"
    return $newUser
} catch {
    Write-Error "Failed to create user: $_"
    throw
}
`
      },

      assignLicense: {
        name: 'Assign License',
        description: 'Assigns a Microsoft 365 license to a user',
        category: 'licensing',
        parameters: [
          { name: 'UserId', type: 'string', required: true },
          { name: 'SkuId', type: 'string', required: true },
          { name: 'DisabledPlans', type: 'array', required: false }
        ],
        script: `
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "User.ReadWrite.All", "Organization.Read.All"

$userId = "{{UserId}}"
$skuId = "{{SkuId}}"

# Prepare license assignment
$addLicenses = @{
    SkuId = $skuId
    {{#if DisabledPlans}}
    DisabledPlans = @({{DisabledPlans}})
    {{/if}}
}

try {
    Set-MgUserLicense -UserId $userId -AddLicenses @($addLicenses) -RemoveLicenses @()
    Write-Output "License assigned successfully to user: $userId"
} catch {
    Write-Error "Failed to assign license: $_"
    throw
}
`
      },

      createMailbox: {
        name: 'Create Mailbox',
        description: 'Creates a shared mailbox in Exchange Online',
        category: 'exchange',
        parameters: [
          { name: 'Name', type: 'string', required: true },
          { name: 'Alias', type: 'string', required: true },
          { name: 'PrimarySmtpAddress', type: 'string', required: true }
        ],
        script: `
# Connect to Exchange Online
Connect-ExchangeOnline

$name = "{{Name}}"
$alias = "{{Alias}}"
$email = "{{PrimarySmtpAddress}}"

try {
    $mailbox = New-Mailbox -Shared -Name $name -Alias $alias -PrimarySmtpAddress $email
    Write-Output "Shared mailbox created: $($mailbox.Identity)"
    return $mailbox
} catch {
    Write-Error "Failed to create mailbox: $_"
    throw
}
`
      },

      createTeam: {
        name: 'Create Team',
        description: 'Creates a new Microsoft Teams team',
        category: 'teams',
        parameters: [
          { name: 'DisplayName', type: 'string', required: true },
          { name: 'Description', type: 'string', required: false },
          { name: 'Visibility', type: 'string', required: false, default: 'Private' },
          { name: 'Owner', type: 'string', required: true }
        ],
        script: `
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Team.Create", "Group.ReadWrite.All"

$teamParams = @{
    DisplayName = "{{DisplayName}}"
    {{#if Description}}
    Description = "{{Description}}"
    {{/if}}
    Visibility = "{{Visibility}}"
    "Members@odata.bind" = @(
        "https://graph.microsoft.com/v1.0/users/{{Owner}}"
    )
}

try {
    $team = New-MgTeam @teamParams
    Write-Output "Team created: $($team.Id)"
    return $team
} catch {
    Write-Error "Failed to create team: $_"
    throw
}
`
      },

      bulkUserCreation: {
        name: 'Bulk User Creation',
        description: 'Creates multiple users from CSV file',
        category: 'user-management',
        parameters: [
          { name: 'CsvPath', type: 'string', required: true },
          { name: 'UsageLocation', type: 'string', required: false, default: 'US' }
        ],
        script: `
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "User.ReadWrite.All"

$csvPath = "{{CsvPath}}"
$usageLocation = "{{UsageLocation}}"

if (-not (Test-Path $csvPath)) {
    throw "CSV file not found: $csvPath"
}

$users = Import-Csv -Path $csvPath
$results = @()

foreach ($user in $users) {
    try {
        $PasswordProfile = @{
            Password = $user.Password
            ForceChangePasswordNextSignIn = $true
        }

        $userParams = @{
            DisplayName = $user.DisplayName
            UserPrincipalName = $user.UserPrincipalName
            MailNickname = $user.MailNickname
            PasswordProfile = $PasswordProfile
            AccountEnabled = $true
            UsageLocation = $usageLocation
        }

        if ($user.Department) { $userParams.Department = $user.Department }
        if ($user.JobTitle) { $userParams.JobTitle = $user.JobTitle }

        $newUser = New-MgUser @userParams

        $results += [PSCustomObject]@{
            UserPrincipalName = $user.UserPrincipalName
            Status = "Success"
            UserId = $newUser.Id
        }

        Write-Output "Created user: $($user.UserPrincipalName)"
    } catch {
        $results += [PSCustomObject]@{
            UserPrincipalName = $user.UserPrincipalName
            Status = "Failed"
            Error = $_.Exception.Message
        }

        Write-Warning "Failed to create user $($user.UserPrincipalName): $_"
    }
}

return $results
`
      },

      configureConditionalAccess: {
        name: 'Configure Conditional Access Policy',
        description: 'Creates or updates a Conditional Access policy',
        category: 'security',
        parameters: [
          { name: 'PolicyName', type: 'string', required: true },
          { name: 'State', type: 'string', required: false, default: 'enabledForReportingButNotEnforced' },
          { name: 'IncludeUsers', type: 'array', required: true },
          { name: 'RequireMFA', type: 'boolean', required: false, default: true }
        ],
        script: `
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Policy.ReadWrite.ConditionalAccess"

$policyName = "{{PolicyName}}"
$state = "{{State}}"

$conditions = @{
    Users = @{
        IncludeUsers = @({{IncludeUsers}})
    }
    Applications = @{
        IncludeApplications = @("All")
    }
}

$grantControls = @{
    Operator = "OR"
    BuiltInControls = @("mfa")
}

$policyParams = @{
    DisplayName = $policyName
    State = $state
    Conditions = $conditions
    {{#if RequireMFA}}
    GrantControls = $grantControls
    {{/if}}
}

try {
    $policy = New-MgIdentityConditionalAccessPolicy @policyParams
    Write-Output "Conditional Access policy created: $($policy.Id)"
    return $policy
} catch {
    Write-Error "Failed to create policy: $_"
    throw
}
`
      },

      auditMailboxAccess: {
        name: 'Audit Mailbox Access',
        description: 'Retrieves mailbox access audit logs',
        category: 'compliance',
        parameters: [
          { name: 'Mailbox', type: 'string', required: true },
          { name: 'StartDate', type: 'datetime', required: true },
          { name: 'EndDate', type: 'datetime', required: true }
        ],
        script: `
# Connect to Exchange Online
Connect-ExchangeOnline

$mailbox = "{{Mailbox}}"
$startDate = [DateTime]::Parse("{{StartDate}}")
$endDate = [DateTime]::Parse("{{EndDate}}")

try {
    $auditLogs = Search-MailboxAuditLog -Identity $mailbox -StartDate $startDate -EndDate $endDate -ShowDetails

    Write-Output "Found $($auditLogs.Count) audit entries"

    $results = $auditLogs | Select-Object Operation, LogonUserDisplayName, LastAccessed, ClientIPAddress, ClientInfoString

    return $results
} catch {
    Write-Error "Failed to retrieve audit logs: $_"
    throw
}
`
      },

      exportGroupMembers: {
        name: 'Export Group Members',
        description: 'Exports all members of a Microsoft 365 group',
        category: 'reporting',
        parameters: [
          { name: 'GroupId', type: 'string', required: true },
          { name: 'OutputPath', type: 'string', required: true }
        ],
        script: `
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Group.Read.All", "User.Read.All"

$groupId = "{{GroupId}}"
$outputPath = "{{OutputPath}}"

try {
    $group = Get-MgGroup -GroupId $groupId
    $members = Get-MgGroupMember -GroupId $groupId -All

    $memberDetails = @()

    foreach ($member in $members) {
        $user = Get-MgUser -UserId $member.Id

        $memberDetails += [PSCustomObject]@{
            DisplayName = $user.DisplayName
            UserPrincipalName = $user.UserPrincipalName
            Department = $user.Department
            JobTitle = $user.JobTitle
            Mail = $user.Mail
        }
    }

    $memberDetails | Export-Csv -Path $outputPath -NoTypeInformation

    Write-Output "Exported $($memberDetails.Count) members to $outputPath"
    return $memberDetails
} catch {
    Write-Error "Failed to export group members: $_"
    throw
}
`
      },

      enableLitigationHold: {
        name: 'Enable Litigation Hold',
        description: 'Enables litigation hold on a mailbox',
        category: 'compliance',
        parameters: [
          { name: 'Identity', type: 'string', required: true },
          { name: 'Duration', type: 'int', required: false }
        ],
        script: `
# Connect to Exchange Online
Connect-ExchangeOnline

$identity = "{{Identity}}"
{{#if Duration}}
$duration = {{Duration}}
{{/if}}

try {
    $params = @{
        Identity = $identity
        LitigationHoldEnabled = $true
    }

    {{#if Duration}}
    $params.LitigationHoldDuration = $duration
    {{/if}}

    Set-Mailbox @params

    Write-Output "Litigation hold enabled for: $identity"
} catch {
    Write-Error "Failed to enable litigation hold: $_"
    throw
}
`
      },

      resetPassword: {
        name: 'Reset User Password',
        description: 'Resets a user password and forces change on next login',
        category: 'user-management',
        parameters: [
          { name: 'UserId', type: 'string', required: true },
          { name: 'NewPassword', type: 'securestring', required: true },
          { name: 'ForceChangePassword', type: 'boolean', required: false, default: true }
        ],
        script: `
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "User.ReadWrite.All"

$userId = "{{UserId}}"
$newPassword = "{{NewPassword}}"
$forceChange = ${{ForceChangePassword}}

$passwordProfile = @{
    Password = $newPassword
    ForceChangePasswordNextSignIn = $forceChange
}

try {
    Update-MgUser -UserId $userId -PasswordProfile $passwordProfile
    Write-Output "Password reset successfully for user: $userId"
} catch {
    Write-Error "Failed to reset password: $_"
    throw
}
`
      }
    };
  }

  /**
   * Execute a script template
   */
  async executeTemplate(templateName, parameters, options = {}) {
    try {
      const template = this.scriptTemplates[templateName];

      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      // Validate parameters
      this.validateParameters(template.parameters, parameters);

      // Render script with parameters
      const script = this.renderScript(template.script, parameters);

      // Execute script
      const executionId = this.generateExecutionId();
      const result = await this.executeScript(script, {
        ...options,
        executionId,
        templateName
      });

      return result;
    } catch (error) {
      throw new Error(`Template execution failed: ${error.message}`);
    }
  }

  /**
   * Validate script parameters
   */
  validateParameters(paramDefinitions, providedParams) {
    const errors = [];

    for (const paramDef of paramDefinitions) {
      const value = providedParams[paramDef.name];

      // Check required parameters
      if (paramDef.required && (value === undefined || value === null)) {
        errors.push(`Required parameter missing: ${paramDef.name}`);
        continue;
      }

      // Skip validation if parameter not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Validate type
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (paramDef.type !== actualType && paramDef.type !== 'securestring') {
        errors.push(`Parameter ${paramDef.name} should be ${paramDef.type}, got ${actualType}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Parameter validation failed:\n${errors.join('\n')}`);
    }

    return true;
  }

  /**
   * Render script with parameters
   */
  renderScript(scriptTemplate, parameters) {
    let rendered = scriptTemplate;

    // Replace simple placeholders
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(placeholder, value);
    }

    // Handle conditional blocks
    rendered = this.processConditionals(rendered, parameters);

    return rendered;
  }

  /**
   * Process conditional blocks in template
   */
  processConditionals(script, parameters) {
    let processed = script;

    // Handle {{#if param}} blocks
    const ifPattern = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

    processed = processed.replace(ifPattern, (match, paramName, content) => {
      return parameters[paramName] ? content : '';
    });

    return processed;
  }

  /**
   * Execute PowerShell script
   */
  async executeScript(script, options = {}) {
    const executionId = options.executionId || this.generateExecutionId();

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Create log file
      const logPath = path.join(this.logsDir, `${executionId}.log`);
      const logStream = fs.createWriteStream(logPath);

      // Save script to file
      const scriptPath = path.join(this.scriptsDir, `${executionId}.ps1`);
      fs.writeFileSync(scriptPath, script);

      this.emit('executionStarted', {
        executionId,
        scriptPath,
        logPath,
        timestamp: new Date()
      });

      // Spawn PowerShell process
      const ps = spawn(this.powerShellPath, [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath
      ]);

      let stdout = '';
      let stderr = '';

      // Track execution
      this.activeExecutions.set(executionId, {
        process: ps,
        startTime,
        scriptPath,
        logPath
      });

      // Set timeout
      const timeout = setTimeout(() => {
        ps.kill('SIGTERM');
        reject(new Error('Script execution timeout'));
      }, this.maxExecutionTime);

      // Capture stdout
      ps.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logStream.write(`[STDOUT] ${output}`);

        this.emit('output', {
          executionId,
          type: 'stdout',
          data: output
        });
      });

      // Capture stderr
      ps.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logStream.write(`[STDERR] ${output}`);

        this.emit('output', {
          executionId,
          type: 'stderr',
          data: output
        });
      });

      // Handle completion
      ps.on('close', (code) => {
        clearTimeout(timeout);
        logStream.end();

        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          executionId,
          success: code === 0,
          exitCode: code,
          stdout,
          stderr,
          duration,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          logPath,
          scriptPath
        };

        // Add to history
        this.executionHistory.push(result);

        // Clean up
        this.activeExecutions.delete(executionId);

        // Clean up script file
        if (!options.keepScript) {
          fs.unlinkSync(scriptPath);
        }

        this.emit('executionCompleted', result);

        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`Script execution failed with code ${code}: ${stderr}`));
        }
      });

      // Handle errors
      ps.on('error', (error) => {
        clearTimeout(timeout);
        logStream.end();
        this.activeExecutions.delete(executionId);

        this.emit('executionError', {
          executionId,
          error
        });

        reject(error);
      });
    });
  }

  /**
   * Execute custom script file
   */
  async executeScriptFile(filePath, options = {}) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Script file not found: ${filePath}`);
      }

      const script = fs.readFileSync(filePath, 'utf8');
      return await this.executeScript(script, {
        ...options,
        scriptPath: filePath
      });
    } catch (error) {
      throw new Error(`Failed to execute script file: ${error.message}`);
    }
  }

  /**
   * Cancel running execution
   */
  cancelExecution(executionId) {
    const execution = this.activeExecutions.get(executionId);

    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.process.kill('SIGTERM');
    this.activeExecutions.delete(executionId);

    this.emit('executionCancelled', { executionId });

    return true;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId) {
    const active = this.activeExecutions.get(executionId);

    if (active) {
      return {
        status: 'running',
        executionId,
        startTime: new Date(active.startTime),
        duration: Date.now() - active.startTime
      };
    }

    const historical = this.executionHistory.find(h => h.executionId === executionId);

    if (historical) {
      return {
        status: historical.success ? 'completed' : 'failed',
        ...historical
      };
    }

    return null;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(options = {}) {
    let history = [...this.executionHistory];

    // Filter by template
    if (options.templateName) {
      history = history.filter(h => h.templateName === options.templateName);
    }

    // Filter by success status
    if (options.successOnly !== undefined) {
      history = history.filter(h => h.success === options.successOnly);
    }

    // Limit results
    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  /**
   * Get execution logs
   */
  getExecutionLogs(executionId) {
    const execution = this.executionHistory.find(h => h.executionId === executionId);

    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (!fs.existsSync(execution.logPath)) {
      throw new Error(`Log file not found: ${execution.logPath}`);
    }

    return fs.readFileSync(execution.logPath, 'utf8');
  }

  /**
   * Get available templates
   */
  getTemplates(category = null) {
    const templates = Object.entries(this.scriptTemplates).map(([id, template]) => ({
      id,
      ...template
    }));

    if (category) {
      return templates.filter(t => t.category === category);
    }

    return templates;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.scriptTemplates[templateId] || null;
  }

  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Clean up old logs
   */
  cleanupLogs(daysToKeep = 30) {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    const logFiles = fs.readdirSync(this.logsDir);

    for (const file of logFiles) {
      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < cutoffDate) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }

    this.emit('logsCleanedUp', {
      count: cleanedCount,
      cutoffDate: new Date(cutoffDate)
    });

    return cleanedCount;
  }
}

module.exports = ScriptRunner;
