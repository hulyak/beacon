'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface NetworkNode {
  id: string;
  type: 'supplier' | 'manufacturer' | 'warehouse' | 'distributor' | 'retailer';
  name: string;
  region?: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    inventory?: number;
    capacity?: number;
    utilization?: number;
    output?: number;
    turnover?: number;
    deliveries?: number;
    orders?: number;
  };
  x?: number;
  y?: number;
}

interface NetworkLink {
  source: string;
  target: string;
  status: 'active' | 'delayed' | 'disrupted';
  flow: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  summary: {
    totalNodes: number;
    healthyNodes: number;
    warningNodes: number;
    criticalNodes: number;
    totalLinks: number;
    activeLinks: number;
    delayedLinks: number;
    disruptedLinks: number;
    networkHealth: number;
  };
  timestamp: string;
}

const nodeColors: Record<string, string> = {
  supplier: '#06b6d4',
  manufacturer: '#8b5cf6',
  warehouse: '#f59e0b',
  distributor: '#10b981',
  retailer: '#ec4899',
};

const statusColors: Record<string, string> = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
};

const linkColors: Record<string, string> = {
  active: '#22c55e',
  delayed: '#f59e0b',
  disrupted: '#ef4444',
};

const nodeIcons: Record<string, string> = {
  supplier: '🏭',
  manufacturer: '⚙️',
  warehouse: '📦',
  distributor: '🚚',
  retailer: '🏪',
};

export function SupplyChainNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchNetworkData = useCallback(async () => {
    try {
      const networkUrl = process.env.NEXT_PUBLIC_GET_NETWORK_URL;
      if (!networkUrl) {
        throw new Error('Network API not configured');
      }

      const response = await fetch(networkUrl);
      const data = await response.json();

      if (data.success) {
        setNetworkData(data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch network data');
      }
    } catch (err) {
      console.error('Error fetching network data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 30000);
    return () => clearInterval(interval);
  }, [fetchNetworkData]);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !networkData) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    // Create gradient definitions
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Position nodes in layers
    const layers: Record<string, number> = {
      supplier: 0.1,
      manufacturer: 0.3,
      warehouse: 0.5,
      distributor: 0.7,
      retailer: 0.9,
    };

    const nodesByType: Record<string, NetworkNode[]> = {};
    networkData.nodes.forEach(node => {
      if (!nodesByType[node.type]) nodesByType[node.type] = [];
      nodesByType[node.type].push(node);
    });

    const positionedNodes = networkData.nodes.map(node => {
      const typeNodes = nodesByType[node.type];
      const index = typeNodes.indexOf(node);
      const count = typeNodes.length;
      return {
        ...node,
        x: layers[node.type] * width,
        y: ((index + 1) / (count + 1)) * height,
      };
    });

    // Draw links
    const linkGroup = svg.append('g').attr('class', 'links');

    networkData.links.forEach((link, i) => {
      const sourceNode = positionedNodes.find(n => n.id === link.source);
      const targetNode = positionedNodes.find(n => n.id === link.target);

      if (sourceNode && targetNode) {
        // Path
        linkGroup.append('path')
          .attr('d', `M ${sourceNode.x} ${sourceNode.y} Q ${(sourceNode.x! + targetNode.x!) / 2} ${(sourceNode.y! + targetNode.y!) / 2 - 20} ${targetNode.x} ${targetNode.y}`)
          .attr('fill', 'none')
          .attr('stroke', linkColors[link.status])
          .attr('stroke-width', Math.max(2, link.flow / 20))
          .attr('stroke-opacity', 0.6)
          .attr('filter', 'url(#glow)');

        // Animated flow particles for active links
        if (link.status === 'active' && sourceNode && targetNode) {
          const particle = linkGroup.append('circle')
            .attr('r', 4)
            .attr('fill', linkColors[link.status])
            .attr('filter', 'url(#glow)');

          const srcX = sourceNode.x!;
          const srcY = sourceNode.y!;
          const tgtX = targetNode.x!;
          const tgtY = targetNode.y!;

          function animateParticle() {
            particle
              .attr('cx', srcX)
              .attr('cy', srcY)
              .transition()
              .duration(2000 + i * 200)
              .ease(d3.easeLinear)
              .attrTween('cx', () => {
                return (t: number) => String(srcX + (tgtX - srcX) * t);
              })
              .attrTween('cy', () => {
                return (t: number) => {
                  const midY = (srcY + tgtY) / 2 - 20;
                  if (t < 0.5) {
                    return String(srcY + (midY - srcY) * (t * 2));
                  } else {
                    return String(midY + (tgtY - midY) * ((t - 0.5) * 2));
                  }
                };
              })
              .on('end', animateParticle);
          }
          animateParticle();
        }
      }
    });

    // Draw nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    positionedNodes.forEach((node) => {
      const g = nodeGroup.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => setSelectedNode(node));

      // Outer glow ring for status
      g.append('circle')
        .attr('r', 35)
        .attr('fill', 'none')
        .attr('stroke', statusColors[node.status])
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5)
        .attr('filter', 'url(#glow)');

      // Pulsing animation for warning/critical
      if (node.status !== 'healthy') {
        g.append('circle')
          .attr('r', 35)
          .attr('fill', 'none')
          .attr('stroke', statusColors[node.status])
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('from', '35')
          .attr('to', '50')
          .attr('dur', '1.5s')
          .attr('repeatCount', 'indefinite');
      }

      // Main node circle
      g.append('circle')
        .attr('r', 30)
        .attr('fill', `${nodeColors[node.type]}20`)
        .attr('stroke', nodeColors[node.type])
        .attr('stroke-width', 2);

      // Node icon
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '20px')
        .text(nodeIcons[node.type]);

      // Node label
      g.append('text')
        .attr('y', 45)
        .attr('text-anchor', 'middle')
        .attr('fill', '#374151')
        .attr('font-size', '10px')
        .text(node.name.length > 18 ? node.name.substring(0, 16) + '...' : node.name);

      // Status indicator
      g.append('circle')
        .attr('cx', 20)
        .attr('cy', -20)
        .attr('r', 6)
        .attr('fill', statusColors[node.status]);
    });

  }, [networkData]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading network data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-300 rounded-xl p-4 shadow-sm h-[500px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load network</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={fetchNetworkData}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">Supply Chain Network</h3>
            <p className="text-gray-500 text-sm">
              {networkData?.summary.totalNodes} nodes • {networkData?.summary.networkHealth}% healthy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
          <button
            onClick={fetchNetworkData}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="relative h-[400px] bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
        <svg ref={svgRef} className="w-full h-full" />

        {/* Legend - Horizontal at bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-2">
              {Object.entries(nodeColors).slice(0, 5).map(([type]) => (
                <div key={type} className="flex items-center gap-1">
                  <span className="text-xs">{nodeIcons[type as keyof typeof nodeIcons]}</span>
                  <span className="text-gray-500 capitalize hidden sm:inline">{type}</span>
                </div>
              ))}
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-gray-500 capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {networkData?.summary && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-gray-500">Active Links:</span>
              <span className="text-green-600">{networkData.summary.activeLinks}</span>
              <span className="text-gray-500">Delayed:</span>
              <span className="text-yellow-600">{networkData.summary.delayedLinks}</span>
              <span className="text-gray-500">Disrupted:</span>
              <span className="text-red-600">{networkData.summary.disruptedLinks}</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{nodeIcons[selectedNode.type]}</span>
              <div>
                <h4 className="text-gray-900 font-medium">{selectedNode.name}</h4>
                <span className="text-xs text-gray-500 capitalize">{selectedNode.type} • {selectedNode.region}</span>
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              selectedNode.status === 'healthy' ? 'bg-green-100 text-green-600' :
              selectedNode.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
              'bg-red-100 text-red-600'
            }`}>
              {selectedNode.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {selectedNode.metrics.inventory !== undefined && (
              <div>
                <div className="text-xs text-gray-500">Inventory</div>
                <div className="text-lg font-semibold text-gray-900">{selectedNode.metrics.inventory}%</div>
              </div>
            )}
            {selectedNode.metrics.capacity !== undefined && (
              <div>
                <div className="text-xs text-gray-500">Capacity</div>
                <div className="text-lg font-semibold text-gray-900">{selectedNode.metrics.capacity}</div>
              </div>
            )}
            {selectedNode.metrics.utilization !== undefined && (
              <div>
                <div className="text-xs text-gray-500">Utilization</div>
                <div className="text-lg font-semibold text-gray-900">{selectedNode.metrics.utilization}%</div>
              </div>
            )}
            {selectedNode.metrics.output !== undefined && (
              <div>
                <div className="text-xs text-gray-500">Output</div>
                <div className="text-lg font-semibold text-gray-900">{selectedNode.metrics.output}</div>
              </div>
            )}
            {selectedNode.metrics.turnover !== undefined && (
              <div>
                <div className="text-xs text-gray-500">Turnover</div>
                <div className="text-lg font-semibold text-gray-900">{selectedNode.metrics.turnover}x</div>
              </div>
            )}
            {selectedNode.metrics.deliveries !== undefined && (
              <div>
                <div className="text-xs text-gray-500">Deliveries</div>
                <div className="text-lg font-semibold text-gray-900">{selectedNode.metrics.deliveries}</div>
              </div>
            )}
            {selectedNode.metrics.orders !== undefined && (
              <div>
                <div className="text-xs text-gray-500">Orders</div>
                <div className="text-lg font-semibold text-gray-900">{selectedNode.metrics.orders}</div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
