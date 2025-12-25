/**
 * Shared type definitions for Beacon Cloud Functions
 */

// Common enumerations
export type Region = 'asia' | 'europe' | 'north_america' | 'south_america' | 'global';
export type RiskCategory = 'logistics' | 'supplier' | 'geopolitical' | 'weather' | 'demand' | 'all';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ScenarioType = 'supplier_failure' | 'port_closure' | 'demand_surge' | 'natural_disaster' | 'transportation_disruption';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Impact = 'positive' | 'negative' | 'neutral';

// Risk Analysis Types
export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  region: string;
  category: string;
  probability: number; // 0-100
  impact: number; // 0-100
  recommendations: string[];
}

export interface AnalyzeRisksRequest {
  region: Region;
  category?: RiskCategory;
}

export interface AnalyzeRisksResponse {
  risks: Risk[];
  summary: string;
  riskLevel: Severity;
  analysisTimestamp: string;
}

// Scenario Simulation Types
export interface Scenario {
  id: string;
  type: string;
  name: string;
  description: string;
  duration: string;
  affectedRegions: string[];
}

export interface Outcome {
  metric: string;
  currentValue: number;
  projectedValue: number;
  change: number; // percentage
  impact: Impact;
  unit: string;
}

export interface FinancialImpact {
  estimatedCost: number;
  currency: string;
  timeframe: string;
}

export interface RunScenarioRequest {
  scenarioType: ScenarioType;
  region?: string;
  severity?: 'minor' | 'moderate' | 'severe' | 'catastrophic';
  parameters?: Record<string, any>;
}

export interface RunScenarioResponse {
  scenario: Scenario;
  outcomes: Outcome[];
  recommendation: string;
  financialImpact: FinancialImpact;
  timeline: string;
}

// Alert Types
export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  category: string;
  timestamp: string;
  region: string;
  isRead: boolean;
  actionRequired: boolean;
  relatedRisks?: string[];
}

export interface GetAlertsRequest {
  priority?: 'all' | 'high' | 'critical';
  limit?: number;
  region?: string;
}

export interface GetAlertsResponse {
  alerts: Alert[];
  totalCount: number;
  criticalCount: number;
}

// Supply Chain Data Types
export interface SupplyChainRegion {
  id: string;
  name: string;
  countries: string[];
  keyPorts: string[];
  majorSuppliers: string[];
}

export interface Supplier {
  id: string;
  name: string;
  region: string;
  category: string;
  reliability: number; // 0-100
  capacity: number;
}

export interface RiskFactor {
  id: string;
  name: string;
  region: string;
  category: string;
  currentLevel: number; // 0-100
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ScenarioTemplate {
  id: string;
  type: ScenarioType;
  name: string;
  description: string;
  defaultSeverity: string;
  affectedMetrics: string[];
  typicalDuration: string;
}

// HTTP Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// CORS Configuration
export interface CorsOptions {
  origin: string | string[];
  methods: string[];
  allowedHeaders: string[];
  credentials?: boolean;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Logging Types
export interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  region?: string;
  duration?: number;
  [key: string]: any;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Constants
export const REGIONS: Record<Region, string> = {
  asia: 'Asia',
  europe: 'Europe',
  north_america: 'North America',
  south_america: 'South America',
  global: 'Global',
};

export const RISK_CATEGORIES: Record<RiskCategory, string> = {
  logistics: 'Logistics',
  supplier: 'Supplier',
  geopolitical: 'Geopolitical',
  weather: 'Weather',
  demand: 'Demand',
  all: 'All Categories',
};

export const SEVERITY_LEVELS: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const SCENARIO_TYPES: Record<ScenarioType, string> = {
  supplier_failure: 'Supplier Failure',
  port_closure: 'Port Closure',
  demand_surge: 'Demand Surge',
  natural_disaster: 'Natural Disaster',
  transportation_disruption: 'Transportation Disruption',
};