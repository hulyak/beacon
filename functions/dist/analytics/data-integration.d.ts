import { Request, Response } from 'express';
/**
 * Handle data integration requests
 * Requirement 8.1: Support standard API protocols for supply chain data exchange
 * Requirement 8.3: Maintain data consistency across impact, sustainability, and optimization modules
 * Requirement 8.5: Ensure data accuracy with validation and error handling mechanisms
 */
export declare const dataIntegration: (req: Request, res: Response) => Promise<void>;
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export default dataIntegration;
//# sourceMappingURL=data-integration.d.ts.map