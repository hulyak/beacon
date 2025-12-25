'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Layers, 
  Zap, 
  AlertTriangle, 
  TrendingUp,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Filter
} from 'lucide-react';
import { ModernCard } from '../ui/modern-card';
import { ModernButton } from '../ui/modern-button';
import { ModernBadge } from '../ui/modern-badge';

interface NetworkNode {
  id: string;
  type: 'supplier' | 'manufacturer' | 'distributor' | 'retailer' | 'port' | 'warehouse';
  name: string;
  location: { lat: number; lng: number; alt: number };
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  metrics: {
    capacity: number;
    utilization: number;
    efficiency: number;
    riskScore: number;
  };
  connections: string[];
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  type: 'shipping' | 'rail' | 'truck' | 'air' | 'pipeline';
  status: 'active' | 'congested' | 'delayed' | 'blocked';
  flow: number; // 0-100
  cost: number;
  duration: number; // hours
}

const mockNodes: NetworkNode[] = [
  {
    id: 'supplier-1',
    type: 'supplier',
    name: 'TechCorp Manufacturing',
    location: { lat: 31.2304, lng: 121.4737, alt: 0.1 },
    status: 'healthy',
    metrics: { capacity: 85, utilization: 72, efficiency: 88, riskScore: 15 },
    connections: ['port-1', 'warehouse-1']
  },
  {
    id: 'port-1',
    type: 'port',
    name: 'Shanghai Port',
    location: { lat: 31.0, lng: 121.5, alt: 0 },
    status: 'warning',
    metrics: { capacity: 95, utilization: 89, efficiency: 76, riskScore: 35 },
    connections: ['port-2', 'warehouse-2']
  },
  {
    id: 'port-2',
    type: 'port',
    name: 'Rotterdam Port',
    location: { lat: 51.9244, lng: 4.4777, alt: 0 },
    status: 'healthy',
    metrics: { capacity: 78, utilization: 65, efficiency: 92, riskScore: 12 },
    connections: ['warehouse-3', 'distributor-1']
  },
  {
    id: 'warehouse-1',
    type: 'warehouse',
    name: 'Asia Distribution Hub',
    location: { lat: 35.6762, lng: 139.6503, alt: 0.05 },
    status: 'healthy',
    metrics: { capacity: 67, utilization: 54, efficiency: 85, riskScore: 18 },
    connections: ['distributor-2']
  },
  {
    id: 'warehouse-2',
    type: 'warehouse',
    name: 'Pacific Logistics Center',
    location: { lat: 37.7749, lng: -122.4194, alt: 0.05 },
    status: 'critical',
    metrics: { capacity: 45, utilization: 89, efficiency: 62, riskScore: 78 },
    connections: ['retailer-1', 'retailer-2']
  },
  {
    id: 'distributor-1',
    type: 'distributor',
    name: 'European Distribution',
    location: { lat: 52.3676, lng: 4.9041, alt: 0.03 },
    status: 'healthy',
    metrics: { capacity: 72, utilization: 68, efficiency: 87, riskScore: 22 },
    connections: ['retailer-3']
  },
  {
    id: 'retailer-1',
    type: 'retailer',
    name: 'West Coast Retail',
    location: { lat: 34.0522, lng: -118.2437, alt: 0.02 },
    status: 'healthy',
    metrics: { capacity: 88, utilization: 76, efficiency: 91, riskScore: 8 },
    connections: []
  }
];

const mockEdges: NetworkEdge[] = [
  {
    id: 'edge-1',
    from: 'supplier-1',
    to: 'port-1',
    type: 'truck',
    status: 'active',
    flow: 75,
    cost: 1200,
    duration: 4
  },
  {
    id: 'edge-2',
    from: 'port-1',
    to: 'port-2',
    type: 'shipping',
    status: 'congested',
    flow: 45,
    cost: 8500,
    duration: 168
  },
  {
    id: 'edge-3',
    from: 'port-2',
    to: 'warehouse-2',
    type: 'shipping',
    status: 'active',
    flow: 82,
    cost: 12000,
    duration: 240
  }
];

const getNodeColor = (status: NetworkNode['status']) => {
  switch (status) {
    case 'healthy': return '#10B981';
    case 'warning': return '#F59E0B';
    case 'critical': return '#EF4444';
    case 'offline': return '#6B7280';
  }
};

const getNodeIcon = (type: NetworkNode['type']) => {
  switch (type) {
    case 'supplier': return '🏭';
    case 'manufacturer': return '⚙️';
    case 'distributor': return '📦';
    case 'retailer': return '🏪';
    case 'port': return '🚢';
    case 'warehouse': return '🏢';
  }
};

export function Network3DVisualization() {
  const [nodes] = useState<NetworkNode[]>(mockNodes);
  const [edges] = useState<NetworkEdge[]>(mockEdges);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'globe' | 'network' | 'flow'>('globe');
  const [filters, setFilters] = useState({
    showHealthy: true,
    showWarning: true,
    showCritical: true,
    showOffline: false
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate 3D visualization (in a real implementation, you'd use Three.js or similar)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw connections
      edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        
        if (fromNode && toNode) {
          const fromX = (fromNode.location.lng + 180) * (canvas.width / 360);
          const fromY = (90 - fromNode.location.lat) * (canvas.height / 180);
          const toX = (toNode.location.lng + 180) * (canvas.width / 360);
          const toY = (90 - toNode.location.lat) * (canvas.height / 180);

          // Draw connection line
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.strokeStyle = edge.status === 'active' ? '#10B981' : 
                           edge.status === 'congested' ? '#F59E0B' : '#EF4444';
          ctx.lineWidth = Math.max(1, edge.flow / 25);
          ctx.stroke();

          // Draw flow animation
          if (isPlaying && edge.status === 'active') {
            const time = Date.now() / 1000;
            const progress = (time % 2) / 2;
            const animX = fromX + (toX - fromX) * progress;
            const animY = fromY + (toY - fromY) * progress;
            
            ctx.beginPath();
            ctx.arc(animX, animY, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#60A5FA';
            ctx.fill();
          }
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        if (!filters[`show${node.status.charAt(0).toUpperCase() + node.status.slice(1)}` as keyof typeof filters]) {
          return;
        }

        const x = (node.location.lng + 180) * (canvas.width / 360);
        const y = (90 - node.location.lat) * (canvas.height / 180);
        const size = 8 + node.metrics.capacity / 10;

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = getNodeColor(node.status);
        ctx.fill();
        
        // Draw node border
        ctx.strokeStyle = selectedNode?.id === node.id ? '#FFFFFF' : '#1e293b';
        ctx.lineWidth = selectedNode?.id === node.id ? 3 : 1;
        ctx.stroke();

        // Draw utilization ring
        ctx.beginPath();
        ctx.arc(x, y, size + 3, 0, 2 * Math.PI * (node.metrics.utilization / 100));
        ctx.strokeStyle = '#60A5FA';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw node label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.split(' ')[0], x, y + size + 15);
      });

      if (isPlaying) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [nodes, edges, selectedNode, isPlaying, filters]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const x = (node.location.lng + 180) * (canvas.width / 360);
      const y = (90 - node.location.lat) * (canvas.height / 180);
      const size = 8 + node.metrics.capacity / 10;
      
      const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
      return distance <= size + 5;
    });

    setSelectedNode(clickedNode || null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Network Visualization</h2>
            <p className="text-sm text-gray-600">Interactive 3D supply chain network</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ModernButton
            variant={isPlaying ? "primary" : "outline"}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </ModernButton>
          
          <ModernButton variant="outline" size="sm">
            <RotateCcw className="w-4 h-4" />
          </ModernButton>
          
          <ModernButton variant="outline" size="sm">
            <Maximize2 className="w-4 h-4" />
          </ModernButton>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModernButton
            variant={viewMode === 'globe' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('globe')}
          >
            <Globe className="w-4 h-4 mr-1" />
            Globe
          </ModernButton>
          <ModernButton
            variant={viewMode === 'network' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('network')}
          >
            <Layers className="w-4 h-4 mr-1" />
            Network
          </ModernButton>
          <ModernButton
            variant={viewMode === 'flow' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('flow')}
          >
            <Zap className="w-4 h-4 mr-1" />
            Flow
          </ModernButton>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex items-center gap-1">
            {Object.entries(filters).map(([key, value]) => (
              <ModernButton
                key={key}
                variant={value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, [key]: !value }))}
                className="text-xs"
              >
                {key.replace('show', '')}
              </ModernButton>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Canvas */}
        <div className="lg:col-span-3">
          <ModernCard className="p-0 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full h-[500px] cursor-pointer"
              onClick={handleCanvasClick}
            />
          </ModernCard>
        </div>

        {/* Node Details Panel */}
        <div className="space-y-4">
          {selectedNode ? (
            <ModernCard className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getNodeIcon(selectedNode.type)}</div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedNode.name}</h3>
                    <ModernBadge 
                      variant={selectedNode.status === 'healthy' ? 'success' : 
                              selectedNode.status === 'warning' ? 'warning' : 'destructive'}
                    >
                      {selectedNode.status.toUpperCase()}
                    </ModernBadge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-medium">{selectedNode.metrics.capacity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${selectedNode.metrics.capacity}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilization</span>
                      <span className="font-medium">{selectedNode.metrics.utilization}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${selectedNode.metrics.utilization}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Efficiency</span>
                      <span className="font-medium">{selectedNode.metrics.efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${selectedNode.metrics.efficiency}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Risk Score</span>
                      <span className="font-medium">{selectedNode.metrics.riskScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${selectedNode.metrics.riskScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <ModernButton variant="outline" size="sm" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Node
                </ModernButton>
              </div>
            </ModernCard>
          ) : (
            <ModernCard className="p-4">
              <div className="text-center text-gray-500">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click on a node to view details</p>
              </div>
            </ModernCard>
          )}

          {/* Network Stats */}
          <ModernCard className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Network Health</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Nodes</span>
                <span className="font-medium text-green-600">
                  {nodes.filter(n => n.status === 'healthy').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Warnings</span>
                <span className="font-medium text-yellow-600">
                  {nodes.filter(n => n.status === 'warning').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Critical</span>
                <span className="font-medium text-red-600">
                  {nodes.filter(n => n.status === 'critical').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Efficiency</span>
                <span className="font-medium">
                  {Math.round(nodes.reduce((acc, n) => acc + n.metrics.efficiency, 0) / nodes.length)}%
                </span>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}