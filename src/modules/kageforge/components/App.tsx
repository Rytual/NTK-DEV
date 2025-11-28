/**
 * Kage Forge Main Application Component
 * @version 8.0.0
 */

import React, { useState, useEffect } from 'react';
import { ProviderRouter } from '../backend/provider-router';
import { TokenTracker } from '../backend/token-tracker';
import { CacheEngine } from '../backend/cache-engine';
import './App.css';

interface AppState {
  router: ProviderRouter | null;
  tracker: TokenTracker | null;
  cache: CacheEngine | null;
  stats: any;
  messages: Array<{ role: string; content: string }>;
  loading: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    router: null,
    tracker: null,
    cache: null,
    stats: null,
    messages: [],
    loading: false
  });

  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    initializeSystems();
  }, []);

  const initializeSystems = async () => {
    try {
      // Initialize router with all providers
      const router = new ProviderRouter({
        strategy: 'cost-based',
        enableFailover: true,
        enableLoadBalancing: true,
        enableCircuitBreaker: true,
        providers: {
          openai: { enabled: true },
          anthropic: { enabled: true },
          vertex: { enabled: true },
          grok: { enabled: true },
          copilot: { enabled: true }
        }
      });

      // Initialize token tracker
      const tracker = new TokenTracker({
        budgets: {
          daily: 100.00,
          monthly: 2000.00,
          alertThreshold: 0.8
        }
      });

      // Initialize cache
      const cache = new CacheEngine({
        memory: { maxSize: 500 },
        sqlite: { path: './cache.db' },
        similarity: { enabled: true, threshold: 0.85 }
      });

      setState(prev => ({ ...prev, router, tracker, cache }));

      // Set up event listeners
      router.on('request:complete', (event: any) => {
        console.log('Request completed:', event);
        updateStats();
      });

      tracker.on('alert', (alert: any) => {
        console.warn('Budget alert:', alert);
      });

    } catch (error) {
      console.error('Failed to initialize systems:', error);
    }
  };

  const updateStats = async () => {
    if (!state.router || !state.tracker) return;

    const routerStats = state.router.getStats();
    const trackerStats = state.tracker.getCurrentStats();
    const budgetStatus = state.tracker.getBudgetStatus();

    setState(prev => ({
      ...prev,
      stats: {
        router: routerStats,
        tracker: trackerStats,
        budget: budgetStatus
      }
    }));
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !state.router) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Add user message
      const userMessage = { role: 'user', content: input };
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));

      // Create chat completion
      const options: any = {
        messages: [...state.messages, userMessage],
        max_tokens: 500
      };

      if (selectedProvider !== 'auto') {
        options.provider = selectedProvider;
      }
      if (selectedModel) {
        options.model = selectedModel;
      }

      const result = await state.router.createChatCompletion(options);

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: result.message?.content || result.content || result.text || ''
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        loading: false
      }));

      // Track usage
      if (state.tracker) {
        state.tracker.trackUsage({
          provider: selectedProvider === 'auto' ? 'openai' : selectedProvider,
          model: result.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          cost: result.cost,
          latency: result.latency,
          success: true
        });
      }

      setInput('');
      updateStats();

    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleClearMessages = () => {
    setState(prev => ({ ...prev, messages: [] }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kage Forge - AI Manager</h1>
        <div className="version">v8.0.0</div>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <div className="provider-selector">
            <h3>Provider</h3>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <option value="auto">Auto (Cost-Based)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="vertex">Vertex AI</option>
              <option value="grok">Grok</option>
              <option value="copilot">Copilot 365</option>
            </select>
          </div>

          <div className="stats-panel">
            <h3>Statistics</h3>
            {state.stats && (
              <>
                <div className="stat-item">
                  <span>Total Requests:</span>
                  <span>{state.stats.router?.totalRequests || 0}</span>
                </div>
                <div className="stat-item">
                  <span>Success Rate:</span>
                  <span>{state.stats.router?.successRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="stat-item">
                  <span>Total Cost:</span>
                  <span>${state.stats.tracker?.total?.cost?.toFixed(4) || '0.0000'}</span>
                </div>
                <div className="stat-item">
                  <span>Daily Budget:</span>
                  <span>
                    ${state.stats.budget?.daily?.used?.toFixed(2) || '0.00'} /
                    ${state.stats.budget?.daily?.limit?.toFixed(2) || '100.00'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="chat-container">
          <div className="messages">
            {state.messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.role}`}>
                <div className="message-role">{msg.role}</div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {state.loading && (
              <div className="message message-loading">
                <div className="message-role">assistant</div>
                <div className="message-content">
                  <div className="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              disabled={state.loading}
            />
            <button onClick={handleSendMessage} disabled={state.loading}>
              Send
            </button>
            <button onClick={handleClearMessages} disabled={state.loading}>
              Clear
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
