// Integration test for enhanced voice context management system
// Tests the complete flow from voice input to context preservation

import { enhancedVoiceAgent } from '../../lib/voice/enhanced-voice-agent';
import { voiceContextManager } from '../../lib/voice/voice-context-manager';

describe('Voice Context Management Integration', () => {
  const testSessionId = 'test-session-integration';

  beforeEach(() => {
    // Clean up any existing sessions
    voiceContextManager.cleanup();
  });

  afterEach(() => {
    // Clean up test session
    enhancedVoiceAgent.clearSession(testSessionId);
  });

  describe('Single Analysis Flow', () => {
    it('should process impact analysis and maintain context', async () => {
      const input = "What would be the financial impact if our main supplier fails?";
      
      const response = await enhancedVoiceAgent.processVoiceCommand(input, testSessionId);
      
      // Verify response structure
      expect(response.spokenResponse).toBeDefined();
      expect(response.spokenResponse).toContain('impact');
      expect(response.visualData).toBeDefined();
      expect(response.analyticalResults).toBeDefined();
      expect(response.analyticalResults?.type).toBe('impact');
      
      // Verify context was updated
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      expect(session.currentContext.analysisType).toBe('impact');
      expect(session.currentContext.lastQuery).toBe(input);
      expect(session.conversationTurns.length).toBe(1);
      
      // Verify analytical context
      expect(session.analyticalContext.activeAnalyses.length).toBe(1);
      expect(session.analyticalContext.activeAnalyses[0].type).toBe('impact');
      expect(session.analyticalContext.activeAnalyses[0].status).toBe('completed');
      
      // Verify analytics
      const analytics = enhancedVoiceAgent.getSessionAnalytics(testSessionId);
      expect(analytics.interactionCount).toBe(1);
      expect(analytics.successfulCommands).toBe(1);
    });

    it('should handle ROI optimization with context preservation', async () => {
      const input = "Calculate ROI for supplier diversification strategy";
      
      const response = await enhancedVoiceAgent.processVoiceCommand(input, testSessionId);
      
      expect(response.spokenResponse).toContain('ROI');
      expect(response.visualData?.roi).toBeDefined();
      expect(response.analyticalResults?.type).toBe('optimization');
      expect(response.actionRequired?.target).toBe('/optimization');
      
      // Verify context
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      expect(session.currentContext.analysisType).toBe('optimization');
      expect(session.analyticalContext.activeAnalyses[0].type).toBe('optimization');
    });
  });

  describe('Multi-Turn Query Flow', () => {
    it('should handle multi-turn queries with context continuity', async () => {
      // Start multi-turn query
      const firstInput = "First analyze the impact of supplier failure, then show me optimization strategies";
      
      const firstResponse = await enhancedVoiceAgent.processVoiceCommand(firstInput, testSessionId);
      
      expect(firstResponse.multiTurnQuery?.isMultiTurn).toBe(true);
      expect(firstResponse.multiTurnQuery?.queryId).toBeDefined();
      
      // Verify multi-turn state
      const hasActiveQuery = enhancedVoiceAgent.hasActiveMultiTurnQuery(testSessionId);
      expect(hasActiveQuery).toBe(true);
      
      // Continue with second part
      const secondInput = "Focus on cost reduction and risk mitigation";
      
      const secondResponse = await enhancedVoiceAgent.processVoiceCommand(secondInput, testSessionId);
      
      expect(secondResponse.spokenResponse).toBeDefined();
      
      // Verify query completion
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      expect(session.multiTurnQuery?.isComplete).toBe(true);
      expect(session.currentContext.conversationState).toBe('active');
    });
  });

  describe('Comparison Mode Flow', () => {
    it('should enable and manage comparison mode', async () => {
      const input = "Compare automation strategy with diversification strategy";
      
      const response = await enhancedVoiceAgent.processVoiceCommand(input, testSessionId);
      
      expect(response.spokenResponse).toContain('comparing');
      expect(response.actionRequired?.type).toBe('compare');
      
      // Verify comparison context
      const comparisonContext = enhancedVoiceAgent.getComparisonContext(testSessionId);
      expect(comparisonContext).toBeDefined();
      expect(comparisonContext.items.length).toBeGreaterThan(0);
      
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      expect(session.analyticalContext.comparisonMode).toBe(true);
      expect(session.currentContext.conversationState).toBe('comparing');
    });
  });

  describe('Visualization Control Flow', () => {
    it('should handle visualization commands and update state', async () => {
      // First, create some data to visualize
      await enhancedVoiceAgent.processVoiceCommand("Show me analytics dashboard", testSessionId);
      
      // Then control the visualization
      const vizInput = "Zoom in on the performance chart";
      
      const response = await enhancedVoiceAgent.processVoiceCommand(vizInput, testSessionId);
      
      expect(response.visualizationCommands).toBeDefined();
      expect(response.visualizationCommands?.length).toBeGreaterThan(0);
      
      // Verify visualization state
      const vizState = enhancedVoiceAgent.getVisualizationState(testSessionId);
      expect(vizState).toBeDefined();
      expect(vizState.voiceControlEnabled).toBe(true);
      
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      expect(session.metadata.visualizationInteractions).toBeGreaterThan(0);
    });
  });

  describe('Cross-Analysis Integration', () => {
    it('should connect related analyses and maintain relationships', async () => {
      // Perform multiple related analyses
      await enhancedVoiceAgent.processVoiceCommand("Analyze supply chain impact", testSessionId);
      await enhancedVoiceAgent.processVoiceCommand("Show sustainability metrics", testSessionId);
      await enhancedVoiceAgent.processVoiceCommand("Calculate optimization ROI", testSessionId);
      
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      
      // Verify multiple analyses
      expect(session.analyticalContext.analysisHistory.length).toBe(3);
      expect(session.conversationTurns.length).toBe(3);
      
      // Verify different analysis types
      const analysisTypes = session.analyticalContext.analysisHistory.map(a => a.type);
      expect(analysisTypes).toContain('impact');
      expect(analysisTypes).toContain('sustainability');
      expect(analysisTypes).toContain('optimization');
      
      // Test cross-analysis connection
      const success = voiceContextManager.addCrossAnalysisConnection(
        testSessionId,
        session.analyticalContext.analysisHistory[0].id,
        session.analyticalContext.analysisHistory[1].id,
        'dependency',
        'Impact analysis informs sustainability metrics'
      );
      
      expect(success).toBe(true);
      expect(session.analyticalContext.crossAnalysisConnections.length).toBe(1);
    });
  });

  describe('Context Persistence and Recovery', () => {
    it('should maintain context across multiple interactions', async () => {
      // Simulate a conversation flow
      const interactions = [
        "What's the current supply chain risk level?",
        "Show me the cost breakdown",
        "How can we optimize this?",
        "Compare with last quarter's performance"
      ];
      
      for (const input of interactions) {
        await enhancedVoiceAgent.processVoiceCommand(input, testSessionId);
      }
      
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      
      // Verify conversation continuity
      expect(session.conversationTurns.length).toBe(interactions.length);
      expect(session.currentContext.topicHistory.length).toBeGreaterThan(0);
      
      // Verify contextual suggestions are relevant
      const suggestions = voiceContextManager.getEnhancedContextualSuggestions(testSessionId);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Verify analytics reflect the conversation
      const analytics = enhancedVoiceAgent.getSessionAnalytics(testSessionId);
      expect(analytics.interactionCount).toBe(interactions.length);
      expect(analytics.conversationInsights).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle errors gracefully and maintain context', async () => {
      // First, establish some context
      await enhancedVoiceAgent.processVoiceCommand("Show me analytics", testSessionId);
      
      // Then send an unclear command
      const response = await enhancedVoiceAgent.processVoiceCommand("xyz abc unclear", testSessionId);
      
      expect(response.spokenResponse).toContain("didn't quite understand");
      
      // Verify context is still maintained
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      expect(session.conversationTurns.length).toBe(2);
      expect(session.metadata.failedCommands).toBe(1);
      expect(session.metadata.successfulCommands).toBe(1);
      
      // Verify recovery with a clear command
      const recoveryResponse = await enhancedVoiceAgent.processVoiceCommand("Show impact analysis", testSessionId);
      expect(recoveryResponse.spokenResponse).toContain("impact");
      expect(session.metadata.successfulCommands).toBe(2);
    });
  });

  describe('Session Analytics and Insights', () => {
    it('should provide comprehensive session analytics', async () => {
      // Create a rich session with various interactions
      await enhancedVoiceAgent.processVoiceCommand("Analyze supply chain impact", testSessionId);
      await enhancedVoiceAgent.processVoiceCommand("Compare strategies", testSessionId);
      await enhancedVoiceAgent.processVoiceCommand("Zoom in on the chart", testSessionId);
      await enhancedVoiceAgent.processVoiceCommand("Show sustainability metrics", testSessionId);
      
      const analytics = enhancedVoiceAgent.getSessionAnalytics(testSessionId);
      
      // Verify comprehensive analytics
      expect(analytics.interactionCount).toBe(4);
      expect(analytics.analyticalInsights).toBeDefined();
      expect(analytics.visualizationInsights).toBeDefined();
      expect(analytics.conversationInsights).toBeDefined();
      
      expect(analytics.analyticalInsights.totalAnalyses).toBeGreaterThan(0);
      expect(analytics.visualizationInsights.navigationEvents).toBeGreaterThan(0);
      expect(analytics.conversationInsights.averageTurnLength).toBeGreaterThan(0);
      
      // Verify export functionality
      const exportData = enhancedVoiceAgent.exportSessionData(testSessionId);
      expect(exportData).toBeDefined();
      expect(exportData.session).toBeDefined();
      expect(exportData.analytics).toBeDefined();
      expect(exportData.patterns).toBeDefined();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle cleanup and memory management', async () => {
      // Create multiple sessions
      const sessionIds = ['session1', 'session2', 'session3'];
      
      for (const sessionId of sessionIds) {
        await enhancedVoiceAgent.processVoiceCommand("Test interaction", sessionId);
      }
      
      // Verify sessions exist
      sessionIds.forEach(sessionId => {
        const session = voiceContextManager.getOrCreateSession(sessionId);
        expect(session).toBeDefined();
      });
      
      // Test cleanup
      voiceContextManager.cleanup();
      
      // Sessions should still exist (not expired)
      sessionIds.forEach(sessionId => {
        const session = voiceContextManager.getOrCreateSession(sessionId);
        expect(session).toBeDefined();
      });
    });
  });
});