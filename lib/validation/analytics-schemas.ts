import { z } from 'zod';

// Base validation schemas
export const TimelineProjectionSchema = z.object({
  date: z.string(),
  projectedDelay: z.number().min(0),
  affectedOrders: z.number().min(0),
  cumulativeImpact: z.number().min(0),
});

export const NetworkNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['supplier', 'manufacturer', 'distributor', 'retailer']),
  region: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  impactScore: z.number().min(0).max(100),
});

export const PropagationStepSchema = z.object({
  fromNode: z.string(),
  toNode: z.string(),
  impactDelay: z.number().min(0),
  impactMagnitude: z.number().min(0),
  propagationType: z.enum(['direct', 'indirect', 'cascading']),
});

export const MitigationStrategySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  estimatedCost: z.number().min(0),
  timeToImplement: z.number().min(0),
  riskReduction: z.number().min(0).max(100),
  roi: z.number(),
  paybackPeriod: z.number().min(0),
});

// Impact Assessment Schema
export const ImpactAssessmentRequestSchema = z.object({
  scenarioId: z.string().optional(),
  scenarioType: z.enum(['supplier_failure', 'port_closure', 'demand_surge', 'natural_disaster', 'transportation_disruption']).optional(),
  region: z.enum(['asia', 'europe', 'north_america', 'south_america', 'global']).optional(),
  severity: z.enum(['minor', 'moderate', 'severe', 'catastrophic']).optional(),
});

export const ImpactAssessmentResponseSchema = z.object({
  financialImpact: z.object({
    directCosts: z.number().min(0),
    opportunityCosts: z.number().min(0),
    laborCosts: z.number().min(0),
    materialCosts: z.number().min(0),
    logisticsCosts: z.number().min(0),
    totalImpact: z.number().min(0),
    currency: z.string(),
  }),
  operationalImpact: z.object({
    deliveryDelays: z.object({
      averageDelay: z.number().min(0),
      maxDelay: z.number().min(0),
      affectedOrders: z.number().min(0),
      timelineProjection: z.array(TimelineProjectionSchema),
    }),
    cascadeEffects: z.object({
      affectedNodes: z.array(NetworkNodeSchema),
      propagationPath: z.array(PropagationStepSchema),
      networkImpactScore: z.number().min(0).max(100),
    }),
  }),
  recommendations: z.array(MitigationStrategySchema),
  confidence: z.number().min(0).max(100),
  analysisTimestamp: z.string(),
});

// Explainability Schemas
export const AgentContributionSchema = z.object({
  confidence: z.number().min(0).max(100),
  processingTime: z.number().min(0),
  dataQuality: z.number().min(0).max(100),
  contributionWeight: z.number().min(0).max(1),
  keyInsights: z.array(z.string()),
});

export const ExplainabilityRequestSchema = z.object({
  recommendationId: z.string(),
  explanationType: z.enum(['summary', 'detailed', 'decision_tree']).optional(),
});

export const ExplainabilityResponseSchema = z.object({
  confidence: z.number().min(0).max(100),
  reasoning: z.array(z.object({
    step: z.number(),
    description: z.string(),
    confidence: z.number().min(0).max(100),
    dataSource: z.string(),
    reasoning: z.string(),
  })),
  agentContributions: z.object({
    infoAgent: AgentContributionSchema,
    scenarioAgent: AgentContributionSchema,
    impactAgent: AgentContributionSchema,
    strategyAgent: AgentContributionSchema,
  }),
  uncertaintyFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    mitigationSuggestion: z.string(),
  })),
  explanation: z.string(),
});

// Sustainability Schemas
export const SustainabilityRequestSchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d']).optional(),
  scope: z.enum(['route', 'network', 'global']).optional(),
  metrics: z.enum(['carbon', 'emissions', 'sustainability_score', 'all']).optional(),
});

export const SustainabilityResponseSchema = z.object({
  carbonFootprint: z.object({
    total: z.number().min(0),
    unit: z.literal('kg_co2'),
    breakdown: z.object({
      air: z.number().min(0),
      sea: z.number().min(0),
      rail: z.number().min(0),
      road: z.number().min(0),
    }),
    emissionsPerUnit: z.number().min(0),
  }),
  sustainabilityScore: z.object({
    overall: z.number().min(0).max(100),
    environmental: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100),
    innovation: z.number().min(0).max(100),
  }),
  thresholdAlerts: z.array(z.object({
    id: z.string(),
    type: z.enum(['carbon_footprint', 'emissions_per_unit', 'sustainability_score']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    currentValue: z.number(),
    threshold: z.number(),
    timestamp: z.string(),
  })),
});

// ROI Optimization Schemas
export const ROIOptimizationRequestSchema = z.object({
  strategies: z.array(z.string()).optional(),
  optimizationCriteria: z.enum(['cost', 'risk', 'sustainability', 'balanced']).optional(),
  timeHorizon: z.enum(['short_term', 'medium_term', 'long_term']).optional(),
  weights: z.object({
    cost: z.number().min(0).max(1).optional(),
    risk: z.number().min(0).max(1).optional(),
    sustainability: z.number().min(0).max(1).optional(),
    timeline: z.number().min(0).max(1).optional(),
  }).optional(),
});

export const ROIOptimizationResponseSchema = z.object({
  strategies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    cost: z.number().min(0),
    risk: z.number().min(0).max(100),
    sustainability: z.number().min(0).max(100),
    timeline: z.number().min(0),
    weightedScore: z.number().min(0).max(100),
    roi: z.number(),
    paybackPeriod: z.number().min(0),
  })),
  ranking: z.array(z.object({
    strategyId: z.string(),
    rank: z.number().min(1),
    score: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
  })),
  recommendation: z.string(),
});

// Enhanced Voice Command Schema
export const EnhancedVoiceCommandSchema = z.object({
  command: z.string(),
  intent: z.enum(['impact_analysis', 'explainability', 'sustainability', 'optimization', 'visualization']),
  parameters: z.record(z.any()),
  context: z.string().optional(),
});