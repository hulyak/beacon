// Simple Voice Hook - Works without ElevenLabs API Key
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AgentOnlyVoiceClient, BrowserSpeechUtils } from '@/lib/voice/agent-only-client';

interface SimpleVoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  isSupported: boolean;
  currentCommand?: string;
  lastResponse?: string;
  error?: string;
}

interface UseSimpleVoiceReturn {
  state: SimpleVoiceState;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  sendTextCommand: (text: string) => Promise<void>;
  toggleListening: () => Promise<void>;
}

export function useSimpleVoice(): UseSimpleVoiceReturn {
  const router = useRouter();
  const [client] = useState(() => new AgentOnlyVoiceClient({
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
    enableDebug: process.env.NODE_ENV === 'development',
  }));

  const [state, setState] = useState<SimpleVoiceState>({
    isListening: false,
    isProcessing: false,
    isPlaying: false,
    isSupported: false,
  });

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasMediaDevices = !!navigator.mediaDevices?.getUserMedia;
      const hasMediaRecorder = !!window.MediaRecorder;
      const hasSpeechSynthesis = BrowserSpeechUtils.isSpeechSynthesisSupported();
      
      setState(prev => ({
        ...prev,
        isSupported: hasMediaDevices && hasMediaRecorder && hasSpeechSynthesis,
      }));
    };

    checkSupport();
  }, []);

  // Listen for agent responses
  useEffect(() => {
    const handleAgentResponse = (event: CustomEvent) => {
      const { message } = event.detail;
      
      setState(prev => ({
        ...prev,
        lastResponse: message,
        isProcessing: false,
      }));

      // Play response using browser TTS
      if (message) {
        setState(prev => ({ ...prev, isPlaying: true }));
        BrowserSpeechUtils.speak(message)
          .then(() => {
            setState(prev => ({ ...prev, isPlaying: false }));
          })
          .catch((error) => {
            console.error('TTS error:', error);
            setState(prev => ({ ...prev, isPlaying: false }));
          });
      }
    };

    window.addEventListener('agent-response', handleAgentResponse as EventListener);
    
    return () => {
      window.removeEventListener('agent-response', handleAgentResponse as EventListener);
    };
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!state.isSupported) {
      throw new Error('Voice features not supported in this browser');
    }

    try {
      setState(prev => ({ ...prev, isListening: true, error: undefined }));
      await client.startRecording();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start listening';
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [client, state.isSupported]);

  // Stop listening
  const stopListening = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isListening: false, isProcessing: true }));
      await client.stopRecording();
    } catch (error) {
      console.error('Failed to stop listening:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [client]);

  // Send text command
  const sendTextCommand = useCallback(async (text: string) => {
    try {
      setState(prev => ({ 
        ...prev, 
        currentCommand: text, 
        isProcessing: true,
        error: undefined 
      }));

      // Process command locally and navigate if needed
      await processVoiceCommand(text, router);
      
      // Send to agent for response
      client.sendTextToAgent(text);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process command';
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [client, router]);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (state.isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  return {
    state,
    startListening,
    stopListening,
    sendTextCommand,
    toggleListening,
  };
}

// Process voice commands locally
async function processVoiceCommand(text: string, router: any): Promise<void> {
  const lowerText = text.toLowerCase();

  // Navigation commands
  if (lowerText.includes('dashboard')) {
    router.push('/dashboard');
  } else if (lowerText.includes('analytics')) {
    router.push('/analytics');
  } else if (lowerText.includes('impact')) {
    router.push('/impact');
  } else if (lowerText.includes('sustainability')) {
    router.push('/sustainability');
  } else if (lowerText.includes('explainability')) {
    router.push('/explainability');
  } else if (lowerText.includes('optimization')) {
    router.push('/optimization');
  } else if (lowerText.includes('scenarios')) {
    router.push('/scenarios');
  } else if (lowerText.includes('digital twin')) {
    router.push('/digital-twin');
  }

  // API calls for data commands
  if (lowerText.includes('risk') && process.env.NEXT_PUBLIC_ANALYZE_RISKS_URL) {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_ANALYZE_RISKS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: 'asia' }),
      });
      const data = await response.json();
      console.log('Risk analysis result:', data);
    } catch (error) {
      console.error('Risk analysis failed:', error);
    }
  }

  if (lowerText.includes('scenario') && process.env.NEXT_PUBLIC_RUN_SCENARIO_URL) {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_RUN_SCENARIO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scenarioType: 'port_closure', 
          region: 'asia' 
        }),
      });
      const data = await response.json();
      console.log('Scenario result:', data);
    } catch (error) {
      console.error('Scenario simulation failed:', error);
    }
  }
}