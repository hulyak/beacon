'use client';

import { useState, useEffect } from 'react';
import type { ElevenLabsError } from '@/lib/elevenlabs';

export interface MicrophonePermissionModalProps {
  isOpen: boolean;
  error: ElevenLabsError | null;
  onClose: () => void;
  onRetry: () => void;
  onFallbackToText: () => void;
}

// Browser detection utility
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) {
    return { name: 'Chrome', isSupported: true };
  } else if (userAgent.includes('Firefox')) {
    return { name: 'Firefox', isSupported: true };
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return { name: 'Safari', isSupported: true };
  } else if (userAgent.includes('Edge')) {
    return { name: 'Edge', isSupported: true };
  } else {
    return { name: 'Unknown', isSupported: false };
  }
};

export default function MicrophonePermissionModal({
  isOpen,
  error,
  onClose,
  onRetry,
  onFallbackToText,
}: MicrophonePermissionModalProps): React.JSX.Element | null {
  const [browserInfo, setBrowserInfo] = useState<{ name: string; isSupported: boolean }>({ name: 'Unknown', isSupported: false });
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');

  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
    
    // Check current permission state
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setPermissionState(result.state);
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionState(result.state);
          });
        })
        .catch(console.error);
    }
  }, []);

  if (!isOpen || !error) return null;

  const getBrowserSpecificInstructions = () => {
    switch (browserInfo.name) {
      case 'Chrome':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <strong>Chrome Instructions:</strong>
            </p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Look for the microphone icon in the address bar</li>
              <li>Click on it and select "Always allow"</li>
              <li>Or go to Settings → Privacy and security → Site settings → Microphone</li>
              <li>Add this site to the "Allow" list</li>
            </ol>
          </div>
        );
      
      case 'Firefox':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <strong>Firefox Instructions:</strong>
            </p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Look for the microphone icon in the address bar</li>
              <li>Click on it and select "Allow"</li>
              <li>Or go to Preferences → Privacy & Security → Permissions</li>
              <li>Click "Settings" next to Microphone and allow this site</li>
            </ol>
          </div>
        );
      
      case 'Safari':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <strong>Safari Instructions:</strong>
            </p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Go to Safari → Preferences → Websites</li>
              <li>Select "Microphone" from the left sidebar</li>
              <li>Set this website to "Allow"</li>
              <li>Refresh the page and try again</li>
            </ol>
          </div>
        );
      
      case 'Edge':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <strong>Edge Instructions:</strong>
            </p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Look for the microphone icon in the address bar</li>
              <li>Click on it and select "Always allow"</li>
              <li>Or go to Settings → Site permissions → Microphone</li>
              <li>Add this site to the "Allow" list</li>
            </ol>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <strong>General Instructions:</strong>
            </p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Look for a microphone icon in your browser's address bar</li>
              <li>Click on it and allow microphone access</li>
              <li>Check your browser's privacy/security settings</li>
              <li>Ensure microphone permissions are enabled for this site</li>
            </ol>
          </div>
        );
    }
  };

  const getPermissionStateMessage = () => {
    switch (permissionState) {
      case 'granted':
        return (
          <div className="flex items-center space-x-2 text-green-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span>Microphone permission granted</span>
          </div>
        );
      
      case 'denied':
        return (
          <div className="flex items-center space-x-2 text-red-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>Microphone permission denied</span>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center space-x-2 text-yellow-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>Microphone permission required</span>
          </div>
        );
    }
  };

  const handleRequestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      onRetry();
    } catch (error) {
      console.error('Permission request failed:', error);
      // Permission was denied, show instructions
    }
  };

  const isPermissionDenied = permissionState === 'denied';
  const isMicrophoneSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-600 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-900 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z" />
                <path d="M3 3l18 18M9.5 9.5a3 3 0 0 0 5 2.5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Microphone Access Required</h2>
              <p className="text-sm text-gray-400">Voice features need microphone permission</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error message */}
          <div className="p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200 text-sm">
              {error.message}
            </p>
          </div>

          {/* Permission state */}
          <div className="p-4 bg-gray-700 rounded-lg">
            {getPermissionStateMessage()}
          </div>

          {/* Browser support check */}
          {!isMicrophoneSupported && (
            <div className="p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-300 mb-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span className="font-medium">Browser Not Supported</span>
              </div>
              <p className="text-yellow-200 text-sm">
                Your browser doesn't support microphone access. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
              </p>
            </div>
          )}

          {/* Browser-specific instructions */}
          {isMicrophoneSupported && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">How to Enable Microphone Access:</h3>
              {getBrowserSpecificInstructions()}
            </div>
          )}

          {/* Troubleshooting tips */}
          <div className="space-y-2">
            <h3 className="text-white font-medium">Troubleshooting Tips:</h3>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Make sure your microphone is connected and working</li>
              <li>Check if other applications are using the microphone</li>
              <li>Try refreshing the page after granting permission</li>
              <li>Ensure you're using HTTPS (required for microphone access)</li>
              {isPermissionDenied && (
                <li className="text-yellow-400">
                  You may need to reset site permissions in your browser settings
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-600">
          {isMicrophoneSupported && !isPermissionDenied && (
            <button
              onClick={handleRequestPermission}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Grant Permission
            </button>
          )}
          
          {isMicrophoneSupported && permissionState === 'granted' && (
            <button
              onClick={onRetry}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
          )}

          <button
            onClick={onFallbackToText}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Use Text Instead
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility function to check microphone support
export const checkMicrophoneSupport = (): {
  isSupported: boolean;
  isSecureContext: boolean;
  error?: string;
} => {
  const isSecureContext = window.isSecureContext;
  const hasMediaDevices = !!navigator.mediaDevices;
  const hasGetUserMedia = hasMediaDevices && !!navigator.mediaDevices.getUserMedia;

  if (!isSecureContext) {
    return {
      isSupported: false,
      isSecureContext: false,
      error: 'Microphone access requires HTTPS',
    };
  }

  if (!hasGetUserMedia) {
    return {
      isSupported: false,
      isSecureContext: true,
      error: 'Browser does not support microphone access',
    };
  }

  return {
    isSupported: true,
    isSecureContext: true,
  };
};

// Utility function to request microphone permission
export const requestMicrophonePermission = async (): Promise<{
  granted: boolean;
  error?: string;
}> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Stop the stream immediately as we only needed permission
    stream.getTracks().forEach(track => track.stop());
    
    return { granted: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Permission denied')) {
      return {
        granted: false,
        error: 'Microphone permission was denied',
      };
    } else if (errorMessage.includes('NotFoundError')) {
      return {
        granted: false,
        error: 'No microphone device found',
      };
    } else if (errorMessage.includes('NotAllowedError')) {
      return {
        granted: false,
        error: 'Microphone access not allowed',
      };
    } else {
      return {
        granted: false,
        error: `Microphone access failed: ${errorMessage}`,
      };
    }
  }
};