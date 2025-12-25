'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Play, X, BarChart3, TrendingUp, Target, Loader2 } from 'lucide-react';
import { useDigitalTwin } from './DigitalTwinContext';

interface SimulationResult {
  nodeId: string;
  nodeName: string;
  baseRisk: number;
  simulatedRisks: number[];
  mean: number;
  stdDev: number;
  p10: number;
  p50: number;
  p90: number;
  maxRisk: number;
}

interface MonteCarloPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Box-Muller transform for generating normal distribution
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// Calculate percentile
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}

export default function MonteCarloPanel({ isOpen, onClose }: MonteCarloPanelProps) {
  const { nodes, edges, updateNode } = useDigitalTwin();
  const [isRunning, setIsRunning] = useState(false);
  const [iterations, setIterations] = useState(1000);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [progress, setProgress] = useState(0);

  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    const simulationResults: SimulationResult[] = [];

    // Simulate for each node
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const node = nodes[nodeIndex];
      const baseRisk = node.data?.riskLevel || 0;
      const simulatedRisks: number[] = [];

      // Find connected edges
      const connectedEdges = edges.filter(
        (e) => e.source === node.id || e.target === node.id
      );

      // Calculate edge risk factor (disrupted edges increase risk)
      const edgeRiskFactor = connectedEdges.reduce((acc, edge) => {
        if (edge.data?.status === 'disrupted') return acc + 0.3;
        if (edge.data?.status === 'delayed') return acc + 0.15;
        return acc;
      }, 0);

      // Run iterations
      for (let i = 0; i < iterations; i++) {
        // Base risk with some variance
        let risk = randomNormal(baseRisk, baseRisk * 0.2);

        // Add edge risk factor
        risk += edgeRiskFactor * randomNormal(20, 5);

        // Add random external factors
        if (Math.random() < 0.1) {
          risk += randomNormal(15, 5); // 10% chance of external disruption
        }

        // Clamp to 0-100
        risk = Math.max(0, Math.min(100, risk));
        simulatedRisks.push(risk);
      }

      // Calculate statistics
      const mean = simulatedRisks.reduce((a, b) => a + b, 0) / simulatedRisks.length;
      const variance = simulatedRisks.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / simulatedRisks.length;
      const stdDev = Math.sqrt(variance);

      simulationResults.push({
        nodeId: node.id,
        nodeName: node.data?.name || node.id,
        baseRisk,
        simulatedRisks,
        mean,
        stdDev,
        p10: percentile(simulatedRisks, 10),
        p50: percentile(simulatedRisks, 50),
        p90: percentile(simulatedRisks, 90),
        maxRisk: Math.max(...simulatedRisks),
      });

      // Update progress
      setProgress(((nodeIndex + 1) / nodes.length) * 100);

      // Small delay for visual effect
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    setResults(simulationResults);
    setIsRunning(false);

    // Update nodes with P90 risk levels
    simulationResults.forEach((result) => {
      const newStatus = result.p90 > 70 ? 'critical' : result.p90 > 40 ? 'warning' : 'healthy';
      updateNode(result.nodeId, {
        riskLevel: Math.round(result.p90),
        status: newStatus as 'healthy' | 'warning' | 'critical',
      });
    });
  }, [nodes, edges, iterations, updateNode]);

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-600 bg-red-50';
    if (risk >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold">Monte Carlo Simulation</h3>
                <p className="text-gray-500 text-xs">Network risk analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Configuration */}
          <div className="p-4 border-b border-gray-100">
            <label className="block text-sm text-gray-600 mb-2">
              Iterations: {iterations.toLocaleString()}
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              disabled={isRunning}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>100</span>
              <span>5,000</span>
              <span>10,000</span>
            </div>

            <button
              onClick={runSimulation}
              disabled={isRunning || nodes.length === 0}
              className={`w-full mt-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                isRunning || nodes.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Simulation
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isRunning && (
              <div className="mt-3">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Run simulation to see results</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results
                  .sort((a, b) => b.p90 - a.p90)
                  .map((result) => (
                    <motion.div
                      key={result.nodeId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {result.nodeName}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getRiskColor(result.p90)}`}>
                          P90: {result.p90.toFixed(1)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-blue-500" />
                          <span className="text-gray-500">Mean:</span>
                          <span className="font-medium text-gray-700">{result.mean.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-yellow-500" />
                          <span className="text-gray-500">P10:</span>
                          <span className="font-medium text-gray-700">{result.p10.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-red-500" />
                          <span className="text-gray-500">Max:</span>
                          <span className="font-medium text-gray-700">{result.maxRisk.toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Mini distribution bar */}
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-400 h-full"
                          style={{ width: `${result.p10}%` }}
                        />
                        <div
                          className="bg-yellow-400 h-full"
                          style={{ width: `${result.p50 - result.p10}%` }}
                        />
                        <div
                          className="bg-red-400 h-full"
                          style={{ width: `${result.p90 - result.p50}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {results.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h4 className="text-xs font-medium text-gray-500 mb-2">SIMULATION SUMMARY</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <div className="text-xs text-gray-500">Avg P90 Risk</div>
                  <div className="text-lg font-bold text-gray-900">
                    {(results.reduce((a, b) => a + b.p90, 0) / results.length).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <div className="text-xs text-gray-500">High Risk Nodes</div>
                  <div className="text-lg font-bold text-red-600">
                    {results.filter((r) => r.p90 > 70).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
