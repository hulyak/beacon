/**
 * Base Agent class for the Multi-Agent Architecture
 * All specialized agents extend this base class
 */

import { GeminiClient } from '../shared/gemini-client';
import { monitoring } from '../shared/monitoring';

// Agent input/output types
export interface AgentInput {
  query: string;
  parameters?: Record<string, unknown>;
  context?: AgentContext;
}

export interface AgentContext {
  conversationHistory?: ConversationMessage[];
  supplyChainState?: SupplyChainState;
  previousAgentOutputs?: AgentOutput[];
  userPreferences?: UserPreferences;
  requestId?: string;
}

export interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentName?: string;
}

export interface SupplyChainState {
  regions: RegionState[];
  activeAlerts: number;
  criticalNodes: string[];
  lastUpdated: Date;
}

export interface RegionState {
  name: string;
  riskLevel: number;
  activeRisks: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface UserPreferences {
  defaultRegion?: string;
  alertPriority?: string;
  detailLevel?: 'brief' | 'standard' | 'detailed';
}

export interface AgentOutput {
  agentName: string;
  success: boolean;
  data: unknown;
  confidence: number;
  reasoning?: string;
  suggestedFollowUp?: string[];
  processingTime: number;
  error?: string;
}

export interface AgentMetadata {
  name: string;
  description: string;
  capabilities: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

/**
 * Abstract base class for all specialized agents
 */
export abstract class BaseAgent {
  protected geminiClient: GeminiClient;
  protected readonly maxRetries: number = 2;

  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly systemPrompt: string;
  abstract readonly capabilities: string[];

  constructor(geminiClient: GeminiClient) {
    this.geminiClient = geminiClient;
  }

  /**
   * Main processing method - must be implemented by subclasses
   */
  abstract process(input: AgentInput): Promise<AgentOutput>;

  /**
   * Get agent metadata for coordination
   */
  getMetadata(): AgentMetadata {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
      inputSchema: this.getInputSchema(),
      outputSchema: this.getOutputSchema(),
    };
  }

  /**
   * Define input schema - can be overridden by subclasses
   */
  protected getInputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        query: { type: 'string' },
        parameters: { type: 'object' },
        context: { type: 'object' },
      },
      required: ['query'],
    };
  }

  /**
   * Define output schema - can be overridden by subclasses
   */
  protected getOutputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        agentName: { type: 'string' },
        success: { type: 'boolean' },
        data: { type: 'object' },
        confidence: { type: 'number' },
        reasoning: { type: 'string' },
        suggestedFollowUp: { type: 'array' },
        processingTime: { type: 'number' },
      },
    };
  }

  /**
   * Build the full prompt with system context and conversation history
   */
  protected buildPrompt(input: AgentInput): string {
    const parts: string[] = [];

    // Add conversation history if available
    if (input.context?.conversationHistory?.length) {
      parts.push('Previous conversation:');
      const recentHistory = input.context.conversationHistory.slice(-5);
      for (const msg of recentHistory) {
        parts.push(`${msg.role}: ${msg.content}`);
      }
      parts.push('');
    }

    // Add supply chain state if available
    if (input.context?.supplyChainState) {
      parts.push('Current supply chain state:');
      const state = input.context.supplyChainState;
      parts.push(`- Active alerts: ${state.activeAlerts}`);
      parts.push(`- Critical nodes: ${state.criticalNodes.join(', ') || 'None'}`);
      for (const region of state.regions) {
        parts.push(`- ${region.name}: ${region.status} (risk level ${region.riskLevel}%)`);
      }
      parts.push('');
    }

    // Add previous agent outputs if in a multi-agent chain
    if (input.context?.previousAgentOutputs?.length) {
      parts.push('Previous agent analyses:');
      for (const output of input.context.previousAgentOutputs) {
        parts.push(`[${output.agentName}]: ${JSON.stringify(output.data).substring(0, 200)}`);
      }
      parts.push('');
    }

    // Add user preferences
    if (input.context?.userPreferences) {
      const prefs = input.context.userPreferences;
      if (prefs.defaultRegion) {
        parts.push(`User's default region: ${prefs.defaultRegion}`);
      }
      if (prefs.detailLevel) {
        parts.push(`Response detail level: ${prefs.detailLevel}`);
      }
    }

    // Add the main query
    parts.push('Current query:');
    parts.push(input.query);

    // Add parameters if any
    if (input.parameters && Object.keys(input.parameters).length > 0) {
      parts.push('');
      parts.push('Parameters:');
      parts.push(JSON.stringify(input.parameters, null, 2));
    }

    return parts.join('\n');
  }

  /**
   * Call Gemini with retry and monitoring
   */
  protected async callGemini(
    prompt: string,
    options: {
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<string> {
    const startTime = Date.now();
    const requestId = `${this.name}_${Date.now()}`;

    try {
      monitoring.recordEvent(this.name, 'gemini_call_start', 'info', {
        promptLength: prompt.length,
        requestId,
      });

      const response = await this.geminiClient.generateSupplyChainAnalysis(
        prompt,
        this.systemPrompt
      );

      const duration = Date.now() - startTime;
      monitoring.recordEvent(this.name, 'gemini_call_success', 'info', {
        responseLength: response.length,
        duration,
        requestId,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitoring.recordEvent(this.name, 'gemini_call_failure', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        requestId,
      });
      throw error;
    }
  }

  /**
   * Create a success output
   */
  protected createSuccessOutput(
    data: unknown,
    confidence: number,
    startTime: number,
    options: {
      reasoning?: string;
      suggestedFollowUp?: string[];
    } = {}
  ): AgentOutput {
    return {
      agentName: this.name,
      success: true,
      data,
      confidence: Math.min(Math.max(confidence, 0), 100),
      reasoning: options.reasoning,
      suggestedFollowUp: options.suggestedFollowUp,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Create an error output
   */
  protected createErrorOutput(
    error: Error | string,
    startTime: number,
    partialData?: unknown
  ): AgentOutput {
    const errorMessage = error instanceof Error ? error.message : error;

    monitoring.recordEvent(this.name, 'agent_error', 'error', {
      error: errorMessage,
    });

    return {
      agentName: this.name,
      success: false,
      data: partialData || null,
      confidence: 0,
      processingTime: Date.now() - startTime,
      error: errorMessage,
    };
  }

  /**
   * Validate input parameters
   */
  protected validateInput(input: AgentInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.query || typeof input.query !== 'string') {
      errors.push('Query is required and must be a string');
    }

    if (input.query && input.query.length > 10000) {
      errors.push('Query exceeds maximum length of 10000 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse JSON from AI response with error handling
   */
  protected parseJSON<T>(response: string, fallback?: T): T | null {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }

      // Try parsing the entire response
      return JSON.parse(response) as T;
    } catch {
      if (fallback !== undefined) {
        return fallback;
      }
      return null;
    }
  }
}

/**
 * Type guard for checking if an agent can handle a specific capability
 */
export function agentHasCapability(agent: BaseAgent, capability: string): boolean {
  return agent.capabilities.includes(capability);
}

/**
 * Interface for agent registration
 */
export interface AgentRegistry {
  [agentName: string]: BaseAgent;
}
