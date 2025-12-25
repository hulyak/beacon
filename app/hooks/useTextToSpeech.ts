'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ttsService, type VoiceOption, type TTSConfig, BEACON_VOICES } from '@/lib/elevenlabs-tts';

export type TTSStatus = 'idle' | 'loading' | 'speaking' | 'error';

export interface UseTextToSpeechReturn {
  // Status
  status: TTSStatus;
  isSpeaking: boolean;
  isLoading: boolean;
  isAvailable: boolean;
  error: string | null;

  // Actions
  speak: (text: string) => Promise<void>;
  stop: () => void;
  clearError: () => void;

  // Voice settings
  voices: VoiceOption[];
  currentVoice: string;
  setVoice: (voiceId: string) => void;

  // Queue management
  queue: string[];
  addToQueue: (text: string) => void;
  clearQueue: () => void;
}

export function useTextToSpeech(initialVoiceId?: string): UseTextToSpeechReturn {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentVoice, setCurrentVoice] = useState(initialVoiceId || BEACON_VOICES[0].id);
  const [queue, setQueue] = useState<string[]>([]);
  const isProcessingQueue = useRef(false);

  const isAvailable = ttsService.isAvailable();

  // Process queue
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingQueue.current || queue.length === 0 || status === 'speaking') {
        return;
      }

      isProcessingQueue.current = true;
      const [nextText, ...remaining] = queue;
      setQueue(remaining);

      try {
        setStatus('loading');
        setError(null);
        await ttsService.speak(nextText, { voiceId: currentVoice });
        setStatus('idle');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Speech synthesis failed');
        setStatus('error');
      } finally {
        isProcessingQueue.current = false;
      }
    };

    processQueue();
  }, [queue, status, currentVoice]);

  const speak = useCallback(async (text: string) => {
    if (!isAvailable) {
      // Fallback to browser TTS if ElevenLabs not configured
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        setStatus('speaking');
        utterance.onend = () => setStatus('idle');
        utterance.onerror = () => {
          setError('Browser speech synthesis failed');
          setStatus('error');
        };
        window.speechSynthesis.speak(utterance);
        return;
      }
      setError('Text-to-speech not available');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setError(null);
      await ttsService.speak(text, { voiceId: currentVoice });
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech synthesis failed');
      setStatus('error');
    }
  }, [isAvailable, currentVoice]);

  const stop = useCallback(() => {
    ttsService.stop();
    // Also stop browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
    setQueue([]);
    isProcessingQueue.current = false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  const setVoice = useCallback((voiceId: string) => {
    setCurrentVoice(voiceId);
    ttsService.setVoice(voiceId);
  }, []);

  const addToQueue = useCallback((text: string) => {
    setQueue(prev => [...prev, text]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Update status when audio finishes
  useEffect(() => {
    const checkPlaying = setInterval(() => {
      if (status === 'speaking' && !ttsService.isPlaying()) {
        setStatus('idle');
      }
    }, 100);

    return () => clearInterval(checkPlaying);
  }, [status]);

  return {
    status,
    isSpeaking: status === 'speaking',
    isLoading: status === 'loading',
    isAvailable,
    error,
    speak,
    stop,
    clearError,
    voices: BEACON_VOICES,
    currentVoice,
    setVoice,
    queue,
    addToQueue,
    clearQueue,
  };
}

export default useTextToSpeech;
