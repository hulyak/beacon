import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import { AgentContribution } from '../../lib/types/enhanced-analytics';

interface AgentTrackingRequest {
  sessionId: string;
  analysisType: 'impact' | 'sustainability' | 'optimization';
  agentExecutions: {
    infoAgent?: AgentExecution;
    scenarioAgent?: AgentExecution;
    impactAgent?: AgentExecution;
    strategyAgent?: AgentExecution;
  };
}

interface AgentExecution {
  startTime: string;
  endTime: string;
  inputData: any;
  outputData: any;
  confidence: number;
  errorCount: number;
  warningCount: number;
  dataSourcesUsed: string[];
  keyInsights: string[];
  performanceMetrics: {
    memoryUsage?: number;
    cpuTime?: number;
    apiCalls?: number;
    cacheHits?: number;
  };
}

interface AgentTrackingResponse {
  sessionId: string;
  agentContributions: {
    infoAgent: AgentContribution;
    scenarioAgent: AgentContribution;
    impactAgent: AgentContribution;
    strategyAgent: AgentContribution;
  };
  coordinationMetrics: {
    totalProcessingTime: number;
    parallelEfficiency: number;
    dataConsistency: number;
    agentSynchronization: number;
  };
  performanceSummary: {
    fastestAgent: string;
    slowestAgent: string;
    mostReliableAgent: string;
    highestContributor: string;
  };
  recommendations: string[];
  analysisTimestamp: string;
}

/**
 * Track agent contributions and performance monitoring
 * 
 * POST /track-agent-contributions
 * Body: { sessionId: string, analysisType: string, agentExecutions: object }
 * 
 * Returns: Comprehensive agent performance analysis and coordination metrics
 */
http('trackAgentContributions', async (req: Request, res: Response): Promise<void> => {
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
      sessionId, 
      analysisType, 
      agentExecutions 
    } = req.body as AgentTrackingRequest;

    // Validate required parameters
    if (!sessionId || !analysisType || !agentExecutions) {
      res.status(400).json({ 
        error: 'Missing required parameters: sessionId, analysisType, agentExecutions' 
      });
      return;
    }

    // Calculate agent contributions
    const agentContributions = calculateAgentContributions(
      agentExecutions,
      analysisType
    );

    // Calculate coordination metrics
    const coordinationMetrics = calculateCoordinationMetrics(agentExecutions);

    // Generate performance summary
    const performanceSummary = generatePerformanceSummary(
      agentContributions,
      agentExecutions
    );

    // Generate optimization recommendations
    const recommendations = generateOptimizationRecommendations(
      agentContributions,
      coordinationMetrics,
      agentExecutions
    );

    const response: AgentTrackingResponse = {
      sessionId,
      agentContributions,
      coordinationMetrics,
      performanceSummary,
      recommendations,
      analysisTimestamp: new Date().toISOString(),
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Agent contribution tracking failed:', error);
    res.status(500).json({ 
      error: 'Failed to track agent contributions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Calculate individual agent contributions
 */
function calculateAgentContributions(
  agentExecutions: AgentTrackingRequest['agentExecutions'],
  analysisType: string
): AgentTrackingResponse['agentContributions'] {
  // Define contribution weights based on analysis type
  const contributionWeights = {
    impact: {
      infoAgent: 0.20,
      scenarioAgent: 0.30,
      impactAgent: 0.40,
      strategyAgent: 0.10
    },
    sustainability: {
      infoAgent: 0.25,
      scenarioAgent: 0.20,
      impactAgent: 0.30,
      strategyAgent: 0.25
    },
    optimization: {
      infoAgent: 0.15,
      scenarioAgent: 0.25,
      impactAgent: 0.25,
      strategyAgent: 0.35
    }
  };

  const weights = contributionWeights[analysisType as keyof typeof contributionWeights] || contributionWeights.impact;

  return {
    infoAgent: calculateSingleAgentContribution(
      agentExecutions.infoAgent,
      weights.infoAgent,
      'Information Gathering and Data Collection'
    ),
    scenarioAgent: calculateSingleAgentContribution(
      agentExecutions.scenarioAgent,
      weights.scenarioAgent,
      'Scenario Modeling and Simulation'
    ),
    impactAgent: calculateSingleAgentContribution(
      agentExecutions.impactAgent,
      weights.impactAgent,
      'Impact Assessment and Analysis'
    ),
    strategyAgent: calculateSingleAgentContribution(
      agentExecutions.strategyAgent,
      weights.strategyAgent,
      'Strategy Optimization and Recommendations'
    )
  };
}

/**
 * Calculate contribution for a single agent
 */
function calculateSingleAgentContribution(
  execution: AgentExecution | undefined,
  weight: number,
  agentRole: string
): AgentContribution {
  if (!execution) {
    return {
      confidence: 0,
      processingTime: 0,
      dataQuality: 0,
      contributionWeight: weight,
      keyInsights: [`${agentRole} agent was not executed`]
    };
  }

  // Calculate processing time
  const processingTime = new Date(execution.endTime).getTime() - 
                        new Date(execution.startTime).getTime();

  // Calculate data quality based on execution metrics
  const dataQuality = calculateDataQuality(execution);

  // Adjust confidence based on performance
  const adjustedConfidence = adjustConfidenceForExecution(execution);

  return {
    confidence: Math.round(adjustedConfidence),
    processingTime,
    dataQuality: Math.round(dataQuality),
    contributionWeight: weight,
    keyInsights: execution.keyInsights || []
  };
}

/**
 * Calculate data quality for an agent execution
 */
function calculateDataQuality(execution: AgentExecution): number {
  let qualityScore = 100;

  // Penalize errors and warnings
  qualityScore -= (execution.errorCount * 15);
  qualityScore -= (execution.warningCount * 5);

  // Reward diverse data sources
  const dataSourceScore = Math.min(20, execution.dataSourcesUsed.length * 5);
  qualityScore += dataSourceScore;

  // Reward meaningful insights
  const insightScore = Math.min(15, execution.keyInsights.length * 3);
  qualityScore += insightScore;

  // Performance metrics bonus
  if (execution.performanceMetrics.cacheHits && execution.performanceMetrics.apiCalls) {
    const cacheHitRatio = execution.performanceMetrics.cacheHits / execution.performanceMetrics.apiCalls;
    if (cacheHitRatio > 0.8) {
      qualityScore += 5; // Efficient data usage
    }
  }

  return Math.max(0, Math.min(100, qualityScore));
}

/**
 * Adjust confidence based on execution performance
 */
function adjustConfidenceForExecution(execution: AgentExecution): number {
  let adjustedConfidence = execution.confidence;

  // Penalize high error rates
  if (execution.errorCount > 0) {
    adjustedConfidence -= (execution.errorCount * 10);
  }

  // Slight penalty for warnings
  if (execution.warningCount > 2) {
    adjustedConfidence -= (execution.warningCount * 2);
  }

  // Reward comprehensive data usage
  if (execution.dataSourcesUsed.length >= 3) {
    adjustedConfidence += 5;
  }

  // Reward meaningful insights
  if (execution.keyInsights.length >= 3) {
    adjustedConfidence += 3;
  }

  // Performance efficiency bonus
  const processingTime = new Date(execution.endTime).getTime() - 
                        new Date(execution.startTime).getTime();
  
  if (processingTime < 10000) { // Under 10 seconds
    adjustedConfidence += 2;
  } else if (processingTime > 60000) { // Over 1 minute
    adjustedConfidence -= 5;
  }

  return Math.max(30, Math.min(95, adjustedConfidence));
}

/**
 * Calculate coordination metrics across agents
 */
function calculateCoordinationMetrics(
  agentExecutions: AgentTrackingRequest['agentExecutions']
): AgentTrackingResponse['coordinationMetrics'] {
  const executions = Object.values(agentExecutions).filter(Boolean) as AgentExecution[];
  
  if (executions.length === 0) {
    return {
      totalProcessingTime: 0,
      parallelEfficiency: 0,
      dataConsistency: 0,
      agentSynchronization: 0
    };
  }

  // Calculate total processing time
  const totalProcessingTime = executions.reduce((sum, execution) => {
    const processingTime = new Date(execution.endTime).getTime() - 
                          new Date(execution.startTime).getTime();
    return sum + processingTime;
  }, 0);

  // Calculate parallel efficiency
  const parallelEfficiency = calculateParallelEfficiency(executions);

  // Calculate data consistency
  const dataConsistency = calculateDataConsistency(executions);

  // Calculate agent synchronization
  const agentSynchronization = calculateAgentSynchronization(executions);

  return {
    totalProcessingTime,
    parallelEfficiency: Math.round(parallelEfficiency),
    dataConsistency: Math.round(dataConsistency),
    agentSynchronization: Math.round(agentSynchronization)
  };
}

/**
 * Calculate parallel execution efficiency
 */
function calculateParallelEfficiency(executions: AgentExecution[]): number {
  if (executions.length <= 1) return 100;

  // Find overall execution window
  const startTimes = executions.map(e => new Date(e.startTime).getTime());
  const endTimes = executions.map(e => new Date(e.endTime).getTime());
  
  const overallStart = Math.min(...startTimes);
  const overallEnd = Math.max(...endTimes);
  const overallDuration = overallEnd - overallStart;

  // Calculate total sequential time
  const totalSequentialTime = executions.reduce((sum, execution) => {
    const processingTime = new Date(execution.endTime).getTime() - 
                          new Date(execution.startTime).getTime();
    return sum + processingTime;
  }, 0);

  // Efficiency = (Sequential Time / Parallel Time) / Number of Agents * 100
  const theoreticalParallelTime = totalSequentialTime / executions.length;
  const efficiency = (theoreticalParallelTime / overallDuration) * 100;

  return Math.max(0, Math.min(100, efficiency));
}

/**
 * Calculate data consistency across agents
 */
function calculateDataConsistency(executions: AgentExecution[]): number {
  // Analyze consistency of data sources and outputs
  let consistencyScore = 100;

  // Check for conflicting insights
  const allInsights = executions.flatMap(e => e.keyInsights);
  const uniqueInsights = new Set(allInsights);
  
  // If there are significantly fewer unique insights than total insights,
  // it suggests good consistency (agents are finding similar patterns)
  const consistencyRatio = uniqueInsights.size / allInsights.length;
  
  if (consistencyRatio > 0.8) {
    consistencyScore -= 20; // Too much variation might indicate inconsistency
  } else if (consistencyRatio < 0.3) {
    consistencyScore += 10; // Good consistency
  }

  // Check error patterns
  const totalErrors = executions.reduce((sum, e) => sum + e.errorCount, 0);
  if (totalErrors > executions.length) {
    consistencyScore -= (totalErrors * 5);
  }

  // Check confidence alignment
  const confidences = executions.map(e => e.confidence);
  const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  const confidenceVariance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
  
  if (confidenceVariance > 400) { // High variance in confidence
    consistencyScore -= 15;
  }

  return Math.max(0, Math.min(100, consistencyScore));
}

/**
 * Calculate agent synchronization score
 */
function calculateAgentSynchronization(executions: AgentExecution[]): number {
  if (executions.length <= 1) return 100;

  // Analyze timing overlap and coordination
  let synchronizationScore = 100;

  const startTimes = executions.map(e => new Date(e.startTime).getTime());
  const endTimes = executions.map(e => new Date(e.endTime).getTime());

  // Check for good overlap (agents working in parallel)
  const overallStart = Math.min(...startTimes);
  const overallEnd = Math.max(...endTimes);
  
  let totalOverlapTime = 0;
  for (let i = 0; i < executions.length; i++) {
    for (let j = i + 1; j < executions.length; j++) {
      const overlapStart = Math.max(startTimes[i], startTimes[j]);
      const overlapEnd = Math.min(endTimes[i], endTimes[j]);
      if (overlapEnd > overlapStart) {
        totalOverlapTime += (overlapEnd - overlapStart);
      }
    }
  }

  // Reward good parallelization
  const maxPossibleOverlap = (overallEnd - overallStart) * (executions.length - 1);
  if (maxPossibleOverlap > 0) {
    const overlapRatio = totalOverlapTime / maxPossibleOverlap;
    synchronizationScore += (overlapRatio * 20);
  }

  // Penalize excessive delays between agent starts
  const startTimeSpread = Math.max(...startTimes) - Math.min(...startTimes);
  if (startTimeSpread > 30000) { // More than 30 seconds between starts
    synchronizationScore -= 15;
  }

  return Math.max(0, Math.min(100, synchronizationScore));
}

/**
 * Generate performance summary
 */
function generatePerformanceSummary(
  agentContributions: AgentTrackingResponse['agentContributions'],
  agentExecutions: AgentTrackingRequest['agentExecutions']
): AgentTrackingResponse['performanceSummary'] {
  const agents = Object.entries(agentContributions);
  
  // Find fastest agent (lowest processing time)
  const fastestAgent = agents.reduce((fastest, [name, agent]) => {
    return agent.processingTime < fastest.agent.processingTime ? { name, agent } : fastest;
  }, { name: agents[0][0], agent: agents[0][1] }).name;

  // Find slowest agent (highest processing time)
  const slowestAgent = agents.reduce((slowest, [name, agent]) => {
    return agent.processingTime > slowest.agent.processingTime ? { name, agent } : slowest;
  }, { name: agents[0][0], agent: agents[0][1] }).name;

  // Find most reliable agent (highest confidence)
  const mostReliableAgent = agents.reduce((reliable, [name, agent]) => {
    return agent.confidence > reliable.agent.confidence ? { name, agent } : reliable;
  }, { name: agents[0][0], agent: agents[0][1] }).name;

  // Find highest contributor (highest weighted contribution)
  const highestContributor = agents.reduce((contributor, [name, agent]) => {
    const currentScore = agent.confidence * agent.contributionWeight;
    const bestScore = contributor.agent.confidence * contributor.agent.contributionWeight;
    return currentScore > bestScore ? { name, agent } : contributor;
  }, { name: agents[0][0], agent: agents[0][1] }).name;

  return {
    fastestAgent: formatAgentName(fastestAgent),
    slowestAgent: formatAgentName(slowestAgent),
    mostReliableAgent: formatAgentName(mostReliableAgent),
    highestContributor: formatAgentName(highestContributor)
  };
}

/**
 * Format agent name for display
 */
function formatAgentName(agentKey: string): string {
  const nameMap = {
    infoAgent: 'Information Agent',
    scenarioAgent: 'Scenario Agent',
    impactAgent: 'Impact Agent',
    strategyAgent: 'Strategy Agent'
  };
  
  return nameMap[agentKey as keyof typeof nameMap] || agentKey;
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(
  agentContributions: AgentTrackingResponse['agentContributions'],
  coordinationMetrics: AgentTrackingResponse['coordinationMetrics'],
  agentExecutions: AgentTrackingRequest['agentExecutions']
): string[] {
  const recommendations: string[] = [];

  // Performance recommendations
  const agents = Object.entries(agentContributions);
  const lowPerformingAgents = agents.filter(([_, agent]) => agent.confidence < 70);
  
  if (lowPerformingAgents.length > 0) {
    recommendations.push(
      `Improve performance for ${lowPerformingAgents.map(([name, _]) => formatAgentName(name)).join(', ')} by reviewing data sources and processing algorithms.`
    );
  }

  // Coordination recommendations
  if (coordinationMetrics.parallelEfficiency < 70) {
    recommendations.push(
      'Optimize agent coordination to improve parallel execution efficiency. Consider adjusting agent start times and dependencies.'
    );
  }

  if (coordinationMetrics.dataConsistency < 80) {
    recommendations.push(
      'Improve data consistency across agents by standardizing data sources and validation procedures.'
    );
  }

  // Processing time recommendations
  const slowAgents = agents.filter(([_, agent]) => agent.processingTime > 45000);
  if (slowAgents.length > 0) {
    recommendations.push(
      `Optimize processing time for ${slowAgents.map(([name, _]) => formatAgentName(name)).join(', ')} through caching, algorithm optimization, or resource scaling.`
    );
  }

  // Data quality recommendations
  const lowQualityAgents = agents.filter(([_, agent]) => agent.dataQuality < 75);
  if (lowQualityAgents.length > 0) {
    recommendations.push(
      `Enhance data quality for ${lowQualityAgents.map(([name, _]) => formatAgentName(name)).join(', ')} by improving data validation and source reliability.`
    );
  }

  // Error handling recommendations
  const executions = Object.values(agentExecutions).filter(Boolean) as AgentExecution[];
  const totalErrors = executions.reduce((sum, e) => sum + e.errorCount, 0);
  
  if (totalErrors > 0) {
    recommendations.push(
      'Implement enhanced error handling and retry mechanisms to reduce execution failures.'
    );
  }

  // Default recommendation if no issues found
  if (recommendations.length === 0) {
    recommendations.push(
      'Agent performance is optimal. Continue monitoring for consistency and consider A/B testing new optimization strategies.'
    );
  }

  return recommendations;
}

/**
 * Health check endpoint
 */
http('trackAgentContributionsHealth', (req: Request, res: Response): void => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  res.status(200).json({
    status: 'healthy',
    service: 'track-agent-contributions',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});