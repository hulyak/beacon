'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as d3 from 'd3';
import { NetworkNode, PropagationStep } from '@/lib/types/enhanced-analytics';
import { getRiskLevelColor } from '@/lib/utils/analytics-utils';

interface CascadeVisualizationProps {
  affectedNodes: NetworkNode[];
  propagationPath: PropagationStep[];
  networkImpactScore: number;
  onNodeSelect?: (node: NetworkNode) => void;
}

interface D3Node extends NetworkNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  impactMagnitude: number;
  propagationType: 'direct' | 'indirect' | 'cascading';
}

export default function CascadeVisualization({ 
  affectedNodes, 
  propagationPath, 
  networkImpactScore,
  onNodeSelect 
}: CascadeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);

  useEffect(() => {
    if (affectedNodes.length > 0 && svgRef.current) {
      renderNetworkVisualization();
    }
  }, [affectedNodes, propagationPath]);

  const renderNetworkVisualization = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous visualization

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Prepare data
    const nodes: D3Node[] = affectedNodes.map(node => ({ ...node }));
    const links: D3Link[] = propagationPath.map(step => ({
      source: step.fromNode,
      target: step.toNode,
      impactMagnitude: step.impactMagnitude,
      propagationType: step.propagationType
    }));

    // Create force simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create SVG container
    const container = svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background", "#f8fafc");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    const g = container.append("g");

    // Create arrow markers for directed links
    const defs = g.append("defs");
    
    defs.selectAll("marker")
      .data(["direct", "indirect", "cascading"])
      .enter()
      .append("marker")
      .attr("id", d => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", d => getImpactTypeColor(d));

    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", d => getImpactTypeColor(d.propagationType))
      .attr("stroke-width", d => Math.max(1, d.impactMagnitude / 20))
      .attr("stroke-opacity", 0.7)
      .attr("marker-end", d => `url(#arrow-${d.propagationType})`);

    // Create node groups
    const nodeGroup = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, D3Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add node circles
    nodeGroup.append("circle")
      .attr("r", d => Math.max(15, d.impactScore / 5))
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("click", (event, d) => {
        setSelectedNode(d);
        onNodeSelect?.(d);
      })
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 4);
        showTooltip(event, d);
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-width", 2);
        hideTooltip();
      });

    // Add node labels
    nodeGroup.append("text")
      .text(d => d.name.length > 20 ? d.name.substring(0, 17) + "..." : d.name)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .style("pointer-events", "none");

    // Add impact score labels
    nodeGroup.append("text")
      .text(d => `${Math.round(d.impactScore)}%`)
      .attr("text-anchor", "middle")
      .attr("dy", "1.8em")
      .attr("font-size", "8px")
      .attr("fill", "#666")
      .style("pointer-events", "none");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as D3Node).x!)
        .attr("y1", d => (d.source as D3Node).y!)
        .attr("x2", d => (d.target as D3Node).x!)
        .attr("y2", d => (d.target as D3Node).y!);

      nodeGroup
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      setSimulationRunning(true);
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      setSimulationRunning(false);
    }

    // Tooltip functions
    function showTooltip(event: MouseEvent, d: D3Node) {
      const tooltip = d3.select("body").append("div")
        .attr("class", "cascade-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000");

      tooltip.html(`
        <strong>${d.name}</strong><br/>
        Type: ${d.type}<br/>
        Risk Level: ${d.riskLevel}<br/>
        Impact Score: ${Math.round(d.impactScore)}%<br/>
        Region: ${d.region}
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    }

    function hideTooltip() {
      d3.selectAll(".cascade-tooltip").remove();
    }
  };

  const getNodeColor = (node: NetworkNode): string => {
    const typeColors = {
      supplier: "#3B82F6",      // Blue
      manufacturer: "#10B981",   // Green
      distributor: "#F59E0B",    // Yellow
      retailer: "#EF4444"        // Red
    };

    const baseColor = typeColors[node.type] || "#6B7280";
    
    // Adjust opacity based on impact score
    const opacity = Math.max(0.3, node.impactScore / 100);
    return d3.color(baseColor)?.toString() || baseColor;
  };

  const getImpactTypeColor = (type: string): string => {
    const colors = {
      direct: "#EF4444",      // Red - immediate impact
      indirect: "#F59E0B",    // Orange - secondary impact
      cascading: "#6B7280"    // Gray - tertiary impact
    };
    return colors[type as keyof typeof colors] || "#6B7280";
  };

  const getNetworkHealthStatus = (): { status: string; color: string; description: string } => {
    if (networkImpactScore >= 80) {
      return {
        status: "CRITICAL",
        color: "text-red-600",
        description: "Severe network disruption requiring immediate action"
      };
    } else if (networkImpactScore >= 60) {
      return {
        status: "HIGH RISK",
        color: "text-orange-600",
        description: "Significant network impact with multiple affected nodes"
      };
    } else if (networkImpactScore >= 40) {
      return {
        status: "MODERATE",
        color: "text-yellow-600",
        description: "Moderate network impact with localized effects"
      };
    } else {
      return {
        status: "LOW RISK",
        color: "text-green-600",
        description: "Limited network impact with contained effects"
      };
    }
  };

  const healthStatus = getNetworkHealthStatus();

  return (
    <div className="space-y-6">
      {/* Network Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network Impact Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthStatus.color}`}>
              {networkImpactScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {healthStatus.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Affected Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affectedNodes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Nodes impacted by disruption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Propagation Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propagationPath.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Cascade propagation paths
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Supply Chain Network Impact
            {simulationRunning && (
              <span className="text-sm text-blue-600">Simulation Running...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden rounded-lg border">
            <svg ref={svgRef} className="w-full h-96" />
          </div>
          
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span>Supplier</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span>Manufacturer</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span>Distributor</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span>Retailer</span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-red-500" />
              <span>Direct Impact</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-orange-500" />
              <span>Indirect Impact</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-gray-500" />
              <span>Cascading Impact</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>Node Details: {selectedNode.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-lg font-semibold capitalize">{selectedNode.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Risk Level</p>
                <p className={`text-lg font-semibold capitalize ${getRiskLevelColor(selectedNode.riskLevel)}`}>
                  {selectedNode.riskLevel}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Impact Score</p>
                <p className="text-lg font-semibold">{Math.round(selectedNode.impactScore)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Region</p>
                <p className="text-lg font-semibold capitalize">{selectedNode.region}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Connected Nodes</p>
              <div className="space-y-1">
                {propagationPath
                  .filter(step => step.fromNode === selectedNode.id || step.toNode === selectedNode.id)
                  .map((step, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {step.fromNode === selectedNode.id ? '→' : '←'} {
                        step.fromNode === selectedNode.id 
                          ? affectedNodes.find(n => n.id === step.toNode)?.name 
                          : affectedNodes.find(n => n.id === step.fromNode)?.name
                      } ({step.propagationType}, {Math.round(step.impactMagnitude)}% impact)
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Health Description */}
      <Card>
        <CardHeader>
          <CardTitle>Network Health Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{healthStatus.description}</p>
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Recommended Actions:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {getRecommendedActions(networkImpactScore).map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getRecommendedActions(impactScore: number): string[] {
  if (impactScore >= 80) {
    return [
      "Activate emergency response protocols immediately",
      "Engage all backup suppliers and alternative routes",
      "Implement crisis communication plan with stakeholders",
      "Consider temporary production shutdown if necessary"
    ];
  } else if (impactScore >= 60) {
    return [
      "Activate secondary suppliers for affected nodes",
      "Increase inventory buffers at unaffected locations",
      "Monitor cascade progression closely",
      "Prepare contingency plans for further escalation"
    ];
  } else if (impactScore >= 40) {
    return [
      "Monitor affected nodes for further deterioration",
      "Prepare backup suppliers for potential activation",
      "Increase communication frequency with key partners",
      "Review and update risk mitigation strategies"
    ];
  } else {
    return [
      "Continue normal monitoring procedures",
      "Document lessons learned for future preparedness",
      "Review network resilience in affected areas",
      "Consider preventive measures for similar scenarios"
    ];
  }
}