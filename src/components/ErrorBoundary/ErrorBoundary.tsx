/**
 * ErrorBoundary - Enterprise-grade React error boundary
 *
 * Catches JavaScript errors anywhere in child component tree,
 * logs them, and displays a fallback UI instead of crashing.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, moduleName } = this.props;

    // Log to console
    console.error(`[ErrorBoundary${moduleName ? `:${moduleName}` : ''}] Caught error:`, error);
    console.error('Component stack:', errorInfo.componentStack);

    // Store error info
    this.setState({ errorInfo });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to main process for centralized logging
    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('system:logError', {
        type: 'react-error',
        module: moduleName || 'unknown',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      }).catch(console.error);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, moduleName } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Something went wrong</h2>
            {moduleName && (
              <p style={styles.module}>Module: {moduleName}</p>
            )}
            <p style={styles.message}>
              {error?.message || 'An unexpected error occurred'}
            </p>
            <div style={styles.actions}>
              <button style={styles.retryButton} onClick={this.handleRetry}>
                Try Again
              </button>
              <button
                style={styles.reloadButton}
                onClick={() => window.location.reload()}
              >
                Reload Application
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && error?.stack && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.stack}>{error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '40px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '12px',
    margin: '20px'
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: '8px'
  },
  module: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '16px'
  },
  message: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  retryButton: {
    padding: '12px 24px',
    background: 'linear-gradient(90deg, #4a9eff 0%, #667eea 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  reloadButton: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer'
  },
  details: {
    textAlign: 'left',
    marginTop: '20px'
  },
  summary: {
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px'
  },
  stack: {
    marginTop: '12px',
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    color: '#ef4444',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};

export default ErrorBoundary;
