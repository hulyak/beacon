// Enhanced Voice Context Management System
// Requirement 6.2: Maintain context across multiple voice interactions
// Requirement 6.5: Seamlessly transition between analysis types
// Requirement 6.1: Parse multi-part requests and provide comprehensive responses
// Requirement 6.3: Voice-controlled navigation for visualizations
// Requirement 6.4: Natural language explanation of complex analytical concepts

interface VoiceSession {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  conversationTurns: ConversationTurn[];
  currentContext: SessionContext;
  preferences: UserVoicePreferences;
  metadata: SessionMetadata;
  analyticalContext: AnalyticalContext;
  visualizationState: VisualizationState;
  multiTurnQuery?: MultiTurnQuery;
}

interface ConversationTurn {
  id: string;
  timestamp: Date;
  userInput: string;
  processedIntent: string;
  entities: { [key: string]: any };
  agentResponse: string;
  confidence: number;
  contextBefore: Partial<SessionContext>;
  contextAfter: Partial<SessionContext>;
  followUpSuggestions: string[];
  wasSuccessful: boolean;
  analyticalResults?: AnalyticalResults;
  visualizationCommands?: VisualizationCommand[];
  clarificationRequests?: ClarificationRequest[];
  multiPartQuery?: boolean;
}

interface AnalyticalContext {
  activeAnalyses: ActiveAnalysis[];
  comparisonMode: boolean;
  baselineData?: any;
  comparisonData?: any;
  analysisHistory: AnalysisHistoryItem[];
  crossAnalysisConnections: CrossAnalysisConnection[];
  pendingCalculations: PendingCalculation[];
}

interface VisualizationState {
  activeCharts: ActiveChart[];
  currentView: string;
  zoomLevel: number;
  selectedDataPoints: DataPoint[];
  filterState: FilterState;
  navigationHistory: NavigationHistoryItem[];
  voiceControlEnabled: boolean;
}

interface MultiTurnQuery {
  id: string;
  startTime: Date;
  parts: QueryPart[];
  expectedParts: number;
  currentPart: number;
  isComplete: boolean;
  aggregatedIntent: string;
  combinedEntities: { [key: string]: any };
  finalResponse?: string;
}

interface ActiveAnalysis {
  id: string;
  type: 'impact' | 'explainability' | 'sustainability' | 'optimization' | 'analytics';
  status: 'pending' | 'processing' | 'completed' | 'error';
  parameters: any;
  results?: any;
  startTime: Date;
  completionTime?: Date;
  dependencies: string[];
  priority: 'low' | 'medium' | 'high';
}

interface AnalyticalResults {
  analysisType: string;
  data: any;
  confidence: number;
  explanations: string[];
  visualizations: VisualizationSpec[];
  followUpAnalyses: string[];
  crossReferences: CrossReference[];
}

interface VisualizationCommand {
  type: 'navigate' | 'zoom' | 'filter' | 'highlight' | 'compare' | 'export';
  target: string;
  parameters: any;
  timestamp: Date;
  success: boolean;
}

interface ClarificationRequest {
  id: string;
  question: string;
  context: string;
  options?: string[];
  priority: 'low' | 'medium' | 'high';
  timeout: Date;
}

interface QueryPart {
  partNumber: number;
  text: string;
  intent: string;
  entities: { [key: string]: any };
  timestamp: Date;
  confidence: number;
}

interface CrossAnalysisConnection {
  fromAnalysis: string;
  toAnalysis: string;
  connectionType: 'dependency' | 'comparison' | 'validation' | 'enhancement';
  strength: number;
  description: string;
}

interface PendingCalculation {
  id: string;
  type: string;
  parameters: any;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  dependencies: string[];
  callback?: (result: any) => void;
}

interface ActiveChart {
  id: string;
  type: string;
  dataSource: string;
  isVoiceControlled: boolean;
  lastInteraction: Date;
  state: any;
}

interface DataPoint {
  id: string;
  chartId: string;
  coordinates: { x: number; y: number };
  value: any;
  metadata: any;
}

interface FilterState {
  timeRange?: { start: Date; end: Date };
  categories?: string[];
  thresholds?: { [key: string]: number };
  customFilters?: { [key: string]: any };
}

interface NavigationHistoryItem {
  timestamp: Date;
  from: string;
  to: string;
  trigger: 'voice' | 'click' | 'auto';
  context: any;
}

interface AnalysisHistoryItem {
  id: string;
  type: string;
  timestamp: Date;
  parameters: any;
  results: any;
  voiceQuery: string;
  confidence: number;
}

interface CrossReference {
  type: 'related_analysis' | 'supporting_data' | 'contradictory_finding' | 'validation';
  target: string;
  description: string;
  relevance: number;
}

interface VisualizationSpec {
  type: string;
  data: any;
  config: any;
  voiceDescription: string;
  interactionHints: string[];
}

interface SessionContext {
  currentPage: string;
  analysisType: 'impact' | 'explainability' | 'sustainability' | 'optimization' | 'analytics' | null;
  activeStrategy?: string;
  selectedTimeframe?: string;
  focusedMetric?: string;
  lastQuery?: string;
  lastResults?: any;
  pendingActions: PendingAction[];
  conversationState: 'greeting' | 'active' | 'clarifying' | 'concluding' | 'multi_turn' | 'comparing';
  topicHistory: string[];
  dataFilters: { [key: string]: any };
  voiceNavigationMode: boolean;
  explanationDepth: 'summary' | 'detailed' | 'comprehensive';
  comparisonContext?: ComparisonContext;
  visualizationFocus?: string;
}

interface ComparisonContext {
  items: ComparisonItem[];
  criteria: string[];
  mode: 'side_by_side' | 'overlay' | 'sequential';
  baselineItem?: string;
}

interface UserVoicePreferences {
  preferredVoice: string;
  speechRate: number; // 0.5 - 2.0
  volume: number; // 0.0 - 1.0
  autoSpeak: boolean;
  language: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: 'short' | 'medium' | 'long';
  sustainabilityPriority: 'low' | 'medium' | 'high';
  preferredAnalysisDepth: 'summary' | 'detailed' | 'comprehensive';
  voiceNavigationEnabled: boolean;
  autoExplainVisualizations: boolean;
  confirmActionsVerbally: boolean;
  multiTurnQueryTimeout: number; // seconds
  contextRetentionDuration: number; // minutes
}

interface ComparisonItem {
  id: string;
  type: string;
  data: any;
  label: string;
}

interface SessionMetadata {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browserInfo: string;
  location?: string;
  sessionDuration: number;
  interactionCount: number;
  successfulCommands: number;
  failedCommands: number;
  averageConfidence: number;
  voiceNavigationUsage: number;
  multiTurnQueries: number;
  visualizationInteractions: number;
  crossAnalysisRequests: number;
  clarificationRequests: number;
}

interface PendingAction {
  id: string;
  type: 'navigate' | 'calculate' | 'display' | 'export' | 'clarify';
  description: string;
  parameters: any;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt: Date;
}

interface ContextTransition {
  fromContext: Partial<SessionContext>;
  toContext: Partial<SessionContext>;
  trigger: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
}

class VoiceContextManager {
  private sessions = new Map<string, VoiceSession>();
  private contextTransitions = new Map<string, ContextTransition[]>();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CONVERSATION_TURNS = 50;
  private readonly MAX_TOPIC_HISTORY = 10;
  private readonly MAX_ACTIVE_ANALYSES = 5;
  private readonly MAX_VISUALIZATION_HISTORY = 20;
  private readonly MULTI_TURN_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Create or retrieve a voice session
   */
  getOrCreateSession(sessionId: string, userId?: string): VoiceSession {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = this.createNewSession(sessionId, userId);
      this.sessions.set(sessionId, session);
    } else {
      // Update last activity
      session.lastActivity = new Date();
    }

    return session;
  }

  private createNewSession(sessionId: string, userId?: string): VoiceSession {
    return {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      conversationTurns: [],
      currentContext: {
        currentPage: '/',
        analysisType: null,
        pendingActions: [],
        conversationState: 'greeting',
        topicHistory: [],
        dataFilters: {},
        voiceNavigationMode: false,
        explanationDepth: 'detailed'
      },
      preferences: {
        preferredVoice: 'Sarah',
        speechRate: 1.0,
        volume: 0.8,
        autoSpeak: true,
        language: 'en-US',
        riskTolerance: 'moderate',
        timeHorizon: 'medium',
        sustainabilityPriority: 'medium',
        preferredAnalysisDepth: 'detailed',
        voiceNavigationEnabled: true,
        autoExplainVisualizations: true,
        confirmActionsVerbally: false,
        multiTurnQueryTimeout: 300, // 5 minutes
        contextRetentionDuration: 30 // 30 minutes
      },
      metadata: {
        deviceType: this.detectDeviceType(),
        browserInfo: this.getBrowserInfo(),
        sessionDuration: 0,
        interactionCount: 0,
        successfulCommands: 0,
        failedCommands: 0,
        averageConfidence: 0,
        voiceNavigationUsage: 0,
        multiTurnQueries: 0,
        visualizationInteractions: 0,
        crossAnalysisRequests: 0,
        clarificationRequests: 0
      },
      analyticalContext: {
        activeAnalyses: [],
        comparisonMode: false,
        analysisHistory: [],
        crossAnalysisConnections: [],
        pendingCalculations: []
      },
      visualizationState: {
        activeCharts: [],
        currentView: 'dashboard',
        zoomLevel: 1.0,
        selectedDataPoints: [],
        filterState: {},
        navigationHistory: [],
        voiceControlEnabled: true
      }
    };
  }

  /**
   * Add a conversation turn to the session
   */
  addConversationTurn(
    sessionId: string,
    userInput: string,
    processedIntent: string,
    entities: { [key: string]: any },
    agentResponse: string,
    confidence: number,
    wasSuccessful: boolean = true,
    analyticalResults?: AnalyticalResults,
    visualizationCommands?: VisualizationCommand[],
    clarificationRequests?: ClarificationRequest[]
  ): ConversationTurn {
    const session = this.getOrCreateSession(sessionId);
    const contextBefore = { ...session.currentContext };

    const turn: ConversationTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userInput,
      processedIntent,
      entities,
      agentResponse,
      confidence,
      contextBefore,
      contextAfter: {}, // Will be filled after context update
      followUpSuggestions: [],
      wasSuccessful,
      analyticalResults,
      visualizationCommands,
      clarificationRequests,
      multiPartQuery: this.isMultiPartQuery(userInput)
    };

    // Update session metadata
    session.metadata.interactionCount++;
    if (wasSuccessful) {
      session.metadata.successfulCommands++;
    } else {
      session.metadata.failedCommands++;
    }

    // Track specific interaction types
    if (visualizationCommands && visualizationCommands.length > 0) {
      session.metadata.visualizationInteractions++;
    }
    
    if (clarificationRequests && clarificationRequests.length > 0) {
      session.metadata.clarificationRequests++;
    }

    if (turn.multiPartQuery) {
      session.metadata.multiTurnQueries++;
    }

    // Update average confidence
    const totalTurns = session.conversationTurns.length + 1;
    session.metadata.averageConfidence = 
      (session.metadata.averageConfidence * (totalTurns - 1) + confidence) / totalTurns;

    // Add to conversation history
    session.conversationTurns.push(turn);

    // Limit conversation history
    if (session.conversationTurns.length > this.MAX_CONVERSATION_TURNS) {
      session.conversationTurns = session.conversationTurns.slice(-this.MAX_CONVERSATION_TURNS);
    }

    return turn;
  }

  private isMultiPartQuery(input: string): boolean {
    const multiPartIndicators = [
      /and then/i,
      /after that/i,
      /also show/i,
      /compare.*with/i,
      /first.*then/i,
      /next/i,
      /followed by/i
    ];

    return multiPartIndicators.some(pattern => pattern.test(input));
  }

  /**
   * Update session context based on user interaction
   */
  updateContext(
    sessionId: string,
    contextUpdates: Partial<SessionContext>,
    trigger: string = 'user_interaction'
  ): boolean {
    const session = this.getOrCreateSession(sessionId);
    const fromContext = { ...session.currentContext };

    try {
      // Apply context updates
      session.currentContext = {
        ...session.currentContext,
        ...contextUpdates
      };

      // Update topic history
      if (contextUpdates.analysisType && 
          contextUpdates.analysisType !== fromContext.analysisType) {
        this.updateTopicHistory(session, contextUpdates.analysisType);
      }

      // Update conversation state
      this.updateConversationState(session, contextUpdates);

      // Record context transition
      this.recordContextTransition(sessionId, fromContext, session.currentContext, trigger);

      // Update the last conversation turn with new context
      if (session.conversationTurns.length > 0) {
        const lastTurn = session.conversationTurns[session.conversationTurns.length - 1];
        lastTurn.contextAfter = { ...session.currentContext };
      }

      return true;
    } catch (error) {
      console.error('Context update failed:', error);
      
      // Record failed transition
      this.recordContextTransition(
        sessionId, 
        fromContext, 
        session.currentContext, 
        trigger, 
        false, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return false;
    }
  }

  private updateTopicHistory(session: VoiceSession, newTopic: string): void {
    if (!session.currentContext.topicHistory.includes(newTopic)) {
      session.currentContext.topicHistory.push(newTopic);
      
      // Limit topic history
      if (session.currentContext.topicHistory.length > this.MAX_TOPIC_HISTORY) {
        session.currentContext.topicHistory = 
          session.currentContext.topicHistory.slice(-this.MAX_TOPIC_HISTORY);
      }
    }
  }

  private updateConversationState(
    session: VoiceSession, 
    contextUpdates: Partial<SessionContext>
  ): void {
    // Auto-update conversation state based on context
    if (contextUpdates.analysisType) {
      session.currentContext.conversationState = 'active';
    }

    if (contextUpdates.conversationState) {
      session.currentContext.conversationState = contextUpdates.conversationState;
    }
  }

  private recordContextTransition(
    sessionId: string,
    fromContext: Partial<SessionContext>,
    toContext: Partial<SessionContext>,
    trigger: string,
    success: boolean = true,
    reason?: string
  ): void {
    if (!this.contextTransitions.has(sessionId)) {
      this.contextTransitions.set(sessionId, []);
    }

    const transitions = this.contextTransitions.get(sessionId)!;
    transitions.push({
      fromContext,
      toContext,
      trigger,
      timestamp: new Date(),
      success,
      reason
    });

    // Limit transition history
    if (transitions.length > 100) {
      this.contextTransitions.set(sessionId, transitions.slice(-100));
    }
  }

  /**
   * Start a multi-turn query session
   */
  startMultiTurnQuery(
    sessionId: string,
    initialQuery: string,
    expectedParts: number = 2
  ): string {
    const session = this.getOrCreateSession(sessionId);
    const queryId = `mtq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    session.multiTurnQuery = {
      id: queryId,
      startTime: new Date(),
      parts: [{
        partNumber: 1,
        text: initialQuery,
        intent: '',
        entities: {},
        timestamp: new Date(),
        confidence: 0
      }],
      expectedParts,
      currentPart: 1,
      isComplete: false,
      aggregatedIntent: '',
      combinedEntities: {}
    };

    session.currentContext.conversationState = 'multi_turn';
    return queryId;
  }

  /**
   * Add a part to an ongoing multi-turn query
   */
  addQueryPart(
    sessionId: string,
    queryText: string,
    intent: string,
    entities: { [key: string]: any },
    confidence: number
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session?.multiTurnQuery || session.multiTurnQuery.isComplete) {
      return false;
    }

    const query = session.multiTurnQuery;
    query.currentPart++;

    query.parts.push({
      partNumber: query.currentPart,
      text: queryText,
      intent,
      entities,
      timestamp: new Date(),
      confidence
    });

    // Combine entities from all parts
    query.combinedEntities = { ...query.combinedEntities, ...entities };

    // Check if query is complete
    if (query.currentPart >= query.expectedParts) {
      query.isComplete = true;
      query.aggregatedIntent = this.aggregateIntents(query.parts);
      session.currentContext.conversationState = 'active';
    }

    return true;
  }

  private aggregateIntents(parts: QueryPart[]): string {
    const intents = parts.map(part => part.intent).filter(Boolean);
    
    // Simple aggregation logic - can be enhanced
    if (intents.includes('comparison')) return 'comparison';
    if (intents.length > 1) return 'multi_analysis';
    return intents[0] || 'unknown';
  }

  /**
   * Get the completed multi-turn query
   */
  getCompletedMultiTurnQuery(sessionId: string): MultiTurnQuery | null {
    const session = this.sessions.get(sessionId);
    if (!session?.multiTurnQuery?.isComplete) return null;
    
    return session.multiTurnQuery;
  }

  /**
   * Add an active analysis to the session
   */
  addActiveAnalysis(
    sessionId: string,
    type: ActiveAnalysis['type'],
    parameters: any,
    priority: ActiveAnalysis['priority'] = 'medium',
    dependencies: string[] = []
  ): string {
    const session = this.getOrCreateSession(sessionId);
    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const analysis: ActiveAnalysis = {
      id: analysisId,
      type,
      status: 'pending',
      parameters,
      startTime: new Date(),
      dependencies,
      priority
    };

    session.analyticalContext.activeAnalyses.push(analysis);

    // Limit active analyses
    if (session.analyticalContext.activeAnalyses.length > this.MAX_ACTIVE_ANALYSES) {
      // Remove oldest completed analysis
      const completedIndex = session.analyticalContext.activeAnalyses.findIndex(
        a => a.status === 'completed'
      );
      if (completedIndex !== -1) {
        session.analyticalContext.activeAnalyses.splice(completedIndex, 1);
      }
    }

    return analysisId;
  }

  /**
   * Update analysis status and results
   */
  updateAnalysisStatus(
    sessionId: string,
    analysisId: string,
    status: ActiveAnalysis['status'],
    results?: any
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const analysis = session.analyticalContext.activeAnalyses.find(a => a.id === analysisId);
    if (!analysis) return false;

    analysis.status = status;
    if (results) analysis.results = results;
    if (status === 'completed' || status === 'error') {
      analysis.completionTime = new Date();
    }

    // Add to analysis history if completed
    if (status === 'completed' && results) {
      session.analyticalContext.analysisHistory.push({
        id: analysisId,
        type: analysis.type,
        timestamp: new Date(),
        parameters: analysis.parameters,
        results,
        voiceQuery: session.conversationTurns[session.conversationTurns.length - 1]?.userInput || '',
        confidence: results.confidence || 0
      });
    }

    return true;
  }

  /**
   * Enable comparison mode between analyses
   */
  enableComparisonMode(
    sessionId: string,
    items: ComparisonItem[],
    criteria: string[] = [],
    mode: ComparisonContext['mode'] = 'side_by_side'
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.analyticalContext.comparisonMode = true;
    session.currentContext.comparisonContext = {
      items,
      criteria,
      mode,
      baselineItem: items[0]?.id
    };
    session.currentContext.conversationState = 'comparing';

    return true;
  }

  /**
   * Add cross-analysis connection
   */
  addCrossAnalysisConnection(
    sessionId: string,
    fromAnalysis: string,
    toAnalysis: string,
    connectionType: CrossAnalysisConnection['connectionType'],
    description: string,
    strength: number = 0.5
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.analyticalContext.crossAnalysisConnections.push({
      fromAnalysis,
      toAnalysis,
      connectionType,
      strength,
      description
    });

    session.metadata.crossAnalysisRequests++;
    return true;
  }

  /**
   * Control visualization state
   */
  updateVisualizationState(
    sessionId: string,
    updates: Partial<VisualizationState>
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Record navigation if view changed
    if (updates.currentView && updates.currentView !== session.visualizationState.currentView) {
      session.visualizationState.navigationHistory.push({
        timestamp: new Date(),
        from: session.visualizationState.currentView,
        to: updates.currentView,
        trigger: 'voice',
        context: { sessionId }
      });

      // Limit navigation history
      if (session.visualizationState.navigationHistory.length > this.MAX_VISUALIZATION_HISTORY) {
        session.visualizationState.navigationHistory = 
          session.visualizationState.navigationHistory.slice(-this.MAX_VISUALIZATION_HISTORY);
      }
    }

    session.visualizationState = {
      ...session.visualizationState,
      ...updates
    };

    return true;
  }

  /**
   * Add active chart to visualization state
   */
  addActiveChart(
    sessionId: string,
    type: string,
    dataSource: string,
    isVoiceControlled: boolean = true,
    state: any = {}
  ): string {
    const session = this.getOrCreateSession(sessionId);
    const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const chart: ActiveChart = {
      id: chartId,
      type,
      dataSource,
      isVoiceControlled,
      lastInteraction: new Date(),
      state
    };

    session.visualizationState.activeCharts.push(chart);
    return chartId;
  }

  /**
   * Execute visualization command
   */
  executeVisualizationCommand(
    sessionId: string,
    command: Omit<VisualizationCommand, 'timestamp' | 'success'>
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    try {
      const fullCommand: VisualizationCommand = {
        ...command,
        timestamp: new Date(),
        success: true
      };

      // Add to conversation turn if exists
      const lastTurn = session.conversationTurns[session.conversationTurns.length - 1];
      if (lastTurn) {
        if (!lastTurn.visualizationCommands) {
          lastTurn.visualizationCommands = [];
        }
        lastTurn.visualizationCommands.push(fullCommand);
      }

      session.metadata.voiceNavigationUsage++;
      return true;
    } catch (error) {
      console.error('Visualization command execution failed:', error);
      return false;
    }
  }

  /**
   * Get contextual suggestions based on current analytical state
   */
  getEnhancedContextualSuggestions(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const suggestions: string[] = [];
    const context = session.currentContext;
    const analyticalContext = session.analyticalContext;

    // Multi-turn query suggestions
    if (session.multiTurnQuery && !session.multiTurnQuery.isComplete) {
      suggestions.push(
        "Continue with the next part of your analysis",
        "Or say 'complete query' to process what we have so far"
      );
      return suggestions;
    }

    // Comparison mode suggestions
    if (analyticalContext.comparisonMode && context.comparisonContext) {
      suggestions.push(
        "Would you like to add another item to compare?",
        "Should I highlight the key differences?",
        "Do you want to change the comparison criteria?"
      );
    }

    // Active analyses suggestions
    const pendingAnalyses = analyticalContext.activeAnalyses.filter(a => a.status === 'pending');
    if (pendingAnalyses.length > 0) {
      suggestions.push(
        `You have ${pendingAnalyses.length} analysis pending. Would you like to check the status?`
      );
    }

    // Cross-analysis suggestions
    if (analyticalContext.analysisHistory.length > 1) {
      const recentAnalyses = analyticalContext.analysisHistory.slice(-2);
      suggestions.push(
        `Would you like to compare ${recentAnalyses[0].type} with ${recentAnalyses[1].type}?`
      );
    }

    // Visualization suggestions
    if (session.visualizationState.activeCharts.length > 0) {
      suggestions.push(
        "Would you like me to explain the current visualization?",
        "Should I zoom in on a specific data point?",
        "Do you want to filter the data differently?"
      );
    }

    // Analysis type specific suggestions
    switch (context.analysisType) {
      case 'impact':
        suggestions.push(
          "Would you like to see the cascade effects?",
          "Should I break down the costs by category?",
          "Do you want to explore mitigation strategies?"
        );
        break;
      
      case 'optimization':
        suggestions.push(
          "Would you like to compare different strategies?",
          "Should I show the payback timeline?",
          "Do you want to adjust the risk parameters?"
        );
        break;
      
      case 'sustainability':
        suggestions.push(
          "Would you like to see green alternatives?",
          "Should I show the emissions breakdown?",
          "Do you want to set environmental targets?"
        );
        break;
      
      case 'analytics':
        suggestions.push(
          "Would you like to see real-time metrics?",
          "Should I show trend analysis?",
          "Do you want to explore anomaly detection?"
        );
        break;
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Add a pending action to the session
   */
  addPendingAction(
    sessionId: string,
    type: PendingAction['type'],
    description: string,
    parameters: any,
    priority: PendingAction['priority'] = 'medium'
  ): string {
    const session = this.getOrCreateSession(sessionId);
    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const action: PendingAction = {
      id: actionId,
      type,
      description,
      parameters,
      priority,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    };

    session.currentContext.pendingActions.push(action);
    return actionId;
  }

  /**
   * Execute and remove a pending action
   */
  executePendingAction(sessionId: string, actionId: string): PendingAction | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const actionIndex = session.currentContext.pendingActions.findIndex(
      action => action.id === actionId
    );

    if (actionIndex === -1) return null;

    const action = session.currentContext.pendingActions[actionIndex];
    session.currentContext.pendingActions.splice(actionIndex, 1);

    return action;
  }

  /**
   * Clean up expired actions, sessions, and analyses
   */
  cleanup(): void {
    const now = new Date();

    // Clean up expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        this.contextTransitions.delete(sessionId);
      } else {
        // Clean up expired actions within active sessions
        session.currentContext.pendingActions = session.currentContext.pendingActions.filter(
          action => action.expiresAt > now
        );

        // Clean up expired multi-turn queries
        if (session.multiTurnQuery && 
            now.getTime() - session.multiTurnQuery.startTime.getTime() > this.MULTI_TURN_TIMEOUT) {
          session.multiTurnQuery = undefined;
          if (session.currentContext.conversationState === 'multi_turn') {
            session.currentContext.conversationState = 'active';
          }
        }

        // Clean up old completed analyses
        session.analyticalContext.activeAnalyses = session.analyticalContext.activeAnalyses.filter(
          analysis => {
            if (analysis.status === 'completed' || analysis.status === 'error') {
              return analysis.completionTime && 
                     now.getTime() - analysis.completionTime.getTime() < 60 * 60 * 1000; // 1 hour
            }
            return true;
          }
        );

        // Clean up old visualization history
        if (session.visualizationState.navigationHistory.length > this.MAX_VISUALIZATION_HISTORY) {
          session.visualizationState.navigationHistory = 
            session.visualizationState.navigationHistory.slice(-this.MAX_VISUALIZATION_HISTORY);
        }
      }
    }
  }

  /**
   * Get comprehensive session analytics
   */
  getEnhancedSessionAnalytics(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Update session duration
    session.metadata.sessionDuration = 
      new Date().getTime() - session.startTime.getTime();

    const analytics = {
      ...session.metadata,
      analyticalInsights: {
        totalAnalyses: session.analyticalContext.analysisHistory.length,
        activeAnalyses: session.analyticalContext.activeAnalyses.length,
        completedAnalyses: session.analyticalContext.activeAnalyses.filter(a => a.status === 'completed').length,
        failedAnalyses: session.analyticalContext.activeAnalyses.filter(a => a.status === 'error').length,
        averageAnalysisTime: this.calculateAverageAnalysisTime(session),
        mostUsedAnalysisType: this.getMostUsedAnalysisType(session),
        crossAnalysisConnections: session.analyticalContext.crossAnalysisConnections.length
      },
      visualizationInsights: {
        totalCharts: session.visualizationState.activeCharts.length,
        voiceControlledCharts: session.visualizationState.activeCharts.filter(c => c.isVoiceControlled).length,
        navigationEvents: session.visualizationState.navigationHistory.length,
        averageViewTime: this.calculateAverageViewTime(session),
        mostVisitedView: this.getMostVisitedView(session)
      },
      conversationInsights: {
        averageTurnLength: this.calculateAverageTurnLength(session),
        multiTurnQuerySuccess: this.calculateMultiTurnSuccess(session),
        clarificationRate: session.metadata.clarificationRequests / session.metadata.interactionCount,
        voiceNavigationRate: session.metadata.voiceNavigationUsage / session.metadata.interactionCount
      }
    };

    return analytics;
  }

  private calculateAverageAnalysisTime(session: VoiceSession): number {
    const completedAnalyses = session.analyticalContext.activeAnalyses.filter(
      a => a.status === 'completed' && a.completionTime
    );

    if (completedAnalyses.length === 0) return 0;

    const totalTime = completedAnalyses.reduce((sum, analysis) => {
      return sum + (analysis.completionTime!.getTime() - analysis.startTime.getTime());
    }, 0);

    return totalTime / completedAnalyses.length;
  }

  private getMostUsedAnalysisType(session: VoiceSession): string {
    const typeCounts = session.analyticalContext.analysisHistory.reduce((counts, analysis) => {
      counts[analysis.type] = (counts[analysis.type] || 0) + 1;
      return counts;
    }, {} as { [key: string]: number });

    return Object.entries(typeCounts).reduce((a, b) => typeCounts[a[0]] > typeCounts[b[0]] ? a : b)?.[0] || 'none';
  }

  private calculateAverageViewTime(session: VoiceSession): number {
    const history = session.visualizationState.navigationHistory;
    if (history.length < 2) return 0;

    const viewTimes = [];
    for (let i = 1; i < history.length; i++) {
      const timeDiff = history[i].timestamp.getTime() - history[i - 1].timestamp.getTime();
      viewTimes.push(timeDiff);
    }

    return viewTimes.reduce((sum, time) => sum + time, 0) / viewTimes.length;
  }

  private getMostVisitedView(session: VoiceSession): string {
    const viewCounts = session.visualizationState.navigationHistory.reduce((counts, nav) => {
      counts[nav.to] = (counts[nav.to] || 0) + 1;
      return counts;
    }, {} as { [key: string]: number });

    return Object.entries(viewCounts).reduce((a, b) => viewCounts[a[0]] > viewCounts[b[0]] ? a : b)?.[0] || 'dashboard';
  }

  private calculateAverageTurnLength(session: VoiceSession): number {
    if (session.conversationTurns.length === 0) return 0;

    const totalLength = session.conversationTurns.reduce((sum, turn) => {
      return sum + turn.userInput.length + turn.agentResponse.length;
    }, 0);

    return totalLength / (session.conversationTurns.length * 2);
  }

  private calculateMultiTurnSuccess(session: VoiceSession): number {
    const multiTurnTurns = session.conversationTurns.filter(turn => turn.multiPartQuery);
    if (multiTurnTurns.length === 0) return 1;

    const successfulTurns = multiTurnTurns.filter(turn => turn.wasSuccessful);
    return successfulTurns.length / multiTurnTurns.length;
  }

  /**
   * Get analysis dependencies and relationships
   */
  getAnalysisDependencies(sessionId: string): CrossAnalysisConnection[] {
    const session = this.sessions.get(sessionId);
    return session?.analyticalContext.crossAnalysisConnections || [];
  }

  /**
   * Get visualization interaction patterns
   */
  getVisualizationPatterns(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      navigationPattern: session.visualizationState.navigationHistory.map(nav => ({
        from: nav.from,
        to: nav.to,
        trigger: nav.trigger,
        timestamp: nav.timestamp
      })),
      chartInteractions: session.visualizationState.activeCharts.map(chart => ({
        type: chart.type,
        voiceControlled: chart.isVoiceControlled,
        lastInteraction: chart.lastInteraction
      })),
      filterUsage: session.visualizationState.filterState
    };
  }

  /**
   * Export comprehensive session data for analysis
   */
  exportEnhancedSessionData(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    const transitions = this.contextTransitions.get(sessionId) || [];

    if (!session) return null;

    return {
      session: {
        ...session,
        // Remove sensitive data
        userId: session.userId ? '[REDACTED]' : undefined
      },
      transitions,
      analytics: this.getEnhancedSessionAnalytics(sessionId),
      patterns: this.getVisualizationPatterns(sessionId),
      dependencies: this.getAnalysisDependencies(sessionId)
    };
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(
    sessionId: string, 
    preferences: Partial<UserVoicePreferences>
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.preferences = {
      ...session.preferences,
      ...preferences
    };

    return true;
  }

  /**
   * Get conversation history with optional filtering
   */
  getConversationHistory(
    sessionId: string,
    limit?: number,
    analysisType?: string
  ): ConversationTurn[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    let history = session.conversationTurns;

    // Filter by analysis type if specified
    if (analysisType) {
      history = history.filter(turn => 
        turn.processedIntent.includes(analysisType) ||
        turn.contextAfter.analysisType === analysisType
      );
    }

    // Apply limit
    if (limit && limit > 0) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Export session data for analysis
   */
  exportSessionData(sessionId: string): any {
    return this.exportEnhancedSessionData(sessionId);
  }

  /**
   * Get contextual suggestions (legacy method for backward compatibility)
   */
  getContextualSuggestions(sessionId: string): string[] {
    return this.getEnhancedContextualSuggestions(sessionId);
  }

  /**
   * Get session analytics (legacy method for backward compatibility)
   */
  getSessionAnalytics(sessionId: string): any {
    return this.getEnhancedSessionAnalytics(sessionId);
  }

  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (typeof window === 'undefined') return 'desktop';
    
    const userAgent = window.navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowserInfo(): string {
    if (typeof window === 'undefined') return 'unknown';
    return window.navigator.userAgent;
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval(intervalMs: number = 5 * 60 * 1000): void {
    setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }
}

// Singleton instance
export const voiceContextManager = new VoiceContextManager();

// Start cleanup interval
if (typeof window !== 'undefined') {
  voiceContextManager.startCleanupInterval();
}

export default voiceContextManager;