// Enhanced Analytics Types for VoiceOps AI

export interface TimelineProjection {
  date: string;
  projectedDelay: number;
  affectedOrders: number;
  cumulativeImpact: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'supplier' | 'manufacturer' | 'distributor' | 'retailer';
  region: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impactScore: number;
}

export interface PropagationStep {
  fromNode: string;
  toNode: string;
  impactDelay: number;
  impactMagnitude: number;
  propagationType: 'direct' | 'indirect' | 'cascading';
}

export interface MitigationStrategy {
  id: string;
  name: string;
  description: string;
  estimatedCost: number;
  timeToImplement: number;
  riskReduction: number;
  roi: number;
  paybackPeriod: number;
}

// Impact Assessment Response
export interface ImpactAssessmentResponse {
  financialImpact: {
    directCosts: number;
    opportunityCosts: number;
    laborCosts: number;
    materialCosts: number;
    logisticsCosts: number;
    totalImpact: number;
    currency: string;
  };
  operationalImpact: {
    deliveryDelays: {
      averageDelay: number;
      maxDelay: number;
      affectedOrders: number;
      timelineProjection: TimelineProjection[];
    };
    cascadeEffects: {
      affectedNodes: NetworkNode[];
      propagationPath: PropagationStep[];
      networkImpactScore: number;
    };
  };
  recommendations: MitigationStrategy[];
  confidence: number;
  analysisTimestamp: string;
}

// AI Explainability Response
export interface ReasoningStep {
  step: number;
  description: string;
  confidence: number;
  dataSource: string;
  reasoning: string;
}

export interface AgentContribution {
  confidence: number;
  processingTime: number;
  dataQuality: number;
  contributionWeight: number;
  keyInsights: string[];
}

export interface DecisionNode {
  id: string;
  label: string;
  type: 'condition' | 'action' | 'outcome';
  confidence: number;
  children: string[];
  parent?: string;
}

export interface UncertaintyFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigationSuggestion: string;
}

export interface DecisionTreeVisualization {
  nodes: DecisionNode[];
  edges: Array<{
    from: string;
    to: string;
    label: string;
    confidence: number;
  }>;
}

export interface ExplainabilityResponse {
  confidence: number;
  reasoning: ReasoningStep[];
  agentContributions: {
    infoAgent: AgentContribution;
    scenarioAgent: AgentContribution;
    impactAgent: AgentContribution;
    strategyAgent: AgentContribution;
  };
  decisionTree: DecisionNode[];
  uncertaintyFactors: UncertaintyFactor[];
  explanation: string;
  visualizationData: DecisionTreeVisualization;
}

// Sustainability Response
export interface ThresholdAlert {
  id: string;
  type: 'carbon_footprint' | 'emissions_per_unit' | 'sustainability_score';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: string;
}

export interface GreenStrategy {
  id: string;
  name: string;
  description: string;
  emissionReduction: number;
  costImpact: number;
  implementationTime: number;
  feasibilityScore: number;
}

export interface BenchmarkData {
  industryAverage: number;
  topPerformers: number;
  yourPerformance: number;
  percentile: number;
}

export interface SustainabilityResponse {
  carbonFootprint: {
    total: number;
    unit: 'kg_co2';
    breakdown: {
      air: number;
      sea: number;
      rail: number;
      road: number;
    };
    emissionsPerUnit: number;
  };
  sustainabilityScore: {
    overall: number;
    environmental: number;
    efficiency: number;
    innovation: number;
  };
  thresholdAlerts: ThresholdAlert[];
  greenAlternatives: GreenStrategy[];
  benchmarkComparison: BenchmarkData;
}

// ROI Optimization Response
export interface OptimizedStrategy {
  id: string;
  name: string;
  description: string;
  cost: number;
  risk: number;
  sustainability: number;
  timeline: number;
  weightedScore: number;
  roi: number;
  paybackPeriod: number;
}

export interface StrategyRanking {
  strategyId: string;
  rank: number;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ROIAnalysis {
  paybackPeriod: number;
  roi: number;
  directSavings: number;
  avoidedCosts: number;
  netPresentValue: number;
  internalRateOfReturn: number;
}

export interface ROIOptimizationResponse {
  strategies: OptimizedStrategy[];
  ranking: StrategyRanking[];
  multiCriteriaAnalysis: {
    cost: number;
    risk: number;
    sustainability: number;
    timeline: number;
    weightedScore: number;
  };
  paybackAnalysis: ROIAnalysis;
  recommendation: string;
}

// Enhanced Voice Agent Types
export interface EnhancedVoiceCommand {
  command: string;
  intent: 'impact_analysis' | 'explainability' | 'sustainability' | 'optimization' | 'visualization';
  parameters: Record<string, any>;
  context?: string;
}

export interface VoiceAnalyticsResponse {
  type: 'impact' | 'explainability' | 'sustainability' | 'optimization';
  data: ImpactAssessmentResponse | ExplainabilityResponse | SustainabilityResponse | ROIOptimizationResponse;
  voiceDescription: string;
  followUpSuggestions: string[];
}