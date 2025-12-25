import { http } from '@google-cloud/functions-framework';
import { Request, Response } from '@google-cloud/functions-framework';
import { 
  NetworkNode, 
  PropagationStep 
} from '../../lib/types/enhanced-analytics';

interface CascadeAnalysisRequest {
  scenarioType: string;
  originNode: string;
  region: string;
  severity: string;
}

interface CascadeAnalysisResponse {
  affectedNodes: NetworkNode[];
  propagationPath: PropagationStep[];
  networkImpactScore: number;
  analysisTimestamp: string;
}

/**
 * Analyze cascade effects of supply chain disruptions
 * 
 * POST /analyze-cascade-effects
 * Body: { scenarioType: string, originNode: string, region: string, severity: string }
 * 
 * Returns: Network topology analysis with affected nodes and propagation paths
 */
http('analyzeCascadeEffects', async (req: Request, res: Response): Promise<void> => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST method allowed' });
    return;
  }

  try {
    const { scenarioType, originNode, region, severity } = req.body as CascadeAnalysisRequest;

    // Validate required parameters
    if (!scenarioType || !region) {
      res.status(400).json({ error: 'Missing required parameters: scenarioType, region' });
      return;
    }

    // Generate supply chain network topology
    const networkTopology = generateNetworkTopology(region);
    
    // Find origin node or use default
    const origin = originNode || getDefaultOriginNode(scenarioType, region);
    
    // Analyze cascade propagation
    const cascadeAnalysis = analyzeCascadePropagation(
      networkTopology,
      origin,
      scenarioType,
      severity || 'moderate'
    );

    const response: CascadeAnalysisResponse = {
      affectedNodes: cascadeAnalysis.affectedNodes,
      propagationPath: cascadeAnalysis.propagationPath,
      networkImpactScore: cascadeAnalysis.networkImpactScore,
      analysisTimestamp: new Date().toISOString(),
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Cascade analysis failed:', error);
    res.status(500).json({ 
      error: 'Failed to analyze cascade effects',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate network topology for a given region
 */
function generateNetworkTopology(region: string): NetworkNode[] {
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
      },
      {
        id: 'supplier-asia-002',
        name: 'Taiwan Semiconductor Fab',
        type: 'supplier',
        region: 'asia',
        riskLevel: 'critical',
        impactScore: 95
      },
      {
        id: 'manufacturer-asia-002',
        name: 'Seoul Assembly Plant',
        type: 'manufacturer',
        region: 'asia',
        riskLevel: 'low',
        impactScore: 65
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
      },
      {
        id: 'distributor-europe-001',
        name: 'Rotterdam Port Hub',
        type: 'distributor',
        region: 'europe',
        riskLevel: 'medium',
        impactScore: 75
      }
    ],
    north_america: [
      {
        id: 'supplier-na-001',
        name: 'US Raw Materials',
        type: 'supplier',
        region: 'north_america',
        riskLevel: 'low',
        impactScore: 68
      },
      {
        id: 'manufacturer-na-001',
        name: 'Mexico Assembly Plant',
        type: 'manufacturer',
        region: 'north_america',
        riskLevel: 'medium',
        impactScore: 82
      },
      {
        id: 'distributor-na-001',
        name: 'Chicago Distribution Hub',
        type: 'distributor',
        region: 'north_america',
        riskLevel: 'low',
        impactScore: 72
      }
    ]
  };

  return regionNetworks[region] || regionNetworks.asia;
}

/**
 * Get default origin node based on scenario type and region
 */
function getDefaultOriginNode(scenarioType: string, region: string): string {
  const defaultOrigins: Record<string, Record<string, string>> = {
    supplier_failure: {
      asia: 'supplier-asia-001',
      europe: 'supplier-europe-001',
      north_america: 'supplier-na-001'
    },
    port_closure: {
      asia: 'distributor-asia-001',
      europe: 'distributor-europe-001',
      north_america: 'distributor-na-001'
    },
    natural_disaster: {
      asia: 'manufacturer-asia-001',
      europe: 'manufacturer-europe-001',
      north_america: 'manufacturer-na-001'
    }
  };

  return defaultOrigins[scenarioType]?.[region] || 'supplier-asia-001';
}

/**
 * Analyze cascade propagation through the network
 */
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

  // Find origin node
  const originNode = networkTopology.find(node => node.id === originNodeId);
  if (!originNode) {
    throw new Error(`Origin node ${originNodeId} not found in network topology`);
  }

  // Calculate propagation based on network relationships
  const affectedNodes: NetworkNode[] = [];
  const propagationPath: PropagationStep[] = [];
  const visited = new Set<string>();

  // Start cascade from origin
  const queue: Array<{ node: NetworkNode; depth: number; impactMagnitude: number }> = [
    { node: originNode, depth: 0, impactMagnitude: 100 * multiplier }
  ];

  while (queue.length > 0) {
    const { node, depth, impactMagnitude } = queue.shift()!;

    if (visited.has(node.id) || depth > 3) continue; // Limit cascade depth
    visited.add(node.id);

    // Add to affected nodes if impact is significant
    if (impactMagnitude > 10) {
      affectedNodes.push({
        ...node,
        impactScore: Math.min(100, node.impactScore * (impactMagnitude / 100))
      });
    }

    // Find connected nodes based on supply chain relationships
    const connectedNodes = findConnectedNodes(node, networkTopology);
    
    for (const connectedNode of connectedNodes) {
      if (!visited.has(connectedNode.id)) {
        // Calculate impact decay based on distance and node resilience
        const impactDecay = calculateImpactDecay(node, connectedNode, depth);
        const newImpactMagnitude = impactMagnitude * impactDecay;

        if (newImpactMagnitude > 10) {
          // Add propagation step
          propagationPath.push({
            fromNode: node.id,
            toNode: connectedNode.id,
            impactDelay: depth + 1,
            impactMagnitude: newImpactMagnitude,
            propagationType: depth === 0 ? 'direct' : depth === 1 ? 'indirect' : 'cascading'
          });

          queue.push({
            node: connectedNode,
            depth: depth + 1,
            impactMagnitude: newImpactMagnitude
          });
        }
      }
    }
  }

  // Calculate overall network impact score
  const networkImpactScore = calculateNetworkImpactScore(affectedNodes, networkTopology.length);

  return {
    affectedNodes,
    propagationPath,
    networkImpactScore
  };
}

/**
 * Find nodes connected to the given node in the supply chain
 */
function findConnectedNodes(node: NetworkNode, networkTopology: NetworkNode[]): NetworkNode[] {
  // Define supply chain relationships
  const relationships: Record<string, string[]> = {
    supplier: ['manufacturer'],
    manufacturer: ['distributor', 'retailer'],
    distributor: ['retailer'],
    retailer: []
  };

  const reverseRelationships: Record<string, string[]> = {
    manufacturer: ['supplier'],
    distributor: ['manufacturer'],
    retailer: ['distributor', 'manufacturer']
  };

  const forwardTypes = relationships[node.type] || [];
  const backwardTypes = reverseRelationships[node.type] || [];
  const connectedTypes = [...forwardTypes, ...backwardTypes];

  return networkTopology.filter(n => 
    n.id !== node.id && 
    connectedTypes.includes(n.type) &&
    n.region === node.region // Same region connections are stronger
  );
}

/**
 * Calculate impact decay between connected nodes
 */
function calculateImpactDecay(fromNode: NetworkNode, toNode: NetworkNode, depth: number): number {
  // Base decay factors
  const depthDecay = Math.pow(0.7, depth); // 30% decay per level
  
  // Risk level affects resilience (lower risk = higher resilience)
  const riskMultipliers = {
    low: 0.5,      // High resilience
    medium: 0.7,   // Medium resilience  
    high: 0.9,     // Low resilience
    critical: 1.0  // No resilience
  };

  const toNodeMultiplier = riskMultipliers[toNode.riskLevel];
  
  // Node type relationships affect impact transfer
  const typeRelationshipMultiplier = getTypeRelationshipMultiplier(fromNode.type, toNode.type);

  return depthDecay * toNodeMultiplier * typeRelationshipMultiplier;
}

/**
 * Get impact multiplier based on node type relationships
 */
function getTypeRelationshipMultiplier(fromType: string, toType: string): number {
  const relationships: Record<string, Record<string, number>> = {
    supplier: {
      manufacturer: 0.9, // Strong relationship
      distributor: 0.3,  // Weak relationship
      retailer: 0.1      // Very weak relationship
    },
    manufacturer: {
      supplier: 0.6,     // Reverse impact
      distributor: 0.8,  // Strong forward relationship
      retailer: 0.4      // Medium relationship
    },
    distributor: {
      supplier: 0.2,     // Weak reverse impact
      manufacturer: 0.5, // Medium reverse impact
      retailer: 0.9      // Strong forward relationship
    },
    retailer: {
      supplier: 0.1,     // Very weak reverse impact
      manufacturer: 0.3, // Weak reverse impact
      distributor: 0.7   // Strong reverse impact
    }
  };

  return relationships[fromType]?.[toType] || 0.3; // Default weak relationship
}

/**
 * Calculate overall network impact score
 */
function calculateNetworkImpactScore(affectedNodes: NetworkNode[], totalNodes: number): number {
  if (totalNodes === 0) return 0;

  // Calculate weighted impact based on node importance and impact magnitude
  const totalWeightedImpact = affectedNodes.reduce((sum, node) => {
    const nodeWeight = getNodeWeight(node.type);
    return sum + (node.impactScore * nodeWeight);
  }, 0);

  const maxPossibleImpact = totalNodes * 100 * 1.0; // Max weight is 1.0
  const networkImpactPercentage = (totalWeightedImpact / maxPossibleImpact) * 100;

  return Math.min(100, Math.round(networkImpactPercentage));
}

/**
 * Get weight factor for different node types
 */
function getNodeWeight(nodeType: string): number {
  const weights = {
    supplier: 1.0,     // Critical - source of materials
    manufacturer: 0.9, // Very important - value creation
    distributor: 0.7,  // Important - logistics hub
    retailer: 0.5      // Moderate - end point
  };

  return weights[nodeType as keyof typeof weights] || 0.5;
}