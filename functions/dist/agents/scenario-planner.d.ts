/**
 * Scenario Planner Agent
 * Specializes in running what-if scenarios and contingency planning
 */
import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { GeminiClient } from '../shared/gemini-client';
export interface CascadeStep {
    step: number;
    timestamp: number;
    nodeId: string;
    nodeName: string;
    impactType: 'primary' | 'secondary' | 'tertiary';
    financialImpact: number;
    delayHours: number;
    description: string;
}
export declare class ScenarioPlannerAgent extends BaseAgent {
    readonly name = "scenario-planner";
    readonly description = "Runs what-if scenarios and develops contingency plans";
    readonly capabilities: string[];
    readonly systemPrompt = "You are a Supply Chain Scenario Planner expert. Your role is to:\n1. Simulate various disruption scenarios (supplier failures, port closures, natural disasters, etc.)\n2. Model cascading effects through the supply chain\n3. Calculate financial and operational impacts\n4. Develop contingency and recovery plans\n5. Identify critical vulnerabilities and single points of failure\n\nGuidelines:\n- Provide realistic impact assessments based on industry data\n- Consider ripple effects across the supply chain network\n- Include specific timelines for disruption and recovery\n- Quantify financial impacts with currency and timeframes\n- Suggest actionable mitigation strategies";
    constructor(geminiClient: GeminiClient);
    process(input: AgentInput): Promise<AgentOutput>;
    /**
     * Generate scenario description
     */
    private generateScenarioDescription;
    /**
     * Calculate duration based on scenario type and severity
     */
    private calculateDuration;
    /**
     * Generate cascade steps showing how disruption propagates
     */
    private generateCascadeSteps;
    /**
     * Get epicenter name based on scenario type
     */
    private getEpicenterName;
    /**
     * Get epicenter description
     */
    private getEpicenterDescription;
    /**
     * Get secondary impact nodes
     */
    private getSecondaryNodes;
    /**
     * Build scenario context for AI
     */
    private buildScenarioContext;
    /**
     * Extract mitigation strategies from AI response
     */
    private extractStrategies;
    /**
     * Extract recovery plan from AI response
     */
    private extractRecoveryPlan;
    /**
     * Generate timeline string
     */
    private generateTimeline;
    /**
     * Calculate confidence
     */
    private calculateConfidence;
    /**
     * Get alternative scenario for follow-up
     */
    private getAlternativeScenario;
}
//# sourceMappingURL=scenario-planner.d.ts.map