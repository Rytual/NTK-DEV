# Ninja Toolkit v11

**Enterprise MSP Management Suite**

A comprehensive desktop application for Managed Service Providers (MSPs) that unifies network monitoring, security scanning, remote access, ticketing, and AI-powered automation into a single integrated platform.

---

## Overview

Ninja Toolkit v11 is a professional-grade IT management solution designed for MSP technicians and IT administrators. Built on modern web technologies within a native desktop shell, it provides a cohesive workflow for daily IT operations without context-switching between multiple applications.

### Key Capabilities

- **Network Analysis**: Real-time packet capture and protocol analysis
- **Terminal Emulation**: PowerShell and SSH/Telnet sessions with session persistence
- **Infrastructure Monitoring**: Network topology mapping and device discovery
- **Security Operations**: Vulnerability scanning and threat detection
- **Cloud Administration**: Microsoft 365 and Azure resource management
- **AI Automation**: Multi-provider AI integration for task automation
- **Ticket Management**: ConnectWise PSA integration for service desk operations
- **Training Platform**: Built-in certification and training module

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Electron | 39.2.4 |
| UI Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build System | Vite | 7.2.4 |
| Packaging | Electron Forge | 7.4.0 |
| Styling | Tailwind CSS | 4.0.17 |
| Animation | Framer Motion | 11.15.0 |
| Backend | Express | 4.21.2 |
| Platform | Windows, macOS, Linux | - |

### Architecture

The application follows a 3-pane layout architecture optimized for IT workflows:

```
+------------------+---------------------------+------------------+
|                  |                           |                  |
|    Navigation    |      Module Content       |    AI Assistant  |
|    (Collapsible) |      (Lazy-loaded)        |    (Collapsible) |
|                  |                           |                  |
+------------------+---------------------------+------------------+
|                         Status Bar                              |
+----------------------------------------------------------------+
```

---

## Modules

### 1. NinjaShark - Network Analysis
Packet capture and analysis engine for network troubleshooting and security investigation.
- Live packet capture with configurable filters
- Protocol decode (TCP, UDP, HTTP, DNS, etc.)
- Session reconstruction and flow analysis
- Export to PCAP format

### 2. PowerShell Terminal
Integrated PowerShell terminal with enhanced features for IT administration.
- Multi-tab terminal sessions
- Command history with search
- Script snippet library
- Output formatting and export

### 3. Remote Access (PuTTY)
SSH and Telnet client for remote device management.
- Session manager with saved connections
- Key-based authentication support
- Serial console support
- Session logging

### 4. Network Map (Auvik)
Infrastructure monitoring and network topology visualization.
- Automated network discovery
- Device inventory management
- Performance monitoring
- Alert management

### 5. Security Suite
Vulnerability scanning and security posture assessment.
- Port scanning and service detection
- Vulnerability assessment
- Compliance checking
- Security reporting

### 6. Microsoft Administration
Microsoft 365 and Azure administration interface.
- User and group management
- License administration
- Azure resource monitoring
- Conditional access policies

### 7. KageForge - AI Manager
Multi-provider AI integration for automation and assistance.
- Provider configuration (OpenAI, Anthropic, Azure, Google, Local)
- Token usage tracking
- Custom prompt templates
- API key management

### 8. Ticketing
ConnectWise PSA integration for service desk operations.
- Ticket queue management
- Time entry tracking
- SLA monitoring
- Customer communication

### 9. Academy
Training and certification platform for team development.
- Interactive training modules
- Progress tracking
- Certification management
- Knowledge base integration

### 10. MediaLoader
Global media management system for application theming.
- Dynamic background system
- Image and video rotation
- Hot-reload on file changes
- Gradient fallback system

### 11. KageChat
AI-powered assistant integrated throughout the application.
- Context-aware responses
- Module-specific assistance
- Query history
- Follow-up suggestions

---

## System Requirements

### Minimum Requirements
| Component | Requirement |
|-----------|-------------|
| OS | Windows 10 (1903+), macOS 10.15+, Ubuntu 20.04+ |
| RAM | 8 GB |
| Storage | 2 GB available |
| Display | 1280 x 720 |
| Network | Broadband connection |

### Recommended Requirements
| Component | Requirement |
|-----------|-------------|
| OS | Windows 11, macOS 14+, Ubuntu 24.04 |
| RAM | 16 GB |
| Storage | 4 GB SSD |
| Display | 1920 x 1080 |
| Network | Gigabit connection |

### Runtime Dependencies
- Node.js 24.x (for development)
- .NET 6.0+ (for auto-updater on Windows)
- Visual C++ Redistributable 2019+ (Windows)

---

## Installation

### Pre-built Installer (Recommended)

Download the latest installer from the Releases page:
- **Windows**: `NinjaToolkit-Setup-11.0.0.exe`
- **macOS**: `NinjaToolkit-11.0.0.dmg`
- **Linux**: `ninja-toolkit_11.0.0_amd64.deb`

### Silent Installation (Enterprise Deployment)

```powershell
# Windows - Silent install with GPO/Intune support
NinjaToolkit-Setup-11.0.0.exe /S /D=C:\Program Files\NinjaToolkit

# Uninstall
NinjaToolkit-Setup-11.0.0.exe /S /uninstall
```

### Build from Source

```bash
# Clone repository
git clone https://github.com/Rytual/NTK-DEV.git
cd NTK-DEV

# Install dependencies
npm install --legacy-peer-deps

# Development mode
npm start

# Build installer
npm run make
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```ini
# AI Provider Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Microsoft Integration
AZURE_CLIENT_ID=...
AZURE_TENANT_ID=...
AZURE_CLIENT_SECRET=...

# ConnectWise Integration
CONNECTWISE_API_URL=https://api-na.myconnectwise.net
CONNECTWISE_COMPANY_ID=...
CONNECTWISE_PUBLIC_KEY=...
CONNECTWISE_PRIVATE_KEY=...

# Application Settings
PORT=3001
NODE_ENV=production
```

### Media Assets

Place custom background images and videos in the `/art` directory:

```
art/
├── images/    # PNG, JPG, WebP, SVG, GIF, BMP
└── videos/    # MP4, WebM, MOV, AVI, MKV
```

Files are automatically detected and rotated during application use.

---

## Development

### Project Structure

```
ninja-toolkit/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.js           # IPC bridge
│   ├── renderer/            # React application
│   ├── components/          # Shared UI components
│   ├── modules/             # Feature modules
│   ├── backend/             # Express server
│   └── types/               # TypeScript definitions
├── art/                     # Media assets
├── assets/                  # Static assets
├── build/                   # Build configuration
├── scripts/                 # Build scripts
└── docs/                    # Documentation
```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Launch in development mode |
| `npm run backend` | Start backend server |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint code analysis |
| `npm run package` | Create application package |
| `npm run make` | Build platform installers |

### Contributing

1. Create a feature branch from `main`
2. Implement changes with appropriate tests
3. Update documentation as needed
4. Submit pull request with detailed description

---

## Security

### Security Features
- Context isolation enabled
- Node integration disabled in renderer
- Input sanitization on all API endpoints
- SQL injection protection via prepared statements
- Encrypted credential storage
- Session isolation

### Reporting Vulnerabilities

Report security vulnerabilities via private disclosure to the development team. Do not create public issues for security concerns.

---

## Performance

### Benchmarks

| Metric | Target | Typical |
|--------|--------|---------|
| Module switch | < 100ms | 40-80ms |
| Memory usage | < 500MB | 380-450MB |
| Animation CPU | < 5% | 3-4% |
| Initial load | < 3s | 2-2.5s |

### Optimization

- Lazy loading for all modules
- Code splitting with manual chunks
- Virtual scrolling for large datasets
- Debounced API calls
- Connection pooling

---

## Troubleshooting

### Common Issues

**Application fails to start**
```bash
# Clear Vite cache
rm -rf .vite node_modules/.vite

# Reinstall dependencies
npm ci --legacy-peer-deps

# Start application
npm start
```

**Native module errors**
```bash
# Rebuild native modules for current platform
npm run rebuild
```

**TypeScript errors**
```bash
# Run type check to identify issues
npm run typecheck
```

### Logs

Application logs are stored in:
- **Windows**: `%APPDATA%\ninja-toolkit\logs`
- **macOS**: `~/Library/Logs/ninja-toolkit`
- **Linux**: `~/.config/ninja-toolkit/logs`

---

## License

Proprietary - All rights reserved.

This software is confidential and proprietary. Unauthorized copying, distribution, or use is strictly prohibited.

---

## Support

For technical support and inquiries:
- Review the `docs/` directory for detailed documentation
- Check `docs/DEBUGGING-JOURNAL.md` for known issues
- Contact the development team for enterprise support

---

**Ninja Toolkit v11** - Unified IT Management for Modern MSPs
