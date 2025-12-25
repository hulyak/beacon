import { NextRequest, NextResponse } from 'next/server';
import { 
  ImpactAssessmentResponse, 
  MitigationStrategy, 
  TimelineProjection,
  NetworkNode,
  PropagationStep
} from '@/lib/types/enhanced-analytics';

interface ComprehensiveImpactRequest {
  scenarioId: string;
  disruptionType: 'supplier_failure' | 'transport_disruption' | 'natural_disaster' | 'geopolitical' | 'cyber_attack';
  affectedRegions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

/**
 * Enhanced Impact Assessment API Route
 * 
 * POST /api/impact-assessment
 * Body: ComprehensiveImpactRequest
 * 
 * Returns: Comprehensive impact analysis with financial, operational, cascade effects, and KPI metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convert legacy format to new comprehensive format if needed
    const comprehensiveRequest: ComprehensiveImpactRequest = {
      scenarioId: body.scenarioId || `scenario_${Date.now()}`,
      disruptionType: mapScenarioType(body.scenarioType || 'supplier_failure'),
      affectedRegions: body.region ? [body.region] : ['asia'],
      severity: mapSeverity(body.severity || 'moderate'),
      duration: body.duration || 14,
      analysisDepth: body.analysisDepth || 'detailed'
    };

    console.log(`Processing comprehensive impact assessment for scenario: ${comprehensiveRequest.scenarioId}`);

    // Perform comprehensive impact analysis
    const comprehensiveResponse = await performComprehensiveImpactAnalysis(comprehensiveRequest);

    // Convert to legacy format for backward compatibility
    const legacyResponse = convertToLegacyFormat(comprehensiveResponse);

    console.log(`Completed impact assessment - Total cost: $${legacyResponse.financialImpact.totalImpact.toLocaleString()}`);

    return NextResponse.json(legacyResponse);

  } catch (error) {
    console.error('Impact assessment API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate impact assessment' },
      { status: 500 }
    );
  }
}

/**
 * Perform comprehensive impact analysis using the enhanced backend service
 */
async function performComprehensiveImpactAnalysis(request: ComprehensiveImpactRequest) {
  const startTime = Date.now();

  // Calculate financial impact
  const financialImpact = calculateFinancialImpact(request);
  
  // Calculate operational impact
  const operationalImpact = calculateOperationalImpact(request);
  
  // Analyze cascade effects
  const cascadeEffects = analyzeCascadeEffects(request);
  
  // Generate KPI metrics
  const kpiMetrics = generateKPIMetrics(request, financialImpact, operationalImpact);
  
  // Generate mitigation strategies
  const mitigationStrategies = generateMitigationStrategies(request, financialImpact, cascadeEffects);
  
  // Calculate overall impact
  const overallImpact = calculateOverallImpact(financialImpact, operationalImpact, cascadeEffects);
  
  // Generate recommendations
  const recommendations = generateRecommendations(overallImpact, mitigationStrategies, request);

  const processingTime = Date.now() - startTime;
  console.log(`Comprehensive impact analysis completed in ${processingTime}ms`);

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
function calculateFinancialImpact(request: ComprehensiveImpactRequest) {
  const severityMultiplier = getSeverityMultiplier(request.severity);
  const durationMultiplier = Math.min(request.duration / 30, 3);
  const regionMultiplier = request.affectedRegions.length;

  const directCosts = {
    lostRevenue: 2500000 * severityMultiplier * durationMultiplier * regionMultiplier,
    expeditingCosts: 450000 * severityMultiplier * regionMultiplier,
    alternativeSupplierCosts: 680000 * severityMultiplier * regionMultiplier,
    laborCosts: 320000 * durationMultiplier * regionMultiplier
  };

  const indirectCosts = {
    opportunityCosts: 1200000 * severityMultiplier * durationMultiplier,
    reputationImpact: 800000 * severityMultiplier,
    customerRetentionImpact: 950000 * severityMultiplier,
    marketShareImpact: 600000 * severityMultiplier
  };

  const totalDirect = Object.values(directCosts).reduce((sum, cost) => sum + cost, 0);
  const totalIndirect = Object.values(indirectCosts).reduce((sum, cost) => sum + cost, 0);
  const totalFinancialImpact = totalDirect + totalIndirect;

  return {
    directCosts,
    indirectCosts,
    totalFinancialImpact,
    costBreakdown: [
      { category: 'Lost Revenue', amount: directCosts.lostRevenue, percentage: (directCosts.lostRevenue / totalFinancialImpact) * 100 },
      { category: 'Expediting Costs', amount: directCosts.expeditingCosts, percentage: (directCosts.expeditingCosts / totalFinancialImpact) * 100 },
      { category: 'Alternative Suppliers', amount: directCosts.alternativeSupplierCosts, percentage: (directCosts.alternativeSupplierCosts / totalFinancialImpact) * 100 },
      { category: 'Labor Costs', amount: directCosts.laborCosts, percentage: (directCosts.laborCosts / totalFinancialImpact) * 100 },
      { category: 'Opportunity Costs', amount: indirectCosts.opportunityCosts, percentage: (indirectCosts.opportunityCosts / totalFinancialImpact) * 100 }
    ]
  };
}

/**
 * Calculate operational impact details
 */
function calculateOperationalImpact(request: ComprehensiveImpactRequest) {
  const severityMultiplier = getSeverityMultiplier(request.severity);
  const baseDelay = request.duration * 0.8;

  const deliveryDelays = {
    averageDelay: baseDelay * severityMultiplier,
    maxDelay: baseDelay * severityMultiplier * 2.5,
    affectedShipments: Math.floor(1500 * severityMultiplier * request.affectedRegions.length),
    delayDistribution: [
      { delayRange: '1-3 days', shipmentCount: Math.floor(600 * severityMultiplier), percentage: 40 },
      { delayRange: '4-7 days', shipmentCount: Math.floor(450 * severityMultiplier), percentage: 30 },
      { delayRange: '8-14 days', shipmentCount: Math.floor(300 * severityMultiplier), percentage: 20 },
      { delayRange: '15+ days', shipmentCount: Math.floor(150 * severityMultiplier), percentage: 10 }
    ]
  };

  const productionImpact = {
    affectedFacilities: Math.floor(8 * severityMultiplier * request.affectedRegions.length),
    productionReduction: 35 * severityMultiplier,
    idleTime: request.duration * 0.6,
    rampUpTime: request.duration * 0.4
  };

  return {
    deliveryDelays,
    productionImpact,
    inventoryImpact: {
      stockoutRisk: 25 * severityMultiplier,
      excessInventory: 1200000 * (1 / severityMultiplier),
      carryingCosts: 180000 * severityMultiplier
    }
  };
}

/**
 * Analyze cascade effects across the supply chain network
 */
function analyzeCascadeEffects(request: ComprehensiveImpactRequest) {
  const severityMultiplier = getSeverityMultiplier(request.severity);
  const networkComplexity = request.affectedRegions.length;

  return {
    networkAnalysis: {
      totalAffectedNodes: Math.floor(45 * severityMultiplier * networkComplexity),
      criticalPathsImpacted: Math.floor(12 * severityMultiplier),
      propagationDepth: Math.floor(4 * severityMultiplier),
      networkResilience: Math.max(20, 85 - (severityMultiplier * 25))
    },
    upstreamEffects: [
      {
        supplierId: 'SUP-001',
        impactLevel: 85 * severityMultiplier,
        dependencyType: 'Critical Component',
        mitigationOptions: ['Alternative sourcing', 'Inventory buffer', 'Supplier diversification']
      }
    ],
    downstreamEffects: [
      {
        customerId: 'CUST-001',
        impactLevel: 75 * severityMultiplier,
        relationshipType: 'Strategic Partner',
        alternativeOptions: ['Partial fulfillment', 'Alternative products']
      }
    ],
    geographicSpread: request.affectedRegions.map((region, index) => ({
      region,
      impactSeverity: (80 - index * 15) * severityMultiplier,
      affectedFacilities: Math.floor((5 - index) * severityMultiplier),
      recoveryComplexity: 60 + (index * 20) + (severityMultiplier * 10)
    }))
  };
}

/**
 * Generate KPI metrics
 */
function generateKPIMetrics(request: ComprehensiveImpactRequest, financialImpact: any, operationalImpact: any) {
  const severityMultiplier = getSeverityMultiplier(request.severity);

  return {
    performanceMetrics: {
      onTimeDelivery: {
        current: 94.5,
        projected: Math.max(60, 94.5 - (severityMultiplier * 25)),
        impact: -(severityMultiplier * 25)
      },
      fillRate: {
        current: 96.8,
        projected: Math.max(70, 96.8 - (severityMultiplier * 20)),
        impact: -(severityMultiplier * 20)
      }
    },
    riskMetrics: {
      supplyRisk: Math.min(95, 35 + (severityMultiplier * 30)),
      operationalRisk: Math.min(85, 30 + (severityMultiplier * 28))
    }
  };
}

/**
 * Generate mitigation strategies
 */
function generateMitigationStrategies(request: ComprehensiveImpactRequest, financialImpact: any, cascadeEffects: any) {
  const strategies = [
    {
      id: 'MIT-001',
      name: 'Supplier Diversification',
      description: 'Establish alternative suppliers across different geographic regions',
      effectiveness: 85,
      implementationTime: 90,
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
    }
  ];

  return strategies.map(strategy => ({
    ...strategy,
    effectiveness: Math.min(95, strategy.effectiveness + (request.severity === 'critical' ? 10 : 0)),
    cost: strategy.cost * (request.severity === 'critical' ? 1.2 : 1.0)
  }));
}

/**
 * Calculate overall impact
 */
function calculateOverallImpact(financialImpact: any, operationalImpact: any, cascadeEffects: any) {
  const totalCost = financialImpact.totalFinancialImpact;
  const affectedOrders = operationalImpact.deliveryDelays.affectedShipments;
  const recoveryTime = Math.max(
    operationalImpact.productionImpact.rampUpTime,
    operationalImpact.deliveryDelays.maxDelay
  );

  let severity = 'low';
  if (totalCost > 5000000 || cascadeEffects.networkAnalysis.totalAffectedNodes > 50) {
    severity = 'critical';
  } else if (totalCost > 2000000 || cascadeEffects.networkAnalysis.totalAffectedNodes > 30) {
    severity = 'high';
  } else if (totalCost > 500000 || cascadeEffects.networkAnalysis.totalAffectedNodes > 15) {
    severity = 'medium';
  }

  return {
    severity,
    confidence: Math.min(95, 75 + (cascadeEffects.networkAnalysis.networkResilience / 10)),
    totalCost,
    affectedOrders,
    recoveryTime
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(overallImpact: any, mitigationStrategies: any[], request: ComprehensiveImpactRequest): string[] {
  const recommendations: string[] = [];

  if (overallImpact.severity === 'critical') {
    recommendations.push(
      'Activate crisis management protocols immediately',
      'Implement emergency supplier diversification'
    );
  }

  const topStrategies = mitigationStrategies
    .sort((a, b) => (b.effectiveness * b.feasibility) - (a.effectiveness * a.feasibility))
    .slice(0, 2);

  topStrategies.forEach(strategy => {
    recommendations.push(`Consider implementing: ${strategy.name} (${strategy.effectiveness}% effective)`);
  });

  return recommendations;
}

/**
 * Convert comprehensive response to legacy format for backward compatibility
 */
function convertToLegacyFormat(comprehensiveResponse: any): ImpactAssessmentResponse {
  const { financialImpact, operationalImpact, cascadeEffects, mitigationStrategies, overallImpact } = comprehensiveResponse;

  // Generate timeline projection
  const timelineProjection: TimelineProjection[] = [];
  const maxDelay = operationalImpact.deliveryDelays.maxDelay;
  const affectedOrders = operationalImpact.deliveryDelays.affectedShipments;

  for (let i = 0; i < Math.min(maxDelay, 60); i += 7) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    timelineProjection.push({
      date: date.toISOString().split('T')[0],
      projectedDelay: Math.max(0, operationalImpact.deliveryDelays.averageDelay - (i * 0.1)),
      affectedOrders: Math.round(affectedOrders * Math.exp(-i * 0.02)),
      cumulativeImpact: Math.round((affectedOrders * (i + 1)) * 100)
    });
  }

  // Convert affected nodes
  const affectedNodes: NetworkNode[] = cascadeEffects.upstreamEffects.map((effect: any, index: number) => ({
    id: effect.supplierId,
    name: `${effect.dependencyType} Supplier`,
    type: 'supplier',
    region: 'asia',
    riskLevel: effect.impactLevel > 70 ? 'high' : 'medium',
    impactScore: effect.impactLevel
  }));

  // Convert propagation path
  const propagationPath: PropagationStep[] = cascadeEffects.upstreamEffects.map((effect: any, index: number) => ({
    fromNode: effect.supplierId,
    toNode: `manufacturer-${index + 1}`,
    impactDelay: 1 + index,
    impactMagnitude: effect.impactLevel,
    propagationType: 'direct'
  }));

  // Convert mitigation strategies
  const recommendations: MitigationStrategy[] = mitigationStrategies.map((strategy: any) => ({
    id: strategy.id,
    name: strategy.name,
    description: strategy.description,
    estimatedCost: strategy.cost,
    timeToImplement: Math.ceil(strategy.implementationTime / 7), // Convert days to weeks
    riskReduction: strategy.riskReduction,
    roi: Math.round((strategy.riskReduction / 100) * 300), // Estimated ROI
    paybackPeriod: Math.ceil(strategy.implementationTime / 30) // Convert days to months
  }));

  return {
    financialImpact: {
      directCosts: financialImpact.directCosts.lostRevenue + financialImpact.directCosts.expeditingCosts,
      opportunityCosts: financialImpact.indirectCosts.opportunityCosts,
      laborCosts: financialImpact.directCosts.laborCosts,
      materialCosts: financialImpact.directCosts.alternativeSupplierCosts,
      logisticsCosts: financialImpact.directCosts.expeditingCosts,
      totalImpact: financialImpact.totalFinancialImpact,
      currency: 'USD'
    },
    operationalImpact: {
      deliveryDelays: {
        averageDelay: operationalImpact.deliveryDelays.averageDelay,
        maxDelay: operationalImpact.deliveryDelays.maxDelay,
        affectedOrders: operationalImpact.deliveryDelays.affectedShipments,
        timelineProjection
      },
      cascadeEffects: {
        affectedNodes,
        propagationPath,
        networkImpactScore: cascadeEffects.networkAnalysis.totalAffectedNodes
      }
    },
    recommendations,
    confidence: overallImpact.confidence,
    analysisTimestamp: comprehensiveResponse.timestamp
  };
}

/**
 * Helper functions
 */
function mapScenarioType(scenarioType: string): 'supplier_failure' | 'transport_disruption' | 'natural_disaster' | 'geopolitical' | 'cyber_attack' {
  const mapping: { [key: string]: any } = {
    'supplier_failure': 'supplier_failure',
    'port_closure': 'transport_disruption',
    'demand_surge': 'geopolitical',
    'natural_disaster': 'natural_disaster',
    'transportation_disruption': 'transport_disruption'
  };
  return mapping[scenarioType] || 'supplier_failure';
}

function mapSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
  const mapping: { [key: string]: any } = {
    'minor': 'low',
    'moderate': 'medium',
    'severe': 'high',
    'catastrophic': 'critical'
  };
  return mapping[severity] || 'medium';
}

function getSeverityMultiplier(severity: string): number {
  switch (severity) {
    case 'low': return 0.5;
    case 'medium': return 1.0;
    case 'high': return 1.8;
    case 'critical': return 2.5;
    default: return 1.0;
  }
}