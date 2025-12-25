"use strict";
/**
 * Shared type definitions for Beacon Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCENARIO_TYPES = exports.SEVERITY_LEVELS = exports.RISK_CATEGORIES = exports.REGIONS = void 0;
// Constants
exports.REGIONS = {
    asia: 'Asia',
    europe: 'Europe',
    north_america: 'North America',
    south_america: 'South America',
    global: 'Global',
};
exports.RISK_CATEGORIES = {
    logistics: 'Logistics',
    supplier: 'Supplier',
    geopolitical: 'Geopolitical',
    weather: 'Weather',
    demand: 'Demand',
    all: 'All Categories',
};
exports.SEVERITY_LEVELS = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
};
exports.SCENARIO_TYPES = {
    supplier_failure: 'Supplier Failure',
    port_closure: 'Port Closure',
    demand_surge: 'Demand Surge',
    natural_disaster: 'Natural Disaster',
    transportation_disruption: 'Transportation Disruption',
};
//# sourceMappingURL=types.js.map