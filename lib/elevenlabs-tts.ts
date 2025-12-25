/**
 * ElevenLabs Text-to-Speech Service
 * Provides voice synthesis capabilities for the application
 */

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
}

// Pre-configured voices for supply chain assistant
export const BEACON_VOICES: VoiceOption[] = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    name: 'Sarah',
    description: 'Professional female voice - clear and confident',
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM', // Rachel
    name: 'Rachel',
    description: 'Warm female voice - friendly and approachable',
  },
  {
    id: 'ErXwobaYiN019PkySvjV', // Antoni
    name: 'Antoni',
    description: 'Professional male voice - authoritative',
  },
  {
    id: 'VR6AewLTigWG4xSOukaG', // Arnold
    name: 'Arnold',
    description: 'Deep male voice - commanding presence',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB', // Adam
    name: 'Adam',
    description: 'Natural male voice - conversational',
  },
];

export interface TTSConfig {
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

export interface TTSResponse {
  audioUrl: string;
  audioBlob: Blob;
  duration?: number;
}

const DEFAULT_CONFIG: TTSConfig = {
  voiceId: BEACON_VOICES[0].id,
  modelId: 'eleven_multilingual_v2',
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.5,
  speakerBoost: true,
};

class ElevenLabsTTSService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private audioCache = new Map<string, Blob>();
  private currentAudio: HTMLAudioElement | null = null;
  private config: TTSConfig;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Check if TTS is available (API key configured)
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Set the voice to use for synthesis
   */
  setVoice(voiceId: string): void {
    this.config.voiceId = voiceId;
  }

  /**
   * Update TTS configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate speech from text
   */
  async synthesize(text: string, config?: Partial<TTSConfig>): Promise<TTSResponse> {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured');
    }

    const finalConfig = { ...this.config, ...config };
    const cacheKey = `${finalConfig.voiceId}-${text}`;

    // Check cache first
    const cached = this.audioCache.get(cacheKey);
    if (cached) {
      return {
        audioUrl: URL.createObjectURL(cached),
        audioBlob: cached,
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${finalConfig.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: finalConfig.modelId,
            voice_settings: {
              stability: finalConfig.stability,
              similarity_boost: finalConfig.similarityBoost,
              style: finalConfig.style,
              use_speaker_boost: finalConfig.speakerBoost,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS API error: ${response.status} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache the result
      this.audioCache.set(cacheKey, audioBlob);

      // Limit cache size
      if (this.audioCache.size > 50) {
        const firstKey = this.audioCache.keys().next().value;
        if (firstKey) this.audioCache.delete(firstKey);
      }

      return { audioUrl, audioBlob };
    } catch (error) {
      console.error('TTS synthesis error:', error);
      throw error;
    }
  }

  /**
   * Speak text immediately (synthesize and play)
   */
  async speak(text: string, config?: Partial<TTSConfig>): Promise<void> {
    // Stop any currently playing audio
    this.stop();

    const { audioUrl } = await this.synthesize(text, config);

    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.onended = () => {
        this.currentAudio = null;
        resolve();
      };
      this.currentAudio.onerror = (e) => {
        this.currentAudio = null;
        reject(e);
      };
      this.currentAudio.play().catch(reject);
    });
  }

  /**
   * Stop current audio playback
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  /**
   * Clear the audio cache
   */
  clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * Get available voices
   */
  getVoices(): VoiceOption[] {
    return BEACON_VOICES;
  }

  /**
   * Fetch voices from API (requires API key)
   */
  async fetchVoices(): Promise<VoiceOption[]> {
    if (!this.isAvailable()) {
      return BEACON_VOICES;
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      return data.voices.map((voice: { voice_id: string; name: string; description?: string; preview_url?: string }) => ({
        id: voice.voice_id,
        name: voice.name,
        description: voice.description || '',
        previewUrl: voice.preview_url,
      }));
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return BEACON_VOICES;
    }
  }
}

// Singleton instance
export const ttsService = new ElevenLabsTTSService();

// Quick speak function for simple use cases
export async function speak(text: string): Promise<void> {
  return ttsService.speak(text);
}

// Stop speaking
export function stopSpeaking(): void {
  ttsService.stop();
}

export default ttsService;
