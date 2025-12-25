import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import { getGeminiClient } from '../shared/gemini-client';
import {
  getScenarioTemplate,
  getRegionData,
  getSuppliersByRegion,
} from '../shared/supply-chain-data';
import {
  handleCors,
  sendSuccess,
  sendError,
  validateAndSanitizeParams,
  createLogger,
  asyncHandler,
  checkRateLimit,
  generateId,
  ParameterValidation,
} from '../shared/utils';
import {
  RunScenarioRequest,
  RunScenarioResponse,
  Scenario,
  Outcome,
  FinancialImpact,
  ScenarioType,
  Region,
  SCENARIO_TYPES,
  REGIONS,
} from '../shared/types';
import { getAgentCoordinator, CascadeStep } from '../agents';

/**
 * Run what-if scenario simulation
 * 
 * POST /run-scenario
 * Body: { scenarioType: string, region?: string, severity?: string, parameters?: object }
 * 
 * Returns: {
 *   scenario: Scenario,
 *   outcomes: Outcome[],
 *   recommendation: string,
 *   financialImpact: FinancialImpact,
 *   timeline: string
 * }
 */
http('runScenario', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const logger = createLogger(req);
  logger.info('Scenario simulation request received');

  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  // Check rate limits
  if (!checkRateLimit(req, res)) {
    return;
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    logger.warn('Invalid HTTP method', { method: req.method });
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST method is allowed');
    return;
  }

  try {
    // Define validation schema
    const validationSchema: ParameterValidation = {
      scenarioType: {
        required: true,
        allowedValues: Object.keys(SCENARIO_TYPES),
      },
      region: {
        required: false,
        allowedValues: Object.keys(REGIONS),
      },
      severity: {
        required: false,
        allowedValues: ['minor', 'moderate', 'severe', 'catastrophic'],
      },
    };

    // Validate and sanitize request parameters
    const validation = validateAndSanitizeParams(req.body, validationSchema);
    
    if (!validation.isValid) {
      logger.warn('Validation failed', { errors: validation.errors });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request parameters', validation.errors);
      return;
    }

    const { scenarioType, region, severity } = validation.sanitized;
    const parameters = req.body.parameters; // Keep parameters as-is for flexibility

    logger.setContext({ scenarioType, region, severity });
    logger.info('Starting scenario simulation');

    // Get scenario template
    const template = getScenarioTemplate(scenarioType as ScenarioType);
    if (!template) {
      logger.error('Scenario template not found', { scenarioType });
      sendError(res, 404, 'SCENARIO_NOT_FOUND', `Scenario type '${scenarioType}' not found`);
      return;
    }

    // Determine affected region
    const affectedRegion = region || 'asia'; // Default to Asia if not specified
    const regionData = getRegionData(affectedRegion as Region);
    const suppliers = getSuppliersByRegion(affectedRegion as Region);

    // Generate base scenario
    const scenario: Scenario = {
      id: generateId('scenario'),
      type: scenarioType,
      name: template.name,
      description: generateScenarioDescription(template, regionData, severity || template.defaultSeverity),
      duration: template.typicalDuration,
      affectedRegions: [affectedRegion],
    };

    // Generate base outcomes
    let outcomes: Outcome[] = generateOutcomes(scenarioType as ScenarioType, severity || template.defaultSeverity);

    // Calculate financial impact
    let financialImpact: FinancialImpact = calculateFinancialImpact(
      scenarioType as ScenarioType,
      severity || template.defaultSeverity,
      suppliers.length
    );

    logger.info('Generated base scenario data', {
      scenarioId: scenario.id,
      outcomesCount: outcomes.length,
      estimatedCost: financialImpact.estimatedCost,
    });

    // Use multi-agent architecture for enhanced scenario analysis
    let recommendation = generateBaseRecommendation(scenarioType as ScenarioType, severity || template.defaultSeverity);
    let cascadeSteps: CascadeStep[] = [];
    let mitigationStrategies: string[] = [];
    let agentInsights: Record<string, unknown> | null = null;

    try {
      const coordinator = getAgentCoordinator();
      await coordinator.initialize();

      logger.info('Invoking agent coordinator for scenario simulation');

      const agentResult = await coordinator.process({
        query: `Simulate a ${scenarioType} scenario in ${regionData?.name || affectedRegion} with ${severity || 'moderate'} severity`,
        intent: 'run_scenario',
        parameters: {
          scenarioType: scenarioType as ScenarioType,
          region: affectedRegion as Region,
          severity: severity || 'moderate',
        },
      });

      if (agentResult.success && agentResult.primaryResult.data) {
        const agentData = agentResult.primaryResult.data as {
          scenario?: typeof scenario;
          outcomes?: typeof outcomes;
          financialImpact?: typeof financialImpact;
          cascadeSteps?: CascadeStep[];
          mitigationStrategies?: string[];
          recoveryPlan?: string;
          timeline?: string;
        };

        // Use agent-enhanced data if available
        if (agentData.outcomes && agentData.outcomes.length > 0) {
          outcomes = agentData.outcomes;
        }
        if (agentData.financialImpact) {
          financialImpact = agentData.financialImpact;
        }
        if (agentData.cascadeSteps) {
          cascadeSteps = agentData.cascadeSteps;
        }
        if (agentData.mitigationStrategies) {
          mitigationStrategies = agentData.mitigationStrategies;
        }

        // Include agent insights
        agentInsights = {
          confidence: agentResult.primaryResult.confidence,
          processingTime: agentResult.totalProcessingTime,
          cascadeNodeCount: cascadeSteps.length,
          mitigationCount: mitigationStrategies.length,
        };

        // Use synthesized response for recommendation
        if (agentResult.synthesizedResponse) {
          recommendation = agentResult.synthesizedResponse;
        } else if (agentData.recoveryPlan) {
          recommendation = agentData.recoveryPlan;
        }

        logger.info('Agent scenario simulation completed', {
          confidence: agentResult.primaryResult.confidence,
          cascadeSteps: cascadeSteps.length,
          processingTime: agentResult.totalProcessingTime,
        });
      } else {
        logger.warn('Agent simulation returned no data, using base simulation');
      }

    } catch (agentError) {
      logger.warn('Agent simulation failed, using fallback', { error: agentError });
      // Fall back to legacy Gemini approach
      try {
        const geminiClient = getGeminiClient();
        const analysisContext = `
Scenario: ${template.name}
Type: ${scenarioType}
Severity: ${severity || template.defaultSeverity}
Affected Region: ${regionData?.name || affectedRegion}

Key Suppliers: ${suppliers.slice(0, 5).map(s => s.name).join(', ')}
Financial Impact: $${financialImpact.estimatedCost.toLocaleString()}
`;
        recommendation = await geminiClient.generateSupplyChainAnalysis(
          `Provide strategic recommendations for this scenario. Keep response under 3 sentences.`,
          analysisContext
        );
      } catch (geminiError) {
        logger.warn('Gemini fallback also failed', { error: geminiError });
      }
    }

    // Prepare enhanced response
    const response: RunScenarioResponse & {
      cascadeSteps?: CascadeStep[];
      mitigationStrategies?: string[];
      agentInsights?: typeof agentInsights;
    } = {
      scenario,
      outcomes,
      recommendation,
      financialImpact,
      timeline: template.typicalDuration,
      ...(cascadeSteps.length > 0 && { cascadeSteps }),
      ...(mitigationStrategies.length > 0 && { mitigationStrategies }),
      ...(agentInsights && { agentInsights }),
    };

    logger.info('Scenario simulation completed successfully', {
      scenarioId: scenario.id,
      outcomesCount: outcomes.length,
      recommendationLength: recommendation.length,
      usedAgent: agentInsights !== null,
    });

    sendSuccess(res, response);

  } catch (error) {
    logger.error('Scenario simulation failed', error);
    sendError(
      res,
      500,
      'SIMULATION_ERROR',
      'Failed to run scenario simulation',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}));

/**
 * Generate scenario description based on template and parameters
 */
function generateScenarioDescription(
  template: any,
  regionData: any,
  severity: string
): string {
  const severityDescriptions: Record<string, string> = {
    minor: 'limited disruption with minimal impact',
    moderate: 'significant disruption requiring attention',
    severe: 'major disruption with substantial impact',
    catastrophic: 'critical disruption requiring immediate action',
  };

  return `${template.description} in ${regionData?.name || 'the region'} with ${severityDescriptions[severity] || 'moderate impact'}. This scenario tests supply chain resilience and contingency planning capabilities.`;
}

/**
 * Generate outcomes based on scenario type and severity
 */
function generateOutcomes(scenarioType: ScenarioType, severity: string): Outcome[] {
  const severityMultiplier: Record<string, number> = {
    minor: 0.5,
    moderate: 1.0,
    severe: 1.5,
    catastrophic: 2.0,
  };

  const multiplier = severityMultiplier[severity] || 1.0;

  const outcomeTemplates: Record<ScenarioType, Outcome[]> = {
    supplier_failure: [
      {
        metric: 'Production Capacity',
        currentValue: 100,
        projectedValue: Math.max(0, 100 - (45 * multiplier)),
        change: -(45 * multiplier),
        impact: 'negative',
        unit: '%',
      },
      {
        metric: 'Delivery Time',
        currentValue: 14,
        projectedValue: 14 + (10 * multiplier),
        change: (10 * multiplier) / 14 * 100,
        impact: 'negative',
        unit: 'days',
      },
      {
        metric: 'Cost Per Unit',
        currentValue: 100,
        projectedValue: 100 + (25 * multiplier),
        change: 25 * multiplier,
        impact: 'negative',
        unit: '$',
      },
    ],
    port_closure: [
      {
        metric: 'Shipping Time',
        currentValue: 21,
        projectedValue: 21 + (14 * multiplier),
        change: (14 * multiplier) / 21 * 100,
        impact: 'negative',
        unit: 'days',
      },
      {
        metric: 'Logistics Cost',
        currentValue: 100,
        projectedValue: 100 + (35 * multiplier),
        change: 35 * multiplier,
        impact: 'negative',
        unit: '$',
      },
      {
        metric: 'Inventory Buffer',
        currentValue: 30,
        projectedValue: Math.max(0, 30 - (15 * multiplier)),
        change: -(15 * multiplier) / 30 * 100,
        impact: 'negative',
        unit: 'days',
      },
    ],
    demand_surge: [
      {
        metric: 'Inventory Turnover',
        currentValue: 8,
        projectedValue: 8 + (4 * multiplier),
        change: (4 * multiplier) / 8 * 100,
        impact: 'positive',
        unit: 'times/year',
      },
      {
        metric: 'Stockout Risk',
        currentValue: 5,
        projectedValue: 5 + (20 * multiplier),
        change: (20 * multiplier) / 5 * 100,
        impact: 'negative',
        unit: '%',
      },
      {
        metric: 'Customer Satisfaction',
        currentValue: 95,
        projectedValue: Math.max(60, 95 - (15 * multiplier)),
        change: -(15 * multiplier),
        impact: 'negative',
        unit: '%',
      },
    ],
    natural_disaster: [
      {
        metric: 'Supplier Availability',
        currentValue: 100,
        projectedValue: Math.max(20, 100 - (60 * multiplier)),
        change: -(60 * multiplier),
        impact: 'negative',
        unit: '%',
      },
      {
        metric: 'Recovery Time',
        currentValue: 0,
        projectedValue: 30 * multiplier,
        change: Infinity,
        impact: 'negative',
        unit: 'days',
      },
      {
        metric: 'Emergency Costs',
        currentValue: 0,
        projectedValue: 500000 * multiplier,
        change: Infinity,
        impact: 'negative',
        unit: '$',
      },
    ],
    transportation_disruption: [
      {
        metric: 'Delivery Reliability',
        currentValue: 98,
        projectedValue: Math.max(70, 98 - (25 * multiplier)),
        change: -(25 * multiplier),
        impact: 'negative',
        unit: '%',
      },
      {
        metric: 'Transportation Cost',
        currentValue: 100,
        projectedValue: 100 + (40 * multiplier),
        change: 40 * multiplier,
        impact: 'negative',
        unit: '$',
      },
      {
        metric: 'Route Flexibility',
        currentValue: 5,
        projectedValue: Math.max(2, 5 - (2 * multiplier)),
        change: -(2 * multiplier) / 5 * 100,
        impact: 'negative',
        unit: 'options',
      },
    ],
  };

  return outcomeTemplates[scenarioType] || [];
}

/**
 * Calculate financial impact
 */
function calculateFinancialImpact(
  scenarioType: ScenarioType,
  severity: string,
  supplierCount: number
): FinancialImpact {
  const severityMultiplier: Record<string, number> = {
    minor: 0.3,
    moderate: 1.0,
    severe: 2.0,
    catastrophic: 4.0,
  };

  const baseImpacts: Record<ScenarioType, number> = {
    supplier_failure: 2500000,
    port_closure: 1500000,
    demand_surge: 1000000,
    natural_disaster: 5000000,
    transportation_disruption: 800000,
  };

  const multiplier = severityMultiplier[severity] || 1.0;
  const baseImpact = baseImpacts[scenarioType] || 1000000;
  const supplierFactor = Math.min(2, supplierCount / 10); // Scale with supplier count

  const estimatedCost = Math.round(baseImpact * multiplier * supplierFactor);

  return {
    estimatedCost,
    currency: 'USD',
    timeframe: severity === 'catastrophic' ? '6 months' : severity === 'severe' ? '3 months' : '1 month',
  };
}

/**
 * Generate base recommendation
 */
function generateBaseRecommendation(scenarioType: ScenarioType, severity: string): string {
  const recommendations: Record<ScenarioType, string> = {
    supplier_failure: `Immediately activate secondary suppliers and increase safety stock by 3-4 weeks. Consider expedited shipping for critical components. Establish daily communication with backup suppliers to ensure capacity.`,
    port_closure: `Reroute shipments through alternative ports and consider air freight for time-sensitive cargo. Increase inventory buffers at distribution centers. Negotiate with logistics partners for priority handling.`,
    demand_surge: `Increase production capacity by 30% through overtime and temporary staffing. Prioritize high-margin products and key customers. Communicate delivery timelines proactively to manage expectations.`,
    natural_disaster: `Activate business continuity plan and assess supplier damage. Secure alternative suppliers immediately and increase inventory of critical items. Consider temporary production relocation if needed.`,
    transportation_disruption: `Diversify transportation modes and carriers. Increase local inventory to reduce dependency on long-distance shipping. Negotiate flexible contracts with multiple logistics providers.`,
  };

  return recommendations[scenarioType] || 'Implement contingency plans and monitor situation closely.';
}

// Health check endpoint
http('runScenarioHealth', (req: Request, res: Response): void => {
  if (handleCors(req, res)) {
    return;
  }

  res.status(200).json({
    status: 'healthy',
    service: 'run-scenario',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});