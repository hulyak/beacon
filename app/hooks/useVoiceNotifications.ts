'use client';

import { useState, useEffect, useCallback } from 'react';
import { voiceNotifications, type NotificationType } from '@/lib/voice-notifications';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
}

export interface UseVoiceNotificationsReturn {
  notifications: Notification[];
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  notify: (type: NotificationType, message: string) => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;

  // Quick methods
  info: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;

  // Event-specific methods
  cascadeStarted: (nodeCount: number) => void;
  cascadeComplete: (impactMillions: number, recoveryHours: number) => void;
  nodeCritical: (nodeName: string) => void;
  nodeRecovered: (nodeName: string) => void;
  anomalyDetected: (count: number, type: string) => void;
  simulationComplete: (scenarioType: string) => void;
  monteCarloComplete: (iterations: number, avgRisk: number) => void;
}

export function useVoiceNotifications(maxNotifications = 5): UseVoiceNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEnabled, setIsEnabledState] = useState(voiceNotifications.isEnabled());

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = voiceNotifications.subscribe((notification) => {
      setNotifications((prev) => {
        const newNotifications = [
          {
            id: notification.id,
            type: notification.type,
            message: notification.message,
            timestamp: notification.timestamp,
          },
          ...prev,
        ].slice(0, maxNotifications);
        return newNotifications;
      });
    });

    return unsubscribe;
  }, [maxNotifications]);

  const setEnabled = useCallback((enabled: boolean) => {
    voiceNotifications.setEnabled(enabled);
    setIsEnabledState(enabled);
  }, []);

  const notify = useCallback((type: NotificationType, message: string) => {
    voiceNotifications.notify({ type, message });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    voiceNotifications.clearQueue();
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Quick methods
  const info = useCallback((message: string) => voiceNotifications.info(message), []);
  const success = useCallback((message: string) => voiceNotifications.success(message), []);
  const warning = useCallback((message: string) => voiceNotifications.warning(message), []);
  const error = useCallback((message: string) => voiceNotifications.error(message), []);

  // Event-specific methods
  const cascadeStarted = useCallback(
    (nodeCount: number) => voiceNotifications.cascadeStarted(nodeCount),
    []
  );
  const cascadeComplete = useCallback(
    (impactMillions: number, recoveryHours: number) =>
      voiceNotifications.cascadeComplete(impactMillions, recoveryHours),
    []
  );
  const nodeCritical = useCallback(
    (nodeName: string) => voiceNotifications.nodeCritical(nodeName),
    []
  );
  const nodeRecovered = useCallback(
    (nodeName: string) => voiceNotifications.nodeRecovered(nodeName),
    []
  );
  const anomalyDetected = useCallback(
    (count: number, type: string) => voiceNotifications.anomalyDetected(count, type),
    []
  );
  const simulationComplete = useCallback(
    (scenarioType: string) => voiceNotifications.simulationComplete(scenarioType),
    []
  );
  const monteCarloComplete = useCallback(
    (iterations: number, avgRisk: number) =>
      voiceNotifications.monteCarloComplete(iterations, avgRisk),
    []
  );

  return {
    notifications,
    isEnabled,
    setEnabled,
    notify,
    clearNotifications,
    dismissNotification,
    info,
    success,
    warning,
    error,
    cascadeStarted,
    cascadeComplete,
    nodeCritical,
    nodeRecovered,
    anomalyDetected,
    simulationComplete,
    monteCarloComplete,
  };
}

export default useVoiceNotifications;
