"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_framework_1 = require("@google-cloud/functions-framework");
const supply_chain_data_1 = require("./shared/supply-chain-data");
const utils_1 = require("./shared/utils");
const types_1 = require("./shared/types");
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
(0, functions_framework_1.http)('getAlerts', (0, utils_1.asyncHandler)(async (req, res) => {
    const logger = (0, utils_1.createLogger)(req);
    logger.info('Get alerts request received');
    // Handle CORS
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    // Check rate limits
    if (!(0, utils_1.checkRateLimit)(req, res)) {
        return;
    }
    // Support both GET and POST methods
    if (req.method !== 'GET' && req.method !== 'POST') {
        logger.warn('Invalid HTTP method', { method: req.method });
        (0, utils_1.sendError)(res, 405, 'METHOD_NOT_ALLOWED', 'Only GET and POST methods are allowed');
        return;
    }
    try {
        // Get parameters from query string (GET) or body (POST)
        const rawParams = req.method === 'GET'
            ? {
                priority: req.query.priority,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                region: req.query.region,
            }
            : req.body || {};
        // Define validation schema
        const validationSchema = {
            priority: {
                required: false,
                allowedValues: ['all', 'high', 'critical', 'medium', 'low'],
            },
            region: {
                required: false,
                allowedValues: Object.keys(types_1.REGIONS),
            },
            limit: {
                required: false,
                min: 1,
                max: 100,
            },
        };
        // Validate and sanitize request parameters
        const validation = (0, utils_1.validateAndSanitizeParams)(rawParams, validationSchema);
        if (!validation.isValid) {
            logger.warn('Validation failed', { errors: validation.errors });
            (0, utils_1.sendError)(res, 400, 'VALIDATION_ERROR', 'Invalid request parameters', validation.errors);
            return;
        }
        const { priority, limit, region } = validation.sanitized;
        logger.setContext({ priority, limit, region });
        logger.info('Fetching alerts');
        // Get alerts based on filters
        let alerts = [...supply_chain_data_1.activeAlerts];
        // Filter by priority
        if (priority && priority !== 'all') {
            alerts = (0, supply_chain_data_1.getAlertsByPriority)(priority);
        }
        // Filter by region
        if (region) {
            alerts = alerts.filter(alert => alert.region === region || alert.region === 'global');
        }
        // Sort alerts by priority and timestamp
        alerts = sortAlerts(alerts);
        // Calculate counts before limiting
        const totalCount = alerts.length;
        const criticalCount = alerts.filter(a => a.priority === 'critical').length;
        const highCount = alerts.filter(a => a.priority === 'high').length;
        // Apply limit
        if (limit) {
            alerts = alerts.slice(0, limit);
        }
        // Enhance alerts with human-readable timestamps
        const enhancedAlerts = alerts.map(alert => ({
            ...alert,
            timeAgo: (0, utils_1.timeAgo)(alert.timestamp),
        }));
        logger.info('Alerts fetched successfully', {
            totalCount,
            criticalCount,
            highCount,
            returnedCount: enhancedAlerts.length,
        });
        // Prepare response
        const response = {
            alerts: enhancedAlerts,
            totalCount,
            criticalCount,
        };
        (0, utils_1.sendSuccess)(res, response);
    }
    catch (error) {
        logger.error('Failed to fetch alerts', error);
        (0, utils_1.sendError)(res, 500, 'FETCH_ERROR', 'Failed to fetch supply chain alerts', process.env.NODE_ENV === 'development' ? error : undefined);
    }
}));
/**
 * Sort alerts by priority and timestamp
 * Priority order: critical > high > medium > low
 * Within same priority: newest first
 */
function sortAlerts(alerts) {
    const priorityOrder = {
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
(0, functions_framework_1.http)('markAlertRead', (0, utils_1.asyncHandler)(async (req, res) => {
    const logger = (0, utils_1.createLogger)(req);
    logger.info('Mark alert read request received');
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
        const { alertId } = req.body;
        if (!alertId) {
            logger.warn('Missing alertId');
            (0, utils_1.sendError)(res, 400, 'MISSING_ALERT_ID', 'alertId is required');
            return;
        }
        // Find alert
        const alert = supply_chain_data_1.activeAlerts.find(a => a.id === alertId);
        if (!alert) {
            logger.warn('Alert not found', { alertId });
            (0, utils_1.sendError)(res, 404, 'ALERT_NOT_FOUND', `Alert with id '${alertId}' not found`);
            return;
        }
        // Mark as read (in a real implementation, this would update a database)
        alert.isRead = true;
        logger.info('Alert marked as read', { alertId });
        (0, utils_1.sendSuccess)(res, {
            alertId,
            isRead: true,
            message: 'Alert marked as read successfully',
        });
    }
    catch (error) {
        logger.error('Failed to mark alert as read', error);
        (0, utils_1.sendError)(res, 500, 'UPDATE_ERROR', 'Failed to mark alert as read', process.env.NODE_ENV === 'development' ? error : undefined);
    }
}));
/**
 * Get alert statistics
 *
 * GET /alert-stats
 */
(0, functions_framework_1.http)('getAlertStats', (0, utils_1.asyncHandler)(async (req, res) => {
    const logger = (0, utils_1.createLogger)(req);
    logger.info('Get alert stats request received');
    // Handle CORS
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    // Check rate limits
    if (!(0, utils_1.checkRateLimit)(req, res)) {
        return;
    }
    try {
        const stats = {
            total: supply_chain_data_1.activeAlerts.length,
            byPriority: {
                critical: supply_chain_data_1.activeAlerts.filter(a => a.priority === 'critical').length,
                high: supply_chain_data_1.activeAlerts.filter(a => a.priority === 'high').length,
                medium: supply_chain_data_1.activeAlerts.filter(a => a.priority === 'medium').length,
                low: supply_chain_data_1.activeAlerts.filter(a => a.priority === 'low').length,
            },
            byRegion: {
                asia: supply_chain_data_1.activeAlerts.filter(a => a.region === 'asia').length,
                europe: supply_chain_data_1.activeAlerts.filter(a => a.region === 'europe').length,
                north_america: supply_chain_data_1.activeAlerts.filter(a => a.region === 'north_america').length,
                south_america: supply_chain_data_1.activeAlerts.filter(a => a.region === 'south_america').length,
                global: supply_chain_data_1.activeAlerts.filter(a => a.region === 'global').length,
            },
            byCategory: {
                logistics: supply_chain_data_1.activeAlerts.filter(a => a.category === 'logistics').length,
                supplier: supply_chain_data_1.activeAlerts.filter(a => a.category === 'supplier').length,
                geopolitical: supply_chain_data_1.activeAlerts.filter(a => a.category === 'geopolitical').length,
                weather: supply_chain_data_1.activeAlerts.filter(a => a.category === 'weather').length,
            },
            unread: supply_chain_data_1.activeAlerts.filter(a => !a.isRead).length,
            actionRequired: supply_chain_data_1.activeAlerts.filter(a => a.actionRequired).length,
            timestamp: new Date().toISOString(),
        };
        logger.info('Alert stats calculated', stats);
        (0, utils_1.sendSuccess)(res, stats);
    }
    catch (error) {
        logger.error('Failed to get alert stats', error);
        (0, utils_1.sendError)(res, 500, 'STATS_ERROR', 'Failed to get alert statistics', process.env.NODE_ENV === 'development' ? error : undefined);
    }
}));
// Health check endpoint
(0, functions_framework_1.http)('getAlertsHealth', (req, res) => {
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    res.status(200).json({
        status: 'healthy',
        service: 'get-alerts',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        alertCount: supply_chain_data_1.activeAlerts.length,
    });
});
//# sourceMappingURL=index.js.map