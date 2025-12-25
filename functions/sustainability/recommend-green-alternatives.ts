import { Request, Response } from 'express';
import { z } from 'zod';

// Green alternatives recommendation service for VoiceOps AI
// Implements eco-friendly routing and transport alternative algorithms

interface CurrentRoute {
  id: string;
  origin: string;
  destination: string;
  mode: 'air' | 'sea' | 'rail' | 'road';
  distance: number;
  weight: number;
  cost: number;
  duration: number;
  emissions: number;
}

interface GreenAlternativeRequest {
  currentRoutes: CurrentRoute[];
  optimizationGoals: ('emissions' | 'cost' | 'time' | 'sustainability')[];
  constraints?: {
    maxCostIncrease?: number; // percentage
    maxTimeIncrease?: number; // percentage
    requiredModes?: ('air' | 'sea' | 'rail' | 'road')[];
    excludedModes?: ('air' | 'sea' | 'rail' | 'road')[];
  };
  includeMultiModal?: boolean;
}

const GreenAlternativeRequestSchema = z.object({
  currentRoutes: z.array(z.object({
    id: z.string(),
    origin: z.string(),
    destination: z.string(),
    mode: z.enum(['air', 'sea', 'rail', 'road']),
    distance: z.number().min(0),
    weight: z.number().min(0),
    cost: z.number().min(0),
    duration: z.number().min(0),
    emissions: z.number().min(0),
  })),
  optimizationGoals: z.array(z.enum(['emissions', 'cost', 'time', 'sustainability'])),
  constraints: z.object({
    maxCostIncrease: z.number().min(0).max(100).optional(),
    maxTimeIncrease: z.number().min(0).max(100).optional(),
    requiredModes: z.array(z.enum(['air', 'sea', 'rail', 'road'])).optional(),
    excludedModes: z.array(z.enum(['air', 'sea', 'rail', 'road'])).optional(),
  }).optional(),
  includeMultiModal: z.boolean().optional(),
});

// Green transport characteristics
const GREEN_TRANSPORT_DATA = {
  sea: {
    emissionFactor: 0.0156, // kg CO₂ per ton-km
    costMultiplier: 0.3,
    timeMultiplier: 8.0,
    sustainabilityScore: 95,
    capacity: 'very_high',
    infrastructure: 'established',
    weatherDependency: 'high',
    suitableDistances: { min: 500, max: 20000 },
  },
  rail: {
    emissionFactor: 0.0285,
    costMultiplier: 0.5,
    timeMultiplier: 2.5,
    sustainabilityScore: 85,
    capacity: 'high',
    infrastructure: 'good',
    weatherDependency: 'low',
    suitableDistances: { min: 200, max: 5000 },
  },
  road: {
    emissionFactor: 0.0977,
    costMultiplier: 1.0,
    timeMultiplier: 1.0,
    sustainabilityScore: 60,
    capacity: 'medium',
    infrastructure: 'excellent',
    weatherDependency: 'medium',
    suitableDistances: { min: 50, max: 2000 },
  },
  air: {
    emissionFactor: 0.602,
    costMultiplier: 3.0,
    timeMultiplier: 0.2,
    sustainabilityScore: 25,
    capacity: 'low',
    infrastructure: 'good',
    weatherDependency: 'medium',
    suitableDistances: { min: 500, max: 15000 },
  },
};

// Multi-modal combinations
const MULTIMODAL_OPTIONS = [
  { modes: ['rail', 'road'], emissionReduction: 0.4, costIncrease: 0.15, timeIncrease: 0.3 },
  { modes: ['sea', 'rail'], emissionReduction: 0.6, costIncrease: 0.1, timeIncrease: 0.8 },
  { modes: ['sea', 'road'], emissionReduction: 0.5, costIncrease: 0.2, timeIncrease: 0.6 },
  { modes: ['rail', 'air'], emissionReduction: 0.3, costIncrease: 0.4, timeIncrease: -0.1 },
];

/**
 * Recommend eco-friendly routing and transport alternatives
 * Requirement 3.4: Recommend eco-friendly routing and transport options with emission reduction percentages
 */
export const recommendGreenAlternatives = async (req: Request, res: Response): Promise<void> => {
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
    const validationResult = GreenAlternativeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Invalid request format',
        details: validationResult.error.errors,
      });
      return;
    }

    const { 
      currentRoutes, 
      optimizationGoals, 
      constraints = {}, 
      includeMultiModal = true 
    } = validationResult.data;

    // Generate alternatives for each route
    const routeAlternatives = await Promise.all(
      currentRoutes.map(route => generateRouteAlternatives(route, optimizationGoals, constraints, includeMultiModal))
    );

    // Calculate overall impact
    const currentTotalEmissions = currentRoutes.reduce((sum, route) => sum + route.emissions, 0);
    const currentTotalCost = currentRoutes.reduce((sum, route) => sum + route.cost, 0);
    const currentTotalTime = currentRoutes.reduce((sum, route) => sum + route.duration, 0);

    // Find best overall strategy
    const bestStrategy = findBestOverallStrategy(routeAlternatives, optimizationGoals);

    // Generate network-level recommendations
    const networkRecommendations = generateNetworkRecommendations(currentRoutes, routeAlternatives);

    // Calculate potential savings
    const potentialSavings = calculatePotentialSavings(
      currentRoutes,
      routeAlternatives,
      bestStrategy
    );

    // Generate implementation roadmap
    const implementationRoadmap = generateImplementationRoadmap(routeAlternatives, constraints);

    // Create response
    const response = {
      routeAlternatives,
      bestStrategy,
      networkRecommendations,
      potentialSavings,
      implementationRoadmap,
      currentBaseline: {
        totalEmissions: Math.round(currentTotalEmissions * 100) / 100,
        totalCost: Math.round(currentTotalCost * 100) / 100,
        totalTime: Math.round(currentTotalTime * 100) / 100,
        averageSustainabilityScore: calculateAverageSustainabilityScore(currentRoutes),
      },
      optimizationSummary: {
        goals: optimizationGoals,
        constraints,
        alternativesGenerated: routeAlternatives.reduce((sum, route) => sum + route.alternatives.length, 0),
        multiModalIncluded: includeMultiModal,
      },
      analysisTimestamp: new Date().toISOString(),
    };

    console.log('Green alternatives generated successfully:', {
      routeCount: currentRoutes.length,
      alternativesGenerated: response.optimizationSummary.alternativesGenerated,
      potentialEmissionReduction: potentialSavings.emissions.reduction,
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating green alternatives:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Generate alternatives for a single route
 */
async function generateRouteAlternatives(
  route: CurrentRoute,
  goals: string[],
  constraints: any,
  includeMultiModal: boolean
) {
  const alternatives = [];

  // Single-mode alternatives
  const availableModes = Object.keys(GREEN_TRANSPORT_DATA).filter(mode => {
    if (constraints.excludedModes?.includes(mode)) return false;
    if (constraints.requiredModes && !constraints.requiredModes.includes(mode)) return false;
    if (mode === route.mode) return false;
    
    const modeData = GREEN_TRANSPORT_DATA[mode as keyof typeof GREEN_TRANSPORT_DATA];
    return route.distance >= modeData.suitableDistances.min && 
           route.distance <= modeData.suitableDistances.max;
  });

  for (const mode of availableModes) {
    const alternative = calculateSingleModeAlternative(route, mode, goals);
    if (meetsConstraints(alternative, route, constraints)) {
      alternatives.push(alternative);
    }
  }

  // Multi-modal alternatives
  if (includeMultiModal) {
    for (const multiModal of MULTIMODAL_OPTIONS) {
      if (multiModal.modes.some(mode => constraints.excludedModes?.includes(mode))) continue;
      if (constraints.requiredModes && !multiModal.modes.some(mode => constraints.requiredModes?.includes(mode))) continue;
      
      const alternative = calculateMultiModalAlternative(route, multiModal, goals);
      if (meetsConstraints(alternative, route, constraints)) {
        alternatives.push(alternative);
      }
    }
  }

  // Sort alternatives by optimization goals
  alternatives.sort((a, b) => calculateAlternativeScore(b, goals) - calculateAlternativeScore(a, goals));

  return {
    routeId: route.id,
    currentRoute: route,
    alternatives: alternatives.slice(0, 5), // Top 5 alternatives
    bestAlternative: alternatives[0] || null,
  };
}

/**
 * Calculate single-mode alternative
 */
function calculateSingleModeAlternative(route: CurrentRoute, mode: string, goals: string[]) {
  const modeData = GREEN_TRANSPORT_DATA[mode as keyof typeof GREEN_TRANSPORT_DATA];
  
  const newEmissions = (route.weight / 1000) * route.distance * modeData.emissionFactor;
  const newCost = route.cost * modeData.costMultiplier;
  const newDuration = route.duration * modeData.timeMultiplier;

  return {
    id: `${route.id}_${mode}`,
    type: 'single_mode',
    mode: mode,
    modes: [mode],
    emissions: Math.round(newEmissions * 100) / 100,
    cost: Math.round(newCost * 100) / 100,
    duration: Math.round(newDuration * 100) / 100,
    sustainabilityScore: modeData.sustainabilityScore,
    emissionReduction: Math.round(((route.emissions - newEmissions) / route.emissions) * 100 * 100) / 100,
    costChange: Math.round(((newCost - route.cost) / route.cost) * 100 * 100) / 100,
    timeChange: Math.round(((newDuration - route.duration) / route.duration) * 100 * 100) / 100,
    feasibilityScore: calculateFeasibilityScore(route, mode, modeData),
    implementationComplexity: calculateImplementationComplexity(route.mode, mode),
    riskFactors: identifyRiskFactors(mode, modeData, route),
    benefits: identifyBenefits(route, mode, modeData),
  };
}

/**
 * Calculate multi-modal alternative
 */
function calculateMultiModalAlternative(route: CurrentRoute, multiModal: any, goals: string[]) {
  const baseEmissions = route.emissions * (1 - multiModal.emissionReduction);
  const baseCost = route.cost * (1 + multiModal.costIncrease);
  const baseDuration = route.duration * (1 + multiModal.timeIncrease);

  const avgSustainabilityScore = multiModal.modes.reduce((sum: number, mode: string) => 
    sum + GREEN_TRANSPORT_DATA[mode as keyof typeof GREEN_TRANSPORT_DATA].sustainabilityScore, 0
  ) / multiModal.modes.length;

  return {
    id: `${route.id}_${multiModal.modes.join('_')}`,
    type: 'multi_modal',
    mode: multiModal.modes.join(' + '),
    modes: multiModal.modes,
    emissions: Math.round(baseEmissions * 100) / 100,
    cost: Math.round(baseCost * 100) / 100,
    duration: Math.round(baseDuration * 100) / 100,
    sustainabilityScore: Math.round(avgSustainabilityScore),
    emissionReduction: Math.round(multiModal.emissionReduction * 100 * 100) / 100,
    costChange: Math.round(multiModal.costIncrease * 100 * 100) / 100,
    timeChange: Math.round(multiModal.timeIncrease * 100 * 100) / 100,
    feasibilityScore: calculateMultiModalFeasibility(route, multiModal.modes),
    implementationComplexity: 'high',
    riskFactors: ['coordination_complexity', 'multiple_handoffs', 'scheduling_challenges'],
    benefits: ['emission_reduction', 'cost_optimization', 'risk_diversification'],
  };
}

/**
 * Check if alternative meets constraints
 */
function meetsConstraints(alternative: any, originalRoute: CurrentRoute, constraints: any): boolean {
  if (constraints.maxCostIncrease && alternative.costChange > constraints.maxCostIncrease) {
    return false;
  }
  
  if (constraints.maxTimeIncrease && alternative.timeChange > constraints.maxTimeIncrease) {
    return false;
  }
  
  return true;
}

/**
 * Calculate alternative score based on optimization goals
 */
function calculateAlternativeScore(alternative: any, goals: string[]): number {
  let score = 0;
  const weights = { emissions: 0.4, cost: 0.3, time: 0.2, sustainability: 0.1 };
  
  if (goals.includes('emissions')) {
    score += (alternative.emissionReduction / 100) * weights.emissions * 100;
  }
  
  if (goals.includes('cost')) {
    score += Math.max(0, -alternative.costChange / 100) * weights.cost * 100;
  }
  
  if (goals.includes('time')) {
    score += Math.max(0, -alternative.timeChange / 100) * weights.time * 100;
  }
  
  if (goals.includes('sustainability')) {
    score += (alternative.sustainabilityScore / 100) * weights.sustainability * 100;
  }
  
  // Add feasibility bonus
  score += (alternative.feasibilityScore / 100) * 10;
  
  return Math.round(score * 100) / 100;
}

/**
 * Calculate feasibility score
 */
function calculateFeasibilityScore(route: CurrentRoute, mode: string, modeData: any): number {
  let score = 70; // Base score
  
  // Distance suitability
  if (route.distance >= modeData.suitableDistances.min && route.distance <= modeData.suitableDistances.max) {
    score += 20;
  } else {
    score -= 30;
  }
  
  // Infrastructure availability
  if (modeData.infrastructure === 'excellent') score += 10;
  else if (modeData.infrastructure === 'good') score += 5;
  
  // Weather dependency (lower is better)
  if (modeData.weatherDependency === 'low') score += 10;
  else if (modeData.weatherDependency === 'high') score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate multi-modal feasibility
 */
function calculateMultiModalFeasibility(route: CurrentRoute, modes: string[]): number {
  const avgFeasibility = modes.reduce((sum, mode) => {
    const modeData = GREEN_TRANSPORT_DATA[mode as keyof typeof GREEN_TRANSPORT_DATA];
    return sum + calculateFeasibilityScore(route, mode, modeData);
  }, 0) / modes.length;
  
  // Reduce score due to coordination complexity
  return Math.round(Math.max(0, avgFeasibility - 20));
}

/**
 * Calculate implementation complexity
 */
function calculateImplementationComplexity(currentMode: string, newMode: string): string {
  const complexityMatrix = {
    air: { sea: 'high', rail: 'medium', road: 'low' },
    sea: { air: 'high', rail: 'medium', road: 'medium' },
    rail: { air: 'medium', sea: 'medium', road: 'low' },
    road: { air: 'low', sea: 'medium', rail: 'low' },
  };
  
  return complexityMatrix[currentMode as keyof typeof complexityMatrix]?.[newMode as keyof any] || 'medium';
}

/**
 * Identify risk factors
 */
function identifyRiskFactors(mode: string, modeData: any, route: CurrentRoute): string[] {
  const risks = [];
  
  if (modeData.weatherDependency === 'high') risks.push('weather_delays');
  if (modeData.capacity === 'low') risks.push('capacity_constraints');
  if (route.distance > modeData.suitableDistances.max * 0.8) risks.push('distance_limitations');
  if (modeData.infrastructure !== 'excellent') risks.push('infrastructure_limitations');
  
  return risks;
}

/**
 * Identify benefits
 */
function identifyBenefits(route: CurrentRoute, mode: string, modeData: any): string[] {
  const benefits = [];
  
  if (modeData.emissionFactor < GREEN_TRANSPORT_DATA[route.mode].emissionFactor) {
    benefits.push('emission_reduction');
  }
  
  if (modeData.sustainabilityScore > GREEN_TRANSPORT_DATA[route.mode].sustainabilityScore) {
    benefits.push('sustainability_improvement');
  }
  
  if (modeData.costMultiplier < GREEN_TRANSPORT_DATA[route.mode].costMultiplier) {
    benefits.push('cost_savings');
  }
  
  if (modeData.capacity === 'very_high' || modeData.capacity === 'high') {
    benefits.push('high_capacity');
  }
  
  return benefits;
}

/**
 * Find best overall strategy
 */
function findBestOverallStrategy(routeAlternatives: any[], goals: string[]) {
  const strategies = [];
  
  // Strategy 1: Best emission reduction
  const emissionStrategy = {
    name: 'Maximum Emission Reduction',
    description: 'Prioritize alternatives with highest emission reduction',
    routes: routeAlternatives.map(ra => ra.bestAlternative).filter(Boolean),
    totalEmissionReduction: 0,
    totalCostChange: 0,
    totalTimeChange: 0,
    feasibilityScore: 0,
  };
  
  // Strategy 2: Balanced optimization
  const balancedStrategy = {
    name: 'Balanced Optimization',
    description: 'Balance emission reduction, cost, and time considerations',
    routes: routeAlternatives.map(ra => 
      ra.alternatives.find((alt: any) => alt.feasibilityScore > 70) || ra.bestAlternative
    ).filter(Boolean),
    totalEmissionReduction: 0,
    totalCostChange: 0,
    totalTimeChange: 0,
    feasibilityScore: 0,
  };
  
  // Calculate strategy metrics
  [emissionStrategy, balancedStrategy].forEach(strategy => {
    strategy.totalEmissionReduction = strategy.routes.reduce((sum, route) => sum + (route?.emissionReduction || 0), 0) / strategy.routes.length;
    strategy.totalCostChange = strategy.routes.reduce((sum, route) => sum + (route?.costChange || 0), 0) / strategy.routes.length;
    strategy.totalTimeChange = strategy.routes.reduce((sum, route) => sum + (route?.timeChange || 0), 0) / strategy.routes.length;
    strategy.feasibilityScore = strategy.routes.reduce((sum, route) => sum + (route?.feasibilityScore || 0), 0) / strategy.routes.length;
  });
  
  strategies.push(emissionStrategy, balancedStrategy);
  
  // Select best strategy based on goals
  return strategies.sort((a, b) => {
    if (goals.includes('emissions')) return b.totalEmissionReduction - a.totalEmissionReduction;
    return b.feasibilityScore - a.feasibilityScore;
  })[0];
}

/**
 * Generate network-level recommendations
 */
function generateNetworkRecommendations(currentRoutes: CurrentRoute[], routeAlternatives: any[]) {
  const recommendations = [];
  
  // Analyze mode distribution
  const modeDistribution = currentRoutes.reduce((dist, route) => {
    dist[route.mode] = (dist[route.mode] || 0) + 1;
    return dist;
  }, {} as any);
  
  // High air freight usage
  if (modeDistribution.air > currentRoutes.length * 0.3) {
    recommendations.push({
      type: 'mode_diversification',
      priority: 'high',
      title: 'Reduce Air Freight Dependency',
      description: 'High reliance on air freight creates emission and cost risks',
      impact: 'High emission and cost reduction potential',
      actions: ['Shift non-urgent shipments to sea freight', 'Implement multi-modal solutions'],
    });
  }
  
  // Consolidation opportunities
  const routesByOrigin = currentRoutes.reduce((groups, route) => {
    if (!groups[route.origin]) groups[route.origin] = [];
    groups[route.origin].push(route);
    return groups;
  }, {} as any);
  
  const consolidationOpportunities = Object.values(routesByOrigin).filter((routes: any) => routes.length > 1);
  if (consolidationOpportunities.length > 0) {
    recommendations.push({
      type: 'consolidation',
      priority: 'medium',
      title: 'Shipment Consolidation Opportunities',
      description: `${consolidationOpportunities.length} origins with multiple shipments`,
      impact: 'Medium emission reduction and cost savings',
      actions: ['Consolidate shipments from same origins', 'Optimize departure schedules'],
    });
  }
  
  return recommendations;
}

/**
 * Calculate potential savings
 */
function calculatePotentialSavings(
  currentRoutes: CurrentRoute[],
  routeAlternatives: any[],
  bestStrategy: any
) {
  const currentTotals = {
    emissions: currentRoutes.reduce((sum, route) => sum + route.emissions, 0),
    cost: currentRoutes.reduce((sum, route) => sum + route.cost, 0),
    time: currentRoutes.reduce((sum, route) => sum + route.duration, 0),
  };
  
  const optimizedTotals = bestStrategy.routes.reduce((totals: any, route: any, index: number) => {
    const currentRoute = currentRoutes[index];
    if (route && currentRoute) {
      totals.emissions += currentRoute.emissions * (1 - route.emissionReduction / 100);
      totals.cost += currentRoute.cost * (1 + route.costChange / 100);
      totals.time += currentRoute.duration * (1 + route.timeChange / 100);
    }
    return totals;
  }, { emissions: 0, cost: 0, time: 0 });
  
  return {
    emissions: {
      current: Math.round(currentTotals.emissions * 100) / 100,
      optimized: Math.round(optimizedTotals.emissions * 100) / 100,
      reduction: Math.round((currentTotals.emissions - optimizedTotals.emissions) * 100) / 100,
      percentageReduction: Math.round(((currentTotals.emissions - optimizedTotals.emissions) / currentTotals.emissions) * 100 * 100) / 100,
    },
    cost: {
      current: Math.round(currentTotals.cost * 100) / 100,
      optimized: Math.round(optimizedTotals.cost * 100) / 100,
      change: Math.round((optimizedTotals.cost - currentTotals.cost) * 100) / 100,
      percentageChange: Math.round(((optimizedTotals.cost - currentTotals.cost) / currentTotals.cost) * 100 * 100) / 100,
    },
    time: {
      current: Math.round(currentTotals.time * 100) / 100,
      optimized: Math.round(optimizedTotals.time * 100) / 100,
      change: Math.round((optimizedTotals.time - currentTotals.time) * 100) / 100,
      percentageChange: Math.round(((optimizedTotals.time - currentTotals.time) / currentTotals.time) * 100 * 100) / 100,
    },
  };
}

/**
 * Generate implementation roadmap
 */
function generateImplementationRoadmap(routeAlternatives: any[], constraints: any) {
  const phases = [];
  
  // Phase 1: Quick wins (low complexity, high impact)
  const quickWins = routeAlternatives
    .filter(ra => ra.bestAlternative?.implementationComplexity === 'low' && ra.bestAlternative?.emissionReduction > 20)
    .map(ra => ({ routeId: ra.routeId, alternative: ra.bestAlternative }));
  
  if (quickWins.length > 0) {
    phases.push({
      phase: 1,
      name: 'Quick Wins',
      duration: '1-3 months',
      routes: quickWins,
      description: 'Low-complexity changes with immediate impact',
      requirements: ['Route optimization software', 'Carrier negotiations'],
    });
  }
  
  // Phase 2: Medium complexity improvements
  const mediumComplexity = routeAlternatives
    .filter(ra => ra.bestAlternative?.implementationComplexity === 'medium')
    .map(ra => ({ routeId: ra.routeId, alternative: ra.bestAlternative }));
  
  if (mediumComplexity.length > 0) {
    phases.push({
      phase: 2,
      name: 'Infrastructure Improvements',
      duration: '3-9 months',
      routes: mediumComplexity,
      description: 'Mode switches requiring infrastructure or process changes',
      requirements: ['New carrier partnerships', 'Process redesign', 'Staff training'],
    });
  }
  
  // Phase 3: Complex transformations
  const highComplexity = routeAlternatives
    .filter(ra => ra.bestAlternative?.implementationComplexity === 'high')
    .map(ra => ({ routeId: ra.routeId, alternative: ra.bestAlternative }));
  
  if (highComplexity.length > 0) {
    phases.push({
      phase: 3,
      name: 'Strategic Transformations',
      duration: '9-24 months',
      routes: highComplexity,
      description: 'Multi-modal solutions and major infrastructure changes',
      requirements: ['Capital investment', 'Multi-carrier coordination', 'Technology integration'],
    });
  }
  
  return {
    phases,
    totalDuration: phases.length > 0 ? phases[phases.length - 1].duration : '0 months',
    criticalSuccessFactors: [
      'Executive sponsorship',
      'Change management',
      'Performance monitoring',
      'Stakeholder engagement',
    ],
  };
}

/**
 * Calculate average sustainability score
 */
function calculateAverageSustainabilityScore(routes: CurrentRoute[]): number {
  const totalScore = routes.reduce((sum, route) => {
    const modeData = GREEN_TRANSPORT_DATA[route.mode];
    return sum + modeData.sustainabilityScore;
  }, 0);
  
  return Math.round(totalScore / routes.length);
}

// Health check endpoint
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    service: 'recommend-green-alternatives',
    timestamp: new Date().toISOString(),
  });
};

// Default export for Google Cloud Functions
export default recommendGreenAlternatives;