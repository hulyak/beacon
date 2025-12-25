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
    window: number;
    severity: 'warning' | 'error' | 'critical';
}
/**
 * Monitoring service for tracking system health and performance
 */
export declare class MonitoringService {
    private events;
    private readonly MAX_EVENTS;
    private alertThresholds;
    /**
     * Record a monitoring event
     */
    recordEvent(service: string, event: string, severity: 'info' | 'warning' | 'error' | 'critical', details?: Record<string, any>, correlationId?: string): void;
    /**
     * Record parsing failure
     */
    recordParsingFailure(service: string, input: string, error: string, correlationId?: string): void;
    /**
     * Record AI response failure
     */
    recordAIResponseFailure(service: string, prompt: string, error: string, correlationId?: string): void;
    /**
     * Record circuit breaker state change
     */
    recordCircuitBreakerStateChange(service: string, state: 'open' | 'closed' | 'half_open', failureCount: number, correlationId?: string): void;
    /**
     * Record response validation failure
     */
    recordValidationFailure(service: string, validationType: 'schema' | 'quality' | 'format', errors: string[], correlationId?: string): void;
    /**
     * Record fallback usage
     */
    recordFallbackUsage(service: string, fallbackType: 'cache' | 'template' | 'circuit_breaker', reason: string, correlationId?: string): void;
    /**
     * Check alert thresholds and trigger alerts if needed
     */
    private checkAlertThresholds;
    /**
     * Trigger an alert
     */
    private triggerAlert;
    /**
     * Get recent events for debugging
     */
    getRecentEvents(service?: string, severity?: 'info' | 'warning' | 'error' | 'critical', limit?: number): MonitoringEvent[];
    /**
     * Get metrics summary
     */
    getMetricsSummary(windowMinutes?: number): Record<string, any>;
    /**
     * Clear old events (useful for testing)
     */
    clearEvents(): void;
}
export declare function getMonitoringService(): MonitoringService;
/**
 * Convenience functions for common monitoring tasks
 */
export declare const monitoring: {
    recordParsingFailure: (service: string, input: string, error: string, correlationId?: string) => void;
    recordAIResponseFailure: (service: string, prompt: string, error: string, correlationId?: string) => void;
    recordValidationFailure: (service: string, type: "schema" | "quality" | "format", errors: string[], correlationId?: string) => void;
    recordFallbackUsage: (service: string, type: "cache" | "template" | "circuit_breaker", reason: string, correlationId?: string) => void;
    recordEvent: (service: string, event: string, severity: "info" | "warning" | "error" | "critical", details?: Record<string, any>, correlationId?: string) => void;
    getMetrics: (windowMinutes?: number) => Record<string, any>;
    getRecentEvents: (service?: string, severity?: "info" | "warning" | "error" | "critical", limit?: number) => MonitoringEvent[];
};
//# sourceMappingURL=monitoring.d.ts.map