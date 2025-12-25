/**
 * Multi-Agent Architecture Exports
 * Provides centralized access to all agent functionality
 */
export { BaseAgent, agentHasCapability } from './base-agent';
export type { AgentInput, AgentOutput, AgentContext, AgentMetadata, AgentRegistry, ConversationMessage, SupplyChainState, RegionState, UserPreferences, } from './base-agent';
export { AgentCoordinator, getAgentCoordinator, initializeAgentCoordinator } from './agent-coordinator';
export type { CoordinatorRequest, CoordinatorResponse } from './agent-coordinator';
export { RiskAnalystAgent } from './risk-analyst';
export { ScenarioPlannerAgent } from './scenario-planner';
export type { CascadeStep } from './scenario-planner';
export { WebResearcherAgent } from './web-researcher';
export { StrategyAdvisorAgent } from './strategy-advisor';
export type AgentType = 'risk-analyst' | 'scenario-planner' | 'web-researcher' | 'strategy-advisor';
export declare const AGENT_TYPES: AgentType[];
export declare const AGENT_DESCRIPTIONS: Record<AgentType, string>;
export declare const AGENT_CAPABILITIES: Record<AgentType, string[]>;
/**
 * Find agents with a specific capability
 */
export declare function findAgentsWithCapability(capability: string): AgentType[];
/**
 * Get recommended agent for a specific task
 */
export declare function getRecommendedAgent(task: string): AgentType;
//# sourceMappingURL=index.d.ts.map