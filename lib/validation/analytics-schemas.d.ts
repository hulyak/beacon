import { z } from 'zod';
export declare const TimelineProjectionSchema: z.ZodObject<{
    date: z.ZodString;
    projectedDelay: z.ZodNumber;
    affectedOrders: z.ZodNumber;
    cumulativeImpact: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    projectedDelay: number;
    affectedOrders: number;
    cumulativeImpact: number;
}, {
    date: string;
    projectedDelay: number;
    affectedOrders: number;
    cumulativeImpact: number;
}>;
export declare const NetworkNodeSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["supplier", "manufacturer", "distributor", "retailer"]>;
    region: z.ZodString;
    riskLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
    impactScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    region: string;
    type: "supplier" | "manufacturer" | "distributor" | "retailer";
    name: string;
    id: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    impactScore: number;
}, {
    region: string;
    type: "supplier" | "manufacturer" | "distributor" | "retailer";
    name: string;
    id: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    impactScore: number;
}>;
export declare const PropagationStepSchema: z.ZodObject<{
    fromNode: z.ZodString;
    toNode: z.ZodString;
    impactDelay: z.ZodNumber;
    impactMagnitude: z.ZodNumber;
    propagationType: z.ZodEnum<["direct", "indirect", "cascading"]>;
}, "strip", z.ZodTypeAny, {
    impactMagnitude: number;
    fromNode: string;
    toNode: string;
    impactDelay: number;
    propagationType: "direct" | "indirect" | "cascading";
}, {
    impactMagnitude: number;
    fromNode: string;
    toNode: string;
    impactDelay: number;
    propagationType: "direct" | "indirect" | "cascading";
}>;
export declare const MitigationStrategySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    estimatedCost: z.ZodNumber;
    timeToImplement: z.ZodNumber;
    riskReduction: z.ZodNumber;
    roi: z.ZodNumber;
    paybackPeriod: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    id: string;
    estimatedCost: number;
    timeToImplement: number;
    riskReduction: number;
    roi: number;
    paybackPeriod: number;
}, {
    name: string;
    description: string;
    id: string;
    estimatedCost: number;
    timeToImplement: number;
    riskReduction: number;
    roi: number;
    paybackPeriod: number;
}>;
export declare const ImpactAssessmentRequestSchema: z.ZodObject<{
    scenarioId: z.ZodOptional<z.ZodString>;
    scenarioType: z.ZodOptional<z.ZodEnum<["supplier_failure", "port_closure", "demand_surge", "natural_disaster", "transportation_disruption"]>>;
    region: z.ZodOptional<z.ZodEnum<["asia", "europe", "north_america", "south_america", "global"]>>;
    severity: z.ZodOptional<z.ZodEnum<["minor", "moderate", "severe", "catastrophic"]>>;
}, "strip", z.ZodTypeAny, {
    region?: "asia" | "europe" | "north_america" | "south_america" | "global" | undefined;
    scenarioType?: "supplier_failure" | "port_closure" | "demand_surge" | "natural_disaster" | "transportation_disruption" | undefined;
    severity?: "minor" | "moderate" | "severe" | "catastrophic" | undefined;
    scenarioId?: string | undefined;
}, {
    region?: "asia" | "europe" | "north_america" | "south_america" | "global" | undefined;
    scenarioType?: "supplier_failure" | "port_closure" | "demand_surge" | "natural_disaster" | "transportation_disruption" | undefined;
    severity?: "minor" | "moderate" | "severe" | "catastrophic" | undefined;
    scenarioId?: string | undefined;
}>;
export declare const ImpactAssessmentResponseSchema: z.ZodObject<{
    financialImpact: z.ZodObject<{
        directCosts: z.ZodNumber;
        opportunityCosts: z.ZodNumber;
        laborCosts: z.ZodNumber;
        materialCosts: z.ZodNumber;
        logisticsCosts: z.ZodNumber;
        totalImpact: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        directCosts: number;
        opportunityCosts: number;
        laborCosts: number;
        materialCosts: number;
        logisticsCosts: number;
        totalImpact: number;
        currency: string;
    }, {
        directCosts: number;
        opportunityCosts: number;
        laborCosts: number;
        materialCosts: number;
        logisticsCosts: number;
        totalImpact: number;
        currency: string;
    }>;
    operationalImpact: z.ZodObject<{
        deliveryDelays: z.ZodObject<{
            averageDelay: z.ZodNumber;
            maxDelay: z.ZodNumber;
            affectedOrders: z.ZodNumber;
            timelineProjection: z.ZodArray<z.ZodObject<{
                date: z.ZodString;
                projectedDelay: z.ZodNumber;
                affectedOrders: z.ZodNumber;
                cumulativeImpact: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                date: string;
                projectedDelay: number;
                affectedOrders: number;
                cumulativeImpact: number;
            }, {
                date: string;
                projectedDelay: number;
                affectedOrders: number;
                cumulativeImpact: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            affectedOrders: number;
            averageDelay: number;
            maxDelay: number;
            timelineProjection: {
                date: string;
                projectedDelay: number;
                affectedOrders: number;
                cumulativeImpact: number;
            }[];
        }, {
            affectedOrders: number;
            averageDelay: number;
            maxDelay: number;
            timelineProjection: {
                date: string;
                projectedDelay: number;
                affectedOrders: number;
                cumulativeImpact: number;
            }[];
        }>;
        cascadeEffects: z.ZodObject<{
            affectedNodes: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<["supplier", "manufacturer", "distributor", "retailer"]>;
                region: z.ZodString;
                riskLevel: z.ZodEnum<["low", "medium", "high", "critical"]>;
                impactScore: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                region: string;
                type: "supplier" | "manufacturer" | "distributor" | "retailer";
                name: string;
                id: string;
                riskLevel: "low" | "medium" | "high" | "critical";
                impactScore: number;
            }, {
                region: string;
                type: "supplier" | "manufacturer" | "distributor" | "retailer";
                name: string;
                id: string;
                riskLevel: "low" | "medium" | "high" | "critical";
                impactScore: number;
            }>, "many">;
            propagationPath: z.ZodArray<z.ZodObject<{
                fromNode: z.ZodString;
                toNode: z.ZodString;
                impactDelay: z.ZodNumber;
                impactMagnitude: z.ZodNumber;
                propagationType: z.ZodEnum<["direct", "indirect", "cascading"]>;
            }, "strip", z.ZodTypeAny, {
                impactMagnitude: number;
                fromNode: string;
                toNode: string;
                impactDelay: number;
                propagationType: "direct" | "indirect" | "cascading";
            }, {
                impactMagnitude: number;
                fromNode: string;
                toNode: string;
                impactDelay: number;
                propagationType: "direct" | "indirect" | "cascading";
            }>, "many">;
            networkImpactScore: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            affectedNodes: {
                region: string;
                type: "supplier" | "manufacturer" | "distributor" | "retailer";
                name: string;
                id: string;
                riskLevel: "low" | "medium" | "high" | "critical";
                impactScore: number;
            }[];
            propagationPath: {
                impactMagnitude: number;
                fromNode: string;
                toNode: string;
                impactDelay: number;
                propagationType: "direct" | "indirect" | "cascading";
            }[];
            networkImpactScore: number;
        }, {
            affectedNodes: {
                region: string;
                type: "supplier" | "manufacturer" | "distributor" | "retailer";
                name: string;
                id: string;
                riskLevel: "low" | "medium" | "high" | "critical";
                impactScore: number;
            }[];
            propagationPath: {
                impactMagnitude: number;
                fromNode: string;
                toNode: string;
                impactDelay: number;
                propagationType: "direct" | "indirect" | "cascading";
            }[];
            networkImpactScore: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        deliveryDelays: {
            affectedOrders: number;
            averageDelay: number;
            maxDelay: number;
            timelineProjection: {
                date: string;
                projectedDelay: number;
                affectedOrders: number;
                cumulativeImpact: number;
            }[];
        };
        cascadeEffects: {
            affectedNodes: {
                region: string;
                type: "supplier" | "manufacturer" | "distributor" | "retailer";
                name: string;
                id: string;
                riskLevel: "low" | "medium" | "high" | "critical";
                impactScore: number;
            }[];
            propagationPath: {
                impactMagnitude: number;
                fromNode: string;
                toNode: string;
                impactDelay: number;
                propagationType: "direct" | "indirect" | "cascading";
            }[];
            networkImpactScore: number;
        };
    }, {
        deliveryDelays: {
            affectedOrders: number;
            averageDelay: number;
            maxDelay: number;
            timelineProjection: {
                date: string;
                projectedDelay: number;
                affectedOrders: number;
                cumulativeImpact: number;
            }[];
        };
        cascadeEffects: {
            affectedNodes: {
                region: string;
                type: "supplier" | "manufacturer" | "distributor" | "retailer";
                name: string;
                id: string;
                riskLevel: "low" | "medium" | "high" | "critical";
                impactScore: number;
            }[];
            propagationPath: {
                impactMagnitude: number;
                fromNode: string;
                toNode: string;
                impactDelay: number;
                propagationType: "direct" | "indirect" | "cascading";
            }[];
            networkImpactScore: number;
        };
    }>;
    recommendations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        estimatedCost: z.ZodNumber;
        timeToImplement: z.ZodNumber;
        riskReduction: z.ZodNumber;
        roi: z.ZodNumber;
        paybackPeriod: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        id: string;
        estimatedCost: number;
        timeToImplement: number;
        riskReduction: number;
        roi: number;
        paybackPeriod: number;
    }, {
        name: string;
        description: string;
        id: string;
        estimatedCost: number;
        timeToImplement: number;
        riskReduction: number;
        roi: number;
        paybackPeriod: number;
    }>, "many">;
    confidence: z.ZodNumber;
    analysisTimestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    recommendations: {
        name: string;
        description: string;
        id: string;
        estimatedCost: number;
        timeToImplement: number;
        riskReduction: number;
        roi: number;
        paybackPeriod: number;
    }[];
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
            affectedOrders: number;
            averageDelay: number;
            maxDelay: number;
            timelineProjection: {
                date: string;
                projectedDelay: number;
                affectedOrders: number;
                cumulativeImpact: number;
            }[];
        };
        cascadeEffects: {
            affectedNodes: {
                region: string;
                type: "supplier" | "manufacturer" | "distributor" | "retailer";
                name: string;
                id: string;
                riskLevel: "low" | "medium" | "high" | "critical";
                impactScore: number;
            }[];
            propagationPath: {
                impactMagnitude: number;
                fromNode: string;
                toNode: string;
                impactDelay: number;
                propagationType: "direct" | "indirect" | "cascading";
            }[];
            networkImpactScore: number;
        };
    };
    analysisTimestamp: string;
}, {
    confidence: number;
    recommendations: {
        name: string;
        description: string;
        id: string;
        estimatedCost: number;
        timeToImplement: number;
        riskReduction: number;
        roi: number;
        paybackPeriod: number;
    }[];
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
            affectedOrders: number;
            averageDelay: number;
            maxDelay: number;
            timelineProjection: {
                date: string;
                projectedDelay: number;
                affectedOrders: number;
                cumulativeImpact: number;
            }[];
        };
        cascadeEffects: {
            affectedNodes: {
                region: string;
                type: "supplier" | "manufacturer" | "distributor" | "retailer";
                name: string;
                id: string;
                riskLevel: "low" | "medium" | "high" | "critical";
                impactScore: number;
            }[];
            propagationPath: {
                impactMagnitude: number;
                fromNode: string;
                toNode: string;
                impactDelay: number;
                propagationType: "direct" | "indirect" | "cascading";
            }[];
            networkImpactScore: number;
        };
    };
    analysisTimestamp: string;
}>;
export declare const AgentContributionSchema: z.ZodObject<{
    confidence: z.ZodNumber;
    processingTime: z.ZodNumber;
    dataQuality: z.ZodNumber;
    contributionWeight: z.ZodNumber;
    keyInsights: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    processingTime: number;
    dataQuality: number;
    contributionWeight: number;
    keyInsights: string[];
}, {
    confidence: number;
    processingTime: number;
    dataQuality: number;
    contributionWeight: number;
    keyInsights: string[];
}>;
export declare const ExplainabilityRequestSchema: z.ZodObject<{
    recommendationId: z.ZodString;
    explanationType: z.ZodOptional<z.ZodEnum<["summary", "detailed", "decision_tree"]>>;
}, "strip", z.ZodTypeAny, {
    recommendationId: string;
    explanationType?: "detailed" | "summary" | "decision_tree" | undefined;
}, {
    recommendationId: string;
    explanationType?: "detailed" | "summary" | "decision_tree" | undefined;
}>;
export declare const ExplainabilityResponseSchema: z.ZodObject<{
    confidence: z.ZodNumber;
    reasoning: z.ZodArray<z.ZodObject<{
        step: z.ZodNumber;
        description: z.ZodString;
        confidence: z.ZodNumber;
        dataSource: z.ZodString;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reasoning: string;
        description: string;
        confidence: number;
        step: number;
        dataSource: string;
    }, {
        reasoning: string;
        description: string;
        confidence: number;
        step: number;
        dataSource: string;
    }>, "many">;
    agentContributions: z.ZodObject<{
        infoAgent: z.ZodObject<{
            confidence: z.ZodNumber;
            processingTime: z.ZodNumber;
            dataQuality: z.ZodNumber;
            contributionWeight: z.ZodNumber;
            keyInsights: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        }, {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        }>;
        scenarioAgent: z.ZodObject<{
            confidence: z.ZodNumber;
            processingTime: z.ZodNumber;
            dataQuality: z.ZodNumber;
            contributionWeight: z.ZodNumber;
            keyInsights: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        }, {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        }>;
        impactAgent: z.ZodObject<{
            confidence: z.ZodNumber;
            processingTime: z.ZodNumber;
            dataQuality: z.ZodNumber;
            contributionWeight: z.ZodNumber;
            keyInsights: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        }, {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        }>;
        strategyAgent: z.ZodObject<{
            confidence: z.ZodNumber;
            processingTime: z.ZodNumber;
            dataQuality: z.ZodNumber;
            contributionWeight: z.ZodNumber;
            keyInsights: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        }, {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        infoAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        scenarioAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        impactAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        strategyAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
    }, {
        infoAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        scenarioAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        impactAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        strategyAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
    }>;
    uncertaintyFactors: z.ZodArray<z.ZodObject<{
        factor: z.ZodString;
        impact: z.ZodEnum<["low", "medium", "high"]>;
        description: z.ZodString;
        mitigationSuggestion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        impact: "low" | "medium" | "high";
        factor: string;
        mitigationSuggestion: string;
    }, {
        description: string;
        impact: "low" | "medium" | "high";
        factor: string;
        mitigationSuggestion: string;
    }>, "many">;
    explanation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reasoning: {
        reasoning: string;
        description: string;
        confidence: number;
        step: number;
        dataSource: string;
    }[];
    confidence: number;
    agentContributions: {
        infoAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        scenarioAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        impactAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        strategyAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
    };
    uncertaintyFactors: {
        description: string;
        impact: "low" | "medium" | "high";
        factor: string;
        mitigationSuggestion: string;
    }[];
    explanation: string;
}, {
    reasoning: {
        reasoning: string;
        description: string;
        confidence: number;
        step: number;
        dataSource: string;
    }[];
    confidence: number;
    agentContributions: {
        infoAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        scenarioAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        impactAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
        strategyAgent: {
            confidence: number;
            processingTime: number;
            dataQuality: number;
            contributionWeight: number;
            keyInsights: string[];
        };
    };
    uncertaintyFactors: {
        description: string;
        impact: "low" | "medium" | "high";
        factor: string;
        mitigationSuggestion: string;
    }[];
    explanation: string;
}>;
export declare const SustainabilityRequestSchema: z.ZodObject<{
    timeRange: z.ZodOptional<z.ZodEnum<["7d", "30d", "90d"]>>;
    scope: z.ZodOptional<z.ZodEnum<["route", "network", "global"]>>;
    metrics: z.ZodOptional<z.ZodEnum<["carbon", "emissions", "sustainability_score", "all"]>>;
}, "strip", z.ZodTypeAny, {
    timeRange?: "7d" | "30d" | "90d" | undefined;
    scope?: "global" | "route" | "network" | undefined;
    metrics?: "all" | "sustainability_score" | "carbon" | "emissions" | undefined;
}, {
    timeRange?: "7d" | "30d" | "90d" | undefined;
    scope?: "global" | "route" | "network" | undefined;
    metrics?: "all" | "sustainability_score" | "carbon" | "emissions" | undefined;
}>;
export declare const SustainabilityResponseSchema: z.ZodObject<{
    carbonFootprint: z.ZodObject<{
        total: z.ZodNumber;
        unit: z.ZodLiteral<"kg_co2">;
        breakdown: z.ZodObject<{
            air: z.ZodNumber;
            sea: z.ZodNumber;
            rail: z.ZodNumber;
            road: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            air: number;
            sea: number;
            rail: number;
            road: number;
        }, {
            air: number;
            sea: number;
            rail: number;
            road: number;
        }>;
        emissionsPerUnit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        unit: "kg_co2";
        breakdown: {
            air: number;
            sea: number;
            rail: number;
            road: number;
        };
        emissionsPerUnit: number;
    }, {
        total: number;
        unit: "kg_co2";
        breakdown: {
            air: number;
            sea: number;
            rail: number;
            road: number;
        };
        emissionsPerUnit: number;
    }>;
    sustainabilityScore: z.ZodObject<{
        overall: z.ZodNumber;
        environmental: z.ZodNumber;
        efficiency: z.ZodNumber;
        innovation: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        overall: number;
        environmental: number;
        efficiency: number;
        innovation: number;
    }, {
        overall: number;
        environmental: number;
        efficiency: number;
        innovation: number;
    }>;
    thresholdAlerts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["carbon_footprint", "emissions_per_unit", "sustainability_score"]>;
        severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
        message: z.ZodString;
        currentValue: z.ZodNumber;
        threshold: z.ZodNumber;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        severity: "low" | "medium" | "high" | "critical";
        type: "sustainability_score" | "carbon_footprint" | "emissions_per_unit";
        timestamp: string;
        threshold: number;
        id: string;
        currentValue: number;
    }, {
        message: string;
        severity: "low" | "medium" | "high" | "critical";
        type: "sustainability_score" | "carbon_footprint" | "emissions_per_unit";
        timestamp: string;
        threshold: number;
        id: string;
        currentValue: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    carbonFootprint: {
        total: number;
        unit: "kg_co2";
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
    thresholdAlerts: {
        message: string;
        severity: "low" | "medium" | "high" | "critical";
        type: "sustainability_score" | "carbon_footprint" | "emissions_per_unit";
        timestamp: string;
        threshold: number;
        id: string;
        currentValue: number;
    }[];
}, {
    carbonFootprint: {
        total: number;
        unit: "kg_co2";
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
    thresholdAlerts: {
        message: string;
        severity: "low" | "medium" | "high" | "critical";
        type: "sustainability_score" | "carbon_footprint" | "emissions_per_unit";
        timestamp: string;
        threshold: number;
        id: string;
        currentValue: number;
    }[];
}>;
export declare const ROIOptimizationRequestSchema: z.ZodObject<{
    strategies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    optimizationCriteria: z.ZodOptional<z.ZodEnum<["cost", "risk", "sustainability", "balanced"]>>;
    timeHorizon: z.ZodOptional<z.ZodEnum<["short_term", "medium_term", "long_term"]>>;
    weights: z.ZodOptional<z.ZodObject<{
        cost: z.ZodOptional<z.ZodNumber>;
        risk: z.ZodOptional<z.ZodNumber>;
        sustainability: z.ZodOptional<z.ZodNumber>;
        timeline: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        risk?: number | undefined;
        cost?: number | undefined;
        sustainability?: number | undefined;
        timeline?: number | undefined;
    }, {
        risk?: number | undefined;
        cost?: number | undefined;
        sustainability?: number | undefined;
        timeline?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    strategies?: string[] | undefined;
    optimizationCriteria?: "risk" | "cost" | "sustainability" | "balanced" | undefined;
    timeHorizon?: "short_term" | "long_term" | "medium_term" | undefined;
    weights?: {
        risk?: number | undefined;
        cost?: number | undefined;
        sustainability?: number | undefined;
        timeline?: number | undefined;
    } | undefined;
}, {
    strategies?: string[] | undefined;
    optimizationCriteria?: "risk" | "cost" | "sustainability" | "balanced" | undefined;
    timeHorizon?: "short_term" | "long_term" | "medium_term" | undefined;
    weights?: {
        risk?: number | undefined;
        cost?: number | undefined;
        sustainability?: number | undefined;
        timeline?: number | undefined;
    } | undefined;
}>;
export declare const ROIOptimizationResponseSchema: z.ZodObject<{
    strategies: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        cost: z.ZodNumber;
        risk: z.ZodNumber;
        sustainability: z.ZodNumber;
        timeline: z.ZodNumber;
        weightedScore: z.ZodNumber;
        roi: z.ZodNumber;
        paybackPeriod: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        risk: number;
        name: string;
        cost: number;
        description: string;
        id: string;
        sustainability: number;
        roi: number;
        paybackPeriod: number;
        timeline: number;
        weightedScore: number;
    }, {
        risk: number;
        name: string;
        cost: number;
        description: string;
        id: string;
        sustainability: number;
        roi: number;
        paybackPeriod: number;
        timeline: number;
        weightedScore: number;
    }>, "many">;
    ranking: z.ZodArray<z.ZodObject<{
        strategyId: z.ZodString;
        rank: z.ZodNumber;
        score: z.ZodNumber;
        strengths: z.ZodArray<z.ZodString, "many">;
        weaknesses: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        strategyId: string;
        rank: number;
        score: number;
        strengths: string[];
        weaknesses: string[];
    }, {
        strategyId: string;
        rank: number;
        score: number;
        strengths: string[];
        weaknesses: string[];
    }>, "many">;
    recommendation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    strategies: {
        risk: number;
        name: string;
        cost: number;
        description: string;
        id: string;
        sustainability: number;
        roi: number;
        paybackPeriod: number;
        timeline: number;
        weightedScore: number;
    }[];
    ranking: {
        strategyId: string;
        rank: number;
        score: number;
        strengths: string[];
        weaknesses: string[];
    }[];
    recommendation: string;
}, {
    strategies: {
        risk: number;
        name: string;
        cost: number;
        description: string;
        id: string;
        sustainability: number;
        roi: number;
        paybackPeriod: number;
        timeline: number;
        weightedScore: number;
    }[];
    ranking: {
        strategyId: string;
        rank: number;
        score: number;
        strengths: string[];
        weaknesses: string[];
    }[];
    recommendation: string;
}>;
export declare const EnhancedVoiceCommandSchema: z.ZodObject<{
    command: z.ZodString;
    intent: z.ZodEnum<["impact_analysis", "explainability", "sustainability", "optimization", "visualization"]>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    intent: "impact_analysis" | "sustainability" | "explainability" | "optimization" | "visualization";
    parameters: Record<string, any>;
    command: string;
    context?: string | undefined;
}, {
    intent: "impact_analysis" | "sustainability" | "explainability" | "optimization" | "visualization";
    parameters: Record<string, any>;
    command: string;
    context?: string | undefined;
}>;
//# sourceMappingURL=analytics-schemas.d.ts.map