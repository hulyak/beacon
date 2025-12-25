// Simple Voice Hook - Reliable TTS + Speech Recognition
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SimpleVoiceManager, SimpleVoiceConfig, SimpleVoiceState } from '@/lib/voice/simple-voice-manager';

interface UseSimpleVoiceOptions {
  autoStart?: boolean;
  enableDebug?: boolean;
  autoSpeak?: boolean;
  onCommand?: (command: string) => void;
  onResponse?: (response: string) => void;
  onError?: (error: string) => void;
}

interface UseSimpleVoiceReturn {
  // State
  state: SimpleVoiceState;
  isInitialized: boolean;
  
  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  speakText: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  processTextCommand: (text: string) => Promise<void>;
  setAutoSpeak: (enabled: boolean) => void;
  
  // Utilities
  toggleListening: () => Promise<void>;
  isSupported: boolean;
  error: string | null;
}

export function useSimpleVoiceManager(options: UseSimpleVoiceOptions = {}): UseSimpleVoiceReturn {
  const voiceManagerRef = useRef<SimpleVoiceManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, setState] = useState<SimpleVoiceState>({
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
        const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID;

        const config: SimpleVoiceConfig = {
          elevenLabsApiKey: apiKey || '',
          voiceId: voiceId || '',
          enableElevenLabs: !!(apiKey && voiceId),
          enableBrowserFallback: true,
          debugMode: options.enableDebug || false,
          autoSpeak: options.autoSpeak !== false, // Default to true
        };

        const voiceManager = new SimpleVoiceManager(config);
        voiceManagerRef.current = voiceManager;

        // Set up event listeners
        voiceManager.on('initialized', ({ success }: { success: boolean }) => {
          if (success) {
            setIsInitialized(true);
            setIsSupported(true);
            setError(null);
          }
        });

        voiceManager.on('stateChanged', ({ state: newState }: { state: SimpleVoiceState }) => {
          setState(newState);
        });

        voiceManager.on('commandProcessed', ({ command, response }: { command: string; response: string }) => {
          options.onCommand?.(command);
          options.onResponse?.(response);
          
          // Automatically speak the response (this will be controlled by mute state in the component)
          voiceManager.speakText(response).catch(console.error);
        });

        voiceManager.on('error', ({ error: errorMessage }: { error: string }) => {
          setError(errorMessage);
          options.onError?.(errorMessage);
        });

        // Check microphone permission
        if (options.autoStart) {
          await voiceManager.checkMicrophonePermission();
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
  const stopListening = useCallback(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.stopListening();
    }
  }, []);

  // Speak text
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

  // Process text command
  const processTextCommand = useCallback(async (text: string) => {
    if (!voiceManagerRef.current) {
      throw new Error('Voice manager not initialized');
    }

    try {
      await voiceManagerRef.current.processCommand(text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process command';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Set auto-speak mode
  const setAutoSpeak = useCallback((enabled: boolean) => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.setAutoSpeak(enabled);
    }
  }, []);

  // Toggle listening state
  const toggleListening = useCallback(async () => {
    if (state.isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  return {
    // State
    state,
    isInitialized,
    
    // Actions
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    processTextCommand,
    setAutoSpeak,
    
    // Utilities
    toggleListening,
    isSupported,
    error,
  };
}