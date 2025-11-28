import * as React from 'react';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { cn } from '../lib/utils';

// Ticket type
interface TicketItem {
  id: string;
  number: string;
  summary: string;
  description: string;
  status: 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'incident' | 'service_request' | 'problem' | 'change';
  company: string;
  contact: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  notes: number;
  attachments: number;
}

// Mock tickets
const mockTickets: TicketItem[] = [
  {
    id: '1', number: 'TKT-001234', summary: 'Email not syncing on mobile devices',
    description: 'Multiple users reporting that Outlook mobile app is not syncing emails since this morning.',
    status: 'in_progress', priority: 'high', type: 'incident',
    company: 'Acme Corp', contact: 'John Smith', assignee: 'Tech Support',
    createdAt: '2 hours ago', updatedAt: '30 min ago', dueDate: 'Today 5:00 PM',
    notes: 5, attachments: 2
  },
  {
    id: '2', number: 'TKT-001235', summary: 'New user account setup',
    description: 'Please create a new user account for Sarah Johnson who starts Monday.',
    status: 'new', priority: 'medium', type: 'service_request',
    company: 'TechStart Inc', contact: 'HR Department', assignee: undefined,
    createdAt: '4 hours ago', updatedAt: '4 hours ago', dueDate: 'Mon, Dec 2',
    notes: 1, attachments: 1
  },
  {
    id: '3', number: 'TKT-001236', summary: 'Server performance degradation',
    description: 'Production server showing high CPU usage and slow response times.',
    status: 'in_progress', priority: 'critical', type: 'incident',
    company: 'Global Finance', contact: 'IT Manager', assignee: 'Senior Tech',
    createdAt: '1 day ago', updatedAt: '1 hour ago', dueDate: 'ASAP',
    notes: 12, attachments: 4
  },
  {
    id: '4', number: 'TKT-001237', summary: 'Software license renewal',
    description: 'Annual renewal for Microsoft 365 licenses due next month.',
    status: 'waiting', priority: 'low', type: 'service_request',
    company: 'Acme Corp', contact: 'Finance Dept', assignee: 'Account Manager',
    createdAt: '3 days ago', updatedAt: '2 days ago', dueDate: 'Dec 15',
    notes: 3, attachments: 0
  },
  {
    id: '5', number: 'TKT-001238', summary: 'VPN connection issues',
    description: 'Remote workers unable to connect to VPN since firewall update.',
    status: 'resolved', priority: 'high', type: 'incident',
    company: 'TechStart Inc', contact: 'Mike Wilson', assignee: 'Network Admin',
    createdAt: '5 days ago', updatedAt: '1 day ago',
    notes: 8, attachments: 1
  },
];

// Priority icon component
function PriorityIcon({ priority }: { priority: TicketItem['priority'] }) {
  const iconClass = 'h-4 w-4';
  switch (priority) {
    case 'critical': return <ArrowUp className={cn(iconClass, 'text-danger')} />;
    case 'high': return <ArrowUp className={cn(iconClass, 'text-warning')} />;
    case 'medium': return <ArrowRight className={cn(iconClass, 'text-info')} />;
    case 'low': return <ArrowDown className={cn(iconClass, 'text-foreground-muted')} />;
  }
}

// Status badge component
function StatusBadge({ status }: { status: TicketItem['status'] }) {
  const variants: Record<string, any> = {
    new: 'info',
    in_progress: 'warning',
    waiting: 'secondary',
    resolved: 'success',
    closed: 'default'
  };

  const labels: Record<string, string> = {
    new: 'New',
    in_progress: 'In Progress',
    waiting: 'Waiting',
    resolved: 'Resolved',
    closed: 'Closed'
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

// Stats overview
function TicketStats({ tickets }: { tickets: TicketItem[] }) {
  const stats = {
    open: tickets.filter(t => ['new', 'in_progress', 'waiting'].includes(t.status)).length,
    critical: tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length,
    overdue: 1, // Mock value
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Open Tickets</p>
              <p className="text-2xl font-bold">{stats.open}</p>
            </div>
            <Circle className="h-8 w-8 text-info" />
          </div>
        </CardContent>
      </Card>

      <Card className={stats.critical > 0 ? 'border-danger/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Critical</p>
              <p className="text-2xl font-bold text-danger">{stats.critical}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-danger" />
          </div>
        </CardContent>
      </Card>

      <Card className={stats.overdue > 0 ? 'border-warning/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Overdue</p>
              <p className="text-2xl font-bold text-warning">{stats.overdue}</p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Resolved Today</p>
              <p className="text-2xl font-bold text-success">{stats.resolved}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Ticket row component
function TicketRow({ ticket, isSelected, onSelect }: {
  ticket: TicketItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={cn(
        'cursor-pointer transition-colors border-b border-border',
        isSelected ? 'bg-primary/5' : 'hover:bg-surface-hover'
      )}
      onClick={onSelect}
    >
      <td className="p-3">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={ticket.priority} />
          <span className="font-mono text-sm text-foreground-muted">{ticket.number}</span>
        </div>
      </td>
      <td className="p-3">
        <div>
          <p className="font-medium line-clamp-1">{ticket.summary}</p>
          <p className="text-sm text-foreground-muted line-clamp-1">{ticket.description}</p>
        </div>
      </td>
      <td className="p-3">
        <StatusBadge status={ticket.status} />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-foreground-muted" />
          <span className="text-sm">{ticket.company}</span>
        </div>
      </td>
      <td className="p-3">
        {ticket.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{ticket.assignee.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{ticket.assignee}</span>
          </div>
        ) : (
          <Badge variant="secondary">Unassigned</Badge>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3 text-foreground-muted">
          <span className="flex items-center gap-1 text-sm">
            <MessageSquare className="h-3 w-3" />
            {ticket.notes}
          </span>
          <span className="flex items-center gap-1 text-sm">
            <Paperclip className="h-3 w-3" />
            {ticket.attachments}
          </span>
        </div>
      </td>
      <td className="p-3 text-sm text-foreground-muted">{ticket.updatedAt}</td>
    </tr>
  );
}

// Ticket details panel
function TicketDetails({ ticket }: { ticket: TicketItem | null }) {
  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-muted">
        Select a ticket to view details
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <PriorityIcon priority={ticket.priority} />
            <span className="font-mono text-sm text-foreground-muted">{ticket.number}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <h2 className="text-lg font-bold">{ticket.summary}</h2>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-foreground-muted mb-1">Company</p>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-foreground-muted" />
              <span className="font-medium">{ticket.company}</span>
            </div>
          </div>
          <div>
            <p className="text-foreground-muted mb-1">Contact</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-foreground-muted" />
              <span className="font-medium">{ticket.contact}</span>
            </div>
          </div>
          <div>
            <p className="text-foreground-muted mb-1">Assignee</p>
            {ticket.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">{ticket.assignee.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{ticket.assignee}</span>
              </div>
            ) : (
              <Badge variant="secondary">Unassigned</Badge>
            )}
          </div>
          <div>
            <p className="text-foreground-muted mb-1">Due Date</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-foreground-muted" />
              <span className={cn('font-medium', ticket.dueDate === 'ASAP' && 'text-danger')}>
                {ticket.dueDate || 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-medium mb-2">Description</h3>
          <p className="text-sm text-foreground-muted">{ticket.description}</p>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="font-medium mb-2">Timeline</h3>
          <div className="space-y-3">
            <div className="flex gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p>Ticket updated</p>
                <p className="text-foreground-muted">{ticket.updatedAt}</p>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-surface-hover mt-1.5" />
              <div>
                <p>Ticket created</p>
                <p className="text-foreground-muted">{ticket.createdAt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Note
          </Button>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

// Main Ticketing component
export default function Ticketing() {
  const [tickets] = React.useState<TicketItem[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const selected = tickets.find(t => t.id === selectedTicket) || null;

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Ticket className="h-7 w-7 text-primary" />
                Ticketing
              </h1>
              <p className="text-foreground-muted">ConnectWise PSA ticket management</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>

          {/* Stats */}
          <TicketStats tickets={tickets} />

          {/* Ticket List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tickets</CardTitle>
                <div className="flex items-center gap-2">
                  <SearchInput
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <select
                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex">
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface border-b border-border">
                      <tr>
                        <th className="p-3 text-left font-medium text-foreground-muted w-32">Ticket</th>
                        <th className="p-3 text-left font-medium text-foreground-muted">Summary</th>
                        <th className="p-3 text-left font-medium text-foreground-muted w-28">Status</th>
                        <th className="p-3 text-left font-medium text-foreground-muted w-36">Company</th>
                        <th className="p-3 text-left font-medium text-foreground-muted w-36">Assignee</th>
                        <th className="p-3 text-left font-medium text-foreground-muted w-24">Activity</th>
                        <th className="p-3 text-left font-medium text-foreground-muted w-28">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map(ticket => (
                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          isSelected={selectedTicket === ticket.id}
                          onSelect={() => setSelectedTicket(ticket.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                  {filteredTickets.length === 0 && (
                    <div className="p-8 text-center text-foreground-muted">
                      No tickets found
                    </div>
                  )}
                </div>
                <div className="w-96 border-l border-border">
                  <TicketDetails ticket={selected} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
