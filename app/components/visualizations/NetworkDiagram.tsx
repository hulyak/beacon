'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Network diagram component for supply chain topology visualization
// Requirement 4.1: Display interactive supply chain network diagrams with nodes, connections, and risk indicators

interface NetworkNode {
  id: string;
  name: string;
  type: 'supplier' | 'manufacturer' | 'distributor' | 'retailer' | 'customer';
  region: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  coordinates?: { x: number; y: number };
  metadata?: {
    capacity?: number;
    reliability?: number;
    cost?: number;
    sustainabilityScore?: number;
  };
}

interface NetworkLink {
  source: string;
  target: string;
  type: 'supply' | 'transport' | 'information';
  strength: number; // 0-1
  cost?: number;
  emissions?: number;
  reliability?: number;
}

interface NetworkDiagramProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  width?: number;
  height?: number;
  interactive?: boolean;
  showRiskIndicators?: boolean;
  showMetrics?: boolean;
  onNodeClick?: (node: NetworkNode) => void;
  onLinkClick?: (link: NetworkLink) => void;
  className?: string;
}

const NetworkDiagram: React.FC<NetworkDiagramProps> = ({
  nodes = [],
  links = [],
  width = 800,
  height = 600,
  interactive = true,
  showRiskIndicators = true,
  showMetrics = false,
  onNodeClick,
  onLinkClick,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Color schemes for different node types and risk levels
  const nodeColors = {
    supplier: '#3B82F6',      // Blue
    manufacturer: '#10B981',   // Green
    distributor: '#F59E0B',    // Amber
    retailer: '#8B5CF6',       // Purple
    customer: '#EF4444',       // Red
  };

  const riskColors = {
    low: '#10B981',      // Green
    medium: '#F59E0B',   // Amber
    high: '#F97316',     // Orange
    critical: '#EF4444', // Red
  };

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const container = svg.append('g').attr('class', 'network-container');

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    if (interactive) {
      svg.call(zoom);
    }

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const linkElements = container.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', (d) => getLinkColor(d))
      .attr('stroke-width', (d) => Math.max(1, d.strength * 4))
      .attr('stroke-opacity', 0.6)
      .style('cursor', interactive ? 'pointer' : 'default');

    // Add link labels for metrics
    const linkLabels = container.selectAll('.link-label')
      .data(showMetrics ? links : [])
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d) => getLinkLabel(d));

    // Create node groups
    const nodeGroups = container.selectAll('.node-group')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', interactive ? 'pointer' : 'default');

    // Add node circles
    const nodeCircles = nodeGroups.append('circle')
      .attr('class', 'node')
      .attr('r', (d) => getNodeRadius(d))
      .attr('fill', (d) => nodeColors[d.type])
      .attr('stroke', (d) => showRiskIndicators ? riskColors[d.riskLevel] : '#fff')
      .attr('stroke-width', (d) => showRiskIndicators ? 3 : 2);

    // Add node labels
    const nodeLabels = nodeGroups.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text((d) => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name);

    // Add risk indicators
    if (showRiskIndicators) {
      nodeGroups.append('circle')
        .attr('class', 'risk-indicator')
        .attr('r', 8)
        .attr('cx', 15)
        .attr('cy', -15)
        .attr('fill', (d) => riskColors[d.riskLevel])
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      nodeGroups.append('text')
        .attr('class', 'risk-text')
        .attr('x', 15)
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .text((d) => d.riskLevel.charAt(0).toUpperCase());
    }

    // Add interaction handlers
    if (interactive) {
      nodeGroups
        .on('click', (event, d) => {
          event.stopPropagation();
          setSelectedNode(d);
          onNodeClick?.(d);
        })
        .on('mouseover', function(event, d) {
          d3.select(this).select('.node')
            .transition()
            .duration(200)
            .attr('r', getNodeRadius(d) * 1.2);
          
          // Show tooltip
          showTooltip(event, d);
        })
        .on('mouseout', function(event, d) {
          d3.select(this).select('.node')
            .transition()
            .duration(200)
            .attr('r', getNodeRadius(d));
          
          hideTooltip();
        });

      linkElements
        .on('click', (event, d) => {
          event.stopPropagation();
          setSelectedLink(d);
          onLinkClick?.(d);
        })
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('stroke-width', Math.max(2, d.strength * 6));
          
          showLinkTooltip(event, d);
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('stroke-width', Math.max(1, d.strength * 4));
          
          hideTooltip();
        });

      // Add drag behavior
      const drag = d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      nodeGroups.call(drag);
    }

    // Update positions on simulation tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      nodeGroups
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Clear selections on background click
    svg.on('click', () => {
      setSelectedNode(null);
      setSelectedLink(null);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, interactive, showRiskIndicators, showMetrics]);

  const getNodeRadius = (node: NetworkNode): number => {
    const baseRadius = 20;
    const capacityMultiplier = node.metadata?.capacity ? Math.sqrt(node.metadata.capacity / 100) : 1;
    return Math.max(15, Math.min(35, baseRadius * capacityMultiplier));
  };

  const getLinkColor = (link: NetworkLink): string => {
    const colors = {
      supply: '#3B82F6',
      transport: '#10B981',
      information: '#8B5CF6',
    };
    return colors[link.type] || '#6B7280';
  };

  const getLinkLabel = (link: NetworkLink): string => {
    if (link.cost) return `$${link.cost}`;
    if (link.emissions) return `${link.emissions}kg CO₂`;
    if (link.reliability) return `${Math.round(link.reliability * 100)}%`;
    return '';
  };

  const showTooltip = (event: any, node: NetworkNode) => {
    const tooltip = d3.select('body').selectAll<HTMLDivElement, number>('.network-tooltip').data([0]);
    
    const tooltipEnter = tooltip.enter()
      .append('div')
      .attr('class', 'network-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    const tooltipUpdate = tooltipEnter.merge(tooltip);
    
    tooltipUpdate
      .html(`
        <div><strong>${node.name}</strong></div>
        <div>Type: ${node.type}</div>
        <div>Region: ${node.region}</div>
        <div>Risk Level: ${node.riskLevel}</div>
        ${node.metadata?.capacity ? `<div>Capacity: ${node.metadata.capacity}</div>` : ''}
        ${node.metadata?.reliability ? `<div>Reliability: ${Math.round(node.metadata.reliability * 100)}%</div>` : ''}
        ${node.metadata?.sustainabilityScore ? `<div>Sustainability: ${node.metadata.sustainabilityScore}</div>` : ''}
      `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .style('opacity', 1);
  };

  const showLinkTooltip = (event: any, link: NetworkLink) => {
    const tooltip = d3.select('body').selectAll<HTMLDivElement, number>('.network-tooltip').data([0]);
    
    const tooltipEnter = tooltip.enter()
      .append('div')
      .attr('class', 'network-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    const tooltipUpdate = tooltipEnter.merge(tooltip);
    
    tooltipUpdate
      .html(`
        <div><strong>${link.source} → ${link.target}</strong></div>
        <div>Type: ${link.type}</div>
        <div>Strength: ${Math.round(link.strength * 100)}%</div>
        ${link.cost ? `<div>Cost: $${link.cost}</div>` : ''}
        ${link.emissions ? `<div>Emissions: ${link.emissions}kg CO₂</div>` : ''}
        ${link.reliability ? `<div>Reliability: ${Math.round(link.reliability * 100)}%</div>` : ''}
      `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .style('opacity', 1);
  };

  const hideTooltip = () => {
    d3.select('body').selectAll('.network-tooltip')
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();
  };

  const resetZoom = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity
        );
    }
  };

  const fitToScreen = () => {
    if (svgRef.current && nodes.length > 0) {
      const svg = d3.select(svgRef.current);
      const containerNode = svg.select('.network-container').node() as SVGGElement;
      
      if (containerNode) {
        const bounds = containerNode.getBBox();
        const fullWidth = width;
        const fullHeight = height;
        const widthScale = fullWidth / bounds.width;
        const heightScale = fullHeight / bounds.height;
        const scale = Math.min(widthScale, heightScale) * 0.9;
        
        const translate = [
          fullWidth / 2 - scale * (bounds.x + bounds.width / 2),
          fullHeight / 2 - scale * (bounds.y + bounds.height / 2)
        ];

        svg.transition()
          .duration(750)
          .call(
            d3.zoom<SVGSVGElement, unknown>().transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
          );
      }
    }
  };

  return (
    <Card className={`network-diagram ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Supply Chain Network
        </CardTitle>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={resetZoom}
            className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
          >
            Reset
          </button>
          <button
            onClick={fitToScreen}
            className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
          >
            Fit
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="border rounded-lg bg-background"
          />
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium">Node Types</div>
            {Object.entries(nodeColors).map(([type, color]) => (
              <div key={type} className="flex items-center space-x-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{type}</span>
              </div>
            ))}
            
            {showRiskIndicators && (
              <>
                <div className="text-sm font-medium mt-3">Risk Levels</div>
                {Object.entries(riskColors).map(([level, color]) => (
                  <div key={level} className="flex items-center space-x-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{level}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Selection Info */}
          {(selectedNode || selectedLink) && (
            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 min-w-48">
              {selectedNode && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Selected Node</div>
                  <div className="text-xs space-y-1">
                    <div><strong>Name:</strong> {selectedNode.name}</div>
                    <div><strong>Type:</strong> {selectedNode.type}</div>
                    <div><strong>Region:</strong> {selectedNode.region}</div>
                    <div><strong>Risk:</strong> {selectedNode.riskLevel}</div>
                    {selectedNode.metadata?.capacity && (
                      <div><strong>Capacity:</strong> {selectedNode.metadata.capacity}</div>
                    )}
                    {selectedNode.metadata?.reliability && (
                      <div><strong>Reliability:</strong> {Math.round(selectedNode.metadata.reliability * 100)}%</div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedLink && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Selected Link</div>
                  <div className="text-xs space-y-1">
                    <div><strong>Connection:</strong> {selectedLink.source} → {selectedLink.target}</div>
                    <div><strong>Type:</strong> {selectedLink.type}</div>
                    <div><strong>Strength:</strong> {Math.round(selectedLink.strength * 100)}%</div>
                    {selectedLink.cost && (
                      <div><strong>Cost:</strong> ${selectedLink.cost}</div>
                    )}
                    {selectedLink.emissions && (
                      <div><strong>Emissions:</strong> {selectedLink.emissions}kg CO₂</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Network Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{nodes.length}</div>
            <div className="text-muted-foreground">Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{links.length}</div>
            <div className="text-muted-foreground">Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {nodes.filter(n => n.riskLevel === 'high' || n.riskLevel === 'critical').length}
            </div>
            <div className="text-muted-foreground">High Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(links.reduce((sum, link) => sum + link.strength, 0) / links.length * 100) || 0}%
            </div>
            <div className="text-muted-foreground">Avg Strength</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkDiagram;