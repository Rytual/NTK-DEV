import * as React from 'react';
import {
  Activity,
  Shield,
  Server,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScrollArea } from '../components/ui/ScrollArea';
import { cn } from '../lib/utils';

// Stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  iconColor?: string;
}

function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <Card hover>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-foreground-muted">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change && (
              <p className={cn(
                'text-sm flex items-center gap-1',
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-danger',
                changeType === 'neutral' && 'text-foreground-muted'
              )}>
                <TrendingUp className={cn('h-3 w-3', changeType === 'negative' && 'rotate-180')} />
                {change}
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl bg-surface', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// System health component
function SystemHealth() {
  const metrics = [
    { label: 'CPU Usage', value: 42, icon: Cpu, color: 'text-primary' },
    { label: 'Memory', value: 67, icon: MemoryStick, color: 'text-warning' },
    { label: 'Disk I/O', value: 23, icon: HardDrive, color: 'text-success' },
    { label: 'Network', value: 89, icon: Wifi, color: 'text-info' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-foreground-muted">
                <metric.icon className={cn('h-4 w-4', metric.color)} />
                {metric.label}
              </span>
              <span className="font-medium">{metric.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  metric.value > 80 ? 'bg-danger' : metric.value > 60 ? 'bg-warning' : 'bg-primary'
                )}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Recent alerts component
function RecentAlerts() {
  const alerts = [
    { id: 1, type: 'warning', message: 'High memory usage detected on Server-03', time: '5m ago' },
    { id: 2, type: 'success', message: 'Security scan completed successfully', time: '12m ago' },
    { id: 3, type: 'danger', message: 'Failed login attempt from unknown IP', time: '23m ago' },
    { id: 4, type: 'info', message: 'New device discovered on network', time: '1h ago' },
    { id: 5, type: 'warning', message: 'SSL certificate expiring in 7 days', time: '2h ago' },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="h-4 w-4 text-danger" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-success" />;
      default: return <Activity className="h-4 w-4 text-info" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="divide-y divide-border">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-4 hover:bg-surface-hover transition-colors">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-foreground-muted flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Quick actions component
function QuickActions() {
  const actions = [
    { label: 'Run Security Scan', icon: Shield, color: 'bg-primary/10 text-primary hover:bg-primary/20' },
    { label: 'View Network Map', icon: Server, color: 'bg-info/10 text-info hover:bg-info/20' },
    { label: 'Manage Users', icon: Users, color: 'bg-success/10 text-success hover:bg-success/20' },
    { label: 'Check Tickets', icon: Activity, color: 'bg-warning/10 text-warning hover:bg-warning/20' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200',
                action.color
              )}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-xs font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Module status component
function ModuleStatus() {
  const modules = [
    { name: 'NinjaShark', status: 'partial', description: 'Packet capture' },
    { name: 'PowerShell', status: 'partial', description: 'Terminal' },
    { name: 'Security', status: 'active', description: 'Vuln scanning' },
    { name: 'MSAdmin', status: 'active', description: 'M365/Azure' },
    { name: 'Ticketing', status: 'active', description: 'ConnectWise' },
    { name: 'KageForge', status: 'partial', description: 'AI Providers' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Status</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {modules.map((module) => (
            <div key={module.name} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-sm">{module.name}</p>
                <p className="text-xs text-foreground-muted">{module.description}</p>
              </div>
              <Badge variant={module.status === 'active' ? 'success' : 'warning'}>
                {module.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Dashboard component
export default function Dashboard() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-foreground-muted">Welcome to Ninja Toolkit v11</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Devices"
            value={127}
            change="+12% from last week"
            changeType="positive"
            icon={Server}
            iconColor="text-primary"
          />
          <StatCard
            title="Open Tickets"
            value={23}
            change="-5 from yesterday"
            changeType="positive"
            icon={Activity}
            iconColor="text-warning"
          />
          <StatCard
            title="Security Alerts"
            value={3}
            change="2 critical"
            changeType="negative"
            icon={Shield}
            iconColor="text-danger"
          />
          <StatCard
            title="Active Users"
            value={48}
            change="12 online now"
            changeType="neutral"
            icon={Users}
            iconColor="text-success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <SystemHealth />
            <RecentAlerts />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <QuickActions />
            <ModuleStatus />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
