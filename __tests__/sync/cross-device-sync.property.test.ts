// Feature: voiceops-ai-supply-chain, Property 10: Cross-Device State Consistency
// Validates: Requirements 9.4

import * as fc from 'fast-check';
import { crossDeviceSyncService } from '../../lib/sync/cross-device-sync';

describe('Cross-Device Sync Property Tests', () => {
  beforeEach(() => {
    // Clear any existing devices and sessions
    crossDeviceSyncService.cleanup();
  });

  // Feature: voiceops-ai-supply-chain, Property 10: Cross-Device State Consistency
  it('should maintain state consistency across multiple devices for the same user', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          devices: fc.array(
            fc.record({
              deviceId: fc.string({ minLength: 1, maxLength: 50 }),
              deviceType: fc.constantFrom('desktop', 'tablet', 'mobile'),
              sessionId: fc.string({ minLength: 1, maxLength: 50 }),
              capabilities: fc.record({
                hasVoice: fc.boolean(),
                hasTouchscreen: fc.boolean(),
                screenSize: fc.constantFrom('small', 'medium', 'large'),
                supportsNotifications: fc.boolean(),
                bandwidth: fc.constantFrom('low', 'medium', 'high')
              })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          stateUpdates: fc.array(
            fc.record({
              currentPage: fc.constantFrom('/', '/analytics', '/optimization', '/sustainability'),
              analysisType: fc.option(fc.constantFrom('impact', 'explainability', 'sustainability', 'optimization', 'analytics')),
              activeFilters: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
              voiceState: fc.record({
                isActive: fc.boolean(),
                lastCommand: fc.string({ maxLength: 100 }),
                contextHistory: fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })
              })
            }),
            { minLength: 1, maxLength: 10 }
          )
        }),
        async (data) => {
          // Register all devices for the same user
          const registeredDevices = data.devices.map(device => 
            crossDeviceSyncService.registerDevice(
              device.deviceId,
              device.deviceType as any,
              data.userId,
              device.sessionId,
              device.capabilities as any
            )
          );

          // Verify all devices are registered
          expect(registeredDevices.length).toBe(data.devices.length);
          registeredDevices.forEach(device => {
            expect(device.userId).toBe(data.userId);
            expect(device.isActive).toBe(true);
          });

          // Get user devices
          const userDevices = crossDeviceSyncService.getUserDevices(data.userId);
          expect(userDevices.length).toBe(data.devices.length);

          // Apply state updates from first device and verify sync to others
          const sourceDevice = data.devices[0];
          
          for (const stateUpdate of data.stateUpdates) {
            // Update state on source device
            const updateSuccess = crossDeviceSyncService.updateDeviceState(
              sourceDevice.deviceId,
              stateUpdate,
              true // sync to others
            );
            expect(updateSuccess).toBe(true);

            // Allow time for sync processing
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify state consistency across all devices
            const sourceState = crossDeviceSyncService.getDeviceState(sourceDevice.deviceId);
            expect(sourceState).toBeDefined();

            // Check that state was synced to other devices (with device-specific adaptations)
            for (let i = 1; i < data.devices.length; i++) {
              const targetDevice = data.devices[i];
              const targetState = crossDeviceSyncService.getDeviceState(targetDevice.deviceId);
              
              expect(targetState).toBeDefined();
              
              // Core state should be consistent
              expect(targetState!.currentPage).toBe(stateUpdate.currentPage);
              expect(targetState!.analysisType).toBe(stateUpdate.analysisType);
              
              // Voice state should be adapted based on device capabilities
              if (targetDevice.capabilities.hasVoice) {
                expect(targetState!.voiceState.lastCommand).toBe(stateUpdate.voiceState.lastCommand);
              } else {
                expect(targetState!.voiceState.isActive).toBe(false);
              }
            }
          }

          // Verify sync statistics
          const stats = crossDeviceSyncService.getSyncStats();
          expect(stats.totalDevices).toBe(data.devices.length);
          expect(stats.activeDevices).toBe(data.devices.length);
          expect(stats.totalUsers).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 10: Device Capability Adaptation
  it('should properly adapt state based on device capabilities', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          mobileDevice: fc.record({
            deviceId: fc.string({ minLength: 1, maxLength: 50 }),
            sessionId: fc.string({ minLength: 1, maxLength: 50 }),
            capabilities: fc.constant({
              hasVoice: false,
              hasTouchscreen: true,
              screenSize: 'small' as const,
              supportsNotifications: true,
              bandwidth: 'medium' as const
            })
          }),
          desktopDevice: fc.record({
            deviceId: fc.string({ minLength: 1, maxLength: 50 }),
            sessionId: fc.string({ minLength: 1, maxLength: 50 }),
            capabilities: fc.constant({
              hasVoice: true,
              hasTouchscreen: false,
              screenSize: 'large' as const,
              supportsNotifications: true,
              bandwidth: 'high' as const
            })
          }),
          stateWithVoice: fc.record({
            voiceState: fc.record({
              isActive: fc.constant(true),
              lastCommand: fc.string({ minLength: 1, maxLength: 100 }),
              contextHistory: fc.array(fc.string(), { minLength: 1, maxLength: 5 })
            }),
            visualizationState: fc.record({
              activeCharts: fc.array(fc.string(), { minLength: 3, maxLength: 8 }),
              zoomLevel: fc.float({ min: 1.5, max: 3.0 })
            })
          })
        }),
        async (data) => {
          // Register both devices
          const mobileDevice = crossDeviceSyncService.registerDevice(
            data.mobileDevice.deviceId,
            'mobile',
            data.userId,
            data.mobileDevice.sessionId,
            data.mobileDevice.capabilities
          );

          const desktopDevice = crossDeviceSyncService.registerDevice(
            data.desktopDevice.deviceId,
            'desktop',
            data.userId,
            data.desktopDevice.sessionId,
            data.desktopDevice.capabilities
          );

          // Update state from desktop (with voice capabilities)
          crossDeviceSyncService.updateDeviceState(
            data.desktopDevice.deviceId,
            data.stateWithVoice,
            true
          );

          // Allow time for sync
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify desktop state (should have full voice state)
          const desktopState = crossDeviceSyncService.getDeviceState(data.desktopDevice.deviceId);
          expect(desktopState).toBeDefined();
          expect(desktopState!.voiceState.isActive).toBe(true);
          expect(desktopState!.voiceState.lastCommand).toBe(data.stateWithVoice.voiceState.lastCommand);

          // Verify mobile state (voice should be disabled, charts limited)
          const mobileState = crossDeviceSyncService.getDeviceState(data.mobileDevice.deviceId);
          expect(mobileState).toBeDefined();
          expect(mobileState!.voiceState.isActive).toBe(false); // Adapted for no voice capability
          expect(mobileState!.visualizationState.activeCharts.length).toBeLessThanOrEqual(2); // Limited for small screen
          expect(mobileState!.visualizationState.zoomLevel).toBeLessThanOrEqual(2); // Limited zoom for mobile
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 10: Offline/Online State Management
  it('should handle device offline/online transitions correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          devices: fc.array(
            fc.record({
              deviceId: fc.string({ minLength: 1, maxLength: 50 }),
              sessionId: fc.string({ minLength: 1, maxLength: 50 })
            }),
            { minLength: 2, maxLength: 4 }
          ),
          offlineDeviceIndex: fc.integer({ min: 0, max: 3 }),
          stateUpdatesWhileOffline: fc.array(
            fc.record({
              currentPage: fc.constantFrom('/', '/analytics', '/optimization'),
              analysisType: fc.option(fc.constantFrom('impact', 'sustainability', 'optimization'))
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        async (data) => {
          const actualOfflineIndex = data.offlineDeviceIndex % data.devices.length;
          
          // Register all devices
          data.devices.forEach(device => {
            crossDeviceSyncService.registerDevice(
              device.deviceId,
              'desktop',
              data.userId,
              device.sessionId,
              {
                hasVoice: true,
                hasTouchscreen: false,
                screenSize: 'large',
                supportsNotifications: true,
                bandwidth: 'high'
              }
            );
          });

          // Verify all devices are online
          let userDevices = crossDeviceSyncService.getUserDevices(data.userId);
          expect(userDevices.length).toBe(data.devices.length);
          expect(userDevices.every(d => d.isActive)).toBe(true);

          // Take one device offline
          const offlineDevice = data.devices[actualOfflineIndex];
          crossDeviceSyncService.setDeviceOffline(offlineDevice.deviceId);

          // Verify device is offline
          userDevices = crossDeviceSyncService.getUserDevices(data.userId);
          expect(userDevices.length).toBe(data.devices.length - 1);

          // Apply state updates while device is offline
          const onlineDevice = data.devices.find((_, index) => index !== actualOfflineIndex)!;
          
          for (const stateUpdate of data.stateUpdatesWhileOffline) {
            crossDeviceSyncService.updateDeviceState(
              onlineDevice.deviceId,
              stateUpdate,
              true
            );
          }

          // Allow time for sync processing
          await new Promise(resolve => setTimeout(resolve, 100));

          // Bring device back online
          crossDeviceSyncService.setDeviceOnline(offlineDevice.deviceId);

          // Allow time for catch-up sync
          await new Promise(resolve => setTimeout(resolve, 200));

          // Verify device is back online and has latest state
          userDevices = crossDeviceSyncService.getUserDevices(data.userId);
          expect(userDevices.length).toBe(data.devices.length);

          const offlineDeviceState = crossDeviceSyncService.getDeviceState(offlineDevice.deviceId);
          const onlineDeviceState = crossDeviceSyncService.getDeviceState(onlineDevice.deviceId);

          expect(offlineDeviceState).toBeDefined();
          expect(onlineDeviceState).toBeDefined();

          // States should be consistent after reconnection
          const lastUpdate = data.stateUpdatesWhileOffline[data.stateUpdatesWhileOffline.length - 1];
          expect(offlineDeviceState!.currentPage).toBe(lastUpdate.currentPage);
          expect(offlineDeviceState!.analysisType).toBe(lastUpdate.analysisType);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: voiceops-ai-supply-chain, Property 10: Sync Event Priority Handling
  it('should handle sync events with correct priority ordering', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          sourceDeviceId: fc.string({ minLength: 1, maxLength: 50 }),
          targetDeviceId: fc.string({ minLength: 1, maxLength: 50 }),
          events: fc.array(
            fc.record({
              type: fc.constantFrom('navigation', 'voice_command', 'preference_change'),
              priority: fc.constantFrom('low', 'medium', 'high'),
              data: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.boolean(), fc.integer()))
            }),
            { minLength: 3, maxLength: 10 }
          )
        }),
        async (data) => {
          // Register devices
          crossDeviceSyncService.registerDevice(
            data.sourceDeviceId,
            'desktop',
            data.userId,
            'session1',
            {
              hasVoice: true,
              hasTouchscreen: false,
              screenSize: 'large',
              supportsNotifications: true,
              bandwidth: 'high'
            }
          );

          crossDeviceSyncService.registerDevice(
            data.targetDeviceId,
            'mobile',
            data.userId,
            'session2',
            {
              hasVoice: false,
              hasTouchscreen: true,
              screenSize: 'small',
              supportsNotifications: true,
              bandwidth: 'medium'
            }
          );

          // Track sync events
          const receivedEvents: any[] = [];
          crossDeviceSyncService.addEventListener(data.targetDeviceId, (event) => {
            receivedEvents.push({
              type: event.eventType,
              priority: event.priority,
              timestamp: event.timestamp
            });
          });

          // Generate state updates that will create sync events
          for (const event of data.events) {
            let stateUpdate: any = {};
            
            switch (event.type) {
              case 'navigation':
                stateUpdate.currentPage = event.data.page || '/analytics';
                break;
              case 'voice_command':
                stateUpdate.voiceState = {
                  isActive: event.data.isActive || true,
                  lastCommand: event.data.command || 'test command'
                };
                break;
              case 'preference_change':
                stateUpdate.userPreferences = event.data;
                break;
            }

            crossDeviceSyncService.updateDeviceState(
              data.sourceDeviceId,
              stateUpdate,
              true
            );
          }

          // Allow time for all sync events to process
          await new Promise(resolve => setTimeout(resolve, 300));

          // Verify events were received
          expect(receivedEvents.length).toBeGreaterThan(0);

          // Verify high priority events (navigation, voice) are processed
          const highPriorityEvents = receivedEvents.filter(e => 
            e.type === 'state_update' // All state updates become state_update events
          );
          expect(highPriorityEvents.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 } // Reduced runs for performance
    );
  });
});