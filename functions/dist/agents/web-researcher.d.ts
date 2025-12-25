/**
 * Web Researcher Agent
 * Specializes in gathering real-time intelligence from web sources using Tavily
 */
import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { GeminiClient } from '../shared/gemini-client';
export declare class WebResearcherAgent extends BaseAgent {
    readonly name = "web-researcher";
    readonly description = "Gathers real-time supply chain intelligence from web sources";
    readonly capabilities: string[];
    readonly systemPrompt = "You are a Supply Chain Intelligence Researcher. Your role is to:\n1. Monitor real-time news and events affecting supply chains\n2. Track supplier activities and market changes\n3. Identify emerging geopolitical risks\n4. Synthesize information from multiple web sources\n5. Provide actionable intelligence summaries\n\nGuidelines:\n- Focus on recent, credible news sources\n- Distinguish between confirmed reports and speculation\n- Highlight time-sensitive information\n- Provide source attribution for key claims\n- Flag high-impact developments requiring immediate attention";
    private tavilyClient;
    constructor(geminiClient: GeminiClient);
    process(input: AgentInput): Promise<AgentOutput>;
    /**
     * Generate AI-powered summary of research findings
     */
    private generateSummary;
    /**
     * Deduplicate risks by similarity
     */
    private deduplicateRisks;
    /**
     * Calculate confidence based on data quality
     */
    private calculateConfidence;
    /**
     * Generate follow-up suggestions
     */
    private generateFollowUpSuggestions;
    /**
     * Fallback risks when Tavily is not available
     */
    private getFallbackRisks;
    /**
     * Fallback geopolitical alerts
     */
    private getFallbackGeopoliticalAlerts;
}
//# sourceMappingURL=web-researcher.d.ts.map