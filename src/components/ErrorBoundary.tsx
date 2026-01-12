import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // AMBER Sovereign State: Graceful degradation with "Attention Degraded" message
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-[#0f172a] border border-[#d97706] rounded-lg p-6" style={{ boxShadow: '0 0 0 2px rgba(217, 119, 6, 0.2)' }}>
            <h1 className="text-2xl font-bold text-[#fbbf24] mb-2">Attention Degraded</h1>
            <p className="text-[#fbbf24] mb-1 text-sm font-mono">Status: AMBER</p>
            <p className="text-[#fbbf24] mb-4 text-sm">Sync Required</p>
            <p className="text-foreground mb-4 text-sm">
              System observation: Application error detected. Data processing interrupted.
            </p>
            {this.state.error && (
              <div className="bg-[#1e293b] border border-[#d97706]/50 rounded p-4 mb-4">
                <p className="text-sm font-mono text-[#fbbf24] mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer text-[#fbbf24] mb-2">Stack Trace</summary>
                    <pre className="overflow-auto max-h-64 mt-2">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#d97706] text-white rounded hover:bg-[#d97706]/80 font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

