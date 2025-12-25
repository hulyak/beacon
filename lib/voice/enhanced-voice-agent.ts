import { ttsService } from '../elevenlabs-tts';
import { voiceContextManager } from './voice-context-manager';

// Enhanced Voice Agent Configuration
// Requirement 6.1: Parse multi-part requests and provide comprehensive responses
// Requirement 6.2: Maintain context across multiple voice interactions
// Requirement 6.5: Seamlessly transition between analysis types
// Requirement 6.3: Voice-controlled navigation for visualizations
// Requirement 6.4: Natural language explanation of complex analytical concepts

interface VoiceContext {
  sessionId: string;
  conversationHistory: ConversationTurn[];
  currentAnalysisType: 'impact' | 'explainability' | 'sustainability' | 'optimization' | 'analytics' | null;
  activeStrategy?: string;
  userPreferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeHorizon: 'short' | 'medium' | 'long';
    sustainabilityPriority: 'low' | 'medium' | 'high';
    preferredVoice: string;
  };
  contextData: {
    lastQuery?: string;
    lastResults?: any;
    followUpQuestions?: string[];
    clarificationNeeded?: boolean;
  };
}

interface ConversationTurn {
  timestamp: Date;
  userInput: string;
  agentResponse: string;
  analysisType: string;
  confidence: number;
  followUpSuggestions?: string[];
}

interface VoiceCommand {
  intent: string;
  entities: { [key: string]: any };
  confidence: number;
  requiresClarification: boolean;
  suggestedFollowUps: string[];
}

interface EnhancedVoiceResponse {
  spokenResponse: string;
  visualData?: any;
  followUpQuestions: string[];
  contextUpdate: any;
  actionRequired?: {
    type: 'navigate' | 'display' | 'calculate' | 'export' | 'visualize' | 'compare';
    target: string;
    parameters?: any;
  };
  multiTurnQuery?: {
    isMultiTurn: boolean;
    queryId?: string;
    expectedParts?: number;
    currentPart?: number;
  };
  visualizationCommands?: Array<{
    type: 'zoom' | 'filter' | 'highlight' | 'navigate';
    target: string;
    parameters: any;
  }>;
  analyticalResults?: {
    analysisId: string;
    type: string;
    confidence: number;
    crossReferences: string[];
  };
}

class EnhancedVoiceAgent {
  private intentPatterns = new Map<string, RegExp[]>();
  private analysisEndpoints = {
    impact: '/api/impact-assessment',
    explainability: '/api/explainability',
    sustainability: '/api/sustainability',
    optimization: '/api/roi-optimization',
    analytics: '/api/analytics'
  };
  private visualizationPatterns = new Map<string, RegExp[]>();
  private comparisonPatterns = new Map<string, RegExp[]>();

  constructor() {
    this.initializeIntentPatterns();
    this.initializeVisualizationPatterns();
    this.initializeComparisonPatterns();
  }

  private initializeIntentPatterns(): void {
    // Impact Assessment Patterns
    this.intentPatterns.set('impact_analysis', [
      /what.*impact.*if/i,
      /analyze.*disruption/i,
      /financial.*effect/i,
      /cost.*breakdown/i,
      /cascade.*analysis/i,
      /delivery.*delay/i
    ]);

    // ROI Optimization Patterns
    this.intentPatterns.set('roi_optimization', [
      /roi.*calculation/i,
      /return.*investment/i,
      /payback.*period/i,
      /compare.*strategies/i,
      /optimize.*investment/i,
      /best.*strategy/i
    ]);

    // Sustainability Patterns
    this.intentPatterns.set('sustainability_analysis', [
      /carbon.*footprint/i,
      /environmental.*impact/i,
      /sustainability.*score/i,
      /green.*alternatives/i,
      /emissions.*analysis/i,
      /eco.*friendly/i
    ]);

    // Analytics Patterns
    this.intentPatterns.set('analytics_request', [
      /show.*analytics/i,
      /real.*time.*data/i,
      /performance.*metrics/i,
      /trend.*analysis/i,
      /anomaly.*detection/i,
      /network.*diagram/i
    ]);

    // Explainability Patterns
    this.intentPatterns.set('explainability_request', [
      /explain.*decision/i,
      /why.*recommend/i,
      /confidence.*score/i,
      /reasoning.*behind/i,
      /how.*calculated/i,
      /decision.*tree/i
    ]);

    // Navigation Patterns
    this.intentPatterns.set('navigation', [
      /go.*to/i,
      /show.*me/i,
      /navigate.*to/i,
      /open.*dashboard/i,
      /switch.*to/i
    ]);

    // Multi-turn Patterns
    this.intentPatterns.set('multi_turn_start', [
      /first.*then/i,
      /after.*that.*show/i,
      /also.*analyze/i,
      /compare.*and.*then/i,
      /multiple.*analysis/i
    ]);

    // Clarification Patterns
    this.intentPatterns.set('clarification', [
      /what.*do.*you.*mean/i,
      /can.*you.*explain/i,
      /more.*details/i,
      /elaborate/i,
      /tell.*me.*more/i
    ]);
  }

  private initializeVisualizationPatterns(): void {
    // Chart Navigation
    this.visualizationPatterns.set('chart_navigation', [
      /zoom.*in/i,
      /zoom.*out/i,
      /pan.*left/i,
      /pan.*right/i,
      /reset.*view/i
    ]);

    // Data Filtering
    this.visualizationPatterns.set('data_filtering', [
      /filter.*by/i,
      /show.*only/i,
      /hide.*data/i,
      /exclude.*from/i,
      /focus.*on/i
    ]);

    // Chart Type Changes
    this.visualizationPatterns.set('chart_type', [
      /show.*as.*bar.*chart/i,
      /convert.*to.*line/i,
      /display.*pie.*chart/i,
      /switch.*to.*heatmap/i
    ]);

    // Data Highlighting
    this.visualizationPatterns.set('data_highlighting', [
      /highlight.*point/i,
      /emphasize.*data/i,
      /mark.*important/i,
      /focus.*attention/i
    ]);
  }

  private initializeComparisonPatterns(): void {
    // Direct Comparison
    this.comparisonPatterns.set('direct_comparison', [
      /compare.*with/i,
      /versus/i,
      /vs\./i,
      /difference.*between/i,
      /side.*by.*side/i
    ]);

    // Baseline Comparison
    this.comparisonPatterns.set('baseline_comparison', [
      /against.*baseline/i,
      /compared.*to.*standard/i,
      /relative.*to/i,
      /benchmark.*against/i
    ]);

    // Multi-item Comparison
    this.comparisonPatterns.set('multi_comparison', [
      /compare.*all/i,
      /rank.*strategies/i,
      /best.*among/i,
      /evaluate.*options/i
    ]);
  }

  /**
   * Initialize or get voice context for a session
   */
  getOrCreateContext(sessionId: string): any {
    return voiceContextManager.getOrCreateSession(sessionId);
  }

  /**
   * Parse complex voice input and extract intent and entities
   */
  parseVoiceInput(input: string, sessionId: string): VoiceCommand {
    const normalizedInput = input.toLowerCase().trim();
    let bestIntent = 'unknown';
    let maxConfidence = 0;

    // Check against intent patterns
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedInput)) {
          const confidence = this.calculatePatternConfidence(normalizedInput, pattern);
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            bestIntent = intent;
          }
        }
      }
    }

    // Check visualization patterns
    for (const [vizIntent, patterns] of this.visualizationPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedInput)) {
          const confidence = this.calculatePatternConfidence(normalizedInput, pattern);
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            bestIntent = `visualization_${vizIntent}`;
          }
        }
      }
    }

    // Check comparison patterns
    for (const [compIntent, patterns] of this.comparisonPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedInput)) {
          const confidence = this.calculatePatternConfidence(normalizedInput, pattern);
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            bestIntent = `comparison_${compIntent}`;
          }
        }
      }
    }

    // Extract entities based on intent
    const entities = this.extractEntities(normalizedInput, bestIntent);

    // Determine if clarification is needed
    const requiresClarification = maxConfidence < 0.7 || this.needsClarification(entities, bestIntent);

    // Generate follow-up suggestions using context manager
    const suggestedFollowUps = voiceContextManager.getEnhancedContextualSuggestions(sessionId);

    return {
      intent: bestIntent,
      entities,
      confidence: maxConfidence,
      requiresClarification,
      suggestedFollowUps
    };
  }

  private calculatePatternConfidence(input: string, pattern: RegExp): number {
    const match = input.match(pattern);
    if (!match) return 0;
    
    // Base confidence from pattern match
    let confidence = 0.6;
    
    // Boost confidence based on match length and position
    const matchLength = match[0].length;
    const inputLength = input.length;
    confidence += (matchLength / inputLength) * 0.3;
    
    // Boost if match is at the beginning
    if (match.index === 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private extractEntities(input: string, intent: string): { [key: string]: any } {
    const entities: { [key: string]: any } = {};

    // Extract common entities
    const numberMatch = input.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      entities.number = parseFloat(numberMatch[1]);
    }

    const percentMatch = input.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      entities.percentage = parseFloat(percentMatch[1]);
    }

    // Extract time periods
    const timeMatch = input.match(/(day|week|month|year|quarter)s?/i);
    if (timeMatch) {
      entities.timePeriod = timeMatch[1].toLowerCase();
    }

    // Extract strategy names
    const strategyMatch = input.match(/(automation|diversification|analytics|optimization)/i);
    if (strategyMatch) {
      entities.strategy = strategyMatch[1].toLowerCase();
    }

    // Extract comparison keywords
    if (input.includes('compare') || input.includes('versus') || input.includes('vs')) {
      entities.comparison = true;
    }

    // Extract urgency indicators
    if (input.includes('urgent') || input.includes('immediate') || input.includes('asap')) {
      entities.urgency = 'high';
    } else if (input.includes('when possible') || input.includes('eventually')) {
      entities.urgency = 'low';
    }

    // Extract visualization-specific entities
    if (intent.startsWith('visualization_')) {
      const zoomMatch = input.match(/zoom.*(\d+(?:\.\d+)?)/i);
      if (zoomMatch) {
        entities.zoomLevel = parseFloat(zoomMatch[1]);
      }

      const chartTypeMatch = input.match(/(bar|line|pie|scatter|heatmap).*chart/i);
      if (chartTypeMatch) {
        entities.chartType = chartTypeMatch[1].toLowerCase();
      }

      const filterMatch = input.match(/filter.*by\s+(\w+)/i);
      if (filterMatch) {
        entities.filterBy = filterMatch[1].toLowerCase();
      }
    }

    // Extract comparison-specific entities
    if (intent.startsWith('comparison_')) {
      const itemsMatch = input.match(/compare\s+(\w+).*(?:with|and|vs\.?)\s+(\w+)/i);
      if (itemsMatch) {
        entities.compareItems = [itemsMatch[1], itemsMatch[2]];
      }

      const criteriaMatch = input.match(/based\s+on\s+(\w+(?:\s+and\s+\w+)*)/i);
      if (criteriaMatch) {
        entities.criteria = criteriaMatch[1].split(/\s+and\s+/);
      }
    }

    return entities;
  }

  private needsClarification(entities: { [key: string]: any }, intent: string): boolean {
    switch (intent) {
      case 'impact_analysis':
        return !entities.strategy && !entities.number;
      case 'roi_optimization':
        return !entities.strategy && !entities.comparison;
      case 'sustainability_analysis':
        return false; // Usually doesn't need clarification
      case 'analytics_request':
        return false; // Can show general analytics
      default:
        return true;
    }
  }

  private generateFollowUpSuggestions(intent: string, entities: { [key: string]: any }, context: VoiceContext): string[] {
    const suggestions: string[] = [];

    switch (intent) {
      case 'impact_analysis':
        suggestions.push(
          "Would you like to see the cascade effects?",
          "Should I break down the costs by category?",
          "Do you want to compare multiple scenarios?"
        );
        break;
      case 'roi_optimization':
        suggestions.push(
          "Would you like to adjust the risk parameters?",
          "Should I show the payback timeline?",
          "Do you want to see alternative strategies?"
        );
        break;
      case 'sustainability_analysis':
        suggestions.push(
          "Would you like to see green alternatives?",
          "Should I show the emissions breakdown?",
          "Do you want to set environmental targets?"
        );
        break;
      case 'analytics_request':
        suggestions.push(
          "Would you like to see real-time metrics?",
          "Should I show trend analysis?",
          "Do you want to explore the network diagram?"
        );
        break;
    }

    return suggestions;
  }

  /**
   * Process voice command and generate enhanced response
   */
  async processVoiceCommand(
    input: string, 
    sessionId: string
  ): Promise<EnhancedVoiceResponse> {
    const command = this.parseVoiceInput(input, sessionId);
    const session = voiceContextManager.getOrCreateSession(sessionId);

    let spokenResponse = '';
    let visualData = null;
    let actionRequired = null;
    let multiTurnQuery = undefined;
    let visualizationCommands: any[] = [];
    let analyticalResults = undefined;

    try {
      // Check if this is a multi-turn query
      if (command.intent === 'multi_turn_start' || this.isMultiPartQuery(input)) {
        const queryId = voiceContextManager.startMultiTurnQuery(sessionId, input, 2);
        multiTurnQuery = {
          isMultiTurn: true,
          queryId,
          expectedParts: 2,
          currentPart: 1
        };
        spokenResponse = "I understand you have a multi-part request. Please continue with the next part of your analysis.";
      }
      // Handle ongoing multi-turn query
      else if (session.multiTurnQuery && !session.multiTurnQuery.isComplete) {
        const success = voiceContextManager.addQueryPart(
          sessionId,
          input,
          command.intent,
          command.entities,
          command.confidence
        );

        if (success) {
          const completedQuery = voiceContextManager.getCompletedMultiTurnQuery(sessionId);
          if (completedQuery) {
            // Process the completed multi-turn query
            const result = await this.processMultiTurnQuery(completedQuery, sessionId);
            spokenResponse = result.response;
            visualData = result.data;
            actionRequired = result.action;
          } else {
            spokenResponse = "Thank you for the additional information. Please continue with the next part.";
          }
        }
      }
      // Handle visualization commands
      else if (command.intent.startsWith('visualization_')) {
        const vizResult = await this.handleVisualizationCommand(command, sessionId);
        spokenResponse = vizResult.response;
        visualizationCommands = vizResult.commands;
        actionRequired = vizResult.action;
      }
      // Handle comparison requests
      else if (command.intent.startsWith('comparison_')) {
        const compResult = await this.handleComparisonRequest(command, sessionId);
        spokenResponse = compResult.response;
        visualData = compResult.data;
        actionRequired = compResult.action;
      }
      // Handle standard analysis requests
      else {
        switch (command.intent) {
          case 'impact_analysis':
            const impactResult = await this.handleImpactAnalysis(command, sessionId);
            spokenResponse = impactResult.response;
            visualData = impactResult.data;
            analyticalResults = impactResult.analyticalResults;
            actionRequired = { type: 'navigate' as const, target: '/dashboard' };
            break;

          case 'roi_optimization':
            const roiResult = await this.handleROIOptimization(command, sessionId);
            spokenResponse = roiResult.response;
            visualData = roiResult.data;
            analyticalResults = roiResult.analyticalResults;
            actionRequired = { type: 'navigate' as const, target: '/optimization' };
            break;

          case 'sustainability_analysis':
            const sustainabilityResult = await this.handleSustainabilityAnalysis(command, sessionId);
            spokenResponse = sustainabilityResult.response;
            visualData = sustainabilityResult.data;
            analyticalResults = sustainabilityResult.analyticalResults;
            break;

          case 'analytics_request':
            const analyticsResult = await this.handleAnalyticsRequest(command, sessionId);
            spokenResponse = analyticsResult.response;
            visualData = analyticsResult.data;
            analyticalResults = analyticsResult.analyticalResults;
            actionRequired = { type: 'navigate' as const, target: '/analytics' };
            break;

          case 'explainability_request':
            const explainResult = await this.handleExplainabilityRequest(command, sessionId);
            spokenResponse = explainResult.response;
            visualData = explainResult.data;
            analyticalResults = explainResult.analyticalResults;
            break;

          case 'navigation':
            const navResult = this.handleNavigation(command, sessionId);
            spokenResponse = navResult.response;
            actionRequired = navResult.action;
            break;

          default:
            spokenResponse = this.generateClarificationResponse(command, sessionId);
        }
      }

      // Add conversation turn with enhanced data
      const turn = voiceContextManager.addConversationTurn(
        sessionId,
        input,
        command.intent,
        command.entities,
        spokenResponse,
        command.confidence,
        true,
        analyticalResults ? {
          analysisType: command.intent,
          data: visualData,
          confidence: command.confidence,
          explanations: [spokenResponse],
          visualizations: [],
          followUpAnalyses: [],
          crossReferences: []
        } : undefined,
        visualizationCommands.length > 0 ? visualizationCommands.map(cmd => ({
          ...cmd,
          timestamp: new Date(),
          success: true
        })) : undefined
      );

      // Update context
      voiceContextManager.updateContext(sessionId, {
        analysisType: this.mapIntentToAnalysisType(command.intent),
        lastQuery: input,
        lastResults: visualData
      });

    } catch (error) {
      console.error('Voice command processing error:', error);
      spokenResponse = "I encountered an issue processing your request. Could you please try rephrasing it?";
      
      voiceContextManager.addConversationTurn(
        sessionId,
        input,
        command.intent,
        command.entities,
        spokenResponse,
        command.confidence,
        false
      );
    }

    return {
      spokenResponse,
      visualData,
      followUpQuestions: command.suggestedFollowUps,
      contextUpdate: {
        analysisType: this.mapIntentToAnalysisType(command.intent),
        lastQuery: input,
        lastResults: visualData
      },
      actionRequired,
      multiTurnQuery,
      visualizationCommands,
      analyticalResults
    };
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

  private mapIntentToAnalysisType(intent: string): any {
    if (intent.includes('impact')) return 'impact';
    if (intent.includes('optimization') || intent.includes('roi')) return 'optimization';
    if (intent.includes('sustainability')) return 'sustainability';
    if (intent.includes('analytics')) return 'analytics';
    if (intent.includes('explainability')) return 'explainability';
    return null;
  }

  private async processMultiTurnQuery(query: any, sessionId: string) {
    // Combine all parts of the query for comprehensive analysis
    const combinedText = query.parts.map((part: any) => part.text).join(' ');
    const aggregatedIntent = query.aggregatedIntent;

    // Process based on aggregated intent
    switch (aggregatedIntent) {
      case 'comparison':
        return await this.handleMultiItemComparison(query, sessionId);
      case 'multi_analysis':
        return await this.handleMultipleAnalyses(query, sessionId);
      default:
        return {
          response: `I've processed your multi-part request: ${combinedText}. Here's the comprehensive analysis.`,
          data: { combinedQuery: combinedText, parts: query.parts.length },
          action: { type: 'display' as const, target: 'results' }
        };
    }
  }

  private async handleMultiItemComparison(query: any, sessionId: string) {
    const items = this.extractComparisonItems(query);
    
    // Enable comparison mode in context manager
    voiceContextManager.enableComparisonMode(sessionId, items, ['cost', 'risk', 'sustainability']);

    return {
      response: `I'm comparing ${items.length} items across multiple criteria. The analysis shows significant differences in cost efficiency and risk profiles.`,
      data: { comparisonItems: items, criteria: ['cost', 'risk', 'sustainability'] },
      action: { type: 'compare' as const, target: 'comparison_dashboard' }
    };
  }

  private async handleMultipleAnalyses(query: any, sessionId: string) {
    const analysisTypes = query.parts.map((part: any) => this.mapIntentToAnalysisType(part.intent)).filter(Boolean);
    
    // Start multiple analyses
    const analysisIds = analysisTypes.map(type => 
      voiceContextManager.addActiveAnalysis(sessionId, type, {}, 'high')
    );

    return {
      response: `I'm running ${analysisTypes.length} different analyses: ${analysisTypes.join(', ')}. This comprehensive approach will provide you with a complete picture.`,
      data: { analyses: analysisTypes, analysisIds },
      action: { type: 'display' as const, target: 'multi_analysis_dashboard' }
    };
  }

  private extractComparisonItems(query: any): any[] {
    // Extract items to compare from query parts
    const items = [];
    query.parts.forEach((part: any) => {
      if (part.entities.compareItems) {
        part.entities.compareItems.forEach((item: string, index: number) => {
          items.push({
            id: `item_${items.length + 1}`,
            type: 'strategy',
            data: { name: item },
            label: item
          });
        });
      }
    });
    return items;
  }

  private async handleVisualizationCommand(command: VoiceCommand, sessionId: string) {
    const vizType = command.intent.replace('visualization_', '');
    const commands = [];

    switch (vizType) {
      case 'chart_navigation':
        commands.push({
          type: 'navigate',
          target: command.entities.chartType || 'current_chart',
          parameters: { 
            zoomLevel: command.entities.zoomLevel || 1.0,
            action: this.extractNavigationAction(command.entities)
          }
        });
        break;

      case 'data_filtering':
        commands.push({
          type: 'filter',
          target: 'active_charts',
          parameters: {
            filterBy: command.entities.filterBy,
            criteria: command.entities.criteria || []
          }
        });
        break;

      case 'chart_type':
        commands.push({
          type: 'transform',
          target: 'current_chart',
          parameters: {
            newType: command.entities.chartType
          }
        });
        break;

      case 'data_highlighting':
        commands.push({
          type: 'highlight',
          target: 'data_points',
          parameters: {
            criteria: command.entities.criteria || 'important'
          }
        });
        break;
    }

    // Execute visualization commands
    commands.forEach(cmd => {
      voiceContextManager.executeVisualizationCommand(sessionId, cmd);
    });

    return {
      response: `I've updated the visualization as requested. ${this.generateVisualizationDescription(vizType, command.entities)}`,
      commands,
      action: { type: 'visualize' as const, target: 'current_view' }
    };
  }

  private extractNavigationAction(entities: any): string {
    if (entities.zoomLevel) return entities.zoomLevel > 1 ? 'zoom_in' : 'zoom_out';
    return 'navigate';
  }

  private generateVisualizationDescription(vizType: string, entities: any): string {
    switch (vizType) {
      case 'chart_navigation':
        return entities.zoomLevel ? `Zoomed to ${entities.zoomLevel}x magnification.` : 'Navigation updated.';
      case 'data_filtering':
        return `Filtered data by ${entities.filterBy || 'specified criteria'}.`;
      case 'chart_type':
        return `Converted to ${entities.chartType} chart format.`;
      case 'data_highlighting':
        return 'Highlighted important data points for better visibility.';
      default:
        return 'Visualization updated successfully.';
    }
  }

  private async handleComparisonRequest(command: VoiceCommand, sessionId: string) {
    const compType = command.intent.replace('comparison_', '');
    
    switch (compType) {
      case 'direct_comparison':
        return await this.handleDirectComparison(command, sessionId);
      case 'baseline_comparison':
        return await this.handleBaselineComparison(command, sessionId);
      case 'multi_comparison':
        return await this.handleMultiComparison(command, sessionId);
      default:
        return {
          response: "I can help you compare different strategies or metrics. What would you like to compare?",
          data: null,
          action: { type: 'display' as const, target: 'comparison_setup' }
        };
    }
  }

  private async handleDirectComparison(command: VoiceCommand, sessionId: string) {
    const items = command.entities.compareItems || ['Strategy A', 'Strategy B'];
    const criteria = command.entities.criteria || ['cost', 'risk', 'timeline'];

    const comparisonItems = items.map((item: string, index: number) => ({
      id: `item_${index + 1}`,
      type: 'strategy',
      data: { name: item, mockScore: Math.random() * 100 },
      label: item
    }));

    voiceContextManager.enableComparisonMode(sessionId, comparisonItems, criteria);

    return {
      response: `Comparing ${items.join(' and ')} based on ${criteria.join(', ')}. ${items[0]} shows 15% better cost efficiency, while ${items[1]} has 20% lower risk profile.`,
      data: { items: comparisonItems, criteria, results: this.generateMockComparisonResults(items, criteria) },
      action: { type: 'compare' as const, target: 'comparison_view' }
    };
  }

  private async handleBaselineComparison(command: VoiceCommand, sessionId: string) {
    return {
      response: "Comparing against the established baseline. Current performance is 12% above baseline in efficiency and 8% below in cost optimization.",
      data: { baselineComparison: true, variance: { efficiency: 12, cost: -8 } },
      action: { type: 'display' as const, target: 'baseline_comparison' }
    };
  }

  private async handleMultiComparison(command: VoiceCommand, sessionId: string) {
    const strategies = ['Automation', 'Diversification', 'Analytics', 'Optimization'];
    const comparisonItems = strategies.map((strategy, index) => ({
      id: `strategy_${index + 1}`,
      type: 'strategy',
      data: { name: strategy, score: Math.random() * 100 },
      label: strategy
    }));

    voiceContextManager.enableComparisonMode(sessionId, comparisonItems, ['roi', 'risk', 'timeline']);

    return {
      response: `Ranking all strategies: Automation leads with 125% ROI, followed by Analytics at 98% ROI. Diversification offers the lowest risk profile.`,
      data: { strategies: comparisonItems, ranking: this.generateStrategyRanking(strategies) },
      action: { type: 'compare' as const, target: 'multi_strategy_comparison' }
    };
  }

  private generateMockComparisonResults(items: string[], criteria: string[]) {
    return items.map(item => ({
      name: item,
      scores: criteria.reduce((acc, criterion) => {
        acc[criterion] = Math.random() * 100;
        return acc;
      }, {} as any)
    }));
  }

  private generateStrategyRanking(strategies: string[]) {
    return strategies.map((strategy, index) => ({
      rank: index + 1,
      name: strategy,
      score: 100 - (index * 15) + Math.random() * 10
    })).sort((a, b) => b.score - a.score);
  }
  private async handleImpactAnalysis(command: VoiceCommand, sessionId: string) {
    // Add analysis to context manager
    const analysisId = voiceContextManager.addActiveAnalysis(
      sessionId,
      'impact',
      { strategy: command.entities.strategy, urgency: command.entities.urgency },
      'high'
    );

    // Mock impact analysis - in production, this would call the actual API
    const response = `I've analyzed the potential impact. Based on the current supply chain configuration, 
                     a disruption could result in approximately $2.3 million in total costs, with a 
                     cascade effect reaching 15 downstream partners. The primary impact would be 
                     delivery delays of 8-12 days affecting 450 orders.`;
    
    const data = {
      totalCost: 2300000,
      affectedPartners: 15,
      delayDays: 10,
      affectedOrders: 450
    };

    // Update analysis status
    voiceContextManager.updateAnalysisStatus(analysisId, 'completed', data);

    return { 
      response, 
      data,
      analyticalResults: {
        analysisId,
        type: 'impact',
        confidence: 0.85,
        crossReferences: ['cascade_analysis', 'cost_breakdown']
      }
    };
  }

  private async handleROIOptimization(command: VoiceCommand, sessionId: string) {
    const analysisId = voiceContextManager.addActiveAnalysis(
      sessionId,
      'optimization',
      { comparison: command.entities.comparison, strategy: command.entities.strategy },
      'high'
    );

    const response = `I've calculated the ROI for your optimization strategies. The supplier diversification 
                     strategy shows the highest return at 125% ROI with a payback period of 10.7 months. 
                     This strategy requires a $200,000 investment but could save $450,000 annually.`;
    
    const data = {
      topStrategy: 'Supplier Diversification',
      roi: 125,
      paybackPeriod: 10.7,
      investment: 200000,
      annualSavings: 450000
    };

    voiceContextManager.updateAnalysisStatus(analysisId, 'completed', data);

    return { 
      response, 
      data,
      analyticalResults: {
        analysisId,
        type: 'optimization',
        confidence: 0.92,
        crossReferences: ['payback_analysis', 'risk_assessment']
      }
    };
  }

  private async handleSustainabilityAnalysis(command: VoiceCommand, sessionId: string) {
    const analysisId = voiceContextManager.addActiveAnalysis(
      sessionId,
      'sustainability',
      { priority: command.entities.sustainabilityPriority },
      'medium'
    );

    const response = `Your current supply chain has a carbon footprint of 1,247 tons CO2 equivalent annually. 
                     The sustainability score is 72 out of 100. I've identified 3 green alternatives that 
                     could reduce emissions by 23% while maintaining cost efficiency.`;
    
    const data = {
      carbonFootprint: 1247,
      sustainabilityScore: 72,
      greenAlternatives: 3,
      emissionReduction: 23
    };

    voiceContextManager.updateAnalysisStatus(analysisId, 'completed', data);

    return { 
      response, 
      data,
      analyticalResults: {
        analysisId,
        type: 'sustainability',
        confidence: 0.78,
        crossReferences: ['carbon_calculation', 'green_alternatives']
      }
    };
  }

  private async handleAnalyticsRequest(command: VoiceCommand, sessionId: string) {
    const analysisId = voiceContextManager.addActiveAnalysis(
      sessionId,
      'analytics',
      { realTime: true, metrics: ['performance', 'risk', 'efficiency'] },
      'high'
    );

    const response = `Here's your current analytics overview: Delivery performance is at 94.5%, 
                     cost efficiency is 87.2%, and risk level is at 23.1%. I'm detecting 2 anomalies 
                     in the supply chain that require attention.`;
    
    const data = {
      deliveryPerformance: 94.5,
      costEfficiency: 87.2,
      riskLevel: 23.1,
      anomalies: 2
    };

    voiceContextManager.updateAnalysisStatus(analysisId, 'completed', data);

    return { 
      response, 
      data,
      analyticalResults: {
        analysisId,
        type: 'analytics',
        confidence: 0.96,
        crossReferences: ['real_time_metrics', 'anomaly_detection']
      }
    };
  }

  private async handleExplainabilityRequest(command: VoiceCommand, sessionId: string) {
    const analysisId = voiceContextManager.addActiveAnalysis(
      sessionId,
      'explainability',
      { depth: 'detailed', focus: 'reasoning' },
      'medium'
    );

    const response = `Let me explain the reasoning behind this recommendation. The AI analyzed 5 key factors: 
                     cost efficiency scored 85%, risk assessment scored 92%, implementation timeline scored 78%, 
                     sustainability impact scored 65%, and feasibility scored 88%. The overall confidence 
                     score is 84% based on historical data patterns and current market conditions.`;
    
    const data = {
      factors: {
        costEfficiency: 85,
        riskAssessment: 92,
        timeline: 78,
        sustainability: 65,
        feasibility: 88
      },
      overallConfidence: 84
    };

    voiceContextManager.updateAnalysisStatus(analysisId, 'completed', data);

    return { 
      response, 
      data,
      analyticalResults: {
        analysisId,
        type: 'explainability',
        confidence: 0.84,
        crossReferences: ['decision_tree', 'confidence_factors']
      }
    };
  }

  private handleNavigation(command: VoiceCommand, sessionId: string) {
    const session = voiceContextManager.getOrCreateSession(sessionId);
    const lastQuery = session.currentContext.lastQuery || '';
    
    let target = '/dashboard';
    let response = "I'll take you to the dashboard.";

    if (lastQuery.includes('analytics') || command.entities.target === 'analytics') {
      target = '/analytics';
      response = "Opening the analytics dashboard for you.";
    } else if (lastQuery.includes('optimization') || command.entities.target === 'optimization') {
      target = '/optimization';
      response = "Navigating to the ROI optimization page.";
    } else if (lastQuery.includes('sustainability') || command.entities.target === 'sustainability') {
      target = '/dashboard'; // Assuming sustainability is a tab in dashboard
      response = "Showing you the sustainability metrics.";
    }

    // Update visualization state
    voiceContextManager.updateVisualizationState(sessionId, {
      currentView: target.replace('/', '')
    });

    return {
      response,
      action: { type: 'navigate' as const, target }
    };
  }

  private generateClarificationResponse(command: VoiceCommand, sessionId: string): string {
    if (command.confidence < 0.3) {
      return "I didn't quite understand that. Could you please rephrase your question? You can ask me about impact analysis, ROI optimization, sustainability metrics, or analytics.";
    }

    const suggestions = voiceContextManager.getEnhancedContextualSuggestions(sessionId);
    const suggestion = suggestions[0] || 'Could you provide more details?';
    
    return `I think you're asking about ${command.intent.replace('_', ' ')}, but I need a bit more information. ${suggestion}`;
  }

  /**
   * Speak response using TTS
   */
  async speakResponse(response: string, sessionId?: string, voiceId?: string): Promise<void> {
    try {
      // Get user preferences from context manager if session provided
      if (sessionId) {
        const session = voiceContextManager.getOrCreateSession(sessionId);
        if (session.preferences.preferredVoice && !voiceId) {
          voiceId = session.preferences.preferredVoice;
        }
        
        // Check if auto-speak is enabled
        if (!session.preferences.autoSpeak) {
          return;
        }
      }

      if (voiceId) {
        ttsService.setVoice(voiceId);
      }
      await ttsService.speak(response);
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to text display if TTS fails
    }
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string, limit?: number): any[] {
    return voiceContextManager.getConversationHistory(sessionId, limit);
  }

  /**
   * Clear session context
   */
  clearSession(sessionId: string): void {
    // The context manager handles session cleanup
    voiceContextManager.cleanup();
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(sessionId: string, preferences: any): void {
    voiceContextManager.updateUserPreferences(sessionId, preferences);
  }

  /**
   * Get enhanced session analytics
   */
  getSessionAnalytics(sessionId: string): any {
    return voiceContextManager.getEnhancedSessionAnalytics(sessionId);
  }

  /**
   * Get active analyses for a session
   */
  getActiveAnalyses(sessionId: string): any[] {
    const session = voiceContextManager.getOrCreateSession(sessionId);
    return session.analyticalContext.activeAnalyses;
  }

  /**
   * Get visualization state for a session
   */
  getVisualizationState(sessionId: string): any {
    const session = voiceContextManager.getOrCreateSession(sessionId);
    return session.visualizationState;
  }

  /**
   * Check if session has active multi-turn query
   */
  hasActiveMultiTurnQuery(sessionId: string): boolean {
    const session = voiceContextManager.getOrCreateSession(sessionId);
    return session.multiTurnQuery !== undefined && !session.multiTurnQuery.isComplete;
  }

  /**
   * Get comparison context for a session
   */
  getComparisonContext(sessionId: string): any {
    const session = voiceContextManager.getOrCreateSession(sessionId);
    return session.currentContext.comparisonContext;
  }

  /**
   * Export comprehensive session data
   */
  exportSessionData(sessionId: string): any {
    return voiceContextManager.exportEnhancedSessionData(sessionId);
  }
}

// Singleton instance
export const enhancedVoiceAgent = new EnhancedVoiceAgent();

export default enhancedVoiceAgent;