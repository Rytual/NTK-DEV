import * as React from 'react';
import {
  Bot,
  Sparkles,
  Settings,
  RefreshCw,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Activity,
  BarChart3,
  MessageSquare,
  Cpu,
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ScrollArea } from '../components/ui/ScrollArea';
import { cn } from '../lib/utils';

// Provider type
interface AIProvider {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  models: string[];
  tokensUsed: number;
  tokensLimit: number;
  costToDate: number;
  lastUsed?: string;
  features: string[];
}

// Usage stats type
interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
}

// Mock providers
const mockProviders: AIProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🤖',
    status: 'connected',
    models: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    tokensUsed: 1250000,
    tokensLimit: 5000000,
    costToDate: 37.50,
    lastUsed: '2 min ago',
    features: ['Chat', 'Code', 'Analysis', 'Vision']
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🧠',
    status: 'connected',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    tokensUsed: 890000,
    tokensLimit: 3000000,
    costToDate: 26.70,
    lastUsed: '15 min ago',
    features: ['Chat', 'Code', 'Images', 'Audio']
  },
  {
    id: 'google',
    name: 'Google Vertex',
    icon: '🌐',
    status: 'disconnected',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    tokensUsed: 0,
    tokensLimit: 2000000,
    costToDate: 0,
    features: ['Chat', 'Code', 'Vision', 'Multimodal']
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    icon: '🐙',
    status: 'connected',
    models: ['copilot-chat', 'copilot-code'],
    tokensUsed: 450000,
    tokensLimit: 1000000,
    costToDate: 19.00,
    lastUsed: '1 hour ago',
    features: ['Code', 'Chat', 'Completions']
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    icon: '✨',
    status: 'error',
    models: ['grok-2', 'grok-1'],
    tokensUsed: 0,
    tokensLimit: 1000000,
    costToDate: 0,
    features: ['Chat', 'Analysis']
  },
];

// Mock usage stats
const mockStats: UsageStats = {
  totalRequests: 15847,
  totalTokens: 2590000,
  totalCost: 83.20,
  averageLatency: 1.2,
};

// Stats overview
function StatsOverview({ stats }: { stats: UsageStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Total Requests</p>
              <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Tokens Used</p>
              <p className="text-2xl font-bold">{(stats.totalTokens / 1000000).toFixed(2)}M</p>
            </div>
            <Cpu className="h-8 w-8 text-info" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Total Cost</p>
              <p className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-success" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Avg Latency</p>
              <p className="text-2xl font-bold">{stats.averageLatency}s</p>
            </div>
            <Zap className="h-8 w-8 text-warning" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Provider card component
function ProviderCard({
  provider,
  onConfigure,
  onTest,
  isActive,
  onSetActive
}: {
  provider: AIProvider;
  onConfigure: () => void;
  onTest: () => void;
  isActive: boolean;
  onSetActive: () => void;
}) {
  const usagePercent = Math.round((provider.tokensUsed / provider.tokensLimit) * 100);

  const getStatusIcon = () => {
    switch (provider.status) {
      case 'connected': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'disconnected': return <XCircle className="h-4 w-4 text-foreground-muted" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-danger" />;
    }
  };

  const getStatusColor = () => {
    switch (provider.status) {
      case 'connected': return 'success';
      case 'disconnected': return 'secondary';
      case 'error': return 'danger';
    }
  };

  return (
    <Card className={cn(isActive && 'ring-2 ring-primary')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{provider.icon}</div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {provider.name}
                {isActive && <Badge variant="primary" className="text-xs">Active</Badge>}
              </CardTitle>
              <div className="flex items-center gap-1 mt-1">
                {getStatusIcon()}
                <Badge variant={getStatusColor() as any} className="text-xs">
                  {provider.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onConfigure}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Models */}
        <div>
          <p className="text-xs text-foreground-muted mb-2">Available Models</p>
          <div className="flex flex-wrap gap-1">
            {provider.models.map(model => (
              <Badge key={model} variant="secondary" className="text-xs">{model}</Badge>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <p className="text-xs text-foreground-muted mb-2">Features</p>
          <div className="flex flex-wrap gap-1">
            {provider.features.map(feature => (
              <Badge key={feature} variant="default" className="text-xs">{feature}</Badge>
            ))}
          </div>
        </div>

        {/* Usage */}
        {provider.status === 'connected' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">Token Usage</span>
              <span>{(provider.tokensUsed / 1000).toFixed(0)}K / {(provider.tokensLimit / 1000).toFixed(0)}K</span>
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
              <span className="text-foreground-muted">Cost to Date</span>
              <span className="font-medium">${provider.costToDate.toFixed(2)}</span>
            </div>
            {provider.lastUsed && (
              <div className="flex items-center gap-1 text-xs text-foreground-muted">
                <Clock className="h-3 w-3" />
                Last used: {provider.lastUsed}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {provider.status === 'connected' ? (
            <>
              <Button
                variant={isActive ? 'default' : 'outline'}
                className="flex-1"
                onClick={onSetActive}
                disabled={isActive}
              >
                {isActive ? 'Active' : 'Set as Default'}
              </Button>
              <Button variant="outline" onClick={onTest}>
                <Zap className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" className="flex-1" onClick={onConfigure}>
              <Key className="h-4 w-4 mr-2" />
              Configure
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Configuration modal (simplified inline version)
function ConfigPanel({
  provider,
  onClose
}: {
  provider: AIProvider | null;
  onClose: () => void;
}) {
  const [apiKey, setApiKey] = React.useState('');

  if (!provider) return null;

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{provider.icon}</span>
            Configure {provider.name}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          label="API Key"
          type="password"
          placeholder="Enter your API key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <div className="flex items-start gap-2 text-sm text-foreground-muted">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>API keys are stored securely in your local configuration file and are never transmitted.</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Usage chart (simplified)
function UsageChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [65, 45, 80, 55, 90, 35, 50];
  const max = Math.max(...values);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Weekly Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-40 gap-2">
          {days.map((day, i) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-surface rounded-t-sm overflow-hidden" style={{ height: '120px' }}>
                <div
                  className="w-full bg-primary/80 transition-all rounded-t-sm"
                  style={{
                    height: `${(values[i] / max) * 100}%`,
                    marginTop: `${100 - (values[i] / max) * 100}%`
                  }}
                />
              </div>
              <span className="text-xs text-foreground-muted">{day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main AIManager component
export default function AIManager() {
  const [providers] = React.useState<AIProvider[]>(mockProviders);
  const [stats] = React.useState<UsageStats>(mockStats);
  const [activeProvider, setActiveProvider] = React.useState('anthropic');
  const [configuring, setConfiguring] = React.useState<string | null>(null);

  const configuringProvider = providers.find(p => p.id === configuring) || null;

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-primary" />
                KageForge AI Manager
              </h1>
              <p className="text-foreground-muted">Multi-provider AI management and monitoring</p>
            </div>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Status
            </Button>
          </div>

          {/* Stats */}
          <StatsOverview stats={stats} />

          {/* Config Panel */}
          {configuring && (
            <ConfigPanel
              provider={configuringProvider}
              onClose={() => setConfiguring(null)}
            />
          )}

          {/* Providers Grid */}
          <div>
            <h2 className="text-lg font-bold mb-4">AI Providers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isActive={activeProvider === provider.id}
                  onSetActive={() => setActiveProvider(provider.id)}
                  onConfigure={() => setConfiguring(provider.id)}
                  onTest={() => console.log('Testing', provider.name)}
                />
              ))}
            </div>
          </div>

          {/* Usage Chart */}
          <UsageChart />
        </div>
      </ScrollArea>
    </div>
  );
}
