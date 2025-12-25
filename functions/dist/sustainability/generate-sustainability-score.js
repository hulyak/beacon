"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.generateSustainabilityScore = void 0;
const zod_1 = require("zod");
const SustainabilityScoreRequestSchema = zod_1.z.object({
    metrics: zod_1.z.object({
        carbonFootprint: zod_1.z.number().min(0),
        emissionsPerUnit: zod_1.z.number().min(0),
        renewableEnergyUsage: zod_1.z.number().min(0).max(100),
        wasteReduction: zod_1.z.number().min(0).max(100),
        waterUsage: zod_1.z.number().min(0),
        recyclingRate: zod_1.z.number().min(0).max(100),
        sustainableSourcing: zod_1.z.number().min(0).max(100),
        transportEfficiency: zod_1.z.number().min(0).max(100),
    }),
    benchmark: zod_1.z.object({
        industryType: zod_1.z.string(),
        region: zod_1.z.string(),
        companySize: zod_1.z.enum(['small', 'medium', 'large', 'enterprise']),
    }),
    timeRange: zod_1.z.enum(['7d', '30d', '90d', '1y']).optional(),
    includeRecommendations: zod_1.z.boolean().optional(),
});
// Industry benchmarks for different sectors
const INDUSTRY_BENCHMARKS = {
    manufacturing: {
        carbonFootprint: { excellent: 50, good: 100, average: 200, poor: 400 },
        emissionsPerUnit: { excellent: 0.5, good: 1.0, average: 2.0, poor: 4.0 },
        renewableEnergy: { excellent: 80, good: 60, average: 40, poor: 20 },
        wasteReduction: { excellent: 90, good: 70, average: 50, poor: 30 },
        recyclingRate: { excellent: 85, good: 65, average: 45, poor: 25 },
    },
    logistics: {
        carbonFootprint: { excellent: 30, good: 60, average: 120, poor: 250 },
        emissionsPerUnit: { excellent: 0.3, good: 0.6, average: 1.2, poor: 2.5 },
        renewableEnergy: { excellent: 70, good: 50, average: 30, poor: 15 },
        wasteReduction: { excellent: 80, good: 60, average: 40, poor: 20 },
        recyclingRate: { excellent: 75, good: 55, average: 35, poor: 15 },
    },
    retail: {
        carbonFootprint: { excellent: 20, good: 40, average: 80, poor: 160 },
        emissionsPerUnit: { excellent: 0.2, good: 0.4, average: 0.8, poor: 1.6 },
        renewableEnergy: { excellent: 90, good: 70, average: 50, poor: 30 },
        wasteReduction: { excellent: 95, good: 75, average: 55, poor: 35 },
        recyclingRate: { excellent: 90, good: 70, average: 50, poor: 30 },
    },
};
// Scoring weights for different components
const SCORING_WEIGHTS = {
    environmental: 0.4,
    efficiency: 0.3,
    innovation: 0.2,
    compliance: 0.1,
};
/**
 * Generate sustainability score based on environmental performance benchmarks
 * Requirement 3.3: Calculate scores from 0-100 based on environmental performance benchmarks
 */
const generateSustainabilityScore = async (req, res) => {
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
        const validationResult = SustainabilityScoreRequestSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                error: 'Invalid request format',
                details: validationResult.error.errors,
            });
            return;
        }
        const { metrics, benchmark, timeRange = '30d', includeRecommendations = true } = validationResult.data;
        // Get industry benchmarks
        const industryBenchmark = getIndustryBenchmark(benchmark.industryType);
        // Calculate component scores
        const environmentalScore = calculateEnvironmentalScore(metrics, industryBenchmark);
        const efficiencyScore = calculateEfficiencyScore(metrics, industryBenchmark);
        const innovationScore = calculateInnovationScore(metrics, benchmark);
        const complianceScore = calculateComplianceScore(metrics, industryBenchmark);
        // Calculate overall sustainability score
        const overallScore = Math.round(environmentalScore * SCORING_WEIGHTS.environmental +
            efficiencyScore * SCORING_WEIGHTS.efficiency +
            innovationScore * SCORING_WEIGHTS.innovation +
            complianceScore * SCORING_WEIGHTS.compliance);
        // Generate performance rating
        const performanceRating = getPerformanceRating(overallScore);
        // Calculate percentile ranking
        const percentileRanking = calculatePercentileRanking(overallScore, benchmark);
        // Generate improvement recommendations
        const recommendations = includeRecommendations ?
            generateImprovementRecommendations(metrics, industryBenchmark, environmentalScore, efficiencyScore) : [];
        // Create detailed breakdown
        const scoreBreakdown = {
            environmental: {
                score: environmentalScore,
                weight: SCORING_WEIGHTS.environmental,
                contribution: Math.round(environmentalScore * SCORING_WEIGHTS.environmental),
                components: {
                    carbonFootprint: calculateComponentScore(metrics.carbonFootprint, industryBenchmark.carbonFootprint, 'lower_better'),
                    emissionsPerUnit: calculateComponentScore(metrics.emissionsPerUnit, industryBenchmark.emissionsPerUnit, 'lower_better'),
                    renewableEnergy: calculateComponentScore(metrics.renewableEnergyUsage, industryBenchmark.renewableEnergy, 'higher_better'),
                },
            },
            efficiency: {
                score: efficiencyScore,
                weight: SCORING_WEIGHTS.efficiency,
                contribution: Math.round(efficiencyScore * SCORING_WEIGHTS.efficiency),
                components: {
                    wasteReduction: calculateComponentScore(metrics.wasteReduction, industryBenchmark.wasteReduction, 'higher_better'),
                    recyclingRate: calculateComponentScore(metrics.recyclingRate, industryBenchmark.recyclingRate, 'higher_better'),
                    transportEfficiency: metrics.transportEfficiency,
                },
            },
            innovation: {
                score: innovationScore,
                weight: SCORING_WEIGHTS.innovation,
                contribution: Math.round(innovationScore * SCORING_WEIGHTS.innovation),
                components: {
                    sustainableSourcing: metrics.sustainableSourcing,
                    technologyAdoption: calculateTechnologyScore(metrics),
                    processOptimization: calculateProcessOptimizationScore(metrics),
                },
            },
            compliance: {
                score: complianceScore,
                weight: SCORING_WEIGHTS.compliance,
                contribution: Math.round(complianceScore * SCORING_WEIGHTS.compliance),
                components: {
                    regulatoryCompliance: calculateRegulatoryScore(metrics, benchmark),
                    reportingQuality: calculateReportingScore(metrics),
                    stakeholderEngagement: calculateStakeholderScore(metrics),
                },
            },
        };
        // Generate response
        const response = {
            sustainabilityScore: {
                overall: overallScore,
                environmental: environmentalScore,
                efficiency: efficiencyScore,
                innovation: innovationScore,
                compliance: complianceScore,
            },
            performanceRating,
            percentileRanking,
            scoreBreakdown,
            benchmarkComparison: {
                industryAverage: getIndustryAverage(benchmark.industryType),
                topPerformers: getTopPerformers(benchmark.industryType),
                yourPerformance: overallScore,
                percentile: percentileRanking,
            },
            trendAnalysis: generateTrendAnalysis(overallScore, timeRange),
            recommendations,
            calculationDetails: {
                benchmarkUsed: benchmark,
                timeRange,
                calculationTimestamp: new Date().toISOString(),
                scoringWeights: SCORING_WEIGHTS,
            },
        };
        console.log('Sustainability score generated successfully:', {
            overallScore,
            performanceRating,
            industryType: benchmark.industryType,
            percentile: percentileRanking,
        });
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error generating sustainability score:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
    }
};
exports.generateSustainabilityScore = generateSustainabilityScore;
/**
 * Get industry benchmark data
 */
function getIndustryBenchmark(industryType) {
    const normalizedType = industryType.toLowerCase();
    return INDUSTRY_BENCHMARKS[normalizedType] || INDUSTRY_BENCHMARKS.manufacturing;
}
/**
 * Calculate environmental score (0-100)
 */
function calculateEnvironmentalScore(metrics, benchmark) {
    const carbonScore = calculateComponentScore(metrics.carbonFootprint, benchmark.carbonFootprint, 'lower_better');
    const emissionsScore = calculateComponentScore(metrics.emissionsPerUnit, benchmark.emissionsPerUnit, 'lower_better');
    const renewableScore = calculateComponentScore(metrics.renewableEnergyUsage, benchmark.renewableEnergy, 'higher_better');
    return Math.round((carbonScore + emissionsScore + renewableScore) / 3);
}
/**
 * Calculate efficiency score (0-100)
 */
function calculateEfficiencyScore(metrics, benchmark) {
    const wasteScore = calculateComponentScore(metrics.wasteReduction, benchmark.wasteReduction, 'higher_better');
    const recyclingScore = calculateComponentScore(metrics.recyclingRate, benchmark.recyclingRate, 'higher_better');
    const transportScore = metrics.transportEfficiency;
    return Math.round((wasteScore + recyclingScore + transportScore) / 3);
}
/**
 * Calculate innovation score (0-100)
 */
function calculateInnovationScore(metrics, benchmark) {
    const sourcingScore = metrics.sustainableSourcing;
    const technologyScore = calculateTechnologyScore(metrics);
    const processScore = calculateProcessOptimizationScore(metrics);
    // Adjust for company size (larger companies expected to have more innovation)
    const sizeMultiplier = benchmark.companySize === 'enterprise' ? 1.0 :
        benchmark.companySize === 'large' ? 1.1 :
            benchmark.companySize === 'medium' ? 1.2 : 1.3;
    const baseScore = (sourcingScore + technologyScore + processScore) / 3;
    return Math.round(Math.min(100, baseScore * sizeMultiplier));
}
/**
 * Calculate compliance score (0-100)
 */
function calculateComplianceScore(metrics, benchmark) {
    const regulatoryScore = calculateRegulatoryScore(metrics, benchmark);
    const reportingScore = calculateReportingScore(metrics);
    const stakeholderScore = calculateStakeholderScore(metrics);
    return Math.round((regulatoryScore + reportingScore + stakeholderScore) / 3);
}
/**
 * Calculate component score based on benchmark comparison
 */
function calculateComponentScore(value, benchmark, direction) {
    if (direction === 'lower_better') {
        if (value <= benchmark.excellent)
            return 100;
        if (value <= benchmark.good)
            return 80;
        if (value <= benchmark.average)
            return 60;
        if (value <= benchmark.poor)
            return 40;
        return Math.max(0, 40 - ((value - benchmark.poor) / benchmark.poor) * 20);
    }
    else {
        if (value >= benchmark.excellent)
            return 100;
        if (value >= benchmark.good)
            return 80;
        if (value >= benchmark.average)
            return 60;
        if (value >= benchmark.poor)
            return 40;
        return Math.max(0, (value / benchmark.poor) * 40);
    }
}
/**
 * Calculate technology adoption score
 */
function calculateTechnologyScore(metrics) {
    // Based on renewable energy usage and transport efficiency as proxies for technology adoption
    const techScore = (metrics.renewableEnergyUsage + metrics.transportEfficiency) / 2;
    return Math.round(techScore);
}
/**
 * Calculate process optimization score
 */
function calculateProcessOptimizationScore(metrics) {
    // Based on waste reduction and recycling rate as indicators of process optimization
    const processScore = (metrics.wasteReduction + metrics.recyclingRate) / 2;
    return Math.round(processScore);
}
/**
 * Calculate regulatory compliance score
 */
function calculateRegulatoryScore(metrics, benchmark) {
    // Assume compliance based on meeting minimum thresholds
    const carbonCompliance = metrics.carbonFootprint <= benchmark.carbonFootprint.poor ? 100 : 60;
    const emissionsCompliance = metrics.emissionsPerUnit <= benchmark.emissionsPerUnit.poor ? 100 : 60;
    const renewableCompliance = metrics.renewableEnergyUsage >= benchmark.renewableEnergy.poor ? 100 : 60;
    return Math.round((carbonCompliance + emissionsCompliance + renewableCompliance) / 3);
}
/**
 * Calculate reporting quality score
 */
function calculateReportingScore(metrics) {
    // Assume good reporting quality if comprehensive metrics are provided
    const completeness = Object.values(metrics).filter(v => v > 0).length / Object.keys(metrics).length;
    return Math.round(completeness * 100);
}
/**
 * Calculate stakeholder engagement score
 */
function calculateStakeholderScore(metrics) {
    // Based on sustainable sourcing as a proxy for stakeholder engagement
    return Math.round(metrics.sustainableSourcing);
}
/**
 * Get performance rating based on score
 */
function getPerformanceRating(score) {
    if (score >= 90)
        return 'Excellent';
    if (score >= 80)
        return 'Good';
    if (score >= 70)
        return 'Above Average';
    if (score >= 60)
        return 'Average';
    if (score >= 50)
        return 'Below Average';
    return 'Poor';
}
/**
 * Calculate percentile ranking
 */
function calculatePercentileRanking(score, benchmark) {
    // Simplified percentile calculation based on score distribution
    const basePercentile = Math.round(score * 0.8); // Base percentile from score
    // Adjust for company size (larger companies typically perform better)
    const sizeAdjustment = benchmark.companySize === 'enterprise' ? 5 :
        benchmark.companySize === 'large' ? 3 :
            benchmark.companySize === 'medium' ? 1 : 0;
    return Math.min(99, Math.max(1, basePercentile + sizeAdjustment));
}
/**
 * Get industry average score
 */
function getIndustryAverage(industryType) {
    const averages = {
        manufacturing: 65,
        logistics: 60,
        retail: 70,
    };
    return averages[industryType.toLowerCase()] || 65;
}
/**
 * Get top performers score
 */
function getTopPerformers(industryType) {
    const topScores = {
        manufacturing: 85,
        logistics: 80,
        retail: 88,
    };
    return topScores[industryType.toLowerCase()] || 85;
}
/**
 * Generate trend analysis
 */
function generateTrendAnalysis(currentScore, timeRange) {
    // Simulate trend data (in real implementation, this would use historical data)
    const trendDirection = Math.random() > 0.5 ? 'improving' : 'declining';
    const trendMagnitude = Math.round(Math.random() * 5) + 1;
    return {
        direction: trendDirection,
        magnitude: trendMagnitude,
        timeRange,
        projectedScore: trendDirection === 'improving' ?
            Math.min(100, currentScore + trendMagnitude) :
            Math.max(0, currentScore - trendMagnitude),
    };
}
/**
 * Generate improvement recommendations
 */
function generateImprovementRecommendations(metrics, benchmark, environmentalScore, efficiencyScore) {
    const recommendations = [];
    // Environmental improvements
    if (environmentalScore < 70) {
        if (metrics.carbonFootprint > benchmark.carbonFootprint.average) {
            recommendations.push({
                category: 'Environmental',
                priority: 'High',
                title: 'Reduce Carbon Footprint',
                description: 'Implement carbon reduction strategies to meet industry benchmarks',
                potentialImpact: 'High',
                implementationCost: 'Medium',
                timeframe: '6-12 months',
                specificActions: [
                    'Switch to renewable energy sources',
                    'Optimize transportation routes',
                    'Implement energy-efficient technologies',
                ],
            });
        }
        if (metrics.renewableEnergyUsage < benchmark.renewableEnergy.good) {
            recommendations.push({
                category: 'Environmental',
                priority: 'Medium',
                title: 'Increase Renewable Energy Usage',
                description: 'Transition to renewable energy sources to improve environmental score',
                potentialImpact: 'Medium',
                implementationCost: 'High',
                timeframe: '12-24 months',
                specificActions: [
                    'Install solar panels or wind turbines',
                    'Purchase renewable energy certificates',
                    'Partner with green energy providers',
                ],
            });
        }
    }
    // Efficiency improvements
    if (efficiencyScore < 70) {
        if (metrics.wasteReduction < benchmark.wasteReduction.good) {
            recommendations.push({
                category: 'Efficiency',
                priority: 'Medium',
                title: 'Improve Waste Management',
                description: 'Implement comprehensive waste reduction and recycling programs',
                potentialImpact: 'Medium',
                implementationCost: 'Low',
                timeframe: '3-6 months',
                specificActions: [
                    'Implement lean manufacturing principles',
                    'Set up comprehensive recycling programs',
                    'Train staff on waste reduction techniques',
                ],
            });
        }
        if (metrics.transportEfficiency < 70) {
            recommendations.push({
                category: 'Efficiency',
                priority: 'High',
                title: 'Optimize Transportation',
                description: 'Improve transport efficiency through route optimization and mode selection',
                potentialImpact: 'High',
                implementationCost: 'Medium',
                timeframe: '3-9 months',
                specificActions: [
                    'Implement route optimization software',
                    'Consolidate shipments',
                    'Switch to more efficient transport modes',
                ],
            });
        }
    }
    return recommendations;
}
// Health check endpoint
const healthCheck = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: 'healthy',
        service: 'generate-sustainability-score',
        timestamp: new Date().toISOString(),
    });
};
exports.healthCheck = healthCheck;
// Default export for Google Cloud Functions
exports.default = exports.generateSustainabilityScore;
//# sourceMappingURL=generate-sustainability-score.js.map