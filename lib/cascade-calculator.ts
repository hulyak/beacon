/**
 * Cascade Calculator
 * Calculates how disruptions propagate through the supply chain network
 */

import { Node, Edge } from '@xyflow/react';

export interface CascadeStep {
  step: number;
  timestamp: number; // ms from start
  nodeId: string;
  nodeName: string;
  impactType: 'primary' | 'secondary' | 'tertiary';
  financialImpact: number;
  delayHours: number;
  description: string;
}

export interface CascadeResult {
  epicenterNodeId: string;
  epicenterName: string;
  steps: CascadeStep[];
  totalFinancialImpact: number;
  recoveryTimeHours: number;
  affectedNodeCount: number;
  affectedRegions: string[];
}

export interface CascadeConfig {
  propagationDelayMs: number; // Delay between cascade steps for animation
  baseFinancialImpact: number; // Base financial impact at epicenter
  impactDecay: number; // How much impact decreases per hop (0.0 - 1.0)
  maxDepth: number; // Maximum cascade depth
}

const DEFAULT_CONFIG: CascadeConfig = {
  propagationDelayMs: 1500, // 1.5 seconds between steps
  baseFinancialImpact: 500000, // $500K base impact
  impactDecay: 0.6, // 60% impact retention per hop
  maxDepth: 5, // Max 5 levels deep
};

/**
 * Calculate cascade propagation through the supply chain
 */
export function calculateCascade(
  epicenterNodeId: string,
  nodes: Node[],
  edges: Edge[],
  severity: 'minor' | 'moderate' | 'severe' | 'catastrophic' = 'moderate',
  config: Partial<CascadeConfig> = {}
): CascadeResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Severity multipliers
  const severityMultiplier = {
    minor: 0.5,
    moderate: 1.0,
    severe: 2.0,
    catastrophic: 4.0,
  }[severity];

  // Build adjacency list (directed graph - source -> targets)
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  }

  // Find epicenter node
  const epicenterNode = nodes.find((n) => n.id === epicenterNodeId);
  if (!epicenterNode) {
    return {
      epicenterNodeId,
      epicenterName: 'Unknown',
      steps: [],
      totalFinancialImpact: 0,
      recoveryTimeHours: 0,
      affectedNodeCount: 0,
      affectedRegions: [],
    };
  }

  const steps: CascadeStep[] = [];
  const visited = new Set<string>();
  const affectedRegions = new Set<string>();

  // BFS to propagate cascade
  const queue: { nodeId: string; depth: number; delayMs: number }[] = [
    { nodeId: epicenterNodeId, depth: 0, delayMs: 0 },
  ];

  while (queue.length > 0) {
    const { nodeId, depth, delayMs } = queue.shift()!;

    if (visited.has(nodeId) || depth > cfg.maxDepth) continue;
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    // Determine impact type based on depth
    const impactType: 'primary' | 'secondary' | 'tertiary' =
      depth === 0 ? 'primary' : depth === 1 ? 'secondary' : 'tertiary';

    // Calculate financial impact with decay
    const decayFactor = Math.pow(cfg.impactDecay, depth);
    const financialImpact = Math.round(
      cfg.baseFinancialImpact * severityMultiplier * decayFactor
    );

    // Calculate delay based on depth
    const delayHours = depth === 0 ? 0 : 24 + depth * 12;

    // Track affected regions
    const region = (node.data as { region?: string })?.region;
    if (region) {
      affectedRegions.add(region);
    }

    // Add cascade step
    steps.push({
      step: steps.length + 1,
      timestamp: delayMs,
      nodeId,
      nodeName: (node.data as { name?: string })?.name || nodeId,
      impactType,
      financialImpact,
      delayHours,
      description: generateStepDescription(node, impactType, depth),
    });

    // Queue downstream nodes
    const downstream = adjacency.get(nodeId) || [];
    for (const targetId of downstream) {
      if (!visited.has(targetId)) {
        queue.push({
          nodeId: targetId,
          depth: depth + 1,
          delayMs: delayMs + cfg.propagationDelayMs,
        });
      }
    }
  }

  // Calculate totals
  const totalFinancialImpact = steps.reduce((sum, s) => sum + s.financialImpact, 0);
  const recoveryTimeHours = Math.max(...steps.map((s) => s.delayHours)) + 72; // Add 72h for recovery

  return {
    epicenterNodeId,
    epicenterName: (epicenterNode.data as { name?: string })?.name || epicenterNodeId,
    steps,
    totalFinancialImpact,
    recoveryTimeHours,
    affectedNodeCount: steps.length,
    affectedRegions: Array.from(affectedRegions),
  };
}

/**
 * Generate description for a cascade step
 */
function generateStepDescription(
  node: Node,
  impactType: 'primary' | 'secondary' | 'tertiary',
  depth: number
): string {
  const nodeType = node.type || 'node';
  const status = (node.data as { status?: string })?.status || 'unknown';

  const descriptions: Record<string, Record<string, string>> = {
    supplier: {
      primary: 'Supply disruption at source - critical component shortage',
      secondary: 'Alternative supplier capacity strained',
      tertiary: 'Backup supplier network activated',
    },
    manufacturer: {
      primary: 'Production halted due to disruption',
      secondary: 'Production slowdown - limited materials',
      tertiary: 'Production adjustments required',
    },
    warehouse: {
      primary: 'Warehouse operations suspended',
      secondary: 'Inventory buffers depleting',
      tertiary: 'Safety stock allocation in progress',
    },
    distributor: {
      primary: 'Distribution network disrupted',
      secondary: 'Delivery delays accumulating',
      tertiary: 'Alternative routing being implemented',
    },
    retailer: {
      primary: 'Stock-out imminent',
      secondary: 'Limited inventory available',
      tertiary: 'Customer allocation protocols activated',
    },
  };

  return descriptions[nodeType]?.[impactType] || `${impactType} impact on ${nodeType}`;
}

/**
 * Calculate the critical path through the cascade
 */
export function findCriticalPath(result: CascadeResult): CascadeStep[] {
  // Critical path is the longest chain with highest total impact
  return result.steps.filter((s) => s.impactType === 'primary' || s.impactType === 'secondary');
}

/**
 * Get cascade summary for voice output
 */
export function getCascadeSummary(result: CascadeResult): string {
  if (result.steps.length === 0) {
    return 'No cascade impact calculated.';
  }

  const primarySteps = result.steps.filter((s) => s.impactType === 'primary').length;
  const secondarySteps = result.steps.filter((s) => s.impactType === 'secondary').length;
  const tertiarySteps = result.steps.filter((s) => s.impactType === 'tertiary').length;

  const impactInMillions = (result.totalFinancialImpact / 1000000).toFixed(1);
  const recoveryWeeks = Math.ceil(result.recoveryTimeHours / 168);

  return `Cascade analysis shows ${result.affectedNodeCount} nodes affected. ` +
    `${primarySteps} primary, ${secondarySteps} secondary, ${tertiarySteps} tertiary impacts. ` +
    `Total estimated impact: $${impactInMillions}M. ` +
    `Recovery time: approximately ${recoveryWeeks} week${recoveryWeeks > 1 ? 's' : ''}.`;
}

/**
 * Get recommended actions based on cascade
 */
export function getCascadeRecommendations(result: CascadeResult): string[] {
  const recommendations: string[] = [];

  if (result.steps.some((s) => s.impactType === 'primary')) {
    recommendations.push('Activate emergency response protocols immediately');
    recommendations.push('Notify stakeholders and downstream partners');
  }

  if (result.affectedRegions.length > 1) {
    recommendations.push('Implement cross-regional contingency plans');
  }

  if (result.totalFinancialImpact > 1000000) {
    recommendations.push('Engage executive leadership for strategic decisions');
    recommendations.push('Assess insurance coverage and claims process');
  }

  if (result.recoveryTimeHours > 168) {
    recommendations.push('Establish alternative supply routes');
    recommendations.push('Consider temporary supplier agreements');
  }

  recommendations.push('Monitor downstream inventory levels closely');
  recommendations.push('Prepare customer communication strategy');

  return recommendations.slice(0, 5);
}
