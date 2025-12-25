"use strict";
/**
 * Monitoring and alerting utilities for VoiceOps functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoring = exports.MonitoringService = void 0;
exports.getMonitoringService = getMonitoringService;
/**
 * Monitoring service for tracking system health and performance
 */
class MonitoringService {
    constructor() {
        this.events = [];
        this.MAX_EVENTS = 1000;
        this.alertThresholds = [
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
    }
    /**
     * Record a monitoring event
     */
    recordEvent(service, event, severity, details = {}, correlationId) {
        const monitoringEvent = {
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
    recordParsingFailure(service, input, error, correlationId) {
        this.recordEvent(service, 'parsing_failure', 'warning', {
            input_length: input.length,
            error,
            input_preview: input.substring(0, 100),
        }, correlationId);
    }
    /**
     * Record AI response failure
     */
    recordAIResponseFailure(service, prompt, error, correlationId) {
        this.recordEvent(service, 'ai_response_failure', 'error', {
            prompt_length: prompt.length,
            error,
            prompt_preview: prompt.substring(0, 100),
        }, correlationId);
    }
    /**
     * Record circuit breaker state change
     */
    recordCircuitBreakerStateChange(service, state, failureCount, correlationId) {
        this.recordEvent(service, 'circuit_breaker_state_change', state === 'open' ? 'critical' : 'info', {
            state,
            failure_count: failureCount,
        }, correlationId);
    }
    /**
     * Record response validation failure
     */
    recordValidationFailure(service, validationType, errors, correlationId) {
        this.recordEvent(service, 'validation_failure', 'warning', {
            validation_type: validationType,
            errors,
            error_count: errors.length,
        }, correlationId);
    }
    /**
     * Record fallback usage
     */
    recordFallbackUsage(service, fallbackType, reason, correlationId) {
        this.recordEvent(service, 'fallback_usage', 'info', {
            fallback_type: fallbackType,
            reason,
        }, correlationId);
    }
    /**
     * Check alert thresholds and trigger alerts if needed
     */
    checkAlertThresholds(event) {
        const now = Date.now();
        for (const threshold of this.alertThresholds) {
            if (event.includes(threshold.metric)) {
                const windowStart = now - threshold.window;
                const recentEvents = this.events.filter(e => e.timestamp.getTime() >= windowStart && e.event.includes(threshold.metric));
                if (recentEvents.length >= threshold.threshold) {
                    this.triggerAlert(threshold, recentEvents.length);
                }
            }
        }
    }
    /**
     * Trigger an alert
     */
    triggerAlert(threshold, eventCount) {
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
    getRecentEvents(service, severity, limit = 50) {
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
    getMetricsSummary(windowMinutes = 60) {
        const now = Date.now();
        const windowStart = now - (windowMinutes * 60 * 1000);
        const recentEvents = this.events.filter(e => e.timestamp.getTime() >= windowStart);
        const summary = {
            window_minutes: windowMinutes,
            total_events: recentEvents.length,
            by_severity: {
                info: 0,
                warning: 0,
                error: 0,
                critical: 0,
            },
            by_service: {},
            by_event: {},
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
    clearEvents() {
        this.events = [];
    }
}
exports.MonitoringService = MonitoringService;
/**
 * Singleton monitoring service instance
 */
let monitoringServiceInstance = null;
function getMonitoringService() {
    if (!monitoringServiceInstance) {
        monitoringServiceInstance = new MonitoringService();
    }
    return monitoringServiceInstance;
}
/**
 * Convenience functions for common monitoring tasks
 */
exports.monitoring = {
    recordParsingFailure: (service, input, error, correlationId) => {
        getMonitoringService().recordParsingFailure(service, input, error, correlationId);
    },
    recordAIResponseFailure: (service, prompt, error, correlationId) => {
        getMonitoringService().recordAIResponseFailure(service, prompt, error, correlationId);
    },
    recordValidationFailure: (service, type, errors, correlationId) => {
        getMonitoringService().recordValidationFailure(service, type, errors, correlationId);
    },
    recordFallbackUsage: (service, type, reason, correlationId) => {
        getMonitoringService().recordFallbackUsage(service, type, reason, correlationId);
    },
    recordEvent: (service, event, severity, details, correlationId) => {
        getMonitoringService().recordEvent(service, event, severity, details, correlationId);
    },
    getMetrics: (windowMinutes) => {
        return getMonitoringService().getMetricsSummary(windowMinutes);
    },
    getRecentEvents: (service, severity, limit) => {
        return getMonitoringService().getRecentEvents(service, severity, limit);
    },
};
//# sourceMappingURL=monitoring.js.map