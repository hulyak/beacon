'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string; // Context for better error reporting (e.g., 'voice-interaction', 'api-call')
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

// Error reporting service interface
interface ErrorReport {
  error: Error;
  errorInfo: ErrorInfo;
  context?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private errorReportingEnabled = process.env.NODE_ENV === 'production';

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error(`Beacon Error Boundary caught an error in ${this.props.context || 'unknown context'}:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo): void => {
    if (!this.errorReportingEnabled) {
      return;
    }

    const errorReport: ErrorReport = {
      error,
      errorInfo,
      context: this.props.context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.generateSessionId(),
    };

    // In production, send to error reporting service
    // For now, we'll store in localStorage for debugging
    try {
      const existingReports = JSON.parse(localStorage.getItem('voiceops_error_reports') || '[]');
      existingReports.push({
        ...errorReport,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
      });
      
      // Keep only last 10 error reports
      if (existingReports.length > 10) {
        existingReports.splice(0, existingReports.length - 10);
      }
      
      localStorage.setItem('voiceops_error_reports', JSON.stringify(existingReports));
    } catch (storageError) {
      console.error('Failed to store error report:', storageError);
    }

    // TODO: In production, send to external error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  private generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  handleRetry = (): void => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount <= this.maxRetries) {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        retryCount: newRetryCount
      });
    } else {
      // Max retries reached, show permanent error state
      console.warn('Max retries reached for error boundary');
    }
  };

  handleReset = (): void => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: 0
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const contextMessage = this.getContextualErrorMessage();

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-red-800 rounded-full mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold text-red-300 mb-2">
                {this.props.context ? `${this.props.context} Error` : 'Something went wrong'}
              </h2>
              
              <p className="text-red-200 text-sm mb-4">
                {contextMessage}
              </p>

              {/* Retry count indicator */}
              {this.state.retryCount > 0 && (
                <p className="text-red-300 text-xs mb-4">
                  Retry attempt: {this.state.retryCount}/{this.maxRetries}
                </p>
              )}

              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-red-950 rounded p-3 mb-4 text-xs">
                  <summary className="cursor-pointer text-red-300 font-medium mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-red-200 font-mono whitespace-pre-wrap break-all">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.error.stack && (
                      <div className="mb-2">
                        <strong>Stack:</strong> {this.state.error.stack}
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong> {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-red-700 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </button>
                )}
                
                <button
                  onClick={this.handleReset}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Reset Component
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>

            {/* Contextual troubleshooting tips */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300">
              <h3 className="font-medium text-white mb-2">Troubleshooting Tips:</h3>
              <ul className="text-left space-y-1 text-xs">
                {this.getTroubleshootingTips().map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getContextualErrorMessage = (): string => {
    const context = this.props.context;
    const errorMessage = this.state.error?.message || '';

    if (context === 'voice-interaction') {
      return 'Beacon encountered an error with voice processing. This might be due to microphone issues, network problems, or ElevenLabs service unavailability.';
    } else if (context === 'api-call') {
      return 'Beacon encountered an error communicating with backend services. This might be due to network issues or service unavailability.';
    } else if (context === 'ui-component') {
      return 'Beacon encountered an error rendering the user interface. This might be due to invalid data or component issues.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Beacon encountered a network error. Please check your internet connection and try again.';
    } else if (errorMessage.includes('permission') || errorMessage.includes('microphone')) {
      return 'Beacon encountered a microphone permission error. Please enable microphone access and try again.';
    }

    return 'Beacon encountered an unexpected error. This might be due to a voice service issue or network problem.';
  };

  private getTroubleshootingTips = (): string[] => {
    const context = this.props.context;
    const baseTips = [
      'Check your internet connection',
      'Try refreshing the page',
    ];

    if (context === 'voice-interaction') {
      return [
        ...baseTips,
        'Ensure microphone permissions are enabled',
        'Check if ElevenLabs services are available',
        'Try using text mode as a fallback',
      ];
    } else if (context === 'api-call') {
      return [
        ...baseTips,
        'Check if Google Cloud services are available',
        'Verify API endpoints are accessible',
        'Try again in a few moments',
      ];
    }

    return [
      ...baseTips,
      'Ensure microphone permissions are enabled',
      'Check if ElevenLabs services are available',
    ];
  };
}

// Hook version for functional components
export function useErrorHandler(context?: string) {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error(`Beacon Error in ${context || 'unknown context'}:`, error, errorInfo);
    
    // Create error report
    const errorReport: ErrorReport = {
      error,
      errorInfo: errorInfo || { componentStack: '' },
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Store error report in localStorage for debugging
    try {
      const existingReports = JSON.parse(localStorage.getItem('voiceops_error_reports') || '[]');
      existingReports.push({
        ...errorReport,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      
      // Keep only last 10 error reports
      if (existingReports.length > 10) {
        existingReports.splice(0, existingReports.length - 10);
      }
      
      localStorage.setItem('voiceops_error_reports', JSON.stringify(existingReports));
    } catch (storageError) {
      console.error('Failed to store error report:', storageError);
    }

    // In production, send to error reporting service
    // TODO: Implement external error reporting
  };

  const clearErrorReports = () => {
    try {
      localStorage.removeItem('voiceops_error_reports');
    } catch (error) {
      console.error('Failed to clear error reports:', error);
    }
  };

  const getErrorReports = () => {
    try {
      return JSON.parse(localStorage.getItem('voiceops_error_reports') || '[]');
    } catch (error) {
      console.error('Failed to get error reports:', error);
      return [];
    }
  };

  return { handleError, clearErrorReports, getErrorReports };
}

// Higher-order component version
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  context?: string
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} context={context}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different contexts
export const VoiceErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ErrorBoundary context="voice-interaction" fallback={fallback}>
    {children}
  </ErrorBoundary>
);

export const ApiErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ErrorBoundary context="api-call" fallback={fallback}>
    {children}
  </ErrorBoundary>
);

export const UIErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ErrorBoundary context="ui-component" fallback={fallback}>
    {children}
  </ErrorBoundary>
);

// Error recovery utilities
export const ErrorRecoveryUtils = {
  // Check if error is recoverable
  isRecoverable: (error: Error): boolean => {
    const recoverableErrors = [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'NotAllowedError', // Microphone permission
    ];
    
    return recoverableErrors.some(type => 
      error.name.includes(type) || error.message.includes(type.toLowerCase())
    );
  },

  // Get recovery suggestions based on error type
  getRecoverySuggestions: (error: Error): string[] => {
    if (error.message.includes('microphone') || error.message.includes('permission')) {
      return [
        'Enable microphone permissions in your browser',
        'Check browser settings for microphone access',
        'Try using text mode as an alternative',
      ];
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return [
        'Check your internet connection',
        'Try again in a few moments',
        'Verify that services are available',
      ];
    }
    
    if (error.message.includes('elevenlabs') || error.message.includes('voice')) {
      return [
        'Check ElevenLabs service status',
        'Try using text mode as a fallback',
        'Verify voice service configuration',
      ];
    }
    
    return [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists',
    ];
  },

  // Create user-friendly error message
  getUserFriendlyMessage: (error: Error): string => {
    if (error.message.includes('microphone') || error.message.includes('permission')) {
      return 'Microphone access is required for voice features. Please enable microphone permissions.';
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Unable to connect to Beacon services. Please check your internet connection.';
    }
    
    if (error.message.includes('elevenlabs') || error.message.includes('voice')) {
      return 'Voice services are currently unavailable. You can use text mode as an alternative.';
    }
    
    return 'An unexpected error occurred. Please try again or contact support.';
  },
};