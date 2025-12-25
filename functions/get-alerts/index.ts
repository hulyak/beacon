import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import {
  activeAlerts,
  getAlertsByPriority,
  getAlertsByRegion,
} from '../shared/supply-chain-data';
import {
  handleCors,
  sendSuccess,
  sendError,
  validateAndSanitizeParams,
  createLogger,
  asyncHandler,
  checkRateLimit,
  timeAgo,
  ParameterValidation,
} from '../shared/utils';
import {
  GetAlertsRequest,
  GetAlertsResponse,
  Alert,
  Priority,
  Region,
  REGIONS,
} from '../shared/types';
import { getAgentCoordinator } from '../agents';
import { isTavilyConfigured } from '../shared/tavily-client';

/**
 * Get active supply chain alerts
 * 
 * POST /get-alerts
 * Body: { priority?: string, limit?: number, region?: string }
 * 
 * Returns: {
 *   alerts: Alert[],
 *   totalCount: number,
 *   criticalCount: number
 * }
 */
http('getAlerts', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const logger = createLogger(req);
  logger.info('Get alerts request received');

  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  // Check rate limits
  if (!checkRateLimit(req, res)) {
    return;
  }

  // Support both GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    logger.warn('Invalid HTTP method', { method: req.method });
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET and POST methods are allowed');
    return;
  }

  try {
    // Get parameters from query string (GET) or body (POST)
    const rawParams: GetAlertsRequest = req.method === 'GET' 
      ? {
          priority: req.query.priority as string,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          region: req.query.region as string,
        }
      : req.body || {};

    // Define validation schema
    const validationSchema: ParameterValidation = {
      priority: {
        required: false,
        allowedValues: ['all', 'high', 'critical', 'medium', 'low'],
      },
      region: {
        required: false,
        allowedValues: Object.keys(REGIONS),
      },
      limit: {
        required: false,
        min: 1,
        max: 100,
      },
    };

    // Validate and sanitize request parameters
    const validation = validateAndSanitizeParams(rawParams, validationSchema);
    
    if (!validation.isValid) {
      logger.warn('Validation failed', { errors: validation.errors });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request parameters', validation.errors);
      return;
    }

    const { priority, limit, region } = validation.sanitized;

    logger.setContext({ priority, limit, region });
    logger.info('Fetching alerts');

    // Get base alerts from mock data
    let alerts: Alert[] = [...activeAlerts];

    // Filter by priority
    if (priority && priority !== 'all') {
      alerts = getAlertsByPriority(priority as Priority);
    }

    // Filter by region
    if (region) {
      alerts = alerts.filter(alert =>
        alert.region === region || alert.region === 'global'
      );
    }

    // Sort alerts by priority and timestamp
    alerts = sortAlerts(alerts);

    // Try to enhance with real-time web intelligence if Tavily is configured
    let webAlerts: Alert[] = [];
    let agentInsights: Record<string, unknown> | null = null;

    if (isTavilyConfigured()) {
      try {
        const coordinator = getAgentCoordinator();
        await coordinator.initialize();

        logger.info('Invoking web-researcher agent for real-time alerts');

        const agentResult = await coordinator.process({
          query: `Get current supply chain alerts${region ? ` for ${region}` : ''}${priority && priority !== 'all' ? ` with ${priority} priority` : ''}`,
          intent: 'get_alerts',
          parameters: {
            region: region as Region,
            priority: priority as Priority,
          },
          agentHints: ['web-researcher'],
        });

        if (agentResult.success && agentResult.primaryResult.data) {
          const agentData = agentResult.primaryResult.data as {
            risks?: Array<{
              id: string;
              title: string;
              summary: string;
              severity: string;
              region: string;
              category: string;
            }>;
            geopoliticalAlerts?: Array<{
              id: string;
              title: string;
              summary: string;
              severity: string;
              regions: string[];
            }>;
          };

          // Convert web risks to alerts
          if (agentData.risks) {
            webAlerts = agentData.risks.map(risk => ({
              id: risk.id,
              title: risk.title,
              message: risk.summary,
              priority: (risk.severity === 'critical' ? 'critical' :
                        risk.severity === 'high' ? 'high' :
                        risk.severity === 'medium' ? 'medium' : 'low') as Priority,
              category: risk.category || 'logistics',
              timestamp: new Date().toISOString(),
              region: risk.region || 'global',
              isRead: false,
              actionRequired: risk.severity === 'critical' || risk.severity === 'high',
            }));
          }

          // Convert geopolitical alerts
          if (agentData.geopoliticalAlerts) {
            const geoAlerts = agentData.geopoliticalAlerts.map(alert => ({
              id: alert.id,
              title: alert.title,
              message: alert.summary,
              priority: (alert.severity === 'critical' ? 'critical' :
                        alert.severity === 'high' ? 'high' : 'medium') as Priority,
              category: 'geopolitical',
              timestamp: new Date().toISOString(),
              region: alert.regions[0] || 'global',
              isRead: false,
              actionRequired: alert.severity === 'critical',
            }));
            webAlerts = [...webAlerts, ...geoAlerts];
          }

          agentInsights = {
            confidence: agentResult.primaryResult.confidence,
            processingTime: agentResult.totalProcessingTime,
            webAlertsCount: webAlerts.length,
            dataFreshness: 'real-time',
          };

          logger.info('Web intelligence gathered', {
            webAlertsCount: webAlerts.length,
            processingTime: agentResult.totalProcessingTime,
          });
        }
      } catch (agentError) {
        logger.warn('Web research agent failed, using base alerts only', { error: agentError });
      }
    }

    // Merge web alerts with base alerts (deduplicate by similar titles)
    const seenTitles = new Set(alerts.map(a => a.title.toLowerCase()));
    const uniqueWebAlerts = webAlerts.filter(a => !seenTitles.has(a.title.toLowerCase()));
    const mergedAlerts = sortAlerts([...alerts, ...uniqueWebAlerts]);

    // Calculate counts before limiting
    const totalCount = mergedAlerts.length;
    const criticalCount = mergedAlerts.filter(a => a.priority === 'critical').length;
    const highCount = mergedAlerts.filter(a => a.priority === 'high').length;

    // Apply limit
    let finalAlerts = mergedAlerts;
    if (limit) {
      finalAlerts = mergedAlerts.slice(0, limit);
    }

    // Enhance alerts with human-readable timestamps
    const enhancedAlerts = finalAlerts.map(alert => ({
      ...alert,
      timeAgo: timeAgo(alert.timestamp),
    }));

    logger.info('Alerts fetched successfully', {
      totalCount,
      criticalCount,
      highCount,
      returnedCount: enhancedAlerts.length,
      webAlertsIncluded: uniqueWebAlerts.length,
    });

    // Prepare response
    const response: GetAlertsResponse & {
      webAlertsCount?: number;
      agentInsights?: typeof agentInsights;
    } = {
      alerts: enhancedAlerts,
      totalCount,
      criticalCount,
      ...(uniqueWebAlerts.length > 0 && { webAlertsCount: uniqueWebAlerts.length }),
      ...(agentInsights && { agentInsights }),
    };

    sendSuccess(res, response);

  } catch (error) {
    logger.error('Failed to fetch alerts', error);
    sendError(
      res,
      500,
      'FETCH_ERROR',
      'Failed to fetch supply chain alerts',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}));

/**
 * Sort alerts by priority and timestamp
 * Priority order: critical > high > medium > low
 * Within same priority: newest first
 */
function sortAlerts(alerts: Alert[]): Alert[] {
  const priorityOrder: Record<Priority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return alerts.sort((a, b) => {
    // First sort by priority (descending)
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // Then sort by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * Mark alert as read
 * 
 * POST /mark-alert-read
 * Body: { alertId: string }
 */
http('markAlertRead', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const logger = createLogger(req);
  logger.info('Mark alert read request received');

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
    const { alertId } = req.body;

    if (!alertId) {
      logger.warn('Missing alertId');
      sendError(res, 400, 'MISSING_ALERT_ID', 'alertId is required');
      return;
    }

    // Find alert
    const alert = activeAlerts.find(a => a.id === alertId);
    if (!alert) {
      logger.warn('Alert not found', { alertId });
      sendError(res, 404, 'ALERT_NOT_FOUND', `Alert with id '${alertId}' not found`);
      return;
    }

    // Mark as read (in a real implementation, this would update a database)
    alert.isRead = true;

    logger.info('Alert marked as read', { alertId });

    sendSuccess(res, {
      alertId,
      isRead: true,
      message: 'Alert marked as read successfully',
    });

  } catch (error) {
    logger.error('Failed to mark alert as read', error);
    sendError(
      res,
      500,
      'UPDATE_ERROR',
      'Failed to mark alert as read',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}));

/**
 * Get alert statistics
 * 
 * GET /alert-stats
 */
http('getAlertStats', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const logger = createLogger(req);
  logger.info('Get alert stats request received');

  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  // Check rate limits
  if (!checkRateLimit(req, res)) {
    return;
  }

  try {
    const stats = {
      total: activeAlerts.length,
      byPriority: {
        critical: activeAlerts.filter(a => a.priority === 'critical').length,
        high: activeAlerts.filter(a => a.priority === 'high').length,
        medium: activeAlerts.filter(a => a.priority === 'medium').length,
        low: activeAlerts.filter(a => a.priority === 'low').length,
      },
      byRegion: {
        asia: activeAlerts.filter(a => a.region === 'asia').length,
        europe: activeAlerts.filter(a => a.region === 'europe').length,
        north_america: activeAlerts.filter(a => a.region === 'north_america').length,
        south_america: activeAlerts.filter(a => a.region === 'south_america').length,
        global: activeAlerts.filter(a => a.region === 'global').length,
      },
      byCategory: {
        logistics: activeAlerts.filter(a => a.category === 'logistics').length,
        supplier: activeAlerts.filter(a => a.category === 'supplier').length,
        geopolitical: activeAlerts.filter(a => a.category === 'geopolitical').length,
        weather: activeAlerts.filter(a => a.category === 'weather').length,
      },
      unread: activeAlerts.filter(a => !a.isRead).length,
      actionRequired: activeAlerts.filter(a => a.actionRequired).length,
      timestamp: new Date().toISOString(),
    };

    logger.info('Alert stats calculated', stats);

    sendSuccess(res, stats);

  } catch (error) {
    logger.error('Failed to get alert stats', error);
    sendError(
      res,
      500,
      'STATS_ERROR',
      'Failed to get alert statistics',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}));

// Health check endpoint
http('getAlertsHealth', (req: Request, res: Response): void => {
  if (handleCors(req, res)) {
    return;
  }

  res.status(200).json({
    status: 'healthy',
    service: 'get-alerts',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    alertCount: activeAlerts.length,
  });
});