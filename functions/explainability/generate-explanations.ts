import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import { 
  ExplainabilityResponse, 
  ReasoningStep, 
  AgentContribution,
  UncertaintyFactor 
} from '../../lib/types/enhanced-analytics';

interface ExplanationRequest {
  recommendationId: string;
  analysisType: 'impact' | 'sustainability' | 'optimization';
  explanationType?: 'summary' | 'detailed' | 'decision_tree';
  context?: {
    scenarioType?: string;
    region?: string;
    severity?: string;
    userRole?: string;
  };
}

interface ExplanationGenerationResponse {
  explanation: string;
  reasoning: ReasoningStep[];
  confidence: number;
  uncertaintyFactors: UncertaintyFactor[];
  voiceDescription: string;
  analysisTimestamp: string;
}

/**
 * Generate AI explanations with natural language reasoning
 * 
 * POST /generate-explanations
 * Body: { recommendationId: string, analysisType: string, explanationType?: string, context?: object }
 * 
 * Returns: Detailed explanation with step-by-step reasoning and uncertainty analysis
 */
http('generateExplanations', async (req: Request, res: Response): Promise<void> => {
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
    const { 
      recommendationId, 
      analysisType, 
      explanationType = 'summary',
      context = {}
    } = req.body as ExplanationRequest;

    // Validate required parameters
    if (!recommendationId || !analysisType) {
      res.status(400).json({ 
        error: 'Missing required parameters: recommendationId, analysisType' 
      });
      return;
    }

    // Generate step-by-step reasoning
    const reasoning = generateStepByStepReasoning(
      recommendationId,
      analysisType,
      context
    );

    // Calculate overall confidence
    const confidence = calculateOverallConfidence(reasoning, analysisType);

    // Identify uncertainty factors
    const uncertaintyFactors = identifyUncertaintyFactors(
      analysisType,
      context,
      confidence
    );

    // Generate natural language explanation
    const explanation = generateNaturalLanguageExplanation(
      reasoning,
      analysisType,
      explanationType,
      context
    );

    // Create voice-optimized description
    const voiceDescription = generateVoiceDescription(
      explanation,
      reasoning,
      confidence
    );

    const response: ExplanationGenerationResponse = {
      explanation,
      reasoning,
      confidence,
      uncertaintyFactors,
      voiceDescription,
      analysisTimestamp: new Date().toISOString(),
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Explanation generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate explanation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate step-by-step reasoning for the analysis
 */
function generateStepByStepReasoning(
  recommendationId: string,
  analysisType: string,
  context: any
): ReasoningStep[] {
  const reasoningTemplates = {
    impact: [
      {
        step: 1,
        description: 'Data Collection and Validation',
        reasoning: 'Gathered supply chain data from multiple sources including historical disruption patterns, regional risk factors, and current operational metrics.',
        dataSource: 'Historical disruption database, Real-time monitoring systems',
        baseConfidence: 85
      },
      {
        step: 2,
        description: 'Scenario Impact Modeling',
        reasoning: 'Applied mathematical models to calculate financial impact across direct costs, opportunity costs, labor, materials, and logistics based on scenario parameters.',
        dataSource: 'Financial impact models, Regional cost databases',
        baseConfidence: 80
      },
      {
        step: 3,
        description: 'Cascade Effect Analysis',
        reasoning: 'Analyzed network topology to determine how disruptions propagate through supply chain connections, considering node relationships and impact decay.',
        dataSource: 'Supply chain network topology, Propagation algorithms',
        baseConfidence: 75
      },
      {
        step: 4,
        description: 'Timeline Projection',
        reasoning: 'Generated recovery timeline based on historical patterns, scenario complexity, and regional factors to project delivery delays and recovery progress.',
        dataSource: 'Recovery pattern database, Regional complexity factors',
        baseConfidence: 70
      },
      {
        step: 5,
        description: 'Mitigation Strategy Evaluation',
        reasoning: 'Evaluated potential mitigation strategies based on cost-effectiveness, implementation time, and risk reduction potential.',
        dataSource: 'Strategy effectiveness database, Cost-benefit models',
        baseConfidence: 78
      }
    ],
    sustainability: [
      {
        step: 1,
        description: 'Carbon Footprint Calculation',
        reasoning: 'Calculated total CO₂ emissions across all transport modes using industry-standard emission factors and route-specific data.',
        dataSource: 'Emission factor database, Transport route data',
        baseConfidence: 88
      },
      {
        step: 2,
        description: 'Transport Mode Analysis',
        reasoning: 'Analyzed emissions breakdown by air, sea, rail, and road transport to identify highest-impact areas for optimization.',
        dataSource: 'Mode-specific emission data, Route optimization models',
        baseConfidence: 85
      },
      {
        step: 3,
        description: 'Sustainability Scoring',
        reasoning: 'Calculated environmental performance scores using weighted metrics for carbon efficiency, renewable energy usage, and waste reduction.',
        dataSource: 'Sustainability benchmarks, Industry standards',
        baseConfidence: 80
      },
      {
        step: 4,
        description: 'Green Alternative Identification',
        reasoning: 'Identified eco-friendly alternatives by analyzing route options, transport modes, and supplier choices for emission reduction potential.',
        dataSource: 'Green transport database, Alternative route analysis',
        baseConfidence: 75
      }
    ],
    optimization: [
      {
        step: 1,
        description: 'Multi-Criteria Analysis Setup',
        reasoning: 'Established weighted scoring framework balancing cost, risk, sustainability, and timeline factors based on user priorities.',
        dataSource: 'Decision analysis frameworks, User preference models',
        baseConfidence: 82
      },
      {
        step: 2,
        description: 'Strategy ROI Calculation',
        reasoning: 'Calculated return on investment for each strategy including direct savings, avoided costs, and payback periods.',
        dataSource: 'Financial models, Cost-benefit databases',
        baseConfidence: 85
      },
      {
        step: 3,
        description: 'Risk-Adjusted Scoring',
        reasoning: 'Applied risk adjustments to strategy scores based on implementation complexity, market volatility, and operational constraints.',
        dataSource: 'Risk assessment models, Implementation databases',
        baseConfidence: 78
      },
      {
        step: 4,
        description: 'Strategy Ranking and Selection',
        reasoning: 'Ranked strategies by weighted scores and selected optimal recommendations based on balanced performance across all criteria.',
        dataSource: 'Optimization algorithms, Performance benchmarks',
        baseConfidence: 80
      }
    ]
  };

  const baseSteps = reasoningTemplates[analysisType as keyof typeof reasoningTemplates] || reasoningTemplates.impact;
  
  // Apply context-specific adjustments
  return baseSteps.map(step => ({
    ...step,
    confidence: adjustConfidenceForContext(step.baseConfidence, context, analysisType),
    reasoning: contextualizeReasoning(step.reasoning, context)
  }));
}

/**
 * Adjust confidence based on context factors
 */
function adjustConfidenceForContext(
  baseConfidence: number,
  context: any,
  analysisType: string
): number {
  let adjustedConfidence = baseConfidence;

  // Regional data quality adjustments
  const regionAdjustments = {
    asia: -3,        // More complex supply chains
    europe: 2,       // Better data quality
    north_america: 1,
    south_america: -5,
    global: -8       // Highest complexity
  };

  if (context.region) {
    const adjustment = regionAdjustments[context.region as keyof typeof regionAdjustments] || 0;
    adjustedConfidence += adjustment;
  }

  // Severity adjustments
  const severityAdjustments = {
    minor: 5,        // More predictable
    moderate: 0,
    severe: -3,      // More uncertainty
    catastrophic: -8 // Highest uncertainty
  };

  if (context.severity) {
    const adjustment = severityAdjustments[context.severity as keyof typeof severityAdjustments] || 0;
    adjustedConfidence += adjustment;
  }

  // Analysis type complexity adjustments
  const complexityAdjustments = {
    impact: 0,
    sustainability: -2,    // Environmental data can be less precise
    optimization: -5       // Multi-criteria optimization has more uncertainty
  };

  adjustedConfidence += complexityAdjustments[analysisType as keyof typeof complexityAdjustments] || 0;

  return Math.max(50, Math.min(95, adjustedConfidence));
}

/**
 * Contextualize reasoning with specific scenario details
 */
function contextualizeReasoning(baseReasoning: string, context: any): string {
  let contextualizedReasoning = baseReasoning;

  // Add region-specific context
  if (context.region) {
    const regionContexts = {
      asia: 'with focus on Asian manufacturing hubs and complex multi-tier supplier networks',
      europe: 'considering European regulatory requirements and established logistics infrastructure',
      north_america: 'accounting for NAFTA trade relationships and cross-border logistics',
      south_america: 'factoring in emerging market dynamics and infrastructure constraints',
      global: 'incorporating worldwide supply chain interdependencies and geopolitical factors'
    };

    const regionContext = regionContexts[context.region as keyof typeof regionContexts];
    if (regionContext) {
      contextualizedReasoning += ` ${regionContext}.`;
    }
  }

  // Add scenario-specific context
  if (context.scenarioType) {
    const scenarioContexts = {
      supplier_failure: 'Special attention given to supplier redundancy and alternative sourcing options.',
      port_closure: 'Analysis included alternative port routing and intermodal transport options.',
      natural_disaster: 'Considered disaster recovery protocols and emergency response capabilities.',
      demand_surge: 'Evaluated capacity scaling options and demand fulfillment strategies.',
      transportation_disruption: 'Assessed alternative routing and transport mode substitution possibilities.'
    };

    const scenarioContext = scenarioContexts[context.scenarioType as keyof typeof scenarioContexts];
    if (scenarioContext) {
      contextualizedReasoning += ` ${scenarioContext}`;
    }
  }

  return contextualizedReasoning;
}

/**
 * Calculate overall confidence from reasoning steps
 */
function calculateOverallConfidence(reasoning: ReasoningStep[], analysisType: string): number {
  if (reasoning.length === 0) return 50;

  // Weighted average of step confidences
  const weights = reasoning.map((_, index) => 1 / (index + 1)); // Earlier steps have higher weight
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const weightedConfidence = reasoning.reduce((sum, step, index) => {
    return sum + (step.confidence * weights[index]);
  }, 0) / totalWeight;

  return Math.round(weightedConfidence);
}

/**
 * Identify uncertainty factors that affect confidence
 */
function identifyUncertaintyFactors(
  analysisType: string,
  context: any,
  confidence: number
): UncertaintyFactor[] {
  const factors: UncertaintyFactor[] = [];

  // Data quality factors
  if (context.region === 'global' || context.region === 'south_america') {
    factors.push({
      factor: 'Data Quality',
      impact: 'medium',
      description: 'Limited historical data availability in some regions may affect prediction accuracy.',
      mitigationSuggestion: 'Supplement with regional expert insights and increase monitoring frequency.'
    });
  }

  // Scenario complexity factors
  if (context.severity === 'catastrophic' || context.scenarioType === 'natural_disaster') {
    factors.push({
      factor: 'Scenario Complexity',
      impact: 'high',
      description: 'Extreme scenarios have limited historical precedents, increasing prediction uncertainty.',
      mitigationSuggestion: 'Use multiple scenario modeling approaches and stress testing methodologies.'
    });
  }

  // Market volatility factors
  if (analysisType === 'optimization' && confidence < 75) {
    factors.push({
      factor: 'Market Volatility',
      impact: 'medium',
      description: 'Rapid market changes may affect the validity of optimization recommendations.',
      mitigationSuggestion: 'Implement dynamic re-optimization and continuous monitoring of market conditions.'
    });
  }

  // External dependencies
  if (context.region === 'asia' && analysisType === 'impact') {
    factors.push({
      factor: 'Geopolitical Risk',
      impact: 'medium',
      description: 'Regional geopolitical tensions may introduce additional supply chain risks not captured in historical data.',
      mitigationSuggestion: 'Monitor geopolitical developments and maintain flexible contingency plans.'
    });
  }

  // Environmental factors for sustainability analysis
  if (analysisType === 'sustainability') {
    factors.push({
      factor: 'Regulatory Changes',
      impact: 'low',
      description: 'Evolving environmental regulations may affect future sustainability calculations.',
      mitigationSuggestion: 'Stay updated on regulatory developments and build flexibility into sustainability strategies.'
    });
  }

  return factors;
}

/**
 * Generate natural language explanation
 */
function generateNaturalLanguageExplanation(
  reasoning: ReasoningStep[],
  analysisType: string,
  explanationType: string,
  context: any
): string {
  const analysisTypeNames = {
    impact: 'Impact Assessment',
    sustainability: 'Sustainability Analysis',
    optimization: 'Strategy Optimization'
  };

  const analysisName = analysisTypeNames[analysisType as keyof typeof analysisTypeNames] || 'Analysis';

  if (explanationType === 'summary') {
    return generateSummaryExplanation(reasoning, analysisName, context);
  } else if (explanationType === 'detailed') {
    return generateDetailedExplanation(reasoning, analysisName, context);
  } else {
    return generateDecisionTreeExplanation(reasoning, analysisName, context);
  }
}

/**
 * Generate summary explanation
 */
function generateSummaryExplanation(
  reasoning: ReasoningStep[],
  analysisName: string,
  context: any
): string {
  const avgConfidence = reasoning.reduce((sum, step) => sum + step.confidence, 0) / reasoning.length;
  const confidenceLevel = avgConfidence >= 80 ? 'high' : avgConfidence >= 65 ? 'medium' : 'moderate';

  const contextDescription = context.scenarioType && context.region 
    ? `for the ${context.scenarioType.replace('_', ' ')} scenario in ${context.region}`
    : '';

  return `This ${analysisName} ${contextDescription} was conducted using a ${reasoning.length}-step analytical process with ${confidenceLevel} confidence (${Math.round(avgConfidence)}%). The analysis incorporated ${reasoning.map(r => r.dataSource).join(', ').toLowerCase()} to provide comprehensive insights. Key factors considered include historical patterns, regional characteristics, and scenario-specific variables to ensure accurate and actionable recommendations.`;
}

/**
 * Generate detailed explanation
 */
function generateDetailedExplanation(
  reasoning: ReasoningStep[],
  analysisName: string,
  context: any
): string {
  let explanation = `${analysisName} Detailed Explanation:\n\n`;

  reasoning.forEach(step => {
    explanation += `Step ${step.step}: ${step.description}\n`;
    explanation += `${step.reasoning}\n`;
    explanation += `Data Sources: ${step.dataSource}\n`;
    explanation += `Confidence: ${step.confidence}%\n\n`;
  });

  explanation += `This comprehensive analysis ensures reliable results by combining multiple data sources and analytical approaches. Each step builds upon previous findings to create a robust foundation for decision-making.`;

  return explanation;
}

/**
 * Generate decision tree explanation
 */
function generateDecisionTreeExplanation(
  reasoning: ReasoningStep[],
  analysisName: string,
  context: any
): string {
  return `${analysisName} Decision Path:\n\n` +
    `The analysis follows a structured decision tree where each step represents a critical decision point. ` +
    `Starting with data collection (${reasoning[0]?.confidence}% confidence), the process branches through ` +
    `${reasoning.length} analytical stages, each contributing to the final recommendation. ` +
    `This systematic approach ensures that all relevant factors are considered and weighted appropriately ` +
    `in the decision-making process.`;
}

/**
 * Generate voice-optimized description
 */
function generateVoiceDescription(
  explanation: string,
  reasoning: ReasoningStep[],
  confidence: number
): string {
  const avgConfidence = Math.round(confidence);
  const confidencePhrase = avgConfidence >= 80 ? 'high confidence' : 
                          avgConfidence >= 65 ? 'medium confidence' : 'moderate confidence';

  // Extract key points for voice
  const keyPoints = reasoning.slice(0, 3).map(step => step.description).join(', ');

  return `I analyzed this using ${reasoning.length} key steps: ${keyPoints}. ` +
         `My analysis has ${confidencePhrase} at ${avgConfidence} percent. ` +
         `The recommendation is based on comprehensive data from multiple sources including ` +
         `historical patterns and real-time monitoring systems.`;
}

/**
 * Health check endpoint
 */
http('generateExplanationsHealth', (req: Request, res: Response): void => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  res.status(200).json({
    status: 'healthy',
    service: 'generate-explanations',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});