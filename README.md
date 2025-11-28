<p align="center">
  <img src="assets/logo.png" alt="Ninja Toolkit" width="120" height="120">
</p>

<h1 align="center">Ninja Toolkit v11</h1>

<p align="center">
  <strong>Enterprise MSP Management Suite</strong>
  <br>
  <em>Unified IT Operations Platform with AI-Powered Automation</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#modules">Modules</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a>
</p>

---

## Executive Summary

Ninja Toolkit v11 is a comprehensive desktop application engineered for Managed Service Providers (MSPs) that consolidates network monitoring, security operations, remote access, ticketing, and AI-powered automation into a unified platform. Built on modern web technologies within a native desktop shell, it eliminates context-switching between disparate tools and streamlines daily IT operations.

### Business Value

| Metric | Impact |
|--------|--------|
| **Tool Consolidation** | Replaces 8+ separate applications |
| **Workflow Efficiency** | Cross-module automation chains |
| **Compliance Coverage** | 7 enterprise frameworks supported |
| **AI Integration** | Multi-provider orchestration |
| **Deployment** | Silent install via GPO/Intune |

---

## Technology Stack

### Core Platform

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Electron | 39.2.4 | Cross-platform desktop shell |
| **UI Framework** | React | 19.2.0 | Component-based interface |
| **Language** | TypeScript | 5.9.3 | Type-safe development |
| **Build System** | Vite | 7.2.4 | Fast HMR development |
| **Packaging** | Electron Forge | 7.4.0 | Installer generation |
| **Styling** | Tailwind CSS | 4.0.17 | Utility-first CSS (OKLCH) |
| **Animation** | Framer Motion | 11.15.0 | Physics-based motion |
| **Backend** | Express | 4.21.2 | API server |

### AI & Cloud Integration

| Provider | Package | Purpose |
|----------|---------|---------|
| **Anthropic** | @anthropic-ai/sdk | Claude API integration |
| **OpenAI** | openai | GPT models |
| **Google** | @google-cloud/vertexai | Gemini models |
| **Microsoft** | @azure/msal-node | Azure AD authentication |
| **Microsoft** | @microsoft/microsoft-graph-client | Graph API |

### Native Capabilities

| Module | Dependency | Function |
|--------|------------|----------|
| **Packet Capture** | cap (libpcap) | Live network analysis |
| **Terminal PTY** | node-pty | Shell emulation |
| **Serial Console** | serialport | Hardware access |
| **SNMP Discovery** | snmp-native | Network scanning |
| **Local Database** | better-sqlite3 | WAL-mode persistence |
| **Credentials** | keytar | OS keychain integration |

---

## Architecture

### Three-Pane Layout

Optimized for IT workflow efficiency with collapsible panels:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Title Bar                                  │
├──────────┬────────────────────────────────────┬─────────────────────┤
│          │                                    │                     │
│  Blade   │                                    │      Kage Chat      │
│   Nav    │         Module Content             │     AI Assistant    │
│          │         (Lazy-loaded)              │                     │
│ 64-280px │                                    │      320-480px      │
│          │                                    │                     │
├──────────┴────────────────────────────────────┴─────────────────────┤
│  Status Bar: Performance Metrics | Connection Status | Notifications │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Renderer Process                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   React     │  │   Router    │  │   State     │  │  Components │ │
│  │   19.2.0    │  │    v6       │  │   Context   │  │   Library   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         └─────────────────┼─────────────────┼─────────────────┘      │
│                           │                 │                        │
│                    ┌──────▼─────────────────▼──────┐                │
│                    │        IPC Bridge             │                │
│                    │   (contextBridge API)         │                │
│                    └──────────────┬────────────────┘                │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────┐
│                           Main Process                               │
│                    ┌──────────────▼────────────────┐                │
│                    │      IPC Handlers             │                │
│                    │   40+ registered channels     │                │
│                    └──────────────┬────────────────┘                │
│         ┌─────────────────────────┼─────────────────────────────┐   │
│         │                         │                             │   │
│  ┌──────▼──────┐  ┌───────────────▼───────────────┐  ┌─────────▼─┐ │
│  │ MediaLoader │  │      Module Backends          │  │  Express  │ │
│  │   (Core)    │  │  NinjaShark | PowerShell     │  │  Backend  │ │
│  │             │  │  PuTTY | NetworkMap | etc.    │  │  :3001    │ │
│  └─────────────┘  └───────────────────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Modules

### Module Overview

| # | Module | Purpose | Native Deps |
|---|--------|---------|-------------|
| 1 | **NinjaShark** | Network packet capture & analysis | cap (libpcap) |
| 2 | **PowerShell** | Terminal emulation with AI tagging | node-pty |
| 3 | **PuTTY** | SSH/Telnet/Serial remote access | serialport |
| 4 | **NetworkMap** | Infrastructure topology & monitoring | snmp-native |
| 5 | **Security** | Vulnerability scanning & compliance | — |
| 6 | **MSAdmin** | Microsoft 365/Azure administration | — |
| 7 | **KageForge** | AI provider management & routing | — |
| 8 | **Ticketing** | ConnectWise PSA integration | — |
| 9 | **Academy** | Training & certification platform | better-sqlite3 |
| 10 | **MediaLoader** | Global theming & media rotation | — |
| 11 | **KageChat** | AI assistant panel | — |

### Cross-Module Integration Chains

Modules are designed to work together through automated workflow chains:

```
Security Remediation Chain:
NinjaShark → Security → NetworkMap → PuTTY → Ticketing
(anomaly)    (alert)    (topology)   (fix)    (document)

Azure Reporting Chain:
CSV Import → MSAdmin → PowerShell → PDF Export → Email
(pricing)    (calc)    (script)     (report)    (send)

Training Content Chain:
NinjaShark → Academy
(hex data)   (PBQ generation via AI)

Diagnostic Workflow Chain:
Ticketing → PowerShell → Log Collection → Draft Response
(ticket)    (scripts)    (aggregate)     (AI-generated)
```

---

## Module Details

### 1. NinjaShark - Network Analysis

Real-time packet capture and protocol analysis engine.

| Feature | Description |
|---------|-------------|
| **Live Capture** | Interface selection, BPF filters |
| **Protocol Decode** | TCP, UDP, HTTP, DNS, TLS, ICMP |
| **Session Tracking** | Flow reconstruction, conversation view |
| **Anomaly Detection** | AI-assisted pattern analysis |
| **Export** | PCAP format, CSV statistics |

**Performance Target:** 100,000 packets with virtual scrolling

### 2. PowerShell Terminal

Integrated terminal with AI-powered script management.

| Feature | Description |
|---------|-------------|
| **Multi-tab Sessions** | Concurrent shell instances |
| **AI Tagging** | Automatic script summaries |
| **Command History** | Searchable with fuzzy match |
| **Snippet Library** | Saved script templates |
| **Output Export** | JSON, text, HTML formats |

**Performance Target:** <100ms echo latency

### 3. PuTTY/Remote Access

SSH, Telnet, and Serial console client.

| Feature | Description |
|---------|-------------|
| **Connection Manager** | Saved sessions, folders |
| **Authentication** | Password, key-based, agent |
| **Macro System** | Automated command sequences |
| **Session Logging** | Timestamped transcripts |
| **Serial Console** | COM port access |

### 4. NetworkMap (Auvik Integration)

Network topology visualization and monitoring.

| Feature | Description |
|---------|-------------|
| **Auto-Discovery** | SNMP, ping sweep, ARP |
| **3D Topology** | Three.js visualization |
| **Device Inventory** | Asset tracking, tagging |
| **Performance Graphs** | Bandwidth, latency, errors |
| **Alert Integration** | Threshold-based notifications |

**Performance Target:** 30fps 3D rendering

### 5. Security Suite

Enterprise vulnerability scanning and compliance.

| Framework | Coverage |
|-----------|----------|
| **PCI-DSS v4.0** | 78+ sub-requirements |
| **HIPAA** | Security Rule (45 CFR 160, 162, 164) |
| **ISO 27001:2022** | 93 controls, 14 domains |
| **SOC 2** | Trust Service Criteria |
| **GDPR** | Article 32 technical measures |
| **CIS Controls v8** | 18 controls, 153 safeguards |
| **NIST CSF** | Cybersecurity Framework |

### 6. Microsoft Administration

Microsoft 365 and Azure resource management.

| Feature | Description |
|---------|-------------|
| **User Management** | Create, modify, license |
| **Group Administration** | Security, distribution, M365 |
| **License Tracking** | Usage, assignments, costs |
| **Azure Canvas** | Resource visualization |
| **Conditional Access** | Policy management |
| **Pricing Calculator** | MSP margin calculations |

### 7. KageForge - AI Manager

Multi-provider AI orchestration platform.

| Provider | Models |
|----------|--------|
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus |
| **OpenAI** | GPT-4o, GPT-4 Turbo |
| **Google** | Gemini Pro, Gemini Ultra |
| **Azure** | Azure OpenAI deployments |
| **Local** | Ollama, LM Studio |

**Features:**
- Automatic failover between providers
- Token usage tracking and budgets
- Custom prompt template library
- Self-configuration capabilities

### 8. Ticketing (ConnectWise)

PSA integration for service desk operations.

| Feature | Description |
|---------|-------------|
| **Queue Management** | Filter, sort, assign |
| **Time Entry** | Tracking with timesheet export |
| **SLA Monitoring** | Response/resolution tracking |
| **AI Drafts** | Suggested responses |
| **Escalation** | Workflow triggers |

### 9. Academy

Gamified training and certification platform.

| Feature | Description |
|---------|-------------|
| **Course Library** | Interactive modules |
| **Progress Tracking** | Completion, scores |
| **PBQ Generation** | AI-created questions |
| **Certification** | PDF certificates |
| **Rank System** | Genin → Chunin → Jonin |

### 10. MediaLoader

Global theming and media management.

| Feature | Description |
|---------|-------------|
| **Background Rotation** | Timed image/video cycling |
| **Hot Reload** | File system watch |
| **Format Support** | PNG, JPG, WebP, MP4, WebM |
| **Fallback System** | Gradient backgrounds |

### 11. KageChat

AI assistant integrated throughout the application.

| Feature | Description |
|---------|-------------|
| **Context Awareness** | Module-specific assistance |
| **Query History** | Searchable conversation log |
| **Follow-up Suggestions** | Contextual prompts |
| **Remediation Flows** | Structured workflows |

---

## Performance Specifications

| Metric | Target | Implementation |
|--------|--------|----------------|
| **Module Swap** | <100ms | React useTransition |
| **Memory (Dev)** | <500MB | Tree-shaking, lazy loading |
| **Memory (Prod)** | <400MB | Production optimizations |
| **Animation CPU** | <5% | requestAnimationFrame throttle |
| **3D Rendering** | 30fps | Three.js throttle |
| **Virtual Scroll** | 100k items | react-virtualized |
| **Echo Latency** | <100ms | xterm.js optimization |
| **Initial Load** | <3s | Code splitting |

---

## Installation

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10 (1903+) | Windows 11 |
| | macOS 10.15+ | macOS 14+ |
| | Ubuntu 20.04+ | Ubuntu 24.04 |
| **RAM** | 8 GB | 16 GB |
| **Storage** | 2 GB | 4 GB SSD |
| **Display** | 1280×720 | 1920×1080 |
| **Network** | Broadband | Gigabit |

### Pre-built Installers

| Platform | Installer | Size |
|----------|-----------|------|
| **Windows** | `NinjaToolkit-Setup-11.0.0.exe` | ~180 MB |
| **macOS** | `NinjaToolkit-11.0.0.dmg` | ~190 MB |
| **Linux** | `ninja-toolkit_11.0.0_amd64.deb` | ~170 MB |

### Enterprise Deployment

```powershell
# Silent install (GPO/Intune compatible)
NinjaToolkit-Setup-11.0.0.exe /S /D="C:\Program Files\NinjaToolkit"

# Silent uninstall
NinjaToolkit-Setup-11.0.0.exe /S /uninstall

# MSI deployment (alternate)
msiexec /i NinjaToolkit-11.0.0.msi /qn INSTALLDIR="C:\Program Files\NinjaToolkit"
```

### Build from Source

```bash
# Clone repository
git clone https://github.com/Rytual/NTK-DEV.git
cd NTK-DEV

# Install dependencies
npm install --legacy-peer-deps

# Development mode with hot reload
npm start

# Production build
npm run package

# Generate installers
npm run make
```

---

## Configuration

### Environment Variables

Create `.env` in the project root:

```ini
# ═══════════════════════════════════════════════════════════════════
# AI PROVIDER CONFIGURATION
# ═══════════════════════════════════════════════════════════════════
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# ═══════════════════════════════════════════════════════════════════
# MICROSOFT INTEGRATION
# ═══════════════════════════════════════════════════════════════════
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=...

# ═══════════════════════════════════════════════════════════════════
# CONNECTWISE PSA
# ═══════════════════════════════════════════════════════════════════
CONNECTWISE_API_URL=https://api-na.myconnectwise.net
CONNECTWISE_COMPANY_ID=yourcompany
CONNECTWISE_PUBLIC_KEY=...
CONNECTWISE_PRIVATE_KEY=...

# ═══════════════════════════════════════════════════════════════════
# APPLICATION SETTINGS
# ═══════════════════════════════════════════════════════════════════
PORT=3001
NODE_ENV=production
LOG_LEVEL=info
```

### Media Assets

Place custom backgrounds in the `/art` directory:

```
art/
├── images/          # PNG, JPG, WebP, SVG, GIF, BMP
│   ├── background-1.png
│   └── background-2.jpg
└── videos/          # MP4, WebM, MOV, AVI, MKV
    ├── ambient-1.mp4
    └── ambient-2.webm
```

Files are automatically detected and rotated during application use.

---

## Project Structure

```
ninja-toolkit/
├── src/
│   ├── main.ts                 # Electron main process (892 lines)
│   ├── preload.js              # IPC bridge (40+ channels)
│   ├── renderer/
│   │   ├── App.tsx             # Main React application
│   │   ├── main.tsx            # React bootstrap
│   │   └── index.css           # Tailwind v4 theme
│   ├── components/
│   │   ├── BladeNav/           # Navigation sidebar
│   │   ├── ContentRouter/      # Module lazy loading
│   │   ├── KageChat/           # AI assistant panel
│   │   ├── Splash/             # Loading screen
│   │   └── ui/                 # Component library
│   ├── modules/
│   │   ├── ninjashark/         # Packet capture
│   │   ├── powershell/         # Terminal
│   │   ├── putty/              # Remote access
│   │   ├── auvik/              # Network map
│   │   ├── security/           # Vulnerability scanning
│   │   ├── msadmin/            # Microsoft admin
│   │   ├── kageforge/          # AI management
│   │   ├── ticketing/          # ConnectWise
│   │   └── academy/            # Training
│   ├── backend/
│   │   ├── server.ts           # Express API
│   │   └── mediaLoaderBridge.js
│   └── types/                  # TypeScript definitions
├── art/                        # Media assets
├── assets/                     # Static assets
├── build/                      # Build configuration
├── scripts/                    # Build scripts
├── docs/                       # Documentation
│   ├── SESSION-LOG-*.md        # Development logs
│   ├── DEBUGGING-JOURNAL.md    # Issue tracking
│   ├── DEVELOPMENT-ROADMAP.md  # Phase planning
│   └── MODULE-DEPENDENCY-MATRIX.md
├── forge.config.cjs            # Electron Forge config
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind theme
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

---

## Security

### Security Architecture

| Layer | Implementation |
|-------|----------------|
| **Context Isolation** | Enabled (Electron best practice) |
| **Node Integration** | Disabled in renderer |
| **IPC Security** | Explicit channel allowlist |
| **Input Validation** | Server-side sanitization |
| **SQL Protection** | Prepared statements only |
| **Credential Storage** | OS keychain (keytar) |
| **Session Isolation** | Per-module sandboxing |

### Vulnerability Reporting

Report security vulnerabilities via private disclosure to the development team. Do not create public issues for security concerns.

---

## Development Status

### Current Phase: Foundation Complete

| Phase | Status | Progress |
|-------|--------|----------|
| **Phase 1: Foundation** | COMPLETE | 100% |
| **Phase 2: IPC Bridge** | NEXT | 0% |
| **Phase 3: Core Systems** | Pending | 0% |
| **Phase 4: Backend Bundling** | Pending | 0% |
| **Phase 5: Module Verification** | Pending | 0% |
| **Phase 6: UI Integration** | Pending | 0% |
| **Phase 7: Native Modules** | Pending | 0% |
| **Phase 8: Testing & QA** | Pending | 0% |
| **Phase 9: Production Build** | Pending | 0% |

### Recent Commits

| Commit | Description | Date |
|--------|-------------|------|
| `62cc213` | Merge feature/ui-rebuild to main | 2025-11-28 |
| `a5d283b` | Phase 1 foundation documentation | 2025-11-28 |
| `b428359` | Complete UI system rebuild (Tailwind v4) | 2025-11-28 |
| `16bcafb` | Initial commit: State preservation baseline | 2025-11-28 |

---

## Troubleshooting

### Common Issues

**Application fails to start**
```bash
# Clear build cache
rm -rf .vite node_modules/.vite

# Reinstall dependencies
npm ci --legacy-peer-deps

# Restart
npm start
```

**Native module compilation errors**
```bash
# Install Visual Studio Build Tools (Windows)
winget install Microsoft.VisualStudio.2022.BuildTools

# Rebuild native modules
npm run rebuild
```

**TypeScript errors**
```bash
npm run typecheck
```

### Log Locations

| Platform | Path |
|----------|------|
| **Windows** | `%APPDATA%\ninja-toolkit\logs` |
| **macOS** | `~/Library/Logs/ninja-toolkit` |
| **Linux** | `~/.config/ninja-toolkit/logs` |

---

## Contributing

1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable release |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `release/*` | Release candidates |

---

## License

**Proprietary** - All rights reserved.

This software is confidential and proprietary. Unauthorized copying, distribution, or use is strictly prohibited.

---

## Support

| Resource | Location |
|----------|----------|
| **Documentation** | `docs/` directory |
| **Issue Tracking** | `docs/DEBUGGING-JOURNAL.md` |
| **Development Roadmap** | `docs/DEVELOPMENT-ROADMAP.md` |
| **Module Dependencies** | `docs/MODULE-DEPENDENCY-MATRIX.md` |

---

<p align="center">
  <strong>Ninja Toolkit v11</strong>
  <br>
  <em>Unified IT Management for Modern MSPs</em>
  <br><br>
  Built with Electron • React • TypeScript • Tailwind CSS
</p>
