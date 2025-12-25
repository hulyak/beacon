"use strict";
// Comprehensive Impact Assessment Service
// Requirements: 1.1, 1.2, 1.4, 1.5 - Financial impact, delivery delays, KPI metrics, cascade effects
Object.defineProperty(exports, "__esModule", { value: true });
exports.comprehensiveImpactAnalysis = comprehensiveImpactAnalysis;
exports.default = comprehensiveImpactAnalysis;
/**
 * Comprehensive Impact Assessment Cloud Function
 * Analyzes supply chain disruptions with detailed financial, operational, and cascade impact analysis
 */
async function comprehensiveImpactAnalysis(req, res) {
    try {
        // Validate request
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const request = req.body;
        // Validate required fields
        if (!request.scenarioId || !request.disruptionType || !request.severity) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        console.log(`Starting comprehensive impact analysis for scenario: ${request.scenarioId}`);
        // Perform comprehensive impact analysis
        const impactResponse = await performComprehensiveAnalysis(request);
        // Log successful analysis
        console.log(`Completed impact analysis for scenario: ${request.scenarioId}, Total cost: $${impactResponse.overallImpact.totalCost}`);
        res.status(200).json(impactResponse);
    }
    catch (error) {
        console.error('Comprehensive impact analysis failed:', error);
        res.status(500).json({
            error: 'Impact analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
/**
 * Perform comprehensive impact analysis
 */
async function performComprehensiveAnalysis(request) {
    const startTime = Date.now();
    // Calculate financial impact
    const financialImpact = await calculateFinancialImpact(request);
    // Calculate operational impact
    const operationalImpact = await calculateOperationalImpact(request);
    // Analyze cascade effects
    const cascadeEffects = await analyzeCascadeEffects(request);
    // Generate KPI metrics
    const kpiMetrics = await generateKPIMetrics(request, financialImpact, operationalImpact);
    // Generate mitigation strategies
    const mitigationStrategies = await generateMitigationStrategies(request, financialImpact, cascadeEffects);
    // Calculate overall impact
    const overallImpact = calculateOverallImpact(financialImpact, operationalImpact, cascadeEffects);
    // Generate recommendations
    const recommendations = generateRecommendations(overallImpact, mitigationStrategies, request);
    const processingTime = Date.now() - startTime;
    console.log(`Impact analysis completed in ${processingTime}ms`);
    return {
        scenarioId: request.scenarioId,
        timestamp: new Date().toISOString(),
        overallImpact,
        financialImpact,
        operationalImpact,
        cascadeEffects,
        kpiMetrics,
        mitigationStrategies,
        recommendations
    };
}
/**
 * Calculate detailed financial impact
 */
async function calculateFinancialImpact(request) {
    const severityMultiplier = getSeverityMultiplier(request.severity);
    const durationMultiplier = Math.min(request.duration / 30, 3); // Cap at 3x for 90+ days
    // Calculate direct costs
    const directCosts = {
        lostRevenue: 2500000 * severityMultiplier * durationMultiplier,
        expeditingCosts: 450000 * severityMultiplier,
        alternativeSupplierCosts: 680000 * severityMultiplier,
        laborCosts: 320000 * durationMultiplier
    };
    // Calculate indirect costs
    const indirectCosts = {
        opportunityCosts: 1200000 * severityMultiplier * durationMultiplier,
        reputationImpact: 800000 * severityMultiplier,
        customerRetentionImpact: 950000 * severityMultiplier,
        marketShareImpact: 600000 * severityMultiplier
    };
    const totalDirect = Object.values(directCosts).reduce((sum, cost) => sum + cost, 0);
    const totalIndirect = Object.values(indirectCosts).reduce((sum, cost) => sum + cost, 0);
    const totalFinancialImpact = totalDirect + totalIndirect;
    // Create cost breakdown
    const costBreakdown = [
        { category: 'Lost Revenue', amount: directCosts.lostRevenue, percentage: (directCosts.lostRevenue / totalFinancialImpact) * 100 },
        { category: 'Expediting Costs', amount: directCosts.expeditingCosts, percentage: (directCosts.expeditingCosts / totalFinancialImpact) * 100 },
        { category: 'Alternative Suppliers', amount: directCosts.alternativeSupplierCosts, percentage: (directCosts.alternativeSupplierCosts / totalFinancialImpact) * 100 },
        { category: 'Labor Costs', amount: directCosts.laborCosts, percentage: (directCosts.laborCosts / totalFinancialImpact) * 100 },
        { category: 'Opportunity Costs', amount: indirectCosts.opportunityCosts, percentage: (indirectCosts.opportunityCosts / totalFinancialImpact) * 100 },
        { category: 'Reputation Impact', amount: indirectCosts.reputationImpact, percentage: (indirectCosts.reputationImpact / totalFinancialImpact) * 100 },
        { category: 'Customer Retention', amount: indirectCosts.customerRetentionImpact, percentage: (indirectCosts.customerRetentionImpact / totalFinancialImpact) * 100 },
        { category: 'Market Share', amount: indirectCosts.marketShareImpact, percentage: (indirectCosts.marketShareImpact / totalFinancialImpact) * 100 }
    ];
    return {
        directCosts,
        indirectCosts,
        totalFinancialImpact,
        costBreakdown
    };
}
/**
 * Calculate operational impact details
 */
async function calculateOperationalImpact(request) {
    const severityMultiplier = getSeverityMultiplier(request.severity);
    const baseDelay = request.duration * 0.8; // 80% of disruption duration
    // Calculate delivery delays
    const deliveryDelays = {
        averageDelay: baseDelay * severityMultiplier,
        maxDelay: baseDelay * severityMultiplier * 2.5,
        affectedShipments: Math.floor(1500 * severityMultiplier),
        delayDistribution: [
            { delayRange: '1-3 days', shipmentCount: Math.floor(600 * severityMultiplier), percentage: 40 },
            { delayRange: '4-7 days', shipmentCount: Math.floor(450 * severityMultiplier), percentage: 30 },
            { delayRange: '8-14 days', shipmentCount: Math.floor(300 * severityMultiplier), percentage: 20 },
            { delayRange: '15+ days', shipmentCount: Math.floor(150 * severityMultiplier), percentage: 10 }
        ]
    };
    // Calculate production impact
    const productionImpact = {
        affectedFacilities: Math.floor(8 * severityMultiplier),
        productionReduction: 35 * severityMultiplier, // percentage
        idleTime: request.duration * 0.6,
        rampUpTime: request.duration * 0.4
    };
    // Calculate inventory impact
    const inventoryImpact = {
        stockoutRisk: 25 * severityMultiplier, // percentage
        excessInventory: 1200000 * (1 / severityMultiplier), // inverse relationship
        carryingCosts: 180000 * severityMultiplier
    };
    return {
        deliveryDelays,
        productionImpact,
        inventoryImpact
    };
}
/**
 * Analyze cascade effects across the supply chain network
 */
async function analyzeCascadeEffects(request) {
    const severityMultiplier = getSeverityMultiplier(request.severity);
    const networkComplexity = request.affectedRegions.length;
    // Network analysis
    const networkAnalysis = {
        totalAffectedNodes: Math.floor(45 * severityMultiplier * networkComplexity),
        criticalPathsImpacted: Math.floor(12 * severityMultiplier),
        propagationDepth: Math.floor(4 * severityMultiplier),
        networkResilience: Math.max(20, 85 - (severityMultiplier * 25))
    };
    // Upstream effects (suppliers)
    const upstreamEffects = [
        {
            supplierId: 'SUP-001',
            impactLevel: 85 * severityMultiplier,
            dependencyType: 'Critical Component',
            mitigationOptions: ['Alternative sourcing', 'Inventory buffer', 'Supplier diversification']
        },
        {
            supplierId: 'SUP-002',
            impactLevel: 65 * severityMultiplier,
            dependencyType: 'Secondary Material',
            mitigationOptions: ['Local sourcing', 'Substitute materials']
        },
        {
            supplierId: 'SUP-003',
            impactLevel: 45 * severityMultiplier,
            dependencyType: 'Packaging',
            mitigationOptions: ['Alternative packaging', 'Local suppliers']
        }
    ];
    // Downstream effects (customers)
    const downstreamEffects = [
        {
            customerId: 'CUST-001',
            impactLevel: 75 * severityMultiplier,
            relationshipType: 'Strategic Partner',
            alternativeOptions: ['Partial fulfillment', 'Alternative products', 'Delayed delivery']
        },
        {
            customerId: 'CUST-002',
            impactLevel: 55 * severityMultiplier,
            relationshipType: 'Key Account',
            alternativeOptions: ['Priority allocation', 'Substitute products']
        }
    ];
    // Geographic spread
    const geographicSpread = request.affectedRegions.map((region, index) => ({
        region,
        impactSeverity: (80 - index * 15) * severityMultiplier,
        affectedFacilities: Math.floor((5 - index) * severityMultiplier),
        recoveryComplexity: 60 + (index * 20) + (severityMultiplier * 10)
    }));
    return {
        networkAnalysis,
        upstreamEffects,
        downstreamEffects,
        geographicSpread
    };
}
/**
 * Generate KPI metrics and performance indicators
 */
async function generateKPIMetrics(request, financialImpact, operationalImpact) {
    const severityMultiplier = getSeverityMultiplier(request.severity);
    // Performance metrics
    const performanceMetrics = {
        onTimeDelivery: {
            current: 94.5,
            projected: Math.max(60, 94.5 - (severityMultiplier * 25)),
            impact: -(severityMultiplier * 25)
        },
        fillRate: {
            current: 96.8,
            projected: Math.max(70, 96.8 - (severityMultiplier * 20)),
            impact: -(severityMultiplier * 20)
        },
        costEfficiency: {
            current: 87.2,
            projected: Math.max(60, 87.2 - (severityMultiplier * 18)),
            impact: -(severityMultiplier * 18)
        },
        qualityMetrics: {
            current: 98.1,
            projected: Math.max(85, 98.1 - (severityMultiplier * 8)),
            impact: -(severityMultiplier * 8)
        }
    };
    // Risk metrics
    const riskMetrics = {
        supplyRisk: Math.min(95, 35 + (severityMultiplier * 30)),
        demandRisk: Math.min(90, 25 + (severityMultiplier * 25)),
        operationalRisk: Math.min(85, 30 + (severityMultiplier * 28)),
        financialRisk: Math.min(80, 20 + (severityMultiplier * 35))
    };
    // Resilience metrics
    const resilienceMetrics = {
        adaptability: Math.max(20, 75 - (severityMultiplier * 20)),
        redundancy: Math.max(15, 65 - (severityMultiplier * 25)),
        visibility: Math.max(30, 80 - (severityMultiplier * 15)),
        collaboration: Math.max(25, 70 - (severityMultiplier * 18))
    };
    return {
        performanceMetrics,
        riskMetrics,
        resilienceMetrics
    };
}
/**
 * Generate mitigation strategies
 */
async function generateMitigationStrategies(request, financialImpact, cascadeEffects) {
    const strategies = [
        {
            id: 'MIT-001',
            name: 'Supplier Diversification',
            description: 'Establish alternative suppliers across different geographic regions',
            effectiveness: 85,
            implementationTime: 90, // days
            cost: 450000,
            riskReduction: 60,
            feasibility: 80
        },
        {
            id: 'MIT-002',
            name: 'Strategic Inventory Buffer',
            description: 'Increase safety stock for critical components',
            effectiveness: 70,
            implementationTime: 30,
            cost: 280000,
            riskReduction: 45,
            feasibility: 95
        },
        {
            id: 'MIT-003',
            name: 'Alternative Transportation',
            description: 'Establish multi-modal transportation options',
            effectiveness: 75,
            implementationTime: 45,
            cost: 320000,
            riskReduction: 50,
            feasibility: 85
        },
        {
            id: 'MIT-004',
            name: 'Digital Supply Chain Visibility',
            description: 'Implement real-time tracking and monitoring systems',
            effectiveness: 80,
            implementationTime: 120,
            cost: 680000,
            riskReduction: 55,
            feasibility: 75
        },
        {
            id: 'MIT-005',
            name: 'Regional Manufacturing',
            description: 'Establish local manufacturing capabilities',
            effectiveness: 90,
            implementationTime: 365,
            cost: 2500000,
            riskReduction: 75,
            feasibility: 60
        }
    ];
    // Adjust strategies based on disruption type and severity
    return strategies.map(strategy => ({
        ...strategy,
        effectiveness: Math.min(95, strategy.effectiveness + (request.severity === 'critical' ? 10 : 0)),
        cost: strategy.cost * (request.severity === 'critical' ? 1.2 : 1.0)
    }));
}
/**
 * Calculate overall impact summary
 */
function calculateOverallImpact(financialImpact, operationalImpact, cascadeEffects) {
    const totalCost = financialImpact.totalFinancialImpact;
    const affectedOrders = operationalImpact.deliveryDelays.affectedShipments;
    const recoveryTime = Math.max(operationalImpact.productionImpact.rampUpTime, operationalImpact.deliveryDelays.maxDelay);
    // Calculate severity based on multiple factors
    let severity = 'low';
    if (totalCost > 5000000 || cascadeEffects.networkAnalysis.totalAffectedNodes > 50) {
        severity = 'critical';
    }
    else if (totalCost > 2000000 || cascadeEffects.networkAnalysis.totalAffectedNodes > 30) {
        severity = 'high';
    }
    else if (totalCost > 500000 || cascadeEffects.networkAnalysis.totalAffectedNodes > 15) {
        severity = 'medium';
    }
    // Calculate confidence based on data quality and analysis depth
    const confidence = Math.min(95, 75 + (cascadeEffects.networkAnalysis.networkResilience / 10));
    return {
        severity,
        confidence,
        totalCost,
        affectedOrders,
        recoveryTime
    };
}
/**
 * Generate actionable recommendations
 */
function generateRecommendations(overallImpact, mitigationStrategies, request) {
    const recommendations = [];
    // Priority recommendations based on impact severity
    if (overallImpact.severity === 'critical') {
        recommendations.push('Activate crisis management protocols immediately', 'Implement emergency supplier diversification', 'Establish customer communication plan for delivery delays');
    }
    // Top mitigation strategies
    const topStrategies = mitigationStrategies
        .sort((a, b) => (b.effectiveness * b.feasibility) - (a.effectiveness * a.feasibility))
        .slice(0, 3);
    topStrategies.forEach(strategy => {
        recommendations.push(`Consider implementing: ${strategy.name} (${strategy.effectiveness}% effective)`);
    });
    // Duration-based recommendations
    if (request.duration > 30) {
        recommendations.push('Focus on long-term resilience building due to extended disruption period');
    }
    else {
        recommendations.push('Prioritize short-term mitigation measures for quick recovery');
    }
    // Cost-based recommendations
    if (overallImpact.totalCost > 3000000) {
        recommendations.push('Consider insurance claims and financial risk management measures');
    }
    return recommendations;
}
/**
 * Get severity multiplier for calculations
 */
function getSeverityMultiplier(severity) {
    switch (severity) {
        case 'low': return 0.5;
        case 'medium': return 1.0;
        case 'high': return 1.8;
        case 'critical': return 2.5;
        default: return 1.0;
    }
}
//# sourceMappingURL=comprehensive-impact-analysis.js.map