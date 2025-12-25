"use strict";
/**
 * Base Agent class for the Multi-Agent Architecture
 * All specialized agents extend this base class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
exports.agentHasCapability = agentHasCapability;
const monitoring_1 = require("../shared/monitoring");
/**
 * Abstract base class for all specialized agents
 */
class BaseAgent {
    constructor(geminiClient) {
        this.maxRetries = 2;
        this.geminiClient = geminiClient;
    }
    /**
     * Get agent metadata for coordination
     */
    getMetadata() {
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
    getInputSchema() {
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
    getOutputSchema() {
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
    buildPrompt(input) {
        const parts = [];
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
    async callGemini(prompt, options = {}) {
        const startTime = Date.now();
        const requestId = `${this.name}_${Date.now()}`;
        try {
            monitoring_1.monitoring.recordEvent(this.name, 'gemini_call_start', 'info', {
                promptLength: prompt.length,
                requestId,
            });
            const response = await this.geminiClient.generateSupplyChainAnalysis(prompt, this.systemPrompt);
            const duration = Date.now() - startTime;
            monitoring_1.monitoring.recordEvent(this.name, 'gemini_call_success', 'info', {
                responseLength: response.length,
                duration,
                requestId,
            });
            return response;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            monitoring_1.monitoring.recordEvent(this.name, 'gemini_call_failure', 'error', {
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
    createSuccessOutput(data, confidence, startTime, options = {}) {
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
    createErrorOutput(error, startTime, partialData) {
        const errorMessage = error instanceof Error ? error.message : error;
        monitoring_1.monitoring.recordEvent(this.name, 'agent_error', 'error', {
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
    validateInput(input) {
        const errors = [];
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
    parseJSON(response, fallback) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            // Try parsing the entire response
            return JSON.parse(response);
        }
        catch {
            if (fallback !== undefined) {
                return fallback;
            }
            return null;
        }
    }
}
exports.BaseAgent = BaseAgent;
/**
 * Type guard for checking if an agent can handle a specific capability
 */
function agentHasCapability(agent, capability) {
    return agent.capabilities.includes(capability);
}
//# sourceMappingURL=base-agent.js.map