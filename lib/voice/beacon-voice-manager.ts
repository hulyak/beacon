// Beacon Voice Manager - Complete Voice Integration
import { ElevenLabsVoiceClient, VoiceUtils } from './elevenlabs-client';
import { 
  VoiceCommand, 
  VoiceResponse, 
  VoiceSession, 
  VoiceUIState, 
  SupplyChainIntent,
  SupplyChainVoiceCommand,
  VoiceActionType 
} from '@/lib/types/voice-types';

export interface BeaconVoiceConfig {
  elevenLabsApiKey: string;
  agentId: string;
  voiceId: string;
  enableRealTimeProcessing: boolean;
  autoPlayResponses: boolean;
  wakeWordEnabled: boolean;
  debugMode: boolean;
}

export class BeaconVoiceManager {
  private client: ElevenLabsVoiceClient;
  private config: BeaconVoiceConfig;
  private currentSession: VoiceSession | null = null;
  private uiState: VoiceUIState;
  private listeners: Map<string, Function[]> = new Map();
  private commandQueue: VoiceCommand[] = [];
  private isProcessingQueue = false;

  constructor(config: BeaconVoiceConfig) {
    this.config = config;
    this.client = new ElevenLabsVoiceClient({
      apiKey: config.elevenLabsApiKey,
      voiceId: config.voiceId,
      stability: 0.7,
      similarityBoost: 0.8,
    });

    this.uiState = {
      isListening: false,
      isProcessing: false,
      isPlaying: false,
      connectionStatus: 'disconnected',
      microphonePermission: 'prompt',
    };

    this.initializeVoiceSystem();
  }

  /**
   * Initialize the voice system
   */
  private async initializeVoiceSystem(): Promise<void> {
    try {
      // Check browser support
      const support = VoiceUtils.checkBrowserSupport();
      if (!support.supported) {
        throw new Error(`Browser missing required APIs: ${support.missing.join(', ')}`);
      }

      // Request microphone permission
      const hasPermission = await VoiceUtils.requestMicrophonePermission();
      this.uiState.microphonePermission = hasPermission ? 'granted' : 'denied';

      if (this.config.debugMode) {
        console.log('Beacon Voice Manager initialized', {
          browserSupport: support,
          microphonePermission: hasPermission,
        });
      }

      this.emit('initialized', { success: true });
    } catch (error) {
      console.error('Failed to initialize voice system:', error);
      this.emit('error', { error: error.message });
    }
  }

  /**
   * Start a new voice session
   */
  async startSession(): Promise<string> {
    try {
      this.updateUIState({ connectionStatus: 'connecting' });

      // Initialize ElevenLabs conversation
      const conversationId = await this.client.initializeConversation({
        agentId: this.config.agentId,
      });

      // Create new session
      this.currentSession = {
        id: `session_${Date.now()}`,
        conversationId,
        startTime: new Date(),
        commands: [],
        responses: [],
        context: {
          currentPage: window.location.pathname,
          selectedFilters: {},
          recentQueries: [],
          userPreferences: {
            voiceId: this.config.voiceId,
            speechRate: 1.0,
            volume: 1.0,
            autoPlay: this.config.autoPlayResponses,
            language: 'en-US',
          },
          sessionData: {},
        },
        isActive: true,
      };

      // Start WebSocket connection
      await this.client.startVoiceConversation(
        conversationId,
        this.handleElevenLabsMessage.bind(this),
        this.handleElevenLabsError.bind(this)
      );

      this.updateUIState({ connectionStatus: 'connected' });
      this.emit('sessionStarted', { sessionId: this.currentSession.id, conversationId });

      return this.currentSession.id;
    } catch (error) {
      console.error('Failed to start voice session:', error);
      this.updateUIState({ connectionStatus: 'error', error: error.message });
      throw error;
    }
  }

  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session. Call startSession() first.');
    }

    if (this.uiState.microphonePermission !== 'granted') {
      throw new Error('Microphone permission required');
    }

    try {
      this.updateUIState({ isListening: true });
      await this.client.startRecording();
      this.emit('listeningStarted');

      if (this.config.debugMode) {
        console.log('Started listening for voice commands');
      }
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.updateUIState({ isListening: false, error: error.message });
      throw error;
    }
  }

  /**
   * Stop listening for voice commands
   */
  async stopListening(): Promise<void> {
    try {
      this.updateUIState({ isListening: false, isProcessing: true });
      const audioBlob = await this.client.stopRecording();
      
      this.emit('listeningstopped', { audioData: audioBlob });

      if (this.config.debugMode) {
        console.log('Stopped listening, processing audio...');
      }
    } catch (error) {
      console.error('Failed to stop listening:', error);
      this.updateUIState({ isProcessing: false, error: error.message });
      throw error;
    }
  }

  /**
   * Process text command directly
   */
  async processTextCommand(text: string): Promise<VoiceResponse> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    try {
      this.updateUIState({ isProcessing: true, currentCommand: text });

      // Send text to ElevenLabs
      this.client.sendTextMessage(text);

      // Parse command intent
      const command = await this.parseCommand(text);
      this.currentSession.commands.push(command);

      // Add to processing queue
      this.commandQueue.push(command);
      this.processCommandQueue();

      this.emit('commandReceived', { command });

      // Return a placeholder response (actual response will come via WebSocket)
      return {
        id: `response_${Date.now()}`,
        text: 'Processing your request...',
        timestamp: new Date(),
        conversationId: this.currentSession.conversationId,
      };
    } catch (error) {
      console.error('Failed to process text command:', error);
      this.updateUIState({ isProcessing: false, error: error.message });
      throw error;
    }
  }

  /**
   * Handle messages from ElevenLabs
   */
  private handleElevenLabsMessage(message: any): void {
    try {
      if (this.config.debugMode) {
        console.log('ElevenLabs message:', message);
      }

      switch (message.type) {
        case 'audio':
          this.handleAudioResponse(message);
          break;
        case 'message':
          this.handleTextResponse(message);
          break;
        case 'status':
          this.handleStatusUpdate(message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling ElevenLabs message:', error);
    }
  }

  /**
   * Handle audio response from ElevenLabs
   */
  private async handleAudioResponse(message: any): Promise<void> {
    try {
      if (message.audio && this.config.autoPlayResponses) {
        this.updateUIState({ isPlaying: true });
        
        // Convert base64 to ArrayBuffer
        const audioData = Uint8Array.from(atob(message.audio), c => c.charCodeAt(0));
        
        // Play audio
        await this.client.playAudio(audioData.buffer);
        
        this.updateUIState({ isPlaying: false });
        this.emit('audioPlayed', { audioData: audioData.buffer });
      }
    } catch (error) {
      console.error('Failed to play audio response:', error);
      this.updateUIState({ isPlaying: false });
    }
  }

  /**
   * Handle text response from ElevenLabs
   */
  private handleTextResponse(message: any): void {
    if (!this.currentSession) return;

    const response: VoiceResponse = {
      id: `response_${Date.now()}`,
      text: message.message || message.text,
      timestamp: new Date(),
      conversationId: this.currentSession.conversationId,
    };

    this.currentSession.responses.push(response);
    this.updateUIState({ 
      isProcessing: false, 
      lastResponse: response.text,
      currentCommand: undefined 
    });

    this.emit('responseReceived', { response });
  }

  /**
   * Handle status updates from ElevenLabs
   */
  private handleStatusUpdate(message: any): void {
    if (this.config.debugMode) {
      console.log('Status update:', message);
    }
    
    this.emit('statusUpdate', { status: message });
  }

  /**
   * Handle ElevenLabs errors
   */
  private handleElevenLabsError(error: Error): void {
    console.error('ElevenLabs error:', error);
    this.updateUIState({ 
      connectionStatus: 'error', 
      error: error.message,
      isListening: false,
      isProcessing: false,
    });
    this.emit('error', { error: error.message });
  }

  /**
   * Parse voice command to extract intent and entities
   */
  private async parseCommand(text: string): Promise<SupplyChainVoiceCommand> {
    // Simple intent parsing (in production, use NLP service)
    const intent = this.extractIntent(text);
    const entities = this.extractEntities(text);

    return {
      id: `cmd_${Date.now()}`,
      text,
      intent,
      entities,
      confidence: 0.8, // Placeholder
      timestamp: new Date(),
    };
  }

  /**
   * Extract intent from text (simplified)
   */
  private extractIntent(text: string): { name: SupplyChainIntent; confidence: number; parameters?: any } {
    const lowerText = text.toLowerCase();

    // Analytics intents
    if (lowerText.includes('show') && (lowerText.includes('metrics') || lowerText.includes('analytics'))) {
      return { name: SupplyChainIntent.SHOW_METRICS, confidence: 0.9 };
    }
    
    if (lowerText.includes('risk') || lowerText.includes('risks')) {
      return { name: SupplyChainIntent.CHECK_RISKS, confidence: 0.9 };
    }
    
    if (lowerText.includes('scenario') || lowerText.includes('simulate')) {
      return { name: SupplyChainIntent.RUN_SCENARIO, confidence: 0.9 };
    }
    
    if (lowerText.includes('carbon') || lowerText.includes('sustainability')) {
      return { name: SupplyChainIntent.CARBON_FOOTPRINT, confidence: 0.9 };
    }
    
    if (lowerText.includes('navigate') || lowerText.includes('go to')) {
      return { name: SupplyChainIntent.NAVIGATE_TO, confidence: 0.9 };
    }

    // Default intent
    return { name: SupplyChainIntent.GET_HELP, confidence: 0.5 };
  }

  /**
   * Extract entities from text (simplified)
   */
  private extractEntities(text: string): any[] {
    const entities = [];
    const lowerText = text.toLowerCase();

    // Time ranges
    const timeRanges = ['today', 'yesterday', 'week', 'month', 'quarter', 'year'];
    timeRanges.forEach(range => {
      if (lowerText.includes(range)) {
        entities.push({
          type: 'timeRange',
          value: range,
          confidence: 0.9,
          startIndex: lowerText.indexOf(range),
          endIndex: lowerText.indexOf(range) + range.length,
        });
      }
    });

    // Regions
    const regions = ['asia', 'europe', 'americas', 'north america', 'south america'];
    regions.forEach(region => {
      if (lowerText.includes(region)) {
        entities.push({
          type: 'region',
          value: region,
          confidence: 0.9,
          startIndex: lowerText.indexOf(region),
          endIndex: lowerText.indexOf(region) + region.length,
        });
      }
    });

    return entities;
  }

  /**
   * Process command queue
   */
  private async processCommandQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift()!;
      await this.executeCommand(command);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute a voice command
   */
  private async executeCommand(command: SupplyChainVoiceCommand): Promise<void> {
    try {
      switch (command.intent.name) {
        case SupplyChainIntent.SHOW_METRICS:
          this.emit('action', { 
            type: VoiceActionType.NAVIGATE, 
            payload: { path: '/analytics' } 
          });
          break;
          
        case SupplyChainIntent.CHECK_RISKS:
          this.emit('action', { 
            type: VoiceActionType.NAVIGATE, 
            payload: { path: '/impact' } 
          });
          break;
          
        case SupplyChainIntent.RUN_SCENARIO:
          this.emit('action', { 
            type: VoiceActionType.NAVIGATE, 
            payload: { path: '/scenarios' } 
          });
          break;
          
        case SupplyChainIntent.CARBON_FOOTPRINT:
          this.emit('action', { 
            type: VoiceActionType.NAVIGATE, 
            payload: { path: '/sustainability' } 
          });
          break;
          
        case SupplyChainIntent.NAVIGATE_TO:
          // Extract destination from entities
          const destination = this.extractNavigationDestination(command.text);
          if (destination) {
            this.emit('action', { 
              type: VoiceActionType.NAVIGATE, 
              payload: { path: destination } 
            });
          }
          break;
          
        default:
          console.log('Unhandled command intent:', command.intent.name);
      }
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  }

  /**
   * Extract navigation destination from text
   */
  private extractNavigationDestination(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('dashboard')) return '/dashboard';
    if (lowerText.includes('analytics')) return '/analytics';
    if (lowerText.includes('impact')) return '/impact';
    if (lowerText.includes('sustainability')) return '/sustainability';
    if (lowerText.includes('explainability')) return '/explainability';
    if (lowerText.includes('optimization')) return '/optimization';
    if (lowerText.includes('scenarios')) return '/scenarios';
    if (lowerText.includes('digital twin')) return '/digital-twin';
    
    return null;
  }

  /**
   * Update UI state and notify listeners
   */
  private updateUIState(updates: Partial<VoiceUIState>): void {
    this.uiState = { ...this.uiState, ...updates };
    this.emit('stateChanged', { state: this.uiState });
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
   * Get current state
   */
  getState(): VoiceUIState {
    return { ...this.uiState };
  }

  /**
   * Get current session
   */
  getSession(): VoiceSession | null {
    return this.currentSession;
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentSession.isActive = false;
    }

    this.client.disconnect();
    this.updateUIState({ 
      connectionStatus: 'disconnected',
      isListening: false,
      isProcessing: false,
      isPlaying: false,
    });

    this.emit('sessionEnded', { sessionId: this.currentSession?.id });
    this.currentSession = null;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.endSession();
    this.listeners.clear();
    this.commandQueue = [];
  }
}