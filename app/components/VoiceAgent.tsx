'use client';

import { useConversation } from '@elevenlabs/react';
import { useEffect, useCallback, useState } from 'react';
import { ELEVENLABS_CONFIG, createElevenLabsError, ELEVENLABS_ERRORS, type ElevenLabsError } from '@/lib/elevenlabs';

// Re-export types and hook from the standalone hook file
export type { Message, ConnectionStatus, UseVoiceAgentReturn } from '../hooks/useVoiceAgent';
export { useVoiceAgent } from '../hooks/useVoiceAgent';

// Local type definitions for the component
interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'idle';

export interface VoiceAgentProps {
  agentId: string;
  onTranscriptUpdate?: (messages: Message[]) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: ElevenLabsError) => void;
}

/**
 * VoiceAgent Component
 *
 * A component wrapper for voice interactions that manages state and provides callbacks.
 * For most use cases, prefer using the `useVoiceAgent` hook directly instead.
 *
 * This component is useful when you need:
 * - Prop-based callbacks (onTranscriptUpdate, onStatusChange, onError)
 * - Screen reader announcements for accessibility
 * - Legacy integration with class components
 */
export default function VoiceAgent({
  agentId,
  onTranscriptUpdate,
  onStatusChange,
  onError,
}: VoiceAgentProps): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStatus, setCurrentStatus] = useState<ConnectionStatus>('disconnected');

  const updateStatus = useCallback((status: ConnectionStatus) => {
    setCurrentStatus(status);
    onStatusChange?.(status);
  }, [onStatusChange]);

  const conversation = useConversation({
    agentId: agentId || ELEVENLABS_CONFIG.agentId,
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      updateStatus('connected');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      updateStatus('disconnected');
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      const voiceError = createElevenLabsError(
        ELEVENLABS_ERRORS.CONNECTION_FAILED,
        String(error) || 'Connection failed',
        true
      );
      onError?.(voiceError);
      updateStatus('disconnected');
    },
    onMessage: (message) => {
      console.log('Message received:', message);

      // Add message to transcript
      // Note: 'source' is deprecated in newer SDK versions, using 'role' as fallback
      const messageSource = (message as { source?: string; role?: string }).source
        ?? (message as { role?: string }).role;
      const newMessage: Message = {
        role: messageSource === 'user' ? 'user' : 'agent',
        content: message.message,
        timestamp: new Date(),
      };

      setMessages(prev => {
        const updated = [...prev, newMessage];
        onTranscriptUpdate?.(updated);
        return updated;
      });
    },
    onStatusChange: (status) => {
      console.log('Status changed:', status);

      // Map ElevenLabs status to our ConnectionStatus
      const statusValue = status.status;

      if (statusValue === 'connecting') {
        updateStatus('connecting');
      } else if (statusValue === 'connected') {
        updateStatus('connected');
      } else if (statusValue === 'disconnected') {
        updateStatus('disconnected');
      } else {
        // For any other status, try to map it or default to connected
        console.log('Unknown status, defaulting to connected:', statusValue);
        updateStatus('connected');
      }
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentStatus !== 'disconnected') {
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation, currentStatus]);

  // Validate agent ID
  useEffect(() => {
    if (!agentId && !ELEVENLABS_CONFIG.agentId) {
      const error = createElevenLabsError(
        ELEVENLABS_ERRORS.AGENT_NOT_FOUND,
        'ElevenLabs Agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID environment variable.',
        false
      );
      onError?.(error);
    }
  }, [agentId, onError]);

  return (
    <div className="voice-agent">
      {/* This component manages voice interaction state but doesn't render UI */}
      {/* UI is handled by parent components like VoiceButton and Transcript */}
      <div className="sr-only" aria-live="polite">
        Voice status: {currentStatus}
        {messages.length > 0 && (
          <div>
            Latest message: {messages[messages.length - 1]?.content}
          </div>
        )}
      </div>
    </div>
  );
  // Note: For programmatic voice control, use the useVoiceAgent hook instead.
  // This component is primarily for props-based callbacks and accessibility.
}
