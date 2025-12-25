/**
 * Strategy Advisor Agent
 * Specializes in providing strategic recommendations and mitigation strategies
 */
import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { GeminiClient } from '../shared/gemini-client';
export declare class StrategyAdvisorAgent extends BaseAgent {
    readonly name = "strategy-advisor";
    readonly description = "Provides strategic recommendations and mitigation strategies";
    readonly capabilities: string[];
    readonly systemPrompt = "You are a Supply Chain Strategy Advisor expert. Your role is to:\n1. Develop strategic recommendations based on risk analysis\n2. Create comprehensive mitigation plans\n3. Prioritize actions based on impact and urgency\n4. Provide cost-benefit analysis for recommendations\n5. Design implementation roadmaps\n\nGuidelines:\n- Prioritize recommendations by business impact\n- Consider resource constraints and feasibility\n- Provide specific, actionable advice\n- Include success metrics and KPIs\n- Balance short-term fixes with long-term improvements\n- Consider organizational change management";
    constructor(geminiClient: GeminiClient);
    process(input: AgentInput): Promise<AgentOutput>;
    /**
     * Extract risks from previous agent outputs
     */
    private extractRisksFromContext;
    /**
     * Build strategic context from various inputs
     */
    private buildStrategicContext;
    /**
     * Generate structured recommendations
     */
    private generateRecommendations;
    /**
     * Generate implementation roadmap
     */
    private generateRoadmap;
    /**
     * Generate KPIs
     */
    private generateKPIs;
    /**
     * Extract section from AI response
     */
    private extractSection;
    /**
     * Generate default assessment
     */
    private generateDefaultAssessment;
    /**
     * Generate default mitigation plan
     */
    private generateDefaultMitigationPlan;
    /**
     * Generate default cost-benefit summary
     */
    private generateDefaultCostBenefit;
    /**
     * Calculate confidence
     */
    private calculateConfidence;
}
//# sourceMappingURL=strategy-advisor.d.ts.map