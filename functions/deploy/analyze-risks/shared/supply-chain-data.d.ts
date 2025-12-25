import { SupplyChainRegion, Supplier, RiskFactor, Alert, ScenarioTemplate, Risk, Region, RiskCategory, Severity, Priority, ScenarioType } from './types';
/**
 * Mock supply chain data for VoiceOps demo
 */
export declare const regions: SupplyChainRegion[];
export declare const suppliers: Supplier[];
export declare const riskFactors: RiskFactor[];
export declare const activeAlerts: Alert[];
export declare const scenarioTemplates: ScenarioTemplate[];
/**
 * Data access functions
 */
export declare function getRegionData(regionId: Region): SupplyChainRegion | undefined;
export declare function getSuppliersByRegion(regionId: Region): Supplier[];
export declare function getRiskFactorsByRegion(regionId: Region): RiskFactor[];
export declare function getRiskFactorsByCategory(category: RiskCategory): RiskFactor[];
export declare function getAlertsByPriority(priority: Priority | 'all'): Alert[];
export declare function getAlertsByRegion(regionId: Region): Alert[];
export declare function getScenarioTemplate(scenarioType: ScenarioType): ScenarioTemplate | undefined;
/**
 * Generate realistic risks based on region and category
 */
export declare function generateRisksForRegion(regionId: Region, category?: RiskCategory): Risk[];
/**
 * Calculate overall risk level for a region
 */
export declare function calculateRegionRiskLevel(regionId: Region): Severity;
/**
 * Get summary for region risks
 */
export declare function getRegionRiskSummary(regionId: Region): string;
//# sourceMappingURL=supply-chain-data.d.ts.map