'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDigitalTwin } from './DigitalTwinContext';
import {
  calculateCascade,
  getCascadeSummary,
  getCascadeRecommendations,
  CascadeResult,
} from '@/lib/cascade-calculator';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  DollarSign,
  Clock,
  Target,
  ChevronRight,
} from 'lucide-react';

interface CascadeAnimatorProps {
  className?: string;
}

export default function CascadeAnimator({ className = '' }: CascadeAnimatorProps) {
  const {
    nodes,
    edges,
    selectedNodeId,
    isAnimating,
    startCascadeAnimation,
    stopCascadeAnimation,
    resetCascade,
    updateNode,
  } = useDigitalTwin();

  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(null);
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'severe' | 'catastrophic'>('moderate');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // Calculate cascade when severity changes or node is selected
  const runCascadeCalculation = useCallback(() => {
    if (!selectedNodeId) return;

    const result = calculateCascade(selectedNodeId, nodes, edges, severity);
    setCascadeResult(result);
    setCurrentStepIndex(-1);
  }, [selectedNodeId, nodes, edges, severity]);

  // Start the cascade animation
  const handleStartCascade = useCallback(() => {
    if (!cascadeResult) return;

    // Apply cascade effects to nodes progressively
    cascadeResult.steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStepIndex(index);

        // Update the affected node with cascade data
        updateNode(step.nodeId, {
          cascadeActive: true,
          cascadeImpact: step.impactType,
          financialImpact: step.financialImpact,
          status: step.impactType === 'primary' ? 'critical' : step.impactType === 'secondary' ? 'warning' : 'warning',
        });
      }, step.timestamp);
    });

    startCascadeAnimation({
      epicenterNodeId: cascadeResult.epicenterNodeId,
      steps: cascadeResult.steps,
      currentStep: 0,
      totalFinancialImpact: cascadeResult.totalFinancialImpact,
      recoveryTimeHours: cascadeResult.recoveryTimeHours,
    });
  }, [cascadeResult, startCascadeAnimation, updateNode]);

  // Reset everything
  const handleReset = useCallback(() => {
    resetCascade();
    setCascadeResult(null);
    setCurrentStepIndex(-1);

    // Reset all node states
    nodes.forEach((node) => {
      updateNode(node.id, {
        cascadeActive: false,
        cascadeImpact: undefined,
        financialImpact: undefined,
        status: 'healthy',
      });
    });
  }, [resetCascade, nodes, updateNode]);

  // Calculate on node selection change
  useEffect(() => {
    if (selectedNodeId) {
      runCascadeCalculation();
    }
  }, [selectedNodeId, runCascadeCalculation]);

  if (!selectedNodeId) {
    return (
      <div className={`bg-gray-800/95 backdrop-blur rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-400">
          <Target className="w-5 h-5" />
          <span>Select a node to simulate cascade impact</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/95 backdrop-blur rounded-lg shadow-xl border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Cascade Simulator
        </h3>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          {/* Severity selector */}
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1.5">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as typeof severity)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
            >
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
              <option value="catastrophic">Catastrophic</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-5">
            {!isAnimating ? (
              <button
                onClick={handleStartCascade}
                disabled={!cascadeResult}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                <Play className="w-4 h-4" />
                Simulate
              </button>
            ) : (
              <button
                onClick={stopCascadeAnimation}
                className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Impact summary */}
        {cascadeResult && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-700/50 rounded p-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <Target className="w-3 h-3" />
                Affected Nodes
              </div>
              <div className="text-xl font-bold text-white">{cascadeResult.affectedNodeCount}</div>
            </div>
            <div className="bg-gray-700/50 rounded p-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <DollarSign className="w-3 h-3" />
                Total Impact
              </div>
              <div className="text-xl font-bold text-red-400">
                ${(cascadeResult.totalFinancialImpact / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="bg-gray-700/50 rounded p-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <Clock className="w-3 h-3" />
                Recovery Time
              </div>
              <div className="text-xl font-bold text-yellow-400">
                {Math.ceil(cascadeResult.recoveryTimeHours / 24)}d
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cascade steps timeline */}
      {cascadeResult && cascadeResult.steps.length > 0 && (
        <div className="p-4 max-h-[300px] overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Cascade Timeline</h4>
          <div className="space-y-2">
            {cascadeResult.steps.map((step, index) => (
              <div
                key={step.nodeId}
                className={`
                  flex items-start gap-3 p-2 rounded transition-all duration-300
                  ${
                    currentStepIndex >= index
                      ? step.impactType === 'primary'
                        ? 'bg-red-900/50 border-l-4 border-red-500'
                        : step.impactType === 'secondary'
                        ? 'bg-orange-900/50 border-l-4 border-orange-500'
                        : 'bg-yellow-900/50 border-l-4 border-yellow-500'
                      : 'bg-gray-700/30'
                  }
                `}
              >
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${
                      currentStepIndex >= index
                        ? step.impactType === 'primary'
                          ? 'bg-red-500 text-white'
                          : step.impactType === 'secondary'
                          ? 'bg-orange-500 text-white'
                          : 'bg-yellow-500 text-black'
                        : 'bg-gray-600 text-gray-400'
                    }
                  `}
                >
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{step.nodeName}</span>
                    <span
                      className={`
                        text-[10px] px-1.5 py-0.5 rounded uppercase
                        ${
                          step.impactType === 'primary'
                            ? 'bg-red-600 text-white'
                            : step.impactType === 'secondary'
                            ? 'bg-orange-600 text-white'
                            : 'bg-yellow-600 text-black'
                        }
                      `}
                    >
                      {step.impactType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-red-400">
                      -${(step.financialImpact / 1000).toFixed(0)}K
                    </span>
                    <span className="text-yellow-400">+{step.delayHours}h delay</span>
                  </div>
                </div>
                {currentStepIndex === index && (
                  <ChevronRight className="w-4 h-4 text-white animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {cascadeResult && (
        <div className="p-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h4>
          <ul className="space-y-1.5">
            {getCascadeRecommendations(cascadeResult).map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-blue-400 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
