import { Request, Response } from 'express';
/**
 * Calculate carbon footprint for supply chain operations
 * Requirement 3.1: Calculate total carbon footprint in kg CO₂ equivalent
 * Requirement 3.2: Provide emissions breakdown by transport mode
 */
export declare const calculateCarbonFootprint: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export default calculateCarbonFootprint;
//# sourceMappingURL=calculate-carbon-footprint.d.ts.map