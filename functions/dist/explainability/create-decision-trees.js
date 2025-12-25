"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_framework_1 = require("@google-cloud/functions-framework");
/**
 * Create decision tree visualization for AI reasoning
 *
 * POST /create-decision-trees
 * Body: { analysisType: string, analysisData: object, reasoningSteps: array, context?: object }
 *
 * Returns: Interactive decision tree with visualization data and path analysis
 */
(0, functions_framework_1.http)('createDecisionTrees', async (req, res) => {
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
        const { analysisType, analysisData, reasoningSteps, context = {} } = req.body;
        // Validate required parameters
        if (!analysisType || !analysisData || !reasoningSteps) {
            res.status(400).json({
                error: 'Missing required parameters: analysisType, analysisData, reasoningSteps'
            });
            return;
        }
        // Generate decision tree nodes
        const decisionTree = generateDecisionTree(analysisType, analysisData, reasoningSteps, context);
        // Create visualization data
        const visualizationData = createVisualizationData(decisionTree);
        // Generate interactive elements
        const interactiveElements = generateInteractiveElements(decisionTree, analysisType);
        // Analyze decision paths
        const pathAnalysis = analyzeDecisionPaths(decisionTree, analysisData, reasoningSteps);
        const response = {
            decisionTree,
            visualizationData,
            interactiveElements,
            pathAnalysis,
            analysisTimestamp: new Date().toISOString(),
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Decision tree creation failed:', error);
        res.status(500).json({
            error: 'Failed to create decision tree',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Generate decision tree nodes from analysis data
 */
function generateDecisionTree(analysisType, analysisData, reasoningSteps, context) {
    const nodes = [];
    // Create root node
    const rootNode = {
        id: 'root',
        label: `${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis`,
        type: 'condition',
        confidence: analysisData.confidence,
        children: [],
    };
    nodes.push(rootNode);
    // Create input parameter nodes
    const inputNodeIds = createInputParameterNodes(analysisData.inputParameters, context, nodes);
    rootNode.children = inputNodeIds;
    // Create reasoning step nodes
    const reasoningNodeIds = createReasoningStepNodes(reasoningSteps, inputNodeIds, nodes);
    // Create intermediate result nodes
    const intermediateNodeIds = createIntermediateResultNodes(analysisData.intermediateResults, reasoningNodeIds, nodes);
    // Create final recommendation node
    const finalNodeId = createFinalRecommendationNode(analysisData.finalRecommendation, analysisData.confidence, intermediateNodeIds, nodes);
    return nodes;
}
/**
 * Create input parameter nodes
 */
function createInputParameterNodes(inputParameters, context, nodes) {
    const nodeIds = [];
    // Create nodes for key input parameters
    Object.entries(inputParameters).forEach(([key, value], index) => {
        const nodeId = `input-${key}`;
        const node = {
            id: nodeId,
            label: `${formatParameterName(key)}: ${formatParameterValue(value)}`,
            type: 'condition',
            confidence: 95, // Input parameters have high confidence
            children: [],
            parent: 'root'
        };
        nodes.push(node);
        nodeIds.push(nodeId);
    });
    // Add context nodes if available
    if (context) {
        Object.entries(context).forEach(([key, value]) => {
            if (value) {
                const nodeId = `context-${key}`;
                const node = {
                    id: nodeId,
                    label: `${formatParameterName(key)}: ${formatParameterValue(value)}`,
                    type: 'condition',
                    confidence: 90,
                    children: [],
                    parent: 'root'
                };
                nodes.push(node);
                nodeIds.push(nodeId);
            }
        });
    }
    return nodeIds;
}
/**
 * Create reasoning step nodes
 */
function createReasoningStepNodes(reasoningSteps, parentNodeIds, nodes) {
    const nodeIds = [];
    reasoningSteps.forEach((step, index) => {
        const nodeId = `reasoning-${step.step}`;
        const node = {
            id: nodeId,
            label: step.description,
            type: 'action',
            confidence: step.confidence,
            children: [],
            parent: index === 0 ? parentNodeIds[0] : `reasoning-${step.step - 1}`
        };
        nodes.push(node);
        nodeIds.push(nodeId);
        // Update parent's children
        if (index === 0 && parentNodeIds.length > 0) {
            const parentNode = nodes.find(n => n.id === parentNodeIds[0]);
            if (parentNode) {
                parentNode.children.push(nodeId);
            }
        }
        else if (index > 0) {
            const parentNode = nodes.find(n => n.id === `reasoning-${step.step - 1}`);
            if (parentNode) {
                parentNode.children.push(nodeId);
            }
        }
    });
    return nodeIds;
}
/**
 * Create intermediate result nodes
 */
function createIntermediateResultNodes(intermediateResults, parentNodeIds, nodes) {
    const nodeIds = [];
    Object.entries(intermediateResults).forEach(([key, value], index) => {
        const nodeId = `intermediate-${key}`;
        const node = {
            id: nodeId,
            label: `${formatParameterName(key)}: ${formatResultValue(value)}`,
            type: 'outcome',
            confidence: calculateIntermediateConfidence(value),
            children: [],
            parent: parentNodeIds[parentNodeIds.length - 1] // Connect to last reasoning step
        };
        nodes.push(node);
        nodeIds.push(nodeId);
        // Update parent's children
        if (parentNodeIds.length > 0) {
            const parentNode = nodes.find(n => n.id === parentNodeIds[parentNodeIds.length - 1]);
            if (parentNode) {
                parentNode.children.push(nodeId);
            }
        }
    });
    return nodeIds;
}
/**
 * Create final recommendation node
 */
function createFinalRecommendationNode(finalRecommendation, confidence, parentNodeIds, nodes) {
    const nodeId = 'final-recommendation';
    const node = {
        id: nodeId,
        label: formatRecommendation(finalRecommendation),
        type: 'outcome',
        confidence,
        children: [],
        parent: parentNodeIds.length > 0 ? parentNodeIds[0] : undefined
    };
    nodes.push(node);
    // Update parent's children
    parentNodeIds.forEach(parentId => {
        const parentNode = nodes.find(n => n.id === parentId);
        if (parentNode) {
            parentNode.children.push(nodeId);
        }
    });
    return nodeId;
}
/**
 * Create visualization data for the decision tree
 */
function createVisualizationData(decisionTree) {
    const edges = [];
    // Create edges from parent-child relationships
    decisionTree.forEach(node => {
        node.children.forEach(childId => {
            edges.push({
                from: node.id,
                to: childId,
                label: getEdgeLabel(node, childId, decisionTree),
                confidence: getEdgeConfidence(node, childId, decisionTree)
            });
        });
    });
    return {
        nodes: decisionTree,
        edges
    };
}
/**
 * Get edge label between nodes
 */
function getEdgeLabel(fromNode, toNodeId, allNodes) {
    const toNode = allNodes.find(n => n.id === toNodeId);
    if (!toNode)
        return '';
    // Generate contextual edge labels
    if (fromNode.type === 'condition' && toNode.type === 'action') {
        return 'analyzes';
    }
    else if (fromNode.type === 'action' && toNode.type === 'outcome') {
        return 'produces';
    }
    else if (fromNode.type === 'action' && toNode.type === 'action') {
        return 'leads to';
    }
    else {
        return 'results in';
    }
}
/**
 * Get edge confidence between nodes
 */
function getEdgeConfidence(fromNode, toNodeId, allNodes) {
    const toNode = allNodes.find(n => n.id === toNodeId);
    if (!toNode)
        return 50;
    // Edge confidence is the minimum of the two connected nodes
    return Math.min(fromNode.confidence, toNode.confidence);
}
/**
 * Generate interactive elements for the decision tree
 */
function generateInteractiveElements(decisionTree, analysisType) {
    // Find nodes that can be expanded (have children)
    const expandableNodes = decisionTree
        .filter(node => node.children.length > 0)
        .map(node => node.id);
    // Find filterable conditions based on node types
    const filterableConditions = [
        'High Confidence (>80%)',
        'Medium Confidence (60-80%)',
        'Low Confidence (<60%)',
        'Input Parameters',
        'Reasoning Steps',
        'Outcomes'
    ];
    // Define confidence thresholds for filtering
    const confidenceThresholds = [50, 60, 70, 80, 90];
    return {
        expandableNodes,
        filterableConditions,
        confidenceThresholds
    };
}
/**
 * Analyze decision paths through the tree
 */
function analyzeDecisionPaths(decisionTree, analysisData, reasoningSteps) {
    // Find the critical path (highest confidence path to final recommendation)
    const criticalPath = findCriticalPath(decisionTree);
    // Find alternative paths
    const alternativePaths = findAlternativePaths(decisionTree, criticalPath);
    return {
        criticalPath,
        alternativePaths
    };
}
/**
 * Find the critical path through the decision tree
 */
function findCriticalPath(decisionTree) {
    const path = [];
    // Start from root
    let currentNode = decisionTree.find(n => n.id === 'root');
    if (!currentNode)
        return path;
    path.push(currentNode.id);
    // Follow the highest confidence path
    while (currentNode && currentNode.children.length > 0) {
        // Find child with highest confidence
        const childNodes = currentNode.children
            .map(childId => decisionTree.find(n => n.id === childId))
            .filter(Boolean);
        if (childNodes.length === 0)
            break;
        const bestChild = childNodes.reduce((best, child) => child.confidence > best.confidence ? child : best);
        path.push(bestChild.id);
        currentNode = bestChild;
    }
    return path;
}
/**
 * Find alternative paths through the decision tree
 */
function findAlternativePaths(decisionTree, criticalPath) {
    const alternativePaths = [];
    // Find branch points where alternative paths diverge
    criticalPath.forEach((nodeId, index) => {
        const node = decisionTree.find(n => n.id === nodeId);
        if (!node || node.children.length <= 1)
            return;
        // For each alternative child not in critical path
        node.children.forEach(childId => {
            if (!criticalPath.includes(childId)) {
                const alternativePath = [...criticalPath.slice(0, index + 1)];
                const pathConfidence = traceAlternativePath(decisionTree, childId, alternativePath);
                if (alternativePath.length > criticalPath.slice(0, index + 1).length) {
                    alternativePaths.push({
                        path: alternativePath,
                        confidence: pathConfidence,
                        description: generatePathDescription(alternativePath, decisionTree)
                    });
                }
            }
        });
    });
    return alternativePaths.slice(0, 3); // Limit to top 3 alternatives
}
/**
 * Trace an alternative path and calculate its confidence
 */
function traceAlternativePath(decisionTree, startNodeId, path) {
    let currentNode = decisionTree.find(n => n.id === startNodeId);
    if (!currentNode)
        return 0;
    path.push(currentNode.id);
    let totalConfidence = currentNode.confidence;
    let nodeCount = 1;
    // Follow the path to a terminal node
    while (currentNode && currentNode.children.length > 0) {
        // Take the first child for simplicity
        const nextNodeId = currentNode.children[0];
        currentNode = decisionTree.find(n => n.id === nextNodeId);
        if (currentNode) {
            path.push(currentNode.id);
            totalConfidence += currentNode.confidence;
            nodeCount++;
        }
    }
    return nodeCount > 0 ? totalConfidence / nodeCount : 0;
}
/**
 * Generate description for a decision path
 */
function generatePathDescription(path, decisionTree) {
    const pathNodes = path
        .map(nodeId => decisionTree.find(n => n.id === nodeId))
        .filter(Boolean);
    if (pathNodes.length === 0)
        return 'Empty path';
    const startNode = pathNodes[0];
    const endNode = pathNodes[pathNodes.length - 1];
    const avgConfidence = pathNodes.reduce((sum, node) => sum + node.confidence, 0) / pathNodes.length;
    return `Alternative analysis path from ${startNode.label} to ${endNode.label} with ${Math.round(avgConfidence)}% confidence`;
}
/**
 * Utility functions for formatting
 */
function formatParameterName(name) {
    return name.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
}
function formatParameterValue(value) {
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number')
        return value.toLocaleString();
    if (typeof value === 'boolean')
        return value ? 'Yes' : 'No';
    if (Array.isArray(value))
        return `${value.length} items`;
    if (typeof value === 'object')
        return 'Complex data';
    return String(value);
}
function formatResultValue(value) {
    if (typeof value === 'number') {
        if (value > 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        else if (value > 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        else {
            return value.toLocaleString();
        }
    }
    return formatParameterValue(value);
}
function formatRecommendation(recommendation) {
    if (typeof recommendation === 'string') {
        return recommendation.length > 50
            ? recommendation.substring(0, 50) + '...'
            : recommendation;
    }
    if (recommendation && recommendation.name) {
        return `Recommended: ${recommendation.name}`;
    }
    return 'Final Recommendation';
}
function calculateIntermediateConfidence(value) {
    // Estimate confidence based on the type and completeness of intermediate results
    if (typeof value === 'number' && value > 0)
        return 85;
    if (typeof value === 'string' && value.length > 0)
        return 80;
    if (Array.isArray(value) && value.length > 0)
        return 90;
    if (typeof value === 'object' && Object.keys(value).length > 0)
        return 85;
    return 60;
}
/**
 * Health check endpoint
 */
(0, functions_framework_1.http)('createDecisionTreesHealth', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    res.status(200).json({
        status: 'healthy',
        service: 'create-decision-trees',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
//# sourceMappingURL=create-decision-trees.js.map