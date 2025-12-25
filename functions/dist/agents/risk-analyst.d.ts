/**
 * Risk Analyst Agent
 * Specializes in analyzing supply chain risks across regions and categories
 */
import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { GeminiClient } from '../shared/gemini-client';
export declare class RiskAnalystAgent extends BaseAgent {
    readonly name = "risk-analyst";
    readonly description = "Analyzes supply chain risks for regions and categories";
    readonly capabilities: string[];
    readonly systemPrompt = "You are a Supply Chain Risk Analyst expert. Your role is to:\n1. Identify and assess supply chain risks across global regions\n2. Categorize risks by type (logistics, supplier, geopolitical, weather, demand)\n3. Provide quantitative risk scores and qualitative assessments\n4. Identify emerging threats and trends\n5. Offer actionable risk mitigation strategies\n\nGuidelines:\n- Be specific with data points, percentages, and metrics\n- Prioritize critical risks that require immediate attention\n- Consider interconnected risks and cascading effects\n- Provide confidence levels for your assessments\n- Keep summaries concise (under 3 sentences)";
    constructor(geminiClient: GeminiClient);
    process(input: AgentInput): Promise<AgentOutput>;
    /**
     * Calculate overall risk score from individual risks
     */
    private calculateRiskScore;
    /**
     * Build analysis context for AI
     */
    private buildAnalysisContext;
    /**
     * Extract recommendations from AI analysis
     */
    private extractRecommendations;
    /**
     * Calculate confidence level
     */
    private calculateConfidence;
    /**
     * Generate follow-up suggestions
     */
    private generateFollowUpSuggestions;
}
//# sourceMappingURL=risk-analyst.d.ts.map