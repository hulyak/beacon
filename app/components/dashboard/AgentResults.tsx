'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AgentResult {
  id: string;
  agentType: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
  data?: {
    summary?: string;
    risks?: Array<{
      title: string;
      severity: string;
      probability: number;
      impact: number;
    }>;
    alerts?: Array<{
      title: string;
      priority: string;
      message: string;
    }>;
    scenario?: {
      type: string;
      outcomes: Array<{
        metric: string;
        currentValue: number;
        projectedValue: number;
        change: number;
      }>;
      recommendations: string[];
    };
    aiInsight?: string;
  };
  error?: string;
}

interface AgentResultsProps {
  results: AgentResult[];
  onClear?: () => void;
}

const agentIcons: Record<string, string> = {
  analyze_risks: '🔍',
  run_scenario: '🎯',
  get_alerts: '🚨',
  generate_strategy: '💡',
};

const agentColors: Record<string, string> = {
  analyze_risks: 'cyan',
  run_scenario: 'emerald',
  get_alerts: 'orange',
  generate_strategy: 'green',
};

export function AgentResults({ results, onClear }: AgentResultsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-gray-900 font-medium mb-1">No Results Yet</h3>
          <p className="text-gray-500 text-sm">
            Trigger an agent or use voice commands to see results here
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">Agent Results</h3>
            <p className="text-gray-500 text-sm">AI-powered insights from Gemini 2.5</p>
          </div>
        </div>
        {onClear && results.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-lg overflow-hidden ${
                result.status === 'error'
                  ? 'border-red-300 bg-red-50'
                  : result.status === 'pending'
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Result Header */}
              <button
                onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{agentIcons[result.agentType] || '🤖'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium capitalize">
                        {result.agentType.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-600'
                          : result.status === 'error'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedId === result.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedId === result.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-4 space-y-4 bg-white">
                      {/* Error Message */}
                      {result.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-sm">{result.error}</p>
                        </div>
                      )}

                      {/* AI Insight */}
                      {result.data?.aiInsight && (
                        <div className="p-3 bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-cyan-600">Gemini 2.5 Insight</span>
                          </div>
                          <p className="text-gray-800 text-sm">{result.data.aiInsight}</p>
                        </div>
                      )}

                      {/* Summary */}
                      {result.data?.summary && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Summary</h4>
                          <p className="text-gray-800 text-sm">{result.data.summary}</p>
                        </div>
                      )}

                      {/* Risks */}
                      {result.data?.risks && result.data.risks.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Top Risks</h4>
                          <div className="space-y-2">
                            {result.data.risks.slice(0, 3).map((risk, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    risk.severity === 'critical' ? 'bg-red-500' :
                                    risk.severity === 'high' ? 'bg-orange-500' :
                                    risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`} />
                                  <span className="text-gray-800 text-sm">{risk.title}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {risk.probability}% likely
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alerts */}
                      {result.data?.alerts && result.data.alerts.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Alerts</h4>
                          <div className="space-y-2">
                            {result.data.alerts.slice(0, 3).map((alert, i) => (
                              <div
                                key={i}
                                className="p-2 bg-gray-50 rounded border border-gray-100"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    alert.priority === 'critical' ? 'bg-red-100 text-red-600' :
                                    alert.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {alert.priority}
                                  </span>
                                  <span className="text-gray-800 text-sm font-medium">{alert.title}</span>
                                </div>
                                <p className="text-gray-500 text-xs">{alert.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scenario Outcomes */}
                      {result.data?.scenario && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Scenario Impact</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {result.data.scenario.outcomes.slice(0, 4).map((outcome, i) => (
                              <div key={i} className="p-2 bg-gray-50 rounded border border-gray-100">
                                <div className="text-xs text-gray-500">{outcome.metric}</div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-gray-900 font-medium">{outcome.projectedValue}</span>
                                  <span className={`text-xs ${
                                    outcome.change > 0 ? 'text-red-500' : 'text-green-500'
                                  }`}>
                                    {outcome.change > 0 ? '+' : ''}{outcome.change.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {result.data.scenario.recommendations.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-xs font-medium text-gray-500 mb-1">Recommendations</h5>
                              <ul className="space-y-1">
                                {result.data.scenario.recommendations.slice(0, 2).map((rec, i) => (
                                  <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-green-500">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
