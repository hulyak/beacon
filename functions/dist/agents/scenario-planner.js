"use strict";
/**
 * Scenario Planner Agent
 * Specializes in running what-if scenarios and contingency planning
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioPlannerAgent = void 0;
const base_agent_1 = require("./base-agent");
const supply_chain_data_1 = require("../shared/supply-chain-data");
class ScenarioPlannerAgent extends base_agent_1.BaseAgent {
    constructor(geminiClient) {
        super(geminiClient);
        this.name = 'scenario-planner';
        this.description = 'Runs what-if scenarios and develops contingency plans';
        this.capabilities = [
            'scenario_simulation',
            'contingency_planning',
            'impact_analysis',
            'cascade_modeling',
            'recovery_planning',
        ];
        this.systemPrompt = `You are a Supply Chain Scenario Planner expert. Your role is to:
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
    }
    async process(input) {
        const startTime = Date.now();
        // Validate input
        const validation = this.validateInput(input);
        if (!validation.valid) {
            return this.createErrorOutput(validation.errors.join('; '), startTime);
        }
        try {
            // Extract parameters
            const scenarioType = input.parameters?.scenarioType;
            const region = input.parameters?.region || 'asia';
            const severity = input.parameters?.severity || 'moderate';
            if (!scenarioType) {
                return this.createErrorOutput('Scenario type is required', startTime);
            }
            // Get scenario template
            const template = (0, supply_chain_data_1.getScenarioTemplate)(scenarioType);
            if (!template) {
                return this.createErrorOutput(`Unknown scenario type: ${scenarioType}`, startTime);
            }
            // Get region data
            const regionData = (0, supply_chain_data_1.getRegionData)(region);
            // Generate base scenario
            const scenario = {
                id: `scen_${Date.now()}`,
                type: scenarioType,
                name: template.name,
                description: this.generateScenarioDescription(template, region, severity),
                duration: this.calculateDuration(scenarioType, severity),
                affectedRegions: [regionData?.name || region],
            };
            // Calculate impacts
            const outcomes = (0, supply_chain_data_1.generateScenarioOutcomes)(scenarioType, severity);
            const financialImpact = (0, supply_chain_data_1.calculateScenarioImpact)(scenarioType, severity);
            // Generate cascade steps
            const cascadeSteps = this.generateCascadeSteps(scenarioType, region, severity, regionData);
            // Build analysis prompt
            const analysisContext = this.buildScenarioContext(scenario, outcomes, financialImpact, cascadeSteps);
            const prompt = this.buildPrompt(input);
            const aiAnalysis = await this.callGemini(`${prompt}\n\nScenario Context:\n${analysisContext}\n\nProvide mitigation strategies and a recovery plan.`);
            // Extract strategies and plan
            const mitigationStrategies = this.extractStrategies(aiAnalysis);
            const recoveryPlan = this.extractRecoveryPlan(aiAnalysis);
            const result = {
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
        }
        catch (error) {
            return this.createErrorOutput(error instanceof Error ? error : 'Scenario simulation failed', startTime);
        }
    }
    /**
     * Generate scenario description
     */
    generateScenarioDescription(template, region, severity) {
        const severityDescriptors = {
            minor: 'limited',
            moderate: 'significant',
            severe: 'major',
            catastrophic: 'devastating',
        };
        const descriptor = severityDescriptors[severity] || 'significant';
        return `${template?.description || 'Supply chain disruption'} causing ${descriptor} impact to operations in ${region}.`;
    }
    /**
     * Calculate duration based on scenario type and severity
     */
    calculateDuration(scenarioType, severity) {
        const baseDurations = {
            supplier_failure: 14,
            port_closure: 21,
            demand_surge: 30,
            natural_disaster: 45,
            transportation_disruption: 7,
        };
        const severityMultipliers = {
            minor: 0.5,
            moderate: 1,
            severe: 1.5,
            catastrophic: 2.5,
        };
        const baseDays = baseDurations[scenarioType] || 14;
        const multiplier = severityMultipliers[severity] || 1;
        const days = Math.round(baseDays * multiplier);
        if (days <= 7)
            return `${days} days`;
        if (days <= 30)
            return `${Math.round(days / 7)} weeks`;
        return `${Math.round(days / 30)} months`;
    }
    /**
     * Generate cascade steps showing how disruption propagates
     */
    generateCascadeSteps(scenarioType, region, severity, regionData) {
        const steps = [];
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
    getEpicenterName(scenarioType, regionData) {
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
    getEpicenterDescription(scenarioType) {
        const descriptions = {
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
    getSecondaryNodes(scenarioType, regionData) {
        const nodes = [];
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
    buildScenarioContext(scenario, outcomes, financialImpact, cascadeSteps) {
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
    extractStrategies(aiAnalysis) {
        const strategies = [];
        const lines = aiAnalysis.split(/[.\n]/);
        for (const line of lines) {
            const lower = line.toLowerCase();
            if (lower.includes('mitigat') ||
                lower.includes('diversif') ||
                lower.includes('backup') ||
                lower.includes('alternative') ||
                lower.includes('contingency')) {
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
    extractRecoveryPlan(aiAnalysis) {
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
    generateTimeline(scenarioType, severity) {
        const phases = ['Detection', 'Impact', 'Response', 'Stabilization', 'Recovery'];
        const severityFactor = severity === 'catastrophic' ? 2 : severity === 'severe' ? 1.5 : 1;
        const durations = [1, 3, 7, 14, 30].map((d) => Math.round(d * severityFactor));
        return phases.map((phase, i) => `${phase}: Day ${i === 0 ? 1 : durations[i - 1] + 1}-${durations[i]}`).join(' -> ');
    }
    /**
     * Calculate confidence
     */
    calculateConfidence(scenarioType, hasRegionData) {
        let confidence = 60;
        if (hasRegionData)
            confidence += 15;
        const wellModeledScenarios = ['supplier_failure', 'port_closure', 'demand_surge'];
        if (wellModeledScenarios.includes(scenarioType))
            confidence += 15;
        return Math.min(confidence, 90);
    }
    /**
     * Get alternative scenario for follow-up
     */
    getAlternativeScenario(currentScenario) {
        const alternatives = {
            supplier_failure: 'port closure',
            port_closure: 'transportation disruption',
            natural_disaster: 'supplier failure',
            transportation_disruption: 'demand surge',
            demand_surge: 'natural disaster',
        };
        return alternatives[currentScenario] || 'supplier failure';
    }
}
exports.ScenarioPlannerAgent = ScenarioPlannerAgent;
//# sourceMappingURL=scenario-planner.js.map