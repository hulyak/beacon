import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import { 
  ImpactAssessmentRequestSchema, 
  ImpactAssessmentResponseSchema 
} from '../../lib/validation/analytics-schemas';
import { 
  ImpactAssessmentResponse, 
  MitigationStrategy, 
  TimelineProjection 
} from '../../lib/types/enhanced-analytics';

/**
 * Calculate comprehensive financial impact for supply chain disruptions
 * 
 * POST /calculate-financial-impact
 * Body: { scenarioType: string, region?: string, severity?: string, parameters?: object }
 * 
 * Returns: ImpactAssessmentResponse with detailed financial and operational impact
 */
http('calculateFinancialImpact', async (req: Request, res: Response): Promise<void> => {
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
    // Validate request
    const validation = ImpactAssessmentRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Invalid request parameters', 
        details: validation.error.issues 
      });
      return;
    }

    const { scenarioType, region, severity } = validation.data;

    // Calculate financial impact based on scenario parameters
    const financialImpact = calculateFinancialImpactByScenario(
      scenarioType || 'supplier_failure',
      region || 'asia',
      severity || 'moderate'
    );

    // Calculate operational impact
    const operationalImpact = calculateOperationalImpact(
      scenarioType || 'supplier_failure',
      severity || 'moderate'
    );

    // Generate mitigation strategies
    const recommendations = generateMitigationStrategies(
      scenarioType || 'supplier_failure',
      financialImpact.totalImpact
    );

    // Calculate confidence based on data quality and scenario complexity
    const confidence = calculateConfidenceScore(
      scenarioType || 'supplier_failure',
      region || 'asia'
    );

    const response: ImpactAssessmentResponse = {
      financialImpact,
      operationalImpact,
      recommendations,
      confidence,
      analysisTimestamp: new Date().toISOString(),
    };

    // Validate response
    const responseValidation = ImpactAssessmentResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      res.status(500).json({ error: 'Internal calculation error' });
      return;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Financial impact calculation failed:', error);
    res.status(500).json({ 
      error: 'Failed to calculate financial impact',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Calculate financial impact based on scenario type, region, and severity
 */
function calculateFinancialImpactByScenario(
  scenarioType: string,
  region: string,
  severity: string
): ImpactAssessmentResponse['financialImpact'] {
  // Base impact multipliers by scenario type
  const baseImpacts = {
    supplier_failure: { direct: 2500000, opportunity: 1800000, labor: 500000, material: 1200000, logistics: 300000 },
    port_closure: { direct: 1500000, opportunity: 2200000, labor: 300000, material: 800000, logistics: 900000 },
    demand_surge: { direct: 1000000, opportunity: 1500000, labor: 800000, material: 600000, logistics: 400000 },
    natural_disaster: { direct: 5000000, opportunity: 3500000, labor: 1200000, material: 2000000, logistics: 800000 },
    transportation_disruption: { direct: 800000, opportunity: 1200000, labor: 200000, material: 400000, logistics: 1100000 }
  };

  // Severity multipliers
  const severityMultipliers = {
    minor: 0.5,
    moderate: 1.0,
    severe: 1.8,
    catastrophic: 3.0
  };

  // Regional multipliers (based on economic factors)
  const regionMultipliers = {
    asia: 1.2,
    europe: 1.0,
    north_america: 1.1,
    south_america: 0.8,
    global: 1.5
  };

  const baseImpact = baseImpacts[scenarioType as keyof typeof baseImpacts] || baseImpacts.supplier_failure;
  const severityMultiplier = severityMultipliers[severity as keyof typeof severityMultipliers] || 1.0;
  const regionMultiplier = regionMultipliers[region as keyof typeof regionMultipliers] || 1.0;

  const multiplier = severityMultiplier * regionMultiplier;

  const directCosts = Math.round(baseImpact.direct * multiplier);
  const opportunityCosts = Math.round(baseImpact.opportunity * multiplier);
  const laborCosts = Math.round(baseImpact.labor * multiplier);
  const materialCosts = Math.round(baseImpact.material * multiplier);
  const logisticsCosts = Math.round(baseImpact.logistics * multiplier);

  return {
    directCosts,
    opportunityCosts,
    laborCosts,
    materialCosts,
    logisticsCosts,
    totalImpact: directCosts + opportunityCosts + laborCosts + materialCosts + logisticsCosts,
    currency: 'USD'
  };
}

/**
 * Calculate operational impact including delivery delays and cascade effects
 */
function calculateOperationalImpact(
  scenarioType: string,
  severity: string
): ImpactAssessmentResponse['operationalImpact'] {
  const severityMultipliers = {
    minor: 0.5,
    moderate: 1.0,
    severe: 1.8,
    catastrophic: 3.0
  };

  const multiplier = severityMultipliers[severity as keyof typeof severityMultipliers] || 1.0;

  // Calculate delivery delays
  const baseDelays = {
    supplier_failure: { avg: 14, max: 28, orders: 2400 },
    port_closure: { avg: 21, max: 42, orders: 3200 },
    demand_surge: { avg: 7, max: 14, orders: 1800 },
    natural_disaster: { avg: 35, max: 70, orders: 4000 },
    transportation_disruption: { avg: 10, max: 21, orders: 2000 }
  };

  const baseDelay = baseDelays[scenarioType as keyof typeof baseDelays] || baseDelays.supplier_failure;

  const averageDelay = Math.round(baseDelay.avg * multiplier);
  const maxDelay = Math.round(baseDelay.max * multiplier);
  const affectedOrders = Math.round(baseDelay.orders * multiplier);

  // Generate timeline projection
  const timelineProjection: TimelineProjection[] = [];
  for (let i = 0; i < Math.min(maxDelay, 60); i += 7) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    timelineProjection.push({
      date: date.toISOString().split('T')[0],
      projectedDelay: Math.max(0, averageDelay - (i * 0.1)),
      affectedOrders: Math.round(affectedOrders * Math.exp(-i * 0.02)),
      cumulativeImpact: Math.round((affectedOrders * (i + 1)) * 100)
    });
  }

  return {
    deliveryDelays: {
      averageDelay,
      maxDelay,
      affectedOrders,
      timelineProjection
    },
    cascadeEffects: {
      affectedNodes: [], // Will be populated by cascade analysis service
      propagationPath: [], // Will be populated by cascade analysis service
      networkImpactScore: Math.round(multiplier * 75) // Base network impact score
    }
  };
}

/**
 * Generate mitigation strategies based on scenario and impact level
 */
function generateMitigationStrategies(
  scenarioType: string,
  totalImpact: number
): MitigationStrategy[] {
  const strategies: Record<string, MitigationStrategy[]> = {
    supplier_failure: [
      {
        id: 'activate-backup-suppliers',
        name: 'Activate Backup Suppliers',
        description: 'Immediately engage secondary and tertiary suppliers to maintain production flow',
        estimatedCost: Math.round(totalImpact * 0.15),
        timeToImplement: 3,
        riskReduction: 65,
        roi: 280,
        paybackPeriod: 2
      },
      {
        id: 'expedited-shipping',
        name: 'Expedited Air Freight',
        description: 'Use air freight for critical components to reduce delivery delays',
        estimatedCost: Math.round(totalImpact * 0.08),
        timeToImplement: 1,
        riskReduction: 40,
        roi: 150,
        paybackPeriod: 1
      }
    ],
    port_closure: [
      {
        id: 'alternative-ports',
        name: 'Alternative Port Routing',
        description: 'Reroute shipments through alternative ports with available capacity',
        estimatedCost: Math.round(totalImpact * 0.12),
        timeToImplement: 5,
        riskReduction: 70,
        roi: 320,
        paybackPeriod: 3
      }
    ]
  };

  return strategies[scenarioType] || strategies.supplier_failure;
}

/**
 * Calculate confidence score based on data availability and scenario complexity
 */
function calculateConfidenceScore(scenarioType: string, region: string): number {
  // Base confidence by scenario type (some scenarios are more predictable)
  const scenarioConfidence = {
    supplier_failure: 85,
    port_closure: 78,
    demand_surge: 72,
    natural_disaster: 65,
    transportation_disruption: 80
  };

  // Regional data quality adjustments
  const regionAdjustments = {
    asia: -5, // More complex supply chains
    europe: 0,
    north_america: 2,
    south_america: -8,
    global: -10 // Highest complexity
  };

  const baseConfidence = scenarioConfidence[scenarioType as keyof typeof scenarioConfidence] || 75;
  const regionAdjustment = regionAdjustments[region as keyof typeof regionAdjustments] || 0;

  return Math.max(50, Math.min(95, baseConfidence + regionAdjustment));
}