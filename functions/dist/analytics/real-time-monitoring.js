"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.realTimeMonitoring = void 0;
const zod_1 = require("zod");
const RealTimeMonitoringRequestSchema = zod_1.z.object({
    action: zod_1.z.enum(['start_stream', 'stop_stream', 'get_current', 'update_thresholds']),
    streams: zod_1.z.array(zod_1.z.object({
        streamId: zod_1.z.string(),
        metricType: zod_1.z.enum(['delivery_performance', 'cost_efficiency', 'risk_level', 'sustainability', 'custom']),
        frequency: zod_1.z.number().min(100).max(60000), // 100ms to 60s
        thresholds: zod_1.z.object({
            warning: zod_1.z.number(),
            critical: zod_1.z.number(),
        }),
        aggregation: zod_1.z.enum(['avg', 'sum', 'max', 'min', 'count']),
    })).optional(),
    streamIds: zod_1.z.array(zod_1.z.string()).optional(),
    timeWindow: zod_1.z.number().min(1).max(3600).optional(), // 1s to 1h
    includeHistory: zod_1.z.boolean().optional(),
});
// In-memory storage for active streams (in production, use Redis or similar)
const activeStreams = new Map();
const streamData = new Map();
const streamIntervals = new Map();
// Metric generators for simulation
const METRIC_GENERATORS = {
    delivery_performance: () => 85 + Math.random() * 30, // 85-115%
    cost_efficiency: () => 92 + Math.random() * 16, // 92-108%
    risk_level: () => Math.max(0, Math.min(100, 25 + (Math.random() - 0.5) * 50)), // 0-100
    sustainability: () => 70 + Math.random() * 20, // 70-90
    custom: () => Math.random() * 100,
};
/**
 * Handle real-time monitoring requests
 * Requirement 7.1: Provide real-time status updates with current risk levels
 * Requirement 7.3: Update performance metrics in real-time with threshold monitoring
 * Requirement 8.2: Handle data streams with sub-second latency for critical metrics
 */
const realTimeMonitoring = async (req, res) => {
    try {
        // Enable CORS
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.status(200).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // Validate request body
        const validationResult = RealTimeMonitoringRequestSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                error: 'Invalid request format',
                details: validationResult.error.errors,
            });
            return;
        }
        const { action, streams, streamIds, timeWindow = 300, includeHistory = false } = validationResult.data;
        let response;
        switch (action) {
            case 'start_stream':
                response = await handleStartStream(streams || []);
                break;
            case 'stop_stream':
                response = await handleStopStream(streamIds || []);
                break;
            case 'get_current':
                response = await handleGetCurrent(streamIds, timeWindow, includeHistory);
                break;
            case 'update_thresholds':
                response = await handleUpdateThresholds(streams || []);
                break;
            default:
                res.status(400).json({ error: 'Invalid action specified' });
                return;
        }
        console.log('Real-time monitoring request processed:', {
            action,
            streamCount: streams?.length || streamIds?.length || 0,
            activeStreamsCount: activeStreams.size,
        });
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in real-time monitoring:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
    }
};
exports.realTimeMonitoring = realTimeMonitoring;
/**
 * Start monitoring streams
 */
async function handleStartStream(streams) {
    const startedStreams = [];
    const errors = [];
    for (const stream of streams) {
        try {
            // Stop existing stream if it exists
            if (activeStreams.has(stream.streamId)) {
                await stopStream(stream.streamId);
            }
            // Start new stream
            activeStreams.set(stream.streamId, stream);
            streamData.set(stream.streamId, []);
            // Create interval for data generation
            const interval = setInterval(() => {
                generateDataPoint(stream);
            }, stream.frequency);
            streamIntervals.set(stream.streamId, interval);
            // Generate initial data point
            generateDataPoint(stream);
            startedStreams.push({
                streamId: stream.streamId,
                status: 'started',
                frequency: stream.frequency,
                nextUpdate: new Date(Date.now() + stream.frequency).toISOString(),
            });
        }
        catch (error) {
            errors.push({
                streamId: stream.streamId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    return {
        success: true,
        startedStreams,
        errors,
        totalActiveStreams: activeStreams.size,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Stop monitoring streams
 */
async function handleStopStream(streamIds) {
    const stoppedStreams = [];
    const errors = [];
    for (const streamId of streamIds) {
        try {
            if (activeStreams.has(streamId)) {
                await stopStream(streamId);
                stoppedStreams.push({
                    streamId,
                    status: 'stopped',
                    finalDataPoints: streamData.get(streamId)?.length || 0,
                });
            }
            else {
                errors.push({
                    streamId,
                    error: 'Stream not found',
                });
            }
        }
        catch (error) {
            errors.push({
                streamId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    return {
        success: true,
        stoppedStreams,
        errors,
        remainingActiveStreams: activeStreams.size,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Get current stream data
 */
async function handleGetCurrent(streamIds, timeWindow = 300, includeHistory = false) {
    const targetStreams = streamIds || Array.from(activeStreams.keys());
    const currentData = [];
    const errors = [];
    const cutoffTime = new Date(Date.now() - timeWindow * 1000);
    for (const streamId of targetStreams) {
        try {
            const stream = activeStreams.get(streamId);
            const data = streamData.get(streamId) || [];
            if (!stream) {
                errors.push({
                    streamId,
                    error: 'Stream not active',
                });
                continue;
            }
            // Filter data by time window
            const recentData = data.filter(point => new Date(point.timestamp) >= cutoffTime);
            const latestPoint = data[data.length - 1];
            // Calculate aggregated metrics
            const aggregatedValue = calculateAggregation(recentData, stream.aggregation);
            const trend = calculateTrend(recentData);
            const thresholdStatus = getThresholdStatus(aggregatedValue, stream.thresholds);
            currentData.push({
                streamId,
                metricType: stream.metricType,
                current: {
                    value: latestPoint?.value || 0,
                    timestamp: latestPoint?.timestamp || new Date().toISOString(),
                    aggregatedValue,
                    trend,
                    thresholdStatus,
                },
                statistics: {
                    dataPoints: recentData.length,
                    min: Math.min(...recentData.map(p => p.value)),
                    max: Math.max(...recentData.map(p => p.value)),
                    avg: recentData.reduce((sum, p) => sum + p.value, 0) / recentData.length || 0,
                    stdDev: calculateStandardDeviation(recentData.map(p => p.value)),
                },
                thresholds: stream.thresholds,
                history: includeHistory ? recentData : undefined,
            });
        }
        catch (error) {
            errors.push({
                streamId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    return {
        success: true,
        currentData,
        errors,
        timeWindow,
        timestamp: new Date().toISOString(),
        systemStatus: {
            activeStreams: activeStreams.size,
            totalDataPoints: Array.from(streamData.values()).reduce((sum, data) => sum + data.length, 0),
            memoryUsage: process.memoryUsage(),
        },
    };
}
/**
 * Update stream thresholds
 */
async function handleUpdateThresholds(streams) {
    const updatedStreams = [];
    const errors = [];
    for (const stream of streams) {
        try {
            const existingStream = activeStreams.get(stream.streamId);
            if (existingStream) {
                existingStream.thresholds = stream.thresholds;
                activeStreams.set(stream.streamId, existingStream);
                updatedStreams.push({
                    streamId: stream.streamId,
                    newThresholds: stream.thresholds,
                    status: 'updated',
                });
            }
            else {
                errors.push({
                    streamId: stream.streamId,
                    error: 'Stream not found',
                });
            }
        }
        catch (error) {
            errors.push({
                streamId: stream.streamId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    return {
        success: true,
        updatedStreams,
        errors,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Stop a single stream
 */
async function stopStream(streamId) {
    const interval = streamIntervals.get(streamId);
    if (interval) {
        clearInterval(interval);
        streamIntervals.delete(streamId);
    }
    activeStreams.delete(streamId);
    // Keep data for potential retrieval
    // streamData.delete(streamId);
}
/**
 * Generate a data point for a stream
 */
function generateDataPoint(stream) {
    const generator = METRIC_GENERATORS[stream.metricType] || METRIC_GENERATORS.custom;
    const value = generator();
    const dataPoint = {
        timestamp: new Date().toISOString(),
        value: Math.round(value * 100) / 100,
        source: `stream_${stream.streamId}`,
        metadata: {
            metricType: stream.metricType,
            aggregation: stream.aggregation,
        },
    };
    const data = streamData.get(stream.streamId) || [];
    data.push(dataPoint);
    // Keep only last 1000 data points per stream
    if (data.length > 1000) {
        data.splice(0, data.length - 1000);
    }
    streamData.set(stream.streamId, data);
    // Check for threshold breaches
    checkThresholds(stream, dataPoint);
}
/**
 * Check threshold breaches and generate alerts
 */
function checkThresholds(stream, dataPoint) {
    const { value } = dataPoint;
    const { warning, critical } = stream.thresholds;
    if (value >= critical) {
        console.warn(`CRITICAL THRESHOLD BREACH: ${stream.streamId} = ${value} (threshold: ${critical})`);
        // In production, trigger alert system
    }
    else if (value >= warning) {
        console.warn(`WARNING THRESHOLD BREACH: ${stream.streamId} = ${value} (threshold: ${warning})`);
        // In production, trigger warning system
    }
}
/**
 * Calculate aggregation for data points
 */
function calculateAggregation(data, aggregation) {
    if (data.length === 0)
        return 0;
    const values = data.map(p => p.value);
    switch (aggregation) {
        case 'avg':
            return values.reduce((sum, val) => sum + val, 0) / values.length;
        case 'sum':
            return values.reduce((sum, val) => sum + val, 0);
        case 'max':
            return Math.max(...values);
        case 'min':
            return Math.min(...values);
        case 'count':
            return values.length;
        default:
            return values[values.length - 1] || 0;
    }
}
/**
 * Calculate trend direction
 */
function calculateTrend(data) {
    if (data.length < 2)
        return 'stable';
    const recent = data.slice(-10); // Last 10 points
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (change > 2)
        return 'up';
    if (change < -2)
        return 'down';
    return 'stable';
}
/**
 * Get threshold status
 */
function getThresholdStatus(value, thresholds) {
    if (value >= thresholds.critical)
        return 'critical';
    if (value >= thresholds.warning)
        return 'warning';
    return 'normal';
}
/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values) {
    if (values.length === 0)
        return 0;
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
}
// Cleanup function for graceful shutdown
process.on('SIGTERM', () => {
    console.log('Cleaning up real-time monitoring streams...');
    for (const [streamId] of activeStreams) {
        stopStream(streamId);
    }
});
// Health check endpoint
const healthCheck = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: 'healthy',
        service: 'real-time-monitoring',
        activeStreams: activeStreams.size,
        totalDataPoints: Array.from(streamData.values()).reduce((sum, data) => sum + data.length, 0),
        timestamp: new Date().toISOString(),
    });
};
exports.healthCheck = healthCheck;
// Default export for Google Cloud Functions
exports.default = exports.realTimeMonitoring;
//# sourceMappingURL=real-time-monitoring.js.map