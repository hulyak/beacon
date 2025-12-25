import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import { getGeminiClient } from '../shared/gemini-client';
import {
  generateRisksForRegion,
  calculateRegionRiskLevel,
  getRegionRiskSummary,
  getRegionData,
} from '../shared/supply-chain-data';
import {
  handleCors,
  sendSuccess,
  sendError,
  validateAndSanitizeParams,
  createLogger,
  asyncHandler,
  checkRateLimit,
  ParameterValidation,
} from '../shared/utils';
import {
  AnalyzeRisksRequest,
  AnalyzeRisksResponse,
  Region,
  RiskCategory,
  REGIONS,
  RISK_CATEGORIES,
} from '../shared/types';
import { getAgentCoordinator } from '../agents';

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
http('analyzeRisks', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const logger = createLogger(req);
  logger.info('Risk analysis request received');

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
      region: {
        required: true,
        allowedValues: Object.keys(REGIONS),
      },
      category: {
        required: false,
        allowedValues: Object.keys(RISK_CATEGORIES),
      },
    };

    // Validate and sanitize request parameters
    const validation = validateAndSanitizeParams(req.body, validationSchema);
    
    if (!validation.isValid) {
      logger.warn('Validation failed', { errors: validation.errors });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request parameters', validation.errors);
      return;
    }

    const { region, category } = validation.sanitized;

    logger.setContext({ region, category });
    logger.info('Starting risk analysis');

    // Get region data
    const regionData = getRegionData(region as Region);
    if (!regionData) {
      logger.error('Region data not found', { region });
      sendError(res, 404, 'REGION_NOT_FOUND', `Region '${region}' not found`);
      return;
    }

    // Generate base risks from mock data (fallback)
    const baseRisks = generateRisksForRegion(region as Region, category as RiskCategory);
    const baseRiskLevel = calculateRegionRiskLevel(region as Region);
    const baseSummary = getRegionRiskSummary(region as Region);

    logger.info('Generated base risk data', {
      riskCount: baseRisks.length,
      riskLevel: baseRiskLevel,
      topRisk: baseRisks[0]?.title
    });

    // Use multi-agent architecture for enhanced analysis
    let risks = baseRisks;
    let riskLevel = baseRiskLevel;
    let enhancedSummary = baseSummary;
    let agentInsights: Record<string, unknown> | null = null;

    try {
      const coordinator = getAgentCoordinator();
      await coordinator.initialize();

      logger.info('Invoking agent coordinator for risk analysis');

      const agentResult = await coordinator.process({
        query: `Analyze supply chain risks for ${regionData.name}${category ? ` focusing on ${category} risks` : ''}`,
        intent: 'analyze_risks',
        parameters: {
          region: region as Region,
          category: category as RiskCategory,
        },
      });

      if (agentResult.success && agentResult.primaryResult.data) {
        const agentData = agentResult.primaryResult.data as {
          risks?: typeof risks;
          overallRiskLevel?: string;
          summary?: string;
          riskScore?: number;
          topThreats?: string[];
          recommendations?: string[];
        };

        // Use agent-enhanced data if available
        if (agentData.risks && agentData.risks.length > 0) {
          risks = agentData.risks;
        }
        if (agentData.overallRiskLevel) {
          riskLevel = agentData.overallRiskLevel as typeof riskLevel;
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
      } else {
        logger.warn('Agent analysis returned no data, using base analysis');
      }

    } catch (agentError) {
      logger.warn('Agent analysis failed, using fallback', { error: agentError });
      // Fall back to legacy Gemini approach
      try {
        const geminiClient = getGeminiClient();
        const analysisContext = `
Region: ${regionData.name}
Key Countries: ${regionData.countries.join(', ')}
Major Ports: ${regionData.keyPorts.join(', ')}
Key Suppliers: ${regionData.majorSuppliers.join(', ')}

Current Risks:
${risks.map(r => `- ${r.title}: ${r.severity} (${r.probability}% probability, ${r.impact}% impact)`).join('\n')}
`;
        enhancedSummary = await geminiClient.generateSupplyChainAnalysis(
          `Analyze supply chain risks for ${regionData.name}. Keep response under 3 sentences.`,
          analysisContext
        );
      } catch (geminiError) {
        logger.warn('Gemini fallback also failed', { error: geminiError });
      }
    }

    // Prepare response
    const response: AnalyzeRisksResponse & { agentInsights?: typeof agentInsights } = {
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

    sendSuccess(res, response);

  } catch (error) {
    logger.error('Risk analysis failed', error);
    sendError(
      res,
      500,
      'ANALYSIS_ERROR',
      'Failed to analyze supply chain risks',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}));

// Health check endpoint
http('analyzeRisksHealth', (req: Request, res: Response): void => {
  if (handleCors(req, res)) {
    return;
  }

  res.status(200).json({
    status: 'healthy',
    service: 'analyze-risks',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});