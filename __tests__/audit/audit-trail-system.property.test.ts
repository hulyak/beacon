// Feature: voiceops-ai-supply-chain, Property 9: Audit Trail Completeness
// Validates: Requirements 10.1, 10.2

import * as fc from 'fast-check';
import { auditTrailSystem } from '../../lib/audit/audit-trail-system';

describe('Audit Trail System Property Tests', () => {
  beforeEach(() => {
    // Clear any existing audit events
    auditTrailSystem.cleanupOldEvents();
  });

  // Feature: voiceops-ai-supply-chain, Property 9: Audit Trail Completeness
  it('should maintain complete audit trails for all AI decisions and user interactions', () => {
    fc.assert(
      fc.property(
        fc.record({
          sessionId: fc.string({ minLength: 1, maxLength: 50 }),
          userId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          aiDecisions: fc.array(
            fc.record({
              source: fc.constantFrom('impact-assessment', 'roi-optimization', 'sustainability-tracker', 'explainability-engine'),
              recommendation: fc.record({
                type: fc.constantFrom('strategy', 'optimization', 'risk-mitigation', 'sustainability-improvement'),
                value: fc.oneof(fc.string(), fc.integer(), fc.float()),
                confidence: fc.float({ min: 0, max: 1 }),
                reasoning: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
                dataSourcesUsed: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
                algorithmsApplied: fc.array(fc.constantFrom('neural-network', 'decision-tree', 'regression', 'clustering'), { minLength: 1, maxLength: 3 })
              })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          userInteractions: fc.array(
            fc.record({
              source: fc.constantFrom('voice-interface', 'web-dashboard', 'mobile-app'),
              userInput: fc.record({
                type: fc.constantFrom('voice', 'text', 'click', 'touch'),
                content: fc.string({ minLength: 1, maxLength: 200 }),
                processedIntent: fc.option(fc.constantFrom('analyze-impact', 'optimize-roi', 'track-sustainability', 'explain-decision')),
                entities: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean()))
              })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          systemActions: fc.array(
            fc.record({
              source: fc.constantFrom('data-processor', 'calculation-engine', 'notification-service'),
              action: fc.constantFrom('calculate-impact', 'process-data', 'send-notification', 'update-cache'),
              systemAction: fc.record({
                operation: fc.string({ minLength: 5, maxLength: 50 }),
                parameters: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.float())),
                result: fc.constantFrom('success', 'failure', 'partial'),
                errorMessage: fc.option(fc.string({ minLength: 10, maxLength: 100 }))
              })
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        (data) => {
          const eventIds: string[] = [];

          // Log AI decisions
          data.aiDecisions.forEach(decision => {
            const eventId = auditTrailSystem.logAIDecision(
              data.sessionId,
              decision.source,
              decision.recommendation,
              {
                correlationId: `test-corr-${Date.now()}`,
                performance: {
                  processingTimeMs: Math.random() * 1000
                }
              }
            );
            
            expect(eventId).toBeDefined();
            expect(eventId).toMatch(/^audit-/);
            eventIds.push(eventId);
          });

          // Log user interactions
          data.userInteractions.forEach(interaction => {
            const eventId = auditTrailSystem.logUserInteraction(
              data.sessionId,
              data.userId,
              interaction.source,
              interaction.userInput,
              {
                correlationId: `test-corr-${Date.now()}`,
                deviceInfo: {
                  type: 'desktop',
                  os: 'Windows 10',
                  browser: 'Chrome'
                }
              }
            );
            
            expect(eventId).toBeDefined();
            expect(eventId).toMatch(/^audit-/);
            eventIds.push(eventId);
          });

          // Log system actions
          data.systemActions.forEach(action => {
            const eventId = auditTrailSystem.logSystemAction(
              data.sessionId,
              action.source,
              action.action,
              action.systemAction,
              {
                correlationId: `test-corr-${Date.now()}`
              }
            );
            
            expect(eventId).toBeDefined();
            expect(eventId).toMatch(/^audit-/);
            eventIds.push(eventId);
          });

          // Verify all events were logged
          const totalExpectedEvents = data.aiDecisions.length + data.userInteractions.length + data.systemActions.length;
          expect(eventIds.length).toBe(totalExpectedEvents);

          // Query events for the session
          const sessionEvents = auditTrailSystem.queryEvents({ sessionId: data.sessionId });
          expect(sessionEvents.length).toBe(totalExpectedEvents);

          // Verify event completeness
          sessionEvents.forEach(event => {
            expect(event.id).toBeDefined();
            expect(event.timestamp).toBeInstanceOf(Date);
            expect(event.sessionId).toBe(data.sessionId);
            expect(event.source).toBeDefined();
            expect(event.action).toBeDefined();
            expect(event.metadata.correlationId).toBeDefined();

            // Verify event-specific details
            switch (event.eventType) {
              case 'ai_decision':
                expect(event.details.recommendation).toBeDefined();
                expect(event.details.recommendation!.confidence).toBeGreaterThanOrEqual(0);
                expect(event.details.recommendation!.confidence).toBeLessThanOrEqual(1);
                expect(event.details.recommendation!.reasoning).toBeDefined();
                expect(event.details.recommendation!.dataSourcesUsed).toBeDefined();
                expect(event.details.recommendation!.algorithmsApplied).toBeDefined();
                break;

              case 'user_interaction':
                expect(event.details.userInput).toBeDefined();
                expect(event.details.userInput!.type).toBeDefined();
                expect(event.details.userInput!.content).toBeDefined();
                break;

              case 'system_action':
                expect(event.details.systemAction).toBeDefined();
                expect(event.details.systemAction!.operation).toBeDefined();
                expect(event.details.systemAction!.result).toBeDefined();
                break;
            }
          });

          // Verify audit trail integrity
          const integrity = auditTrailSystem.validateIntegrity();
          expect(integrity.isValid).toBe(true);
          expect(integrity.issues).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 9: Audit Report Generation
  it('should generate comprehensive audit reports with accurate statistics', () => {
    fc.assert(
      fc.property(
        fc.record({
          reportTitle: fc.string({ minLength: 5, maxLength: 100 }),
          reportDescription: fc.string({ minLength: 10, maxLength: 200 }),
          generatedBy: fc.string({ minLength: 1, maxLength: 50 }),
          sessions: fc.array(
            fc.record({
              sessionId: fc.string({ minLength: 1, maxLength: 50 }),
              userId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
              events: fc.array(
                fc.record({
                  eventType: fc.constantFrom('ai_decision', 'user_interaction', 'system_action'),
                  source: fc.string({ minLength: 5, maxLength: 30 }),
                  confidence: fc.option(fc.float({ min: 0, max: 1 })),
                  success: fc.boolean()
                }),
                { minLength: 1, maxLength: 20 }
              )
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        (data) => {
          const allEventIds: string[] = [];

          // Generate audit events for all sessions
          data.sessions.forEach(session => {
            session.events.forEach(eventData => {
              let eventId: string;

              switch (eventData.eventType) {
                case 'ai_decision':
                  eventId = auditTrailSystem.logAIDecision(
                    session.sessionId,
                    eventData.source,
                    {
                      type: 'test-recommendation',
                      value: 'test-value',
                      confidence: eventData.confidence || 0.8,
                      reasoning: ['Test reasoning'],
                      dataSourcesUsed: ['test-data-source'],
                      algorithmsApplied: ['test-algorithm']
                    }
                  );
                  break;

                case 'user_interaction':
                  eventId = auditTrailSystem.logUserInteraction(
                    session.sessionId,
                    session.userId,
                    eventData.source,
                    {
                      type: 'voice',
                      content: 'test user input',
                      processedIntent: 'test-intent'
                    }
                  );
                  break;

                case 'system_action':
                  eventId = auditTrailSystem.logSystemAction(
                    session.sessionId,
                    eventData.source,
                    'test-action',
                    {
                      operation: 'test-operation',
                      parameters: { test: 'value' },
                      result: eventData.success ? 'success' : 'failure'
                    }
                  );
                  break;

                default:
                  throw new Error(`Unknown event type: ${eventData.eventType}`);
              }

              allEventIds.push(eventId);
            });
          });

          // Generate audit report
          const report = auditTrailSystem.generateAuditReport(
            data.reportTitle,
            data.reportDescription,
            data.generatedBy
          );

          // Verify report structure
          expect(report.id).toBeDefined();
          expect(report.title).toBe(data.reportTitle);
          expect(report.description).toBe(data.reportDescription);
          expect(report.generatedBy).toBe(data.generatedBy);
          expect(report.generatedAt).toBeInstanceOf(Date);
          expect(report.timeRange.start).toBeInstanceOf(Date);
          expect(report.timeRange.end).toBeInstanceOf(Date);

          // Verify events are included
          expect(report.events.length).toBe(allEventIds.length);

          // Verify summary statistics
          const expectedTotalEvents = data.sessions.reduce((sum, session) => sum + session.events.length, 0);
          expect(report.summary.totalEvents).toBe(expectedTotalEvents);

          // Verify event type counts
          const expectedEventTypes = data.sessions.reduce((types, session) => {
            session.events.forEach(event => {
              types[event.eventType] = (types[event.eventType] || 0) + 1;
            });
            return types;
          }, {} as { [key: string]: number });

          Object.entries(expectedEventTypes).forEach(([eventType, count]) => {
            expect(report.summary.eventsByType[eventType]).toBe(count);
          });

          // Verify unique sessions count
          const uniqueSessionIds = new Set(data.sessions.map(s => s.sessionId));
          expect(report.summary.uniqueSessions).toBe(uniqueSessionIds.size);

          // Verify unique users count
          const uniqueUserIds = new Set(
            data.sessions
              .map(s => s.userId)
              .filter((userId): userId is string => userId !== null && userId !== undefined)
          );
          expect(report.summary.uniqueUsers).toBe(uniqueUserIds.size);

          // Verify compliance information
          expect(report.compliance).toBeDefined();
          expect(report.compliance.framework).toBeDefined();
          expect(report.compliance.requirements).toBeDefined();
          expect(Array.isArray(report.compliance.requirements)).toBe(true);
          expect(report.compliance.dataRetention).toBeDefined();
          expect(report.compliance.encryption).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 9: Data Export Consistency
  it('should export audit data consistently across different formats', () => {
    fc.assert(
      fc.property(
        fc.record({
          sessionId: fc.string({ minLength: 1, maxLength: 50 }),
          events: fc.array(
            fc.record({
              eventType: fc.constantFrom('ai_decision', 'user_interaction', 'system_action'),
              source: fc.string({ minLength: 5, maxLength: 30 }),
              action: fc.string({ minLength: 5, maxLength: 30 }),
              confidence: fc.option(fc.float({ min: 0, max: 1 }))
            }),
            { minLength: 1, maxLength: 10 }
          )
        }),
        (data) => {
          // Generate audit events
          data.events.forEach(eventData => {
            switch (eventData.eventType) {
              case 'ai_decision':
                auditTrailSystem.logAIDecision(
                  data.sessionId,
                  eventData.source,
                  {
                    type: 'test-recommendation',
                    value: 'test-value',
                    confidence: eventData.confidence || 0.8,
                    reasoning: ['Test reasoning'],
                    dataSourcesUsed: ['test-data-source'],
                    algorithmsApplied: ['test-algorithm']
                  }
                );
                break;

              case 'user_interaction':
                auditTrailSystem.logUserInteraction(
                  data.sessionId,
                  'test-user',
                  eventData.source,
                  {
                    type: 'voice',
                    content: 'test user input'
                  }
                );
                break;

              case 'system_action':
                auditTrailSystem.logSystemAction(
                  data.sessionId,
                  eventData.source,
                  eventData.action,
                  {
                    operation: 'test-operation',
                    parameters: { test: 'value' },
                    result: 'success'
                  }
                );
                break;
            }
          });

          // Export in JSON format
          const jsonExport = auditTrailSystem.exportAuditData('json', { sessionId: data.sessionId });
          expect(typeof jsonExport).toBe('string');
          
          const parsedJson = JSON.parse(jsonExport as string);
          expect(Array.isArray(parsedJson)).toBe(true);
          expect(parsedJson.length).toBe(data.events.length);

          // Verify JSON structure
          parsedJson.forEach((event: any) => {
            expect(event.id).toBeDefined();
            expect(event.timestamp).toBeDefined();
            expect(event.eventType).toBeDefined();
            expect(event.sessionId).toBe(data.sessionId);
            expect(event.source).toBeDefined();
            expect(event.action).toBeDefined();
            expect(event.details).toBeDefined();
            expect(event.metadata).toBeDefined();
          });

          // Export in CSV format
          const csvExport = auditTrailSystem.exportAuditData('csv', { sessionId: data.sessionId });
          expect(typeof csvExport).toBe('string');
          
          const csvLines = (csvExport as string).split('\n');
          expect(csvLines.length).toBe(data.events.length + 1); // +1 for header
          
          // Verify CSV header
          const header = csvLines[0];
          expect(header).toContain('ID');
          expect(header).toContain('Timestamp');
          expect(header).toContain('Event Type');
          expect(header).toContain('Session ID');

          // Verify CSV data rows
          for (let i = 1; i < csvLines.length; i++) {
            const row = csvLines[i];
            expect(row).toContain(data.sessionId);
            expect(row.split(',').length).toBeGreaterThanOrEqual(10); // Expected number of columns
          }

          // Verify data consistency between formats
          parsedJson.forEach((jsonEvent: any, index: number) => {
            const csvRow = csvLines[index + 1]; // +1 to skip header
            expect(csvRow).toContain(jsonEvent.id);
            expect(csvRow).toContain(jsonEvent.eventType);
            expect(csvRow).toContain(jsonEvent.sessionId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 9: Query Filtering Accuracy
  it('should accurately filter audit events based on query parameters', () => {
    fc.assert(
      fc.property(
        fc.record({
          sessions: fc.array(
            fc.record({
              sessionId: fc.string({ minLength: 1, maxLength: 50 }),
              userId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
              source: fc.constantFrom('impact-assessment', 'roi-optimization', 'sustainability-tracker'),
              eventType: fc.constantFrom('ai_decision', 'user_interaction', 'system_action'),
              confidence: fc.float({ min: 0, max: 1 })
            }),
            { minLength: 5, maxLength: 20 }
          ),
          queryFilters: fc.record({
            eventTypes: fc.option(fc.array(fc.constantFrom('ai_decision', 'user_interaction', 'system_action'), { minLength: 1, maxLength: 3 })),
            source: fc.option(fc.constantFrom('impact-assessment', 'roi-optimization', 'sustainability-tracker')),
            confidenceThreshold: fc.option(fc.float({ min: 0, max: 1 })),
            limit: fc.option(fc.integer({ min: 1, max: 10 }))
          })
        }),
        (data) => {
          const eventIds: string[] = [];

          // Generate audit events
          data.sessions.forEach(session => {
            let eventId: string;

            switch (session.eventType) {
              case 'ai_decision':
                eventId = auditTrailSystem.logAIDecision(
                  session.sessionId,
                  session.source,
                  {
                    type: 'test-recommendation',
                    value: 'test-value',
                    confidence: session.confidence,
                    reasoning: ['Test reasoning'],
                    dataSourcesUsed: ['test-data-source'],
                    algorithmsApplied: ['test-algorithm']
                  }
                );
                break;

              case 'user_interaction':
                eventId = auditTrailSystem.logUserInteraction(
                  session.sessionId,
                  session.userId,
                  session.source,
                  {
                    type: 'voice',
                    content: 'test user input'
                  }
                );
                break;

              case 'system_action':
                eventId = auditTrailSystem.logSystemAction(
                  session.sessionId,
                  session.source,
                  'test-action',
                  {
                    operation: 'test-operation',
                    parameters: { test: 'value' },
                    result: 'success'
                  }
                );
                break;
            }

            eventIds.push(eventId);
          });

          // Query with filters
          const filteredEvents = auditTrailSystem.queryEvents(data.queryFilters);

          // Verify filtering accuracy
          filteredEvents.forEach(event => {
            // Check event type filter
            if (data.queryFilters.eventTypes) {
              expect(data.queryFilters.eventTypes).toContain(event.eventType);
            }

            // Check source filter
            if (data.queryFilters.source) {
              expect(event.source).toBe(data.queryFilters.source);
            }

            // Check confidence threshold filter
            if (data.queryFilters.confidenceThreshold !== undefined) {
              const confidence = event.details.recommendation?.confidence;
              if (confidence !== undefined) {
                expect(confidence).toBeGreaterThanOrEqual(data.queryFilters.confidenceThreshold);
              }
            }
          });

          // Verify limit filter
          if (data.queryFilters.limit) {
            expect(filteredEvents.length).toBeLessThanOrEqual(data.queryFilters.limit);
          }

          // Verify events are sorted by timestamp (newest first)
          for (let i = 1; i < filteredEvents.length; i++) {
            expect(filteredEvents[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
              filteredEvents[i].timestamp.getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});