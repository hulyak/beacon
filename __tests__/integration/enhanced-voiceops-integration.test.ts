// Enhanced VoiceOps Integration Test
// Validates: Complete system integration with all enhanced features
// Requirements: All requirements validation across impact assessment, explainability, sustainability, optimization, analytics, voice integration, mobile responsiveness, and audit trail

import { enhancedVoiceAgent } from '../../lib/voice/enhanced-voice-agent';
import { voiceContextManager } from '../../lib/voice/voice-context-manager';
import { crossDeviceSyncService } from '../../lib/sync/cross-device-sync';
import { auditTrailSystem } from '../../lib/audit/audit-trail-system';

describe('Enhanced VoiceOps Integration Tests', () => {
  const testSessionId = 'integration-test-session';
  const testUserId = 'integration-test-user';
  const testDeviceId = 'integration-test-device';

  beforeEach(() => {
    // Clean up before each test
    voiceContextManager.cleanup();
    crossDeviceSyncService.cleanup();
    auditTrailSystem.cleanupOldEvents();
  });

  describe('Complete Voice-to-Analytics Pipeline', () => {
    it('should process voice commands through complete analytical pipeline', async () => {
      // Register device for cross-device sync
      const device = crossDeviceSyncService.registerDevice(
        testDeviceId,
        'desktop',
        testUserId,
        testSessionId,
        {
          hasVoice: true,
          hasTouchscreen: false,
          screenSize: 'large',
          supportsNotifications: true,
          bandwidth: 'high'
        }
      );

      expect(device).toBeDefined();
      expect(device.isActive).toBe(true);

      // Test impact analysis voice command
      const impactResponse = await enhancedVoiceAgent.processVoiceCommand(
        "What's the financial impact if our main supplier fails?",
        testSessionId
      );

      expect(impactResponse.spokenResponse).toBeDefined();
      expect(impactResponse.spokenResponse.length).toBeGreaterThan(0);
      expect(impactResponse.contextUpdate.analysisType).toBe('impact');
      expect(impactResponse.visualData).toBeDefined();
      expect(impactResponse.analyticalResults).toBeDefined();

      // Verify context was updated
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      expect(session.currentContext.analysisType).toBe('impact');
      expect(session.currentContext.lastQuery).toContain('financial impact');
      expect(session.conversationTurns.length).toBe(1);

      // Verify audit trail was created
      const auditEvents = auditTrailSystem.queryEvents({ sessionId: testSessionId });
      expect(auditEvents.length).toBeGreaterThan(0);
      
      const userInteractionEvent = auditEvents.find(e => e.eventType === 'user_interaction');
      expect(userInteractionEvent).toBeDefined();
      expect(userInteractionEvent!.details.userInput?.content).toContain('financial impact');

      // Test explainability follow-up
      const explainResponse = await enhancedVoiceAgent.processVoiceCommand(
        "Why do you recommend this approach?",
        testSessionId
      );

      expect(explainResponse.spokenResponse).toBeDefined();
      expect(explainResponse.contextUpdate.analysisType).toBe('explainability');
      expect(explainResponse.analyticalResults).toBeDefined();

      // Verify conversation continuity
      const updatedSession = voiceContextManager.getOrCreateSession(testSessionId);
      expect(updatedSession.conversationTurns.length).toBe(2);
      expect(updatedSession.currentContext.topicHistory).toContain('impact');
      expect(updatedSession.currentContext.topicHistory).toContain('explainability');

      // Test sustainability analysis
      const sustainabilityResponse = await enhancedVoiceAgent.processVoiceCommand(
        "Show me the carbon footprint of this strategy",
        testSessionId
      );

      expect(sustainabilityResponse.spokenResponse).toBeDefined();
      expect(sustainabilityResponse.contextUpdate.analysisType).toBe('sustainability');
      expect(sustainabilityResponse.visualData).toBeDefined();

      // Verify cross-analysis connections
      const finalSession = voiceContextManager.getOrCreateSession(testSessionId);
      expect(finalSession.analyticalContext.analysisHistory.length).toBeGreaterThan(0);
      expect(finalSession.conversationTurns.length).toBe(3);

      // Verify device state synchronization
      const deviceState = crossDeviceSyncService.getDeviceState(testDeviceId);
      expect(deviceState).toBeDefined();
      expect(deviceState!.currentPage).toBeDefined();
      expect(deviceState!.analyticalContext.activeAnalyses.length).toBeGreaterThan(0);
    });

    it('should handle multi-turn queries with context preservation', async () => {
      // Start multi-turn query
      const multiTurnResponse1 = await enhancedVoiceAgent.processVoiceCommand(
        "First analyze the impact of supplier diversification, then show me the ROI optimization",
        testSessionId
      );

      expect(multiTurnResponse1.multiTurnQuery).toBeDefined();
      expect(multiTurnResponse1.multiTurnQuery!.isMultiTurn).toBe(true);
      expect(multiTurnResponse1.spokenResponse).toContain('multi-part');

      // Continue multi-turn query
      const multiTurnResponse2 = await enhancedVoiceAgent.processVoiceCommand(
        "Compare the payback periods for different strategies",
        testSessionId
      );

      expect(multiTurnResponse2.spokenResponse).toBeDefined();
      expect(multiTurnResponse2.visualData).toBeDefined();

      // Verify multi-turn query completion
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      const completedQuery = voiceContextManager.getCompletedMultiTurnQuery(testSessionId);
      
      if (completedQuery) {
        expect(completedQuery.isComplete).toBe(true);
        expect(completedQuery.parts.length).toBeGreaterThan(1);
      }

      // Verify context preservation across turns
      expect(session.conversationTurns.length).toBeGreaterThan(1);
      expect(session.currentContext.conversationState).toBe('active');
    });

    it('should handle visualization commands with voice control', async () => {
      // Initial analytics request
      const analyticsResponse = await enhancedVoiceAgent.processVoiceCommand(
        "Show me the real-time analytics dashboard",
        testSessionId
      );

      expect(analyticsResponse.spokenResponse).toBeDefined();
      expect(analyticsResponse.actionRequired?.type).toBe('navigate');
      expect(analyticsResponse.actionRequired?.target).toBe('/analytics');

      // Voice-controlled visualization command
      const vizResponse = await enhancedVoiceAgent.processVoiceCommand(
        "Zoom in on the performance metrics chart",
        testSessionId
      );

      expect(vizResponse.visualizationCommands).toBeDefined();
      expect(vizResponse.visualizationCommands!.length).toBeGreaterThan(0);
      
      const zoomCommand = vizResponse.visualizationCommands!.find(cmd => cmd.type === 'navigate');
      expect(zoomCommand).toBeDefined();

      // Verify visualization state was updated
      const session = voiceContextManager.getOrCreateSession(testSessionId);
      expect(session.visualizationState.activeCharts.length).toBeGreaterThan(0);
      expect(session.metadata.voiceNavigationUsage).toBeGreaterThan(0);
    });
  });

  describe('Cross-Device Synchronization Integration', () => {
    it('should synchronize analytical sessions across multiple devices', async () => {
      const mobileDeviceId = 'mobile-test-device';
      const desktopDeviceId = 'desktop-test-device';

      // Register multiple devices for same user
      const mobileDevice = crossDeviceSyncService.registerDevice(
        mobileDeviceId,
        'mobile',
        testUserId,
        'mobile-session',
        {
          hasVoice: false,
          hasTouchscreen: true,
          screenSize: 'small',
          supportsNotifications: true,
          bandwidth: 'medium'
        }
      );

      const desktopDevice = crossDeviceSyncService.registerDevice(
        desktopDeviceId,
        'desktop',
        testUserId,
        'desktop-session',
        {
          hasVoice: true,
          hasTouchscreen: false,
          screenSize: 'large',
          supportsNotifications: true,
          bandwidth: 'high'
        }
      );

      expect(mobileDevice.isActive).toBe(true);
      expect(desktopDevice.isActive).toBe(true);

      // Start analysis on desktop
      const desktopResponse = await enhancedVoiceAgent.processVoiceCommand(
        "Analyze the sustainability impact of our current operations",
        'desktop-session'
      );

      expect(desktopResponse.spokenResponse).toBeDefined();

      // Update device state to trigger sync
      crossDeviceSyncService.updateDeviceState(
        desktopDeviceId,
        {
          currentPage: '/sustainability',
          analysisType: 'sustainability',
          voiceState: {
            isActive: true,
            lastCommand: 'Analyze the sustainability impact',
            contextHistory: ['sustainability analysis']
          }
        },
        true // sync to other devices
      );

      // Allow time for sync
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify state was synced to mobile (with adaptations)
      const mobileState = crossDeviceSyncService.getDeviceState(mobileDeviceId);
      const desktopState = crossDeviceSyncService.getDeviceState(desktopDeviceId);

      expect(mobileState).toBeDefined();
      expect(desktopState).toBeDefined();

      // Core state should be consistent
      expect(mobileState!.currentPage).toBe('/sustainability');
      expect(mobileState!.analysisType).toBe('sustainability');

      // Voice state should be adapted for mobile (no voice capability)
      expect(mobileState!.voiceState.isActive).toBe(false);
      expect(desktopState!.voiceState.isActive).toBe(true);

      // Verify user devices are tracked
      const userDevices = crossDeviceSyncService.getUserDevices(testUserId);
      expect(userDevices.length).toBe(2);
    });

    it('should handle device offline/online transitions during analysis', async () => {
      // Register device
      const device = crossDeviceSyncService.registerDevice(
        testDeviceId,
        'tablet',
        testUserId,
        testSessionId,
        {
          hasVoice: true,
          hasTouchscreen: true,
          screenSize: 'medium',
          supportsNotifications: true,
          bandwidth: 'medium'
        }
      );

      // Start analysis
      const response = await enhancedVoiceAgent.processVoiceCommand(
        "Calculate ROI for automation strategy",
        testSessionId
      );

      expect(response.spokenResponse).toBeDefined();

      // Simulate device going offline
      crossDeviceSyncService.setDeviceOffline(testDeviceId);

      // Verify device is offline
      let userDevices = crossDeviceSyncService.getUserDevices(testUserId);
      expect(userDevices.length).toBe(0); // No active devices

      // Bring device back online
      crossDeviceSyncService.setDeviceOnline(testDeviceId);

      // Verify device is back online
      userDevices = crossDeviceSyncService.getUserDevices(testUserId);
      expect(userDevices.length).toBe(1);
      expect(userDevices[0].isActive).toBe(true);

      // Verify state is preserved
      const deviceState = crossDeviceSyncService.getDeviceState(testDeviceId);
      expect(deviceState).toBeDefined();
    });
  });

  describe('Audit Trail Integration', () => {
    it('should create comprehensive audit trails for complete analytical workflows', async () => {
      // Process multiple voice commands to create audit trail
      await enhancedVoiceAgent.processVoiceCommand(
        "What's the impact of port closure in Asia?",
        testSessionId
      );

      await enhancedVoiceAgent.processVoiceCommand(
        "Explain your confidence in this analysis",
        testSessionId
      );

      await enhancedVoiceAgent.processVoiceCommand(
        "Show me green alternatives to reduce emissions",
        testSessionId
      );

      // Generate comprehensive audit report
      const auditReport = auditTrailSystem.generateAuditReport(
        'Integration Test Audit Report',
        'Complete audit trail for integration testing',
        'integration-test-system'
      );

      expect(auditReport).toBeDefined();
      expect(auditReport.events.length).toBeGreaterThan(0);
      expect(auditReport.summary.totalEvents).toBeGreaterThan(0);
      expect(auditReport.summary.uniqueSessions).toBeGreaterThanOrEqual(1);

      // Verify different event types are captured
      const eventTypes = new Set(auditReport.events.map(e => e.eventType));
      expect(eventTypes.has('user_interaction')).toBe(true);

      // Verify audit trail completeness
      const sessionEvents = auditTrailSystem.queryEvents({ sessionId: testSessionId });
      expect(sessionEvents.length).toBeGreaterThan(0);

      // Verify each voice command created audit events
      const userInteractions = sessionEvents.filter(e => e.eventType === 'user_interaction');
      expect(userInteractions.length).toBe(3); // Three voice commands

      userInteractions.forEach(event => {
        expect(event.details.userInput).toBeDefined();
        expect(event.details.userInput!.type).toBe('voice');
        expect(event.details.userInput!.content).toBeDefined();
        expect(event.sessionId).toBe(testSessionId);
        expect(event.metadata.correlationId).toBeDefined();
      });

      // Verify audit data export
      const jsonExport = auditTrailSystem.exportAuditData('json', { sessionId: testSessionId });
      expect(jsonExport).toBeDefined();
      
      const exportedEvents = JSON.parse(jsonExport as string);
      expect(Array.isArray(exportedEvents)).toBe(true);
      expect(exportedEvents.length).toBe(sessionEvents.length);

      // Verify CSV export
      const csvExport = auditTrailSystem.exportAuditData('csv', { sessionId: testSessionId });
      expect(csvExport).toBeDefined();
      expect(typeof csvExport).toBe('string');
      
      const csvLines = (csvExport as string).split('\n');
      expect(csvLines.length).toBe(sessionEvents.length + 1); // +1 for header
    });

    it('should maintain audit integrity across system operations', async () => {
      // Perform various system operations
      const operations = [
        "Analyze financial impact of supplier disruption",
        "Compare three optimization strategies",
        "Calculate carbon footprint for current operations",
        "Explain the reasoning behind top recommendation"
      ];

      for (const operation of operations) {
        await enhancedVoiceAgent.processVoiceCommand(operation, testSessionId);
      }

      // Validate audit trail integrity
      const integrity = auditTrailSystem.validateIntegrity();
      expect(integrity.isValid).toBe(true);
      expect(integrity.issues).toHaveLength(0);

      // Verify chronological ordering
      const allEvents = auditTrailSystem.queryEvents({ sessionId: testSessionId });
      for (let i = 1; i < allEvents.length; i++) {
        expect(allEvents[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          allEvents[i].timestamp.getTime()
        );
      }

      // Verify correlation IDs are unique
      const correlationIds = new Set(allEvents.map(e => e.metadata.correlationId));
      expect(correlationIds.size).toBe(allEvents.length);

      // Verify all required fields are present
      allEvents.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.eventType).toBeDefined();
        expect(event.sessionId).toBe(testSessionId);
        expect(event.source).toBeDefined();
        expect(event.action).toBeDefined();
        expect(event.details).toBeDefined();
        expect(event.metadata).toBeDefined();
        expect(event.metadata.correlationId).toBeDefined();
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent voice interactions efficiently', async () => {
      const concurrentCommands = [
        "Analyze impact of supplier failure",
        "Calculate ROI for automation",
        "Show sustainability metrics",
        "Explain decision confidence",
        "Display real-time analytics"
      ];

      const startTime = Date.now();

      // Process commands concurrently
      const responses = await Promise.all(
        concurrentCommands.map((command, index) => 
          enhancedVoiceAgent.processVoiceCommand(command, `concurrent-session-${index}`)
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all commands were processed
      expect(responses.length).toBe(concurrentCommands.length);
      responses.forEach(response => {
        expect(response.spokenResponse).toBeDefined();
        expect(response.spokenResponse.length).toBeGreaterThan(0);
      });

      // Verify reasonable performance (should complete within 10 seconds)
      expect(totalTime).toBeLessThan(10000);

      // Verify audit trails were created for all sessions
      for (let i = 0; i < concurrentCommands.length; i++) {
        const sessionEvents = auditTrailSystem.queryEvents({ sessionId: `concurrent-session-${i}` });
        expect(sessionEvents.length).toBeGreaterThan(0);
      }

      // Verify system stats
      const auditStats = auditTrailSystem.getSystemStats();
      expect(auditStats.totalEvents).toBeGreaterThanOrEqual(concurrentCommands.length);

      const syncStats = crossDeviceSyncService.getSyncStats();
      expect(syncStats).toBeDefined();
    });
  });
});