'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface TreeNode {
  name: string;
  value?: string;
  confidence?: number;
  agent?: string;
  description?: string;
  children?: TreeNode[];
}

interface DecisionTreeProps {
  data?: TreeNode;
  title?: string;
}

const defaultData: TreeNode = {
  name: 'Risk Assessment',
  confidence: 95,
  agent: 'Info Agent',
  description: 'Initial risk analysis for supply chain',
  children: [
    {
      name: 'High Risk Detected',
      value: 'Asia Region',
      confidence: 87,
      agent: 'Info Agent',
      description: 'Port congestion and delays identified',
      children: [
        {
          name: 'Scenario Analysis',
          value: 'Port Closure',
          confidence: 82,
          agent: 'Scenario Agent',
          description: 'Simulating impact of port closure',
          children: [
            {
              name: 'Strategy Generated',
              value: 'Reroute via Singapore',
              confidence: 78,
              agent: 'Strategy Agent',
              description: 'Alternative routing recommendation',
            },
            {
              name: 'Impact Calculated',
              value: '+8% Cost, -3 Days',
              confidence: 91,
              agent: 'Impact Agent',
              description: 'Cost-benefit analysis complete',
            },
          ],
        },
      ],
    },
    {
      name: 'Medium Risk',
      value: 'Europe Region',
      confidence: 72,
      agent: 'Info Agent',
      description: 'Weather disruptions possible',
      children: [
        {
          name: 'Monitoring',
          value: 'Active Watch',
          confidence: 88,
          agent: 'Info Agent',
          description: 'Continuous monitoring enabled',
        },
      ],
    },
    {
      name: 'Low Risk',
      value: 'North America',
      confidence: 94,
      agent: 'Info Agent',
      description: 'Normal operations',
    },
  ],
};

const agentColors: Record<string, string> = {
  'Info Agent': '#06b6d4',
  'Scenario Agent': '#a855f7',
  'Strategy Agent': '#f97316',
  'Impact Agent': '#22c55e',
};

export function DecisionTree({ data = defaultData, title = 'AI Decision Tree' }: DecisionTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    if (!svgRef.current) return;

    const container = svgRef.current.parentElement;
    if (container) {
      setDimensions({
        width: container.clientWidth,
        height: 500,
      });
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const margin = { top: 40, right: 120, bottom: 40, left: 120 };

    svg.selectAll('*').remove();

    // Create hierarchy
    const root = d3.hierarchy(data);

    // Create tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    const treeData = treeLayout(root);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create gradient for links
    const defs = svg.append('defs');

    const gradient = defs.append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('gradientUnits', 'userSpaceOnUse');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#a855f7');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Draw links
    const links = g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 2)
      .attr('d', d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('stroke-dasharray', function() {
        const length = (this as SVGPathElement).getTotalLength();
        return `${length} ${length}`;
      })
      .attr('stroke-dashoffset', function() {
        return (this as SVGPathElement).getTotalLength();
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('stroke-dashoffset', 0);

    // Draw nodes
    const nodes = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y}, ${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => setSelectedNode(d.data));

    // Node circles with confidence-based color
    nodes.append('circle')
      .attr('r', 0)
      .attr('fill', d => {
        const confidence = d.data.confidence || 0;
        if (confidence >= 80) return '#22c55e';
        if (confidence >= 60) return '#3b82f6';
        if (confidence >= 40) return '#f97316';
        return '#ef4444';
      })
      .attr('stroke', d => agentColors[d.data.agent || 'Info Agent'])
      .attr('stroke-width', 3)
      .attr('filter', 'url(#glow)')
      .transition()
      .duration(500)
      .delay((d, i) => i * 100)
      .attr('r', 12);

    // Node labels
    nodes.append('text')
      .attr('dy', -20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#374151')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text(d => d.data.name)
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 300)
      .style('opacity', 1);

    // Value labels
    nodes.filter(d => !!d.data.value)
      .append('text')
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .text(d => d.data.value || '')
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 400)
      .style('opacity', 1);

    // Confidence badges
    nodes.append('text')
      .attr('dx', 18)
      .attr('dy', 4)
      .attr('fill', d => {
        const confidence = d.data.confidence || 0;
        if (confidence >= 80) return '#22c55e';
        if (confidence >= 60) return '#3b82f6';
        if (confidence >= 40) return '#f97316';
        return '#ef4444';
      })
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .text(d => `${d.data.confidence}%`)
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 500)
      .style('opacity', 1);

  }, [data, dimensions]);

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">{title}</h3>
            <p className="text-gray-500 text-sm">AI reasoning visualization</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-4">
            {Object.entries(agentColors).map(([agent, color]) => (
              <div key={agent} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-500">{agent.replace(' Agent', '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />

        {/* Confidence Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg p-3 border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 mb-2">Confidence Level</div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">≥80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">60-79%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-600">40-59%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">&lt;40%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${agentColors[selectedNode.agent || 'Info Agent']}20` }}
              >
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h4 className="text-gray-900 font-medium">{selectedNode.name}</h4>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${agentColors[selectedNode.agent || 'Info Agent']}20`,
                    color: agentColors[selectedNode.agent || 'Info Agent'],
                  }}
                >
                  {selectedNode.agent}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{selectedNode.confidence}%</div>
              <div className="text-xs text-gray-500">Confidence</div>
            </div>
          </div>
          {selectedNode.value && (
            <p className="text-cyan-600 text-sm mb-2">Value: {selectedNode.value}</p>
          )}
          {selectedNode.description && (
            <p className="text-gray-600 text-sm">{selectedNode.description}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
