import { Request, Response } from 'express';
/**
 * Handle anomaly detection requests
 * Requirement 7.2: Generate immediate alerts with severity classification
 * Requirement 7.5: Proactively notify users with voice alerts and detailed impact analysis
 */
export declare const anomalyDetection: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export default anomalyDetection;
//# sourceMappingURL=anomaly-detection.d.ts.map