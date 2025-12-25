'use client';

// Modern Voice Interface Component
import React, { useState, useEffect } from 'react';
import { useBeaconVoice } from '@/lib/hooks/use-beacon-voice';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  MessageCircle,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernVoiceInterfaceProps {
  className?: string;
  compact?: boolean;
  showTranscript?: boolean;
  showStatus?: boolean;
  onCommand?: (command: string) => void;
  onResponse?: (response: string) => void;
}

export function ModernVoiceInterface({
  className,
  compact = false,
  showTranscript = true,
  showStatus = true,
  onCommand,
  onResponse,
}: ModernVoiceInterfaceProps) {
  const {
    state,
    isInitialized,
    startSession,
    endSession,
    toggleListening,
    sendTextCommand,
    isSupported,
    error,
  } = useBeaconVoice({
    autoStart: false,
    enableDebug: process.env.NODE_ENV === 'development',
    onCommand: (command) => onCommand?.(command.text),
    onResponse: (response) => onResponse?.(response.text),
  });

  const [textInput, setTextInput] = useState('');
  const [transcript, setTranscript] = useState<Array<{ type: 'user' | 'assistant'; text: string; timestamp: Date }>>([]);

  // Add messages to transcript
  useEffect(() => {
    if (state.currentCommand) {
      setTranscript(prev => [...prev, {
        type: 'user',
        text: state.currentCommand!,
        timestamp: new Date(),
      }]);
    }
  }, [state.currentCommand]);

  useEffect(() => {
    if (state.lastResponse) {
      setTranscript(prev => [...prev, {
        type: 'assistant',
        text: state.lastResponse!,
        timestamp: new Date(),
      }]);
    }
  }, [state.lastResponse]);

  const handleStartSession = async () => {
    try {
      await startSession();
    } catch (error) {
      console.error('Failed to start voice session:', error);
    }
  };

  const handleToggleListening = async () => {
    try {
      await toggleListening();
    } catch (error) {
      console.error('Failed to toggle listening:', error);
    }
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;

    try {
      await sendTextCommand(textInput);
      setTextInput('');
    } catch (error) {
      console.error('Failed to send text command:', error);
    }
  };

  const getConnectionStatusIcon = () => {
    switch (state.connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (state.connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  if (!isSupported) {
    return (
      <ModernCard className={cn('border-yellow-200 bg-yellow-50', className)}>
        <ModernCardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Voice Not Supported</p>
              <p className="text-xs text-yellow-600">Your browser doesn't support voice features</p>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Connection Status */}
        {showStatus && (
          <div className="flex items-center gap-1">
            {getConnectionStatusIcon()}
            <span className="text-xs text-gray-500 hidden sm:inline">
              {getConnectionStatusText()}
            </span>
          </div>
        )}

        {/* Voice Toggle Button */}
        <ModernButton
          variant={state.isListening ? 'primary' : 'outline'}
          size="sm"
          onClick={state.connectionStatus === 'disconnected' ? handleStartSession : handleToggleListening}
          disabled={state.isProcessing || !isInitialized}
          icon={
            state.isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : state.isListening ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )
          }
          className={cn(
            'transition-all duration-200',
            state.isListening && 'animate-pulse shadow-lg shadow-blue-500/25'
          )}
        >
          {state.isListening ? 'Listening...' : 'Voice'}
        </ModernButton>

        {/* Error Indicator */}
        {error && (
          <AlertCircle className="w-4 h-4 text-red-500" title={error} />
        )}
      </div>
    );
  }

  return (
    <ModernCard className={cn('w-full max-w-2xl', className)}>
      <ModernCardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Voice Assistant</h3>
              <p className="text-sm text-gray-500">Speak naturally to control Beacon</p>
            </div>
          </div>

          {/* Status and Settings */}
          <div className="flex items-center gap-2">
            {showStatus && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                {getConnectionStatusIcon()}
                <span className="text-xs font-medium text-gray-700">
                  {getConnectionStatusText()}
                </span>
              </div>
            )}
            <ModernButton variant="ghost" size="sm" icon={<Settings className="w-4 h-4" />} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex items-center gap-4 mb-6">
          {/* Main Voice Button */}
          <ModernButton
            variant={state.isListening ? 'primary' : 'outline'}
            size="lg"
            onClick={state.connectionStatus === 'disconnected' ? handleStartSession : handleToggleListening}
            disabled={state.isProcessing || !isInitialized}
            icon={
              state.isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : state.isListening ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )
            }
            className={cn(
              'flex-1 transition-all duration-200',
              state.isListening && 'animate-pulse shadow-lg shadow-blue-500/25'
            )}
          >
            {state.isProcessing 
              ? 'Processing...' 
              : state.isListening 
                ? 'Listening...' 
                : state.connectionStatus === 'disconnected'
                  ? 'Start Voice Session'
                  : 'Start Listening'
            }
          </ModernButton>

          {/* Audio Controls */}
          <ModernButton
            variant="ghost"
            size="lg"
            icon={state.isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            disabled={!state.isPlaying}
          />

          {/* End Session */}
          {state.connectionStatus === 'connected' && (
            <ModernButton
              variant="outline"
              size="lg"
              onClick={endSession}
            >
              End Session
            </ModernButton>
          )}
        </div>

        {/* Text Input Alternative */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Or type your command here..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={state.isProcessing || !isInitialized}
            />
            <ModernButton
              variant="outline"
              onClick={handleSendText}
              disabled={!textInput.trim() || state.isProcessing || !isInitialized}
            >
              Send
            </ModernButton>
          </div>
        </div>

        {/* Transcript */}
        {showTranscript && transcript.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Conversation</h4>
            <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
              {transcript.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex gap-2 text-sm',
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-xs px-3 py-2 rounded-lg',
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    )}
                  >
                    <p>{message.text}</p>
                    <p className={cn(
                      'text-xs mt-1',
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    )}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Commands */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Commands</h4>
          <div className="flex flex-wrap gap-2">
            {[
              'Show analytics',
              'Check risks',
              'Run scenario',
              'Carbon footprint',
              'Go to dashboard',
            ].map((command) => (
              <ModernButton
                key={command}
                variant="ghost"
                size="sm"
                onClick={() => sendTextCommand(command)}
                disabled={state.isProcessing || !isInitialized}
                className="text-xs"
              >
                "{command}"
              </ModernButton>
            ))}
          </div>
        </div>
      </ModernCardContent>
    </ModernCard>
  );
}