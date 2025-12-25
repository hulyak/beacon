/**
 * Base Agent class for the Multi-Agent Architecture
 * All specialized agents extend this base class
 */
import { GeminiClient } from '../shared/gemini-client';
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
export declare abstract class BaseAgent {
    protected geminiClient: GeminiClient;
    protected readonly maxRetries: number;
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly systemPrompt: string;
    abstract readonly capabilities: string[];
    constructor(geminiClient: GeminiClient);
    /**
     * Main processing method - must be implemented by subclasses
     */
    abstract process(input: AgentInput): Promise<AgentOutput>;
    /**
     * Get agent metadata for coordination
     */
    getMetadata(): AgentMetadata;
    /**
     * Define input schema - can be overridden by subclasses
     */
    protected getInputSchema(): Record<string, unknown>;
    /**
     * Define output schema - can be overridden by subclasses
     */
    protected getOutputSchema(): Record<string, unknown>;
    /**
     * Build the full prompt with system context and conversation history
     */
    protected buildPrompt(input: AgentInput): string;
    /**
     * Call Gemini with retry and monitoring
     */
    protected callGemini(prompt: string, options?: {
        temperature?: number;
        maxOutputTokens?: number;
    }): Promise<string>;
    /**
     * Create a success output
     */
    protected createSuccessOutput(data: unknown, confidence: number, startTime: number, options?: {
        reasoning?: string;
        suggestedFollowUp?: string[];
    }): AgentOutput;
    /**
     * Create an error output
     */
    protected createErrorOutput(error: Error | string, startTime: number, partialData?: unknown): AgentOutput;
    /**
     * Validate input parameters
     */
    protected validateInput(input: AgentInput): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Parse JSON from AI response with error handling
     */
    protected parseJSON<T>(response: string, fallback?: T): T | null;
}
/**
 * Type guard for checking if an agent can handle a specific capability
 */
export declare function agentHasCapability(agent: BaseAgent, capability: string): boolean;
/**
 * Interface for agent registration
 */
export interface AgentRegistry {
    [agentName: string]: BaseAgent;
}
//# sourceMappingURL=base-agent.d.ts.map