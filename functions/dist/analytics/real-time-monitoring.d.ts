import { Request, Response } from 'express';
/**
 * Handle real-time monitoring requests
 * Requirement 7.1: Provide real-time status updates with current risk levels
 * Requirement 7.3: Update performance metrics in real-time with threshold monitoring
 * Requirement 8.2: Handle data streams with sub-second latency for critical metrics
 */
export declare const realTimeMonitoring: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export default realTimeMonitoring;
//# sourceMappingURL=real-time-monitoring.d.ts.map