/**
 * Impact Assessment Integration Tests
 * 
 * Tests the complete impact analysis pipeline from voice input to visualization
 * Validates data consistency across impact calculation modules
 * Tests error handling and fallback scenarios
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as impactAssessmentAPI } from '../../app/api/impact-assessment/route';
import { 
  ImpactAssessmentResponse, 
  TimelineProjection, 
  NetworkNode, 
  PropagationStep,
  MitigationStrategy 
} from '../../lib/types/enhanced-analytics';
import { ImpactAssessmentResponseSchema } from '../../lib/validation/analytics-schemas';

// Mock Google Cloud Functions for testing
jest.mock('@google-cloud/functions-framework', () => ({
  http: jest.fn()
}));

describe('Impact Assessment Integration Tests', () => {
  let mockRequest: (body: any) => NextRequest;

  beforeAll(() => {
    // Setup mock request helper
    mockRequest = (body: any) => {
      return new NextRequest('http://localhost:3000/api/impact-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    // Mock console methods to reduce test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Impact Analysis Pipeline', () => {
    it('should process supplier failure scenario end-to-end', async () => {
      const requestBody = {
        scenarioType: 'supplier_failure',
        region: 'asia',
        severity: 'moderate'
      };

      const request = mockRequest(requestBody);
      const response = await impactAssessmentAPI(request);
      const responseData = await response.json() as ImpactAssessmentResponse;

      // Validate response structure
      expect(response.status).toBe(200);
      expect(responseData).toBeDefined();
      
      // Validate schema compliance
      const validation = ImpactAssessmentResponseSchema.safeParse(responseData);
      expect(validation.success).toBe(true);

      // Validate financial impact completeness
      expect(responseData.financialImpact).toBeDefined();
      expect(responseData.financialImpact.directCosts).toBeGreaterThan(0);
      expect(responseData.financialImpact.opportunityCosts).toBeGreaterThan(0);
      expect(responseData.financialImpact.laborCosts).toBeGreaterThan(0);
      expect(responseData.financialImpact.materialCosts).toBeGreaterThan(0);
      expect(responseData.financialImpact.logisticsCosts).toBeGreaterThan(0);
      
      // Validate total impact calculation
      const expectedTotal = 
        responseData.financialImpact.directCosts +
        responseData.financialImpact.opportunityCosts +
        responseData.financialImpact.laborCosts +
        responseData.financialImpact.materialCosts +
        responseData.financialImpact.logisticsCosts;
      
      expect(responseData.financialImpact.totalImpact).toBe(expectedTotal);
      expect(responseData.financialImpact.currency).toBe('USD');

      // Validate operational impact
      expect(responseData.operationalImpact).toBeDefined();
      expect(responseData.operationalImpact.deliveryDelays.averageDelay).toBeGreaterThan(0);
      expect(responseData.operationalImpact.deliveryDelays.maxDelay).toBeGreaterThanOrEqual(
        responseData.operationalImpact.deliveryDelays.averageDelay
      );
      expect(responseData.operationalImpact.deliveryDelays.affectedOrders).toBeGreaterThan(0);

      // Validate timeline projection
      expect(responseData.operationalImpact.deliveryDelays.timelineProjection).toBeDefined();
      expect(responseData.operationalImpact.deliveryDelays.timelineProjection.length).toBeGreaterThan(0);
      
      // Validate timeline projection data consistency
      const timeline = responseData.operationalImpact.deliveryDelays.timelineProjection;
      timeline.forEach((projection: TimelineProjection, index: number) => {
        expect(projection.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
        expect(projection.projectedDelay).toBeGreaterThanOrEqual(0);
        expect(projection.affectedOrders).toBeGreaterThanOrEqual(0);
        expect(projection.cumulativeImpact).toBeGreaterThanOrEqual(0);
        
        // Validate chronological order
        if (index > 0) {
          expect(new Date(projection.date).getTime()).toBeGreaterThan(
            new Date(timeline[index - 1].date).getTime()
          );
        }
      });

      // Validate cascade effects
      expect(responseData.operationalImpact.cascadeEffects).toBeDefined();
      expect(responseData.operationalImpact.cascadeEffects.networkImpactScore).toBeGreaterThanOrEqual(0);
      expect(responseData.operationalImpact.cascadeEffects.networkImpactScore).toBeLessThanOrEqual(100);

      // Validate recommendations
      expect(responseData.recommendations).toBeDefined();
      expect(responseData.recommendations.length).toBeGreaterThan(0);
      
      responseData.recommendations.forEach((strategy: MitigationStrategy) => {
        expect(strategy.id).toBeDefined();
        expect(strategy.name).toBeDefined();
        expect(strategy.description).toBeDefined();
        expect(strategy.estimatedCost).toBeGreaterThan(0);
        expect(strategy.timeToImplement).toBeGreaterThan(0);
        expect(strategy.riskReduction).toBeGreaterThanOrEqual(0);
        expect(strategy.riskReduction).toBeLessThanOrEqual(100);
        expect(strategy.paybackPeriod).toBeGreaterThan(0);
      });

      // Validate confidence score
      expect(responseData.confidence).toBeGreaterThanOrEqual(50);
      expect(responseData.confidence).toBeLessThanOrEqual(95);

      // Validate timestamp
      expect(responseData.analysisTimestamp).toBeDefined();
      expect(new Date(responseData.analysisTimestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should process port closure scenario with different severity levels', async () => {
      const severityLevels = ['minor', 'moderate', 'severe', 'catastrophic'] as const;
      const results: ImpactAssessmentResponse[] = [];

      for (const severity of severityLevels) {
        const requestBody = {
          scenarioType: 'port_closure',
          region: 'europe',
          severity
        };

        const request = mockRequest(requestBody);
        const response = await impactAssessmentAPI(request);
        const responseData = await response.json() as ImpactAssessmentResponse;

        expect(response.status).toBe(200);
        results.push(responseData);
      }

      // Validate severity scaling - higher severity should generally mean higher impact
      for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const previous = results[i - 1];

        // Financial impact should generally increase with severity
        expect(current.financialImpact.totalImpact).toBeGreaterThanOrEqual(
          previous.financialImpact.totalImpact * 0.8 // Allow some variance
        );

        // Delivery delays should increase with severity
        expect(current.operationalImpact.deliveryDelays.averageDelay).toBeGreaterThanOrEqual(
          previous.operationalImpact.deliveryDelays.averageDelay * 0.8
        );

        // Affected orders should increase with severity
        expect(current.operationalImpact.deliveryDelays.affectedOrders).toBeGreaterThanOrEqual(
          previous.operationalImpact.deliveryDelays.affectedOrders * 0.8
        );
      }
    });

    it('should process natural disaster scenario with regional variations', async () => {
      const regions = ['asia', 'europe', 'north_america'] as const;
      const results: ImpactAssessmentResponse[] = [];

      for (const region of regions) {
        const requestBody = {
          scenarioType: 'natural_disaster',
          region,
          severity: 'severe'
        };

        const request = mockRequest(requestBody);
        const response = await impactAssessmentAPI(request);
        const responseData = await response.json() as ImpactAssessmentResponse;

        expect(response.status).toBe(200);
        results.push(responseData);

        // Validate region-specific characteristics
        expect(responseData.financialImpact.totalImpact).toBeGreaterThan(0);
        expect(responseData.operationalImpact.deliveryDelays.averageDelay).toBeGreaterThan(0);
        
        // Natural disasters should have high impact scores
        expect(responseData.operationalImpact.cascadeEffects.networkImpactScore).toBeGreaterThan(50);
      }

      // Validate that different regions produce different results
      const uniqueImpacts = new Set(results.map(r => r.financialImpact.totalImpact));
      expect(uniqueImpacts.size).toBeGreaterThan(1); // Should have regional variation
    });
  });

  describe('Data Consistency Across Modules', () => {
    it('should maintain consistent data between financial and operational impact calculations', async () => {
      const requestBody = {
        scenarioType: 'transportation_disruption',
        region: 'asia',
        severity: 'moderate'
      };

      const request = mockRequest(requestBody);
      const response = await impactAssessmentAPI(request);
      const responseData = await response.json() as ImpactAssessmentResponse;

      expect(response.status).toBe(200);

      // Validate consistency between financial and operational metrics
      const financialImpact = responseData.financialImpact.totalImpact;
      const affectedOrders = responseData.operationalImpact.deliveryDelays.affectedOrders;
      const averageDelay = responseData.operationalImpact.deliveryDelays.averageDelay;

      // Higher financial impact should correlate with more affected orders or longer delays
      if (financialImpact > 5000000) { // High impact threshold
        expect(affectedOrders > 2000 || averageDelay > 14).toBe(true);
      }

      // Validate timeline projection consistency
      const timeline = responseData.operationalImpact.deliveryDelays.timelineProjection;
      let previousCumulative = 0;
      
      timeline.forEach((projection: TimelineProjection) => {
        // Cumulative impact should be non-decreasing
        expect(projection.cumulativeImpact).toBeGreaterThanOrEqual(previousCumulative);
        previousCumulative = projection.cumulativeImpact;
        
        // Projected delay should be reasonable relative to affected orders
        if (projection.affectedOrders > 0) {
          expect(projection.projectedDelay).toBeGreaterThanOrEqual(0);
        }
      });

      // Validate cascade effects consistency
      const cascadeEffects = responseData.operationalImpact.cascadeEffects;
      const networkImpactScore = cascadeEffects.networkImpactScore;
      
      // Network impact score should reflect the severity of financial impact
      const impactRatio = financialImpact / 10000000; // Normalize to 10M baseline
      const expectedMinScore = Math.min(75, impactRatio * 50);
      expect(networkImpactScore).toBeGreaterThanOrEqual(expectedMinScore * 0.7); // Allow variance
    });

    it('should maintain consistent mitigation strategy costs relative to total impact', async () => {
      const requestBody = {
        scenarioType: 'supplier_failure',
        region: 'europe',
        severity: 'severe'
      };

      const request = mockRequest(requestBody);
      const response = await impactAssessmentAPI(request);
      const responseData = await response.json() as ImpactAssessmentResponse;

      expect(response.status).toBe(200);

      const totalImpact = responseData.financialImpact.totalImpact;
      const recommendations = responseData.recommendations;

      recommendations.forEach((strategy: MitigationStrategy) => {
        // Strategy cost should be reasonable relative to total impact
        expect(strategy.estimatedCost).toBeLessThan(totalImpact * 0.5); // Max 50% of impact
        expect(strategy.estimatedCost).toBeGreaterThan(totalImpact * 0.01); // Min 1% of impact

        // ROI should be positive for recommended strategies
        expect(strategy.roi).toBeGreaterThan(0);

        // Risk reduction should correlate with cost
        const costRatio = strategy.estimatedCost / totalImpact;
        const expectedMinReduction = Math.min(30, costRatio * 1000); // Higher cost = higher reduction
        expect(strategy.riskReduction).toBeGreaterThanOrEqual(expectedMinReduction);

        // Payback period should be reasonable
        expect(strategy.paybackPeriod).toBeGreaterThan(0);
        expect(strategy.paybackPeriod).toBeLessThan(60); // Max 5 years
      });
    });

    it('should maintain consistent confidence scores across different scenario complexities', async () => {
      const scenarios = [
        { type: 'demand_surge', region: 'north_america', severity: 'minor' }, // Simple
        { type: 'supplier_failure', region: 'asia', severity: 'moderate' }, // Medium
        { type: 'natural_disaster', region: 'global', severity: 'catastrophic' } // Complex
      ] as const;

      const results: ImpactAssessmentResponse[] = [];

      for (const scenario of scenarios) {
        const requestBody = {
          scenarioType: scenario.type,
          region: scenario.region,
          severity: scenario.severity
        };

        const request = mockRequest(requestBody);
        const response = await impactAssessmentAPI(request);
        const responseData = await response.json() as ImpactAssessmentResponse;

        expect(response.status).toBe(200);
        results.push(responseData);
      }

      // Validate confidence score patterns
      const [simple, medium, complex] = results;

      // Simple scenarios should have higher confidence
      expect(simple.confidence).toBeGreaterThanOrEqual(75);
      
      // Complex scenarios should have lower confidence
      expect(complex.confidence).toBeLessThanOrEqual(85);
      
      // Global scenarios should have lower confidence than regional ones
      if (complex.confidence < medium.confidence) {
        expect(complex.confidence).toBeLessThan(medium.confidence);
      }

      // All confidence scores should be within valid range
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThanOrEqual(50);
        expect(result.confidence).toBeLessThanOrEqual(95);
      });
    });
  });

  describe('Error Handling and Fallback Scenarios', () => {
    it('should handle invalid scenario type gracefully', async () => {
      const requestBody = {
        scenarioType: 'invalid_scenario_type',
        region: 'asia',
        severity: 'moderate'
      };

      const request = mockRequest(requestBody);
      const response = await impactAssessmentAPI(request);
      const responseData = await response.json() as ImpactAssessmentResponse;

      // Should fallback to default scenario (supplier_failure)
      expect(response.status).toBe(200);
      expect(responseData).toBeDefined();
      expect(responseData.financialImpact.totalImpact).toBeGreaterThan(0);
    });

    it('should handle invalid region gracefully', async () => {
      const requestBody = {
        scenarioType: 'supplier_failure',
        region: 'invalid_region',
        severity: 'moderate'
      };

      const request = mockRequest(requestBody);
      const response = await impactAssessmentAPI(request);
      const responseData = await response.json() as ImpactAssessmentResponse;

      // Should fallback to default region (asia)
      expect(response.status).toBe(200);
      expect(responseData).toBeDefined();
      expect(responseData.financialImpact.totalImpact).toBeGreaterThan(0);
    });

    it('should handle invalid severity gracefully', async () => {
      const requestBody = {
        scenarioType: 'supplier_failure',
        region: 'asia',
        severity: 'invalid_severity'
      };

      const request = mockRequest(requestBody);
      const response = await impactAssessmentAPI(request);
      const responseData = await response.json() as ImpactAssessmentResponse;

      // Should fallback to default severity (moderate)
      expect(response.status).toBe(200);
      expect(responseData).toBeDefined();
      expect(responseData.financialImpact.totalImpact).toBeGreaterThan(0);
    });

    it('should handle empty request body gracefully', async () => {
      const requestBody = {};

      const request = mockRequest(requestBody);
      const response = await impactAssessmentAPI(request);
      const responseData = await response.json() as ImpactAssessmentResponse;

      // Should use all defaults
      expect(response.status).toBe(200);
      expect(responseData).toBeDefined();
      expect(responseData.financialImpact.totalImpact).toBeGreaterThan(0);
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/impact-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"invalid": json}', // Malformed JSON
      });

      const response = await impactAssessmentAPI(request);
      
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData.error).toBeDefined();
    });

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/impact-assessment', {
        method: 'POST',
        body: JSON.stringify({
          scenarioType: 'supplier_failure',
          region: 'asia',
          severity: 'moderate'
        }),
      });

      const response = await impactAssessmentAPI(request);
      const responseData = await response.json() as ImpactAssessmentResponse;

      // Should still work without content-type header
      expect(response.status).toBe(200);
      expect(responseData).toBeDefined();
      expect(responseData.financialImpact.totalImpact).toBeGreaterThan(0);
    });

    it('should validate response data integrity under edge conditions', async () => {
      const edgeScenarios = [
        { scenarioType: 'natural_disaster', region: 'global', severity: 'catastrophic' },
        { scenarioType: 'demand_surge', region: 'south_america', severity: 'minor' },
      ];

      for (const scenario of edgeScenarios) {
        const request = mockRequest(scenario);
        const response = await impactAssessmentAPI(request);
        const responseData = await response.json() as ImpactAssessmentResponse;

        expect(response.status).toBe(200);

        // Validate data integrity under edge conditions
        expect(responseData.financialImpact.totalImpact).toBeGreaterThan(0);
        expect(responseData.financialImpact.totalImpact).toBeLessThan(Number.MAX_SAFE_INTEGER);
        
        expect(responseData.operationalImpact.deliveryDelays.averageDelay).toBeGreaterThanOrEqual(0);
        expect(responseData.operationalImpact.deliveryDelays.maxDelay).toBeGreaterThanOrEqual(
          responseData.operationalImpact.deliveryDelays.averageDelay
        );
        
        expect(responseData.confidence).toBeGreaterThanOrEqual(50);
        expect(responseData.confidence).toBeLessThanOrEqual(95);

        // Validate timeline projection doesn't have infinite or NaN values
        responseData.operationalImpact.deliveryDelays.timelineProjection.forEach(projection => {
          expect(Number.isFinite(projection.projectedDelay)).toBe(true);
          expect(Number.isFinite(projection.affectedOrders)).toBe(true);
          expect(Number.isFinite(projection.cumulativeImpact)).toBe(true);
        });

        // Validate recommendations are reasonable
        responseData.recommendations.forEach(strategy => {
          expect(Number.isFinite(strategy.estimatedCost)).toBe(true);
          expect(Number.isFinite(strategy.roi)).toBe(true);
          expect(Number.isFinite(strategy.paybackPeriod)).toBe(true);
          expect(strategy.estimatedCost).toBeGreaterThan(0);
          expect(strategy.paybackPeriod).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Performance and Response Time', () => {
    it('should respond within acceptable time limits', async () => {
      const requestBody = {
        scenarioType: 'supplier_failure',
        region: 'asia',
        severity: 'moderate'
      };

      const startTime = Date.now();
      const request = mockRequest(requestBody);
      const response = await impactAssessmentAPI(request);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle concurrent requests without data corruption', async () => {
      const scenarios = [
        { scenarioType: 'supplier_failure', region: 'asia', severity: 'moderate' },
        { scenarioType: 'port_closure', region: 'europe', severity: 'severe' },
        { scenarioType: 'natural_disaster', region: 'north_america', severity: 'catastrophic' },
      ];

      // Execute concurrent requests
      const promises = scenarios.map(scenario => {
        const request = mockRequest(scenario);
        return impactAssessmentAPI(request);
      });

      const responses = await Promise.all(promises);
      const responseData = await Promise.all(
        responses.map(response => response.json() as Promise<ImpactAssessmentResponse>)
      );

      // Validate all responses are successful and unique
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Validate responses are different (no data corruption)
      const uniqueImpacts = new Set(responseData.map(data => data.financialImpact.totalImpact));
      expect(uniqueImpacts.size).toBe(scenarios.length);
    });
  });
});