// Feature: voiceops-ai-supply-chain, Property 6: Voice Context Preservation
// Validates: Requirements 6.2, 6.5

import * as fc from 'fast-check';
import { voiceContextManager } from '../../lib/voice/voice-context-manager';

describe('Voice Context Manager Property Tests', () => {
  beforeEach(() => {
    // Clear any existing sessions
    voiceContextManager.cleanup();
  });

  // Feature: voiceops-ai-supply-chain, Property 6: Voice Context Preservation
  it('should preserve context across multiple voice interactions', () => {
    fc.assert(
      fc.property(
        fc.record({
          sessionId: fc.string({ minLength: 1, maxLength: 50 }),
          userId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          interactions: fc.array(
            fc.record({
              userInput: fc.string({ minLength: 1, maxLength: 200 }),
              intent: fc.constantFrom('impact', 'optimization', 'sustainability', 'analytics', 'explainability'),
              entities: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
              confidence: fc.float({ min: 0, max: 1 }),
              wasSuccessful: fc.boolean()
            }),
            { minLength: 2, maxLength: 10 }
          )
        }),
        (data) => {
          // Create session and add interactions
          const session = voiceContextManager.getOrCreateSession(data.sessionId, data.userId);
          expect(session).toBeDefined();
          expect(session.id).toBe(data.sessionId);

          let previousContext = { ...session.currentContext };

          // Add each interaction and verify context preservation
          data.interactions.forEach((interaction, index) => {
            const turn = voiceContextManager.addConversationTurn(
              data.sessionId,
              interaction.userInput,
              interaction.intent,
              interaction.entities,
              `Response to ${interaction.userInput}`,
              interaction.confidence,
              interaction.wasSuccessful
            );

            // Verify turn was created
            expect(turn).toBeDefined();
            expect(turn.userInput).toBe(interaction.userInput);
            expect(turn.processedIntent).toBe(interaction.intent);
            expect(turn.confidence).toBe(interaction.confidence);

            // Update context
            voiceContextManager.updateContext(data.sessionId, {
              analysisType: interaction.intent as any,
              lastQuery: interaction.userInput
            });

            const updatedSession = voiceContextManager.getOrCreateSession(data.sessionId);

            // Verify context preservation
            expect(updatedSession.currentContext.analysisType).toBe(interaction.intent);
            expect(updatedSession.currentContext.lastQuery).toBe(interaction.userInput);
            expect(updatedSession.conversationTurns.length).toBe(index + 1);

            // Verify conversation history is maintained
            const history = voiceContextManager.getConversationHistory(data.sessionId);
            expect(history.length).toBe(index + 1);
            expect(history[index].userInput).toBe(interaction.userInput);

            previousContext = { ...updatedSession.currentContext };
          });

          // Verify final state consistency
          const finalSession = voiceContextManager.getOrCreateSession(data.sessionId);
          expect(finalSession.conversationTurns.length).toBe(data.interactions.length);
          expect(finalSession.metadata.interactionCount).toBe(data.interactions.length);

          // Verify analytics are consistent
          const analytics = voiceContextManager.getSessionAnalytics(data.sessionId);
          expect(analytics).toBeDefined();
          expect(analytics.interactionCount).toBe(data.interactions.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 6: Multi-turn Query Consistency
  it('should maintain consistency across multi-turn queries', () => {
    fc.assert(
      fc.property(
        fc.record({
          sessionId: fc.string({ minLength: 1, maxLength: 50 }),
          initialQuery: fc.string({ minLength: 10, maxLength: 100 }),
          queryParts: fc.array(
            fc.record({
              text: fc.string({ minLength: 5, maxLength: 100 }),
              intent: fc.constantFrom('impact', 'optimization', 'sustainability', 'analytics'),
              entities: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer())),
              confidence: fc.float({ min: 0.3, max: 1 })
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        (data) => {
          const expectedParts = data.queryParts.length + 1; // +1 for initial query

          // Start multi-turn query
          const queryId = voiceContextManager.startMultiTurnQuery(
            data.sessionId,
            data.initialQuery,
            expectedParts
          );

          expect(queryId).toBeDefined();
          expect(queryId).toMatch(/^mtq-/);

          const session = voiceContextManager.getOrCreateSession(data.sessionId);
          expect(session.multiTurnQuery).toBeDefined();
          expect(session.multiTurnQuery!.id).toBe(queryId);
          expect(session.currentContext.conversationState).toBe('multi_turn');

          // Add query parts
          data.queryParts.forEach((part, index) => {
            const success = voiceContextManager.addQueryPart(
              data.sessionId,
              part.text,
              part.intent,
              part.entities,
              part.confidence
            );

            expect(success).toBe(true);

            const updatedSession = voiceContextManager.getOrCreateSession(data.sessionId);
            expect(updatedSession.multiTurnQuery!.currentPart).toBe(index + 2); // +2 because we start at 1
            expect(updatedSession.multiTurnQuery!.parts.length).toBe(index + 2);
          });

          // Verify completed query
          const completedQuery = voiceContextManager.getCompletedMultiTurnQuery(data.sessionId);
          expect(completedQuery).toBeDefined();
          expect(completedQuery!.isComplete).toBe(true);
          expect(completedQuery!.parts.length).toBe(expectedParts);

          // Verify context returned to active state
          const finalSession = voiceContextManager.getOrCreateSession(data.sessionId);
          expect(finalSession.currentContext.conversationState).toBe('active');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 6: Analysis Context Management
  it('should properly manage analytical context and dependencies', () => {
    fc.assert(
      fc.property(
        fc.record({
          sessionId: fc.string({ minLength: 1, maxLength: 50 }),
          analyses: fc.array(
            fc.record({
              type: fc.constantFrom('impact', 'optimization', 'sustainability', 'analytics', 'explainability'),
              parameters: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.float())),
              priority: fc.constantFrom('low', 'medium', 'high'),
              dependencies: fc.array(fc.string(), { maxLength: 3 })
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        (data) => {
          const analysisIds: string[] = [];

          // Add analyses
          data.analyses.forEach((analysis) => {
            const analysisId = voiceContextManager.addActiveAnalysis(
              data.sessionId,
              analysis.type as any,
              analysis.parameters,
              analysis.priority as any,
              analysis.dependencies
            );

            expect(analysisId).toBeDefined();
            expect(analysisId).toMatch(/^analysis-/);
            analysisIds.push(analysisId);
          });

          const session = voiceContextManager.getOrCreateSession(data.sessionId);
          expect(session.analyticalContext.activeAnalyses.length).toBe(data.analyses.length);

          // Update analysis statuses
          analysisIds.forEach((id, index) => {
            const mockResults = {
              data: { value: Math.random() * 100 },
              confidence: Math.random()
            };

            const success = voiceContextManager.updateAnalysisStatus(
              data.sessionId,
              id,
              'completed',
              mockResults
            );

            expect(success).toBe(true);

            const analysis = session.analyticalContext.activeAnalyses.find(a => a.id === id);
            expect(analysis).toBeDefined();
            expect(analysis!.status).toBe('completed');
            expect(analysis!.results).toEqual(mockResults);
            expect(analysis!.completionTime).toBeDefined();
          });

          // Verify analysis history
          expect(session.analyticalContext.analysisHistory.length).toBe(data.analyses.length);

          // Add cross-analysis connections
          if (analysisIds.length > 1) {
            const success = voiceContextManager.addCrossAnalysisConnection(
              data.sessionId,
              analysisIds[0],
              analysisIds[1],
              'dependency',
              'Test connection'
            );

            expect(success).toBe(true);
            expect(session.analyticalContext.crossAnalysisConnections.length).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 6: Visualization State Consistency
  it('should maintain visualization state consistency across interactions', () => {
    fc.assert(
      fc.property(
        fc.record({
          sessionId: fc.string({ minLength: 1, maxLength: 50 }),
          charts: fc.array(
            fc.record({
              type: fc.constantFrom('bar', 'line', 'pie', 'scatter', 'heatmap'),
              dataSource: fc.string({ minLength: 1, maxLength: 50 }),
              isVoiceControlled: fc.boolean(),
              state: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer()))
            }),
            { minLength: 1, maxLength: 5 }
          ),
          navigationEvents: fc.array(
            fc.record({
              view: fc.constantFrom('dashboard', 'analytics', 'optimization', 'sustainability'),
              zoomLevel: fc.float({ min: 0.5, max: 3.0 })
            }),
            { minLength: 1, maxLength: 10 }
          )
        }),
        (data) => {
          const chartIds: string[] = [];

          // Add charts
          data.charts.forEach((chart) => {
            const chartId = voiceContextManager.addActiveChart(
              data.sessionId,
              chart.type,
              chart.dataSource,
              chart.isVoiceControlled,
              chart.state
            );

            expect(chartId).toBeDefined();
            expect(chartId).toMatch(/^chart-/);
            chartIds.push(chartId);
          });

          const session = voiceContextManager.getOrCreateSession(data.sessionId);
          expect(session.visualizationState.activeCharts.length).toBe(data.charts.length);

          // Perform navigation events
          data.navigationEvents.forEach((event, index) => {
            const success = voiceContextManager.updateVisualizationState(data.sessionId, {
              currentView: event.view,
              zoomLevel: event.zoomLevel
            });

            expect(success).toBe(true);

            const updatedSession = voiceContextManager.getOrCreateSession(data.sessionId);
            expect(updatedSession.visualizationState.currentView).toBe(event.view);
            expect(updatedSession.visualizationState.zoomLevel).toBe(event.zoomLevel);

            // Verify navigation history
            if (index > 0) {
              expect(updatedSession.visualizationState.navigationHistory.length).toBeGreaterThan(0);
            }
          });

          // Execute visualization commands
          const commandSuccess = voiceContextManager.executeVisualizationCommand(data.sessionId, {
            type: 'zoom',
            target: chartIds[0] || 'default',
            parameters: { level: 1.5 }
          });

          expect(commandSuccess).toBe(true);

          // Verify patterns can be retrieved
          const patterns = voiceContextManager.getVisualizationPatterns(data.sessionId);
          expect(patterns).toBeDefined();
          expect(patterns.chartInteractions).toBeDefined();
          expect(patterns.navigationPattern).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 6: Session Cleanup and Memory Management
  it('should properly clean up expired sessions and maintain memory bounds', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            sessionId: fc.string({ minLength: 1, maxLength: 50 }),
            interactions: fc.array(
              fc.record({
                userInput: fc.string({ minLength: 1, maxLength: 100 }),
                intent: fc.constantFrom('impact', 'optimization', 'sustainability'),
                confidence: fc.float({ min: 0, max: 1 })
              }),
              { minLength: 1, maxLength: 20 }
            )
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (sessions) => {
          // Create multiple sessions with interactions
          sessions.forEach((sessionData) => {
            sessionData.interactions.forEach((interaction) => {
              voiceContextManager.addConversationTurn(
                sessionData.sessionId,
                interaction.userInput,
                interaction.intent,
                {},
                `Response to ${interaction.userInput}`,
                interaction.confidence,
                true
              );
            });
          });

          // Verify sessions were created
          sessions.forEach((sessionData) => {
            const session = voiceContextManager.getOrCreateSession(sessionData.sessionId);
            expect(session).toBeDefined();
            expect(session.conversationTurns.length).toBeLessThanOrEqual(50); // MAX_CONVERSATION_TURNS
          });

          // Test cleanup functionality
          voiceContextManager.cleanup();

          // Verify sessions are still accessible (not expired)
          sessions.forEach((sessionData) => {
            const session = voiceContextManager.getOrCreateSession(sessionData.sessionId);
            expect(session).toBeDefined();
          });

          // Test analytics generation doesn't break with multiple sessions
          sessions.forEach((sessionData) => {
            const analytics = voiceContextManager.getSessionAnalytics(sessionData.sessionId);
            expect(analytics).toBeDefined();
            expect(analytics.interactionCount).toBe(sessionData.interactions.length);
          });
        }
      ),
      { numRuns: 50 } // Reduced runs for performance
    );
  });
});