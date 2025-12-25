import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import { TimelineProjection } from '../../lib/types/enhanced-analytics';

interface DelayTrackingRequest {
  scenarioType: string;
  region: string;
  severity: string;
  timeHorizon?: number; // Days to project
}

interface DelayTrackingResponse {
  deliveryDelays: {
    averageDelay: number;
    maxDelay: number;
    affectedOrders: number;
    timelineProjection: TimelineProjection[];
  };
  impactMetrics: {
    customerSatisfactionImpact: number;
    revenueAtRisk: number;
    recoveryTimeEstimate: number;
  };
  analysisTimestamp: string;
}

/**
 * Track delivery delays and project timeline impact
 * 
 * POST /track-delivery-delays
 * Body: { scenarioType: string, region: string, severity: string, timeHorizon?: number }
 * 
 * Returns: Detailed delivery delay analysis with timeline projections
 */
http('trackDeliveryDelays', async (req: Request, res: Response): Promise<void> => {
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
    const { scenarioType, region, severity, timeHorizon = 60 } = req.body as DelayTrackingRequest;

    // Validate required parameters
    if (!scenarioType || !region || !severity) {
      res.status(400).json({ 
        error: 'Missing required parameters: scenarioType, region, severity' 
      });
      return;
    }

    // Calculate delivery delay metrics
    const deliveryDelays = calculateDeliveryDelays(scenarioType, region, severity);
    
    // Generate timeline projection
    const timelineProjection = generateTimelineProjection(
      deliveryDelays,
      scenarioType,
      severity,
      timeHorizon
    );

    // Calculate impact metrics
    const impactMetrics = calculateImpactMetrics(deliveryDelays, scenarioType, region);

    const response: DelayTrackingResponse = {
      deliveryDelays: {
        ...deliveryDelays,
        timelineProjection
      },
      impactMetrics,
      analysisTimestamp: new Date().toISOString(),
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Delivery delay tracking failed:', error);
    res.status(500).json({ 
      error: 'Failed to track delivery delays',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Calculate base delivery delay metrics
 */
function calculateDeliveryDelays(
  scenarioType: string,
  region: string,
  severity: string
): { averageDelay: number; maxDelay: number; affectedOrders: number } {
  // Base delay patterns by scenario type (in days)
  const baseDelayPatterns = {
    supplier_failure: {
      averageDelay: 14,
      maxDelay: 28,
      orderImpactRate: 0.6 // 60% of orders affected
    },
    port_closure: {
      averageDelay: 21,
      maxDelay: 42,
      orderImpactRate: 0.8 // 80% of orders affected
    },
    demand_surge: {
      averageDelay: 7,
      maxDelay: 14,
      orderImpactRate: 0.4 // 40% of orders affected
    },
    natural_disaster: {
      averageDelay: 35,
      maxDelay: 70,
      orderImpactRate: 0.9 // 90% of orders affected
    },
    transportation_disruption: {
      averageDelay: 10,
      maxDelay: 21,
      orderImpactRate: 0.7 // 70% of orders affected
    }
  };

  // Severity multipliers
  const severityMultipliers = {
    minor: 0.5,
    moderate: 1.0,
    severe: 1.8,
    catastrophic: 3.0
  };

  // Regional order volumes (daily average)
  const regionalOrderVolumes = {
    asia: 4000,
    europe: 2800,
    north_america: 3200,
    south_america: 1800,
    global: 12000
  };

  // Regional complexity multipliers
  const regionalComplexity = {
    asia: 1.3,        // Higher complexity due to manufacturing concentration
    europe: 1.0,      // Baseline complexity
    north_america: 1.1, // Moderate complexity
    south_america: 0.9, // Lower complexity
    global: 1.5       // Highest complexity due to coordination needs
  };

  const basePattern = baseDelayPatterns[scenarioType as keyof typeof baseDelayPatterns] 
    || baseDelayPatterns.supplier_failure;
  
  const severityMultiplier = severityMultipliers[severity as keyof typeof severityMultipliers] || 1.0;
  const complexityMultiplier = regionalComplexity[region as keyof typeof regionalComplexity] || 1.0;
  const baseOrderVolume = regionalOrderVolumes[region as keyof typeof regionalOrderVolumes] || 3000;

  const finalMultiplier = severityMultiplier * complexityMultiplier;

  return {
    averageDelay: Math.round(basePattern.averageDelay * finalMultiplier),
    maxDelay: Math.round(basePattern.maxDelay * finalMultiplier),
    affectedOrders: Math.round(baseOrderVolume * basePattern.orderImpactRate * severityMultiplier)
  };
}

/**
 * Generate timeline projection for delivery delays
 */
function generateTimelineProjection(
  baseDelays: { averageDelay: number; maxDelay: number; affectedOrders: number },
  scenarioType: string,
  severity: string,
  timeHorizon: number
): TimelineProjection[] {
  const projection: TimelineProjection[] = [];
  const { averageDelay, maxDelay, affectedOrders } = baseDelays;

  // Recovery patterns by scenario type
  const recoveryPatterns = {
    supplier_failure: {
      recoveryRate: 0.15,    // 15% improvement per week
      stabilizationPoint: 0.8 // Stabilizes at 80% of original delay
    },
    port_closure: {
      recoveryRate: 0.12,    // 12% improvement per week
      stabilizationPoint: 0.9 // Stabilizes at 90% of original delay
    },
    demand_surge: {
      recoveryRate: 0.25,    // 25% improvement per week (faster recovery)
      stabilizationPoint: 0.3 // Stabilizes at 30% of original delay
    },
    natural_disaster: {
      recoveryRate: 0.08,    // 8% improvement per week (slower recovery)
      stabilizationPoint: 0.6 // Stabilizes at 60% of original delay
    },
    transportation_disruption: {
      recoveryRate: 0.20,    // 20% improvement per week
      stabilizationPoint: 0.4 // Stabilizes at 40% of original delay
    }
  };

  const pattern = recoveryPatterns[scenarioType as keyof typeof recoveryPatterns] 
    || recoveryPatterns.supplier_failure;

  // Generate daily projections
  for (let day = 0; day < timeHorizon; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);

    // Calculate recovery progress
    const weeksPassed = day / 7;
    const recoveryProgress = Math.min(1, weeksPassed * pattern.recoveryRate);
    const recoveryFactor = 1 - (recoveryProgress * (1 - pattern.stabilizationPoint));

    // Calculate projected delay (decreases over time)
    const projectedDelay = Math.max(0, averageDelay * recoveryFactor);

    // Calculate affected orders (decreases as situation improves)
    const orderRecoveryFactor = Math.max(0.1, 1 - (recoveryProgress * 0.8));
    const projectedAffectedOrders = Math.round(affectedOrders * orderRecoveryFactor);

    // Calculate cumulative impact (total order-days of delay)
    const dailyImpact = projectedAffectedOrders * projectedDelay;
    const cumulativeImpact = day === 0 ? dailyImpact : 
      projection[day - 1].cumulativeImpact + dailyImpact;

    projection.push({
      date: date.toISOString().split('T')[0],
      projectedDelay: Math.round(projectedDelay * 10) / 10, // Round to 1 decimal
      affectedOrders: projectedAffectedOrders,
      cumulativeImpact: Math.round(cumulativeImpact)
    });
  }

  return projection;
}

/**
 * Calculate impact metrics for delivery delays
 */
function calculateImpactMetrics(
  deliveryDelays: { averageDelay: number; maxDelay: number; affectedOrders: number },
  scenarioType: string,
  region: string
): {
  customerSatisfactionImpact: number;
  revenueAtRisk: number;
  recoveryTimeEstimate: number;
} {
  const { averageDelay, affectedOrders } = deliveryDelays;

  // Customer satisfaction impact calculation
  // Based on research: 1 day delay = 2-3% satisfaction drop
  const satisfactionImpactPerDay = 2.5;
  const customerSatisfactionImpact = Math.min(100, averageDelay * satisfactionImpactPerDay);

  // Revenue at risk calculation
  // Average order values by region
  const averageOrderValues = {
    asia: 850,
    europe: 1200,
    north_america: 1100,
    south_america: 750,
    global: 950
  };

  // Cancellation rates based on delay length
  const getCancellationRate = (delay: number): number => {
    if (delay <= 7) return 0.05;      // 5% cancellation for delays up to 1 week
    if (delay <= 14) return 0.12;     // 12% cancellation for delays up to 2 weeks
    if (delay <= 21) return 0.25;     // 25% cancellation for delays up to 3 weeks
    if (delay <= 35) return 0.40;     // 40% cancellation for delays up to 5 weeks
    return 0.60;                      // 60% cancellation for longer delays
  };

  const avgOrderValue = averageOrderValues[region as keyof typeof averageOrderValues] || 950;
  const cancellationRate = getCancellationRate(averageDelay);
  const revenueAtRisk = Math.round(affectedOrders * avgOrderValue * cancellationRate);

  // Recovery time estimate based on scenario type and severity
  const baseRecoveryTimes = {
    supplier_failure: 28,              // 4 weeks
    port_closure: 35,                  // 5 weeks
    demand_surge: 14,                  // 2 weeks
    natural_disaster: 56,              // 8 weeks
    transportation_disruption: 21      // 3 weeks
  };

  const baseRecoveryTime = baseRecoveryTimes[scenarioType as keyof typeof baseRecoveryTimes] || 28;
  
  // Adjust recovery time based on delay severity
  const severityAdjustment = Math.max(0.5, Math.min(2.0, averageDelay / 14)); // Normalize around 2 weeks
  const recoveryTimeEstimate = Math.round(baseRecoveryTime * severityAdjustment);

  return {
    customerSatisfactionImpact: Math.round(customerSatisfactionImpact * 10) / 10,
    revenueAtRisk,
    recoveryTimeEstimate
  };
}

/**
 * Health check endpoint
 */
http('trackDeliveryDelaysHealth', (req: Request, res: Response): void => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  res.status(200).json({
    status: 'healthy',
    service: 'track-delivery-delays',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});