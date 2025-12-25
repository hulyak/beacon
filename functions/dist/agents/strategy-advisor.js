"use strict";
/**
 * Strategy Advisor Agent
 * Specializes in providing strategic recommendations and mitigation strategies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyAdvisorAgent = void 0;
const base_agent_1 = require("./base-agent");
class StrategyAdvisorAgent extends base_agent_1.BaseAgent {
    constructor(geminiClient) {
        super(geminiClient);
        this.name = 'strategy-advisor';
        this.description = 'Provides strategic recommendations and mitigation strategies';
        this.capabilities = [
            'strategic_planning',
            'mitigation_strategies',
            'resource_allocation',
            'cost_benefit_analysis',
            'implementation_planning',
        ];
        this.systemPrompt = `You are a Supply Chain Strategy Advisor expert. Your role is to:
1. Develop strategic recommendations based on risk analysis
2. Create comprehensive mitigation plans
3. Prioritize actions based on impact and urgency
4. Provide cost-benefit analysis for recommendations
5. Design implementation roadmaps

Guidelines:
- Prioritize recommendations by business impact
- Consider resource constraints and feasibility
- Provide specific, actionable advice
- Include success metrics and KPIs
- Balance short-term fixes with long-term improvements
- Consider organizational change management`;
    }
    async process(input) {
        const startTime = Date.now();
        // Validate input
        const validation = this.validateInput(input);
        if (!validation.valid) {
            return this.createErrorOutput(validation.errors.join('; '), startTime);
        }
        try {
            // Extract context from previous agent outputs if available
            const previousOutputs = input.context?.previousAgentOutputs || [];
            const risks = this.extractRisksFromContext(previousOutputs);
            const region = input.parameters?.region || 'global';
            const focusArea = input.parameters?.focusArea;
            // Build strategic context
            const strategicContext = this.buildStrategicContext(input, risks, previousOutputs);
            // Generate AI-powered strategic analysis
            const prompt = `${this.buildPrompt(input)}

Strategic Context:
${strategicContext}

Provide comprehensive strategic recommendations including:
1. Overall assessment of the situation
2. Prioritized recommendations (immediate, short-term, long-term)
3. Risk mitigation plan
4. Cost-benefit summary
5. Implementation roadmap with phases
6. Key performance indicators

Format your response as a structured strategic brief.`;
            const aiAnalysis = await this.callGemini(prompt);
            // Generate structured recommendations
            const recommendations = this.generateRecommendations(risks, region, focusArea);
            // Create implementation roadmap
            const roadmap = this.generateRoadmap(recommendations);
            // Generate KPIs
            const kpis = this.generateKPIs(risks, recommendations);
            // Extract summaries from AI response
            const overallAssessment = this.extractSection(aiAnalysis, 'assessment', 'overall');
            const riskMitigationPlan = this.extractSection(aiAnalysis, 'mitigation', 'risk');
            const costBenefitSummary = this.extractSection(aiAnalysis, 'cost', 'benefit');
            const result = {
                context: `Strategic analysis for ${region}${focusArea ? ` focusing on ${focusArea}` : ''}`,
                overallAssessment: overallAssessment || this.generateDefaultAssessment(risks),
                recommendations,
                riskMitigationPlan: riskMitigationPlan || this.generateDefaultMitigationPlan(risks),
                costBenefitSummary: costBenefitSummary || this.generateDefaultCostBenefit(recommendations),
                implementationRoadmap: roadmap,
                keyPerformanceIndicators: kpis,
            };
            // Calculate confidence
            const confidence = this.calculateConfidence(risks.length > 0, previousOutputs.length > 0);
            return this.createSuccessOutput(result, confidence, startTime, {
                reasoning: `Generated ${recommendations.length} strategic recommendations based on ${risks.length} identified risks.`,
                suggestedFollowUp: [
                    'Run a scenario to test these strategies',
                    'Get detailed risk analysis',
                    'Monitor implementation progress',
                ],
            });
        }
        catch (error) {
            return this.createErrorOutput(error instanceof Error ? error : 'Strategy analysis failed', startTime);
        }
    }
    /**
     * Extract risks from previous agent outputs
     */
    extractRisksFromContext(previousOutputs) {
        const risks = [];
        for (const output of previousOutputs) {
            if (output.agentName === 'risk-analyst' && output.data) {
                const data = output.data;
                if (data.risks) {
                    risks.push(...data.risks);
                }
            }
        }
        return risks;
    }
    /**
     * Build strategic context from various inputs
     */
    buildStrategicContext(input, risks, previousOutputs) {
        const parts = [];
        // Add supply chain state if available
        if (input.context?.supplyChainState) {
            const state = input.context.supplyChainState;
            parts.push('Current Supply Chain State:');
            parts.push(`- Active Alerts: ${state.activeAlerts}`);
            parts.push(`- Critical Nodes: ${state.criticalNodes.join(', ') || 'None'}`);
            parts.push('');
        }
        // Add risk summary
        if (risks.length > 0) {
            parts.push('Identified Risks:');
            const criticalRisks = risks.filter((r) => r.severity === 'critical' || r.severity === 'high');
            for (const risk of criticalRisks.slice(0, 5)) {
                parts.push(`- ${risk.title} [${risk.severity}]: ${risk.description?.substring(0, 100)}...`);
            }
            parts.push('');
        }
        // Add previous analyses summaries
        if (previousOutputs.length > 0) {
            parts.push('Previous Analyses:');
            for (const output of previousOutputs) {
                if (output.reasoning) {
                    parts.push(`- ${output.agentName}: ${output.reasoning}`);
                }
            }
        }
        return parts.join('\n');
    }
    /**
     * Generate structured recommendations
     */
    generateRecommendations(risks, region, focusArea) {
        const recommendations = [];
        // Immediate recommendations based on critical risks
        const criticalRisks = risks.filter((r) => r.severity === 'critical');
        if (criticalRisks.length > 0) {
            recommendations.push({
                id: 'rec_1',
                title: 'Activate Emergency Response Protocol',
                description: 'Implement immediate response measures for critical risks including stakeholder notification and contingency plan activation.',
                priority: 'immediate',
                effort: 'medium',
                impact: 'high',
                timeframe: '24-48 hours',
                resources: ['Crisis management team', 'Communication systems', 'Backup suppliers'],
            });
        }
        // Short-term recommendations
        recommendations.push({
            id: 'rec_2',
            title: 'Diversify Supplier Base',
            description: `Reduce dependency on single-source suppliers in ${region} by qualifying 2-3 alternative suppliers per critical component.`,
            priority: 'short_term',
            effort: 'high',
            impact: 'high',
            timeframe: '4-8 weeks',
            resources: ['Procurement team', 'Quality assurance', 'Legal for contracts'],
            dependencies: ['Supplier assessment'],
        });
        recommendations.push({
            id: 'rec_3',
            title: 'Increase Safety Stock Levels',
            description: 'Temporarily increase buffer inventory for critical components to provide 2-3 weeks additional coverage.',
            priority: 'short_term',
            effort: 'medium',
            impact: 'medium',
            timeframe: '2-4 weeks',
            resources: ['Inventory management', 'Warehouse capacity', 'Working capital'],
        });
        recommendations.push({
            id: 'rec_4',
            title: 'Establish Alternative Logistics Routes',
            description: 'Map and pre-qualify alternative transportation and shipping routes to ensure continuity during disruptions.',
            priority: 'short_term',
            effort: 'medium',
            impact: 'high',
            timeframe: '2-4 weeks',
            resources: ['Logistics team', 'Freight forwarders', 'Route mapping tools'],
        });
        // Long-term recommendations
        recommendations.push({
            id: 'rec_5',
            title: 'Implement Real-Time Visibility Platform',
            description: 'Deploy end-to-end supply chain visibility solution with predictive analytics and automated alerting.',
            priority: 'long_term',
            effort: 'high',
            impact: 'high',
            timeframe: '3-6 months',
            resources: ['IT team', 'Vendor selection', 'Integration resources', 'Training'],
            dependencies: ['Technology assessment', 'Budget approval'],
        });
        recommendations.push({
            id: 'rec_6',
            title: 'Develop Regional Resilience Strategy',
            description: `Create comprehensive regional strategy for ${region} including local supplier development and regional inventory positioning.`,
            priority: 'long_term',
            effort: 'high',
            impact: 'high',
            timeframe: '6-12 months',
            resources: ['Strategy team', 'Regional operations', 'External consultants'],
        });
        // Filter by focus area if specified
        if (focusArea) {
            return recommendations.filter((r) => r.title.toLowerCase().includes(focusArea.toLowerCase()) ||
                r.description.toLowerCase().includes(focusArea.toLowerCase()));
        }
        return recommendations;
    }
    /**
     * Generate implementation roadmap
     */
    generateRoadmap(recommendations) {
        return [
            {
                phase: 1,
                name: 'Crisis Response',
                duration: '0-2 weeks',
                objectives: [
                    'Stabilize immediate risks',
                    'Activate contingency plans',
                    'Establish communication channels',
                ],
                deliverables: [
                    'Risk mitigation actions initiated',
                    'Stakeholder briefings completed',
                    'Emergency protocols activated',
                ],
            },
            {
                phase: 2,
                name: 'Short-Term Resilience',
                duration: '2-8 weeks',
                objectives: [
                    'Implement tactical improvements',
                    'Diversify critical dependencies',
                    'Increase operational flexibility',
                ],
                deliverables: [
                    'Alternative suppliers qualified',
                    'Safety stock levels increased',
                    'Backup logistics routes established',
                ],
            },
            {
                phase: 3,
                name: 'Strategic Transformation',
                duration: '2-6 months',
                objectives: [
                    'Deploy visibility and analytics',
                    'Build regional resilience',
                    'Transform supply chain operations',
                ],
                deliverables: [
                    'Real-time visibility platform operational',
                    'Regional strategy implemented',
                    'Continuous improvement program established',
                ],
            },
            {
                phase: 4,
                name: 'Continuous Improvement',
                duration: 'Ongoing',
                objectives: [
                    'Monitor and optimize performance',
                    'Adapt to changing conditions',
                    'Drive innovation',
                ],
                deliverables: [
                    'Regular performance reviews',
                    'Updated risk assessments',
                    'Process improvements implemented',
                ],
            },
        ];
    }
    /**
     * Generate KPIs
     */
    generateKPIs(risks, recommendations) {
        return [
            'Risk Score Reduction: Target 20% improvement within 90 days',
            'Supplier Diversification: Achieve dual-sourcing for 80% of critical components',
            'Inventory Coverage: Maintain 3-week safety stock for priority SKUs',
            'Alert Response Time: Reduce from hours to minutes for critical alerts',
            'Supply Chain Visibility: Achieve 95% real-time tracking coverage',
            'Recovery Time Objective: Reduce disruption recovery time by 50%',
            `Critical Risk Count: Reduce from ${risks.filter((r) => r.severity === 'critical').length} to 0`,
        ];
    }
    /**
     * Extract section from AI response
     */
    extractSection(response, ...keywords) {
        const lower = response.toLowerCase();
        let bestMatch = '';
        let bestScore = 0;
        const sentences = response.split(/[.!?]\s+/);
        for (const sentence of sentences) {
            const sentenceLower = sentence.toLowerCase();
            let score = 0;
            for (const keyword of keywords) {
                if (sentenceLower.includes(keyword)) {
                    score += 1;
                }
            }
            if (score > bestScore && sentence.length > 30) {
                bestScore = score;
                bestMatch = sentence.trim();
            }
        }
        return bestScore > 0 ? bestMatch + '.' : null;
    }
    /**
     * Generate default assessment
     */
    generateDefaultAssessment(risks) {
        const critical = risks.filter((r) => r.severity === 'critical').length;
        const high = risks.filter((r) => r.severity === 'high').length;
        if (critical > 0) {
            return `Critical situation requiring immediate attention. ${critical} critical and ${high} high-priority risks identified. Recommend activating emergency protocols and focusing on risk mitigation.`;
        }
        if (high > 0) {
            return `Elevated risk environment with ${high} high-priority concerns. Recommend proactive measures to prevent escalation and improve resilience.`;
        }
        return 'Supply chain operating within acceptable risk parameters. Recommend continued monitoring and focus on long-term resilience improvements.';
    }
    /**
     * Generate default mitigation plan
     */
    generateDefaultMitigationPlan(risks) {
        const riskTypes = [...new Set(risks.map((r) => r.category))];
        return `Implement layered mitigation approach addressing ${riskTypes.join(', ')} risks through diversification, redundancy, and real-time monitoring. Establish clear escalation procedures and pre-approved response protocols.`;
    }
    /**
     * Generate default cost-benefit summary
     */
    generateDefaultCostBenefit(recommendations) {
        const highImpact = recommendations.filter((r) => r.impact === 'high').length;
        return `Investment in ${recommendations.length} recommended initiatives expected to deliver significant risk reduction. ${highImpact} high-impact actions prioritized for maximum ROI. Estimated cost avoidance from prevented disruptions exceeds implementation costs by 3-5x.`;
    }
    /**
     * Calculate confidence
     */
    calculateConfidence(hasRisks, hasPreviousAnalysis) {
        let confidence = 50;
        if (hasRisks)
            confidence += 25;
        if (hasPreviousAnalysis)
            confidence += 20;
        return Math.min(confidence, 90);
    }
}
exports.StrategyAdvisorAgent = StrategyAdvisorAgent;
//# sourceMappingURL=strategy-advisor.js.map