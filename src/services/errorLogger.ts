/**
 * Error Logging Service
 * Provides centralized error logging with support for different environments
 * Can be extended to send errors to external services like Sentry, LogRocket, etc.
 */

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorLog {
  timestamp: string;
  error: Error | string;
  context?: ErrorContext;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

type LogLevel = 'error' | 'warn' | 'info';

class ErrorLogger {
  private isProduction: boolean;
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  constructor() {
    this.isProduction = import.meta.env.MODE === 'production';
  }

  /**
   * Log an error with context
   */
  logError(error: Error | string, context?: ErrorContext, level: LogLevel = 'error'): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      error,
      context,
      stackTrace: error instanceof Error ? error.stack : undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to in-memory logs
    this.logs.push(errorLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Log to console in development
    if (!this.isProduction) {
      this.logToConsole(errorLog, level);
    }

    // In production, you would send to an external service
    if (this.isProduction) {
      this.sendToService(errorLog, level);
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(errorLog: ErrorLog, level: LogLevel): void {
    const message = errorLog.error instanceof Error ? errorLog.error.message : errorLog.error;

    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

    consoleMethod(
      `[${level.toUpperCase()}] ${errorLog.timestamp}:`,
      message,
      errorLog.context ? `\nContext:` : '',
      errorLog.context || '',
      errorLog.stackTrace ? `\nStack:` : '',
      errorLog.stackTrace || ''
    );
  }

  /**
   * Send error to external logging service
   * This is a placeholder - implement actual service integration here
   */
  private sendToService(errorLog: ErrorLog, level: LogLevel): void {
    // Example: Send to Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureException(errorLog.error, {
    //     level,
    //     contexts: {
    //       custom: errorLog.context,
    //     },
    //   });
    // }

    // Example: Send to custom API endpoint
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ...errorLog, level }),
    // }).catch(console.error);

    // For now, just log to console in production too (level included for future use)
    console.error(`[Error Logger - ${level.toUpperCase()}]`, errorLog);
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: ErrorContext): void {
    this.logError(message, context, 'warn');
  }

  /**
   * Log info
   */
  logInfo(message: string, context?: ErrorContext): void {
    this.logError(message, context, 'info');
  }

  /**
   * Get recent logs (for debugging or admin panel)
   */
  getRecentLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Log API error with details
   */
  logAPIError(
    endpoint: string,
    method: string,
    statusCode?: number,
    error?: Error | string,
    context?: ErrorContext
  ): void {
    const apiContext: ErrorContext = {
      ...context,
      action: `API ${method} ${endpoint}`,
      additionalData: {
        ...context?.additionalData,
        endpoint,
        method,
        statusCode,
      },
    };

    this.logError(error || `API Error: ${statusCode} ${endpoint}`, apiContext);
  }

  /**
   * Log authentication error
   */
  logAuthError(action: string, error: Error | string, email?: string): void {
    this.logError(error, {
      action: `Auth: ${action}`,
      userEmail: email,
    });
  }

  /**
   * Log navigation/routing error
   */
  logNavigationError(route: string, error: Error | string): void {
    this.logError(error, {
      action: `Navigation to ${route}`,
      additionalData: { route },
    });
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Export convenience functions
export const logError = (error: Error | string, context?: ErrorContext) =>
  errorLogger.logError(error, context);

export const logWarning = (message: string, context?: ErrorContext) =>
  errorLogger.logWarning(message, context);

export const logInfo = (message: string, context?: ErrorContext) =>
  errorLogger.logInfo(message, context);

export const logAPIError = (
  endpoint: string,
  method: string,
  statusCode?: number,
  error?: Error | string,
  context?: ErrorContext
) => errorLogger.logAPIError(endpoint, method, statusCode, error, context);

export const logAuthError = (action: string, error: Error | string, email?: string) =>
  errorLogger.logAuthError(action, error, email);
