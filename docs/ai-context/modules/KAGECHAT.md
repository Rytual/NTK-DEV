# KageChat Module - AI Context Documentation

## Module Overview

**KageChat** is the AI assistant chat interface that leverages KageForge's multi-provider AI orchestration for natural language interactions, contextual help, and intelligent automation across all modules.

### Core Purpose
- Natural language AI assistant
- Contextual module assistance
- Cross-module task automation
- Intelligent help system

---

## File Structure

```
src/components/layout/ChatPanel.tsx    # Main chat panel component
src/contexts/                          # Chat context (if exists)
```

*Note: KageChat is a UI component that interfaces with KageForge backend.*

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    KageChat UI                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Message List                                      │  │
│  │  ├── User Message                                  │  │
│  │  ├── AI Response (streaming)                       │  │
│  │  ├── Context Cards                                 │  │
│  │  └── Action Buttons                                │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Input Area + Send Button                          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    KageForge                            │
│  Provider Router → OpenAI/Anthropic/Vertex/Grok/Copilot │
│  Token Tracker → Usage & Cost                           │
│  Cache Engine → Response Caching                        │
└─────────────────────────────────────────────────────────┘
```

---

## Features

### Chat Capabilities
- Streaming responses
- Markdown rendering
- Code syntax highlighting
- Copy/retry actions
- Conversation history
- Context awareness

### Module Integration
- Current module context injection
- Cross-module queries
- Action suggestions
- Task automation

---

## Message Types

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    provider?: string;
    model?: string;
    tokens?: number;
    cost?: number;
    latency?: number;
  };
}
```

---

## Context Injection

**System Prompt Template**:
```
You are KageChat, the AI assistant for Ninja Toolkit v11.

Current Module: {moduleName}
User Context: {userContext}
Available Actions: {moduleActions}

Guidelines:
- Provide concise, actionable responses
- Suggest module-specific actions when relevant
- Use technical terminology appropriate for MSP professionals
- Reference other modules when cross-functionality would help
```

**Module Contexts**:
```javascript
const moduleContexts = {
  Dashboard: 'Overview of all modules and system health',
  NinjaShark: 'Network packet capture and analysis',
  PowerShell: 'PowerShell terminal and scripting',
  RemoteAccess: 'SSH, Telnet, Serial connections',
  NetworkMap: 'Network topology and device inventory',
  Security: 'Vulnerability scanning and compliance',
  Azure: 'Microsoft 365 and Azure administration',
  AIManager: 'KageForge AI settings and monitoring',
  Ticketing: 'ConnectWise PSA ticket management',
  Academy: 'Microsoft certification training'
};
```

---

## IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `chat:send` | Renderer → Main | `{messages, context}` | Streaming response |
| `chat:getHistory` | Renderer → Main | `{conversationId}` | `Message[]` |
| `chat:clearHistory` | Renderer → Main | `{conversationId}` | `void` |
| `chat:getUsage` | Renderer → Main | none | `UsageStats` |

*Note: Chat uses KageForge channels (`kageforge:chat`, `kageforge:streamChat`) under the hood.*

---

## Use Cases

### Module Assistance
```
User: "How do I capture packets on a specific interface?"
AI: "In NinjaShark, you can:
1. Select the interface from the dropdown
2. Optionally set a BPF filter like 'port 80'
3. Click Start Capture

Would you like me to show you common filter examples?"
```

### Cross-Module Queries
```
User: "Find all devices with open port 22 and check for vulnerabilities"
AI: "I'll help you with that:
1. NetworkMap shows 5 devices with port 22 open
2. Would you like me to run a Security scan on those devices?

[Scan Now] [View Devices]"
```

### Task Automation
```
User: "Create a ticket for the server alert"
AI: "I'll prepare a ticket in Ticketing:
- Summary: Server alert detected
- Priority: High
- Details: [captured from context]

[Create Ticket] [Edit First]"
```

---

## Integration Points

### With All Modules
- Context-aware assistance
- Feature explanations
- Troubleshooting help

### With KageForge
- Provider selection
- Token tracking
- Response caching

### With Academy
- Exam question explanations
- Study assistance
- Topic deep-dives

---

## Current State

### Implemented
- Chat panel UI component
- KageForge integration
- Streaming responses
- Basic context injection

### Placeholder/Mock
- Full conversation persistence
- Cross-module actions
- Advanced context awareness

---

## UI Component (ChatPanel)

**Props**:
```typescript
interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}
```

**State**:
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [input, setInput] = useState('');
const [isStreaming, setIsStreaming] = useState(false);
```

**Layout**:
- Slide-out panel from right
- Header with close button
- Scrollable message list
- Fixed input at bottom

---

## Improvement Opportunities

1. **Persistent Conversations**: Save chat history to database
2. **Conversation Branching**: Fork conversations at any point
3. **File Attachments**: Upload files for analysis
4. **Voice Input**: Speech-to-text integration
5. **Quick Actions**: Predefined action buttons
6. **Templates**: Common query templates
7. **Export**: Export conversations
8. **Multi-conversation**: Parallel chat sessions
9. **@mentions**: Reference modules with @Module syntax
10. **Slash Commands**: /help, /clear, /switch module
