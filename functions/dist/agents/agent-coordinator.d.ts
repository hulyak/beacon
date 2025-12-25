/**
 * Agent Coordinator
 * Orchestrates multiple specialized agents to handle complex requests
 */
import { GeminiClient } from '../shared/gemini-client';
import { BaseAgent, AgentInput, AgentOutput, AgentContext } from './base-agent';
export interface CoordinatorRequest {
    query: string;
    intent?: string;
    parameters?: Record<string, unknown>;
    context?: AgentContext;
    agentHints?: string[];
}
export interface CoordinatorResponse {
    success: boolean;
    primaryResult: AgentOutput;
    supportingResults?: AgentOutput[];
    synthesizedResponse?: string;
    suggestedActions?: string[];
    totalProcessingTime: number;
}
/**
 * Agent Coordinator class
 * Manages agent lifecycle and orchestrates multi-agent workflows
 */
export declare class AgentCoordinator {
    private agents;
    private geminiClient;
    private initialized;
    constructor(geminiClient?: GeminiClient);
    /**
     * Initialize all agents
     */
    initialize(): Promise<void>;
    /**
     * Process a request by routing to appropriate agents
     */
    process(request: CoordinatorRequest): Promise<CoordinatorResponse>;
    /**
     * Route directly to a specific agent
     */
    routeToAgent(agentName: string, input: AgentInput): Promise<AgentOutput>;
    /**
     * Get agent by name
     */
    getAgent(agentName: string): BaseAgent | undefined;
    /**
     * Get all registered agent names
     */
    getAgentNames(): string[];
    /**
     * Get metadata for all agents
     */
    getAgentMetadata(): Record<string, ReturnType<BaseAgent['getMetadata']>>;
    /**
     * Determine intent mapping for a request
     */
    private getIntentMapping;
    /**
     * Infer intent from query text
     */
    private inferIntent;
    /**
     * Synthesize results from multiple agents into a coherent response
     */
    private synthesizeResults;
    /**
     * Collect and deduplicate suggested actions from all agents
     */
    private collectSuggestedActions;
}
export declare function getAgentCoordinator(): AgentCoordinator;
/**
 * Initialize the coordinator (call at function startup)
 */
export declare function initializeAgentCoordinator(): Promise<AgentCoordinator>;
//# sourceMappingURL=agent-coordinator.d.ts.map