'use client';

import { useState, useEffect } from 'react';
import { getConnectionMonitor, getUserFriendlyErrorMessage, type NetworkError } from '@/lib/network-utils';
import { useApiClient } from '@/lib/api-client';

export interface NetworkStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function NetworkStatus({
  className = '',
  showDetails = false,
}: NetworkStatusProps): React.JSX.Element {
  const [isOnline, setIsOnline] = useState(true);
  const [lastError, setLastError] = useState<NetworkError | null>(null);
  const [showError, setShowError] = useState(false);
  const { client } = useApiClient();

  useEffect(() => {
    const connectionMonitor = getConnectionMonitor();
    
    const unsubscribe = connectionMonitor.subscribe((online) => {
      setIsOnline(online);
      if (online) {
        setLastError(null);
        setShowError(false);
      }
    });

    return unsubscribe;
  }, []);

  // Handle API errors
  const handleNetworkError = (error: NetworkError) => {
    setLastError(error);
    setShowError(true);
    
    // Auto-hide error after 10 seconds if recoverable
    if (error.isRetryable) {
      setTimeout(() => {
        setShowError(false);
      }, 10000);
    }
  };

  const dismissError = () => {
    setShowError(false);
  };

  const retryConnection = async () => {
    try {
      await client.healthCheck();
      setLastError(null);
      setShowError(false);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const getStatusColor = () => {
    if (!isOnline || (lastError && !lastError.isRetryable)) {
      return 'text-red-400';
    } else if (lastError && lastError.isRetryable) {
      return 'text-yellow-400';
    } else {
      return 'text-green-400';
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      );
    } else if (lastError && !lastError.isRetryable) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      );
    } else if (lastError && lastError.isRetryable) {
      return (
        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    } else if (lastError && !lastError.isRetryable) {
      return 'Service Error';
    } else if (lastError && lastError.isRetryable) {
      return 'Connection Issues';
    } else {
      return 'Online';
    }
  };

  return (
    <div className={`network-status ${className}`}>
      {/* Compact status indicator */}
      <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        {showDetails && (
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
        )}
      </div>

      {/* Error details */}
      {lastError && showError && (
        <div className="mt-2 p-3 bg-red-900 border border-red-700 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-300 mb-1">
                  Network Error
                </h4>
                <p className="text-sm text-red-200">
                  {getUserFriendlyErrorMessage(lastError)}
                </p>
                {lastError.isRetryable && (
                  <p className="text-xs text-red-300 mt-1 opacity-75">
                    This error is temporary. Retrying automatically...
                  </p>
                )}
              </div>
            </div>
            
            {/* Dismiss button */}
            <button
              onClick={dismissError}
              className="text-red-300 hover:text-red-100 transition-colors ml-2"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Recovery actions */}
          {lastError.isRetryable && (
            <div className="mt-3 pt-2 border-t border-red-800">
              <div className="flex space-x-2">
                <button
                  onClick={retryConnection}
                  className="text-xs bg-red-800 hover:bg-red-700 text-red-100 px-2 py-1 rounded transition-colors"
                >
                  Retry Now
                </button>
                <button
                  onClick={dismissError}
                  className="text-xs bg-red-800 hover:bg-red-700 text-red-100 px-2 py-1 rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div className="mt-2 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-300">
                You're offline
              </h4>
              <p className="text-sm text-yellow-200">
                Some features may not work. Check your internet connection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!isOnline && 'Connection lost. You are now offline.'}
        {isOnline && lastError && 'Connection restored but some services may be unavailable.'}
        {isOnline && !lastError && 'Connection restored. All services available.'}
      </div>
    </div>
  );
}

/**
 * Simple network status indicator for use in headers/footers
 */
export function NetworkStatusIndicator({ 
  size = 'small' 
}: { 
  size?: 'small' | 'medium' | 'large' 
}): React.JSX.Element {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const connectionMonitor = getConnectionMonitor();
    return connectionMonitor.subscribe(setIsOnline);
  }, []);

  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4',
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full ${
        isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse'
      }`}
      title={isOnline ? 'Online' : 'Offline'}
      aria-label={`Network status: ${isOnline ? 'Online' : 'Offline'}`}
    />
  );
}

/**
 * Hook for using network status in components
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<NetworkError | null>(null);

  useEffect(() => {
    const connectionMonitor = getConnectionMonitor();
    return connectionMonitor.subscribe((online) => {
      setIsOnline(online);
      if (online) {
        setError(null);
      }
    });
  }, []);

  const reportError = (networkError: NetworkError) => {
    setError(networkError);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isOnline,
    error,
    reportError,
    clearError,
    hasError: !!error,
    isRetryable: error?.isRetryable ?? false,
  };
}