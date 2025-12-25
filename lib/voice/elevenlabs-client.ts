// ElevenLabs Voice Client - Real Integration
import { VoiceCommand, VoiceResponse } from '@/lib/types/voice-types';

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface ConversationConfig {
  agentId: string;
  signedUrl?: string;
}

export class ElevenLabsVoiceClient {
  private config: ElevenLabsConfig;
  private conversationId: string | null = null;
  private websocket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  /**
   * Initialize voice conversation with ElevenLabs Conversational AI
   */
  async initializeConversation(conversationConfig: ConversationConfig): Promise<string> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          agent_id: conversationConfig.agentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize conversation: ${response.statusText}`);
      }

      const data = await response.json();
      this.conversationId = data.conversation_id;
      
      return data.conversation_id;
    } catch (error) {
      console.error('ElevenLabs conversation initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start real-time voice conversation via WebSocket
   */
  async startVoiceConversation(
    conversationId: string,
    onMessage: (message: any) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;
      
      this.websocket = new WebSocket(wsUrl, [], {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      } as any);

      this.websocket.onopen = () => {
        console.log('ElevenLabs WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('ElevenLabs WebSocket error:', error);
        onError(new Error('WebSocket connection failed'));
      };

      this.websocket.onclose = () => {
        console.log('ElevenLabs WebSocket disconnected');
      };

    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      throw error;
    }
  }

  /**
   * Send audio data to ElevenLabs
   */
  sendAudioData(audioData: ArrayBuffer): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(audioData);
    }
  }

  /**
   * Send text message to conversation
   */
  sendTextMessage(message: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'message',
        message: message,
      };
      this.websocket.send(JSON.stringify(payload));
    }
  }

  /**
   * Start recording audio from microphone
   */
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          
          // Send audio data in real-time
          event.data.arrayBuffer().then((buffer) => {
            this.sendAudioData(buffer);
          });
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };
        this.mediaRecorder.stop();
        
        // Stop all tracks
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    });
  }

  /**
   * Text-to-Speech using ElevenLabs
   */
  async textToSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: this.config.modelId || 'eleven_monolingual_v1',
          voice_settings: {
            stability: this.config.stability || 0.5,
            similarity_boost: this.config.similarityBoost || 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Text-to-speech failed:', error);
      throw error;
    }
  }

  /**
   * Play audio from ArrayBuffer
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    try {
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

      return new Promise((resolve) => {
        source.onended = () => resolve();
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string): Promise<any[]> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get conversation history: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      throw error;
    }
  }
}

// Utility functions for voice processing
export const VoiceUtils = {
  /**
   * Check if browser supports required APIs
   */
  checkBrowserSupport(): { supported: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!navigator.mediaDevices?.getUserMedia) {
      missing.push('getUserMedia');
    }
    
    if (!window.MediaRecorder) {
      missing.push('MediaRecorder');
    }
    
    if (!window.WebSocket) {
      missing.push('WebSocket');
    }
    
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      missing.push('AudioContext');
    }

    return {
      supported: missing.length === 0,
      missing,
    };
  },

  /**
   * Request microphone permissions
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  },

  /**
   * Convert audio blob to base64
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:audio/webm;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
};