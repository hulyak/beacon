'use client';

import { useState, useEffect } from 'react';
import type { ConnectionStatus } from './VoiceAgent';
import type { ElevenLabsError } from '@/lib/elevenlabs';

export interface StatusBarProps {
  status: ConnectionStatus;
  error?: ElevenLabsError | null;
  latency?: number;
  className?: string;
}

export default function StatusBar({
  status,
  error,
  latency,
  className = '',
}: StatusBarProps): React.JSX.Element {
  const [showError, setShowError] = useState(false);

  // Show error when it changes
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  // Auto-hide error after 10 seconds if recoverable
  useEffect(() => {
    if (error && error.recoverable && showError) {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, showError]);

  // Get status display information
  const getStatusInfo = () => {
    switch (status) {
      case 'disconnected':
        return {
          text: 'Disconnected',
          color: 'text-gray-500',
          bgColor: 'bg-gray-800',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ),
        };
      
      case 'connecting':
        return {
          text: 'Connecting...',
          color: 'text-blue-400',
          bgColor: 'bg-blue-900',
          icon: (
            <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2v4a8 8 0 0 1 8 8h4c0-6.627-5.373-12-12-12z" />
            </svg>
          ),
        };
      
      case 'connected':
        return {
          text: 'Connected',
          color: 'text-green-400',
          bgColor: 'bg-green-900',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ),
        };
      
      case 'listening':
        return {
          text: 'Listening...',
          color: 'text-green-300',
          bgColor: 'bg-green-800',
          icon: (
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z" />
            </svg>
          ),
        };
      
      case 'speaking':
        return {
          text: 'AI Speaking...',
          color: 'text-emerald-300',
          bgColor: 'bg-emerald-800',
          icon: (
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ),
        };
      
      default:
        return {
          text: 'Error',
          color: 'text-red-400',
          bgColor: 'bg-red-900',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          ),
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Format latency display
  const formatLatency = (ms: number): string => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  };

  // Handle error dismissal
  const dismissError = () => {
    setShowError(false);
  };

  return (
    <div className={`status-bar ${className}`}>
      {/* Main status bar */}
      <div className={`
        flex items-center justify-between
        px-4 py-2 rounded-lg border
        ${statusInfo.bgColor} ${statusInfo.color}
        border-gray-600
        transition-all duration-300
      `}>
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          {statusInfo.icon}
          <span className="text-sm font-medium">
            {statusInfo.text}
          </span>
        </div>

        {/* Additional info */}
        <div className="flex items-center space-x-4 text-xs opacity-75">
          {/* Latency indicator */}
          {latency !== undefined && latency > 0 && (
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>{formatLatency(latency)}</span>
            </div>
          )}

          {/* Connection quality indicator */}
          {status === 'connected' || status === 'listening' || status === 'speaking' ? (
            <div className="flex items-center space-x-1">
              <div className="flex space-x-0.5">
                <div className="w-1 h-2 bg-current rounded-sm"></div>
                <div className="w-1 h-3 bg-current rounded-sm"></div>
                <div className="w-1 h-4 bg-current rounded-sm"></div>
                <div className={`w-1 h-3 rounded-sm ${
                  latency && latency < 500 ? 'bg-current' : 'bg-current opacity-30'
                }`}></div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Error display */}
      {error && showError && (
        <div className="mt-2 p-3 bg-red-900 border border-red-700 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-300 mb-1">
                  {error.code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </h4>
                <p className="text-sm text-red-200">
                  {error.message}
                </p>
                {error.recoverable && (
                  <p className="text-xs text-red-300 mt-1 opacity-75">
                    This error is recoverable. Try again in a moment.
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
          {error.recoverable && (
            <div className="mt-3 pt-2 border-t border-red-800">
              <div className="flex space-x-2">
                {error.code === 'PERMISSION_DENIED' && (
                  <button
                    onClick={() => {
                      // This would trigger a permission request
                      navigator.mediaDevices?.getUserMedia({ audio: true })
                        .then(() => dismissError())
                        .catch(console.error);
                    }}
                    className="text-xs bg-red-800 hover:bg-red-700 text-red-100 px-2 py-1 rounded transition-colors"
                  >
                    Grant Permission
                  </button>
                )}
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

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'listening' && 'Voice assistant is now listening'}
        {status === 'speaking' && 'Voice assistant is speaking'}
        {status === 'connected' && 'Voice assistant connected'}
        {status === 'disconnected' && 'Voice assistant disconnected'}
        {error && showError && `Error: ${error.message}`}
      </div>
    </div>
  );
}

// Utility component for simple status indicator
export function StatusIndicator({ 
  status, 
  size = 'small' 
}: { 
  status: ConnectionStatus; 
  size?: 'small' | 'medium' | 'large'; 
}): React.JSX.Element {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4',
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-400';
      case 'listening':
        return 'bg-green-400 animate-pulse';
      case 'speaking':
        return 'bg-emerald-400 animate-pulse';
      case 'connecting':
        return 'bg-blue-400 animate-pulse';
      case 'disconnected':
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full ${getStatusColor()}`}
      aria-label={`Status: ${status}`}
    />
  );
}