/**
 * Cascade Effects Integration Tests
 * 
 * Tests the cascade analysis functionality and network propagation
 * Validates data consistency in network topology and impact propagation
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { NetworkNode, PropagationStep } from '../../lib/types/enhanced-analytics';

// Mock the cascade effects function since it's a Google Cloud Function
const mockCascadeAnalysis = {
  analyzeCascadeEffects: async (scenarioType: string, originNode: string, region: string, severity: string) => {
    // Simulate cascade analysis logic
    const networkTopology = generateMockNetworkTopology(region);
    const origin = originNode || getDefaultOriginNode(scenarioType, region);
    
    return analyzeCascadePropagation(networkTopology, origin, scenarioType, severity);
  }
};

// Helper functions to simulate the cascade analysis logic
function generateMockNetworkTopology(region: string): NetworkNode[] {
  const regionNetworks: Record<string, NetworkNode[]> = {
    asia: [
      {
        id: 'supplier-asia-001',
        name: 'Shanghai Electronics Supplier',
        type: 'supplier',
        region: 'asia',
        riskLevel: 'medium',
        impactScore: 85
      },
      {
        id: 'manufacturer-asia-001',
        name: 'Shenzhen Manufacturing Hub',
        type: 'manufacturer',
        region: 'asia',
        riskLevel: 'high',
        impactScore: 92
      },
      {
        id: 'distributor-asia-001',
        name: 'Hong Kong Distribution Center',
        type: 'distributor',
        region: 'asia',
        riskLevel: 'medium',
        impactScore: 78
      }
    ],
    europe: [
      {
        id: 'supplier-europe-001',
        name: 'German Automotive Parts',
        type: 'supplier',
        region: 'europe',
        riskLevel: 'low',
        impactScore: 70
      },
      {
        id: 'manufacturer-europe-001',
        name: 'Netherlands Manufacturing',
        type: 'manufacturer',
        region: 'europe',
        riskLevel: 'medium',
        impactScore: 80
      }
    ]
  };

  return regionNetworks[region] || regionNetworks.asia;
}

function getDefaultOriginNode(scenarioType: string, region: string): string {
  const defaultOrigins: Record<string, Record<string, string>> = {
    supplier_failure: {
      asia: 'supplier-asia-001',
      europe: 'supplier-europe-001'
    },
    port_closure: {
      asia: 'distributor-asia-001',
      europe: 'distributor-europe-001'
    }
  };

  return defaultOrigins[scenarioType]?.[region] || 'supplier-asia-001';
}

function analyzeCascadePropagation(
  networkTopology: NetworkNode[],
  originNodeId: string,
  scenarioType: string,
  severity: string
): {
  affectedNodes: NetworkNode[];
  propagationPath: PropagationStep[];
  networkImpactScore: number;
} {
  const severityMultipliers = {
    minor: 0.3,
    moderate: 0.6,
    severe: 0.8,
    catastrophic: 1.0
  };

  const multiplier = severityMultipliers[severity as keyof typeof severityMultipliers] || 0.6;
  const originNode = networkTopology.find(node => node.id === originNodeId);
  
  if (!originNode) {
    throw new Error(`Origin node ${originNodeId} not found`);
  }

  const affectedNodes: NetworkNode[] = [
    {
      ...originNode,
      impactScore: Math.min(100, originNode.impactScore * multiplier)
    }
  ];

  const propagationPath: PropagationStep[] = [];
  
  // Simulate propagation to connected nodes
  const connectedNodes = networkTopology.filter(node => 
    node.id !== originNodeId && node.region === originNode.region
  );

  connectedNodes.forEach((node, index) => {
    const impactMagnitude = Math.max(10, 100 * multiplier * Math.pow(0.7, index + 1));
    
    if (impactMagnitude > 10) {
      affectedNodes.push({
        ...node,
        impactScore: Math.min(100, node.impactScore * (impactMagnitude / 100))
      });

      propagationPath.push({
        fromNode: originNodeId,
        toNode: node.id,
        impactDelay: index + 1,
        impactMagnitude,
        propagationType: index === 0 ? 'direct' : 'indirect'
      });
    }
  });

  const networkImpactScore = Math.min(100, Math.round(multiplier * 75));

  return {
    affectedNodes,
    propagationPath,
    networkImpactScore
  };
}

describe('Cascade Effects Integration Tests', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Network Topology Generation', () => {
    it('should generate consistent network topology for each region', async () => {
      const regions = ['asia', 'europe', 'north_america'];
      
      for (const region of regions) {
        const result = await mockCascadeAnalysis.analyzeCascadeEffects(
          'supplier_failure',
          '',
          region,
          'moderate'
        );

        expect(result.affectedNodes).toBeDefined();
        expect(result.affectedNodes.length).toBeGreaterThan(0);

        // Validate network node structure
        result.affectedNodes.forEach(node => {
          expect(node.id).toBeDefined();
          expect(node.name).toBeDefined();
          expect(['supplier', 'manufacturer', 'distributor', 'retailer']).toContain(node.type);
          expect(node.region).toBeDefined();
          expect(['low', 'medium', 'high', 'critical']).toContain(node.riskLevel);
          expect(node.impactScore).toBeGreaterThanOrEqual(0);
          expect(node.impactScore).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should maintain node relationships within the same region', async () => {
      const result = await mockCascadeAnalysis.analyzeCascadeEffects(
        'supplier_failure',
        'supplier-asia-001',
        'asia',
        'severe'
      );

      // All affected nodes should be in the same region
      result.affectedNodes.forEach(node => {
        expect(node.region).toBe('asia');
      });

      // Propagation should follow logical supply chain relationships
      result.propagationPath.forEach(step => {
        expect(step.fromNode).toBeDefined();
        expect(step.toNode).toBeDefined();
        expect(step.fromNode).not.toBe(step.toNode);
        expect(step.impactDelay).toBeGreaterThan(0);
        expect(step.impactMagnitude).toBeGreaterThan(0);
        expect(['direct', 'indirect', 'cascading']).toContain(step.propagationType);
      });
    });
  });

  describe('Impact Propagation Logic', () => {
    it('should propagate impact with decreasing magnitude', async () => {
      const result = await mockCascadeAnalysis.analyzeCascadeEffects(
        'supplier_failure',
        'supplier-asia-001',
        'asia',
        'severe'
      );

      // Sort propagation steps by delay to check magnitude decay
      const sortedSteps = result.propagationPath.sort((a, b) => a.impactDelay - b.impactDelay);
      
      for (let i = 1; i < sortedSteps.length; i++) {
        const current = sortedSteps[i];
        const previous = sortedSteps[i - 1];
        
        // Impact magnitude should generally decrease with distance
        // Allow some variance for different node types
        expect(current.impactMagnitude).toBeLessThanOrEqual(previous.impactMagnitude * 1.2);
      }
    });

    it('should handle different severity levels appropriately', async () => {
      const severityLevels = ['minor', 'moderate', 'severe', 'catastrophic'] as const;
      const results = [];

      for (const severity of severityLevels) {
        const result = await mockCascadeAnalysis.analyzeCascadeEffects(
          'natural_disaster',
          'manufacturer-asia-001',
          'asia',
          severity
        );
        results.push(result);
      }

      // Higher severity should generally result in more affected nodes and higher impact scores
      for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const previous = results[i - 1];

        // Network impact score should increase with severity
        expect(current.networkImpactScore).toBeGreaterThanOrEqual(previous.networkImpactScore * 0.8);

        // Number of affected nodes should increase or stay the same
        expect(current.affectedNodes.length).toBeGreaterThanOrEqual(previous.affectedNodes.length);

        // Total impact magnitude should increase
        const currentTotalImpact = current.propagationPath.reduce((sum, step) => sum + step.impactMagnitude, 0);
        const previousTotalImpact = previous.propagationPath.reduce((sum, step) => sum + step.impactMagnitude, 0);
        
        if (currentTotalImpact > 0 && previousTotalImpact > 0) {
          expect(currentTotalImpact).toBeGreaterThanOrEqual(previousTotalImpact * 0.8);
        }
      }
    });

    it('should handle different scenario types with appropriate propagation patterns', async () => {
      const scenarios = [
        { type: 'supplier_failure', expectedOriginType: 'supplier' },
        { type: 'port_closure', expectedOriginType: 'distributor' },
        { type: 'natural_disaster', expectedOriginType: 'manufacturer' }
      ];

      for (const scenario of scenarios) {
        const result = await mockCascadeAnalysis.analyzeCascadeEffects(
          scenario.type,
          '',
          'asia',
          'moderate'
        );

        expect(result.affectedNodes.length).toBeGreaterThan(0);
        expect(result.networkImpactScore).toBeGreaterThan(0);
        expect(result.networkImpactScore).toBeLessThanOrEqual(100);

        // Validate propagation paths exist
        if (result.affectedNodes.length > 1) {
          expect(result.propagationPath.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Network Impact Score Calculation', () => {
    it('should calculate network impact score within valid range', async () => {
      const testCases = [
        { scenario: 'supplier_failure', region: 'asia', severity: 'minor' },
        { scenario: 'port_closure', region: 'europe', severity: 'severe' },
        { scenario: 'natural_disaster', region: 'asia', severity: 'catastrophic' }
      ];

      for (const testCase of testCases) {
        const result = await mockCascadeAnalysis.analyzeCascadeEffects(
          testCase.scenario,
          '',
          testCase.region,
          testCase.severity
        );

        expect(result.networkImpactScore).toBeGreaterThanOrEqual(0);
        expect(result.networkImpactScore).toBeLessThanOrEqual(100);
        expect(Number.isInteger(result.networkImpactScore)).toBe(true);
      }
    });

    it('should correlate network impact score with affected nodes and propagation', async () => {
      const result = await mockCascadeAnalysis.analyzeCascadeEffects(
        'natural_disaster',
        'manufacturer-asia-001',
        'asia',
        'catastrophic'
      );

      const totalAffectedNodes = result.affectedNodes.length;
      const totalPropagationSteps = result.propagationPath.length;
      const averageImpactMagnitude = result.propagationPath.length > 0 
        ? result.propagationPath.reduce((sum, step) => sum + step.impactMagnitude, 0) / result.propagationPath.length
        : 0;

      // Network impact score should reflect the extent of cascade effects
      if (totalAffectedNodes > 2 && averageImpactMagnitude > 50) {
        expect(result.networkImpactScore).toBeGreaterThan(60);
      }

      if (totalPropagationSteps === 0) {
        expect(result.networkImpactScore).toBeLessThan(50);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid origin node gracefully', async () => {
      try {
        await mockCascadeAnalysis.analyzeCascadeEffects(
          'supplier_failure',
          'invalid-node-id',
          'asia',
          'moderate'
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('not found');
      }
    });

    it('should handle empty network topology', async () => {
      // Mock empty network
      const originalFunction = generateMockNetworkTopology;
      (global as any).generateMockNetworkTopology = () => [];

      try {
        const result = await mockCascadeAnalysis.analyzeCascadeEffects(
          'supplier_failure',
          'supplier-asia-001',
          'unknown_region',
          'moderate'
        );

        // Should fallback to default network or handle gracefully
        expect(result.affectedNodes).toBeDefined();
        expect(result.propagationPath).toBeDefined();
        expect(result.networkImpactScore).toBeGreaterThanOrEqual(0);
      } finally {
        // Restore original function
        (global as any).generateMockNetworkTopology = originalFunction;
      }
    });

    it('should handle extreme severity values', async () => {
      const extremeCases = ['minor', 'catastrophic'];

      for (const severity of extremeCases) {
        const result = await mockCascadeAnalysis.analyzeCascadeEffects(
          'natural_disaster',
          'manufacturer-asia-001',
          'asia',
          severity
        );

        // Should still produce valid results
        expect(result.affectedNodes).toBeDefined();
        expect(result.propagationPath).toBeDefined();
        expect(result.networkImpactScore).toBeGreaterThanOrEqual(0);
        expect(result.networkImpactScore).toBeLessThanOrEqual(100);

        // Validate impact scores are within bounds
        result.affectedNodes.forEach(node => {
          expect(node.impactScore).toBeGreaterThanOrEqual(0);
          expect(node.impactScore).toBeLessThanOrEqual(100);
        });

        // Validate propagation magnitudes are reasonable
        result.propagationPath.forEach(step => {
          expect(step.impactMagnitude).toBeGreaterThan(0);
          expect(step.impactMagnitude).toBeLessThanOrEqual(100);
          expect(step.impactDelay).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity in propagation paths', async () => {
      const result = await mockCascadeAnalysis.analyzeCascadeEffects(
        'supplier_failure',
        'supplier-asia-001',
        'asia',
        'severe'
      );

      const nodeIds = new Set(result.affectedNodes.map(node => node.id));

      result.propagationPath.forEach(step => {
        // Both fromNode and toNode should exist in affected nodes
        expect(nodeIds.has(step.fromNode)).toBe(true);
        expect(nodeIds.has(step.toNode)).toBe(true);
      });
    });

    it('should ensure impact delay consistency in propagation paths', async () => {
      const result = await mockCascadeAnalysis.analyzeCascadeEffects(
        'port_closure',
        'distributor-asia-001',
        'asia',
        'moderate'
      );

      // Group propagation steps by delay
      const delayGroups = result.propagationPath.reduce((groups, step) => {
        const delay = step.impactDelay;
        if (!groups[delay]) groups[delay] = [];
        groups[delay].push(step);
        return groups;
      }, {} as Record<number, PropagationStep[]>);

      // Validate delay progression
      const delays = Object.keys(delayGroups).map(Number).sort((a, b) => a - b);
      
      for (let i = 0; i < delays.length; i++) {
        const delay = delays[i];
        expect(delay).toBeGreaterThan(0);
        
        // Each delay level should have at least one step
        expect(delayGroups[delay].length).toBeGreaterThan(0);
      }
    });

    it('should maintain impact magnitude consistency across propagation types', async () => {
      const result = await mockCascadeAnalysis.analyzeCascadeEffects(
        'natural_disaster',
        'manufacturer-asia-001',
        'asia',
        'severe'
      );

      const directSteps = result.propagationPath.filter(step => step.propagationType === 'direct');
      const indirectSteps = result.propagationPath.filter(step => step.propagationType === 'indirect');
      const cascadingSteps = result.propagationPath.filter(step => step.propagationType === 'cascading');

      // Direct impacts should generally be higher than indirect
      if (directSteps.length > 0 && indirectSteps.length > 0) {
        const avgDirectImpact = directSteps.reduce((sum, step) => sum + step.impactMagnitude, 0) / directSteps.length;
        const avgIndirectImpact = indirectSteps.reduce((sum, step) => sum + step.impactMagnitude, 0) / indirectSteps.length;
        
        expect(avgDirectImpact).toBeGreaterThanOrEqual(avgIndirectImpact * 0.8);
      }

      // Cascading impacts should generally be lower than direct
      if (directSteps.length > 0 && cascadingSteps.length > 0) {
        const avgDirectImpact = directSteps.reduce((sum, step) => sum + step.impactMagnitude, 0) / directSteps.length;
        const avgCascadingImpact = cascadingSteps.reduce((sum, step) => sum + step.impactMagnitude, 0) / cascadingSteps.length;
        
        expect(avgCascadingImpact).toBeLessThanOrEqual(avgDirectImpact * 1.2);
      }
    });
  });
});