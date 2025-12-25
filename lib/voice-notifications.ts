/**
 * Voice Notifications Service
 * Provides audio announcements for important events
 */

import { ttsService } from './elevenlabs-tts';

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'cascade_start'
  | 'cascade_complete'
  | 'node_critical'
  | 'node_recovered'
  | 'simulation_complete'
  | 'anomaly_detected';

export interface NotificationOptions {
  type: NotificationType;
  message: string;
  speak?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

interface QueuedNotification extends NotificationOptions {
  id: string;
  timestamp: Date;
}

class VoiceNotificationService {
  private enabled = true;
  private queue: QueuedNotification[] = [];
  private isProcessing = false;
  private subscribers: Set<(notification: QueuedNotification) => void> = new Set();

  // Predefined notification messages
  private templates: Record<string, string> = {
    cascade_start: 'Cascade simulation starting. Monitoring affected nodes.',
    cascade_complete: 'Cascade simulation complete. Review the impact assessment.',
    node_critical: 'Alert: A node has entered critical status. Immediate attention required.',
    node_recovered: 'Good news: A previously critical node has recovered.',
    simulation_complete: 'Simulation complete. Results are now available.',
    anomaly_detected: 'Anomaly detected in the supply chain. Review recommended.',
    export_complete: 'Network data exported successfully.',
    import_complete: 'Network data imported successfully.',
    monte_carlo_complete: 'Monte Carlo simulation finished. Risk analysis updated.',
  };

  /**
   * Enable or disable voice notifications
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      ttsService.stop();
      this.queue = [];
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: (notification: QueuedNotification) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Send a notification
   */
  async notify(options: NotificationOptions): Promise<void> {
    const notification: QueuedNotification = {
      ...options,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      speak: options.speak ?? true,
      priority: options.priority ?? 'normal',
    };

    // Notify subscribers
    this.subscribers.forEach(cb => cb(notification));

    // Add to queue if speaking is enabled
    if (this.enabled && notification.speak) {
      // High priority notifications go to front
      if (notification.priority === 'high') {
        this.queue.unshift(notification);
      } else {
        this.queue.push(notification);
      }

      this.processQueue();
    }
  }

  /**
   * Use a predefined template
   */
  async notifyTemplate(
    templateKey: keyof typeof this.templates,
    options?: Partial<NotificationOptions>
  ): Promise<void> {
    const message = this.templates[templateKey] || templateKey;
    await this.notify({
      type: 'info',
      message,
      ...options,
    });
  }

  /**
   * Quick notification methods
   */
  async info(message: string): Promise<void> {
    await this.notify({ type: 'info', message });
  }

  async success(message: string): Promise<void> {
    await this.notify({ type: 'success', message });
  }

  async warning(message: string): Promise<void> {
    await this.notify({ type: 'warning', message, priority: 'high' });
  }

  async error(message: string): Promise<void> {
    await this.notify({ type: 'error', message, priority: 'high' });
  }

  /**
   * Specific event notifications
   */
  async cascadeStarted(nodeCount: number): Promise<void> {
    await this.notify({
      type: 'cascade_start',
      message: `Cascade simulation started. ${nodeCount} nodes may be affected.`,
      priority: 'high',
    });
  }

  async cascadeComplete(impactMillions: number, recoveryHours: number): Promise<void> {
    await this.notify({
      type: 'cascade_complete',
      message: `Cascade complete. Estimated impact: ${impactMillions.toFixed(1)} million dollars. Recovery time: ${recoveryHours} hours.`,
    });
  }

  async nodeCritical(nodeName: string): Promise<void> {
    await this.notify({
      type: 'node_critical',
      message: `Alert: ${nodeName} has entered critical status.`,
      priority: 'high',
    });
  }

  async nodeRecovered(nodeName: string): Promise<void> {
    await this.notify({
      type: 'node_recovered',
      message: `${nodeName} has recovered to healthy status.`,
    });
  }

  async anomalyDetected(count: number, type: string): Promise<void> {
    await this.notify({
      type: 'anomaly_detected',
      message: `Detected ${count} ${type} anomalies. Review recommended.`,
      priority: 'high',
    });
  }

  async simulationComplete(scenarioType: string): Promise<void> {
    await this.notify({
      type: 'simulation_complete',
      message: `${scenarioType} simulation complete. Results are ready.`,
    });
  }

  async monteCarloComplete(iterations: number, avgRisk: number): Promise<void> {
    await this.notify({
      type: 'info',
      message: `Monte Carlo analysis complete. ${iterations} iterations run. Average risk: ${avgRisk.toFixed(1)} percent.`,
    });
  }

  /**
   * Process the notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0 && this.enabled) {
      const notification = this.queue.shift();
      if (notification && notification.speak) {
        try {
          await ttsService.speak(notification.message);
        } catch (error) {
          console.error('Voice notification failed:', error);
          // Fallback to browser TTS
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(notification.message);
            window.speechSynthesis.speak(utterance);
            await new Promise(resolve => {
              utterance.onend = resolve;
              utterance.onerror = resolve;
            });
          }
        }
      }

      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessing = false;
  }

  /**
   * Stop all notifications
   */
  stop(): void {
    ttsService.stop();
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
  }
}

// Singleton instance
export const voiceNotifications = new VoiceNotificationService();

export default voiceNotifications;
