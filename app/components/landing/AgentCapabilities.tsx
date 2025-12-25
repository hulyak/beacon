'use client';

import { motion } from 'framer-motion';
import { Radio, Target, Shield, Leaf, Zap, Cpu, BarChart3, GitBranch } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  capabilities: { name: string; icon: string }[];
  voiceCommand: string;
}

const agents: Agent[] = [
  {
    id: 'info',
    name: 'Info Agent',
    role: 'Real-time Monitoring',
    description: 'Continuously monitors supply chain sensors, IoT devices, and external data sources for anomalies and disruptions.',
    color: '#0891b2',
    bgColor: 'from-cyan-500 to-blue-500',
    icon: <Radio className="w-8 h-8" />,
    capabilities: [
      { name: 'IoT Integration', icon: '📡' },
      { name: 'Anomaly Detection', icon: '🔍' },
      { name: 'Real-time Alerts', icon: '⚡' },
    ],
    voiceCommand: '"Scan for anomalies"',
  },
  {
    id: 'scenario',
    name: 'Scenario Agent',
    role: 'What-If Simulations',
    description: 'Generates and runs Monte Carlo simulations to predict disruption impacts across thousands of scenarios in seconds.',
    color: '#8b5cf6',
    bgColor: 'from-violet-500 to-purple-500',
    icon: <Target className="w-8 h-8" />,
    capabilities: [
      { name: 'Monte Carlo Sims', icon: '🎲' },
      { name: 'Risk Forecasting', icon: '📈' },
      { name: 'Impact Analysis', icon: '💥' },
    ],
    voiceCommand: '"Run port closure scenario"',
  },
  {
    id: 'strategy',
    name: 'Strategy Agent',
    role: 'Autonomous Planning',
    description: 'Negotiates with other agents to generate optimal mitigation strategies balancing cost, risk, and sustainability.',
    color: '#ea580c',
    bgColor: 'from-orange-500 to-red-500',
    icon: <Shield className="w-8 h-8" />,
    capabilities: [
      { name: 'Multi-Agent Negotiation', icon: '🤝' },
      { name: 'Strategy Optimization', icon: '⚙️' },
      { name: 'Decision Trees', icon: '🌳' },
    ],
    voiceCommand: '"Generate mitigation strategies"',
  },
  {
    id: 'impact',
    name: 'Impact Agent',
    role: 'Sustainability & Cost',
    description: 'Calculates carbon footprint, environmental impact, and financial implications for every supply chain decision.',
    color: '#16a34a',
    bgColor: 'from-green-500 to-emerald-500',
    icon: <Leaf className="w-8 h-8" />,
    capabilities: [
      { name: 'Carbon Tracking', icon: '🌱' },
      { name: 'Cost Analysis', icon: '💰' },
      { name: 'ESG Compliance', icon: '✅' },
    ],
    voiceCommand: '"Calculate carbon footprint"',
  },
];

export function AgentCapabilities() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 border border-purple-200 rounded-full text-purple-700 text-sm font-medium mb-4">
            <Cpu className="w-4 h-4" />
            Agentic AI Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              Agentic AI
            </span>{' '}
            Capabilities
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Four specialized agents collaborate autonomously to protect your supply chain
          </p>
        </motion.div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
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
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.bgColor} flex items-center justify-center text-white mb-4 shadow-lg`}
                style={{ boxShadow: `0 8px 32px ${agent.color}30` }}
              >
                {agent.icon}
              </div>

              {/* Name & Role */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">{agent.name}</h3>
              <p className="text-sm font-medium mb-3" style={{ color: agent.color }}>{agent.role}</p>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{agent.description}</p>

              {/* Capability Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {agent.capabilities.map((capability, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700 font-medium"
                  >
                    <span>{capability.icon}</span>
                    {capability.name}
                  </span>
                ))}
              </div>

              {/* Voice Command Example */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Try saying:</p>
                <p className="text-sm text-cyan-600 font-medium">{agent.voiceCommand}</p>
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
