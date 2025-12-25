/**
 * Monitoring and alerting utilities for Beacon functions
 */

export interface MonitoringEvent {
  timestamp: Date;
  service: string;
  event: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: Record<string, any>;
  correlationId?: string;
}

export interface AlertThreshold {
  metric: string;
  threshold: number;
  window: number; // Time window in milliseconds
  severity: 'warning' | 'error' | 'critical';
}

/**
 * Monitoring service for tracking system health and performance
 */
export class MonitoringService {
  private events: MonitoringEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private alertThresholds: AlertThreshold[] = [
    {
      metric: 'parsing_failures',
      threshold: 5,
      window: 5 * 60 * 1000, // 5 minutes
      severity: 'warning',
    },
    {
      metric: 'ai_response_failures',
      threshold: 10,
      window: 10 * 60 * 1000, // 10 minutes
      severity: 'error',
    },
    {
      metric: 'circuit_breaker_open',
      threshold: 1,
      window: 1 * 60 * 1000, // 1 minute
      severity: 'critical',
    },
  ];

  /**
   * Record a monitoring event
   */
  recordEvent(
    service: string,
    event: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    details: Record<string, any> = {},
    correlationId?: string
  ): void {
    const monitoringEvent: MonitoringEvent = {
      timestamp: new Date(),
      service,
      event,
      severity,
      details,
      correlationId,
    };

    this.events.push(monitoringEvent);

    // Limit event history
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // Log the event
    console.log(JSON.stringify({
      type: 'monitoring_event',
      ...monitoringEvent,
    }));

    // Check for alert conditions
    this.checkAlertThresholds(event);
  }

  /**
   * Record parsing failure
   */
  recordParsingFailure(
    service: string,
    input: string,
    error: string,
    correlationId?: string
  ): void {
    this.recordEvent(
      service,
      'parsing_failure',
      'warning',
      {
        input_length: input.length,
        error,
        input_preview: input.substring(0, 100),
      },
      correlationId
    );
  }

  /**
   * Record AI response failure
   */
  recordAIResponseFailure(
    service: string,
    prompt: string,
    error: string,
    correlationId?: string
  ): void {
    this.recordEvent(
      service,
      'ai_response_failure',
      'error',
      {
        prompt_length: prompt.length,
        error,
        prompt_preview: prompt.substring(0, 100),
      },
      correlationId
    );
  }

  /**
   * Record circuit breaker state change
   */
  recordCircuitBreakerStateChange(
    service: string,
    state: 'open' | 'closed' | 'half_open',
    failureCount: number,
    correlationId?: string
  ): void {
    this.recordEvent(
      service,
      'circuit_breaker_state_change',
      state === 'open' ? 'critical' : 'info',
      {
        state,
        failure_count: failureCount,
      },
      correlationId
    );
  }

  /**
   * Record response validation failure
   */
  recordValidationFailure(
    service: string,
    validationType: 'schema' | 'quality' | 'format',
    errors: string[],
    correlationId?: string
  ): void {
    this.recordEvent(
      service,
      'validation_failure',
      'warning',
      {
        validation_type: validationType,
        errors,
        error_count: errors.length,
      },
      correlationId
    );
  }

  /**
   * Record fallback usage
   */
  recordFallbackUsage(
    service: string,
    fallbackType: 'cache' | 'template' | 'circuit_breaker',
    reason: string,
    correlationId?: string
  ): void {
    this.recordEvent(
      service,
      'fallback_usage',
      'info',
      {
        fallback_type: fallbackType,
        reason,
      },
      correlationId
    );
  }

  /**
   * Check alert thresholds and trigger alerts if needed
   */
  private checkAlertThresholds(event: string): void {
    const now = Date.now();

    for (const threshold of this.alertThresholds) {
      if (event.includes(threshold.metric)) {
        const windowStart = now - threshold.window;
        const recentEvents = this.events.filter(
          e => e.timestamp.getTime() >= windowStart && e.event.includes(threshold.metric)
        );

        if (recentEvents.length >= threshold.threshold) {
          this.triggerAlert(threshold, recentEvents.length);
        }
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(threshold: AlertThreshold, eventCount: number): void {
    const alert = {
      type: 'alert',
      timestamp: new Date(),
      metric: threshold.metric,
      severity: threshold.severity,
      threshold: threshold.threshold,
      actual: eventCount,
      window_minutes: threshold.window / (60 * 1000),
      message: `Alert: ${threshold.metric} exceeded threshold (${eventCount} >= ${threshold.threshold}) in ${threshold.window / (60 * 1000)} minutes`,
    };

    console.error(JSON.stringify(alert));

    // In production, send to external alerting system
    // Example: sendToSlack(alert), sendToEmail(alert), etc.
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents(
    service?: string,
    severity?: 'info' | 'warning' | 'error' | 'critical',
    limit: number = 50
  ): MonitoringEvent[] {
    let filtered = this.events;

    if (service) {
      filtered = filtered.filter(e => e.service === service);
    }

    if (severity) {
      filtered = filtered.filter(e => e.severity === severity);
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(windowMinutes: number = 60): Record<string, any> {
    const now = Date.now();
    const windowStart = now - (windowMinutes * 60 * 1000);
    const recentEvents = this.events.filter(
      e => e.timestamp.getTime() >= windowStart
    );

    const summary = {
      window_minutes: windowMinutes,
      total_events: recentEvents.length,
      by_severity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      },
      by_service: {} as Record<string, number>,
      by_event: {} as Record<string, number>,
      parsing_failures: 0,
      ai_response_failures: 0,
      validation_failures: 0,
      fallback_usage: 0,
    };

    for (const event of recentEvents) {
      // Count by severity
      summary.by_severity[event.severity]++;

      // Count by service
      summary.by_service[event.service] = (summary.by_service[event.service] || 0) + 1;

      // Count by event type
      summary.by_event[event.event] = (summary.by_event[event.event] || 0) + 1;

      // Count specific metrics
      if (event.event.includes('parsing_failure')) {
        summary.parsing_failures++;
      }
      if (event.event.includes('ai_response_failure')) {
        summary.ai_response_failures++;
      }
      if (event.event.includes('validation_failure')) {
        summary.validation_failures++;
      }
      if (event.event.includes('fallback_usage')) {
        summary.fallback_usage++;
      }
    }

    return summary;
  }

  /**
   * Clear old events (useful for testing)
   */
  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Singleton monitoring service instance
 */
let monitoringServiceInstance: MonitoringService | null = null;

export function getMonitoringService(): MonitoringService {
  if (!monitoringServiceInstance) {
    monitoringServiceInstance = new MonitoringService();
  }
  return monitoringServiceInstance;
}

/**
 * Convenience functions for common monitoring tasks
 */
export const monitoring = {
  recordParsingFailure: (service: string, input: string, error: string, correlationId?: string) => {
    getMonitoringService().recordParsingFailure(service, input, error, correlationId);
  },

  recordAIResponseFailure: (service: string, prompt: string, error: string, correlationId?: string) => {
    getMonitoringService().recordAIResponseFailure(service, prompt, error, correlationId);
  },

  recordValidationFailure: (service: string, type: 'schema' | 'quality' | 'format', errors: string[], correlationId?: string) => {
    getMonitoringService().recordValidationFailure(service, type, errors, correlationId);
  },

  recordFallbackUsage: (service: string, type: 'cache' | 'template' | 'circuit_breaker', reason: string, correlationId?: string) => {
    getMonitoringService().recordFallbackUsage(service, type, reason, correlationId);
  },

  recordEvent: (service: string, event: string, severity: 'info' | 'warning' | 'error' | 'critical', details?: Record<string, any>, correlationId?: string) => {
    getMonitoringService().recordEvent(service, event, severity, details, correlationId);
  },

  getMetrics: (windowMinutes?: number) => {
    return getMonitoringService().getMetricsSummary(windowMinutes);
  },

  getRecentEvents: (service?: string, severity?: 'info' | 'warning' | 'error' | 'critical', limit?: number) => {
    return getMonitoringService().getRecentEvents(service, severity, limit);
  },
};