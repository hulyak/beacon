"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_framework_1 = require("@google-cloud/functions-framework");
/**
 * Calculate confidence scores for AI recommendations
 *
 * POST /calculate-confidence
 * Body: { analysisType: string, agentResults: object, dataQuality?: object, context?: object }
 *
 * Returns: Comprehensive confidence analysis with agent contributions and uncertainty factors
 */
(0, functions_framework_1.http)('calculateConfidence', async (req, res) => {
    // Handle CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Only POST method allowed' });
        return;
    }
    try {
        const { analysisType, agentResults, dataQuality, context = {} } = req.body;
        // Validate required parameters
        if (!analysisType || !agentResults) {
            res.status(400).json({
                error: 'Missing required parameters: analysisType, agentResults'
            });
            return;
        }
        // Calculate agent contributions
        const agentContributions = calculateAgentContributions(agentResults, analysisType);
        // Calculate confidence components
        const confidenceBreakdown = calculateConfidenceBreakdown(agentContributions, dataQuality, context, analysisType);
        // Calculate overall confidence
        const overallConfidence = calculateOverallConfidence(confidenceBreakdown);
        // Identify uncertainty factors
        const uncertaintyFactors = identifyUncertaintyFactors(agentContributions, dataQuality, context, overallConfidence);
        const response = {
            overallConfidence,
            agentContributions,
            confidenceBreakdown,
            uncertaintyFactors,
            analysisTimestamp: new Date().toISOString(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Confidence calculation failed:', error);
        res.status(500).json({
            error: 'Failed to calculate confidence',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Calculate individual agent contributions
 */
function calculateAgentContributions(agentResults, analysisType) {
    // Define agent weights based on analysis type
    const agentWeights = {
        impact: {
            infoAgent: 0.25,
            scenarioAgent: 0.30,
            impactAgent: 0.35,
            strategyAgent: 0.10
        },
        sustainability: {
            infoAgent: 0.30,
            scenarioAgent: 0.20,
            impactAgent: 0.25,
            strategyAgent: 0.25
        },
        optimization: {
            infoAgent: 0.20,
            scenarioAgent: 0.25,
            impactAgent: 0.25,
            strategyAgent: 0.30
        }
    };
    const weights = agentWeights[analysisType] || agentWeights.impact;
    return {
        infoAgent: calculateSingleAgentContribution(agentResults.infoAgent, weights.infoAgent, 'Information Gathering'),
        scenarioAgent: calculateSingleAgentContribution(agentResults.scenarioAgent, weights.scenarioAgent, 'Scenario Analysis'),
        impactAgent: calculateSingleAgentContribution(agentResults.impactAgent, weights.impactAgent, 'Impact Assessment'),
        strategyAgent: calculateSingleAgentContribution(agentResults.strategyAgent, weights.strategyAgent, 'Strategy Optimization')
    };
}
/**
 * Calculate contribution for a single agent
 */
function calculateSingleAgentContribution(agentResult, weight, agentType) {
    if (!agentResult) {
        // Default values for missing agent
        return {
            confidence: 50,
            processingTime: 0,
            dataQuality: 50,
            contributionWeight: weight,
            keyInsights: [`${agentType} agent not available`]
        };
    }
    // Calculate data quality score based on agent performance
    const dataQuality = calculateAgentDataQuality(agentResult);
    // Adjust confidence based on performance metrics
    const adjustedConfidence = adjustConfidenceForPerformance(agentResult.confidence, agentResult.processingTime, agentResult.errorRate, agentResult.dataPoints);
    return {
        confidence: Math.round(adjustedConfidence),
        processingTime: agentResult.processingTime,
        dataQuality: Math.round(dataQuality),
        contributionWeight: weight,
        keyInsights: agentResult.keyInsights || []
    };
}
/**
 * Calculate data quality score for an agent
 */
function calculateAgentDataQuality(agentResult) {
    let qualityScore = 100;
    // Penalize high error rates
    qualityScore -= (agentResult.errorRate * 100);
    // Reward sufficient data points
    const dataPointScore = Math.min(100, (agentResult.dataPoints / 10) * 100);
    qualityScore = (qualityScore + dataPointScore) / 2;
    // Penalize excessive processing time (indicates potential issues)
    if (agentResult.processingTime > 30000) { // 30 seconds
        qualityScore -= 10;
    }
    else if (agentResult.processingTime > 60000) { // 1 minute
        qualityScore -= 20;
    }
    return Math.max(0, Math.min(100, qualityScore));
}
/**
 * Adjust confidence based on performance metrics
 */
function adjustConfidenceForPerformance(baseConfidence, processingTime, errorRate, dataPoints) {
    let adjustedConfidence = baseConfidence;
    // Penalize high error rates
    adjustedConfidence -= (errorRate * 50);
    // Penalize insufficient data points
    if (dataPoints < 5) {
        adjustedConfidence -= 15;
    }
    else if (dataPoints < 10) {
        adjustedConfidence -= 5;
    }
    // Slight penalty for very long processing times (may indicate complexity issues)
    if (processingTime > 45000) { // 45 seconds
        adjustedConfidence -= 5;
    }
    return Math.max(30, Math.min(95, adjustedConfidence));
}
/**
 * Calculate confidence breakdown components
 */
function calculateConfidenceBreakdown(agentContributions, dataQuality, context, analysisType) {
    // Calculate agent performance score
    const agentPerformance = calculateWeightedAgentPerformance(agentContributions);
    // Calculate data quality score
    const dataQualityScore = calculateDataQualityScore(dataQuality);
    // Calculate contextual factors score
    const contextualFactors = calculateContextualFactorsScore(context, analysisType);
    // Calculate uncertainty adjustment
    const uncertaintyAdjustment = calculateUncertaintyAdjustment(agentPerformance, dataQualityScore, contextualFactors, context);
    return {
        dataQuality: Math.round(dataQualityScore),
        agentPerformance: Math.round(agentPerformance),
        contextualFactors: Math.round(contextualFactors),
        uncertaintyAdjustment: Math.round(uncertaintyAdjustment)
    };
}
/**
 * Calculate weighted agent performance
 */
function calculateWeightedAgentPerformance(agentContributions) {
    const agents = Object.values(agentContributions);
    return agents.reduce((sum, agent) => {
        return sum + (agent.confidence * agent.contributionWeight);
    }, 0);
}
/**
 * Calculate data quality score
 */
function calculateDataQualityScore(dataQuality) {
    if (!dataQuality) {
        return 75; // Default moderate data quality
    }
    const { completeness, accuracy, timeliness, consistency } = dataQuality;
    // Weighted average of data quality dimensions
    const weights = {
        completeness: 0.3,
        accuracy: 0.4,
        timeliness: 0.2,
        consistency: 0.1
    };
    return (completeness * weights.completeness +
        accuracy * weights.accuracy +
        timeliness * weights.timeliness +
        consistency * weights.consistency);
}
/**
 * Calculate contextual factors score
 */
function calculateContextualFactorsScore(context, analysisType) {
    let score = 80; // Base score
    if (!context)
        return score;
    // Regional complexity adjustments
    const regionComplexity = {
        asia: -5, // More complex supply chains
        europe: 2, // Better data availability
        north_america: 0,
        south_america: -8,
        global: -12 // Highest complexity
    };
    if (context.region) {
        score += regionComplexity[context.region] || 0;
    }
    // Severity adjustments
    const severityComplexity = {
        minor: 5,
        moderate: 0,
        severe: -5,
        catastrophic: -15
    };
    if (context.severity) {
        score += severityComplexity[context.severity] || 0;
    }
    // Scenario type adjustments
    const scenarioComplexity = {
        demand_surge: 5, // More predictable
        supplier_failure: 0,
        transportation_disruption: -2,
        port_closure: -5,
        natural_disaster: -10 // Least predictable
    };
    if (context.scenarioType) {
        score += scenarioComplexity[context.scenarioType] || 0;
    }
    // Analysis type complexity
    const analysisComplexity = {
        impact: 0,
        sustainability: -3, // Environmental factors add uncertainty
        optimization: -8 // Multi-criteria optimization is most complex
    };
    score += analysisComplexity[analysisType] || 0;
    return Math.max(30, Math.min(95, score));
}
/**
 * Calculate uncertainty adjustment
 */
function calculateUncertaintyAdjustment(agentPerformance, dataQuality, contextualFactors, context) {
    // Base uncertainty adjustment
    let adjustment = 0;
    // Penalize low performance areas
    if (agentPerformance < 60)
        adjustment -= 10;
    if (dataQuality < 60)
        adjustment -= 8;
    if (contextualFactors < 60)
        adjustment -= 5;
    // Additional uncertainty for complex scenarios
    if (context?.complexity === 'high') {
        adjustment -= 5;
    }
    // Uncertainty increases with extreme scenarios
    if (context?.severity === 'catastrophic') {
        adjustment -= 8;
    }
    return Math.max(-20, Math.min(10, adjustment));
}
/**
 * Calculate overall confidence
 */
function calculateOverallConfidence(breakdown) {
    // Weighted combination of confidence components
    const weights = {
        dataQuality: 0.25,
        agentPerformance: 0.40,
        contextualFactors: 0.25,
        uncertaintyAdjustment: 0.10
    };
    const baseConfidence = (breakdown.dataQuality * weights.dataQuality +
        breakdown.agentPerformance * weights.agentPerformance +
        breakdown.contextualFactors * weights.contextualFactors);
    const finalConfidence = baseConfidence + breakdown.uncertaintyAdjustment;
    return Math.max(50, Math.min(95, Math.round(finalConfidence)));
}
/**
 * Identify uncertainty factors
 */
function identifyUncertaintyFactors(agentContributions, dataQuality, context, overallConfidence) {
    const factors = [];
    // Agent performance issues
    const lowPerformingAgents = Object.entries(agentContributions)
        .filter(([_, agent]) => agent.confidence < 70)
        .map(([name, _]) => name);
    if (lowPerformingAgents.length > 0) {
        factors.push({
            factor: 'Agent Performance',
            impact: lowPerformingAgents.length * 5,
            description: `${lowPerformingAgents.join(', ')} showing lower confidence levels`
        });
    }
    // Data quality issues
    if (dataQuality) {
        if (dataQuality.completeness < 80) {
            factors.push({
                factor: 'Data Completeness',
                impact: (80 - dataQuality.completeness) / 4,
                description: 'Incomplete data may affect analysis accuracy'
            });
        }
        if (dataQuality.accuracy < 85) {
            factors.push({
                factor: 'Data Accuracy',
                impact: (85 - dataQuality.accuracy) / 3,
                description: 'Data accuracy concerns may impact reliability'
            });
        }
    }
    // Contextual complexity
    if (context?.severity === 'catastrophic') {
        factors.push({
            factor: 'Scenario Complexity',
            impact: 15,
            description: 'Catastrophic scenarios have limited historical precedents'
        });
    }
    if (context?.region === 'global') {
        factors.push({
            factor: 'Global Scope',
            impact: 10,
            description: 'Global analysis involves multiple regional variables'
        });
    }
    // Processing time concerns
    const slowAgents = Object.entries(agentContributions)
        .filter(([_, agent]) => agent.processingTime > 30000)
        .map(([name, _]) => name);
    if (slowAgents.length > 0) {
        factors.push({
            factor: 'Processing Complexity',
            impact: 5,
            description: `Extended processing time for ${slowAgents.join(', ')} may indicate data complexity`
        });
    }
    return factors;
}
/**
 * Health check endpoint
 */
(0, functions_framework_1.http)('calculateConfidenceHealth', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    res.status(200).json({
        status: 'healthy',
        service: 'calculate-confidence',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
//# sourceMappingURL=calculate-confidence.js.map