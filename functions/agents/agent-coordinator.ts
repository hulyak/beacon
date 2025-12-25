/**
 * Agent Coordinator
 * Orchestrates multiple specialized agents to handle complex requests
 */

import { GeminiClient, getGeminiClient } from '../shared/gemini-client';
import { monitoring } from '../shared/monitoring';
import {
  BaseAgent,
  AgentInput,
  AgentOutput,
  AgentContext,
  AgentRegistry,
} from './base-agent';
import { RiskAnalystAgent } from './risk-analyst';
import { ScenarioPlannerAgent } from './scenario-planner';
import { WebResearcherAgent } from './web-researcher';
import { StrategyAdvisorAgent } from './strategy-advisor';

// Request routing types
export interface CoordinatorRequest {
  query: string;
  intent?: string;
  parameters?: Record<string, unknown>;
  context?: AgentContext;
  agentHints?: string[]; // Suggest which agents to use
}

export interface CoordinatorResponse {
  success: boolean;
  primaryResult: AgentOutput;
  supportingResults?: AgentOutput[];
  synthesizedResponse?: string;
  suggestedActions?: string[];
  totalProcessingTime: number;
}

// Intent to agent mapping
interface IntentMapping {
  primaryAgent: string;
  supportingAgents?: string[];
  requiresSynthesis?: boolean;
}

const INTENT_MAPPINGS: Record<string, IntentMapping> = {
  analyze_risks: {
    primaryAgent: 'risk-analyst',
    supportingAgents: ['web-researcher'],
    requiresSynthesis: true,
  },
  run_scenario: {
    primaryAgent: 'scenario-planner',
    supportingAgents: ['risk-analyst', 'strategy-advisor'],
    requiresSynthesis: true,
  },
  get_alerts: {
    primaryAgent: 'web-researcher',
    supportingAgents: ['risk-analyst'],
    requiresSynthesis: false,
  },
  strategic_advice: {
    primaryAgent: 'strategy-advisor',
    supportingAgents: ['risk-analyst', 'scenario-planner'],
    requiresSynthesis: true,
  },
  web_research: {
    primaryAgent: 'web-researcher',
    requiresSynthesis: false,
  },
  default: {
    primaryAgent: 'risk-analyst',
    requiresSynthesis: false,
  },
};

/**
 * Agent Coordinator class
 * Manages agent lifecycle and orchestrates multi-agent workflows
 */
export class AgentCoordinator {
  private agents: AgentRegistry = {};
  private geminiClient: GeminiClient;
  private initialized: boolean = false;

  constructor(geminiClient?: GeminiClient) {
    this.geminiClient = geminiClient || getGeminiClient();
  }

  /**
   * Initialize all agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const startTime = Date.now();

    try {
      // Register all agents
      this.agents = {
        'risk-analyst': new RiskAnalystAgent(this.geminiClient),
        'scenario-planner': new ScenarioPlannerAgent(this.geminiClient),
        'web-researcher': new WebResearcherAgent(this.geminiClient),
        'strategy-advisor': new StrategyAdvisorAgent(this.geminiClient),
      };

      this.initialized = true;

      monitoring.recordEvent('agent-coordinator', 'initialized', 'info', {
        agentCount: Object.keys(this.agents).length,
        agents: Object.keys(this.agents),
        duration: Date.now() - startTime,
      });
    } catch (error) {
      monitoring.recordEvent('agent-coordinator', 'initialization_failed', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process a request by routing to appropriate agents
   */
  async process(request: CoordinatorRequest): Promise<CoordinatorResponse> {
    const startTime = Date.now();
    const requestId = `coord_${Date.now()}`;

    // Ensure initialization
    if (!this.initialized) {
      await this.initialize();
    }

    monitoring.recordEvent('agent-coordinator', 'request_received', 'info', {
      requestId,
      intent: request.intent,
      queryLength: request.query.length,
    });

    try {
      // Determine which agents to use
      const mapping = this.getIntentMapping(request);

      // Create agent input
      const agentInput: AgentInput = {
        query: request.query,
        parameters: request.parameters,
        context: {
          ...request.context,
          requestId,
        },
      };

      // Run primary agent
      const primaryAgent = this.agents[mapping.primaryAgent];
      if (!primaryAgent) {
        throw new Error(`Primary agent '${mapping.primaryAgent}' not found`);
      }

      const primaryResult = await primaryAgent.process(agentInput);

      // Track supporting results
      const supportingResults: AgentOutput[] = [];

      // Run supporting agents if configured and primary succeeded
      if (primaryResult.success && mapping.supportingAgents?.length) {
        // Add primary result to context for supporting agents
        const supportingContext: AgentContext = {
          ...agentInput.context,
          previousAgentOutputs: [primaryResult],
        };

        // Run supporting agents in parallel
        const supportingPromises = mapping.supportingAgents.map(async (agentName) => {
          const agent = this.agents[agentName];
          if (!agent) {
            console.warn(`Supporting agent '${agentName}' not found`);
            return null;
          }

          try {
            return await agent.process({
              ...agentInput,
              context: supportingContext,
            });
          } catch (error) {
            console.error(`Supporting agent '${agentName}' failed:`, error);
            return null;
          }
        });

        const results = await Promise.all(supportingPromises);
        supportingResults.push(...results.filter((r): r is AgentOutput => r !== null));
      }

      // Synthesize results if needed
      let synthesizedResponse: string | undefined;
      if (mapping.requiresSynthesis && supportingResults.length > 0) {
        synthesizedResponse = await this.synthesizeResults(
          primaryResult,
          supportingResults,
          request.query
        );
      }

      // Collect suggested actions
      const suggestedActions = this.collectSuggestedActions(primaryResult, supportingResults);

      const totalProcessingTime = Date.now() - startTime;

      monitoring.recordEvent('agent-coordinator', 'request_completed', 'info', {
        requestId,
        success: primaryResult.success,
        primaryAgent: mapping.primaryAgent,
        supportingAgentCount: supportingResults.length,
        totalProcessingTime,
      });

      return {
        success: primaryResult.success,
        primaryResult,
        supportingResults: supportingResults.length > 0 ? supportingResults : undefined,
        synthesizedResponse,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
        totalProcessingTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      monitoring.recordEvent('agent-coordinator', 'request_failed', 'error', {
        requestId,
        error: errorMessage,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        primaryResult: {
          agentName: 'coordinator',
          success: false,
          data: null,
          confidence: 0,
          processingTime: Date.now() - startTime,
          error: errorMessage,
        },
        totalProcessingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Route directly to a specific agent
   */
  async routeToAgent(agentName: string, input: AgentInput): Promise<AgentOutput> {
    if (!this.initialized) {
      await this.initialize();
    }

    const agent = this.agents[agentName];
    if (!agent) {
      throw new Error(`Agent '${agentName}' not found`);
    }

    return agent.process(input);
  }

  /**
   * Get agent by name
   */
  getAgent(agentName: string): BaseAgent | undefined {
    return this.agents[agentName];
  }

  /**
   * Get all registered agent names
   */
  getAgentNames(): string[] {
    return Object.keys(this.agents);
  }

  /**
   * Get metadata for all agents
   */
  getAgentMetadata(): Record<string, ReturnType<BaseAgent['getMetadata']>> {
    const metadata: Record<string, ReturnType<BaseAgent['getMetadata']>> = {};
    for (const [name, agent] of Object.entries(this.agents)) {
      metadata[name] = agent.getMetadata();
    }
    return metadata;
  }

  /**
   * Determine intent mapping for a request
   */
  private getIntentMapping(request: CoordinatorRequest): IntentMapping {
    // Use explicit intent if provided
    if (request.intent && INTENT_MAPPINGS[request.intent]) {
      return INTENT_MAPPINGS[request.intent];
    }

    // Use agent hints if provided
    if (request.agentHints?.length) {
      return {
        primaryAgent: request.agentHints[0],
        supportingAgents: request.agentHints.slice(1),
        requiresSynthesis: request.agentHints.length > 1,
      };
    }

    // Try to infer intent from query
    const inferredIntent = this.inferIntent(request.query);
    return INTENT_MAPPINGS[inferredIntent] || INTENT_MAPPINGS.default;
  }

  /**
   * Infer intent from query text
   */
  private inferIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes('risk') ||
      lowerQuery.includes('threat') ||
      lowerQuery.includes('vulnerability')
    ) {
      return 'analyze_risks';
    }

    if (
      lowerQuery.includes('scenario') ||
      lowerQuery.includes('what if') ||
      lowerQuery.includes('simulate') ||
      lowerQuery.includes('what would happen')
    ) {
      return 'run_scenario';
    }

    if (
      lowerQuery.includes('alert') ||
      lowerQuery.includes('notification') ||
      lowerQuery.includes('urgent') ||
      lowerQuery.includes('critical')
    ) {
      return 'get_alerts';
    }

    if (
      lowerQuery.includes('strategy') ||
      lowerQuery.includes('recommend') ||
      lowerQuery.includes('advice') ||
      lowerQuery.includes('suggest') ||
      lowerQuery.includes('mitigation')
    ) {
      return 'strategic_advice';
    }

    if (
      lowerQuery.includes('news') ||
      lowerQuery.includes('latest') ||
      lowerQuery.includes('current events') ||
      lowerQuery.includes('research')
    ) {
      return 'web_research';
    }

    return 'default';
  }

  /**
   * Synthesize results from multiple agents into a coherent response
   */
  private async synthesizeResults(
    primaryResult: AgentOutput,
    supportingResults: AgentOutput[],
    originalQuery: string
  ): Promise<string> {
    try {
      const synthesisPrompt = `Synthesize the following agent analyses into a coherent response.

Original Query: ${originalQuery}

Primary Analysis (${primaryResult.agentName}):
${JSON.stringify(primaryResult.data, null, 2)}

Supporting Analyses:
${supportingResults.map(r => `[${r.agentName}]: ${JSON.stringify(r.data, null, 2)}`).join('\n\n')}

Provide a unified, actionable summary that:
1. Highlights the key findings from all analyses
2. Identifies any conflicting or complementary insights
3. Provides clear recommendations
4. Keeps the response concise (3-4 sentences)`;

      const response = await this.geminiClient.generateSupplyChainAnalysis(
        synthesisPrompt,
        'You are a supply chain intelligence synthesizer. Combine multiple expert analyses into clear, actionable insights.'
      );

      return response;
    } catch (error) {
      console.error('Synthesis failed:', error);
      // Return primary result reasoning as fallback
      return primaryResult.reasoning || 'Analysis complete. See detailed results above.';
    }
  }

  /**
   * Collect and deduplicate suggested actions from all agents
   */
  private collectSuggestedActions(
    primaryResult: AgentOutput,
    supportingResults: AgentOutput[]
  ): string[] {
    const actions = new Set<string>();

    if (primaryResult.suggestedFollowUp) {
      for (const action of primaryResult.suggestedFollowUp) {
        actions.add(action);
      }
    }

    for (const result of supportingResults) {
      if (result.suggestedFollowUp) {
        for (const action of result.suggestedFollowUp) {
          actions.add(action);
        }
      }
    }

    return Array.from(actions).slice(0, 5); // Limit to 5 actions
  }
}

/**
 * Singleton instance
 */
let coordinatorInstance: AgentCoordinator | null = null;

export function getAgentCoordinator(): AgentCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new AgentCoordinator();
  }
  return coordinatorInstance;
}

/**
 * Initialize the coordinator (call at function startup)
 */
export async function initializeAgentCoordinator(): Promise<AgentCoordinator> {
  const coordinator = getAgentCoordinator();
  await coordinator.initialize();
  return coordinator;
}
