import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import {
  getTavilyClient,
  isTavilyConfigured,
  WebRisk,
  NewsItem,
  GeopoliticalAlert,
} from '../shared/tavily-client';
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
import { Region, REGIONS } from '../shared/types';

/**
 * Request types for web research endpoints
 */
interface WebResearchRequest {
  action: 'search_risks' | 'supplier_news' | 'geopolitical_scan' | 'port_disruptions' | 'weather_risks';
  region?: Region;
  regions?: Region[];
  supplier?: string;
  category?: string;
}

interface WebResearchResponse {
  action: string;
  data: WebRisk[] | NewsItem[] | GeopoliticalAlert[];
  timestamp: string;
  source: 'tavily' | 'fallback';
  cached: boolean;
}

/**
 * Web Research Cloud Function
 * Provides real-time web intelligence for supply chain monitoring
 *
 * POST /web-research
 * Body: {
 *   action: string,
 *   region?: string,
 *   regions?: string[],
 *   supplier?: string,
 *   category?: string
 * }
 */
http('webResearch', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const logger = createLogger(req);
  logger.info('Web research request received');

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

  // Check if Tavily is configured
  if (!isTavilyConfigured()) {
    logger.warn('Tavily API not configured');
    sendError(
      res,
      503,
      'SERVICE_UNAVAILABLE',
      'Web research service not configured. Please set TAVILY_API_KEY.'
    );
    return;
  }

  try {
    // Define validation schema
    const validationSchema: ParameterValidation = {
      action: {
        required: true,
        allowedValues: [
          'search_risks',
          'supplier_news',
          'geopolitical_scan',
          'port_disruptions',
          'weather_risks',
        ],
      },
      region: {
        required: false,
        allowedValues: Object.keys(REGIONS),
      },
      regions: {
        required: false,
      },
      supplier: {
        required: false,
        maxLength: 100,
      },
      category: {
        required: false,
        allowedValues: ['logistics', 'supplier', 'geopolitical', 'weather', 'demand', 'all'],
      },
    };

    // Validate and sanitize request parameters
    const validation = validateAndSanitizeParams(req.body, validationSchema);

    if (!validation.isValid) {
      logger.warn('Validation failed', { errors: validation.errors });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request parameters', validation.errors);
      return;
    }

    const { action, region, regions, supplier, category } = validation.sanitized as WebResearchRequest;

    logger.setContext({ action, region, supplier });
    logger.info('Starting web research');

    const tavilyClient = getTavilyClient();
    let data: WebRisk[] | NewsItem[] | GeopoliticalAlert[] = [];
    let source: 'tavily' | 'fallback' = 'tavily';

    switch (action) {
      case 'search_risks': {
        if (!region) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Region is required for search_risks action');
          return;
        }
        logger.info('Searching risks for region', { region, category });
        data = await tavilyClient.searchRisks(region, category);
        break;
      }

      case 'supplier_news': {
        if (!supplier) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Supplier name is required for supplier_news action');
          return;
        }
        logger.info('Getting supplier news', { supplier });
        data = await tavilyClient.getSupplierNews(supplier);
        break;
      }

      case 'geopolitical_scan': {
        const targetRegions = regions || (region ? [region] : ['global' as Region]);
        logger.info('Scanning geopolitical risks', { regions: targetRegions });
        data = await tavilyClient.scanGeopolitical(targetRegions);
        break;
      }

      case 'port_disruptions': {
        if (!region) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Region is required for port_disruptions action');
          return;
        }
        logger.info('Searching port disruptions', { region });
        data = await tavilyClient.searchPortDisruptions(region);
        break;
      }

      case 'weather_risks': {
        if (!region) {
          sendError(res, 400, 'VALIDATION_ERROR', 'Region is required for weather_risks action');
          return;
        }
        logger.info('Searching weather risks', { region });
        data = await tavilyClient.searchWeatherRisks(region);
        break;
      }

      default:
        sendError(res, 400, 'INVALID_ACTION', `Unknown action: ${action}`);
        return;
    }

    // Check if we got fallback data
    if (data.length === 1 && 'source' in data[0] && data[0].source === 'beacon-internal') {
      source = 'fallback';
    }

    logger.info('Web research completed', {
      action,
      resultCount: data.length,
      source,
    });

    const response: WebResearchResponse = {
      action,
      data,
      timestamp: new Date().toISOString(),
      source,
      cached: false,
    };

    sendSuccess(res, response);

  } catch (error) {
    logger.error('Web research failed', error);
    sendError(
      res,
      500,
      'RESEARCH_ERROR',
      'Failed to complete web research',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}));

/**
 * Convenience endpoint for quick risk scanning
 * GET /web-research/risks/:region
 */
http('webResearchRisks', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const logger = createLogger(req);

  if (handleCors(req, res)) {
    return;
  }

  if (!checkRateLimit(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET method is allowed');
    return;
  }

  if (!isTavilyConfigured()) {
    sendError(res, 503, 'SERVICE_UNAVAILABLE', 'Web research service not configured');
    return;
  }

  try {
    const region = req.query.region as Region || 'global';
    const category = req.query.category as string;

    if (!Object.keys(REGIONS).includes(region)) {
      sendError(res, 400, 'VALIDATION_ERROR', `Invalid region: ${region}`);
      return;
    }

    logger.info('Quick risk scan', { region, category });

    const tavilyClient = getTavilyClient();
    const risks = await tavilyClient.searchRisks(region, category);

    sendSuccess(res, {
      region,
      risks,
      count: risks.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Quick risk scan failed', error);
    sendError(res, 500, 'RESEARCH_ERROR', 'Failed to scan risks');
  }
}));

/**
 * Combined intelligence endpoint
 * Returns risks, geopolitical alerts, and recent news for a region
 */
http('webResearchIntelligence', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const logger = createLogger(req);

  if (handleCors(req, res)) {
    return;
  }

  if (!checkRateLimit(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST method is allowed');
    return;
  }

  if (!isTavilyConfigured()) {
    sendError(res, 503, 'SERVICE_UNAVAILABLE', 'Web research service not configured');
    return;
  }

  try {
    const { region = 'global', includeWeather = true, includePorts = true } = req.body;

    if (!Object.keys(REGIONS).includes(region)) {
      sendError(res, 400, 'VALIDATION_ERROR', `Invalid region: ${region}`);
      return;
    }

    logger.info('Comprehensive intelligence scan', { region, includeWeather, includePorts });

    const tavilyClient = getTavilyClient();

    // Run all searches in parallel
    const [
      risks,
      geopolitical,
      portDisruptions,
      weatherRisks,
    ] = await Promise.all([
      tavilyClient.searchRisks(region as Region),
      tavilyClient.scanGeopolitical([region as Region]),
      includePorts ? tavilyClient.searchPortDisruptions(region as Region) : Promise.resolve([]),
      includeWeather ? tavilyClient.searchWeatherRisks(region as Region) : Promise.resolve([]),
    ]);

    // Calculate overall risk score based on findings
    const riskScore = calculateOverallRiskScore(risks, geopolitical, portDisruptions, weatherRisks);

    logger.info('Intelligence scan completed', {
      region,
      riskCount: risks.length,
      geopoliticalCount: geopolitical.length,
      portCount: portDisruptions.length,
      weatherCount: weatherRisks.length,
      riskScore,
    });

    sendSuccess(res, {
      region,
      timestamp: new Date().toISOString(),
      overallRiskScore: riskScore,
      intelligence: {
        risks,
        geopolitical,
        portDisruptions: includePorts ? portDisruptions : undefined,
        weatherRisks: includeWeather ? weatherRisks : undefined,
      },
      summary: generateIntelligenceSummary(risks, geopolitical, riskScore),
    });

  } catch (error) {
    logger.error('Intelligence scan failed', error);
    sendError(res, 500, 'RESEARCH_ERROR', 'Failed to complete intelligence scan');
  }
}));

/**
 * Health check endpoint
 */
http('webResearchHealth', (req: Request, res: Response): void => {
  if (handleCors(req, res)) {
    return;
  }

  const tavilyConfigured = isTavilyConfigured();
  let stats = null;

  if (tavilyConfigured) {
    try {
      stats = getTavilyClient().getStats();
    } catch {
      // Client not initialized yet
    }
  }

  res.status(200).json({
    status: tavilyConfigured ? 'healthy' : 'degraded',
    service: 'web-research',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    tavilyConfigured,
    stats,
  });
});

/**
 * Calculate overall risk score from all intelligence sources
 */
function calculateOverallRiskScore(
  risks: WebRisk[],
  geopolitical: GeopoliticalAlert[],
  ports: WebRisk[],
  weather: WebRisk[]
): number {
  let score = 0;

  // Base score from risk count and severity
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };

  for (const risk of risks) {
    score += severityWeights[risk.severity] * 5;
  }

  for (const alert of geopolitical) {
    score += severityWeights[alert.severity] * 7; // Geopolitical has higher weight
  }

  for (const port of ports) {
    score += severityWeights[port.severity] * 4;
  }

  for (const w of weather) {
    score += severityWeights[w.severity] * 3;
  }

  // Normalize to 0-100 scale
  const maxScore = 400; // Reasonable max based on typical results
  const normalizedScore = Math.min(100, Math.round((score / maxScore) * 100));

  return normalizedScore;
}

/**
 * Generate human-readable intelligence summary
 */
function generateIntelligenceSummary(
  risks: WebRisk[],
  geopolitical: GeopoliticalAlert[],
  riskScore: number
): string {
  const criticalRisks = risks.filter(r => r.severity === 'critical');
  const highRisks = risks.filter(r => r.severity === 'high');
  const criticalGeo = geopolitical.filter(g => g.severity === 'critical');

  let riskLevel: string;
  if (riskScore >= 75) {
    riskLevel = 'Critical';
  } else if (riskScore >= 50) {
    riskLevel = 'High';
  } else if (riskScore >= 25) {
    riskLevel = 'Moderate';
  } else {
    riskLevel = 'Low';
  }

  const parts: string[] = [];

  parts.push(`${riskLevel} risk level (score: ${riskScore}/100).`);

  if (criticalRisks.length > 0 || criticalGeo.length > 0) {
    const criticalCount = criticalRisks.length + criticalGeo.length;
    parts.push(`${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} detected.`);
  }

  if (highRisks.length > 0) {
    parts.push(`${highRisks.length} high-priority risk${highRisks.length > 1 ? 's' : ''} identified.`);
  }

  if (risks.length === 0 && geopolitical.length === 0) {
    parts.push('No significant supply chain threats detected from web sources.');
  }

  return parts.join(' ');
}
