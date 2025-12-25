// Simple Voice Manager - TTS + Browser Speech Recognition
import { SimpleElevenLabsClient, BrowserSpeechClient, BrowserSpeechSynthesis } from './simple-elevenlabs-client';

export interface SimpleVoiceConfig {
  elevenLabsApiKey: string;
  voiceId: string;
  enableElevenLabs: boolean;
  enableBrowserFallback: boolean;
  debugMode: boolean;
  autoSpeak?: boolean; // New option to control automatic speech
}

export interface SimpleVoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  microphonePermission: 'granted' | 'denied' | 'prompt';
  error?: string;
  lastCommand?: string;
  lastResponse?: string;
}

export class SimpleVoiceManager {
  private config: SimpleVoiceConfig;
  private elevenLabsClient: SimpleElevenLabsClient | null = null;
  private browserSpeechClient: BrowserSpeechClient | null = null;
  private browserSynthesis: BrowserSpeechSynthesis | null = null;
  private state: SimpleVoiceState;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: SimpleVoiceConfig) {
    this.config = config;
    
    this.state = {
      isListening: false,
      isProcessing: false,
      isPlaying: false,
      connectionStatus: 'disconnected',
      microphonePermission: 'prompt',
    };

    this.initializeClients();
  }

  private initializeClients(): void {
    try {
      // Initialize ElevenLabs client if enabled
      if (this.config.enableElevenLabs && this.config.elevenLabsApiKey && this.config.voiceId) {
        this.elevenLabsClient = new SimpleElevenLabsClient({
          apiKey: this.config.elevenLabsApiKey,
          voiceId: this.config.voiceId,
          stability: 0.7,
          similarityBoost: 0.8,
        });
        
        if (this.config.debugMode) {
          console.log('ElevenLabs client initialized');
        }
      }

      // Initialize browser clients if enabled
      if (this.config.enableBrowserFallback) {
        this.browserSpeechClient = new BrowserSpeechClient();
        this.browserSynthesis = new BrowserSpeechSynthesis();
        
        if (this.config.debugMode) {
          console.log('Browser speech clients initialized');
        }
      }

      this.updateState({ connectionStatus: 'connected' });
      this.emit('initialized', { success: true });
      
    } catch (error) {
      console.error('Failed to initialize voice clients:', error);
      this.updateState({ 
        connectionStatus: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      this.emit('error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    try {
      this.updateState({ isListening: true });

      let transcript = '';

      // Try browser speech recognition first (more reliable)
      if (this.browserSpeechClient && this.browserSpeechClient.isSupported()) {
        transcript = await this.browserSpeechClient.startListening();
      } else {
        throw new Error('Speech recognition not available');
      }

      this.updateState({ 
        isListening: false, 
        isProcessing: true,
        lastCommand: transcript 
      });

      // Process the command
      await this.processCommand(transcript);

    } catch (error) {
      console.error('Failed to listen:', error);
      this.updateState({ 
        isListening: false, 
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.browserSpeechClient) {
      this.browserSpeechClient.stopListening();
    }
    this.updateState({ isListening: false });
  }

  /**
   * Process a voice command
   */
  async processCommand(text: string): Promise<void> {
    try {
      if (this.config.debugMode) {
        console.log('Processing command:', text);
      }

      this.updateState({ isProcessing: true, lastCommand: text });

      // Simple command processing
      const response = this.generateResponse(text);
      
      this.updateState({ 
        isProcessing: false, 
        lastResponse: response 
      });

      // Speak the response only if autoSpeak is enabled
      if (this.config.autoSpeak !== false) {
        await this.speakText(response);
      }

      this.emit('commandProcessed', { command: text, response });

    } catch (error) {
      console.error('Failed to process command:', error);
      this.updateState({ 
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Generate a response to a command (simple pattern matching)
   */
  private generateResponse(command: string): string {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('analytics') || lowerCommand.includes('metrics')) {
      return 'Displaying analytics dashboard with current performance metrics and trends.';
    }
    
    if (lowerCommand.includes('anomal') || lowerCommand.includes('scan')) {
      return 'Scanning supply chain network for anomalies and potential risks.';
    }
    
    if (lowerCommand.includes('scenario') || lowerCommand.includes('simulation')) {
      return 'Running supply chain disruption scenario analysis.';
    }
    
    if (lowerCommand.includes('sustainability') || lowerCommand.includes('carbon')) {
      return 'Showing sustainability metrics and carbon footprint analysis.';
    }
    
    if (lowerCommand.includes('impact') || lowerCommand.includes('risk')) {
      return 'Analyzing potential impact and risk assessment for supply chain operations.';
    }
    
    if (lowerCommand.includes('dashboard') || lowerCommand.includes('navigate')) {
      return 'Navigating to the requested dashboard section.';
    }

    return `Processing your request: "${command}". Analyzing supply chain data and generating insights.`;
  }

  /**
   * Speak text using TTS
   */
  async speakText(text: string): Promise<void> {
    if (!text) return;

    try {
      this.updateState({ isPlaying: true });

      // Try ElevenLabs TTS first
      if (this.elevenLabsClient) {
        try {
          const audioData = await this.elevenLabsClient.textToSpeech(text);
          await this.elevenLabsClient.playAudio(audioData);
          
          this.updateState({ isPlaying: false });
          this.emit('audioPlayed', { source: 'elevenlabs', text });
          return;
        } catch (error) {
          console.warn('ElevenLabs TTS failed, using browser fallback:', error);
        }
      }

      // Fallback to browser synthesis
      if (this.browserSynthesis) {
        await this.browserSynthesis.speak(text, {
          rate: 1.0,
          volume: 1.0,
          lang: 'en-US'
        });
        
        this.updateState({ isPlaying: false });
        this.emit('audioPlayed', { source: 'browser', text });
        return;
      }

      throw new Error('No TTS method available');

    } catch (error) {
      console.error('Failed to speak text:', error);
      this.updateState({ 
        isPlaying: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (this.browserSynthesis) {
      this.browserSynthesis.stop();
    }
    this.updateState({ isPlaying: false });
  }

  /**
   * Check microphone permission
   */
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      this.updateState({ microphonePermission: 'granted' });
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      this.updateState({ microphonePermission: 'denied' });
      return false;
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<SimpleVoiceState>): void {
    this.state = { ...this.state, ...updates };
    this.emit('stateChanged', { state: this.state });
  }

  /**
   * Event system
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Set auto-speak mode
   */
  setAutoSpeak(enabled: boolean): void {
    this.config.autoSpeak = enabled;
    if (this.config.debugMode) {
      console.log('Auto-speak set to:', enabled);
    }
  }
  getState(): SimpleVoiceState {
    return { ...this.state };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    this.listeners.clear();
  }
}