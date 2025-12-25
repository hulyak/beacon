// Voice System Types
export interface VoiceCommand {
  id: string;
  text: string;
  intent: VoiceIntent;
  entities: VoiceEntity[];
  confidence: number;
  timestamp: Date;
  audioData?: Blob;
}

export interface VoiceResponse {
  id: string;
  text: string;
  audioData?: ArrayBuffer;
  actions?: VoiceAction[];
  timestamp: Date;
  conversationId: string;
}

export interface VoiceIntent {
  name: string;
  confidence: number;
  parameters?: Record<string, any>;
}

export interface VoiceEntity {
  type: string;
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface VoiceAction {
  type: VoiceActionType;
  payload: any;
  target?: string;
}

export enum VoiceActionType {
  NAVIGATE = 'navigate',
  QUERY_DATA = 'query_data',
  RUN_ANALYSIS = 'run_analysis',
  UPDATE_DASHBOARD = 'update_dashboard',
  GENERATE_REPORT = 'generate_report',
  SET_ALERT = 'set_alert',
  SHOW_CHART = 'show_chart',
  FILTER_DATA = 'filter_data',
  EXPORT_DATA = 'export_data',
  SCHEDULE_TASK = 'schedule_task',
}

export interface VoiceSession {
  id: string;
  conversationId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  commands: VoiceCommand[];
  responses: VoiceResponse[];
  context: VoiceContext;
  isActive: boolean;
}

export interface VoiceContext {
  currentPage: string;
  selectedFilters: Record<string, any>;
  recentQueries: string[];
  userPreferences: VoicePreferences;
  sessionData: Record<string, any>;
}

export interface VoicePreferences {
  voiceId: string;
  speechRate: number;
  volume: number;
  autoPlay: boolean;
  language: string;
  wakeWord?: string;
}

export interface VoiceAnalytics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageResponseTime: number;
  mostUsedIntents: Array<{ intent: string; count: number }>;
  userSatisfactionScore: number;
  sessionDuration: number;
}

// Supply Chain Specific Voice Intents
export enum SupplyChainIntent {
  // Analytics
  SHOW_METRICS = 'show_metrics',
  COMPARE_PERFORMANCE = 'compare_performance',
  ANALYZE_TRENDS = 'analyze_trends',
  
  // Risk Management
  CHECK_RISKS = 'check_risks',
  ASSESS_IMPACT = 'assess_impact',
  SHOW_ALERTS = 'show_alerts',
  
  // Scenarios
  RUN_SCENARIO = 'run_scenario',
  SIMULATE_DISRUPTION = 'simulate_disruption',
  PREDICT_OUTCOMES = 'predict_outcomes',
  
  // Sustainability
  CARBON_FOOTPRINT = 'carbon_footprint',
  GREEN_ALTERNATIVES = 'green_alternatives',
  SUSTAINABILITY_SCORE = 'sustainability_score',
  
  // Digital Twin
  SHOW_NETWORK = 'show_network',
  TRACK_SHIPMENTS = 'track_shipments',
  VISUALIZE_FLOW = 'visualize_flow',
  
  // General
  NAVIGATE_TO = 'navigate_to',
  EXPORT_DATA = 'export_data',
  SCHEDULE_REPORT = 'schedule_report',
  GET_HELP = 'get_help',
}

export interface SupplyChainVoiceCommand extends VoiceCommand {
  intent: {
    name: SupplyChainIntent;
    confidence: number;
    parameters?: {
      timeRange?: string;
      region?: string;
      supplier?: string;
      product?: string;
      metric?: string;
      threshold?: number;
      scenarioType?: string;
      [key: string]: any;
    };
  };
}

// Voice UI State
export interface VoiceUIState {
  isListening: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  currentCommand?: string;
  lastResponse?: string;
  error?: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  microphonePermission: 'granted' | 'denied' | 'prompt';
}

// ElevenLabs Specific Types
export interface ElevenLabsMessage {
  type: 'message' | 'audio' | 'status' | 'error';
  data: any;
  timestamp: number;
}

export interface ElevenLabsAudioChunk {
  audio: string; // base64 encoded audio
  isFinal: boolean;
  normalizedAlignment?: {
    chars: Array<{
      char: string;
      startTimeMs: number;
      durationMs: number;
    }>;
  };
}

export interface ElevenLabsConversationState {
  conversationId: string;
  agentId: string;
  status: 'active' | 'paused' | 'ended';
  participantCount: number;
  startedAt: string;
  lastActivity: string;
}