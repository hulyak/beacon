// Cross-Device Synchronization Service
// Requirements: 9.4 - Cross-device state synchronization and context preservation
// Requirements: 9.2 - Consistent user experience across platforms

interface DeviceSession {
  deviceId: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  userId: string;
  sessionId: string;
  lastSync: Date;
  state: SessionState;
  isActive: boolean;
  capabilities: DeviceCapabilities;
}

interface SessionState {
  currentPage: string;
  analysisType: 'impact' | 'explainability' | 'sustainability' | 'optimization' | 'analytics' | null;
  activeFilters: { [key: string]: any };
  visualizationState: {
    activeCharts: string[];
    currentView: string;
    zoomLevel: number;
    selectedDataPoints: any[];
  };
  voiceState: {
    isActive: boolean;
    lastCommand: string;
    contextHistory: string[];
  };
  analyticalContext: {
    activeAnalyses: string[];
    comparisonMode: boolean;
    pendingActions: any[];
  };
  userPreferences: {
    theme: 'light' | 'dark';
    voiceEnabled: boolean;
    autoSync: boolean;
    syncInterval: number;
  };
}

interface DeviceCapabilities {
  hasVoice: boolean;
  hasTouchscreen: boolean;
  screenSize: 'small' | 'medium' | 'large';
  supportsNotifications: boolean;
  bandwidth: 'low' | 'medium' | 'high';
}

interface SyncEvent {
  id: string;
  timestamp: Date;
  sourceDeviceId: string;
  targetDeviceIds: string[];
  eventType: 'state_update' | 'navigation' | 'analysis_complete' | 'voice_command' | 'preference_change';
  data: any;
  priority: 'low' | 'medium' | 'high';
}

class CrossDeviceSyncService {
  private devices = new Map<string, DeviceSession>();
  private userSessions = new Map<string, Set<string>>(); // userId -> deviceIds
  private syncQueue = new Map<string, SyncEvent[]>(); // deviceId -> events
  private readonly SYNC_INTERVAL = 5000; // 5 seconds
  private readonly MAX_SYNC_RETRIES = 3;
  private readonly OFFLINE_TIMEOUT = 30000; // 30 seconds

  private syncIntervals = new Map<string, NodeJS.Timeout>();
  private eventListeners = new Map<string, ((event: SyncEvent) => void)[]>();

  /**
   * Register a device for cross-device synchronization
   */
  registerDevice(
    deviceId: string,
    deviceType: DeviceSession['deviceType'],
    userId: string,
    sessionId: string,
    capabilities: DeviceCapabilities
  ): DeviceSession {
    const device: DeviceSession = {
      deviceId,
      deviceType,
      userId,
      sessionId,
      lastSync: new Date(),
      isActive: true,
      capabilities,
      state: {
        currentPage: '/',
        analysisType: null,
        activeFilters: {},
        visualizationState: {
          activeCharts: [],
          currentView: 'dashboard',
          zoomLevel: 1.0,
          selectedDataPoints: []
        },
        voiceState: {
          isActive: false,
          lastCommand: '',
          contextHistory: []
        },
        analyticalContext: {
          activeAnalyses: [],
          comparisonMode: false,
          pendingActions: []
        },
        userPreferences: {
          theme: 'light',
          voiceEnabled: true,
          autoSync: true,
          syncInterval: this.SYNC_INTERVAL
        }
      }
    };

    this.devices.set(deviceId, device);

    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(deviceId);

    // Initialize sync queue
    this.syncQueue.set(deviceId, []);

    // Start sync interval if auto-sync is enabled
    if (device.state.userPreferences.autoSync) {
      this.startSyncInterval(deviceId);
    }

    return device;
  }

  /**
   * Update device state and sync to other devices
   */
  updateDeviceState(
    deviceId: string,
    stateUpdates: Partial<SessionState>,
    syncToOthers: boolean = true
  ): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    // Update device state
    device.state = { ...device.state, ...stateUpdates };
    device.lastSync = new Date();

    // Sync to other user devices if requested
    if (syncToOthers) {
      this.syncStateToUserDevices(device.userId, deviceId, stateUpdates);
    }

    return true;
  }

  /**
   * Sync state updates to all user devices except source
   */
  private syncStateToUserDevices(
    userId: string,
    sourceDeviceId: string,
    stateUpdates: Partial<SessionState>
  ): void {
    const userDevices = this.userSessions.get(userId);
    if (!userDevices) return;

    const targetDeviceIds = Array.from(userDevices).filter(id => id !== sourceDeviceId);
    
    if (targetDeviceIds.length === 0) return;

    const syncEvent: SyncEvent = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sourceDeviceId,
      targetDeviceIds,
      eventType: 'state_update',
      data: stateUpdates,
      priority: 'medium'
    };

    // Add to sync queues
    targetDeviceIds.forEach(deviceId => {
      const queue = this.syncQueue.get(deviceId) || [];
      queue.push(syncEvent);
      this.syncQueue.set(deviceId, queue);
    });

    // Trigger immediate sync for high priority events
    if (this.isHighPriorityUpdate(stateUpdates)) {
      targetDeviceIds.forEach(deviceId => {
        this.processSyncQueue(deviceId);
      });
    }
  }

  private isHighPriorityUpdate(stateUpdates: Partial<SessionState>): boolean {
    return !!(
      stateUpdates.currentPage ||
      stateUpdates.analysisType ||
      stateUpdates.voiceState?.isActive !== undefined
    );
  }

  /**
   * Process sync queue for a device
   */
  private async processSyncQueue(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    const queue = this.syncQueue.get(deviceId) || [];
    
    if (!device || !device.isActive || queue.length === 0) return;

    // Sort by priority and timestamp
    queue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Process events
    const processedEvents: string[] = [];
    
    for (const event of queue) {
      try {
        await this.applySyncEvent(deviceId, event);
        processedEvents.push(event.id);
        
        // Notify event listeners
        this.notifyEventListeners(deviceId, event);
      } catch (error) {
        console.error(`Sync event processing failed for device ${deviceId}:`, error);
      }
    }

    // Remove processed events
    const remainingQueue = queue.filter(event => !processedEvents.includes(event.id));
    this.syncQueue.set(deviceId, remainingQueue);
  }

  private async applySyncEvent(deviceId: string, event: SyncEvent): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    switch (event.eventType) {
      case 'state_update':
        // Apply state updates with device-specific adaptations
        const adaptedState = this.adaptStateForDevice(event.data, device);
        device.state = { ...device.state, ...adaptedState };
        break;

      case 'navigation':
        device.state.currentPage = event.data.page;
        break;

      case 'analysis_complete':
        device.state.analyticalContext.activeAnalyses = 
          device.state.analyticalContext.activeAnalyses.filter(id => id !== event.data.analysisId);
        break;

      case 'voice_command':
        if (device.capabilities.hasVoice) {
          device.state.voiceState.lastCommand = event.data.command;
          device.state.voiceState.contextHistory.push(event.data.command);
        }
        break;

      case 'preference_change':
        device.state.userPreferences = { ...device.state.userPreferences, ...event.data };
        break;
    }

    device.lastSync = new Date();
  }

  /**
   * Adapt state for specific device capabilities
   */
  private adaptStateForDevice(state: Partial<SessionState>, device: DeviceSession): Partial<SessionState> {
    const adapted = { ...state };

    // Adapt visualization state for screen size
    if (adapted.visualizationState && device.capabilities.screenSize === 'small') {
      adapted.visualizationState = {
        ...adapted.visualizationState,
        activeCharts: adapted.visualizationState.activeCharts?.slice(0, 2) || [], // Limit charts on mobile
        zoomLevel: Math.min(adapted.visualizationState.zoomLevel || 1, 2) // Limit zoom on mobile
      };
    }

    // Disable voice features for devices without voice capability
    if (adapted.voiceState && !device.capabilities.hasVoice) {
      adapted.voiceState = {
        ...adapted.voiceState,
        isActive: false
      };
    }

    return adapted;
  }

  /**
   * Start automatic sync interval for a device
   */
  private startSyncInterval(deviceId: string): void {
    if (this.syncIntervals.has(deviceId)) {
      clearInterval(this.syncIntervals.get(deviceId)!);
    }

    const interval = setInterval(() => {
      this.processSyncQueue(deviceId);
    }, this.SYNC_INTERVAL);

    this.syncIntervals.set(deviceId, interval);
  }

  /**
   * Get current state for a device
   */
  getDeviceState(deviceId: string): SessionState | null {
    const device = this.devices.get(deviceId);
    return device ? device.state : null;
  }

  /**
   * Get all active devices for a user
   */
  getUserDevices(userId: string): DeviceSession[] {
    const deviceIds = this.userSessions.get(userId) || new Set();
    return Array.from(deviceIds)
      .map(id => this.devices.get(id))
      .filter((device): device is DeviceSession => device !== undefined && device.isActive);
  }

  /**
   * Handle device going offline
   */
  setDeviceOffline(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isActive = false;
      
      // Clear sync interval
      if (this.syncIntervals.has(deviceId)) {
        clearInterval(this.syncIntervals.get(deviceId)!);
        this.syncIntervals.delete(deviceId);
      }
    }
  }

  /**
   * Handle device coming back online
   */
  setDeviceOnline(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isActive = true;
      device.lastSync = new Date();
      
      // Restart sync interval
      if (device.state.userPreferences.autoSync) {
        this.startSyncInterval(deviceId);
      }
      
      // Process any queued sync events
      this.processSyncQueue(deviceId);
    }
  }

  /**
   * Add event listener for sync events
   */
  addEventListener(deviceId: string, listener: (event: SyncEvent) => void): void {
    if (!this.eventListeners.has(deviceId)) {
      this.eventListeners.set(deviceId, []);
    }
    this.eventListeners.get(deviceId)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(deviceId: string, listener: (event: SyncEvent) => void): void {
    const listeners = this.eventListeners.get(deviceId) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private notifyEventListeners(deviceId: string, event: SyncEvent): void {
    const listeners = this.eventListeners.get(deviceId) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * Cleanup expired devices and sessions
   */
  cleanup(): void {
    const now = new Date();
    
    for (const [deviceId, device] of this.devices.entries()) {
      // Mark devices as offline if they haven't synced recently
      if (now.getTime() - device.lastSync.getTime() > this.OFFLINE_TIMEOUT) {
        this.setDeviceOffline(deviceId);
      }
      
      // Remove very old inactive devices
      if (!device.isActive && now.getTime() - device.lastSync.getTime() > 24 * 60 * 60 * 1000) {
        this.devices.delete(deviceId);
        this.syncQueue.delete(deviceId);
        
        // Remove from user sessions
        const userDevices = this.userSessions.get(device.userId);
        if (userDevices) {
          userDevices.delete(deviceId);
          if (userDevices.size === 0) {
            this.userSessions.delete(device.userId);
          }
        }
        
        // Clear interval
        if (this.syncIntervals.has(deviceId)) {
          clearInterval(this.syncIntervals.get(deviceId)!);
          this.syncIntervals.delete(deviceId);
        }
      }
    }
  }

  /**
   * Get sync statistics for monitoring
   */
  getSyncStats(): any {
    return {
      totalDevices: this.devices.size,
      activeDevices: Array.from(this.devices.values()).filter(d => d.isActive).length,
      totalUsers: this.userSessions.size,
      queuedEvents: Array.from(this.syncQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      devicesByType: Array.from(this.devices.values()).reduce((acc, device) => {
        acc[device.deviceType] = (acc[device.deviceType] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    };
  }
}

// Singleton instance
export const crossDeviceSyncService = new CrossDeviceSyncService();

// Start cleanup interval
setInterval(() => {
  crossDeviceSyncService.cleanup();
}, 60000); // Every minute

export default crossDeviceSyncService;