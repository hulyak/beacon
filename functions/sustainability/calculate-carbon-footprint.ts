import { Request, Response } from 'express';
import { z } from 'zod';

// Carbon footprint calculation service for VoiceOps AI
// Implements comprehensive CO₂ emissions calculation for all supply chain operations

interface TransportMode {
  mode: 'air' | 'sea' | 'rail' | 'road';
  distance: number;
  weight: number;
  emissionFactor: number; // kg CO₂ per ton-km
}

interface CarbonFootprintRequest {
  routes: TransportMode[];
  timeRange?: '7d' | '30d' | '90d';
  includeWarehouse?: boolean;
  includeManufacturing?: boolean;
}

const CarbonFootprintRequestSchema = z.object({
  routes: z.array(z.object({
    mode: z.enum(['air', 'sea', 'rail', 'road']),
    distance: z.number().min(0),
    weight: z.number().min(0),
    emissionFactor: z.number().min(0).optional(),
  })),
  timeRange: z.enum(['7d', '30d', '90d']).optional(),
  includeWarehouse: z.boolean().optional(),
  includeManufacturing: z.boolean().optional(),
});

// Standard emission factors (kg CO₂ per ton-km)
const EMISSION_FACTORS = {
  air: 0.602,     // Air freight
  sea: 0.0156,    // Sea freight
  rail: 0.0285,   // Rail freight
  road: 0.0977,   // Road freight (truck)
  warehouse: 0.05, // Warehouse operations per ton
  manufacturing: 0.15, // Manufacturing per ton
};

/**
 * Calculate carbon footprint for supply chain operations
 * Requirement 3.1: Calculate total carbon footprint in kg CO₂ equivalent
 * Requirement 3.2: Provide emissions breakdown by transport mode
 */
export const calculateCarbonFootprint = async (req: Request, res: Response): Promise<void> => {
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
    const validationResult = CarbonFootprintRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Invalid request format',
        details: validationResult.error.errors,
      });
      return;
    }

    const { routes, timeRange = '30d', includeWarehouse = true, includeManufacturing = true } = validationResult.data;

    // Calculate transport emissions by mode
    const transportEmissions = {
      air: 0,
      sea: 0,
      rail: 0,
      road: 0,
    };

    let totalWeight = 0;
    let totalTransportEmissions = 0;

    for (const route of routes) {
      const emissionFactor = route.emissionFactor || EMISSION_FACTORS[route.mode];
      const emissions = (route.weight / 1000) * route.distance * emissionFactor; // Convert kg to tons
      
      transportEmissions[route.mode] += emissions;
      totalTransportEmissions += emissions;
      totalWeight += route.weight;
    }

    // Calculate additional emissions
    let warehouseEmissions = 0;
    let manufacturingEmissions = 0;

    if (includeWarehouse && totalWeight > 0) {
      warehouseEmissions = (totalWeight / 1000) * EMISSION_FACTORS.warehouse;
    }

    if (includeManufacturing && totalWeight > 0) {
      manufacturingEmissions = (totalWeight / 1000) * EMISSION_FACTORS.manufacturing;
    }

    // Calculate total carbon footprint
    const totalEmissions = totalTransportEmissions + warehouseEmissions + manufacturingEmissions;
    const emissionsPerUnit = totalWeight > 0 ? totalEmissions / (totalWeight / 1000) : 0;

    // Apply time range multiplier for projections
    const timeMultiplier = timeRange === '7d' ? 0.25 : timeRange === '30d' ? 1 : 3;
    const projectedEmissions = totalEmissions * timeMultiplier;

    // Generate response
    const response = {
      carbonFootprint: {
        total: Math.round(projectedEmissions * 100) / 100,
        unit: 'kg_co2' as const,
        breakdown: {
          air: Math.round(transportEmissions.air * timeMultiplier * 100) / 100,
          sea: Math.round(transportEmissions.sea * timeMultiplier * 100) / 100,
          rail: Math.round(transportEmissions.rail * timeMultiplier * 100) / 100,
          road: Math.round(transportEmissions.road * timeMultiplier * 100) / 100,
        },
        emissionsPerUnit: Math.round(emissionsPerUnit * 100) / 100,
        additionalEmissions: {
          warehouse: Math.round(warehouseEmissions * timeMultiplier * 100) / 100,
          manufacturing: Math.round(manufacturingEmissions * timeMultiplier * 100) / 100,
        },
      },
      calculationDetails: {
        totalWeight: totalWeight,
        timeRange: timeRange,
        emissionFactorsUsed: EMISSION_FACTORS,
        calculationTimestamp: new Date().toISOString(),
      },
      recommendations: generateEmissionReductionRecommendations(transportEmissions, totalEmissions),
    };

    console.log('Carbon footprint calculated successfully:', {
      totalEmissions: response.carbonFootprint.total,
      breakdown: response.carbonFootprint.breakdown,
      timeRange,
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error calculating carbon footprint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Generate emission reduction recommendations based on current emissions
 */
function generateEmissionReductionRecommendations(
  transportEmissions: Record<string, number>,
  totalEmissions: number
): Array<{
  strategy: string;
  potentialReduction: number;
  implementationCost: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short_term' | 'long_term';
}> {
  const recommendations = [];

  // Air freight optimization
  if (transportEmissions.air > totalEmissions * 0.3) {
    recommendations.push({
      strategy: 'Shift from air to sea freight for non-urgent shipments',
      potentialReduction: Math.round(transportEmissions.air * 0.6 * 100) / 100,
      implementationCost: 'low' as const,
      timeframe: 'immediate' as const,
    });
  }

  // Road transport optimization
  if (transportEmissions.road > totalEmissions * 0.4) {
    recommendations.push({
      strategy: 'Consolidate shipments and optimize routing',
      potentialReduction: Math.round(transportEmissions.road * 0.25 * 100) / 100,
      implementationCost: 'medium' as const,
      timeframe: 'short_term' as const,
    });
  }

  // Multi-modal optimization
  if (transportEmissions.road + transportEmissions.air > totalEmissions * 0.5) {
    recommendations.push({
      strategy: 'Implement multi-modal transport with rail connections',
      potentialReduction: Math.round((transportEmissions.road + transportEmissions.air) * 0.35 * 100) / 100,
      implementationCost: 'high' as const,
      timeframe: 'long_term' as const,
    });
  }

  return recommendations;
}

// Health check endpoint
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    service: 'calculate-carbon-footprint',
    timestamp: new Date().toISOString(),
  });
};

// Default export for Google Cloud Functions
export default calculateCarbonFootprint;