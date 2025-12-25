"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_framework_1 = require("@google-cloud/functions-framework");
const gemini_client_1 = require("../shared/gemini-client");
const supply_chain_data_1 = require("../shared/supply-chain-data");
const utils_1 = require("../shared/utils");
const types_1 = require("../shared/types");
const agents_1 = require("../agents");
/**
 * Analyze supply chain risks for a specific region
 *
 * POST /analyze-risks
 * Body: { region: string, category?: string }
 *
 * Returns: {
 *   risks: Risk[],
 *   summary: string,
 *   riskLevel: Severity,
 *   analysisTimestamp: string
 * }
 */
(0, functions_framework_1.http)('analyzeRisks', (0, utils_1.asyncHandler)(async (req, res) => {
    const logger = (0, utils_1.createLogger)(req);
    logger.info('Risk analysis request received');
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
            region: {
                required: true,
                allowedValues: Object.keys(types_1.REGIONS),
            },
            category: {
                required: false,
                allowedValues: Object.keys(types_1.RISK_CATEGORIES),
            },
        };
        // Validate and sanitize request parameters
        const validation = (0, utils_1.validateAndSanitizeParams)(req.body, validationSchema);
        if (!validation.isValid) {
            logger.warn('Validation failed', { errors: validation.errors });
            (0, utils_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Invalid request parameters', validation.errors);
            return;
        }
        const { region, category } = validation.sanitized;
        logger.setContext({ region, category });
        logger.info('Starting risk analysis');
        // Get region data
        const regionData = (0, supply_chain_data_1.getRegionData)(region);
        if (!regionData) {
            logger.error('Region data not found', { region });
            (0, utils_1.sendError)(res, 404, 'REGION_NOT_FOUND', `Region '${region}' not found`);
            return;
        }
        // Generate base risks from mock data (fallback)
        const baseRisks = (0, supply_chain_data_1.generateRisksForRegion)(region, category);
        const baseRiskLevel = (0, supply_chain_data_1.calculateRegionRiskLevel)(region);
        const baseSummary = (0, supply_chain_data_1.getRegionRiskSummary)(region);
        logger.info('Generated base risk data', {
            riskCount: baseRisks.length,
            riskLevel: baseRiskLevel,
            topRisk: baseRisks[0]?.title
        });
        // Use multi-agent architecture for enhanced analysis
        let risks = baseRisks;
        let riskLevel = baseRiskLevel;
        let enhancedSummary = baseSummary;
        let agentInsights = null;
        try {
            const coordinator = (0, agents_1.getAgentCoordinator)();
            await coordinator.initialize();
            logger.info('Invoking agent coordinator for risk analysis');
            const agentResult = await coordinator.process({
                query: `Analyze supply chain risks for ${regionData.name}${category ? ` focusing on ${category} risks` : ''}`,
                intent: 'analyze_risks',
                parameters: {
                    region: region,
                    category: category,
                },
            });
            if (agentResult.success && agentResult.primaryResult.data) {
                const agentData = agentResult.primaryResult.data;
                // Use agent-enhanced data if available
                if (agentData.risks && agentData.risks.length > 0) {
                    risks = agentData.risks;
                }
                if (agentData.overallRiskLevel) {
                    riskLevel = agentData.overallRiskLevel;
                }
                if (agentData.summary) {
                    enhancedSummary = agentData.summary;
                }
                // Include agent insights in response
                agentInsights = {
                    confidence: agentResult.primaryResult.confidence,
                    riskScore: agentData.riskScore,
                    topThreats: agentData.topThreats,
                    recommendations: agentData.recommendations,
                    processingTime: agentResult.totalProcessingTime,
                };
                // Use synthesized response if available
                if (agentResult.synthesizedResponse) {
                    enhancedSummary = agentResult.synthesizedResponse;
                }
                logger.info('Agent analysis completed', {
                    confidence: agentResult.primaryResult.confidence,
                    processingTime: agentResult.totalProcessingTime,
                });
            }
            else {
                logger.warn('Agent analysis returned no data, using base analysis');
            }
        }
        catch (agentError) {
            logger.warn('Agent analysis failed, using fallback', { error: agentError });
            // Fall back to legacy Gemini approach
            try {
                const geminiClient = (0, gemini_client_1.getGeminiClient)();
                const analysisContext = `
Region: ${regionData.name}
Key Countries: ${regionData.countries.join(', ')}
Major Ports: ${regionData.keyPorts.join(', ')}
Key Suppliers: ${regionData.majorSuppliers.join(', ')}

Current Risks:
${risks.map(r => `- ${r.title}: ${r.severity} (${r.probability}% probability, ${r.impact}% impact)`).join('\n')}
`;
                enhancedSummary = await geminiClient.generateSupplyChainAnalysis(`Analyze supply chain risks for ${regionData.name}. Keep response under 3 sentences.`, analysisContext);
            }
            catch (geminiError) {
                logger.warn('Gemini fallback also failed', { error: geminiError });
            }
        }
        // Prepare response
        const response = {
            risks,
            summary: enhancedSummary,
            riskLevel,
            analysisTimestamp: new Date().toISOString(),
            ...(agentInsights && { agentInsights }),
        };
        logger.info('Risk analysis completed successfully', {
            riskCount: risks.length,
            riskLevel,
            summaryLength: enhancedSummary.length,
            usedAgent: agentInsights !== null,
        });
        (0, utils_1.sendSuccess)(res, response);
    }
    catch (error) {
        logger.error('Risk analysis failed', error);
        (0, utils_1.sendError)(res, 500, 'ANALYSIS_ERROR', 'Failed to analyze supply chain risks', process.env.NODE_ENV === 'development' ? error : undefined);
    }
}));
// Health check endpoint
(0, functions_framework_1.http)('analyzeRisksHealth', (req, res) => {
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    res.status(200).json({
        status: 'healthy',
        service: 'analyze-risks',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
//# sourceMappingURL=index.js.map