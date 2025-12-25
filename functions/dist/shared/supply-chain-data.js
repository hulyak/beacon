"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenarioTemplates = exports.activeAlerts = exports.riskFactors = exports.suppliers = exports.regions = void 0;
exports.getRegionData = getRegionData;
exports.getSuppliersByRegion = getSuppliersByRegion;
exports.getRiskFactorsByRegion = getRiskFactorsByRegion;
exports.getRiskFactorsByCategory = getRiskFactorsByCategory;
exports.getAlertsByPriority = getAlertsByPriority;
exports.getAlertsByRegion = getAlertsByRegion;
exports.getScenarioTemplate = getScenarioTemplate;
exports.generateRisksForRegion = generateRisksForRegion;
exports.calculateRegionRiskLevel = calculateRegionRiskLevel;
exports.getRegionRiskSummary = getRegionRiskSummary;
exports.calculateScenarioImpact = calculateScenarioImpact;
exports.generateScenarioOutcomes = generateScenarioOutcomes;
const utils_1 = require("./utils");
/**
 * Mock supply chain data for Beacon demo
 */
// Regions
exports.regions = [
    {
        id: 'asia',
        name: 'Asia',
        countries: ['China', 'Japan', 'South Korea', 'Taiwan', 'Singapore', 'Thailand', 'Vietnam', 'India'],
        keyPorts: ['Shanghai', 'Shenzhen', 'Singapore', 'Busan', 'Tokyo', 'Hong Kong'],
        majorSuppliers: ['Foxconn', 'TSMC', 'Samsung', 'BYD', 'Tencent Manufacturing'],
    },
    {
        id: 'europe',
        name: 'Europe',
        countries: ['Germany', 'Netherlands', 'France', 'Italy', 'Spain', 'Poland', 'Czech Republic'],
        keyPorts: ['Rotterdam', 'Hamburg', 'Antwerp', 'Le Havre', 'Barcelona', 'Genoa'],
        majorSuppliers: ['Bosch', 'Siemens', 'ASML', 'Airbus', 'Volkswagen Group'],
    },
    {
        id: 'north_america',
        name: 'North America',
        countries: ['United States', 'Canada', 'Mexico'],
        keyPorts: ['Los Angeles', 'Long Beach', 'New York', 'Savannah', 'Vancouver', 'Montreal'],
        majorSuppliers: ['Intel', 'Apple', 'Tesla', 'General Motors', 'Boeing'],
    },
    {
        id: 'south_america',
        name: 'South America',
        countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
        keyPorts: ['Santos', 'Buenos Aires', 'Valparaiso', 'Cartagena', 'Callao'],
        majorSuppliers: ['Embraer', 'Vale', 'Petrobras', 'JBS', 'Suzano'],
    },
];
// Suppliers
exports.suppliers = [
    // Asia
    { id: 'sup-001', name: 'Foxconn Technology', region: 'asia', category: 'electronics', reliability: 92, capacity: 850000 },
    { id: 'sup-002', name: 'TSMC', region: 'asia', category: 'semiconductors', reliability: 96, capacity: 120000 },
    { id: 'sup-003', name: 'Samsung Electronics', region: 'asia', category: 'electronics', reliability: 94, capacity: 750000 },
    { id: 'sup-004', name: 'BYD Auto', region: 'asia', category: 'automotive', reliability: 88, capacity: 300000 },
    { id: 'sup-005', name: 'Tencent Manufacturing', region: 'asia', category: 'technology', reliability: 90, capacity: 200000 },
    // Europe
    { id: 'sup-006', name: 'Bosch Group', region: 'europe', category: 'automotive', reliability: 95, capacity: 400000 },
    { id: 'sup-007', name: 'Siemens AG', region: 'europe', category: 'industrial', reliability: 93, capacity: 350000 },
    { id: 'sup-008', name: 'ASML Holding', region: 'europe', category: 'semiconductors', reliability: 97, capacity: 50000 },
    { id: 'sup-009', name: 'Airbus SE', region: 'europe', category: 'aerospace', reliability: 91, capacity: 800 },
    { id: 'sup-010', name: 'Volkswagen Group', region: 'europe', category: 'automotive', reliability: 89, capacity: 600000 },
    // North America
    { id: 'sup-011', name: 'Intel Corporation', region: 'north_america', category: 'semiconductors', reliability: 94, capacity: 180000 },
    { id: 'sup-012', name: 'Apple Inc.', region: 'north_america', category: 'electronics', reliability: 96, capacity: 220000 },
    { id: 'sup-013', name: 'Tesla Inc.', region: 'north_america', category: 'automotive', reliability: 87, capacity: 150000 },
    { id: 'sup-014', name: 'General Motors', region: 'north_america', category: 'automotive', reliability: 90, capacity: 280000 },
    { id: 'sup-015', name: 'Boeing Company', region: 'north_america', category: 'aerospace', reliability: 88, capacity: 400 },
    // South America
    { id: 'sup-016', name: 'Embraer SA', region: 'south_america', category: 'aerospace', reliability: 92, capacity: 120 },
    { id: 'sup-017', name: 'Vale SA', region: 'south_america', category: 'mining', reliability: 85, capacity: 500000 },
    { id: 'sup-018', name: 'Petrobras', region: 'south_america', category: 'energy', reliability: 83, capacity: 800000 },
    { id: 'sup-019', name: 'JBS SA', region: 'south_america', category: 'food', reliability: 86, capacity: 450000 },
    { id: 'sup-020', name: 'Suzano SA', region: 'south_america', category: 'materials', reliability: 88, capacity: 320000 },
];
// Risk Factors
exports.riskFactors = [
    // Asia
    { id: 'rf-001', name: 'Port Congestion', region: 'asia', category: 'logistics', currentLevel: 75, trend: 'increasing' },
    { id: 'rf-002', name: 'Semiconductor Shortage', region: 'asia', category: 'supplier', currentLevel: 68, trend: 'stable' },
    { id: 'rf-003', name: 'Geopolitical Tensions', region: 'asia', category: 'geopolitical', currentLevel: 72, trend: 'increasing' },
    { id: 'rf-004', name: 'Typhoon Season', region: 'asia', category: 'weather', currentLevel: 45, trend: 'stable' },
    { id: 'rf-005', name: 'Labor Shortages', region: 'asia', category: 'supplier', currentLevel: 58, trend: 'increasing' },
    // Europe
    { id: 'rf-006', name: 'Energy Crisis', region: 'europe', category: 'supplier', currentLevel: 65, trend: 'decreasing' },
    { id: 'rf-007', name: 'Brexit Impact', region: 'europe', category: 'geopolitical', currentLevel: 42, trend: 'decreasing' },
    { id: 'rf-008', name: 'Rail Strikes', region: 'europe', category: 'logistics', currentLevel: 38, trend: 'stable' },
    { id: 'rf-009', name: 'Inflation Pressure', region: 'europe', category: 'demand', currentLevel: 55, trend: 'stable' },
    { id: 'rf-010', name: 'Winter Weather', region: 'europe', category: 'weather', currentLevel: 35, trend: 'decreasing' },
    // North America
    { id: 'rf-011', name: 'Truck Driver Shortage', region: 'north_america', category: 'logistics', currentLevel: 62, trend: 'stable' },
    { id: 'rf-012', name: 'Trade Policy Changes', region: 'north_america', category: 'geopolitical', currentLevel: 48, trend: 'stable' },
    { id: 'rf-013', name: 'Hurricane Season', region: 'north_america', category: 'weather', currentLevel: 40, trend: 'stable' },
    { id: 'rf-014', name: 'Interest Rate Impact', region: 'north_america', category: 'demand', currentLevel: 52, trend: 'increasing' },
    { id: 'rf-015', name: 'Warehouse Capacity', region: 'north_america', category: 'logistics', currentLevel: 44, trend: 'decreasing' },
    // South America
    { id: 'rf-016', name: 'Currency Volatility', region: 'south_america', category: 'geopolitical', currentLevel: 70, trend: 'increasing' },
    { id: 'rf-017', name: 'Infrastructure Gaps', region: 'south_america', category: 'logistics', currentLevel: 78, trend: 'stable' },
    { id: 'rf-018', name: 'Political Instability', region: 'south_america', category: 'geopolitical', currentLevel: 65, trend: 'stable' },
    { id: 'rf-019', name: 'Commodity Price Swings', region: 'south_america', category: 'demand', currentLevel: 58, trend: 'increasing' },
    { id: 'rf-020', name: 'Deforestation Regulations', region: 'south_america', category: 'supplier', currentLevel: 46, trend: 'increasing' },
];
// Active Alerts
exports.activeAlerts = [
    {
        id: 'alert-001',
        title: 'Shanghai Port Congestion Critical',
        message: 'Shanghai port experiencing severe congestion with 2-3 week delays expected. Consider alternative routing through Ningbo or Shenzhen.',
        priority: 'critical',
        category: 'logistics',
        timestamp: (0, utils_1.formatTimestamp)(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
        region: 'asia',
        isRead: false,
        actionRequired: true,
        relatedRisks: ['rf-001'],
    },
    {
        id: 'alert-002',
        title: 'TSMC Production Slowdown',
        message: 'TSMC reporting 15% production reduction due to power grid maintenance. Semiconductor deliveries may be delayed by 1-2 weeks.',
        priority: 'high',
        category: 'supplier',
        timestamp: (0, utils_1.formatTimestamp)(new Date(Date.now() - 6 * 60 * 60 * 1000)), // 6 hours ago
        region: 'asia',
        isRead: false,
        actionRequired: true,
        relatedRisks: ['rf-002'],
    },
    {
        id: 'alert-003',
        title: 'European Rail Strike Planned',
        message: 'Major rail strike planned across Germany and France for next week. Consider truck transport alternatives.',
        priority: 'medium',
        category: 'logistics',
        timestamp: (0, utils_1.formatTimestamp)(new Date(Date.now() - 12 * 60 * 60 * 1000)), // 12 hours ago
        region: 'europe',
        isRead: false,
        actionRequired: true,
        relatedRisks: ['rf-008'],
    },
    {
        id: 'alert-004',
        title: 'Hurricane Warning - Gulf Coast',
        message: 'Category 2 hurricane approaching Gulf Coast. Ports in Houston and New Orleans may close for 2-3 days.',
        priority: 'high',
        category: 'weather',
        timestamp: (0, utils_1.formatTimestamp)(new Date(Date.now() - 4 * 60 * 60 * 1000)), // 4 hours ago
        region: 'north_america',
        isRead: false,
        actionRequired: true,
        relatedRisks: ['rf-013'],
    },
    {
        id: 'alert-005',
        title: 'Brazilian Real Volatility',
        message: 'Brazilian Real experiencing high volatility. Consider hedging strategies for South American suppliers.',
        priority: 'medium',
        category: 'geopolitical',
        timestamp: (0, utils_1.formatTimestamp)(new Date(Date.now() - 8 * 60 * 60 * 1000)), // 8 hours ago
        region: 'south_america',
        isRead: true,
        actionRequired: false,
        relatedRisks: ['rf-016'],
    },
    {
        id: 'alert-006',
        title: 'Chip Shortage Easing',
        message: 'Semiconductor availability improving in Q4. Lead times reduced from 26 to 18 weeks on average.',
        priority: 'low',
        category: 'supplier',
        timestamp: (0, utils_1.formatTimestamp)(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1 day ago
        region: 'global',
        isRead: true,
        actionRequired: false,
        relatedRisks: ['rf-002'],
    },
];
// Scenario Templates
exports.scenarioTemplates = [
    {
        id: 'scenario-001',
        type: 'supplier_failure',
        name: 'Major Supplier Failure',
        description: 'Primary supplier experiences complete production halt',
        defaultSeverity: 'severe',
        affectedMetrics: ['production_capacity', 'delivery_time', 'cost_per_unit'],
        typicalDuration: '2-8 weeks',
    },
    {
        id: 'scenario-002',
        type: 'port_closure',
        name: 'Port Closure Event',
        description: 'Major port closes due to weather, strikes, or infrastructure issues',
        defaultSeverity: 'moderate',
        affectedMetrics: ['shipping_time', 'logistics_cost', 'inventory_levels'],
        typicalDuration: '3-10 days',
    },
    {
        id: 'scenario-003',
        type: 'demand_surge',
        name: 'Unexpected Demand Surge',
        description: 'Sudden increase in demand beyond forecasted levels',
        defaultSeverity: 'moderate',
        affectedMetrics: ['inventory_turnover', 'stockout_risk', 'customer_satisfaction'],
        typicalDuration: '4-12 weeks',
    },
    {
        id: 'scenario-004',
        type: 'natural_disaster',
        name: 'Natural Disaster Impact',
        description: 'Earthquake, hurricane, or other natural disaster affects supply chain',
        defaultSeverity: 'catastrophic',
        affectedMetrics: ['production_capacity', 'shipping_time', 'supplier_availability'],
        typicalDuration: '1-6 months',
    },
    {
        id: 'scenario-005',
        type: 'transportation_disruption',
        name: 'Transportation Network Disruption',
        description: 'Major disruption to transportation networks (strikes, fuel shortages, etc.)',
        defaultSeverity: 'moderate',
        affectedMetrics: ['delivery_time', 'logistics_cost', 'route_flexibility'],
        typicalDuration: '1-4 weeks',
    },
];
/**
 * Data access functions
 */
function getRegionData(regionId) {
    return exports.regions.find(r => r.id === regionId);
}
function getSuppliersByRegion(regionId) {
    return exports.suppliers.filter(s => s.region === regionId);
}
function getRiskFactorsByRegion(regionId) {
    return exports.riskFactors.filter(rf => rf.region === regionId);
}
function getRiskFactorsByCategory(category) {
    if (category === 'all')
        return exports.riskFactors;
    return exports.riskFactors.filter(rf => rf.category === category);
}
function getAlertsByPriority(priority) {
    if (priority === 'all')
        return exports.activeAlerts;
    return exports.activeAlerts.filter(a => a.priority === priority);
}
function getAlertsByRegion(regionId) {
    return exports.activeAlerts.filter(a => a.region === regionId || a.region === 'global');
}
function getScenarioTemplate(scenarioType) {
    return exports.scenarioTemplates.find(st => st.type === scenarioType);
}
/**
 * Generate realistic risks based on region and category
 */
function generateRisksForRegion(regionId, category) {
    const regionData = getRegionData(regionId);
    const regionRiskFactors = getRiskFactorsByRegion(regionId);
    const categoryRiskFactors = category && category !== 'all'
        ? regionRiskFactors.filter(rf => rf.category === category)
        : regionRiskFactors;
    const risks = [];
    // Generate risks based on risk factors
    categoryRiskFactors.forEach((riskFactor, index) => {
        const severity = riskFactor.currentLevel >= 70 ? 'critical' :
            riskFactor.currentLevel >= 55 ? 'high' :
                riskFactor.currentLevel >= 35 ? 'medium' : 'low';
        const risk = {
            id: (0, utils_1.generateId)('risk'),
            title: `${riskFactor.name} in ${regionData?.name || regionId}`,
            description: generateRiskDescription(riskFactor, regionData),
            severity,
            region: regionId,
            category: riskFactor.category,
            probability: riskFactor.currentLevel,
            impact: Math.min(100, riskFactor.currentLevel + (Math.random() * 20 - 10)),
            recommendations: generateRecommendations(riskFactor, regionData),
        };
        risks.push(risk);
    });
    // Sort by severity and probability
    risks.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0)
            return severityDiff;
        return b.probability - a.probability;
    });
    return risks.slice(0, 5); // Return top 5 risks
}
function generateRiskDescription(riskFactor, regionData) {
    const descriptions = {
        'Port Congestion': `Major delays at key ports including ${regionData?.keyPorts.slice(0, 2).join(' and ')}. Container throughput reduced by 30-40%.`,
        'Semiconductor Shortage': 'Critical shortage of semiconductor components affecting electronics and automotive sectors. Lead times extended significantly.',
        'Geopolitical Tensions': 'Rising geopolitical tensions affecting trade relationships and supply chain stability in the region.',
        'Energy Crisis': 'Energy supply constraints leading to production slowdowns and increased operational costs.',
        'Labor Shortages': 'Significant labor shortages in manufacturing and logistics sectors affecting production capacity.',
        'Currency Volatility': 'High currency volatility creating cost uncertainty and affecting supplier relationships.',
        'Infrastructure Gaps': 'Inadequate transportation and logistics infrastructure causing delays and increased costs.',
    };
    return descriptions[riskFactor.name] || `${riskFactor.name} is currently at ${riskFactor.currentLevel}% risk level with ${riskFactor.trend} trend.`;
}
function generateRecommendations(riskFactor, regionData) {
    const recommendations = {
        'Port Congestion': [
            `Consider alternative ports such as ${regionData?.keyPorts.slice(2, 4).join(' or ')}`,
            'Increase safety stock by 2-3 weeks',
            'Explore air freight for critical components'
        ],
        'Semiconductor Shortage': [
            'Diversify supplier base across multiple regions',
            'Increase component inventory buffers',
            'Consider design modifications to use alternative chips'
        ],
        'Geopolitical Tensions': [
            'Develop contingency plans for trade disruptions',
            'Diversify supplier base to reduce regional concentration',
            'Monitor trade policy developments closely'
        ],
        'Energy Crisis': [
            'Negotiate fixed-price energy contracts with suppliers',
            'Invest in energy-efficient production processes',
            'Consider suppliers with renewable energy sources'
        ],
        'Labor Shortages': [
            'Increase automation in production processes',
            'Develop partnerships with staffing agencies',
            'Consider suppliers in regions with available workforce'
        ],
    };
    return recommendations[riskFactor.name] || [
        'Monitor situation closely',
        'Develop contingency plans',
        'Consider alternative suppliers or routes'
    ];
}
/**
 * Calculate overall risk level for a region
 */
function calculateRegionRiskLevel(regionId) {
    const risks = generateRisksForRegion(regionId);
    if (risks.length === 0)
        return 'low';
    const criticalCount = risks.filter(r => r.severity === 'critical').length;
    const highCount = risks.filter(r => r.severity === 'high').length;
    if (criticalCount >= 2)
        return 'critical';
    if (criticalCount >= 1 || highCount >= 3)
        return 'high';
    if (highCount >= 1)
        return 'medium';
    return 'low';
}
/**
 * Get summary for region risks
 */
function getRegionRiskSummary(regionId) {
    const regionData = getRegionData(regionId);
    const risks = generateRisksForRegion(regionId);
    const riskLevel = calculateRegionRiskLevel(regionId);
    const topRisks = risks.slice(0, 2).map(r => r.title.replace(` in ${regionData?.name}`, '')).join(' and ');
    const summaries = {
        critical: `${regionData?.name} shows critical risk levels at ${Math.round(risks[0]?.probability || 0)}%, primarily due to ${topRisks}. Immediate action required.`,
        high: `${regionData?.name} has elevated risk at ${Math.round(risks[0]?.probability || 0)}%, mainly from ${topRisks}. Close monitoring recommended.`,
        medium: `${regionData?.name} shows moderate risk levels with ${topRisks} as key concerns. Preventive measures advised.`,
        low: `${regionData?.name} maintains low risk levels with manageable concerns around ${topRisks}.`,
    };
    return summaries[riskLevel];
}
/**
 * Calculate scenario financial impact
 */
function calculateScenarioImpact(scenarioType, severity) {
    const baseImpacts = {
        supplier_failure: 2500000,
        port_closure: 1500000,
        demand_surge: 1000000,
        natural_disaster: 5000000,
        transportation_disruption: 800000,
    };
    const severityMultipliers = {
        minor: 0.3,
        moderate: 1.0,
        severe: 2.0,
        catastrophic: 4.0,
    };
    const multiplier = severityMultipliers[severity] || 1.0;
    const baseImpact = baseImpacts[scenarioType] || 1000000;
    const estimatedCost = Math.round(baseImpact * multiplier);
    return {
        estimatedCost,
        currency: 'USD',
        timeframe: severity === 'catastrophic' ? '6 months' : severity === 'severe' ? '3 months' : '1 month',
    };
}
/**
 * Generate scenario outcomes
 */
function generateScenarioOutcomes(scenarioType, severity) {
    const severityMultiplier = {
        minor: 0.5,
        moderate: 1.0,
        severe: 1.5,
        catastrophic: 2.0,
    };
    const multiplier = severityMultiplier[severity] || 1.0;
    const outcomesByType = {
        supplier_failure: [
            { metric: 'Production Capacity', currentValue: 100, projectedValue: Math.max(0, 100 - (45 * multiplier)), change: -(45 * multiplier), impact: 'negative', unit: '%' },
            { metric: 'Delivery Time', currentValue: 14, projectedValue: 14 + (10 * multiplier), change: (71 * multiplier), impact: 'negative', unit: 'days' },
            { metric: 'Cost Per Unit', currentValue: 100, projectedValue: 100 + (25 * multiplier), change: 25 * multiplier, impact: 'negative', unit: '$' },
        ],
        port_closure: [
            { metric: 'Shipping Time', currentValue: 21, projectedValue: 21 + (14 * multiplier), change: 67 * multiplier, impact: 'negative', unit: 'days' },
            { metric: 'Logistics Cost', currentValue: 100, projectedValue: 100 + (35 * multiplier), change: 35 * multiplier, impact: 'negative', unit: '$' },
            { metric: 'Inventory Buffer', currentValue: 30, projectedValue: Math.max(0, 30 - (15 * multiplier)), change: -(50 * multiplier), impact: 'negative', unit: 'days' },
        ],
        demand_surge: [
            { metric: 'Inventory Turnover', currentValue: 8, projectedValue: 8 + (4 * multiplier), change: 50 * multiplier, impact: 'positive', unit: 'times/year' },
            { metric: 'Stockout Risk', currentValue: 5, projectedValue: 5 + (20 * multiplier), change: 400 * multiplier, impact: 'negative', unit: '%' },
            { metric: 'Customer Satisfaction', currentValue: 95, projectedValue: Math.max(60, 95 - (15 * multiplier)), change: -(15 * multiplier), impact: 'negative', unit: '%' },
        ],
        natural_disaster: [
            { metric: 'Supplier Availability', currentValue: 100, projectedValue: Math.max(20, 100 - (60 * multiplier)), change: -(60 * multiplier), impact: 'negative', unit: '%' },
            { metric: 'Recovery Time', currentValue: 0, projectedValue: 30 * multiplier, change: 100 * multiplier, impact: 'negative', unit: 'days' },
            { metric: 'Emergency Costs', currentValue: 0, projectedValue: 500000 * multiplier, change: 100 * multiplier, impact: 'negative', unit: '$' },
        ],
        transportation_disruption: [
            { metric: 'Delivery Reliability', currentValue: 98, projectedValue: Math.max(70, 98 - (25 * multiplier)), change: -(25 * multiplier), impact: 'negative', unit: '%' },
            { metric: 'Transportation Cost', currentValue: 100, projectedValue: 100 + (40 * multiplier), change: 40 * multiplier, impact: 'negative', unit: '$' },
            { metric: 'Route Flexibility', currentValue: 5, projectedValue: Math.max(2, 5 - (2 * multiplier)), change: -(40 * multiplier), impact: 'negative', unit: 'options' },
        ],
    };
    return outcomesByType[scenarioType] || [];
}
//# sourceMappingURL=supply-chain-data.js.map