"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_framework_1 = require("@google-cloud/functions-framework");
const gemini_client_1 = require("./shared/gemini-client");
const supply_chain_data_1 = require("./shared/supply-chain-data");
const utils_1 = require("./shared/utils");
const types_1 = require("./shared/types");
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
        // Generate risks from mock data
        const risks = (0, supply_chain_data_1.generateRisksForRegion)(region, category);
        const riskLevel = (0, supply_chain_data_1.calculateRegionRiskLevel)(region);
        const baseSummary = (0, supply_chain_data_1.getRegionRiskSummary)(region);
        logger.info('Generated base risk data', {
            riskCount: risks.length,
            riskLevel,
            topRisk: risks[0]?.title
        });
        // Enhance analysis with Gemini AI
        let enhancedSummary = baseSummary;
        try {
            const geminiClient = (0, gemini_client_1.getGeminiClient)();
            // Create context for AI analysis
            const analysisContext = `
Region: ${regionData.name}
Key Countries: ${regionData.countries.join(', ')}
Major Ports: ${regionData.keyPorts.join(', ')}
Key Suppliers: ${regionData.majorSuppliers.join(', ')}

Current Risks:
${risks.map(r => `- ${r.title}: ${r.severity} (${r.probability}% probability, ${r.impact}% impact)`).join('\n')}

Category Filter: ${category || 'All categories'}
`;
            const aiPrompt = `Analyze the supply chain risks for ${regionData.name}${category ? ` focusing on ${category} risks` : ''}. 
      
Provide a concise analysis that:
1. Summarizes the current risk situation in 1-2 sentences
2. Highlights the most critical concern
3. Suggests one key strategic recommendation

Keep the response under 3 sentences and include specific percentages where relevant.`;
            logger.info('Requesting AI analysis from Gemini');
            enhancedSummary = await geminiClient.generateSupplyChainAnalysis(aiPrompt, analysisContext);
            logger.info('AI analysis completed', { summaryLength: enhancedSummary.length });
        }
        catch (aiError) {
            logger.warn('AI analysis failed, using fallback summary', { error: aiError });
            // Continue with base summary if AI fails
        }
        // Prepare response
        const response = {
            risks,
            summary: enhancedSummary,
            riskLevel,
            analysisTimestamp: new Date().toISOString(),
        };
        logger.info('Risk analysis completed successfully', {
            riskCount: risks.length,
            riskLevel,
            summaryLength: enhancedSummary.length,
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