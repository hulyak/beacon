'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Search,
  Target,
  Shield,
  Leaf,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Factory,
  Package,
  Truck,
  Store,
  Warehouse,
  MapPin,
  Globe,
  BarChart3,
  TrendingUp,
  X,
} from 'lucide-react';
import { useDigitalTwin, SupplyChainNodeData } from './DigitalTwinContext';
import { Node } from '@xyflow/react';

interface NodeResult {
  node: Node<SupplyChainNodeData>;
  impact?: string;
  financialImpact?: number;
  delayHours?: number;
}

interface AgentResult {
  type: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
  affectedNodes?: NodeResult[];
}

const scenarioTypes = [
  { value: 'port_closure', label: 'Port Closure' },
  { value: 'supplier_failure', label: 'Supplier Failure' },
  { value: 'demand_surge', label: 'Demand Surge' },
  { value: 'natural_disaster', label: 'Natural Disaster' },
  { value: 'cyber_attack', label: 'Cyber Attack' },
];

// Node type icons and emojis
const nodeTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; emoji: string; label: string }> = {
  supplier: { icon: Factory, emoji: '🏭', label: 'Supplier' },
  manufacturer: { icon: Factory, emoji: '⚙️', label: 'Manufacturer' },
  warehouse: { icon: Warehouse, emoji: '📦', label: 'Warehouse' },
  distributor: { icon: Truck, emoji: '🚚', label: 'Distributor' },
  retailer: { icon: Store, emoji: '🏪', label: 'Retailer' },
};

// Status badge colors
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  healthy: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function AIAgentControls() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState('port_closure');
  const [results, setResults] = useState<AgentResult[]>([]);

  const { nodes, edges, updateNode, startCascadeAnimation } = useDigitalTwin();

  const runInfoAgent = async () => {
    setActiveAgent('info');
    setResults([]);

    // Simulate scanning
    await new Promise((r) => setTimeout(r, 1500));

    // Analyze nodes for anomalies
    const anomalies: string[] = [];
    const criticalNodes = nodes.filter((n) => n.data?.status === 'critical');
    const warningNodes = nodes.filter((n) => n.data?.status === 'warning');
    const highRiskNodes = nodes.filter((n) => (n.data?.riskLevel || 0) > 60);
    const lowCapacityNodes = nodes.filter((n) => (n.data?.capacity || 100) < 30);
    const disruptedEdges = edges.filter((e) => e.data?.status === 'disrupted');

    // Collect all affected nodes
    const affectedNodesSet = new Set<string>();
    const affectedNodes: NodeResult[] = [];

    // Add critical and warning nodes
    [...criticalNodes, ...warningNodes, ...highRiskNodes].forEach((node) => {
      if (!affectedNodesSet.has(node.id)) {
        affectedNodesSet.add(node.id);
        affectedNodes.push({
          node,
          impact: node.data?.status === 'critical' ? 'Critical Status' :
                  node.data?.status === 'warning' ? 'Warning Status' :
                  (node.data?.riskLevel || 0) > 60 ? 'High Risk' : undefined,
        });
      }
    });

    if (criticalNodes.length > 0) {
      anomalies.push(`${criticalNodes.length} node(s) in critical status`);
    }
    if (warningNodes.length > 0) {
      anomalies.push(`${warningNodes.length} node(s) showing warnings`);
    }
    if (highRiskNodes.length > 0) {
      anomalies.push(`${highRiskNodes.length} node(s) with high risk levels`);
    }
    if (lowCapacityNodes.length > 0) {
      anomalies.push(`${lowCapacityNodes.length} node(s) near capacity limit`);
    }
    if (disruptedEdges.length > 0) {
      anomalies.push(`${disruptedEdges.length} connection(s) disrupted`);
    }

    setResults([
      {
        type: 'Info Agent',
        status: anomalies.length > 2 ? 'warning' : anomalies.length > 0 ? 'success' : 'success',
        message:
          anomalies.length > 0
            ? `Found ${anomalies.length} potential anomalies`
            : 'No anomalies detected - supply chain healthy',
        details: anomalies.length > 0 ? anomalies : ['All systems operating normally'],
        affectedNodes: affectedNodes.length > 0 ? affectedNodes : undefined,
      },
    ]);

    setActiveAgent(null);
  };

  const runScenarioAgent = async () => {
    setActiveAgent('scenario');
    setResults([]);

    // Simulate analysis
    await new Promise((r) => setTimeout(r, 2000));

    // Find a node to use as epicenter
    const epicenterNode = nodes.find((n) => n.data?.status !== 'healthy') || nodes[0];

    if (epicenterNode) {
      // Create cascade simulation
      const affectedNodesList = nodes.filter((n) => n.id !== epicenterNode.id).slice(0, 4);
      const cascadeSteps = affectedNodesList.map((n, i) => ({
          step: i + 1,
          nodeId: n.id,
          nodeName: n.data?.name || n.id,
          impactType: (i === 0 ? 'primary' : i < 2 ? 'secondary' : 'tertiary') as 'primary' | 'secondary' | 'tertiary',
          timestamp: (i + 1) * 500,
          financialImpact: Math.round(Math.random() * 500000 + 100000),
          delayHours: Math.round(Math.random() * 48 + 12),
          description: `${selectedScenario.replace('_', ' ')} impact on ${n.data?.name || n.id}`,
        }));

      startCascadeAnimation({
        epicenterNodeId: epicenterNode.id,
        steps: cascadeSteps,
        currentStep: 0,
        totalFinancialImpact: cascadeSteps.reduce((a, b) => a + b.financialImpact, 0),
        recoveryTimeHours: Math.round(Math.random() * 72 + 24),
      });

      const scenarioLabel = scenarioTypes.find((s) => s.value === selectedScenario)?.label || selectedScenario;

      // Build affected nodes with financial impact
      const affectedNodes: NodeResult[] = [
        { node: epicenterNode, impact: 'Epicenter', financialImpact: Math.round(Math.random() * 1000000 + 500000), delayHours: Math.round(Math.random() * 72 + 48) },
        ...affectedNodesList.map((n, i) => ({
          node: n,
          impact: cascadeSteps[i]?.impactType === 'primary' ? 'Primary Impact' :
                  cascadeSteps[i]?.impactType === 'secondary' ? 'Secondary Impact' : 'Tertiary Impact',
          financialImpact: cascadeSteps[i]?.financialImpact || 0,
          delayHours: cascadeSteps[i]?.delayHours || 0,
        })),
      ];

      setResults([
        {
          type: 'Scenario Agent',
          status: 'warning',
          message: `${scenarioLabel} simulation complete`,
          details: [
            `Epicenter: ${epicenterNode.data?.name || epicenterNode.id}`,
            `Affected nodes: ${cascadeSteps.length}`,
            `Estimated impact: $${(cascadeSteps.reduce((a, b) => a + b.financialImpact, 0) / 1000000).toFixed(2)}M`,
            `Recovery time: ${Math.round(Math.random() * 72 + 24)}h`,
          ],
          affectedNodes,
        },
      ]);
    }

    setActiveAgent(null);
  };

  const runStrategyAgent = async () => {
    setActiveAgent('strategy');
    setResults([]);

    await new Promise((r) => setTimeout(r, 1800));

    const strategies = [
      'Diversify supplier base across 2+ regions',
      'Increase safety stock levels by 15-20%',
      'Establish backup logistics routes',
      'Implement real-time monitoring alerts',
      'Create emergency response protocols',
    ];

    // Select 3 random strategies
    const selectedStrategies = strategies.sort(() => Math.random() - 0.5).slice(0, 3);

    setResults([
      {
        type: 'Strategy Agent',
        status: 'success',
        message: 'Generated mitigation strategies',
        details: selectedStrategies,
      },
    ]);

    setActiveAgent(null);
  };

  const runImpactAgent = async () => {
    setActiveAgent('impact');
    setResults([]);

    await new Promise((r) => setTimeout(r, 1600));

    const totalNodes = nodes.length;
    const healthyNodes = nodes.filter((n) => n.data?.status === 'healthy').length;
    const sustainabilityScore = Math.round((healthyNodes / totalNodes) * 100);
    const carbonFootprint = Math.round(Math.random() * 500 + 200);
    const wasteReduction = Math.round(Math.random() * 30 + 10);

    setResults([
      {
        type: 'Impact Agent',
        status: sustainabilityScore > 70 ? 'success' : 'warning',
        message: `ESG Impact Score: ${sustainabilityScore}/100`,
        details: [
          `Environmental: ${Math.round(sustainabilityScore * 0.9)}% compliant`,
          `Carbon footprint: ${carbonFootprint} tons CO2/year`,
          `Waste reduction potential: ${wasteReduction}%`,
          `Social responsibility index: ${Math.round(sustainabilityScore * 1.05)}/100`,
        ],
      },
    ]);

    setActiveAgent(null);
  };

  const agents = [
    {
      id: 'info',
      name: 'Info Agent',
      description: 'Scan supply chain for anomalies',
      icon: Search,
      color: 'blue',
      buttonText: 'Scan for Anomalies',
      buttonIcon: '🔍',
      action: runInfoAgent,
    },
    {
      id: 'scenario',
      name: 'Scenario Agent',
      description: 'Simulate disruption scenarios',
      icon: Target,
      color: 'purple',
      buttonText: 'Run Simulation',
      buttonIcon: '🎯',
      action: runScenarioAgent,
      hasDropdown: true,
    },
    {
      id: 'strategy',
      name: 'Strategy Agent',
      description: 'Generate mitigation strategies',
      icon: Shield,
      color: 'cyan',
      buttonText: 'Generate Mitigation Plan',
      buttonIcon: '🛡️',
      action: runStrategyAgent,
    },
    {
      id: 'impact',
      name: 'Impact Agent',
      description: 'Calculate ESG impact',
      icon: Leaf,
      color: 'green',
      buttonText: 'Calculate ESG Impact',
      buttonIcon: '🌱',
      action: runImpactAgent,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100' },
      cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', iconBg: 'bg-cyan-100' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconBg: 'bg-green-100' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header Row with Agents */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50">
        {/* Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-gray-900 font-semibold text-sm whitespace-nowrap">AI Agents</h3>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-indigo-200 flex-shrink-0" />

        {/* Agents Row */}
        <div className="flex items-center gap-3 flex-1 overflow-x-auto">
          {agents.map((agent) => {
            const colors = getColorClasses(agent.color);
            const isActive = activeAgent === agent.id;

            return (
              <div
                key={agent.id}
                className={`flex items-center gap-2 rounded-lg border ${colors.border} ${colors.bg} px-3 py-2 flex-shrink-0`}
              >
                <div className={`p-1.5 rounded ${colors.iconBg}`}>
                  <agent.icon className={`w-4 h-4 ${colors.text}`} />
                </div>

                <div className="flex items-center gap-2">
                  {/* Scenario Dropdown */}
                  {agent.hasDropdown && (
                    <select
                      value={selectedScenario}
                      onChange={(e) => setSelectedScenario(e.target.value)}
                      className="bg-white border border-purple-200 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    >
                      {scenarioTypes.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={agent.action}
                    disabled={isActive}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : `bg-white border ${colors.border} ${colors.text} hover:shadow-md`
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span>{agent.buttonIcon}</span>
                        {agent.buttonText}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results Panel - Full Width Below */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {results[0]?.status === 'success' ? (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                  )}
                  <div>
                    <h4 className={`font-semibold text-sm ${
                      results[0]?.status === 'success' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {results[0]?.message}
                    </h4>
                    <p className="text-xs text-gray-500">Supply Chain Network • Live Data</p>
                  </div>
                </div>
                <button
                  onClick={() => setResults([])}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Summary Stats */}
              {results[0]?.details && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {results[0].details.map((detail, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 bg-white rounded-lg text-xs text-gray-700 border border-gray-200 shadow-sm"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        results[0]?.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      {detail}
                    </span>
                  ))}
                </div>
              )}

              {/* Node Cards Grid */}
              {results[0]?.affectedNodes && results[0].affectedNodes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results[0].affectedNodes.map((nodeResult, idx) => {
                    const nodeType = nodeResult.node.type || 'supplier';
                    const typeConfig = nodeTypeConfig[nodeType] || nodeTypeConfig.supplier;
                    const status = nodeResult.node.data?.status || 'healthy';
                    const statusColors = statusConfig[status] || statusConfig.healthy;

                    return (
                      <motion.div
                        key={nodeResult.node.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{typeConfig.emoji}</span>
                              <div>
                                <h5 className="font-semibold text-gray-900 text-sm leading-tight">
                                  {nodeResult.node.data?.name || nodeResult.node.id}
                                </h5>
                                <p className="text-xs text-gray-500">{typeConfig.label}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`} />
                              {status}
                            </span>
                          </div>
                          {nodeResult.impact && (
                            <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                              {nodeResult.impact}
                            </span>
                          )}
                        </div>

                        {/* Card Body - Node Details */}
                        <div className="p-4 space-y-3">
                          {/* Location */}
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-600">{nodeResult.node.data?.location || 'Unknown'}</span>
                          </div>

                          {/* Region */}
                          <div className="flex items-center gap-2 text-xs">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-600 capitalize">{nodeResult.node.data?.region?.replace('_', ' ') || 'Global'}</span>
                          </div>

                          {/* Capacity & Utilization */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Capacity</p>
                              <p className="text-sm font-semibold text-gray-900">{nodeResult.node.data?.capacity || 0}%</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Utilization</p>
                              <p className="text-sm font-semibold text-gray-900">{nodeResult.node.data?.utilization || 0}%</p>
                            </div>
                          </div>

                          {/* Risk Level */}
                          {nodeResult.node.data?.riskLevel !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Risk Level</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      (nodeResult.node.data?.riskLevel || 0) > 60 ? 'bg-red-500' :
                                      (nodeResult.node.data?.riskLevel || 0) > 30 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${nodeResult.node.data?.riskLevel || 0}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700">{nodeResult.node.data?.riskLevel}%</span>
                              </div>
                            </div>
                          )}

                          {/* Financial Impact (for scenario results) */}
                          {nodeResult.financialImpact && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <span className="text-xs text-gray-500">Est. Impact</span>
                              <span className="text-xs font-semibold text-red-600">
                                ${(nodeResult.financialImpact / 1000).toFixed(0)}K
                              </span>
                            </div>
                          )}

                          {/* Delay (for scenario results) */}
                          {nodeResult.delayHours && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Est. Delay</span>
                              <span className="text-xs font-semibold text-orange-600">
                                {nodeResult.delayHours}h
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                          <button className="w-full text-xs font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                            View Details
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Status Legend */}
              {results[0]?.affectedNodes && results[0].affectedNodes.length > 0 && (
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  {['healthy', 'warning', 'critical'].map((status) => {
                    const colors = statusConfig[status];
                    return (
                      <div key={status} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                        <span className="text-xs text-gray-600 capitalize">{status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
