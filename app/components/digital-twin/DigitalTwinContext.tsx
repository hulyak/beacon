'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import dagre from 'dagre';
import { useMemory } from '@/lib/memory-context';
import { CascadeStep } from '@/functions/agents/scenario-planner';

// Types
export type SupplyChainNodeType =
  | 'supplier'
  | 'manufacturer'
  | 'warehouse'
  | 'distributor'
  | 'retailer';

export interface SupplyChainNodeData {
  name: string;
  location: string;
  region: string;
  status: 'healthy' | 'warning' | 'critical';
  capacity?: number;
  utilization?: number;
  riskLevel?: number;
  cascadeImpact?: 'primary' | 'secondary' | 'tertiary';
  cascadeActive?: boolean;
  financialImpact?: number;
  [key: string]: unknown;
}

export interface SupplyChainEdgeData {
  status: 'active' | 'delayed' | 'disrupted';
  flowVolume?: number;
  leadTime?: number;
  [key: string]: unknown;
}

export interface CascadeState {
  epicenterNodeId: string;
  steps: CascadeStep[];
  currentStep: number;
  totalFinancialImpact: number;
  recoveryTimeHours: number;
}

// Context state interface
interface DigitalTwinContextState {
  // Node and edge state
  nodes: Node<SupplyChainNodeData>[];
  edges: Edge<SupplyChainEdgeData>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<SupplyChainNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge<SupplyChainEdgeData>[]>>;
  onNodesChange: OnNodesChange<Node<SupplyChainNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<SupplyChainEdgeData>>;

  // Selection state
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Node operations
  addNode: (type: SupplyChainNodeType, position?: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<SupplyChainNodeData>) => void;
  deleteSelectedNode: () => void;
  deleteNode: (id: string) => void;

  // Edge operations
  updateEdge: (id: string, data: Partial<SupplyChainEdgeData>) => void;
  deleteEdge: (id: string) => void;
  edgeExists: (source: string, target: string) => boolean;

  // Selected edge
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;

  // Import/Export
  exportNetwork: () => string;
  importNetwork: (json: string) => boolean;

  // Layout
  autoLayout: () => void;

  // Cascade animation
  cascadeState: CascadeState | null;
  isAnimating: boolean;
  startCascadeAnimation: (cascade: CascadeState) => void;
  stopCascadeAnimation: () => void;
  resetCascade: () => void;

  // Memory integration
  saveToMemory: () => void;
  loadFromMemory: () => void;

  // Voice command integration
  highlightNodesByRegion: (region: string) => void;
  highlightNodesByStatus: (status: 'healthy' | 'warning' | 'critical') => void;
  clearHighlights: () => void;
}

// Initial demo nodes
const initialNodes: Node<SupplyChainNodeData>[] = [
  {
    id: 'supplier-1',
    type: 'supplier',
    position: { x: 0, y: 100 },
    data: {
      name: 'Asian Supplier Co.',
      location: 'Shanghai, China',
      region: 'asia',
      status: 'healthy',
      capacity: 85,
      utilization: 72,
      riskLevel: 35,
    },
  },
  {
    id: 'supplier-2',
    type: 'supplier',
    position: { x: 0, y: 300 },
    data: {
      name: 'Taiwan Electronics',
      location: 'Taipei, Taiwan',
      region: 'asia',
      status: 'warning',
      capacity: 90,
      utilization: 88,
      riskLevel: 65,
    },
  },
  {
    id: 'manufacturer-1',
    type: 'manufacturer',
    position: { x: 300, y: 200 },
    data: {
      name: 'Pacific Manufacturing',
      location: 'Singapore',
      region: 'asia',
      status: 'healthy',
      capacity: 75,
      utilization: 68,
      riskLevel: 25,
    },
  },
  {
    id: 'warehouse-1',
    type: 'warehouse',
    position: { x: 600, y: 200 },
    data: {
      name: 'LA Distribution Hub',
      location: 'Los Angeles, USA',
      region: 'north_america',
      status: 'healthy',
      capacity: 80,
      utilization: 65,
      riskLevel: 20,
    },
  },
  {
    id: 'distributor-1',
    type: 'distributor',
    position: { x: 900, y: 100 },
    data: {
      name: 'West Coast Logistics',
      location: 'San Francisco, USA',
      region: 'north_america',
      status: 'healthy',
      capacity: 70,
      utilization: 55,
      riskLevel: 15,
    },
  },
  {
    id: 'retailer-1',
    type: 'retailer',
    position: { x: 1200, y: 100 },
    data: {
      name: 'TechMart Retail',
      location: 'Seattle, USA',
      region: 'north_america',
      status: 'healthy',
      capacity: 60,
      utilization: 45,
      riskLevel: 10,
    },
  },
];

const initialEdges: Edge<SupplyChainEdgeData>[] = [
  {
    id: 'e-s1-m1',
    source: 'supplier-1',
    target: 'manufacturer-1',
    type: 'supply',
    animated: true,
    data: { status: 'active', flowVolume: 1000, leadTime: 48 },
  },
  {
    id: 'e-s2-m1',
    source: 'supplier-2',
    target: 'manufacturer-1',
    type: 'supply',
    animated: true,
    data: { status: 'active', flowVolume: 800, leadTime: 36 },
  },
  {
    id: 'e-m1-w1',
    source: 'manufacturer-1',
    target: 'warehouse-1',
    type: 'supply',
    animated: true,
    data: { status: 'active', flowVolume: 1500, leadTime: 168 },
  },
  {
    id: 'e-w1-d1',
    source: 'warehouse-1',
    target: 'distributor-1',
    type: 'supply',
    animated: true,
    data: { status: 'active', flowVolume: 500, leadTime: 24 },
  },
  {
    id: 'e-d1-r1',
    source: 'distributor-1',
    target: 'retailer-1',
    type: 'supply',
    animated: true,
    data: { status: 'active', flowVolume: 200, leadTime: 12 },
  },
];

// Create context
const DigitalTwinContext = createContext<DigitalTwinContextState | null>(null);

// Dagre layout helper
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (
  nodes: Node<SupplyChainNodeData>[],
  edges: Edge<SupplyChainEdgeData>[]
) => {
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 200 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 60,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Provider component
export function DigitalTwinProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<Node<SupplyChainNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge<SupplyChainEdgeData>[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [cascadeState, setCascadeState] = useState<CascadeState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Track cascade animation timeouts to prevent memory leaks
  const cascadeTimeouts = useRef<NodeJS.Timeout[]>([]);

  const memory = useMemory();

  // Node change handler
  const onNodesChange: OnNodesChange<Node<SupplyChainNodeData>> = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  // Edge change handler
  const onEdgesChange: OnEdgesChange<Edge<SupplyChainEdgeData>> = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  // Add a new node
  const addNode = useCallback(
    (type: SupplyChainNodeType, position?: { x: number; y: number }) => {
      const id = `${type}-${Date.now()}`;
      const defaultNames: Record<SupplyChainNodeType, string> = {
        supplier: 'New Supplier',
        manufacturer: 'New Manufacturer',
        warehouse: 'New Warehouse',
        distributor: 'New Distributor',
        retailer: 'New Retailer',
      };

      const newNode: Node<SupplyChainNodeData> = {
        id,
        type,
        position: position || { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        data: {
          name: defaultNames[type],
          location: 'Unknown Location',
          region: 'global',
          status: 'healthy',
          capacity: 100,
          utilization: 0,
          riskLevel: 0,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
    },
    []
  );

  // Update node data
  const updateNode = useCallback(
    (id: string, data: Partial<SupplyChainNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
    },
    []
  );

  // Delete node
  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNodeId((current) => (current === id ? null : current));
  }, []);

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  }, [selectedNodeId, deleteNode]);

  // Update edge data
  const updateEdge = useCallback(
    (id: string, data: Partial<SupplyChainEdgeData>) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? {
                ...edge,
                data: {
                  status: edge.data?.status || 'active',
                  ...edge.data,
                  ...data,
                } as SupplyChainEdgeData,
              }
            : edge
        )
      );
    },
    []
  );

  // Delete edge
  const deleteEdge = useCallback((id: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
    setSelectedEdgeId((current) => (current === id ? null : current));
  }, []);

  // Check if edge exists (prevent duplicates)
  const edgeExists = useCallback(
    (source: string, target: string) => {
      return edges.some(
        (edge) =>
          (edge.source === source && edge.target === target) ||
          (edge.source === target && edge.target === source)
      );
    },
    [edges]
  );

  // Auto layout using dagre
  const autoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges]);

  // Cascade animation with proper cleanup
  const startCascadeAnimation = useCallback((cascade: CascadeState) => {
    // Clear any existing timeouts first
    cascadeTimeouts.current.forEach(clearTimeout);
    cascadeTimeouts.current = [];

    setCascadeState(cascade);
    setIsAnimating(true);

    // Animate through cascade steps with tracked timeouts
    cascade.steps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCascadeState((prev) =>
          prev ? { ...prev, currentStep: index } : null
        );
      }, step.timestamp);
      cascadeTimeouts.current.push(timeout);
    });
  }, []);

  const stopCascadeAnimation = useCallback(() => {
    // Clear all pending timeouts
    cascadeTimeouts.current.forEach(clearTimeout);
    cascadeTimeouts.current = [];
    setIsAnimating(false);
  }, []);

  const resetCascade = useCallback(() => {
    // Clear all pending timeouts
    cascadeTimeouts.current.forEach(clearTimeout);
    cascadeTimeouts.current = [];
    setCascadeState(null);
    setIsAnimating(false);
    // Reset node cascade states
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          cascadeActive: false,
          cascadeImpact: undefined,
          financialImpact: undefined,
        },
      }))
    );
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      cascadeTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  // Export network to JSON
  const exportNetwork = useCallback(() => {
    const networkData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          name: n.data.name,
          location: n.data.location,
          region: n.data.region,
          status: n.data.status,
          capacity: n.data.capacity,
          utilization: n.data.utilization,
          riskLevel: n.data.riskLevel,
        },
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: {
          status: e.data?.status || 'active',
          flowVolume: e.data?.flowVolume,
          leadTime: e.data?.leadTime,
        },
      })),
    };
    return JSON.stringify(networkData, null, 2);
  }, [nodes, edges]);

  // Import network from JSON
  const importNetwork = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);

      if (!data.nodes || !data.edges) {
        console.error('Invalid network format: missing nodes or edges');
        return false;
      }

      const importedNodes = data.nodes.map((n: {
        id: string;
        type: string;
        position: { x: number; y: number };
        data: SupplyChainNodeData;
      }) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })) as Node<SupplyChainNodeData>[];

      const importedEdges = data.edges.map((e: {
        id: string;
        source: string;
        target: string;
        data: SupplyChainEdgeData;
      }) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'supply',
        animated: e.data.status === 'active',
        data: e.data,
      })) as Edge<SupplyChainEdgeData>[];

      setNodes(importedNodes);
      setEdges(importedEdges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);

      return true;
    } catch (error) {
      console.error('Failed to import network:', error);
      return false;
    }
  }, []);

  // Memory integration
  const saveToMemory = useCallback(() => {
    const memoryNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type as 'supplier' | 'manufacturer' | 'warehouse' | 'distributor' | 'retailer',
      position: n.position,
      data: {
        name: n.data.name,
        location: n.data.location,
        region: n.data.region,
        status: n.data.status,
        capacity: n.data.capacity,
        utilization: n.data.utilization,
        riskLevel: n.data.riskLevel,
      },
    }));

    const memoryEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: {
        status: e.data?.status || 'active',
        flowVolume: e.data?.flowVolume,
        leadTime: e.data?.leadTime,
      },
    }));

    memory.saveSnapshot(memoryNodes, memoryEdges);
  }, [nodes, edges, memory]);

  const loadFromMemory = useCallback(() => {
    const snapshot = memory.getLatestSnapshot();
    if (snapshot) {
      const loadedNodes = snapshot.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })) as Node<SupplyChainNodeData>[];

      const loadedEdges = snapshot.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'supply',
        animated: e.data.status === 'active',
        data: e.data,
      })) as Edge<SupplyChainEdgeData>[];

      setNodes(loadedNodes);
      setEdges(loadedEdges);
    }
  }, [memory]);

  // Voice command helpers
  const highlightNodesByRegion = useCallback((region: string) => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        className: node.data.region === region ? 'ring-2 ring-blue-500' : '',
      }))
    );
  }, []);

  const highlightNodesByStatus = useCallback(
    (status: 'healthy' | 'warning' | 'critical') => {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          className: node.data.status === status ? 'ring-2 ring-blue-500' : '',
        }))
      );
    },
    []
  );

  const clearHighlights = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        className: '',
      }))
    );
  }, []);

  // Load from memory on mount
  useEffect(() => {
    if (!memory.isLoading) {
      const snapshot = memory.getLatestSnapshot();
      if (snapshot && snapshot.nodes.length > 0) {
        loadFromMemory();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory.isLoading]);

  const value: DigitalTwinContextState = {
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
    addNode,
    updateNode,
    deleteSelectedNode,
    deleteNode,
    updateEdge,
    deleteEdge,
    edgeExists,
    exportNetwork,
    importNetwork,
    autoLayout,
    cascadeState,
    isAnimating,
    startCascadeAnimation,
    stopCascadeAnimation,
    resetCascade,
    saveToMemory,
    loadFromMemory,
    highlightNodesByRegion,
    highlightNodesByStatus,
    clearHighlights,
  };

  return (
    <DigitalTwinContext.Provider value={value}>
      {children}
    </DigitalTwinContext.Provider>
  );
}

// Hook to use the context
export function useDigitalTwin() {
  const context = useContext(DigitalTwinContext);

  if (!context) {
    throw new Error('useDigitalTwin must be used within a DigitalTwinProvider');
  }

  return context;
}
