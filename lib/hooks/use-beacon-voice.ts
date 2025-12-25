// React Hook for Beacon Voice Integration
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BeaconVoiceManager, BeaconVoiceConfig } from '@/lib/voice/beacon-voice-manager';
import { VoiceUIState, VoiceCommand, VoiceResponse, VoiceActionType } from '@/lib/types/voice-types';

interface UseBeaconVoiceOptions {
  autoStart?: boolean;
  enableDebug?: boolean;
  onCommand?: (command: VoiceCommand) => void;
  onResponse?: (response: VoiceResponse) => void;
  onError?: (error: string) => void;
}

interface UseBeaconVoiceReturn {
  // State
  state: VoiceUIState;
  isInitialized: boolean;
  
  // Actions
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  sendTextCommand: (text: string) => Promise<void>;
  speakText: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  
  // Utilities
  toggleListening: () => Promise<void>;
  isSupported: boolean;
  error: string | null;
}

export function useBeaconVoice(options: UseBeaconVoiceOptions = {}): UseBeaconVoiceReturn {
  const router = useRouter();
  const voiceManagerRef = useRef<BeaconVoiceManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, setState] = useState<VoiceUIState>({
    isListening: false,
    isProcessing: false,
    isPlaying: false,
    connectionStatus: 'disconnected',
    microphonePermission: 'prompt',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Initialize voice manager
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        // Check if we have the required environment variables
        const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
        const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
        const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID;

        if (!apiKey || !agentId || !voiceId) {
          console.warn('ElevenLabs configuration missing. Voice features will be disabled.');
          setError('Voice configuration missing');
          return;
        }

        const config: BeaconVoiceConfig = {
          elevenLabsApiKey: apiKey,
          agentId: agentId,
          voiceId: voiceId,
          enableRealTimeProcessing: true,
          autoPlayResponses: true,
          wakeWordEnabled: false,
          debugMode: options.enableDebug || false,
        };

        const voiceManager = new BeaconVoiceManager(config);
        voiceManagerRef.current = voiceManager;

        // Set up event listeners
        voiceManager.on('initialized', ({ success }: { success: boolean }) => {
          if (success) {
            setIsInitialized(true);
            setIsSupported(true);
            setError(null);
          }
        });

        voiceManager.on('stateChanged', ({ state: newState }: { state: VoiceUIState }) => {
          setState(newState);
        });

        voiceManager.on('commandReceived', ({ command }: { command: VoiceCommand }) => {
          options.onCommand?.(command);
        });

        voiceManager.on('responseReceived', ({ response }: { response: VoiceResponse }) => {
          options.onResponse?.(response);
        });

        voiceManager.on('error', ({ error: errorMessage }: { error: string }) => {
          setError(errorMessage);
          options.onError?.(errorMessage);
        });

        voiceManager.on('action', ({ type, payload }: { type: VoiceActionType; payload: any }) => {
          handleVoiceAction(type, payload);
        });

        // Auto-start if requested
        if (options.autoStart) {
          await voiceManager.startSession();
        }

      } catch (err) {
        console.error('Failed to initialize voice system:', err);
        setError(err instanceof Error ? err.message : 'Voice initialization failed');
        setIsSupported(false);
      }
    };

    initializeVoice();

    // Cleanup on unmount
    return () => {
      if (voiceManagerRef.current) {
        voiceManagerRef.current.destroy();
      }
    };
  }, [options.autoStart, options.enableDebug]);

  // Handle voice actions
  const handleVoiceAction = useCallback((type: VoiceActionType, payload: any) => {
    switch (type) {
      case VoiceActionType.NAVIGATE:
        if (payload.path) {
          router.push(payload.path);
        }
        break;
        
      case VoiceActionType.QUERY_DATA:
        // Handle data queries
        console.log('Voice data query:', payload);
        break;
        
      case VoiceActionType.UPDATE_DASHBOARD:
        // Handle dashboard updates
        console.log('Voice dashboard update:', payload);
        break;
        
      default:
        console.log('Unhandled voice action:', type, payload);
    }
  }, [router]);

  // Start voice session
  const startSession = useCallback(async () => {
    if (!voiceManagerRef.current) {
      throw new Error('Voice manager not initialized');
    }

    try {
      await voiceManagerRef.current.startSession();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // End voice session
  const endSession = useCallback(async () => {
    if (!voiceManagerRef.current) {
      return;
    }

    try {
      await voiceManagerRef.current.endSession();
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!voiceManagerRef.current) {
      throw new Error('Voice manager not initialized');
    }

    try {
      await voiceManagerRef.current.startListening();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start listening';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(async () => {
    if (!voiceManagerRef.current) {
      return;
    }

    try {
      await voiceManagerRef.current.stopListening();
    } catch (err) {
      console.error('Failed to stop listening:', err);
    }
  }, []);

  // Send text command
  const sendTextCommand = useCallback(async (text: string) => {
    if (!voiceManagerRef.current) {
      throw new Error('Voice manager not initialized');
    }

    try {
      await voiceManagerRef.current.processTextCommand(text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process command';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Speak text using TTS
  const speakText = useCallback(async (text: string) => {
    if (!voiceManagerRef.current) {
      throw new Error('Voice manager not initialized');
    }

    try {
      await voiceManagerRef.current.speakText(text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to speak text';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.stopSpeaking();
    }
  }, []);

  // Toggle listening state
  const toggleListening = useCallback(async () => {
    if (state.isListening) {
      await stopListening();
    } else {
      // Start session if not connected
      if (state.connectionStatus === 'disconnected') {
        await startSession();
      }
      await startListening();
    }
  }, [state.isListening, state.connectionStatus, startSession, startListening, stopListening]);

  return {
    // State
    state,
    isInitialized,
    
    // Actions
    startSession,
    endSession,
    startListening,
    stopListening,
    sendTextCommand,
    speakText,
    stopSpeaking,
    
    // Utilities
    toggleListening,
    isSupported,
    error,
  };
}

// Hook for voice-enabled components
export function useVoiceCommands(commands: Record<string, (params?: any) => void>) {
  const { sendTextCommand } = useBeaconVoice();

  const executeVoiceCommand = useCallback(async (commandText: string) => {
    // Simple command matching (in production, use more sophisticated NLP)
    const lowerText = commandText.toLowerCase();
    
    for (const [pattern, handler] of Object.entries(commands)) {
      if (lowerText.includes(pattern.toLowerCase())) {
        handler();
        return;
      }
    }

    // If no local command matches, send to voice manager
    await sendTextCommand(commandText);
  }, [commands, sendTextCommand]);

  return { executeVoiceCommand };
}

// Hook for voice-enabled forms
export function useVoiceForm() {
  const { sendTextCommand, state } = useBeaconVoice();
  const [voiceInput, setVoiceInput] = useState('');

  const startVoiceInput = useCallback(async (fieldName: string) => {
    try {
      // This would integrate with speech recognition for form filling
      // For now, we'll use the text command system
      await sendTextCommand(`Fill ${fieldName} field`);
    } catch (error) {
      console.error('Voice form input failed:', error);
    }
  }, [sendTextCommand]);

  const clearVoiceInput = useCallback(() => {
    setVoiceInput('');
  }, []);

  return {
    voiceInput,
    startVoiceInput,
    clearVoiceInput,
    isListening: state.isListening,
    isProcessing: state.isProcessing,
  };
}