'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AgentControlsProps {
  onAgentTrigger: (agentType: string, params?: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
}

const agents = [
  {
    id: 'analyze_risks',
    name: 'Risk Analysis',
    description: 'Analyze supply chain risks by region',
    icon: '🔍',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    params: ['region'],
  },
  {
    id: 'run_scenario',
    name: 'Scenario Simulation',
    description: 'Run what-if disruption scenarios',
    icon: '🎯',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    params: ['scenarioType', 'region'],
  },
  {
    id: 'get_alerts',
    name: 'Alert Monitor',
    description: 'Get current supply chain alerts',
    icon: '🚨',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    params: ['priority'],
  },
  {
    id: 'generate_strategy',
    name: 'Strategy Generator',
    description: 'Generate mitigation strategies',
    icon: '💡',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    params: [],
  },
];

const regions = ['asia', 'europe', 'north_america', 'south_america', 'global'];
const scenarioTypes = ['supplier_failure', 'port_closure', 'demand_surge', 'natural_disaster'];
const priorities = ['all', 'critical', 'high', 'medium', 'low'];

export function AgentControls({ onAgentTrigger, isLoading = false }: AgentControlsProps) {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('asia');
  const [selectedScenario, setSelectedScenario] = useState('port_closure');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const handleAgentClick = async (agentId: string) => {
    setActiveAgent(agentId);

    let params: Record<string, string> = {};

    switch (agentId) {
      case 'analyze_risks':
      case 'generate_strategy':
        params = { region: selectedRegion };
        break;
      case 'run_scenario':
        params = { scenarioType: selectedScenario, region: selectedRegion };
        break;
      case 'get_alerts':
        params = { priority: selectedPriority };
        break;
      default:
        params = {};
    }

    try {
      await onAgentTrigger(agentId, params);
    } finally {
      setActiveAgent(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-100 rounded-lg">
          <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-gray-900 font-semibold">Agent Controls</h3>
          <p className="text-gray-500 text-sm">Trigger AI agents manually</p>
        </div>
      </div>

      {/* Parameter Selectors */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {regions.map(region => (
              <option key={region} value={region}>
                {region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {scenarioTypes.map(scenario => (
              <option key={scenario} value={scenario}>
                {scenario.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-20 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Agent Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {agents.map((agent) => {
          const isActive = activeAgent === agent.id;

          return (
            <motion.button
              key={agent.id}
              onClick={() => handleAgentClick(agent.id)}
              disabled={isLoading || isActive}
              whileTap={{ scale: 0.98 }}
              className={`relative p-2.5 rounded-lg border transition-all text-left ${
                isActive
                  ? `bg-gradient-to-r ${agent.gradient} border-transparent`
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg flex-shrink-0">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium block truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {agent.name}
                  </span>
                </div>
                {isActive && (
                  <svg className="w-3 h-3 text-white animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Voice Hint */}
      <p className="mt-3 text-xs text-gray-500 text-center">
        Say: &quot;Analyze risks in {selectedRegion.replace('_', ' ')}&quot;
      </p>
    </motion.div>
  );
}
