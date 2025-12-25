/**
 * Multi-Agent Architecture Exports
 * Provides centralized access to all agent functionality
 */

// Base agent and types
export { BaseAgent, agentHasCapability } from './base-agent';
export type {
  AgentInput,
  AgentOutput,
  AgentContext,
  AgentMetadata,
  AgentRegistry,
  ConversationMessage,
  SupplyChainState,
  RegionState,
  UserPreferences,
} from './base-agent';

// Agent coordinator
export { AgentCoordinator, getAgentCoordinator, initializeAgentCoordinator } from './agent-coordinator';
export type { CoordinatorRequest, CoordinatorResponse } from './agent-coordinator';

// Specialized agents
export { RiskAnalystAgent } from './risk-analyst';
export { ScenarioPlannerAgent } from './scenario-planner';
export type { CascadeStep } from './scenario-planner';
export { WebResearcherAgent } from './web-researcher';
export { StrategyAdvisorAgent } from './strategy-advisor';

// Agent types for type-safe agent selection
export type AgentType =
  | 'risk-analyst'
  | 'scenario-planner'
  | 'web-researcher'
  | 'strategy-advisor';

export const AGENT_TYPES: AgentType[] = [
  'risk-analyst',
  'scenario-planner',
  'web-researcher',
  'strategy-advisor',
];

// Agent descriptions for UI/documentation
export const AGENT_DESCRIPTIONS: Record<AgentType, string> = {
  'risk-analyst': 'Analyzes supply chain risks across regions and categories',
  'scenario-planner': 'Runs what-if scenarios and develops contingency plans',
  'web-researcher': 'Gathers real-time intelligence from web sources',
  'strategy-advisor': 'Provides strategic recommendations and mitigation strategies',
};

// Agent capabilities map for routing decisions
export const AGENT_CAPABILITIES: Record<AgentType, string[]> = {
  'risk-analyst': [
    'risk_assessment',
    'regional_analysis',
    'threat_identification',
    'risk_scoring',
    'trend_analysis',
  ],
  'scenario-planner': [
    'scenario_simulation',
    'contingency_planning',
    'impact_analysis',
    'cascade_modeling',
    'recovery_planning',
  ],
  'web-researcher': [
    'web_search',
    'news_monitoring',
    'geopolitical_scanning',
    'supplier_tracking',
    'real_time_alerts',
  ],
  'strategy-advisor': [
    'strategic_planning',
    'mitigation_strategies',
    'resource_allocation',
    'cost_benefit_analysis',
    'implementation_planning',
  ],
};

/**
 * Find agents with a specific capability
 */
export function findAgentsWithCapability(capability: string): AgentType[] {
  const result: AgentType[] = [];

  for (const [agentType, capabilities] of Object.entries(AGENT_CAPABILITIES)) {
    if (capabilities.includes(capability)) {
      result.push(agentType as AgentType);
    }
  }

  return result;
}

/**
 * Get recommended agent for a specific task
 */
export function getRecommendedAgent(task: string): AgentType {
  const lower = task.toLowerCase();

  if (
    lower.includes('risk') ||
    lower.includes('threat') ||
    lower.includes('vulnerability')
  ) {
    return 'risk-analyst';
  }

  if (
    lower.includes('scenario') ||
    lower.includes('simulation') ||
    lower.includes('what if') ||
    lower.includes('cascade')
  ) {
    return 'scenario-planner';
  }

  if (
    lower.includes('news') ||
    lower.includes('web') ||
    lower.includes('search') ||
    lower.includes('geopolitical')
  ) {
    return 'web-researcher';
  }

  if (
    lower.includes('strategy') ||
    lower.includes('recommend') ||
    lower.includes('mitigat') ||
    lower.includes('plan')
  ) {
    return 'strategy-advisor';
  }

  // Default to risk analyst
  return 'risk-analyst';
}
