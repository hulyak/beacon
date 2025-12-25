'use client';

import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Network, Cpu, Activity, CheckCircle } from 'lucide-react';
import { DigitalTwinProvider } from '../components/digital-twin/DigitalTwinContext';
import ReactFlowCanvas from '../components/digital-twin/ReactFlowCanvas';
import ConfigurationPanel, { type SupplyChainConfig } from '../components/digital-twin/ConfigurationPanel';
import AIAgentControls from '../components/digital-twin/AIAgentControls';
import { VoiceDashboardProvider } from '@/lib/voice-dashboard-context';
import { MemoryProvider } from '@/lib/memory-context';

export default function DigitalTwinPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [configApplied, setConfigApplied] = useState(false);
  const [appliedConfig, setAppliedConfig] = useState<SupplyChainConfig | null>(null);

  const handleConfigApply = useCallback((config: SupplyChainConfig) => {
    console.log('Configuration applied:', config);
    setAppliedConfig(config);
    setConfigApplied(true);
    // Reset the notification after 3 seconds
    setTimeout(() => setConfigApplied(false), 3000);
  }, []);

  return (
    <MemoryProvider>
      <VoiceDashboardProvider>
        <ReactFlowProvider>
          <DigitalTwinProvider>
          <div className="min-h-screen bg-gray-50 py-6 px-4 lg:px-6">
            <div className="max-w-[1800px] mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <Network className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        Digital Twin
                      </span>{' '}
                      Supply Chain
                    </h1>
                    <p className="text-gray-600 text-sm lg:text-base">
                      Monitor your supply chain and interact with AI agents in real-time
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-3 mt-4">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Monitoring
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                    <Cpu className="w-3 h-3" />
                    AI Agents Ready
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                    <Activity className="w-3 h-3" />
                    Monte Carlo Enabled
                  </span>
                  {/* Applied Config Badge */}
                  {appliedConfig && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-medium border border-cyan-200">
                      {appliedConfig.region} • {appliedConfig.industry}
                    </span>
                  )}
                </div>

                {/* Configuration Applied Toast */}
                {configApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Configuration Applied Successfully!</span>
                  </motion.div>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Configuration & Controls */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Configuration Panel */}
                  <ConfigurationPanel onApply={handleConfigApply} />
                </div>

                {/* Main Canvas Area */}
                <div className="lg:col-span-3 space-y-4">
                  {/* AI Agent Controls - Full Width Horizontal */}
                  <AIAgentControls />

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Canvas Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <Network className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-semibold text-sm">
                            Supply Chain Network
                          </h3>
                          <p className="text-gray-500 text-xs">
                            Interactive visualization • Drag to pan, scroll to zoom
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {['Real-time', 'Interactive', 'AI-Powered'].map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-medium border border-cyan-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Canvas */}
                    <div className="h-[700px]">
                      <ReactFlowCanvas
                        onNodeSelect={setSelectedNode}
                        className="bg-gray-900"
                      />
                    </div>
                  </motion.div>

                  {/* Instructions */}
                  <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Add Node', shortcut: 'Click + button' },
                        { label: 'Connect Nodes', shortcut: 'Drag from handle' },
                        { label: 'Edit Node', shortcut: 'Click on node' },
                        { label: 'Delete', shortcut: 'Select + Trash icon' },
                        { label: 'Auto Layout', shortcut: 'Grid icon' },
                        { label: 'Monte Carlo', shortcut: 'Activity icon' },
                        { label: 'Export JSON', shortcut: 'Download icon' },
                        { label: 'Import JSON', shortcut: 'File icon' },
                      ].map((action) => (
                        <div
                          key={action.label}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <span className="text-xs text-gray-700 font-medium">
                            {action.label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {action.shortcut}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Voice Command Hints */}
                </div>
              </div>
            </div>
          </div>
          </DigitalTwinProvider>
        </ReactFlowProvider>
      </VoiceDashboardProvider>
    </MemoryProvider>
  );
}
