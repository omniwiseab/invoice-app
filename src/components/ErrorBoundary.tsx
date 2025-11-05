import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { errorLogger } from '../services/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log error to error logging service
    errorLogger.logError(error, {
      component: 'ErrorBoundary',
      additionalData: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: 'var(--gray-50)',
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '40px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              color: 'var(--error)',
            }}>
              <AlertCircle size={32} />
              <h1 style={{ margin: 0, fontSize: '24px' }}>Something went wrong</h1>
            </div>

            <p style={{
              color: 'var(--gray-700)',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}>
              We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
            </p>

            {this.state.error && (
              <details style={{
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: 'var(--gray-100)',
                borderRadius: '4px',
                fontSize: '14px',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                  Error Details
                </summary>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: 'var(--gray-800)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  <p><strong>Error:</strong> {this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <p><strong>Stack trace:</strong> {this.state.errorInfo.componentStack}</p>
                  )}
                </div>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
