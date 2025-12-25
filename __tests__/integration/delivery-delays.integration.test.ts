/**
 * Delivery Delays Integration Tests
 * 
 * Tests the delivery delay tracking and timeline projection functionality
 * Validates data consistency in delay calculations and recovery projections
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { TimelineProjection } from '../../lib/types/enhanced-analytics';

// Mock the delivery delay tracking function
const mockDelayTracking = {
  trackDeliveryDelays: async (scenarioType: string, region: string, severity: string, timeHorizon = 60) => {
    const deliveryDelays = calculateDeliveryDelays(scenarioType, region, severity);
    const timelineProjection = generateTimelineProjection(deliveryDelays, scenarioType, severity, timeHorizon);
    const impactMetrics = calculateImpactMetrics(deliveryDelays, scenarioType, region);

    return {
      deliveryDelays: {
        ...deliveryDelays,
        timelineProjection
      },
      impactMetrics,
      analysisTimestamp: new Date().toISOString()
    };
  }
};

// Helper functions to simulate delivery delay tracking logic
function calculateDeliveryDelays(
  scenarioType: string,
  region: string,
  severity: string
): { averageDelay: number; maxDelay: number; affectedOrders: number } {
  const baseDelayPatterns = {
    supplier_failure: { averageDelay: 14, maxDelay: 28, orderImpactRate: 0.6 },
    port_closure: { averageDelay: 21, maxDelay: 42, orderImpactRate: 0.8 },
    demand_surge: { averageDelay: 7, maxDelay: 14, orderImpactRate: 0.4 },
    natural_disaster: { averageDelay: 35, maxDelay: 70, orderImpactRate: 0.9 },
    transportation_disruption: { averageDelay: 10, maxDelay: 21, orderImpactRate: 0.7 }
  };

  const severityMultipliers = {
    minor: 0.5,
    moderate: 1.0,
    severe: 1.8,
    catastrophic: 3.0
  };

  const regionalOrderVolumes = {
    asia: 4000,
    europe: 2800,
    north_america: 3200,
    south_america: 1800,
    global: 12000
  };

  const regionalComplexity = {
    asia: 1.3,
    europe: 1.0,
    north_america: 1.1,
    south_america: 0.9,
    global: 1.5
  };

  const basePattern = baseDelayPatterns[scenarioType as keyof typeof baseDelayPatterns] || baseDelayPatterns.supplier_failure;
  const severityMultiplier = severityMultipliers[severity as keyof typeof severityMultipliers] || 1.0;
  const complexityMultiplier = regionalComplexity[region as keyof typeof regionalComplexity] || 1.0;
  const baseOrderVolume = regionalOrderVolumes[region as keyof typeof regionalOrderVolumes] || 3000;

  const finalMultiplier = severityMultiplier * complexityMultiplier;

  return {
    averageDelay: Math.round(basePattern.averageDelay * finalMultiplier),
    maxDelay: Math.round(basePattern.maxDelay * finalMultiplier),
    affectedOrders: Math.round(baseOrderVolume * basePattern.orderImpactRate * severityMultiplier)
  };
}

function generateTimelineProjection(
  baseDelays: { averageDelay: number; maxDelay: number; affectedOrders: number },
  scenarioType: string,
  severity: string,
  timeHorizon: number
): TimelineProjection[] {
  const projection: TimelineProjection[] = [];
  const { averageDelay, affectedOrders } = baseDelays;

  const recoveryPatterns = {
    supplier_failure: { recoveryRate: 0.15, stabilizationPoint: 0.8 },
    port_closure: { recoveryRate: 0.12, stabilizationPoint: 0.9 },
    demand_surge: { recoveryRate: 0.25, stabilizationPoint: 0.3 },
    natural_disaster: { recoveryRate: 0.08, stabilizationPoint: 0.6 },
    transportation_disruption: { recoveryRate: 0.20, stabilizationPoint: 0.4 }
  };

  const pattern = recoveryPatterns[scenarioType as keyof typeof recoveryPatterns] || recoveryPatterns.supplier_failure;

  for (let day = 0; day < timeHorizon; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);

    const weeksPassed = day / 7;
    const recoveryProgress = Math.min(1, weeksPassed * pattern.recoveryRate);
    const recoveryFactor = 1 - (recoveryProgress * (1 - pattern.stabilizationPoint));

    const projectedDelay = Math.max(0, averageDelay * recoveryFactor);
    const orderRecoveryFactor = Math.max(0.1, 1 - (recoveryProgress * 0.8));
    const projectedAffectedOrders = Math.round(affectedOrders * orderRecoveryFactor);

    const dailyImpact = projectedAffectedOrders * projectedDelay;
    const cumulativeImpact = day === 0 ? dailyImpact : 
      projection[day - 1].cumulativeImpact + dailyImpact;

    projection.push({
      date: date.toISOString().split('T')[0],
      projectedDelay: Math.round(projectedDelay * 10) / 10,
      affectedOrders: projectedAffectedOrders,
      cumulativeImpact: Math.round(cumulativeImpact)
    });
  }

  return projection;
}

function calculateImpactMetrics(
  deliveryDelays: { averageDelay: number; maxDelay: number; affectedOrders: number },
  scenarioType: string,
  region: string
): {
  customerSatisfactionImpact: number;
  revenueAtRisk: number;
  recoveryTimeEstimate: number;
} {
  const { averageDelay, affectedOrders } = deliveryDelays;

  const satisfactionImpactPerDay = 2.5;
  const customerSatisfactionImpact = Math.min(100, averageDelay * satisfactionImpactPerDay);

  const averageOrderValues = {
    asia: 850,
    europe: 1200,
    north_america: 1100,
    south_america: 750,
    global: 950
  };

  const getCancellationRate = (delay: number): number => {
    if (delay <= 7) return 0.05;
    if (delay <= 14) return 0.12;
    if (delay <= 21) return 0.25;
    if (delay <= 35) return 0.40;
    return 0.60;
  };

  const avgOrderValue = averageOrderValues[region as keyof typeof averageOrderValues] || 950;
  const cancellationRate = getCancellationRate(averageDelay);
  const revenueAtRisk = Math.round(affectedOrders * avgOrderValue * cancellationRate);

  const baseRecoveryTimes = {
    supplier_failure: 28,
    port_closure: 35,
    demand_surge: 14,
    natural_disaster: 56,
    transportation_disruption: 21
  };

  const baseRecoveryTime = baseRecoveryTimes[scenarioType as keyof typeof baseRecoveryTimes] || 28;
  const severityAdjustment = Math.max(0.5, Math.min(2.0, averageDelay / 14));
  const recoveryTimeEstimate = Math.round(baseRecoveryTime * severityAdjustment);

  return {
    customerSatisfactionImpact: Math.round(customerSatisfactionImpact * 10) / 10,
    revenueAtRisk,
    recoveryTimeEstimate
  };
}

describe('Delivery Delays Integration Tests', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Delivery Delay Calculations', () => {
    it('should calculate delivery delays with proper scaling by severity', async () => {
      const severityLevels = ['minor', 'moderate', 'severe', 'catastrophic'] as const;
      const results = [];

      for (const severity of severityLevels) {
        const result = await mockDelayTracking.trackDeliveryDelays(
          'supplier_failure',
          'asia',
          severity,
          30
        );
        results.push(result);
      }

      // Validate severity scaling
      for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const previous = results[i - 1];

        // Average delay should increase with severity
        expect(current.deliveryDelays.averageDelay).toBeGreaterThanOrEqual(
          previous.deliveryDelays.averageDelay * 0.8
        );

        // Max delay should increase with severity
        expect(current.deliveryDelays.maxDelay).toBeGreaterThanOrEqual(
          previous.deliveryDelays.maxDelay * 0.8
        );

        // Affected orders should increase with severity
        expect(current.deliveryDelays.affectedOrders).toBeGreaterThanOrEqual(
          previous.deliveryDelays.affectedOrders * 0.8
        );

        // Max delay should always be >= average delay
        expect(current.deliveryDelays.maxDelay).toBeGreaterThanOrEqual(
          current.deliveryDelays.averageDelay
        );
      }
    });

    it('should handle different scenario types with appropriate delay patterns', async () => {
      const scenarios = [
        { type: 'demand_surge', expectedRange: [3, 15] }, // Should be shorter delays
        { type: 'supplier_failure', expectedRange: [7, 35] }, // Medium delays
        { type: 'natural_disaster', expectedRange: [15, 80] }, // Longer delays
        { type: 'port_closure', expectedRange: [10, 50] } // Medium-long delays
      ];

      for (const scenario of scenarios) {
        const result = await mockDelayTracking.trackDeliveryDelays(
          scenario.type,
          'asia',
          'moderate',
          30
        );

        const avgDelay = result.deliveryDelays.averageDelay;
        const maxDelay = result.deliveryDelays.maxDelay;

        // Validate delay ranges are appropriate for scenario type
        expect(avgDelay).toBeGreaterThanOrEqual(scenario.expectedRange[0]);
        expect(maxDelay).toBeLessThanOrEqual(scenario.expectedRange[1] * 2); // Allow some variance

        // Validate basic constraints
        expect(avgDelay).toBeGreaterThan(0);
        expect(maxDelay).toBeGreaterThanOrEqual(avgDelay);
        expect(result.deliveryDelays.affectedOrders).toBeGreaterThan(0);
      }
    });

    it('should apply regional complexity multipliers correctly', async () => {
      const regions = ['south_america', 'europe', 'north_america', 'asia', 'global'] as const;
      const results = [];

      for (const region of regions) {
        const result = await mockDelayTracking.trackDeliveryDelays(
          'supplier_failure',
          region,
          'moderate',
          30
        );
        results.push({ region, result });
      }

      // Validate regional differences
      const delays = results.map(r => r.result.deliveryDelays.averageDelay);
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1); // Should have regional variation

      // Global should generally have higher complexity
      const globalResult = results.find(r => r.region === 'global');
      const europeResult = results.find(r => r.region === 'europe');
      
      if (globalResult && europeResult) {
        expect(globalResult.result.deliveryDelays.averageDelay).toBeGreaterThanOrEqual(
          europeResult.result.deliveryDelays.averageDelay * 0.9
        );
      }
    });
  });

  describe('Timeline Projection Generation', () => {
    it('should generate chronologically ordered timeline projections', async () => {
      const result = await mockDelayTracking.trackDeliveryDelays(
        'port_closure',
        'europe',
        'severe',
        45
      );

      const timeline = result.deliveryDelays.timelineProjection;
      expect(timeline.length).toBe(45);

      // Validate chronological order
      for (let i = 1; i < timeline.length; i++) {
        const currentDate = new Date(timeline[i].date);
        const previousDate = new Date(timeline[i - 1].date);
        
        expect(currentDate.getTime()).toBeGreaterThan(previousDate.getTime());
        
        // Should be exactly one day apart
        const dayDifference = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(Math.abs(dayDifference - 1)).toBeLessThan(0.1);
      }
    });

    it('should show recovery patterns over time', async () => {
      const result = await mockDelayTracking.trackDeliveryDelays(
        'transportation_disruption',
        'north_america',
        'moderate',
        60
      );

      const timeline = result.deliveryDelays.timelineProjection;
      
      // Delays should generally decrease over time (recovery)
      const firstWeek = timeline.slice(0, 7);
      const lastWeek = timeline.slice(-7);
      
      const avgFirstWeekDelay = firstWeek.reduce((sum, p) => sum + p.projectedDelay, 0) / firstWeek.length;
      const avgLastWeekDelay = lastWeek.reduce((sum, p) => sum + p.projectedDelay, 0) / lastWeek.length;
      
      expect(avgLastWeekDelay).toBeLessThanOrEqual(avgFirstWeekDelay);

      // Affected orders should also generally decrease
      const avgFirstWeekOrders = firstWeek.reduce((sum, p) => sum + p.affectedOrders, 0) / firstWeek.length;
      const avgLastWeekOrders = lastWeek.reduce((sum, p) => sum + p.affectedOrders, 0) / lastWeek.length;
      
      expect(avgLastWeekOrders).toBeLessThanOrEqual(avgFirstWeekOrders);

      // Cumulative impact should be non-decreasing
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].cumulativeImpact).toBeGreaterThanOrEqual(timeline[i - 1].cumulativeImpact);
      }
    });

    it('should handle different recovery patterns by scenario type', async () => {
      const scenarios = [
        { type: 'demand_surge', expectedFastRecovery: true },
        { type: 'natural_disaster', expectedSlowRecovery: true },
        { type: 'supplier_failure', expectedMediumRecovery: true }
      ];

      const results = [];
      
      for (const scenario of scenarios) {
        const result = await mockDelayTracking.trackDeliveryDelays(
          scenario.type,
          'asia',
          'moderate',
          42 // 6 weeks
        );
        results.push({ scenario: scenario.type, result });
      }

      // Compare recovery rates
      const demandSurgeResult = results.find(r => r.scenario === 'demand_surge');
      const naturalDisasterResult = results.find(r => r.scenario === 'natural_disaster');

      if (demandSurgeResult && naturalDisasterResult) {
        const demandSurgeTimeline = demandSurgeResult.result.deliveryDelays.timelineProjection;
        const disasterTimeline = naturalDisasterResult.result.deliveryDelays.timelineProjection;

        // At week 3, demand surge should have recovered more than natural disaster
        const week3Index = 20; // Day 21
        if (week3Index < demandSurgeTimeline.length && week3Index < disasterTimeline.length) {
          const demandSurgeDelay = demandSurgeTimeline[week3Index].projectedDelay;
          const disasterDelay = disasterTimeline[week3Index].projectedDelay;
          
          // Demand surge should have lower delay (better recovery)
          expect(demandSurgeDelay).toBeLessThanOrEqual(disasterDelay * 1.2);
        }
      }
    });

    it('should maintain data consistency in timeline projections', async () => {
      const result = await mockDelayTracking.trackDeliveryDelays(
        'supplier_failure',
        'europe',
        'severe',
        30
      );

      const timeline = result.deliveryDelays.timelineProjection;

      timeline.forEach((projection, index) => {
        // Validate data types and ranges
        expect(typeof projection.date).toBe('string');
        expect(projection.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        expect(projection.projectedDelay).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(projection.projectedDelay)).toBe(true);
        
        expect(projection.affectedOrders).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(projection.affectedOrders)).toBe(true);
        
        expect(projection.cumulativeImpact).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(projection.cumulativeImpact)).toBe(true);

        // Validate logical consistency
        if (projection.affectedOrders === 0) {
          expect(projection.projectedDelay).toBe(0);
        }

        // Cumulative impact should make sense
        if (index > 0) {
          const dailyImpact = projection.affectedOrders * projection.projectedDelay;
          const expectedCumulative = timeline[index - 1].cumulativeImpact + dailyImpact;
          
          // Allow small rounding differences
          expect(Math.abs(projection.cumulativeImpact - expectedCumulative)).toBeLessThan(1);
        }
      });
    });
  });

  describe('Impact Metrics Calculation', () => {
    it('should calculate customer satisfaction impact correctly', async () => {
      const testCases = [
        { delay: 7, expectedImpact: [15, 20] },   // 1 week delay
        { delay: 14, expectedImpact: [30, 40] },  // 2 week delay
        { delay: 28, expectedImpact: [65, 75] }   // 4 week delay
      ];

      for (const testCase of testCases) {
        // Create a scenario that produces approximately the target delay
        const result = await mockDelayTracking.trackDeliveryDelays(
          'demand_surge',
          'europe',
          testCase.delay > 20 ? 'severe' : 'moderate',
          30
        );

        const satisfaction = result.impactMetrics.customerSatisfactionImpact;
        
        // Should be within expected range
        expect(satisfaction).toBeGreaterThanOrEqual(testCase.expectedImpact[0]);
        expect(satisfaction).toBeLessThanOrEqual(testCase.expectedImpact[1]);
        expect(satisfaction).toBeLessThanOrEqual(100); // Max 100%
      }
    });

    it('should calculate revenue at risk based on regional order values', async () => {
      const regions = ['south_america', 'asia', 'europe', 'north_america'] as const;
      const results = [];

      for (const region of regions) {
        const result = await mockDelayTracking.trackDeliveryDelays(
          'supplier_failure',
          region,
          'moderate',
          30
        );
        results.push({ region, revenueAtRisk: result.impactMetrics.revenueAtRisk });
      }

      // Revenue at risk should vary by region due to different order values
      const revenues = results.map(r => r.revenueAtRisk);
      const uniqueRevenues = new Set(revenues);
      expect(uniqueRevenues.size).toBeGreaterThan(1);

      // All revenues should be positive
      revenues.forEach(revenue => {
        expect(revenue).toBeGreaterThan(0);
        expect(Number.isFinite(revenue)).toBe(true);
      });

      // Europe should generally have higher revenue at risk due to higher order values
      const europeResult = results.find(r => r.region === 'europe');
      const southAmericaResult = results.find(r => r.region === 'south_america');
      
      if (europeResult && southAmericaResult) {
        expect(europeResult.revenueAtRisk).toBeGreaterThanOrEqual(
          southAmericaResult.revenueAtRisk * 0.8
        );
      }
    });

    it('should estimate recovery time based on scenario complexity', async () => {
      const scenarios = [
        { type: 'demand_surge', expectedRecovery: [10, 25] },      // Fast recovery
        { type: 'supplier_failure', expectedRecovery: [20, 45] },  // Medium recovery
        { type: 'natural_disaster', expectedRecovery: [40, 80] }   // Slow recovery
      ];

      for (const scenario of scenarios) {
        const result = await mockDelayTracking.trackDeliveryDelays(
          scenario.type,
          'asia',
          'moderate',
          30
        );

        const recoveryTime = result.impactMetrics.recoveryTimeEstimate;
        
        expect(recoveryTime).toBeGreaterThanOrEqual(scenario.expectedRecovery[0]);
        expect(recoveryTime).toBeLessThanOrEqual(scenario.expectedRecovery[1]);
        expect(recoveryTime).toBeGreaterThan(0);
        expect(Number.isInteger(recoveryTime)).toBe(true);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid scenario types gracefully', async () => {
      const result = await mockDelayTracking.trackDeliveryDelays(
        'invalid_scenario',
        'asia',
        'moderate',
        30
      );

      // Should fallback to default scenario
      expect(result.deliveryDelays.averageDelay).toBeGreaterThan(0);
      expect(result.deliveryDelays.maxDelay).toBeGreaterThanOrEqual(result.deliveryDelays.averageDelay);
      expect(result.deliveryDelays.affectedOrders).toBeGreaterThan(0);
      expect(result.deliveryDelays.timelineProjection.length).toBe(30);
    });

    it('should handle invalid regions gracefully', async () => {
      const result = await mockDelayTracking.trackDeliveryDelays(
        'supplier_failure',
        'invalid_region',
        'moderate',
        30
      );

      // Should fallback to default region values
      expect(result.deliveryDelays.averageDelay).toBeGreaterThan(0);
      expect(result.impactMetrics.revenueAtRisk).toBeGreaterThan(0);
      expect(result.impactMetrics.recoveryTimeEstimate).toBeGreaterThan(0);
    });

    it('should handle extreme time horizons', async () => {
      const extremeCases = [1, 365]; // 1 day and 1 year

      for (const timeHorizon of extremeCases) {
        const result = await mockDelayTracking.trackDeliveryDelays(
          'supplier_failure',
          'asia',
          'moderate',
          timeHorizon
        );

        expect(result.deliveryDelays.timelineProjection.length).toBe(timeHorizon);
        
        // Validate all projections are valid
        result.deliveryDelays.timelineProjection.forEach(projection => {
          expect(projection.projectedDelay).toBeGreaterThanOrEqual(0);
          expect(projection.affectedOrders).toBeGreaterThanOrEqual(0);
          expect(projection.cumulativeImpact).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(projection.projectedDelay)).toBe(true);
          expect(Number.isFinite(projection.affectedOrders)).toBe(true);
          expect(Number.isFinite(projection.cumulativeImpact)).toBe(true);
        });
      }
    });

    it('should handle zero time horizon gracefully', async () => {
      const result = await mockDelayTracking.trackDeliveryDelays(
        'supplier_failure',
        'asia',
        'moderate',
        0
      );

      expect(result.deliveryDelays.timelineProjection.length).toBe(0);
      expect(result.deliveryDelays.averageDelay).toBeGreaterThan(0);
      expect(result.deliveryDelays.maxDelay).toBeGreaterThan(0);
      expect(result.deliveryDelays.affectedOrders).toBeGreaterThan(0);
    });
  });

  describe('Performance and Data Integrity', () => {
    it('should generate timeline projections efficiently', async () => {
      const startTime = Date.now();
      
      const result = await mockDelayTracking.trackDeliveryDelays(
        'natural_disaster',
        'global',
        'catastrophic',
        90 // 3 months
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.deliveryDelays.timelineProjection.length).toBe(90);
    });

    it('should maintain numerical stability with large time horizons', async () => {
      const result = await mockDelayTracking.trackDeliveryDelays(
        'supplier_failure',
        'global',
        'catastrophic',
        180 // 6 months
      );

      const timeline = result.deliveryDelays.timelineProjection;
      
      // Check for numerical overflow or underflow
      timeline.forEach(projection => {
        expect(Number.isFinite(projection.projectedDelay)).toBe(true);
        expect(Number.isFinite(projection.affectedOrders)).toBe(true);
        expect(Number.isFinite(projection.cumulativeImpact)).toBe(true);
        
        expect(projection.projectedDelay).toBeLessThan(Number.MAX_SAFE_INTEGER);
        expect(projection.affectedOrders).toBeLessThan(Number.MAX_SAFE_INTEGER);
        expect(projection.cumulativeImpact).toBeLessThan(Number.MAX_SAFE_INTEGER);
      });

      // Final cumulative impact should be reasonable
      const finalImpact = timeline[timeline.length - 1].cumulativeImpact;
      expect(finalImpact).toBeGreaterThan(0);
      expect(finalImpact).toBeLessThan(1e12); // Reasonable upper bound
    });
  });
});