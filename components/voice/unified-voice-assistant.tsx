'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { ModernButton } from '../ui/modern-button';
import { ModernCard } from '../ui/modern-card';

interface UnifiedVoiceAssistantProps {
  currentPage?: string;
  className?: string;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  lastCommand?: string;
  lastResponse?: string;
  error?: string;
}

// Page-specific voice commands
const PAGE_COMMANDS = {
  '/dashboard': [
    'Show me key metrics',
    'What are the alerts?',
    'Run health check',
    'Display performance summary'
  ],
  '/digital-twin': [
    'Scan for anomalies',
    'Run port closure scenario',
    'Show network status',
    'Add new supplier',
    'Auto layout nodes'
  ],
  '/analytics': [
    'Show trend analysis',
    'Compare last quarter',
    'Generate report',
    'Highlight anomalies'
  ],
  '/scenarios': [
    'Run disruption scenario',
    'Test supplier failure',
    'Simulate demand surge',
    'Check resilience score'
  ],
  '/sustainability': [
    'Show carbon footprint',
    'Find green alternatives',
    'Check sustainability alerts',
    'Calculate emissions'
  ],
  '/impact': [
    'Analyze financial impact',
    'Show cascade effects',
    'Calculate delay costs',
    'Generate impact report'
  ]
};

export function UnifiedVoiceAssistant({ 
  currentPage = '/dashboard',
  className = '' 
}: UnifiedVoiceAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isConnected: true
  });

  const currentCommands = PAGE_COMMANDS[currentPage as keyof typeof PAGE_COMMANDS] || PAGE_COMMANDS['/dashboard'];

  const handleVoiceToggle = async () => {
    if (voiceState.isListening) {
      // Stop listening
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false, 
        isProcessing: true 
      }));
      
      // Simulate processing
      setTimeout(() => {
        setVoiceState(prev => ({ 
          ...prev, 
          isProcessing: false,
          lastCommand: 'Show me analytics',
          lastResponse: 'Displaying analytics dashboard with current metrics and trends.'
        }));
      }, 2000);
    } else {
      // Start listening
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: true 
      }));
      
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        if (voiceState.isListening) {
          setVoiceState(prev => ({ 
            ...prev, 
            isListening: false, 
            isProcessing: true 
          }));
        }
      }, 5000);
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    setIsExpanded(false);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setIsMinimized(true);
  };

  // Minimized state - just a floating button
  if (isMinimized) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <ModernButton
          variant="primary"
          size="lg"
          onClick={() => setIsMinimized(false)}
          icon={<Sparkles className="w-5 h-5" />}
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Beacon
        </ModernButton>
      </div>
    );
  }

  // Compact state - floating voice button with status
  if (!isExpanded) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="flex flex-col items-end gap-3">
          {/* Status indicator */}
          {(voiceState.isListening || voiceState.isProcessing) && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 max-w-xs">
              <div className="flex items-center gap-2">
                {voiceState.isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <span className="text-sm text-gray-700">
                  {voiceState.isProcessing ? 'Processing...' : 'Listening...'}
                </span>
              </div>
            </div>
          )}
          
          {/* Main voice button */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Beacon Assistant</div>
                  <div className="text-xs text-gray-500">
                    {voiceState.isConnected ? 'Ready' : 'Connecting...'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <ModernButton
                  variant={voiceState.isListening ? 'primary' : 'outline'}
                  size="sm"
                  onClick={handleVoiceToggle}
                  disabled={voiceState.isProcessing}
                  icon={
                    voiceState.isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : voiceState.isListening ? (
                      <Mic className="w-4 h-4" />
                    ) : (
                      <MicOff className="w-4 h-4" />
                    )
                  }
                  className={`transition-all duration-200 ${
                    voiceState.isListening ? 'animate-pulse shadow-lg shadow-blue-500/25' : ''
                  }`}
                />
                
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={handleExpand}
                  icon={<MessageCircle className="w-4 h-4" />}
                />
                
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  icon={<Minimize2 className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state - full voice assistant panel
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <ModernCard className="w-96 max-h-[500px] shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Beacon Assistant</h3>
              <p className="text-xs text-gray-500">
                {voiceState.isConnected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              icon={isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            />
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              icon={<Minimize2 className="w-4 h-4" />}
            />
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={handleClose}
              icon={<X className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
          {/* Voice Controls */}
          <div className="text-center">
            <ModernButton
              variant={voiceState.isListening ? 'primary' : 'outline'}
              size="lg"
              onClick={handleVoiceToggle}
              disabled={voiceState.isProcessing}
              icon={
                voiceState.isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : voiceState.isListening ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )
              }
              className={`w-full transition-all duration-200 ${
                voiceState.isListening ? 'animate-pulse shadow-lg shadow-blue-500/25' : ''
              }`}
            >
              {voiceState.isProcessing 
                ? 'Processing...' 
                : voiceState.isListening 
                ? 'Listening...' 
                : 'Click to speak'
              }
            </ModernButton>
          </div>

          {/* Last interaction */}
          {(voiceState.lastCommand || voiceState.lastResponse) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {voiceState.lastCommand && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">You said:</div>
                  <div className="text-sm text-gray-900">"{voiceState.lastCommand}"</div>
                </div>
              )}
              {voiceState.lastResponse && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Beacon:</div>
                  <div className="text-sm text-gray-700">{voiceState.lastResponse}</div>
                </div>
              )}
            </div>
          )}

          {/* Page-specific commands */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Try saying:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {currentCommands.map((command, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setVoiceState(prev => ({ 
                      ...prev, 
                      lastCommand: command,
                      isProcessing: true 
                    }));
                    setTimeout(() => {
                      setVoiceState(prev => ({ 
                        ...prev, 
                        isProcessing: false,
                        lastResponse: `Executing: ${command}`
                      }));
                    }, 1500);
                  }}
                  className="text-left px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors duration-200"
                >
                  "{command}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModernCard>
    </div>
  );
}