"use strict";
/**
 * Multi-Agent Architecture Exports
 * Provides centralized access to all agent functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_CAPABILITIES = exports.AGENT_DESCRIPTIONS = exports.AGENT_TYPES = exports.StrategyAdvisorAgent = exports.WebResearcherAgent = exports.ScenarioPlannerAgent = exports.RiskAnalystAgent = exports.initializeAgentCoordinator = exports.getAgentCoordinator = exports.AgentCoordinator = exports.agentHasCapability = exports.BaseAgent = void 0;
exports.findAgentsWithCapability = findAgentsWithCapability;
exports.getRecommendedAgent = getRecommendedAgent;
// Base agent and types
var base_agent_1 = require("./base-agent");
Object.defineProperty(exports, "BaseAgent", { enumerable: true, get: function () { return base_agent_1.BaseAgent; } });
Object.defineProperty(exports, "agentHasCapability", { enumerable: true, get: function () { return base_agent_1.agentHasCapability; } });
// Agent coordinator
var agent_coordinator_1 = require("./agent-coordinator");
Object.defineProperty(exports, "AgentCoordinator", { enumerable: true, get: function () { return agent_coordinator_1.AgentCoordinator; } });
Object.defineProperty(exports, "getAgentCoordinator", { enumerable: true, get: function () { return agent_coordinator_1.getAgentCoordinator; } });
Object.defineProperty(exports, "initializeAgentCoordinator", { enumerable: true, get: function () { return agent_coordinator_1.initializeAgentCoordinator; } });
// Specialized agents
var risk_analyst_1 = require("./risk-analyst");
Object.defineProperty(exports, "RiskAnalystAgent", { enumerable: true, get: function () { return risk_analyst_1.RiskAnalystAgent; } });
var scenario_planner_1 = require("./scenario-planner");
Object.defineProperty(exports, "ScenarioPlannerAgent", { enumerable: true, get: function () { return scenario_planner_1.ScenarioPlannerAgent; } });
var web_researcher_1 = require("./web-researcher");
Object.defineProperty(exports, "WebResearcherAgent", { enumerable: true, get: function () { return web_researcher_1.WebResearcherAgent; } });
var strategy_advisor_1 = require("./strategy-advisor");
Object.defineProperty(exports, "StrategyAdvisorAgent", { enumerable: true, get: function () { return strategy_advisor_1.StrategyAdvisorAgent; } });
exports.AGENT_TYPES = [
    'risk-analyst',
    'scenario-planner',
    'web-researcher',
    'strategy-advisor',
];
// Agent descriptions for UI/documentation
exports.AGENT_DESCRIPTIONS = {
    'risk-analyst': 'Analyzes supply chain risks across regions and categories',
    'scenario-planner': 'Runs what-if scenarios and develops contingency plans',
    'web-researcher': 'Gathers real-time intelligence from web sources',
    'strategy-advisor': 'Provides strategic recommendations and mitigation strategies',
};
// Agent capabilities map for routing decisions
exports.AGENT_CAPABILITIES = {
    'risk-analyst': [
        'risk_assessment',
        'regional_analysis',
        'threat_identification',
        'risk_scoring',
        'trend_analysis',
    ],
    'scenario-planner': [
        'scenario_simulation',
        'contingency_planning',
        'impact_analysis',
        'cascade_modeling',
        'recovery_planning',
    ],
    'web-researcher': [
        'web_search',
        'news_monitoring',
        'geopolitical_scanning',
        'supplier_tracking',
        'real_time_alerts',
    ],
    'strategy-advisor': [
        'strategic_planning',
        'mitigation_strategies',
        'resource_allocation',
        'cost_benefit_analysis',
        'implementation_planning',
    ],
};
/**
 * Find agents with a specific capability
 */
function findAgentsWithCapability(capability) {
    const result = [];
    for (const [agentType, capabilities] of Object.entries(exports.AGENT_CAPABILITIES)) {
        if (capabilities.includes(capability)) {
            result.push(agentType);
        }
    }
    return result;
}
/**
 * Get recommended agent for a specific task
 */
function getRecommendedAgent(task) {
    const lower = task.toLowerCase();
    if (lower.includes('risk') ||
        lower.includes('threat') ||
        lower.includes('vulnerability')) {
        return 'risk-analyst';
    }
    if (lower.includes('scenario') ||
        lower.includes('simulation') ||
        lower.includes('what if') ||
        lower.includes('cascade')) {
        return 'scenario-planner';
    }
    if (lower.includes('news') ||
        lower.includes('web') ||
        lower.includes('search') ||
        lower.includes('geopolitical')) {
        return 'web-researcher';
    }
    if (lower.includes('strategy') ||
        lower.includes('recommend') ||
        lower.includes('mitigat') ||
        lower.includes('plan')) {
        return 'strategy-advisor';
    }
    // Default to risk analyst
    return 'risk-analyst';
}
//# sourceMappingURL=index.js.map