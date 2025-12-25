/**
 * ElevenLabs configuration and utilities for Beacon
 */

export const ELEVENLABS_CONFIG = {
  agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
  apiUrl: 'https://api.elevenlabs.io',
} as const;

export interface ElevenLabsError {
  code: string;
  message: string;
  recoverable: boolean;
}

export const createElevenLabsError = (
  code: string,
  message: string,
  recoverable: boolean = true
): ElevenLabsError => ({
  code,
  message,
  recoverable,
});

// Common error codes
export const ELEVENLABS_ERRORS = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  MICROPHONE_ERROR: 'MICROPHONE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;