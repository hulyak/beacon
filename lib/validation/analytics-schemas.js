"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedVoiceCommandSchema = exports.ROIOptimizationResponseSchema = exports.ROIOptimizationRequestSchema = exports.SustainabilityResponseSchema = exports.SustainabilityRequestSchema = exports.ExplainabilityResponseSchema = exports.ExplainabilityRequestSchema = exports.AgentContributionSchema = exports.ImpactAssessmentResponseSchema = exports.ImpactAssessmentRequestSchema = exports.MitigationStrategySchema = exports.PropagationStepSchema = exports.NetworkNodeSchema = exports.TimelineProjectionSchema = void 0;
const zod_1 = require("zod");
// Base validation schemas
exports.TimelineProjectionSchema = zod_1.z.object({
    date: zod_1.z.string(),
    projectedDelay: zod_1.z.number().min(0),
    affectedOrders: zod_1.z.number().min(0),
    cumulativeImpact: zod_1.z.number().min(0),
});
exports.NetworkNodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(['supplier', 'manufacturer', 'distributor', 'retailer']),
    region: zod_1.z.string(),
    riskLevel: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    impactScore: zod_1.z.number().min(0).max(100),
});
exports.PropagationStepSchema = zod_1.z.object({
    fromNode: zod_1.z.string(),
    toNode: zod_1.z.string(),
    impactDelay: zod_1.z.number().min(0),
    impactMagnitude: zod_1.z.number().min(0),
    propagationType: zod_1.z.enum(['direct', 'indirect', 'cascading']),
});
exports.MitigationStrategySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    estimatedCost: zod_1.z.number().min(0),
    timeToImplement: zod_1.z.number().min(0),
    riskReduction: zod_1.z.number().min(0).max(100),
    roi: zod_1.z.number(),
    paybackPeriod: zod_1.z.number().min(0),
});
// Impact Assessment Schema
exports.ImpactAssessmentRequestSchema = zod_1.z.object({
    scenarioId: zod_1.z.string().optional(),
    scenarioType: zod_1.z.enum(['supplier_failure', 'port_closure', 'demand_surge', 'natural_disaster', 'transportation_disruption']).optional(),
    region: zod_1.z.enum(['asia', 'europe', 'north_america', 'south_america', 'global']).optional(),
    severity: zod_1.z.enum(['minor', 'moderate', 'severe', 'catastrophic']).optional(),
});
exports.ImpactAssessmentResponseSchema = zod_1.z.object({
    financialImpact: zod_1.z.object({
        directCosts: zod_1.z.number().min(0),
        opportunityCosts: zod_1.z.number().min(0),
        laborCosts: zod_1.z.number().min(0),
        materialCosts: zod_1.z.number().min(0),
        logisticsCosts: zod_1.z.number().min(0),
        totalImpact: zod_1.z.number().min(0),
        currency: zod_1.z.string(),
    }),
    operationalImpact: zod_1.z.object({
        deliveryDelays: zod_1.z.object({
            averageDelay: zod_1.z.number().min(0),
            maxDelay: zod_1.z.number().min(0),
            affectedOrders: zod_1.z.number().min(0),
            timelineProjection: zod_1.z.array(exports.TimelineProjectionSchema),
        }),
        cascadeEffects: zod_1.z.object({
            affectedNodes: zod_1.z.array(exports.NetworkNodeSchema),
            propagationPath: zod_1.z.array(exports.PropagationStepSchema),
            networkImpactScore: zod_1.z.number().min(0).max(100),
        }),
    }),
    recommendations: zod_1.z.array(exports.MitigationStrategySchema),
    confidence: zod_1.z.number().min(0).max(100),
    analysisTimestamp: zod_1.z.string(),
});
// Explainability Schemas
exports.AgentContributionSchema = zod_1.z.object({
    confidence: zod_1.z.number().min(0).max(100),
    processingTime: zod_1.z.number().min(0),
    dataQuality: zod_1.z.number().min(0).max(100),
    contributionWeight: zod_1.z.number().min(0).max(1),
    keyInsights: zod_1.z.array(zod_1.z.string()),
});
exports.ExplainabilityRequestSchema = zod_1.z.object({
    recommendationId: zod_1.z.string(),
    explanationType: zod_1.z.enum(['summary', 'detailed', 'decision_tree']).optional(),
});
exports.ExplainabilityResponseSchema = zod_1.z.object({
    confidence: zod_1.z.number().min(0).max(100),
    reasoning: zod_1.z.array(zod_1.z.object({
        step: zod_1.z.number(),
        description: zod_1.z.string(),
        confidence: zod_1.z.number().min(0).max(100),
        dataSource: zod_1.z.string(),
        reasoning: zod_1.z.string(),
    })),
    agentContributions: zod_1.z.object({
        infoAgent: exports.AgentContributionSchema,
        scenarioAgent: exports.AgentContributionSchema,
        impactAgent: exports.AgentContributionSchema,
        strategyAgent: exports.AgentContributionSchema,
    }),
    uncertaintyFactors: zod_1.z.array(zod_1.z.object({
        factor: zod_1.z.string(),
        impact: zod_1.z.enum(['low', 'medium', 'high']),
        description: zod_1.z.string(),
        mitigationSuggestion: zod_1.z.string(),
    })),
    explanation: zod_1.z.string(),
});
// Sustainability Schemas
exports.SustainabilityRequestSchema = zod_1.z.object({
    timeRange: zod_1.z.enum(['7d', '30d', '90d']).optional(),
    scope: zod_1.z.enum(['route', 'network', 'global']).optional(),
    metrics: zod_1.z.enum(['carbon', 'emissions', 'sustainability_score', 'all']).optional(),
});
exports.SustainabilityResponseSchema = zod_1.z.object({
    carbonFootprint: zod_1.z.object({
        total: zod_1.z.number().min(0),
        unit: zod_1.z.literal('kg_co2'),
        breakdown: zod_1.z.object({
            air: zod_1.z.number().min(0),
            sea: zod_1.z.number().min(0),
            rail: zod_1.z.number().min(0),
            road: zod_1.z.number().min(0),
        }),
        emissionsPerUnit: zod_1.z.number().min(0),
    }),
    sustainabilityScore: zod_1.z.object({
        overall: zod_1.z.number().min(0).max(100),
        environmental: zod_1.z.number().min(0).max(100),
        efficiency: zod_1.z.number().min(0).max(100),
        innovation: zod_1.z.number().min(0).max(100),
    }),
    thresholdAlerts: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.enum(['carbon_footprint', 'emissions_per_unit', 'sustainability_score']),
        severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        message: zod_1.z.string(),
        currentValue: zod_1.z.number(),
        threshold: zod_1.z.number(),
        timestamp: zod_1.z.string(),
    })),
});
// ROI Optimization Schemas
exports.ROIOptimizationRequestSchema = zod_1.z.object({
    strategies: zod_1.z.array(zod_1.z.string()).optional(),
    optimizationCriteria: zod_1.z.enum(['cost', 'risk', 'sustainability', 'balanced']).optional(),
    timeHorizon: zod_1.z.enum(['short_term', 'medium_term', 'long_term']).optional(),
    weights: zod_1.z.object({
        cost: zod_1.z.number().min(0).max(1).optional(),
        risk: zod_1.z.number().min(0).max(1).optional(),
        sustainability: zod_1.z.number().min(0).max(1).optional(),
        timeline: zod_1.z.number().min(0).max(1).optional(),
    }).optional(),
});
exports.ROIOptimizationResponseSchema = zod_1.z.object({
    strategies: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        cost: zod_1.z.number().min(0),
        risk: zod_1.z.number().min(0).max(100),
        sustainability: zod_1.z.number().min(0).max(100),
        timeline: zod_1.z.number().min(0),
        weightedScore: zod_1.z.number().min(0).max(100),
        roi: zod_1.z.number(),
        paybackPeriod: zod_1.z.number().min(0),
    })),
    ranking: zod_1.z.array(zod_1.z.object({
        strategyId: zod_1.z.string(),
        rank: zod_1.z.number().min(1),
        score: zod_1.z.number().min(0).max(100),
        strengths: zod_1.z.array(zod_1.z.string()),
        weaknesses: zod_1.z.array(zod_1.z.string()),
    })),
    recommendation: zod_1.z.string(),
});
// Enhanced Voice Command Schema
exports.EnhancedVoiceCommandSchema = zod_1.z.object({
    command: zod_1.z.string(),
    intent: zod_1.z.enum(['impact_analysis', 'explainability', 'sustainability', 'optimization', 'visualization']),
    parameters: zod_1.z.record(zod_1.z.any()),
    context: zod_1.z.string().optional(),
});
//# sourceMappingURL=analytics-schemas.js.map