"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.anomalyDetection = void 0;
const zod_1 = require("zod");
const AnomalyDetectionRequestSchema = zod_1.z.object({
    action: zod_1.z.enum(['detect_threshold', 'detect_pattern', 'comprehensive', 'configure']),
    data: zod_1.z.array(zod_1.z.object({
        timestamp: zod_1.z.string(),
        value: zod_1.z.number(),
        source: zod_1.z.string(),
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
    })).optional(),
    thresholds: zod_1.z.array(zod_1.z.object({
        metricName: zod_1.z.string(),
        upperBound: zod_1.z.number(),
        lowerBound: zod_1.z.number(),
        severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        enabled: zod_1.z.boolean(),
    })).optional(),
    patternRules: zod_1.z.array(zod_1.z.object({
        ruleId: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        pattern: zod_1.z.enum(['spike', 'drop', 'trend', 'oscillation', 'flatline']),
        parameters: zod_1.z.object({
            windowSize: zod_1.z.number().min(3).max(100),
            threshold: zod_1.z.number().min(0).max(100),
            duration: zod_1.z.number().min(1).max(1440),
        }),
        severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        enabled: zod_1.z.boolean(),
    })).optional(),
    timeWindow: zod_1.z.number().min(1).max(168).optional(), // 1 hour to 1 week
    sensitivity: zod_1.z.enum(['low', 'medium', 'high']).optional(),
});
// Default thresholds for common supply chain metrics
const DEFAULT_THRESHOLDS = [
    {
        metricName: 'delivery_performance',
        upperBound: 120,
        lowerBound: 80,
        severity: 'medium',
        enabled: true,
    },
    {
        metricName: 'cost_efficiency',
        upperBound: 110,
        lowerBound: 90,
        severity: 'high',
        enabled: true,
    },
    {
        metricName: 'risk_level',
        upperBound: 80,
        lowerBound: 0,
        severity: 'critical',
        enabled: true,
    },
    {
        metricName: 'sustainability_score',
        upperBound: 100,
        lowerBound: 60,
        severity: 'medium',
        enabled: true,
    },
];
// Default pattern rules
const DEFAULT_PATTERN_RULES = [
    {
        ruleId: 'spike_detection',
        name: 'Sudden Spike Detection',
        description: 'Detects sudden increases in metric values',
        pattern: 'spike',
        parameters: { windowSize: 5, threshold: 25, duration: 5 },
        severity: 'high',
        enabled: true,
    },
    {
        ruleId: 'drop_detection',
        name: 'Sudden Drop Detection',
        description: 'Detects sudden decreases in metric values',
        pattern: 'drop',
        parameters: { windowSize: 5, threshold: 25, duration: 5 },
        severity: 'high',
        enabled: true,
    },
    {
        ruleId: 'trend_detection',
        name: 'Negative Trend Detection',
        description: 'Detects sustained negative trends',
        pattern: 'trend',
        parameters: { windowSize: 10, threshold: 15, duration: 30 },
        severity: 'medium',
        enabled: true,
    },
    {
        ruleId: 'oscillation_detection',
        name: 'Excessive Oscillation',
        description: 'Detects unstable oscillating patterns',
        pattern: 'oscillation',
        parameters: { windowSize: 8, threshold: 20, duration: 15 },
        severity: 'medium',
        enabled: true,
    },
    {
        ruleId: 'flatline_detection',
        name: 'Flatline Detection',
        description: 'Detects when metrics stop changing (potential system failure)',
        pattern: 'flatline',
        parameters: { windowSize: 6, threshold: 2, duration: 10 },
        severity: 'critical',
        enabled: true,
    },
];
/**
 * Handle anomaly detection requests
 * Requirement 7.2: Generate immediate alerts with severity classification
 * Requirement 7.5: Proactively notify users with voice alerts and detailed impact analysis
 */
const anomalyDetection = async (req, res) => {
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
        const validationResult = AnomalyDetectionRequestSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                error: 'Invalid request format',
                details: validationResult.error.errors,
            });
            return;
        }
        const { action, data = [], thresholds = DEFAULT_THRESHOLDS, patternRules = DEFAULT_PATTERN_RULES, timeWindow = 24, sensitivity = 'medium' } = validationResult.data;
        let response;
        switch (action) {
            case 'detect_threshold':
                response = await handleThresholdDetection(data, thresholds, sensitivity);
                break;
            case 'detect_pattern':
                response = await handlePatternDetection(data, patternRules, sensitivity);
                break;
            case 'comprehensive':
                response = await handleComprehensiveDetection(data, thresholds, patternRules, timeWindow, sensitivity);
                break;
            case 'configure':
                response = await handleConfiguration(thresholds, patternRules);
                break;
            default:
                res.status(400).json({ error: 'Invalid action specified' });
                return;
        }
        console.log('Anomaly detection completed:', {
            action,
            dataPoints: data.length,
            anomaliesFound: response.anomalies?.length || 0,
            severity: response.summary?.highestSeverity || 'none',
        });
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in anomaly detection:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
    }
};
exports.anomalyDetection = anomalyDetection;
/**
 * Handle threshold-based anomaly detection
 */
async function handleThresholdDetection(data, thresholds, sensitivity) {
    const anomalies = [];
    const enabledThresholds = thresholds.filter(t => t.enabled);
    // Group data by source/metric
    const groupedData = groupDataBySource(data);
    for (const [source, points] of Object.entries(groupedData)) {
        // Find matching threshold
        const threshold = enabledThresholds.find(t => source.includes(t.metricName) || t.metricName === 'default');
        if (!threshold)
            continue;
        // Check each data point against thresholds
        for (const point of points) {
            const anomaly = checkThresholdAnomaly(point, threshold, sensitivity);
            if (anomaly) {
                anomalies.push(anomaly);
            }
        }
    }
    return {
        success: true,
        detectionType: 'threshold',
        anomalies,
        summary: generateAnomalySummary(anomalies),
        thresholds: enabledThresholds,
        sensitivity,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Handle pattern-based anomaly detection
 */
async function handlePatternDetection(data, patternRules, sensitivity) {
    const anomalies = [];
    const enabledRules = patternRules.filter(r => r.enabled);
    // Group data by source
    const groupedData = groupDataBySource(data);
    for (const [source, points] of Object.entries(groupedData)) {
        // Sort points by timestamp
        const sortedPoints = points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        // Apply each pattern rule
        for (const rule of enabledRules) {
            const patternAnomalies = detectPattern(sortedPoints, rule, source, sensitivity);
            anomalies.push(...patternAnomalies);
        }
    }
    return {
        success: true,
        detectionType: 'pattern',
        anomalies,
        summary: generateAnomalySummary(anomalies),
        patternRules: enabledRules,
        sensitivity,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Handle comprehensive anomaly detection
 */
async function handleComprehensiveDetection(data, thresholds, patternRules, timeWindow, sensitivity) {
    // Filter data by time window
    const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    const recentData = data.filter(point => new Date(point.timestamp) >= cutoffTime);
    // Run both threshold and pattern detection
    const [thresholdResults, patternResults] = await Promise.all([
        handleThresholdDetection(recentData, thresholds, sensitivity),
        handlePatternDetection(recentData, patternRules, sensitivity),
    ]);
    // Combine anomalies and deduplicate
    const allAnomalies = [
        ...thresholdResults.anomalies,
        ...patternResults.anomalies,
    ];
    const deduplicatedAnomalies = deduplicateAnomalies(allAnomalies);
    // Generate impact assessment
    const impactAssessment = generateImpactAssessment(deduplicatedAnomalies);
    // Generate recommendations
    const recommendations = generateAnomalyRecommendations(deduplicatedAnomalies);
    return {
        success: true,
        detectionType: 'comprehensive',
        anomalies: deduplicatedAnomalies,
        summary: generateAnomalySummary(deduplicatedAnomalies),
        impactAssessment,
        recommendations,
        configuration: {
            thresholds: thresholds.filter(t => t.enabled),
            patternRules: patternRules.filter(r => r.enabled),
            timeWindow,
            sensitivity,
        },
        timestamp: new Date().toISOString(),
    };
}
/**
 * Handle configuration management
 */
async function handleConfiguration(thresholds, patternRules) {
    return {
        success: true,
        configuration: {
            thresholds,
            patternRules,
            defaultThresholds: DEFAULT_THRESHOLDS,
            defaultPatternRules: DEFAULT_PATTERN_RULES,
        },
        validationResults: {
            thresholds: validateThresholds(thresholds),
            patternRules: validatePatternRules(patternRules),
        },
        timestamp: new Date().toISOString(),
    };
}
/**
 * Group data points by source
 */
function groupDataBySource(data) {
    return data.reduce((groups, point) => {
        if (!groups[point.source]) {
            groups[point.source] = [];
        }
        groups[point.source].push(point);
        return groups;
    }, {});
}
/**
 * Check threshold anomaly for a single data point
 */
function checkThresholdAnomaly(point, threshold, sensitivity) {
    const sensitivityMultiplier = { low: 0.8, medium: 1.0, high: 1.2 }[sensitivity] || 1.0;
    const adjustedUpper = threshold.upperBound * sensitivityMultiplier;
    const adjustedLower = threshold.lowerBound * sensitivityMultiplier;
    if (point.value > adjustedUpper || point.value < adjustedLower) {
        return {
            id: `threshold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'threshold',
            severity: threshold.severity,
            source: point.source,
            metricName: threshold.metricName,
            timestamp: point.timestamp,
            value: point.value,
            threshold: point.value > adjustedUpper ? adjustedUpper : adjustedLower,
            deviation: point.value > adjustedUpper ?
                ((point.value - adjustedUpper) / adjustedUpper) * 100 :
                ((adjustedLower - point.value) / adjustedLower) * 100,
            description: `${threshold.metricName} ${point.value > adjustedUpper ? 'exceeded upper' : 'fell below lower'} threshold`,
            impact: calculateThresholdImpact(point.value, threshold),
            recommendedActions: getThresholdRecommendations(threshold.metricName, point.value > adjustedUpper),
        };
    }
    return null;
}
/**
 * Detect patterns in time series data
 */
function detectPattern(points, rule, source, sensitivity) {
    const anomalies = [];
    const { windowSize, threshold, duration } = rule.parameters;
    const sensitivityMultiplier = { low: 0.8, medium: 1.0, high: 1.2 }[sensitivity] || 1.0;
    const adjustedThreshold = threshold * sensitivityMultiplier;
    if (points.length < windowSize)
        return anomalies;
    for (let i = windowSize - 1; i < points.length; i++) {
        const window = points.slice(i - windowSize + 1, i + 1);
        const patternDetected = detectSpecificPattern(window, rule.pattern, adjustedThreshold);
        if (patternDetected) {
            // Check duration requirement
            const windowDuration = (new Date(window[window.length - 1].timestamp).getTime() -
                new Date(window[0].timestamp).getTime()) / (1000 * 60); // minutes
            if (windowDuration >= duration) {
                anomalies.push({
                    id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'pattern',
                    pattern: rule.pattern,
                    severity: rule.severity,
                    source,
                    ruleId: rule.ruleId,
                    ruleName: rule.name,
                    timestamp: window[window.length - 1].timestamp,
                    windowStart: window[0].timestamp,
                    windowEnd: window[window.length - 1].timestamp,
                    values: window.map(p => p.value),
                    patternStrength: patternDetected.strength,
                    description: `${rule.name}: ${patternDetected.description}`,
                    impact: calculatePatternImpact(rule.pattern, rule.severity),
                    recommendedActions: getPatternRecommendations(rule.pattern, source),
                });
            }
        }
    }
    return anomalies;
}
/**
 * Detect specific pattern types
 */
function detectSpecificPattern(window, pattern, threshold) {
    const values = window.map(p => p.value);
    switch (pattern) {
        case 'spike':
            return detectSpike(values, threshold);
        case 'drop':
            return detectDrop(values, threshold);
        case 'trend':
            return detectTrend(values, threshold);
        case 'oscillation':
            return detectOscillation(values, threshold);
        case 'flatline':
            return detectFlatline(values, threshold);
        default:
            return null;
    }
}
/**
 * Detect spike pattern
 */
function detectSpike(values, threshold) {
    const baseline = values.slice(0, -2).reduce((sum, val) => sum + val, 0) / (values.length - 2);
    const recent = values.slice(-2);
    const maxRecent = Math.max(...recent);
    const increase = ((maxRecent - baseline) / baseline) * 100;
    if (increase > threshold) {
        return {
            strength: Math.min(100, increase),
            description: `Spike detected: ${increase.toFixed(1)}% increase from baseline`,
        };
    }
    return null;
}
/**
 * Detect drop pattern
 */
function detectDrop(values, threshold) {
    const baseline = values.slice(0, -2).reduce((sum, val) => sum + val, 0) / (values.length - 2);
    const recent = values.slice(-2);
    const minRecent = Math.min(...recent);
    const decrease = ((baseline - minRecent) / baseline) * 100;
    if (decrease > threshold) {
        return {
            strength: Math.min(100, decrease),
            description: `Drop detected: ${decrease.toFixed(1)}% decrease from baseline`,
        };
    }
    return null;
}
/**
 * Detect trend pattern
 */
function detectTrend(values, threshold) {
    // Calculate linear regression slope
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;
    const trendStrength = Math.abs((slope * (n - 1)) / avgY) * 100;
    if (trendStrength > threshold) {
        return {
            strength: Math.min(100, trendStrength),
            description: `${slope < 0 ? 'Declining' : 'Rising'} trend detected: ${trendStrength.toFixed(1)}% change`,
        };
    }
    return null;
}
/**
 * Detect oscillation pattern
 */
function detectOscillation(values, threshold) {
    let changes = 0;
    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
        const change = Math.abs(values[i] - values[i - 1]);
        const percentChange = (change / values[i - 1]) * 100;
        if (percentChange > 5) { // Minimum change to count as oscillation
            changes++;
            totalChange += percentChange;
        }
    }
    const oscillationStrength = (changes / (values.length - 1)) * 100;
    if (oscillationStrength > threshold) {
        return {
            strength: Math.min(100, oscillationStrength),
            description: `Oscillation detected: ${changes} significant changes in ${values.length} points`,
        };
    }
    return null;
}
/**
 * Detect flatline pattern
 */
function detectFlatline(values, threshold) {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const maxDeviation = Math.max(...values.map(val => Math.abs(val - avg)));
    const deviationPercent = (maxDeviation / avg) * 100;
    if (deviationPercent < threshold) {
        return {
            strength: 100 - deviationPercent,
            description: `Flatline detected: maximum deviation ${deviationPercent.toFixed(1)}%`,
        };
    }
    return null;
}
/**
 * Generate anomaly summary
 */
function generateAnomalySummary(anomalies) {
    const severityCounts = anomalies.reduce((counts, anomaly) => {
        counts[anomaly.severity] = (counts[anomaly.severity] || 0) + 1;
        return counts;
    }, {});
    const highestSeverity = anomalies.length > 0 ?
        ['critical', 'high', 'medium', 'low'].find(severity => severityCounts[severity] > 0) || 'low' :
        'none';
    return {
        total: anomalies.length,
        severityCounts,
        highestSeverity,
        sources: [...new Set(anomalies.map(a => a.source))],
        timeRange: anomalies.length > 0 ? {
            start: Math.min(...anomalies.map(a => new Date(a.timestamp).getTime())),
            end: Math.max(...anomalies.map(a => new Date(a.timestamp).getTime())),
        } : null,
    };
}
/**
 * Deduplicate similar anomalies
 */
function deduplicateAnomalies(anomalies) {
    const deduplicated = [];
    const seen = new Set();
    for (const anomaly of anomalies) {
        const key = `${anomaly.source}_${anomaly.type}_${Math.floor(new Date(anomaly.timestamp).getTime() / (5 * 60 * 1000))}`; // 5-minute windows
        if (!seen.has(key)) {
            seen.add(key);
            deduplicated.push(anomaly);
        }
    }
    return deduplicated;
}
/**
 * Generate impact assessment for anomalies
 */
function generateImpactAssessment(anomalies) {
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const highCount = anomalies.filter(a => a.severity === 'high').length;
    let overallImpact = 'low';
    if (criticalCount > 0)
        overallImpact = 'critical';
    else if (highCount > 2)
        overallImpact = 'high';
    else if (highCount > 0 || anomalies.length > 5)
        overallImpact = 'medium';
    return {
        overallImpact,
        affectedSystems: [...new Set(anomalies.map(a => a.source))],
        estimatedDowntime: criticalCount * 30 + highCount * 10, // minutes
        businessImpact: {
            deliveryRisk: anomalies.some(a => a.source.includes('delivery')),
            costRisk: anomalies.some(a => a.source.includes('cost')),
            qualityRisk: anomalies.some(a => a.source.includes('quality')),
            complianceRisk: anomalies.some(a => a.severity === 'critical'),
        },
    };
}
/**
 * Generate recommendations for anomalies
 */
function generateAnomalyRecommendations(anomalies) {
    const recommendations = [];
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
        recommendations.push({
            priority: 'immediate',
            action: 'Investigate Critical Anomalies',
            description: `${criticalAnomalies.length} critical anomalies detected requiring immediate attention`,
            steps: [
                'Verify system status and data integrity',
                'Check for infrastructure issues',
                'Implement emergency response procedures',
                'Notify stakeholders and escalate if necessary',
            ],
        });
    }
    const patternAnomalies = anomalies.filter(a => a.type === 'pattern');
    if (patternAnomalies.length > 2) {
        recommendations.push({
            priority: 'high',
            action: 'Address Pattern Anomalies',
            description: 'Multiple pattern anomalies suggest systematic issues',
            steps: [
                'Analyze root causes of pattern changes',
                'Review recent system or process changes',
                'Implement preventive measures',
                'Adjust monitoring thresholds if needed',
            ],
        });
    }
    return recommendations;
}
/**
 * Calculate threshold impact
 */
function calculateThresholdImpact(value, threshold) {
    const deviation = Math.abs(value - (value > threshold.upperBound ? threshold.upperBound : threshold.lowerBound));
    const relativeDeviation = deviation / Math.abs(threshold.upperBound - threshold.lowerBound);
    if (relativeDeviation > 0.5)
        return 'high';
    if (relativeDeviation > 0.2)
        return 'medium';
    return 'low';
}
/**
 * Calculate pattern impact
 */
function calculatePatternImpact(pattern, severity) {
    const patternImpacts = {
        spike: 'high',
        drop: 'high',
        trend: 'medium',
        oscillation: 'medium',
        flatline: 'critical',
    };
    const baseImpact = patternImpacts[pattern] || 'medium';
    // Adjust based on severity
    if (severity === 'critical')
        return 'critical';
    if (severity === 'high' && baseImpact !== 'critical')
        return 'high';
    return baseImpact;
}
/**
 * Get threshold recommendations
 */
function getThresholdRecommendations(metricName, isUpper) {
    const recommendations = {
        delivery_performance: isUpper ?
            ['Investigate delivery process improvements', 'Check for data accuracy issues'] :
            ['Review delivery bottlenecks', 'Implement contingency plans'],
        cost_efficiency: isUpper ?
            ['Analyze cost drivers', 'Review supplier contracts'] :
            ['Verify cost calculation accuracy', 'Investigate cost reduction opportunities'],
        risk_level: isUpper ?
            ['Activate risk mitigation protocols', 'Increase monitoring frequency'] :
            ['Maintain current risk controls', 'Document risk reduction factors'],
    };
    return recommendations[metricName] || ['Review metric and take appropriate action'];
}
/**
 * Get pattern recommendations
 */
function getPatternRecommendations(pattern, source) {
    const recommendations = {
        spike: ['Investigate cause of sudden increase', 'Implement spike handling procedures'],
        drop: ['Identify root cause of decrease', 'Activate recovery procedures'],
        trend: ['Analyze trend drivers', 'Implement corrective measures'],
        oscillation: ['Stabilize system parameters', 'Review control mechanisms'],
        flatline: ['Check system connectivity', 'Verify data collection processes'],
    };
    return recommendations[pattern] || ['Monitor closely and investigate'];
}
/**
 * Validate thresholds configuration
 */
function validateThresholds(thresholds) {
    const errors = [];
    for (const threshold of thresholds) {
        if (threshold.upperBound <= threshold.lowerBound) {
            errors.push(`${threshold.metricName}: Upper bound must be greater than lower bound`);
        }
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Validate pattern rules configuration
 */
function validatePatternRules(patternRules) {
    const errors = [];
    for (const rule of patternRules) {
        if (rule.parameters.windowSize < 3) {
            errors.push(`${rule.ruleId}: Window size must be at least 3`);
        }
        if (rule.parameters.threshold < 0 || rule.parameters.threshold > 100) {
            errors.push(`${rule.ruleId}: Threshold must be between 0 and 100`);
        }
    }
    return { valid: errors.length === 0, errors };
}
// Health check endpoint
const healthCheck = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: 'healthy',
        service: 'anomaly-detection',
        defaultThresholds: DEFAULT_THRESHOLDS.length,
        defaultPatternRules: DEFAULT_PATTERN_RULES.length,
        timestamp: new Date().toISOString(),
    });
};
exports.healthCheck = healthCheck;
// Default export for Google Cloud Functions
exports.default = exports.anomalyDetection;
//# sourceMappingURL=anomaly-detection.js.map