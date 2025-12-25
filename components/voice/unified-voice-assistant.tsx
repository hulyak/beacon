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
import { BeaconLogo, BeaconLogoCompact } from '../ui/beacon-logo';
import { useBeaconVoice } from '@/lib/hooks/use-beacon-voice';
import { useSimpleVoiceManager } from '@/lib/hooks/use-simple-voice-manager';

interface UnifiedVoiceAssistantProps {
  currentPage?: string;
  className?: string;
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
  const [lastCommand, setLastCommand] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>('');

  // Use simple voice manager as primary (it's more reliable)
  const {
    state: simpleState,
    isInitialized: simpleInitialized,
    startListening: simpleStartListening,
    stopListening: simpleStopListening,
    speakText: simpleSpeakText,
    stopSpeaking: simpleStopSpeaking,
    processTextCommand: simpleProcessTextCommand,
    toggleListening: simpleToggleListening,
    setAutoSpeak: simpleSetAutoSpeak,
    isSupported: simpleSupported,
    error: simpleError
  } = useSimpleVoiceManager({
    autoStart: true,
    enableDebug: false, // Disable debug to reduce console noise
    autoSpeak: !isMuted, // Respect initial mute state
    onCommand: (command) => {
      setLastCommand(command);
    },
    onResponse: (response) => {
      setLastResponse(response);
    },
    onError: (error) => {
      console.warn('Voice system warning:', error);
    }
  });

  // Try the full ElevenLabs integration as secondary option
  const {
    state: voiceState,
    isInitialized,
    startSession,
    toggleListening,
    sendTextCommand,
    speakText,
    stopSpeaking,
    isSupported,
    error: voiceError
  } = useBeaconVoice({
    autoStart: false, // Don't auto-start to avoid errors
    enableDebug: false,
    onCommand: (command) => {
      setLastCommand(command.text);
    },
    onResponse: (response) => {
      setLastResponse(response.text);
      // Automatically speak the response if not muted
      if (!isMuted && response.text) {
        speakText(response.text).catch(console.error);
      }
    },
    onError: (error) => {
      console.warn('Advanced voice system not available:', error);
    }
  });

  // Use simple voice as primary, full integration as fallback
  const useSimpleVoice = true; // Always use simple voice for reliability
  const currentState = simpleState;
  const currentInitialized = simpleInitialized;
  const currentSupported = simpleSupported;
  const currentError = simpleError;

  const currentCommands = PAGE_COMMANDS[currentPage as keyof typeof PAGE_COMMANDS] || PAGE_COMMANDS['/dashboard'];

  // Auto-start is disabled for full integration to prevent errors
  // The simple voice manager handles all functionality reliably

  const handleVoiceToggle = async () => {
    try {
      if (useSimpleVoice) {
        await simpleToggleListening();
      } else {
        await toggleListening();
      }
    } catch (error) {
      console.error('Failed to toggle voice:', error);
    }
  };

  const handleCommandClick = async (command: string) => {
    try {
      setLastCommand(command);
      if (useSimpleVoice) {
        await simpleProcessTextCommand(command);
      } else {
        await sendTextCommand(command);
      }
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Update auto-speak setting in voice manager
    if (useSimpleVoice) {
      simpleSetAutoSpeak(!newMutedState);
      if (newMutedState) {
        // If muting, stop any current speech
        simpleStopSpeaking();
      }
    } else {
      if (newMutedState) {
        // If muting, stop any current speech
        stopSpeaking();
      }
    }
  };

  const handleSpeakResponse = async () => {
    if (!lastResponse) return;
    
    try {
      if (useSimpleVoice) {
        await simpleSpeakText(lastResponse);
      } else {
        await speakText(lastResponse);
      }
    } catch (error) {
      console.error('Failed to speak response:', error);
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

  // Show loading state if not initialized yet
  if (!currentInitialized) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <div className="text-sm text-blue-700">
              Initializing voice assistant...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Minimized state - just a floating button
  if (isMinimized) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <ModernButton
          variant="primary"
          size="lg"
          onClick={() => setIsMinimized(false)}
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <BeaconLogoCompact size="sm" variant="white" />
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
          {(currentState.isListening || currentState.isProcessing || currentState.isPlaying) && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 max-w-xs">
              <div className="flex items-center gap-2">
                {currentState.isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : currentState.isPlaying ? (
                  <Volume2 className="w-4 h-4 text-green-600 animate-pulse" />
                ) : (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <span className="text-sm text-gray-700">
                  {currentState.isProcessing ? 'Processing...' : 
                   currentState.isPlaying ? 'Speaking...' : 'Listening...'}
                </span>
              </div>
            </div>
          )}
          
          {/* Main voice button */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <BeaconLogo size="sm" showTagline={false} />
              <div className="text-xs text-gray-500">
                {currentState.connectionStatus === 'connected' ? 'Ready' : 
                 currentState.connectionStatus === 'connecting' ? 'Connecting...' : 
                 currentState.connectionStatus === 'error' ? 'Error' : 'Disconnected'}
              </div>
              
              <div className="flex items-center gap-1">
                <ModernButton
                  variant={currentState.isListening ? 'primary' : 'outline'}
                  size="sm"
                  onClick={handleVoiceToggle}
                  disabled={currentState.isProcessing}
                  icon={
                    currentState.isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : currentState.isListening ? (
                      <Mic className="w-4 h-4" />
                    ) : (
                      <MicOff className="w-4 h-4" />
                    )
                  }
                  className={`transition-all duration-200 ${
                    currentState.isListening ? 'animate-pulse shadow-lg shadow-blue-500/25' : ''
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
          <BeaconLogo size="sm" showTagline={true} />
          <div className="text-xs text-gray-500">
            {currentState.connectionStatus === 'connected' ? 'Connected' : 
             currentState.connectionStatus === 'connecting' ? 'Connecting...' : 
             currentState.connectionStatus === 'error' ? 'Error' : 'Disconnected'}
          </div>
          
          <div className="flex items-center gap-1">
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
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
              variant={currentState.isListening ? 'primary' : 'outline'}
              size="lg"
              onClick={handleVoiceToggle}
              disabled={currentState.isProcessing}
              icon={
                currentState.isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : currentState.isListening ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )
              }
              className={`w-full transition-all duration-200 ${
                currentState.isListening ? 'animate-pulse shadow-lg shadow-blue-500/25' : ''
              }`}
            >
              {currentState.isProcessing 
                ? 'Processing...' 
                : currentState.isListening 
                ? 'Listening...' 
                : 'Click to speak'
              }
            </ModernButton>
          </div>

          {/* Last interaction */}
          {(lastCommand || lastResponse) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {lastCommand && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">You said:</div>
                  <div className="text-sm text-gray-900">"{lastCommand}"</div>
                </div>
              )}
              {lastResponse && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-medium text-gray-500">Beacon:</div>
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={handleSpeakResponse}
                      disabled={currentState.isPlaying}
                      icon={currentState.isPlaying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                      className="h-6 px-2"
                    />
                  </div>
                  <div className="text-sm text-gray-700">{lastResponse}</div>
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
                  onClick={() => handleCommandClick(command)}
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