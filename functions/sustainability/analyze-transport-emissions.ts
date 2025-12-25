import { Request, Response } from 'express';
import { z } from 'zod';

// Transport emissions analysis service for VoiceOps AI
// Implements mode-specific emissions analysis for air, sea, rail, and road transport

interface RouteSegment {
  id: string;
  origin: string;
  destination: string;
  mode: 'air' | 'sea' | 'rail' | 'road';
  distance: number;
  weight: number;
  duration: number; // hours
  cost: number;
}

interface TransportEmissionsRequest {
  routes: RouteSegment[];
  analysisType: 'comparison' | 'optimization' | 'breakdown';
  includeAlternatives?: boolean;
}

const TransportEmissionsRequestSchema = z.object({
  routes: z.array(z.object({
    id: z.string(),
    origin: z.string(),
    destination: z.string(),
    mode: z.enum(['air', 'sea', 'rail', 'road']),
    distance: z.number().min(0),
    weight: z.number().min(0),
    duration: z.number().min(0),
    cost: z.number().min(0),
  })),
  analysisType: z.enum(['comparison', 'optimization', 'breakdown']),
  includeAlternatives: z.boolean().optional(),
});

// Enhanced emission factors with additional metrics
const TRANSPORT_METRICS = {
  air: {
    emissionFactor: 0.602, // kg CO₂ per ton-km
    costPerTonKm: 2.50,
    speedKmh: 800,
    reliability: 0.95,
    capacity: 'low',
    weatherDependency: 'medium',
  },
  sea: {
    emissionFactor: 0.0156,
    costPerTonKm: 0.05,
    speedKmh: 25,
    reliability: 0.85,
    capacity: 'very_high',
    weatherDependency: 'high',
  },
  rail: {
    emissionFactor: 0.0285,
    costPerTonKm: 0.08,
    speedKmh: 80,
    reliability: 0.90,
    capacity: 'high',
    weatherDependency: 'low',
  },
  road: {
    emissionFactor: 0.0977,
    costPerTonKm: 0.15,
    speedKmh: 65,
    reliability: 0.88,
    capacity: 'medium',
    weatherDependency: 'medium',
  },
};

/**
 * Analyze transport emissions across different modes
 * Requirement 3.2: Provide emissions breakdown by transport mode and route
 */
export const analyzeTransportEmissions = async (req: Request, res: Response): Promise<void> => {
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
    const validationResult = TransportEmissionsRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Invalid request format',
        details: validationResult.error.errors,
      });
      return;
    }

    const { routes, analysisType, includeAlternatives = false } = validationResult.data;

    // Calculate emissions for each route
    const routeAnalysis = routes.map(route => {
      const metrics = TRANSPORT_METRICS[route.mode];
      const emissions = (route.weight / 1000) * route.distance * metrics.emissionFactor;
      const estimatedCost = (route.weight / 1000) * route.distance * metrics.costPerTonKm;
      const estimatedDuration = route.distance / metrics.speedKmh;

      return {
        routeId: route.id,
        origin: route.origin,
        destination: route.destination,
        mode: route.mode,
        emissions: Math.round(emissions * 100) / 100,
        emissionsPerTonKm: metrics.emissionFactor,
        actualCost: route.cost,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        actualDuration: route.duration,
        estimatedDuration: Math.round(estimatedDuration * 100) / 100,
        efficiency: {
          costEfficiency: route.cost > 0 ? Math.round((estimatedCost / route.cost) * 100) : 100,
          timeEfficiency: route.duration > 0 ? Math.round((estimatedDuration / route.duration) * 100) : 100,
          emissionEfficiency: calculateEmissionEfficiency(route.mode, emissions, route.distance),
        },
        sustainability: {
          carbonIntensity: Math.round((emissions / (route.weight / 1000)) * 100) / 100,
          ecoFriendliness: calculateEcoFriendliness(route.mode),
          alternativeReduction: calculateAlternativeReduction(route.mode),
        },
      };
    });

    // Generate mode comparison
    const modeComparison = generateModeComparison(routeAnalysis);

    // Generate optimization recommendations
    const optimizationRecommendations = generateOptimizationRecommendations(routeAnalysis);

    // Generate alternatives if requested
    const alternatives = includeAlternatives ? generateAlternativeRoutes(routes) : [];

    // Create response based on analysis type
    let response;
    switch (analysisType) {
      case 'comparison':
        response = {
          analysisType: 'comparison',
          routeAnalysis,
          modeComparison,
          summary: generateComparisonSummary(routeAnalysis),
        };
        break;
      case 'optimization':
        response = {
          analysisType: 'optimization',
          routeAnalysis,
          optimizationRecommendations,
          potentialSavings: calculatePotentialSavings(routeAnalysis, optimizationRecommendations),
        };
        break;
      case 'breakdown':
        response = {
          analysisType: 'breakdown',
          routeAnalysis,
          emissionsBreakdown: generateEmissionsBreakdown(routeAnalysis),
          performanceMetrics: generatePerformanceMetrics(routeAnalysis),
        };
        break;
    }

    if (includeAlternatives) {
      response.alternatives = alternatives;
    }

    response.analysisTimestamp = new Date().toISOString();

    console.log('Transport emissions analysis completed:', {
      analysisType,
      routeCount: routes.length,
      totalEmissions: routeAnalysis.reduce((sum, route) => sum + route.emissions, 0),
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error analyzing transport emissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Calculate emission efficiency score (0-100)
 */
function calculateEmissionEfficiency(mode: string, emissions: number, distance: number): number {
  const baselineEmission = distance * TRANSPORT_METRICS.sea.emissionFactor; // Sea as baseline (most efficient)
  const efficiency = Math.max(0, 100 - ((emissions - baselineEmission) / baselineEmission) * 100);
  return Math.round(Math.max(0, Math.min(100, efficiency)));
}

/**
 * Calculate eco-friendliness score (0-100)
 */
function calculateEcoFriendliness(mode: 'air' | 'sea' | 'rail' | 'road'): number {
  const scores = { sea: 95, rail: 85, road: 60, air: 25 };
  return scores[mode];
}

/**
 * Calculate potential emission reduction with alternative modes
 */
function calculateAlternativeReduction(mode: 'air' | 'sea' | 'rail' | 'road'): number {
  const reductionPotential = { air: 85, road: 45, rail: 15, sea: 5 };
  return reductionPotential[mode];
}

/**
 * Generate mode comparison analysis
 */
function generateModeComparison(routeAnalysis: any[]) {
  const modeStats = routeAnalysis.reduce((stats, route) => {
    if (!stats[route.mode]) {
      stats[route.mode] = {
        count: 0,
        totalEmissions: 0,
        totalCost: 0,
        totalDistance: 0,
        avgEfficiency: 0,
      };
    }
    
    stats[route.mode].count++;
    stats[route.mode].totalEmissions += route.emissions;
    stats[route.mode].totalCost += route.actualCost;
    stats[route.mode].avgEfficiency += route.efficiency.emissionEfficiency;
    
    return stats;
  }, {} as any);

  // Calculate averages
  Object.keys(modeStats).forEach(mode => {
    modeStats[mode].avgEmissionsPerRoute = Math.round((modeStats[mode].totalEmissions / modeStats[mode].count) * 100) / 100;
    modeStats[mode].avgCostPerRoute = Math.round((modeStats[mode].totalCost / modeStats[mode].count) * 100) / 100;
    modeStats[mode].avgEfficiency = Math.round((modeStats[mode].avgEfficiency / modeStats[mode].count) * 100) / 100;
  });

  return modeStats;
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(routeAnalysis: any[]) {
  const recommendations = [];

  // Find high-emission routes
  const highEmissionRoutes = routeAnalysis.filter(route => route.emissions > 100);
  if (highEmissionRoutes.length > 0) {
    recommendations.push({
      type: 'mode_switch',
      priority: 'high',
      description: 'Switch high-emission air freight routes to sea or rail',
      affectedRoutes: highEmissionRoutes.map(r => r.routeId),
      potentialReduction: highEmissionRoutes.reduce((sum, r) => sum + r.emissions * 0.7, 0),
      implementationCost: 'medium',
    });
  }

  // Find inefficient routes
  const inefficientRoutes = routeAnalysis.filter(route => route.efficiency.emissionEfficiency < 50);
  if (inefficientRoutes.length > 0) {
    recommendations.push({
      type: 'route_optimization',
      priority: 'medium',
      description: 'Optimize routing and consolidate shipments',
      affectedRoutes: inefficientRoutes.map(r => r.routeId),
      potentialReduction: inefficientRoutes.reduce((sum, r) => sum + r.emissions * 0.25, 0),
      implementationCost: 'low',
    });
  }

  return recommendations;
}

/**
 * Generate alternative routes for each transport mode
 */
function generateAlternativeRoutes(routes: RouteSegment[]) {
  return routes.map(route => {
    const alternatives = Object.keys(TRANSPORT_METRICS)
      .filter(mode => mode !== route.mode)
      .map(mode => {
        const metrics = TRANSPORT_METRICS[mode as keyof typeof TRANSPORT_METRICS];
        const emissions = (route.weight / 1000) * route.distance * metrics.emissionFactor;
        const cost = (route.weight / 1000) * route.distance * metrics.costPerTonKm;
        const duration = route.distance / metrics.speedKmh;

        return {
          mode,
          emissions: Math.round(emissions * 100) / 100,
          estimatedCost: Math.round(cost * 100) / 100,
          estimatedDuration: Math.round(duration * 100) / 100,
          emissionReduction: Math.round(((route.weight / 1000) * route.distance * TRANSPORT_METRICS[route.mode].emissionFactor - emissions) * 100) / 100,
          costDifference: Math.round((cost - route.cost) * 100) / 100,
          feasibilityScore: calculateFeasibilityScore(route, mode),
        };
      });

    return {
      routeId: route.id,
      currentMode: route.mode,
      alternatives: alternatives.sort((a, b) => b.feasibilityScore - a.feasibilityScore),
    };
  });
}

/**
 * Calculate feasibility score for alternative transport modes
 */
function calculateFeasibilityScore(route: RouteSegment, alternativeMode: string): number {
  const metrics = TRANSPORT_METRICS[alternativeMode as keyof typeof TRANSPORT_METRICS];
  
  // Factors: reliability, capacity match, cost efficiency, emission reduction
  let score = 0;
  
  // Reliability factor (0-30 points)
  score += metrics.reliability * 30;
  
  // Distance suitability (0-25 points)
  if (alternativeMode === 'air' && route.distance > 1000) score += 25;
  else if (alternativeMode === 'sea' && route.distance > 500) score += 25;
  else if (alternativeMode === 'rail' && route.distance > 200 && route.distance < 2000) score += 25;
  else if (alternativeMode === 'road' && route.distance < 1000) score += 25;
  
  // Emission improvement (0-25 points)
  const currentEmissions = (route.weight / 1000) * route.distance * TRANSPORT_METRICS[route.mode].emissionFactor;
  const alternativeEmissions = (route.weight / 1000) * route.distance * metrics.emissionFactor;
  const emissionImprovement = Math.max(0, (currentEmissions - alternativeEmissions) / currentEmissions);
  score += emissionImprovement * 25;
  
  // Cost efficiency (0-20 points)
  const costRatio = metrics.costPerTonKm / TRANSPORT_METRICS[route.mode].costPerTonKm;
  score += Math.max(0, 20 - (costRatio - 1) * 20);
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Generate comparison summary
 */
function generateComparisonSummary(routeAnalysis: any[]) {
  const totalEmissions = routeAnalysis.reduce((sum, route) => sum + route.emissions, 0);
  const totalCost = routeAnalysis.reduce((sum, route) => sum + route.actualCost, 0);
  const avgEfficiency = routeAnalysis.reduce((sum, route) => sum + route.efficiency.emissionEfficiency, 0) / routeAnalysis.length;

  return {
    totalEmissions: Math.round(totalEmissions * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    averageEfficiency: Math.round(avgEfficiency * 100) / 100,
    mostEfficientMode: routeAnalysis.reduce((best, route) => 
      route.efficiency.emissionEfficiency > (best?.efficiency?.emissionEfficiency || 0) ? route : best
    )?.mode || 'unknown',
    leastEfficientMode: routeAnalysis.reduce((worst, route) => 
      route.efficiency.emissionEfficiency < (worst?.efficiency?.emissionEfficiency || 100) ? route : worst
    )?.mode || 'unknown',
  };
}

/**
 * Generate emissions breakdown
 */
function generateEmissionsBreakdown(routeAnalysis: any[]) {
  const breakdown = routeAnalysis.reduce((acc, route) => {
    if (!acc[route.mode]) {
      acc[route.mode] = { emissions: 0, percentage: 0, routes: 0 };
    }
    acc[route.mode].emissions += route.emissions;
    acc[route.mode].routes++;
    return acc;
  }, {} as any);

  const totalEmissions = Object.values(breakdown).reduce((sum: number, mode: any) => sum + mode.emissions, 0);
  
  Object.keys(breakdown).forEach(mode => {
    breakdown[mode].percentage = Math.round((breakdown[mode].emissions / totalEmissions) * 100 * 100) / 100;
    breakdown[mode].emissions = Math.round(breakdown[mode].emissions * 100) / 100;
  });

  return breakdown;
}

/**
 * Generate performance metrics
 */
function generatePerformanceMetrics(routeAnalysis: any[]) {
  return {
    totalRoutes: routeAnalysis.length,
    averageEmissions: Math.round((routeAnalysis.reduce((sum, route) => sum + route.emissions, 0) / routeAnalysis.length) * 100) / 100,
    emissionRange: {
      min: Math.min(...routeAnalysis.map(r => r.emissions)),
      max: Math.max(...routeAnalysis.map(r => r.emissions)),
    },
    efficiencyDistribution: {
      high: routeAnalysis.filter(r => r.efficiency.emissionEfficiency >= 80).length,
      medium: routeAnalysis.filter(r => r.efficiency.emissionEfficiency >= 50 && r.efficiency.emissionEfficiency < 80).length,
      low: routeAnalysis.filter(r => r.efficiency.emissionEfficiency < 50).length,
    },
  };
}

/**
 * Calculate potential savings from optimization recommendations
 */
function calculatePotentialSavings(routeAnalysis: any[], recommendations: any[]) {
  const totalEmissionReduction = recommendations.reduce((sum, rec) => sum + (rec.potentialReduction || 0), 0);
  const totalCurrentEmissions = routeAnalysis.reduce((sum, route) => sum + route.emissions, 0);
  
  return {
    emissionReduction: Math.round(totalEmissionReduction * 100) / 100,
    percentageReduction: Math.round((totalEmissionReduction / totalCurrentEmissions) * 100 * 100) / 100,
    estimatedCostSavings: Math.round(totalEmissionReduction * 25 * 100) / 100, // Assuming $25 per ton CO₂
  };
}

// Health check endpoint
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    service: 'analyze-transport-emissions',
    timestamp: new Date().toISOString(),
  });
};

// Default export for Google Cloud Functions
export default analyzeTransportEmissions;