"use strict";
/**
 * Risk Analyst Agent
 * Specializes in analyzing supply chain risks across regions and categories
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAnalystAgent = void 0;
const base_agent_1 = require("./base-agent");
const supply_chain_data_1 = require("../shared/supply-chain-data");
class RiskAnalystAgent extends base_agent_1.BaseAgent {
    constructor(geminiClient) {
        super(geminiClient);
        this.name = 'risk-analyst';
        this.description = 'Analyzes supply chain risks for regions and categories';
        this.capabilities = [
            'risk_assessment',
            'regional_analysis',
            'threat_identification',
            'risk_scoring',
            'trend_analysis',
        ];
        this.systemPrompt = `You are a Supply Chain Risk Analyst expert. Your role is to:
1. Identify and assess supply chain risks across global regions
2. Categorize risks by type (logistics, supplier, geopolitical, weather, demand)
3. Provide quantitative risk scores and qualitative assessments
4. Identify emerging threats and trends
5. Offer actionable risk mitigation strategies

Guidelines:
- Be specific with data points, percentages, and metrics
- Prioritize critical risks that require immediate attention
- Consider interconnected risks and cascading effects
- Provide confidence levels for your assessments
- Keep summaries concise (under 3 sentences)`;
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
            const region = input.parameters?.region || 'global';
            const category = input.parameters?.category;
            // Get region data and generate risks
            const regionData = (0, supply_chain_data_1.getRegionData)(region);
            if (!regionData && region !== 'global') {
                return this.createErrorOutput(`Region '${region}' not found`, startTime);
            }
            const risks = (0, supply_chain_data_1.generateRisksForRegion)(region, category);
            const riskLevel = (0, supply_chain_data_1.calculateRegionRiskLevel)(region);
            const baseSummary = (0, supply_chain_data_1.getRegionRiskSummary)(region);
            // Calculate risk score
            const riskScore = this.calculateRiskScore(risks);
            // Identify top threats
            const topThreats = risks
                .filter((r) => r.severity === 'critical' || r.severity === 'high')
                .slice(0, 3)
                .map((r) => r.title);
            // Build analysis context
            const analysisContext = this.buildAnalysisContext(region, category, risks, regionData);
            // Generate AI-enhanced analysis
            const prompt = this.buildPrompt(input);
            const aiAnalysis = await this.callGemini(`${prompt}\n\nContext:\n${analysisContext}\n\nProvide a concise risk assessment with specific recommendations.`);
            // Extract recommendations from AI response
            const recommendations = this.extractRecommendations(aiAnalysis, risks);
            const result = {
                region: regionData?.name || 'Global',
                category: category || 'all',
                overallRiskLevel: riskLevel,
                riskScore,
                risks,
                summary: aiAnalysis || baseSummary,
                topThreats,
                recommendations,
            };
            // Determine confidence based on data quality
            const confidence = this.calculateConfidence(risks, regionData !== undefined);
            return this.createSuccessOutput(result, confidence, startTime, {
                reasoning: `Analyzed ${risks.length} risks in ${region} with ${topThreats.length} high-priority threats.`,
                suggestedFollowUp: this.generateFollowUpSuggestions(region, topThreats),
            });
        }
        catch (error) {
            return this.createErrorOutput(error instanceof Error ? error : 'Risk analysis failed', startTime);
        }
    }
    /**
     * Calculate overall risk score from individual risks
     */
    calculateRiskScore(risks) {
        if (risks.length === 0)
            return 0;
        const severityWeights = {
            low: 1,
            medium: 2,
            high: 3,
            critical: 4,
        };
        let totalScore = 0;
        for (const risk of risks) {
            const severityWeight = severityWeights[risk.severity] || 1;
            const impactScore = (risk.probability * risk.impact) / 100;
            totalScore += impactScore * severityWeight;
        }
        // Normalize to 0-100
        const maxPossibleScore = risks.length * 4 * 100;
        return Math.round((totalScore / maxPossibleScore) * 100);
    }
    /**
     * Build analysis context for AI
     */
    buildAnalysisContext(region, category, risks, regionData) {
        const parts = [];
        if (regionData) {
            parts.push(`Region: ${regionData.name}`);
            parts.push(`Key Countries: ${regionData.countries.join(', ')}`);
            parts.push(`Major Ports: ${regionData.keyPorts.join(', ')}`);
            parts.push(`Key Suppliers: ${regionData.majorSuppliers.join(', ')}`);
        }
        else {
            parts.push(`Region: Global Overview`);
        }
        parts.push('');
        parts.push('Current Risks:');
        for (const risk of risks.slice(0, 5)) {
            parts.push(`- ${risk.title}: ${risk.severity} severity, ${risk.probability}% probability, ${risk.impact}% impact`);
        }
        if (category && category !== 'all') {
            parts.push(`\nFocus Category: ${category}`);
        }
        return parts.join('\n');
    }
    /**
     * Extract recommendations from AI analysis
     */
    extractRecommendations(aiAnalysis, risks) {
        const recommendations = [];
        // Add AI-derived recommendations if they contain actionable items
        const lines = aiAnalysis.split(/[.\n]/);
        for (const line of lines) {
            const lower = line.toLowerCase();
            if (lower.includes('recommend') ||
                lower.includes('should') ||
                lower.includes('consider') ||
                lower.includes('implement')) {
                const cleaned = line.trim();
                if (cleaned.length > 20 && cleaned.length < 200) {
                    recommendations.push(cleaned);
                }
            }
        }
        // Add risk-specific recommendations
        for (const risk of risks.filter((r) => r.severity === 'critical').slice(0, 2)) {
            if (risk.recommendations?.length) {
                recommendations.push(...risk.recommendations.slice(0, 1));
            }
        }
        // Deduplicate and limit
        return [...new Set(recommendations)].slice(0, 5);
    }
    /**
     * Calculate confidence level
     */
    calculateConfidence(risks, hasRegionData) {
        let confidence = 50; // Base confidence
        if (hasRegionData)
            confidence += 20;
        if (risks.length > 3)
            confidence += 15;
        if (risks.some((r) => r.severity === 'critical'))
            confidence += 10;
        return Math.min(confidence, 95);
    }
    /**
     * Generate follow-up suggestions
     */
    generateFollowUpSuggestions(region, topThreats) {
        const suggestions = [];
        suggestions.push(`Run a scenario simulation for ${region}`);
        if (topThreats.length > 0) {
            suggestions.push(`Get detailed analysis on: ${topThreats[0]}`);
        }
        suggestions.push(`Check recent alerts for ${region}`);
        suggestions.push(`Compare risks across other regions`);
        return suggestions.slice(0, 3);
    }
}
exports.RiskAnalystAgent = RiskAnalystAgent;
//# sourceMappingURL=risk-analyst.js.map