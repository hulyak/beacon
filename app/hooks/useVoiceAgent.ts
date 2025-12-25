'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';
import { ELEVENLABS_CONFIG, createElevenLabsError, ELEVENLABS_ERRORS, type ElevenLabsError } from '@/lib/elevenlabs';
import { checkMicrophoneSupport, requestMicrophonePermission } from '../components/MicrophonePermissionModal';

export interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'idle';

export interface UseVoiceAgentReturn {
  messages: Message[];
  status: ConnectionStatus;
  error: ElevenLabsError | null;
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
  clearError: () => void;
  isConnected: boolean;
  isActive: boolean;
}

/**
 * Custom hook to manage ElevenLabs voice conversation state
 * Provides a clean API for voice interactions with proper error handling
 */
export function useVoiceAgent(agentId: string): UseVoiceAgentReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<ElevenLabsError | null>(null);

  const conversation = useConversation({
    agentId: agentId || ELEVENLABS_CONFIG.agentId,
    onConnect: () => {
      setStatus('connected');
      setError(null);
    },
    onDisconnect: () => {
      setStatus('disconnected');
    },
    onError: (err) => {
      const voiceError = createElevenLabsError(
        ELEVENLABS_ERRORS.CONNECTION_FAILED,
        String(err) || 'Connection failed',
        true
      );
      setError(voiceError);
      setStatus('disconnected');
    },
    onMessage: (message) => {
      // Note: 'source' is deprecated in newer SDK versions, using 'role' as fallback
      const messageSource = (message as { source?: string; role?: string }).source
        ?? (message as { role?: string }).role;
      const newMessage: Message = {
        role: messageSource === 'user' ? 'user' : 'agent',
        content: message.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onStatusChange: (statusUpdate) => {
      switch (statusUpdate.status) {
        case 'connecting':
          setStatus('connecting');
          break;
        case 'connected':
          setStatus('connected');
          break;
        case 'disconnected':
          setStatus('disconnected');
          break;
        default:
          // For any other status, log and default to connected
          console.log('Unknown status in useVoiceAgent:', statusUpdate.status);
          setStatus('connected');
          break;
      }
    },
  });

  const startConversation = useCallback(async () => {
    try {
      // Check microphone support first
      const supportCheck = checkMicrophoneSupport();
      if (!supportCheck.isSupported) {
        const voiceError = createElevenLabsError(
          ELEVENLABS_ERRORS.MICROPHONE_ERROR,
          supportCheck.error || 'Microphone not supported',
          false
        );
        setError(voiceError);
        return;
      }

      setStatus('connecting');
      setError(null);

      // Request microphone permission with detailed error handling
      const permissionResult = await requestMicrophonePermission();
      if (!permissionResult.granted) {
        const voiceError = createElevenLabsError(
          ELEVENLABS_ERRORS.PERMISSION_DENIED,
          permissionResult.error || 'Microphone permission denied. Please enable microphone access to use voice features.',
          true
        );
        setError(voiceError);
        setStatus('disconnected');
        return;
      }

      // Start the conversation
      await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket'
      });
    } catch (err) {
      const voiceError = createElevenLabsError(
        ELEVENLABS_ERRORS.CONNECTION_FAILED,
        err instanceof Error ? err.message : 'Failed to start conversation',
        true
      );
      setError(voiceError);
      setStatus('disconnected');
    }
  }, [agentId, conversation]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setStatus('disconnected');
    } catch (err) {
      console.error('Failed to end conversation:', err);
      setStatus('disconnected');
    }
  }, [conversation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    status,
    error,
    startConversation,
    endConversation,
    clearError,
    isConnected: status === 'connected' || status === 'listening' || status === 'speaking',
    isActive: status === 'listening' || status === 'speaking',
  };
}

export default useVoiceAgent;
