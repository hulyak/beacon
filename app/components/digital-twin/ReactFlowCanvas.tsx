'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SupplierNode from './nodes/SupplierNode';
import ManufacturerNode from './nodes/ManufacturerNode';
import WarehouseNode from './nodes/WarehouseNode';
import DistributorNode from './nodes/DistributorNode';
import RetailerNode from './nodes/RetailerNode';
import SupplyEdge from './edges/SupplyEdge';
import CanvasToolbar from './CanvasToolbar';
import NodeEditor from './NodeEditor';
import EdgeEditor from './EdgeEditor';
import MonteCarloPanel from './MonteCarloPanel';
import { useDigitalTwin, type SupplyChainEdgeData } from './DigitalTwinContext';

// Register custom node types
const nodeTypes: NodeTypes = {
  supplier: SupplierNode,
  manufacturer: ManufacturerNode,
  warehouse: WarehouseNode,
  distributor: DistributorNode,
  retailer: RetailerNode,
};

// Register custom edge types
const edgeTypes: EdgeTypes = {
  supply: SupplyEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: 'supply',
  animated: true,
};

interface ReactFlowCanvasProps {
  onNodeSelect?: (nodeId: string | null) => void;
  className?: string;
}

export default function ReactFlowCanvas({
  onNodeSelect,
  className = '',
}: ReactFlowCanvasProps) {
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
    edgeExists,
    cascadeState,
    isAnimating,
  } = useDigitalTwin();

  // Handle node connection (with duplicate prevention)
  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent duplicate edges
      if (params.source && params.target && edgeExists(params.source, params.target)) {
        console.warn('Edge already exists between these nodes');
        return;
      }

      const newEdge: Edge = {
        ...params,
        id: `edge_${params.source}_${params.target}_${Date.now()}`,
        type: 'supply',
        animated: true,
        data: {
          status: 'active',
          flowVolume: 100,
          leadTime: 24,
        },
      } as Edge<SupplyChainEdgeData>;
      setEdges((eds) => addEdge(newEdge, eds) as Edge<SupplyChainEdgeData>[]);
    },
    [setEdges, edgeExists]
  );

  // Handle edge click
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
    },
    [setSelectedEdgeId, setSelectedNodeId]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      onNodeSelect?.(node.id);
    },
    [setSelectedNodeId, setSelectedEdgeId, onNodeSelect]
  );

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    onNodeSelect?.(null);
  }, [setSelectedNodeId, setSelectedEdgeId, onNodeSelect]);

  // Apply cascade effects to nodes
  const styledNodes = useMemo(() => {
    if (!cascadeState || !isAnimating) return nodes;

    return nodes.map((node) => {
      const cascadeStep = cascadeState.steps.find((s) => s.nodeId === node.id);
      if (!cascadeStep) return node;

      // Add cascade styling
      return {
        ...node,
        data: {
          ...node.data,
          cascadeImpact: cascadeStep.impactType,
          cascadeActive: true,
          financialImpact: cascadeStep.financialImpact,
        },
        className: `cascade-${cascadeStep.impactType}`,
      };
    });
  }, [nodes, cascadeState, isAnimating]);

  // Apply cascade effects to edges
  const styledEdges = useMemo((): Edge<SupplyChainEdgeData>[] => {
    if (!cascadeState || !isAnimating) return edges;

    return edges.map((edge): Edge<SupplyChainEdgeData> => {
      const isAffected = cascadeState.steps.some(
        (s) => s.nodeId === edge.source || s.nodeId === edge.target
      );

      if (!isAffected) return edge;

      return {
        ...edge,
        data: {
          status: 'disrupted' as const,
          flowVolume: edge.data?.flowVolume,
          leadTime: edge.data?.leadTime,
        },
        style: {
          stroke: '#ef4444',
          strokeWidth: 3,
        },
      };
    });
  }, [edges, cascadeState, isAnimating]);

  // MiniMap node color based on status
  const nodeColor = useCallback((node: Node) => {
    const status = node.data?.status as string;
    switch (status) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#22c55e';
    }
  }, []);

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
        />
        <Controls
          position="bottom-right"
          showZoom
          showFitView
          showInteractive
        />
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
          position="top-right"
          style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
          }}
        />
        <Panel position="top-left">
          <CanvasToolbar onOpenMonteCarlo={() => setShowMonteCarlo(true)} />
        </Panel>

        {/* Node Editor Panel */}
        {selectedNodeId && (
          <Panel position="top-right" className="mt-20 mr-4">
            <NodeEditor
              nodeId={selectedNodeId}
              onClose={() => setSelectedNodeId(null)}
            />
          </Panel>
        )}

        {/* Edge Editor Panel */}
        {selectedEdgeId && (
          <Panel position="top-right" className="mt-20 mr-4">
            <EdgeEditor
              edgeId={selectedEdgeId}
              onClose={() => setSelectedEdgeId(null)}
            />
          </Panel>
        )}

        {/* Cascade animation indicator */}
        {isAnimating && cascadeState && (
          <Panel position="top-center">
            <div className="bg-red-600/90 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
              <span className="font-semibold">Cascade Simulation Active</span>
              <span className="ml-2 text-sm opacity-80">
                {cascadeState.steps.length} nodes affected
              </span>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Monte Carlo Panel */}
      <MonteCarloPanel
        isOpen={showMonteCarlo}
        onClose={() => setShowMonteCarlo(false)}
      />
    </div>
  );
}
