import * as React from 'react';
import {
  Cloud,
  Users,
  CreditCard,
  Settings,
  Search,
  RefreshCw,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Building2,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { cn } from '../lib/utils';

// User type
interface M365User {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  status: 'active' | 'blocked' | 'inactive';
  licenses: string[];
  lastSignIn?: string;
  mfaEnabled: boolean;
}

// License type
interface License {
  id: string;
  name: string;
  total: number;
  assigned: number;
  costPerUser: number;
}

// Mock users
const mockUsers: M365User[] = [
  { id: '1', displayName: 'John Smith', email: 'john.smith@company.com', jobTitle: 'IT Manager', department: 'IT', status: 'active', licenses: ['M365 E3', 'Power BI Pro'], lastSignIn: '2 min ago', mfaEnabled: true },
  { id: '2', displayName: 'Sarah Johnson', email: 'sarah.johnson@company.com', jobTitle: 'Sales Director', department: 'Sales', status: 'active', licenses: ['M365 E5'], lastSignIn: '15 min ago', mfaEnabled: true },
  { id: '3', displayName: 'Mike Wilson', email: 'mike.wilson@company.com', jobTitle: 'Developer', department: 'Engineering', status: 'active', licenses: ['M365 E3', 'Azure DevOps'], lastSignIn: '1 hour ago', mfaEnabled: true },
  { id: '4', displayName: 'Emily Brown', email: 'emily.brown@company.com', jobTitle: 'HR Specialist', department: 'HR', status: 'blocked', licenses: ['M365 Business Basic'], lastSignIn: '3 days ago', mfaEnabled: false },
  { id: '5', displayName: 'David Lee', email: 'david.lee@company.com', jobTitle: 'Contractor', department: 'External', status: 'inactive', licenses: [], lastSignIn: '2 weeks ago', mfaEnabled: false },
];

// Mock licenses
const mockLicenses: License[] = [
  { id: '1', name: 'Microsoft 365 E5', total: 50, assigned: 42, costPerUser: 57 },
  { id: '2', name: 'Microsoft 365 E3', total: 100, assigned: 78, costPerUser: 36 },
  { id: '3', name: 'Microsoft 365 Business Basic', total: 25, assigned: 15, costPerUser: 6 },
  { id: '4', name: 'Power BI Pro', total: 20, assigned: 12, costPerUser: 10 },
  { id: '5', name: 'Azure DevOps Basic', total: 30, assigned: 8, costPerUser: 6 },
];

// Stats cards
function StatsOverview({ users, licenses }: { users: M365User[]; licenses: License[] }) {
  const activeUsers = users.filter(u => u.status === 'active').length;
  const mfaEnabled = users.filter(u => u.mfaEnabled).length;
  const totalLicenses = licenses.reduce((acc, l) => acc + l.total, 0);
  const assignedLicenses = licenses.reduce((acc, l) => acc + l.assigned, 0);
  const monthlyCost = licenses.reduce((acc, l) => acc + (l.assigned * l.costPerUser), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Active Users</p>
              <p className="text-2xl font-bold">{activeUsers}<span className="text-sm text-foreground-muted">/{users.length}</span></p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">MFA Enabled</p>
              <p className="text-2xl font-bold">{Math.round((mfaEnabled / users.length) * 100)}%</p>
            </div>
            <Shield className="h-8 w-8 text-success" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Licenses Used</p>
              <p className="text-2xl font-bold">{assignedLicenses}<span className="text-sm text-foreground-muted">/{totalLicenses}</span></p>
            </div>
            <CreditCard className="h-8 w-8 text-info" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Monthly Cost</p>
              <p className="text-2xl font-bold">${monthlyCost.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-warning" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// User row component
function UserRow({ user, onSelect, isSelected }: {
  user: M365User;
  onSelect: () => void;
  isSelected: boolean;
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
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{user.displayName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.displayName}</p>
            <p className="text-sm text-foreground-muted">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="p-3 text-sm">{user.jobTitle || '-'}</td>
      <td className="p-3 text-sm">{user.department || '-'}</td>
      <td className="p-3">
        <Badge
          variant={user.status === 'active' ? 'success' : user.status === 'blocked' ? 'danger' : 'secondary'}
        >
          {user.status}
        </Badge>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1">
          {user.licenses.slice(0, 2).map((license, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{license}</Badge>
          ))}
          {user.licenses.length > 2 && (
            <Badge variant="secondary" className="text-xs">+{user.licenses.length - 2}</Badge>
          )}
          {user.licenses.length === 0 && (
            <span className="text-sm text-foreground-muted">None</span>
          )}
        </div>
      </td>
      <td className="p-3">
        {user.mfaEnabled ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-warning" />
        )}
      </td>
      <td className="p-3 text-sm text-foreground-muted">{user.lastSignIn}</td>
    </tr>
  );
}

// User details panel
function UserDetails({ user }: { user: M365User | null }) {
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-muted">
        Select a user to view details
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-xl">{user.displayName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          <p className="text-foreground-muted">{user.email}</p>
          <Badge
            variant={user.status === 'active' ? 'success' : user.status === 'blocked' ? 'danger' : 'secondary'}
            className="mt-1"
          >
            {user.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {user.jobTitle && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-foreground-muted" />
            <span>{user.jobTitle}</span>
          </div>
        )}
        {user.department && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-foreground-muted" />
            <span>{user.department}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-foreground-muted" />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-foreground-muted" />
          <span>Last sign-in: {user.lastSignIn}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-foreground-muted" />
          <span>MFA: {user.mfaEnabled ? 'Enabled' : 'Disabled'}</span>
          {!user.mfaEnabled && <Badge variant="warning" className="text-xs">At Risk</Badge>}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Licenses</h3>
        {user.licenses.length > 0 ? (
          <div className="space-y-2">
            {user.licenses.map((license, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                <span className="text-sm">{license}</span>
                <Badge variant="secondary" className="text-xs">Assigned</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">No licenses assigned</p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1">
          <Settings className="h-4 w-4 mr-2" />
          Edit
        </Button>
        {user.status === 'active' ? (
          <Button variant="outline" className="flex-1 text-danger hover:text-danger">
            <UserX className="h-4 w-4 mr-2" />
            Block
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 text-success hover:text-success">
            <UserCheck className="h-4 w-4 mr-2" />
            Enable
          </Button>
        )}
      </div>
    </div>
  );
}

// License card component
function LicenseCard({ license }: { license: License }) {
  const usagePercent = Math.round((license.assigned / license.total) * 100);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium">{license.name}</h3>
            <p className="text-sm text-foreground-muted">${license.costPerUser}/user/month</p>
          </div>
          <Badge variant={usagePercent > 90 ? 'danger' : usagePercent > 70 ? 'warning' : 'success'}>
            {usagePercent}% used
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Assigned</span>
            <span>{license.assigned} / {license.total}</span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePercent > 90 ? 'bg-danger' : usagePercent > 70 ? 'bg-warning' : 'bg-primary'
              )}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">Monthly Cost</span>
            <span className="font-medium">${(license.assigned * license.costPerUser).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Azure component
export default function Azure() {
  const [users] = React.useState<M365User[]>(mockUsers);
  const [licenses] = React.useState<License[]>(mockLicenses);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'users' | 'licenses'>('users');
  const [isConnected, setIsConnected] = React.useState(true);

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selected = users.find(u => u.id === selectedUser) || null;

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Cloud className="h-7 w-7 text-primary" />
                Microsoft 365 Admin
              </h1>
              <p className="text-foreground-muted">User and license management</p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="danger" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Disconnected
                </Badge>
              )}
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Admin Portal
              </Button>
            </div>
          </div>

          {/* Stats */}
          <StatsOverview users={users} licenses={licenses} />

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            <button
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              )}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'licenses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              )}
              onClick={() => setActiveTab('licenses')}
            >
              Licenses
            </button>
          </div>

          {activeTab === 'users' ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Users</CardTitle>
                  <div className="flex items-center gap-2">
                    <SearchInput
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Button variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex">
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface border-b border-border">
                        <tr>
                          <th className="p-3 text-left font-medium text-foreground-muted">User</th>
                          <th className="p-3 text-left font-medium text-foreground-muted">Title</th>
                          <th className="p-3 text-left font-medium text-foreground-muted">Department</th>
                          <th className="p-3 text-left font-medium text-foreground-muted">Status</th>
                          <th className="p-3 text-left font-medium text-foreground-muted">Licenses</th>
                          <th className="p-3 text-left font-medium text-foreground-muted">MFA</th>
                          <th className="p-3 text-left font-medium text-foreground-muted">Last Sign-in</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <UserRow
                            key={user.id}
                            user={user}
                            isSelected={selectedUser === user.id}
                            onSelect={() => setSelectedUser(user.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="w-80 border-l border-border">
                    <UserDetails user={selected} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {licenses.map(license => (
                <LicenseCard key={license.id} license={license} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
