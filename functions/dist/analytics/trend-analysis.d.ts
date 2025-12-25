import { Request, Response } from 'express';
/**
 * Handle trend analysis requests
 * Requirement 4.3: Generate time-series charts with historical data and forecasting capabilities
 * Requirement 8.4: Provide time-series analysis with configurable date ranges and aggregation levels
 */
export declare const trendAnalysis: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export default trendAnalysis;
//# sourceMappingURL=trend-analysis.d.ts.map