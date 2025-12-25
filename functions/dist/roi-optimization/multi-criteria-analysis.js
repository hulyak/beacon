"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performMultiCriteriaAnalysis = void 0;
const performMultiCriteriaAnalysis = async (req, res) => {
    try {
        const request = req.body;
        // Validate input
        if (!request.strategies || !Array.isArray(request.strategies) || request.strategies.length === 0) {
            res.status(400).json({
                error: 'At least one strategy is required'
            });
            return;
        }
        if (!request.weights) {
            res.status(400).json({
                error: 'Criteria weights are required'
            });
            return;
        }
        // Normalize weights to sum to 1
        const totalWeight = Object.values(request.weights).reduce((sum, weight) => sum + weight, 0);
        const normalizedWeights = {
            cost: request.weights.cost / totalWeight,
            risk: request.weights.risk / totalWeight,
            sustainability: request.weights.sustainability / totalWeight,
            timeline: request.weights.timeline / totalWeight,
            quality: request.weights.quality / totalWeight,
            feasibility: request.weights.feasibility / totalWeight
        };
        // Apply preference adjustments
        const adjustedWeights = applyPreferenceAdjustments(normalizedWeights, request.preferences);
        // Calculate weighted scores for each strategy
        const rankedStrategies = request.strategies.map(strategy => {
            const criteriaBreakdown = {};
            let weightedScore = 0;
            // Calculate weighted score for each criterion
            Object.entries(strategy.scores).forEach(([criterion, score]) => {
                const weight = adjustedWeights[criterion];
                const weightedValue = score * weight;
                criteriaBreakdown[criterion] = {
                    score,
                    weight,
                    weightedValue
                };
                weightedScore += weightedValue;
            });
            // Generate strengths and weaknesses
            const strengths = [];
            const weaknesses = [];
            if (strategy.scores.cost > 80)
                strengths.push('Excellent cost efficiency');
            else if (strategy.scores.cost < 40)
                weaknesses.push('High implementation cost');
            if (strategy.scores.risk > 80)
                strengths.push('Low risk profile');
            else if (strategy.scores.risk < 40)
                weaknesses.push('High risk factors');
            if (strategy.scores.sustainability > 80)
                strengths.push('Strong environmental benefits');
            else if (strategy.scores.sustainability < 40)
                weaknesses.push('Limited sustainability impact');
            if (strategy.scores.timeline > 80)
                strengths.push('Quick implementation');
            else if (strategy.scores.timeline < 40)
                weaknesses.push('Extended implementation timeline');
            if (strategy.scores.quality > 80)
                strengths.push('High quality outcomes');
            else if (strategy.scores.quality < 40)
                weaknesses.push('Quality concerns');
            if (strategy.scores.feasibility > 80)
                strengths.push('High implementation feasibility');
            else if (strategy.scores.feasibility < 40)
                weaknesses.push('Implementation challenges');
            // Generate recommendation
            let recommendation = '';
            if (weightedScore > 80) {
                recommendation = 'Highly recommended - excellent performance across key criteria';
            }
            else if (weightedScore > 60) {
                recommendation = 'Recommended with consideration of identified weaknesses';
            }
            else if (weightedScore > 40) {
                recommendation = 'Consider with significant risk mitigation measures';
            }
            else {
                recommendation = 'Not recommended - significant concerns across multiple criteria';
            }
            return {
                ...strategy,
                analysis: {
                    weightedScore: Math.round(weightedScore * 100) / 100,
                    rank: 0, // Will be set after sorting
                    criteriaBreakdown,
                    strengths,
                    weaknesses,
                    recommendation
                }
            };
        });
        // Sort by weighted score and assign ranks
        rankedStrategies.sort((a, b) => b.analysis.weightedScore - a.analysis.weightedScore);
        rankedStrategies.forEach((strategy, index) => {
            strategy.analysis.rank = index + 1;
        });
        // Generate analysis
        const topStrategy = rankedStrategies[0];
        const analysis = {
            topStrategy: {
                id: topStrategy.id,
                name: topStrategy.name,
                score: topStrategy.analysis.weightedScore,
                reasoning: generateTopStrategyReasoning(topStrategy, adjustedWeights)
            },
            tradeoffAnalysis: generateTradeoffAnalysis(rankedStrategies),
            sensitivityAnalysis: performSensitivityAnalysis(rankedStrategies, adjustedWeights)
        };
        // Generate recommendations
        const recommendations = generateRecommendations(rankedStrategies, request.preferences);
        const response = {
            rankedStrategies,
            analysis,
            recommendations
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Multi-criteria analysis error:', error);
        res.status(500).json({
            error: 'Internal server error during multi-criteria analysis',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.performMultiCriteriaAnalysis = performMultiCriteriaAnalysis;
function applyPreferenceAdjustments(weights, preferences) {
    const adjusted = { ...weights };
    // Adjust based on risk tolerance
    if (preferences.riskTolerance === 'conservative') {
        adjusted.risk *= 1.3;
        adjusted.feasibility *= 1.2;
    }
    else if (preferences.riskTolerance === 'aggressive') {
        adjusted.risk *= 0.8;
        adjusted.timeline *= 1.2;
    }
    // Adjust based on time horizon
    if (preferences.timeHorizon === 'short') {
        adjusted.timeline *= 1.4;
        adjusted.cost *= 1.1;
    }
    else if (preferences.timeHorizon === 'long') {
        adjusted.sustainability *= 1.3;
        adjusted.quality *= 1.2;
    }
    // Adjust based on sustainability priority
    if (preferences.sustainabilityPriority === 'high') {
        adjusted.sustainability *= 1.5;
    }
    else if (preferences.sustainabilityPriority === 'low') {
        adjusted.sustainability *= 0.7;
        adjusted.cost *= 1.2;
    }
    // Renormalize
    const total = Object.values(adjusted).reduce((sum, weight) => sum + weight, 0);
    Object.keys(adjusted).forEach(key => {
        adjusted[key] /= total;
    });
    return adjusted;
}
function generateTopStrategyReasoning(strategy, weights) {
    const topCriteria = Object.entries(weights)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([criterion]) => criterion);
    const reasons = [];
    topCriteria.forEach(criterion => {
        const score = strategy.scores[criterion];
        if (score > 70) {
            reasons.push(`strong ${criterion} performance (${score}/100)`);
        }
    });
    return `Selected based on ${reasons.join(', ')} and overall weighted score of ${strategy.analysis.weightedScore}/100.`;
}
function generateTradeoffAnalysis(strategies) {
    const avgScores = {
        cost: strategies.reduce((sum, s) => sum + s.scores.cost, 0) / strategies.length,
        risk: strategies.reduce((sum, s) => sum + s.scores.risk, 0) / strategies.length,
        sustainability: strategies.reduce((sum, s) => sum + s.scores.sustainability, 0) / strategies.length,
        timeline: strategies.reduce((sum, s) => sum + s.scores.timeline, 0) / strategies.length,
        quality: strategies.reduce((sum, s) => sum + s.scores.quality, 0) / strategies.length,
        feasibility: strategies.reduce((sum, s) => sum + s.scores.feasibility, 0) / strategies.length
    };
    return {
        costVsRisk: avgScores.cost > avgScores.risk
            ? 'Strategies generally favor cost efficiency over risk mitigation'
            : 'Strategies generally prioritize risk mitigation over cost savings',
        timeVsSustainability: avgScores.timeline > avgScores.sustainability
            ? 'Faster implementation often comes at the expense of sustainability benefits'
            : 'Sustainable strategies typically require longer implementation timelines',
        qualityVsFeasibility: avgScores.quality > avgScores.feasibility
            ? 'High-quality outcomes may present implementation challenges'
            : 'Feasible strategies may compromise on quality outcomes'
    };
}
function performSensitivityAnalysis(strategies, weights) {
    const criteriaImpact = {};
    Object.keys(weights).forEach(criterion => {
        // Calculate ranking change if this criterion weight increases by 10%
        const adjustedWeights = { ...weights };
        adjustedWeights[criterion] *= 1.1;
        // Renormalize
        const total = Object.values(adjustedWeights).reduce((sum, weight) => sum + weight, 0);
        Object.keys(adjustedWeights).forEach(key => {
            adjustedWeights[key] /= total;
        });
        // Recalculate scores and count ranking changes
        let rankingChanges = 0;
        const newRanking = strategies.map(strategy => {
            let newScore = 0;
            Object.entries(strategy.scores).forEach(([crit, score]) => {
                newScore += score * adjustedWeights[crit];
            });
            return { id: strategy.id, score: newScore };
        }).sort((a, b) => b.score - a.score);
        // Count position changes
        newRanking.forEach((item, newRank) => {
            const oldRank = strategies.findIndex(s => s.id === item.id);
            if (Math.abs(newRank - oldRank) > 0) {
                rankingChanges++;
            }
        });
        criteriaImpact[criterion] = rankingChanges;
    });
    return { criteriaImpact };
}
function generateRecommendations(strategies, preferences) {
    const top3 = strategies.slice(0, 3);
    const primary = `Implement ${top3[0].name} as the primary strategy due to its superior weighted score of ${top3[0].analysis.weightedScore}/100.`;
    const alternatives = top3.slice(1).map(strategy => `Consider ${strategy.name} as an alternative (score: ${strategy.analysis.weightedScore}/100)`);
    const riskMitigation = [];
    if (preferences.riskTolerance === 'conservative') {
        riskMitigation.push('Conduct detailed risk assessment before implementation');
        riskMitigation.push('Develop comprehensive contingency plans');
    }
    if (top3[0].scores.feasibility < 60) {
        riskMitigation.push('Address feasibility concerns through pilot testing');
    }
    if (top3[0].scores.timeline < 60) {
        riskMitigation.push('Consider phased implementation to manage timeline risks');
    }
    return {
        primary,
        alternatives,
        riskMitigation
    };
}
//# sourceMappingURL=multi-criteria-analysis.js.map