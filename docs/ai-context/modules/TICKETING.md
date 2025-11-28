# Ticketing Module - AI Context Documentation

## Module Overview

**Ticketing Module** provides ConnectWise PSA integration for IT service management with ticket tracking, priority management, and workflow automation.

### Core Purpose
- ConnectWise PSA ticket management
- IT service desk operations
- Ticket creation and tracking
- Priority and SLA management

---

## File Structure

```
src/pages/Ticketing.tsx       # Main frontend component (474 lines)
```

*Note: Ticketing is primarily a frontend module designed for ConnectWise PSA API integration.*

---

## Frontend Component

### Ticketing (pages/Ticketing.tsx)

**Key Features**:
- Ticket list with filtering
- Priority and status badges
- Company and assignee tracking
- Ticket detail panel
- Statistics overview

**Ticket Types**:
```typescript
type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
type TicketType = 'incident' | 'service_request' | 'problem' | 'change';
```

**Ticket Object Structure**:
```typescript
interface TicketItem {
  id: string;
  number: string;           // TKT-001234
  summary: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  company: string;
  contact: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  notes: number;
  attachments: number;
}
```

**UI Components**:

| Component | Purpose |
|-----------|---------|
| `TicketStats` | Statistics cards (open, critical, overdue, resolved) |
| `TicketRow` | Table row with ticket summary |
| `TicketDetails` | Full ticket information panel |
| `StatusBadge` | Color-coded status indicator |
| `PriorityIcon` | Priority arrow indicator |

**State Management**:
```typescript
const [tickets] = useState<TicketItem[]>(mockTickets);
const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [filterStatus, setFilterStatus] = useState<string>('all');
```

---

## Statistics Display

**Dashboard Cards**:
```typescript
const stats = {
  open: tickets.filter(t => ['new', 'in_progress', 'waiting'].includes(t.status)).length,
  critical: tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length,
  overdue: /* calculated from dueDate */,
  resolved: tickets.filter(t => t.status === 'resolved').length,
};
```

**Visual Indicators**:
- Critical count: Red border on card
- Overdue count: Yellow border on card
- Icons: Circle, AlertCircle, Clock, CheckCircle2

---

## Status Workflow

```
new → in_progress → waiting → resolved → closed
          ↓            ↓
       waiting    in_progress
```

**Status Colors**:
- New: Info (blue)
- In Progress: Warning (yellow)
- Waiting: Secondary (gray)
- Resolved: Success (green)
- Closed: Default (muted)

---

## Priority Levels

| Priority | Icon | Color | SLA Typical |
|----------|------|-------|-------------|
| Critical | ↑ | Red | < 1 hour |
| High | ↑ | Yellow | < 4 hours |
| Medium | → | Blue | < 8 hours |
| Low | ↓ | Gray | < 24 hours |

---

## IPC Channels (Planned)

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `ticketing:getTickets` | Renderer → Main | `{filters}` | `Ticket[]` |
| `ticketing:getTicket` | Renderer → Main | `{id}` | `Ticket` |
| `ticketing:createTicket` | Renderer → Main | `{ticket}` | `Ticket` |
| `ticketing:updateTicket` | Renderer → Main | `{id, updates}` | `Ticket` |
| `ticketing:addNote` | Renderer → Main | `{ticketId, note}` | `Note` |
| `ticketing:sync` | Renderer → Main | none | `{synced, errors}` |

---

## ConnectWise PSA Integration

### API Configuration (Planned)
```javascript
const cwConfig = {
  companyId: 'yourcompany',
  publicKey: 'your-public-key',
  privateKey: 'your-private-key',
  clientId: 'your-client-id',
  siteUrl: 'api-na.myconnectwise.net'
};
```

### Ticket Sync
```javascript
// Fetch tickets from ConnectWise
async function fetchTickets(boardId, conditions) {
  // GET /service/tickets
  // ?conditions=board/id={boardId} and status/name not in ("Closed")
}

// Create ticket
async function createTicket(ticket) {
  // POST /service/tickets
}

// Update ticket
async function updateTicket(id, updates) {
  // PATCH /service/tickets/{id}
}

// Add note
async function addNote(ticketId, note) {
  // POST /service/tickets/{id}/notes
}
```

---

## Integration Points

### With KageChat
- AI-assisted ticket creation
- Natural language search
- Resolution suggestions

### With Remote Access
- Quick connect to affected systems
- Remote troubleshooting

### With Security
- Security incident tickets
- Vulnerability tracking

### With Azure
- M365 issue correlation
- Azure service health tickets

---

## Current State

### Implemented
- Full ticket list UI
- Status/priority filtering
- Search functionality
- Ticket detail panel
- Statistics dashboard
- Mock ticket data

### Placeholder/Mock
- ConnectWise API integration
- Real-time sync
- Ticket creation/editing
- Note management
- Attachment handling

---

## Backend Requirements (For Full Implementation)

### ConnectWise Service
```javascript
class ConnectWiseService {
  constructor(config) {}

  // Authentication
  async authenticate() {}

  // Tickets
  async getTickets(conditions) {}
  async createTicket(ticket) {}
  async updateTicket(id, updates) {}
  async deleteTicket(id) {}

  // Notes
  async getTicketNotes(ticketId) {}
  async addTicketNote(ticketId, note) {}

  // Attachments
  async getAttachments(ticketId) {}
  async uploadAttachment(ticketId, file) {}

  // Companies
  async getCompanies() {}
  async getContacts(companyId) {}

  // Boards
  async getBoards() {}
  async getBoardStatuses(boardId) {}
}
```

---

## Improvement Opportunities

1. **Real API Integration**: ConnectWise PSA REST API
2. **Time Tracking**: Built-in time entry
3. **SLA Monitoring**: Real-time SLA status
4. **Email Integration**: Ticket from email
5. **Templates**: Ticket templates for common issues
6. **Automation**: Auto-assign, auto-escalate rules
7. **Notifications**: Desktop/mobile push notifications
8. **Reporting**: Ticket analytics and reports
9. **Knowledge Base**: Link to KB articles
10. **Multi-board**: Support multiple service boards
