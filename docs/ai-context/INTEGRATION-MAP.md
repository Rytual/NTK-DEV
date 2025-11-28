# Ninja Toolkit v11 - Integration Map

## Cross-Module Integration Chains

This document maps all integration points between modules, showing how data flows and how modules interact.

---

## Integration Matrix

```
                 NinjaShark  PowerShell  PuTTY  NetworkMap  Security  Azure  KageForge  Ticketing  Academy  KageChat  MediaLoader
NinjaShark          -           .          .        X          X        .        X          .         .        X          .
PowerShell          .           -          X        .          X        X        X          .         .        X          .
PuTTY               .           X          -        X          X        .        X          .         .        X          .
NetworkMap          X           .          X        -          X        .        X          .         .        X          .
Security            X           X          X        X          -        X        X          X         .        X          .
Azure               .           X          .        .          X        -        X          X         .        X          .
KageForge           X           X          X        X          X        X        -          X         X        X          .
Ticketing           .           .          .        .          X        X        X          -         .        X          .
Academy             .           .          .        .          .        .        X          .         -        X          X
KageChat            X           X          X        X          X        X        X          X         X        -          .
MediaLoader         .           .          .        .          .        .        .          .         X        .          -

Legend: X = Direct integration, . = No direct integration
```

---

## Integration Chains by Workflow

### 1. Security Incident Response Chain

```
NinjaShark (detect anomaly)
    │
    ▼
Security (vulnerability scan)
    │
    ▼
Ticketing (create incident)
    │
    ▼
KageChat (AI analysis)
    │
    ▼
PowerShell/PuTTY (remediation)
```

**Data Flow**:
1. NinjaShark detects suspicious traffic pattern
2. AnomalyDetector creates alert with packet details
3. Security module receives alert, initiates targeted scan
4. Ticketing creates incident ticket with findings
5. KageChat provides AI-assisted remediation steps
6. PowerShell executes remediation commands

**IPC Events**:
```javascript
// NinjaShark → Security
eventBus.publish('ninjashark:anomaly-detected', {
  type: 'port-scan',
  sourceIP: '192.168.1.100',
  severity: 'high'
});

// Security → Ticketing
eventBus.publish('security:vulnerability-found', {
  scanId: 'uuid',
  target: '192.168.1.100',
  vulnerabilities: [...]
});
```

---

### 2. Network Discovery Chain

```
NetworkMap (scan subnet)
    │
    ├──▶ NinjaShark (traffic analysis)
    │
    ├──▶ Security (vulnerability scan)
    │
    └──▶ PuTTY (device access)
```

**Data Flow**:
1. NetworkMap discovers devices via ARP/SNMP
2. Device info shared with NinjaShark for traffic tagging
3. Security runs automated vulnerability scan
4. PuTTY provides quick access to device consoles

**IPC Events**:
```javascript
// NetworkMap → NinjaShark
eventBus.publish('networkmap:device-discovered', {
  ip: '192.168.1.10',
  mac: '00:11:22:33:44:55',
  vendor: 'Cisco'
});

// NetworkMap → Security
eventBus.publish('networkmap:scan-complete', {
  subnet: '192.168.1.0/24',
  devices: [...]
});
```

---

### 3. AI-Assisted Workflow Chain

```
Any Module (user query)
    │
    ▼
KageChat (natural language)
    │
    ▼
KageForge (AI processing)
    │
    ├──▶ Provider Router (select provider)
    │
    ├──▶ Cache Engine (check cache)
    │
    └──▶ Token Tracker (usage tracking)
    │
    ▼
Target Module (execute action)
```

**Data Flow**:
1. User asks question in any module context
2. KageChat captures context and routes to KageForge
3. KageForge selects optimal provider
4. Response streamed back with action suggestions
5. User confirms action, executed in target module

**IPC Events**:
```javascript
// KageChat → KageForge
await window.electronAPI.invoke('kageforge:streamChat', {
  messages: [...],
  context: { module: 'Security', activeDevice: '...' }
});

// KageForge events
eventBus.publish('kageforge:routing-decision', { provider: 'anthropic' });
eventBus.publish('kageforge:usage-tracked', { tokens: 1500, cost: 0.003 });
```

---

### 4. Training & Learning Chain

```
Academy (study session)
    │
    ├──▶ KageForge (AI explanations)
    │
    ├──▶ MediaLoader (backgrounds)
    │
    └──▶ GamificationEngine (XP/badges)
```

**Data Flow**:
1. User starts study session for AZ-104
2. Questions served from QuestionBank
3. Wrong answers trigger AI explanation via KageForge
4. MediaLoader provides visual backgrounds
5. GamificationEngine tracks progress, awards XP

**IPC Events**:
```javascript
// Academy → KageForge
await window.electronAPI.invoke('kageforge:chat', {
  messages: [{ role: 'user', content: 'Explain why A is correct...' }]
});

// Academy → MediaLoader
const background = await window.electronAPI.invoke('media:getRandomImage');
```

---

### 5. Administrative Workflow Chain

```
Ticketing (service request)
    │
    ▼
Azure (user management)
    │
    ▼
PowerShell (automation)
    │
    ▼
KageChat (verification)
```

**Data Flow**:
1. Service request ticket for new user
2. Azure module creates M365 user account
3. PowerShell runs additional configuration
4. KageChat summarizes actions taken

---

## Module-to-Module Integration Details

### NinjaShark ↔ Security

**Purpose**: Share threat intelligence, correlate traffic with vulnerabilities

**Integration Points**:
- Anomaly alerts → Targeted vulnerability scans
- Traffic patterns → Attack vector analysis
- Port scan detection → Port vulnerability checks

```javascript
// NinjaShark publishes
eventBus.publish('ninjashark:anomaly-detected', {
  type: 'port-scan',
  sourceIP: '...',
  targetPorts: [22, 80, 443],
  timestamp: Date.now()
});

// Security subscribes
eventBus.subscribe('ninjashark:anomaly-detected', (data) => {
  securityScanner.priorityScan(data.sourceIP, data.targetPorts);
});
```

---

### NinjaShark ↔ NetworkMap

**Purpose**: Device-aware packet analysis

**Integration Points**:
- Device discovery → Traffic tagging
- Traffic volume → Device health indicators
- MAC addresses → Vendor identification

---

### PowerShell ↔ Remote Access

**Purpose**: Cross-platform remote execution

**Integration Points**:
- SSH session → PowerShell Core execution
- Local PowerShell → Remote script deployment
- Script sharing between terminals

---

### Security ↔ Ticketing

**Purpose**: Automated security incident tickets

**Integration Points**:
- Critical vulnerabilities → Auto-create tickets
- Scan reports → Ticket attachments
- Remediation status → Ticket updates

```javascript
// Security → Ticketing
eventBus.publish('security:critical-finding', {
  scanId: 'uuid',
  severity: 'CRITICAL',
  title: 'CVE-2024-XXXX Detected',
  target: '192.168.1.10',
  recommendation: 'Apply patch immediately'
});

// Ticketing receives
eventBus.subscribe('security:critical-finding', async (data) => {
  await ticketingService.createTicket({
    summary: data.title,
    priority: 'critical',
    type: 'incident',
    description: `Vulnerability scan found: ${data.recommendation}`
  });
});
```

---

### KageForge ↔ All Modules

**Purpose**: Central AI service provider

**Integration Points**:
- Natural language queries from any module
- Context-aware responses
- Token/cost tracking per module

```javascript
// Any module can call
const response = await window.electronAPI.invoke('kageforge:chat', {
  messages: [{ role: 'user', content: '...' }],
  context: { module: 'ModuleName' }
});
```

---

### KageChat ↔ All Modules

**Purpose**: Universal AI assistant interface

**Integration Points**:
- Module context injection
- Cross-module action suggestions
- Unified help system

---

### Academy ↔ MediaLoader

**Purpose**: Visual learning enhancement

**Integration Points**:
- Random background images/videos
- Gradient fallbacks
- Theme consistency

---

## Event Bus Architecture

### Global Event Bus

```javascript
// src/backend/eventBus.cjs
class EventBus extends EventEmitter {
  publish(event, data) {
    this.emit(event, data);
    this.emit('*', { event, data });  // Wildcard
  }

  subscribe(event, handler) {
    this.on(event, handler);
  }

  subscribeAll(handler) {
    this.on('*', handler);
  }
}
```

### Event Categories

| Prefix | Module | Example Events |
|--------|--------|----------------|
| `ninjashark:` | NinjaShark | `anomaly-detected`, `capture-started`, `capture-stopped` |
| `security:` | Security | `scan-complete`, `vulnerability-found`, `critical-finding` |
| `networkmap:` | NetworkMap | `device-discovered`, `scan-complete`, `device-offline` |
| `kageforge:` | KageForge | `routing-decision`, `usage-tracked`, `cache-hit` |
| `academy:` | Academy | `question-answered`, `badge-earned`, `level-up` |
| `system:` | Core | `module-loaded`, `error`, `health-check` |

---

## IPC Channel Registry

### System Channels
```javascript
'system:getModuleStates'
'system:getVersion'
'system:getPlatform'
'system:logError'
'system:getHealth'
'system:runHealthCheck'
```

### Module Lifecycle
```javascript
'module:switch'
'module:getActive'
```

### NinjaShark
```javascript
'ninjashark:getInterfaces'
'ninjashark:startCapture'
'ninjashark:stopCapture'
'ninjashark:getStats'
'ninjashark:getAlerts'
'ninjashark:export'
```

### PowerShell
```javascript
'powershell:createSession'
'powershell:execute'
'powershell:write'
'powershell:resize'
'powershell:close'
'powershell:getHistory'
```

### Remote Access
```javascript
'remote:createSSH'
'remote:createTelnet'
'remote:createSerial'
'remote:execute'
'remote:close'
'remote:listPorts'
'remote:executeMacro'
```

### Security
```javascript
'security:scan'
'security:getScanHistory'
'security:exportScan'
```

### KageForge
```javascript
'kageforge:chat'
'kageforge:streamChat'
'kageforge:getStats'
'kageforge:setStrategy'
'kageforge:getUsage'
'kageforge:getBudget'
```

### Academy
```javascript
'academy:getQuestion'
'academy:getRandomQuestions'
'academy:recordAnswer'
'academy:getUserStats'
'academy:getProgressSummary'
```

### MediaLoader
```javascript
'media:getRandomImage'
'media:getRandomVideo'
'media:getStats'
```

---

## Data Flow Diagrams

### Security Alert to Ticket

```
┌─────────────┐    alert     ┌─────────────┐   create    ┌─────────────┐
│  NinjaShark │───────────▶│  Security   │───────────▶│  Ticketing  │
└─────────────┘              └─────────────┘             └─────────────┘
       │                            │                          │
       │ capture                    │ scan                     │ ticket
       ▼                            ▼                          ▼
┌─────────────┐              ┌─────────────┐            ┌─────────────┐
│   Packets   │              │   Findings  │            │   Ticket    │
└─────────────┘              └─────────────┘            └─────────────┘
```

### AI Request Flow

```
┌─────────────┐   message    ┌─────────────┐   route     ┌─────────────┐
│  KageChat   │───────────▶│  KageForge  │───────────▶│  Provider   │
└─────────────┘              └─────────────┘             │   Router    │
                                    │                    └──────┬──────┘
                                    │                           │
                             ┌──────┴──────┐                    │ select
                             │             │                    ▼
                       ┌─────▼─────┐ ┌─────▼─────┐       ┌─────────────┐
                       │   Cache   │ │   Token   │       │   OpenAI    │
                       │   Engine  │ │   Tracker │       │  Anthropic  │
                       └───────────┘ └───────────┘       │   Vertex    │
                                                         └─────────────┘
```

---

## Best Practices for Integration

### 1. Use Event Bus for Loose Coupling
```javascript
// Good: Event-based
eventBus.publish('ninjashark:anomaly-detected', data);

// Avoid: Direct function calls between modules
security.handleAnomaly(data);  // Creates tight coupling
```

### 2. Use IPC for Renderer-Main Communication
```javascript
// Good: IPC invoke
const result = await window.electronAPI.invoke('security:scan', { target });

// Avoid: Direct Node.js calls from renderer
const scan = require('./security');  // Won't work in renderer
```

### 3. Standardize Event Data
```javascript
// Good: Consistent structure
eventBus.publish('module:event-name', {
  timestamp: Date.now(),
  source: 'ModuleName',
  data: { ... }
});
```

### 4. Handle Integration Failures Gracefully
```javascript
// Good: Graceful degradation
try {
  await securityScanner.scan(target);
} catch (error) {
  eventBus.publish('security:scan-failed', { error: error.message });
  // Continue with fallback behavior
}
```

---

## Future Integration Opportunities

1. **Auvik Integration**: Real-time network topology sync
2. **NinjaRMM Integration**: Endpoint management
3. **ConnectWise PSA API**: Full ticket lifecycle
4. **Microsoft Graph API**: M365 administration
5. **Slack/Teams**: Notification channels
6. **PagerDuty**: Alert escalation
7. **Prometheus/Grafana**: Metrics export
