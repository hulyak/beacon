'use client';

import { motion } from 'framer-motion';
import { Search, GitBranch, Lightbulb, Bell, Zap } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  capabilities: string[];
  voiceCommand: string;
}

const agents: Agent[] = [
  {
    id: 'risk',
    name: 'Risk Analysis',
    role: 'Real-time Monitoring',
    color: '#0891b2',
    bgColor: 'from-cyan-500 to-blue-500',
    icon: <Search className="w-8 h-8" />,
    capabilities: ['Regional risk detection', 'Probability assessment', 'Impact analysis'],
    voiceCommand: '"Analyze risks in Asia"',
  },
  {
    id: 'scenario',
    name: 'Scenario Simulation',
    role: 'What-If Analysis',
    color: '#059669',
    bgColor: 'from-emerald-500 to-teal-500',
    icon: <GitBranch className="w-8 h-8" />,
    capabilities: ['Disruption modeling', 'Outcome forecasting', 'Recovery planning'],
    voiceCommand: '"Run supplier failure scenario"',
  },
  {
    id: 'strategy',
    name: 'Strategy Planning',
    role: 'Mitigation Strategies',
    color: '#ea580c',
    bgColor: 'from-orange-500 to-red-500',
    icon: <Lightbulb className="w-8 h-8" />,
    capabilities: ['Route optimization', 'Supplier alternatives', 'Cost-benefit analysis'],
    voiceCommand: '"Suggest mitigation strategies"',
  },
  {
    id: 'alert',
    name: 'Alert Monitoring',
    role: 'Real-time Alerts',
    color: '#16a34a',
    bgColor: 'from-green-500 to-emerald-500',
    icon: <Bell className="w-8 h-8" />,
    capabilities: ['Priority filtering', 'Instant notifications', 'Action tracking'],
    voiceCommand: '"Show critical alerts"',
  },
];

export function AgentCapabilities() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Voice-Activated
            </span>{' '}
            AI Agents
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Four specialized AI agents work together to analyze, simulate, plan, and monitor your supply chain
          </p>
        </motion.div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              {/* Glow effect on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at center, ${agent.color}, transparent 70%)`,
                }}
              />

              {/* Active indicator */}
              <div
                className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: agent.color }}
              />

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${agent.bgColor} flex items-center justify-center text-white mb-4 shadow-lg`}
                style={{ boxShadow: `0 8px 32px ${agent.color}30` }}
              >
                {agent.icon}
              </div>

              {/* Name & Role */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">{agent.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{agent.role}</p>

              {/* Capabilities */}
              <ul className="space-y-2 mb-6">
                {agent.capabilities.map((capability, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: agent.color }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {capability}
                  </li>
                ))}
              </ul>

              {/* Voice Command Example */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 mb-1">Voice Command:</p>
                <p className="text-sm text-cyan-600 font-mono">{agent.voiceCommand}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Collaboration Badge */}
        <motion.div
          className="mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200 rounded-full">
            <Zap className="w-5 h-5 text-cyan-600" />
            <span className="text-cyan-700 font-medium">
              Agents collaborate in real-time to resolve disruptions
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default AgentCapabilities;
