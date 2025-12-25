/**
 * Scenario Planner Agent
 * Specializes in running what-if scenarios and contingency planning
 */

import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { GeminiClient } from '../shared/gemini-client';
import {
  getScenarioTemplate,
  calculateScenarioImpact,
  generateScenarioOutcomes,
  getRegionData,
} from '../shared/supply-chain-data';
import { ScenarioType, Region, Scenario, Outcome, FinancialImpact } from '../shared/types';

interface ScenarioResult {
  scenario: Scenario;
  outcomes: Outcome[];
  financialImpact: FinancialImpact;
  timeline: string;
  cascadeSteps: CascadeStep[];
  mitigationStrategies: string[];
  recoveryPlan: string;
}

export interface CascadeStep {
  step: number;
  timestamp: number; // ms from start
  nodeId: string;
  nodeName: string;
  impactType: 'primary' | 'secondary' | 'tertiary';
  financialImpact: number;
  delayHours: number;
  description: string;
}

export class ScenarioPlannerAgent extends BaseAgent {
  readonly name = 'scenario-planner';
  readonly description = 'Runs what-if scenarios and develops contingency plans';
  readonly capabilities = [
    'scenario_simulation',
    'contingency_planning',
    'impact_analysis',
    'cascade_modeling',
    'recovery_planning',
  ];

  readonly systemPrompt = `You are a Supply Chain Scenario Planner expert. Your role is to:
1. Simulate various disruption scenarios (supplier failures, port closures, natural disasters, etc.)
2. Model cascading effects through the supply chain
3. Calculate financial and operational impacts
4. Develop contingency and recovery plans
5. Identify critical vulnerabilities and single points of failure

Guidelines:
- Provide realistic impact assessments based on industry data
- Consider ripple effects across the supply chain network
- Include specific timelines for disruption and recovery
- Quantify financial impacts with currency and timeframes
- Suggest actionable mitigation strategies`;

  constructor(geminiClient: GeminiClient) {
    super(geminiClient);
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();

    // Validate input
    const validation = this.validateInput(input);
    if (!validation.valid) {
      return this.createErrorOutput(validation.errors.join('; '), startTime);
    }

    try {
      // Extract parameters
      const scenarioType = input.parameters?.scenarioType as ScenarioType;
      const region = (input.parameters?.region as Region) || 'asia';
      const severity = (input.parameters?.severity as string) || 'moderate';

      if (!scenarioType) {
        return this.createErrorOutput('Scenario type is required', startTime);
      }

      // Get scenario template
      const template = getScenarioTemplate(scenarioType);
      if (!template) {
        return this.createErrorOutput(`Unknown scenario type: ${scenarioType}`, startTime);
      }

      // Get region data
      const regionData = getRegionData(region);

      // Generate base scenario
      const scenario: Scenario = {
        id: `scen_${Date.now()}`,
        type: scenarioType,
        name: template.name,
        description: this.generateScenarioDescription(template, region, severity),
        duration: this.calculateDuration(scenarioType, severity),
        affectedRegions: [regionData?.name || region],
      };

      // Calculate impacts
      const outcomes = generateScenarioOutcomes(scenarioType, severity);
      const financialImpact = calculateScenarioImpact(scenarioType, severity);

      // Generate cascade steps
      const cascadeSteps = this.generateCascadeSteps(scenarioType, region, severity, regionData);

      // Build analysis prompt
      const analysisContext = this.buildScenarioContext(
        scenario,
        outcomes,
        financialImpact,
        cascadeSteps
      );

      const prompt = this.buildPrompt(input);
      const aiAnalysis = await this.callGemini(
        `${prompt}\n\nScenario Context:\n${analysisContext}\n\nProvide mitigation strategies and a recovery plan.`
      );

      // Extract strategies and plan
      const mitigationStrategies = this.extractStrategies(aiAnalysis);
      const recoveryPlan = this.extractRecoveryPlan(aiAnalysis);

      const result: ScenarioResult = {
        scenario,
        outcomes,
        financialImpact,
        timeline: this.generateTimeline(scenarioType, severity),
        cascadeSteps,
        mitigationStrategies,
        recoveryPlan,
      };

      // Calculate confidence
      const confidence = this.calculateConfidence(scenarioType, regionData !== undefined);

      return this.createSuccessOutput(result, confidence, startTime, {
        reasoning: `Simulated ${scenarioType} scenario in ${region} with ${severity} severity. Total impact: $${financialImpact.estimatedCost.toLocaleString()}.`,
        suggestedFollowUp: [
          `Analyze current ${region} risks`,
          `Run alternative scenario: ${this.getAlternativeScenario(scenarioType)}`,
          `Get strategic recommendations`,
        ],
      });
    } catch (error) {
      return this.createErrorOutput(
        error instanceof Error ? error : 'Scenario simulation failed',
        startTime
      );
    }
  }

  /**
   * Generate scenario description
   */
  private generateScenarioDescription(
    template: ReturnType<typeof getScenarioTemplate>,
    region: string,
    severity: string
  ): string {
    const severityDescriptors = {
      minor: 'limited',
      moderate: 'significant',
      severe: 'major',
      catastrophic: 'devastating',
    };

    const descriptor = severityDescriptors[severity as keyof typeof severityDescriptors] || 'significant';
    return `${template?.description || 'Supply chain disruption'} causing ${descriptor} impact to operations in ${region}.`;
  }

  /**
   * Calculate duration based on scenario type and severity
   */
  private calculateDuration(scenarioType: ScenarioType, severity: string): string {
    const baseDurations: Record<ScenarioType, number> = {
      supplier_failure: 14,
      port_closure: 21,
      demand_surge: 30,
      natural_disaster: 45,
      transportation_disruption: 7,
    };

    const severityMultipliers: Record<string, number> = {
      minor: 0.5,
      moderate: 1,
      severe: 1.5,
      catastrophic: 2.5,
    };

    const baseDays = baseDurations[scenarioType] || 14;
    const multiplier = severityMultipliers[severity] || 1;
    const days = Math.round(baseDays * multiplier);

    if (days <= 7) return `${days} days`;
    if (days <= 30) return `${Math.round(days / 7)} weeks`;
    return `${Math.round(days / 30)} months`;
  }

  /**
   * Generate cascade steps showing how disruption propagates
   */
  private generateCascadeSteps(
    scenarioType: ScenarioType,
    region: Region,
    severity: string,
    regionData: ReturnType<typeof getRegionData>
  ): CascadeStep[] {
    const steps: CascadeStep[] = [];
    const severityMultiplier = severity === 'catastrophic' ? 3 : severity === 'severe' ? 2 : 1;

    // Primary impact (epicenter)
    steps.push({
      step: 1,
      timestamp: 0,
      nodeId: `${region}_epicenter`,
      nodeName: this.getEpicenterName(scenarioType, regionData),
      impactType: 'primary',
      financialImpact: 500000 * severityMultiplier,
      delayHours: 24,
      description: `Initial disruption: ${this.getEpicenterDescription(scenarioType)}`,
    });

    // Secondary impacts
    const secondaryNodes = this.getSecondaryNodes(scenarioType, regionData);
    secondaryNodes.forEach((node, i) => {
      steps.push({
        step: i + 2,
        timestamp: (i + 1) * 12 * 60 * 60 * 1000, // 12 hours apart
        nodeId: `${region}_secondary_${i}`,
        nodeName: node.name,
        impactType: 'secondary',
        financialImpact: 200000 * severityMultiplier,
        delayHours: 48 + i * 12,
        description: node.description,
      });
    });

    // Tertiary impacts
    steps.push({
      step: steps.length + 1,
      timestamp: 72 * 60 * 60 * 1000, // 72 hours
      nodeId: `${region}_downstream`,
      nodeName: 'Downstream Distribution',
      impactType: 'tertiary',
      financialImpact: 150000 * severityMultiplier,
      delayHours: 96,
      description: 'Downstream distribution channels affected',
    });

    return steps;
  }

  /**
   * Get epicenter name based on scenario type
   */
  private getEpicenterName(
    scenarioType: ScenarioType,
    regionData: ReturnType<typeof getRegionData>
  ): string {
    switch (scenarioType) {
      case 'supplier_failure':
        return regionData?.majorSuppliers[0] || 'Primary Supplier';
      case 'port_closure':
        return regionData?.keyPorts[0] || 'Major Port';
      case 'natural_disaster':
        return regionData?.name || 'Regional Hub';
      case 'transportation_disruption':
        return 'Logistics Network';
      case 'demand_surge':
        return 'Distribution Center';
      default:
        return 'Supply Chain Node';
    }
  }

  /**
   * Get epicenter description
   */
  private getEpicenterDescription(scenarioType: ScenarioType): string {
    const descriptions: Record<ScenarioType, string> = {
      supplier_failure: 'Key supplier operations halted',
      port_closure: 'Port operations suspended',
      natural_disaster: 'Regional infrastructure damaged',
      transportation_disruption: 'Transportation routes blocked',
      demand_surge: 'Unexpected demand spike detected',
    };
    return descriptions[scenarioType] || 'Disruption detected';
  }

  /**
   * Get secondary impact nodes
   */
  private getSecondaryNodes(
    scenarioType: ScenarioType,
    regionData: ReturnType<typeof getRegionData>
  ): { name: string; description: string }[] {
    const nodes: { name: string; description: string }[] = [];

    if (scenarioType === 'port_closure' && regionData?.keyPorts.length) {
      nodes.push({
        name: 'Alternative Ports',
        description: 'Congestion at alternative ports due to rerouting',
      });
    }

    if (regionData?.majorSuppliers.length) {
      nodes.push({
        name: regionData.majorSuppliers[1] || 'Secondary Supplier',
        description: 'Backup supplier capacity strained',
      });
    }

    nodes.push({
      name: 'Manufacturing Sites',
      description: 'Production delays due to component shortage',
    });

    nodes.push({
      name: 'Warehouse Network',
      description: 'Inventory levels depleting',
    });

    return nodes.slice(0, 3);
  }

  /**
   * Build scenario context for AI
   */
  private buildScenarioContext(
    scenario: Scenario,
    outcomes: Outcome[],
    financialImpact: FinancialImpact,
    cascadeSteps: CascadeStep[]
  ): string {
    return `
Scenario: ${scenario.name}
Description: ${scenario.description}
Duration: ${scenario.duration}
Affected Regions: ${scenario.affectedRegions.join(', ')}

Projected Outcomes:
${outcomes.map((o) => `- ${o.metric}: ${o.change > 0 ? '+' : ''}${o.change}% (${o.impact})`).join('\n')}

Financial Impact: $${financialImpact.estimatedCost.toLocaleString()} ${financialImpact.currency} over ${financialImpact.timeframe}

Cascade Steps:
${cascadeSteps.map((s) => `${s.step}. ${s.nodeName}: ${s.description} (${s.impactType} impact, +${s.delayHours}h delay)`).join('\n')}
`;
  }

  /**
   * Extract mitigation strategies from AI response
   */
  private extractStrategies(aiAnalysis: string): string[] {
    const strategies: string[] = [];
    const lines = aiAnalysis.split(/[.\n]/);

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.includes('mitigat') ||
        lower.includes('diversif') ||
        lower.includes('backup') ||
        lower.includes('alternative') ||
        lower.includes('contingency')
      ) {
        const cleaned = line.trim();
        if (cleaned.length > 15 && cleaned.length < 200) {
          strategies.push(cleaned);
        }
      }
    }

    // Add default strategies if none found
    if (strategies.length === 0) {
      strategies.push('Activate backup supplier agreements');
      strategies.push('Implement safety stock protocols');
      strategies.push('Establish alternative transportation routes');
    }

    return [...new Set(strategies)].slice(0, 5);
  }

  /**
   * Extract recovery plan from AI response
   */
  private extractRecoveryPlan(aiAnalysis: string): string {
    // Look for recovery-related content
    const recoverySection = aiAnalysis
      .split(/recovery|restoration|return to normal/i)
      .slice(1)
      .join(' ')
      .split('.')[0];

    if (recoverySection && recoverySection.length > 30) {
      return recoverySection.trim() + '.';
    }

    return 'Implement phased recovery starting with critical supply lines, followed by capacity restoration and inventory replenishment.';
  }

  /**
   * Generate timeline string
   */
  private generateTimeline(scenarioType: ScenarioType, severity: string): string {
    const phases = ['Detection', 'Impact', 'Response', 'Stabilization', 'Recovery'];
    const severityFactor = severity === 'catastrophic' ? 2 : severity === 'severe' ? 1.5 : 1;

    const durations = [1, 3, 7, 14, 30].map((d) => Math.round(d * severityFactor));

    return phases.map((phase, i) => `${phase}: Day ${i === 0 ? 1 : durations[i - 1] + 1}-${durations[i]}`).join(' -> ');
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(scenarioType: ScenarioType, hasRegionData: boolean): number {
    let confidence = 60;

    if (hasRegionData) confidence += 15;

    const wellModeledScenarios = ['supplier_failure', 'port_closure', 'demand_surge'];
    if (wellModeledScenarios.includes(scenarioType)) confidence += 15;

    return Math.min(confidence, 90);
  }

  /**
   * Get alternative scenario for follow-up
   */
  private getAlternativeScenario(currentScenario: ScenarioType): string {
    const alternatives: Record<ScenarioType, string> = {
      supplier_failure: 'port closure',
      port_closure: 'transportation disruption',
      natural_disaster: 'supplier failure',
      transportation_disruption: 'demand surge',
      demand_surge: 'natural disaster',
    };
    return alternatives[currentScenario] || 'supplier failure';
  }
}
