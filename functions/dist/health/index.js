"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_framework_1 = require("@google-cloud/functions-framework");
const gemini_client_1 = require("../shared/gemini-client");
const utils_1 = require("../shared/utils");
/**
 * Health check endpoint for all services
 *
 * GET /health
 *
 * Returns: {
 *   status: 'healthy' | 'degraded' | 'unhealthy',
 *   timestamp: string,
 *   services: {
 *     gemini: { status: string, latency?: number },
 *     database: { status: string },
 *     cache: { status: string }
 *   }
 * }
 */
(0, functions_framework_1.http)('health', async (req, res) => {
    const logger = (0, utils_1.createLogger)(req);
    // Handle CORS
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    const startTime = Date.now();
    const services = {};
    let overallStatus = 'healthy';
    try {
        // Check Gemini service
        try {
            const geminiClient = (0, gemini_client_1.getGeminiClient)();
            const testStart = Date.now();
            // Simple test query
            await geminiClient.generateContent('Test health check query', 'Respond with "OK" only', { temperature: 0, maxOutputTokens: 10 });
            const latency = Date.now() - testStart;
            services.gemini = {
                status: 'healthy',
                latency,
            };
            if (latency > 10000) { // 10 seconds
                services.gemini.status = 'degraded';
                overallStatus = 'degraded';
            }
        }
        catch (error) {
            logger.warn('Gemini health check failed', { error });
            services.gemini = {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            overallStatus = 'unhealthy';
        }
        // Check data services (mock data is always available)
        services.database = {
            status: 'healthy',
            type: 'mock',
        };
        // Check cache service
        try {
            const geminiClient = (0, gemini_client_1.getGeminiClient)();
            const cacheStats = geminiClient.getCacheStats();
            services.cache = {
                status: 'healthy',
                size: cacheStats.size,
            };
        }
        catch (error) {
            services.cache = {
                status: 'degraded',
                error: 'Cache stats unavailable',
            };
            if (overallStatus === 'healthy') {
                overallStatus = 'degraded';
            }
        }
        const totalLatency = Date.now() - startTime;
        const response = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            latency: totalLatency,
            services,
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
        logger.info('Health check completed', {
            status: overallStatus,
            latency: totalLatency,
            services: Object.keys(services),
        });
        // Return appropriate HTTP status
        const statusCode = overallStatus === 'healthy' ? 200 :
            overallStatus === 'degraded' ? 200 : 503;
        res.status(statusCode).json(response);
    }
    catch (error) {
        logger.error('Health check failed', error);
        const response = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            latency: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Health check failed',
            services,
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
        res.status(503).json(response);
    }
});
/**
 * Simple ping endpoint for basic connectivity checks
 */
(0, functions_framework_1.http)('ping', (req, res) => {
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    res.status(200).json({
        message: 'pong',
        timestamp: new Date().toISOString(),
    });
});
/**
 * Readiness probe for Kubernetes/container orchestration
 */
(0, functions_framework_1.http)('ready', async (req, res) => {
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    try {
        // Quick check of essential services
        const geminiClient = (0, gemini_client_1.getGeminiClient)();
        // Just check if client can be created (don't make actual API call)
        const isReady = !!geminiClient;
        if (isReady) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        res.status(503).json({
            status: 'not ready',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
});
/**
 * Liveness probe for Kubernetes/container orchestration
 */
(0, functions_framework_1.http)('live', (req, res) => {
    if ((0, utils_1.handleCors)(req, res)) {
        return;
    }
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});
//# sourceMappingURL=index.js.map