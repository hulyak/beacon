"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_framework_1 = require("@google-cloud/functions-framework");
const gemini_client_1 = require("./shared/gemini-client");
const supply_chain_data_1 = require("./shared/supply-chain-data");
const utils_1 = require("./shared/utils");
const types_1 = require("./shared/types");
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
(0, functions_framework_1.http)('runScenario', (0, utils_1.asyncHandler)(async (req, res) => {
    const logger = (0, utils_1.createLogger)(req);
    logger.info('Scenario simulation request received');
    // Handle CORS
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    // Check rate limits
    if (!(0, utils_1.checkRateLimit)(req, res)) {
        return;
    }
    // Validate HTTP method
    if (req.method !== 'POST') {
        logger.warn('Invalid HTTP method', { method: req.method });
        (0, utils_1.sendError)(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST method is allowed');
        return;
    }
    try {
        // Define validation schema
        const validationSchema = {
            scenarioType: {
                required: true,
                allowedValues: Object.keys(types_1.SCENARIO_TYPES),
            },
            region: {
                required: false,
                allowedValues: Object.keys(types_1.REGIONS),
            },
            severity: {
                required: false,
                allowedValues: ['minor', 'moderate', 'severe', 'catastrophic'],
            },
        };
        // Validate and sanitize request parameters
        const validation = (0, utils_1.validateAndSanitizeParams)(req.body, validationSchema);
        if (!validation.isValid) {
            logger.warn('Validation failed', { errors: validation.errors });
            (0, utils_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Invalid request parameters', validation.errors);
            return;
        }
        const { scenarioType, region, severity } = validation.sanitized;
        const parameters = req.body.parameters; // Keep parameters as-is for flexibility
        logger.setContext({ scenarioType, region, severity });
        logger.info('Starting scenario simulation');
        // Get scenario template
        const template = (0, supply_chain_data_1.getScenarioTemplate)(scenarioType);
        if (!template) {
            logger.error('Scenario template not found', { scenarioType });
            (0, utils_1.sendError)(res, 404, 'SCENARIO_NOT_FOUND', `Scenario type '${scenarioType}' not found`);
            return;
        }
        // Determine affected region
        const affectedRegion = region || 'asia'; // Default to Asia if not specified
        const regionData = (0, supply_chain_data_1.getRegionData)(affectedRegion);
        const suppliers = (0, supply_chain_data_1.getSuppliersByRegion)(affectedRegion);
        // Generate base scenario
        const scenario = {
            id: (0, utils_1.generateId)('scenario'),
            type: scenarioType,
            name: template.name,
            description: generateScenarioDescription(template, regionData, severity || template.defaultSeverity),
            duration: template.typicalDuration,
            affectedRegions: [affectedRegion],
        };
        // Generate base outcomes
        const outcomes = generateOutcomes(scenarioType, severity || template.defaultSeverity);
        // Calculate financial impact
        const financialImpact = calculateFinancialImpact(scenarioType, severity || template.defaultSeverity, suppliers.length);
        logger.info('Generated base scenario data', {
            scenarioId: scenario.id,
            outcomesCount: outcomes.length,
            estimatedCost: financialImpact.estimatedCost,
        });
        // Enhance analysis with Gemini AI
        let recommendation = generateBaseRecommendation(scenarioType, severity || template.defaultSeverity);
        try {
            const geminiClient = (0, gemini_client_1.getGeminiClient)();
            // Create context for AI analysis
            const analysisContext = `
Scenario: ${template.name}
Type: ${scenarioType}
Severity: ${severity || template.defaultSeverity}
Affected Region: ${regionData?.name || affectedRegion}
Duration: ${template.typicalDuration}

Key Suppliers in Region: ${suppliers.slice(0, 5).map(s => s.name).join(', ')}

Projected Outcomes:
${outcomes.map(o => `- ${o.metric}: ${o.change > 0 ? '+' : ''}${o.change}% (${o.currentValue} → ${o.projectedValue} ${o.unit})`).join('\n')}

Financial Impact: $${financialImpact.estimatedCost.toLocaleString()} ${financialImpact.currency} over ${financialImpact.timeframe}
`;
            const aiPrompt = `Analyze this supply chain scenario simulation and provide strategic recommendations.

Focus on:
1. Immediate actions to mitigate impact (1 sentence)
2. Alternative suppliers or routes to consider (1 sentence)
3. Long-term resilience strategy (1 sentence)

Keep the response concise and actionable, under 3 sentences total.`;
            logger.info('Requesting AI recommendations from Gemini');
            recommendation = await geminiClient.generateSupplyChainAnalysis(aiPrompt, analysisContext);
            logger.info('AI recommendations completed', { recommendationLength: recommendation.length });
        }
        catch (aiError) {
            logger.warn('AI recommendations failed, using fallback', { error: aiError });
            // Continue with base recommendation if AI fails
        }
        // Prepare response
        const response = {
            scenario,
            outcomes,
            recommendation,
            financialImpact,
            timeline: template.typicalDuration,
        };
        logger.info('Scenario simulation completed successfully', {
            scenarioId: scenario.id,
            outcomesCount: outcomes.length,
            recommendationLength: recommendation.length,
        });
        (0, utils_1.sendSuccess)(res, response);
    }
    catch (error) {
        logger.error('Scenario simulation failed', error);
        (0, utils_1.sendError)(res, 500, 'SIMULATION_ERROR', 'Failed to run scenario simulation', process.env.NODE_ENV === 'development' ? error : undefined);
    }
}));
/**
 * Generate scenario description based on template and parameters
 */
function generateScenarioDescription(template, regionData, severity) {
    const severityDescriptions = {
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
function generateOutcomes(scenarioType, severity) {
    const severityMultiplier = {
        minor: 0.5,
        moderate: 1.0,
        severe: 1.5,
        catastrophic: 2.0,
    };
    const multiplier = severityMultiplier[severity] || 1.0;
    const outcomeTemplates = {
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
function calculateFinancialImpact(scenarioType, severity, supplierCount) {
    const severityMultiplier = {
        minor: 0.3,
        moderate: 1.0,
        severe: 2.0,
        catastrophic: 4.0,
    };
    const baseImpacts = {
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
function generateBaseRecommendation(scenarioType, severity) {
    const recommendations = {
        supplier_failure: `Immediately activate secondary suppliers and increase safety stock by 3-4 weeks. Consider expedited shipping for critical components. Establish daily communication with backup suppliers to ensure capacity.`,
        port_closure: `Reroute shipments through alternative ports and consider air freight for time-sensitive cargo. Increase inventory buffers at distribution centers. Negotiate with logistics partners for priority handling.`,
        demand_surge: `Increase production capacity by 30% through overtime and temporary staffing. Prioritize high-margin products and key customers. Communicate delivery timelines proactively to manage expectations.`,
        natural_disaster: `Activate business continuity plan and assess supplier damage. Secure alternative suppliers immediately and increase inventory of critical items. Consider temporary production relocation if needed.`,
        transportation_disruption: `Diversify transportation modes and carriers. Increase local inventory to reduce dependency on long-distance shipping. Negotiate flexible contracts with multiple logistics providers.`,
    };
    return recommendations[scenarioType] || 'Implement contingency plans and monitor situation closely.';
}
// Health check endpoint
(0, functions_framework_1.http)('runScenarioHealth', (req, res) => {
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    res.status(200).json({
        status: 'healthy',
        service: 'run-scenario',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
//# sourceMappingURL=index.js.map