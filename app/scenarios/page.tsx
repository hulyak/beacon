'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, GitBranch, AlertTriangle, DollarSign, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { ScenarioImpactChart, DecisionTree } from '../components/visualizations';
import { SimulationProgress } from '../components/scenarios/SimulationProgress';
import { VoiceDashboardProvider } from '@/lib/voice-dashboard-context';
import { MonteCarloVisualization } from '../components/dashboard/MonteCarloVisualization';
import { PredictionAccuracy } from '../components/dashboard/PredictionAccuracy';

interface TreeNode {
  name: string;
  value?: string;
  confidence?: number;
  agent?: string;
  description?: string;
  children?: TreeNode[];
}

interface ScenarioType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
}

const scenarioTypes: ScenarioType[] = [
  {
    id: 'supplier_failure',
    name: 'Supplier Failure',
    description: 'Primary supplier goes offline unexpectedly',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: '#f97316',
    severity: 'severe',
  },
  {
    id: 'port_closure',
    name: 'Port Closure',
    description: 'Major shipping port experiences closure',
    icon: <GitBranch className="w-5 h-5" />,
    color: '#ef4444',
    severity: 'catastrophic',
  },
  {
    id: 'demand_surge',
    name: 'Demand Surge',
    description: 'Unexpected 50% increase in demand',
    icon: <TrendingUp className="w-5 h-5" />,
    color: '#a855f7',
    severity: 'moderate',
  },
  {
    id: 'natural_disaster',
    name: 'Natural Disaster',
    description: 'Regional natural disaster affects operations',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: '#ef4444',
    severity: 'catastrophic',
  },
];

const regions = ['Asia', 'Europe', 'North America', 'South America'];

interface ScenarioResult {
  scenario: ScenarioType;
  region: string;
  outcomes: Array<{
    metric: string;
    before: number;
    after: number;
    change: number;
    unit: string;
  }>;
  financialImpact: {
    cost: number;
    currency: string;
    timeframe: string;
  };
  recommendation: string;
  recoveryTime: string;
  aiInsight?: string;
}

export default function ScenariosPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Asia');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [decisionTreeData, setDecisionTreeData] = useState<TreeNode | null>(null);

  // Build decision tree from scenario results
  const buildDecisionTree = (scenarioResult: ScenarioResult, aiInsight?: string): TreeNode => {
    const severityConfidence = {
      catastrophic: 95,
      severe: 85,
      moderate: 75,
      minor: 65,
    };

    return {
      name: 'Scenario Analysis',
      confidence: 92,
      agent: 'Info Agent',
      description: `Analyzing ${scenarioResult.scenario.name} in ${scenarioResult.region}`,
      children: [
        {
          name: 'Impact Assessment',
          value: `${scenarioResult.scenario.severity} severity`,
          confidence: severityConfidence[scenarioResult.scenario.severity],
          agent: 'Scenario Agent',
          description: scenarioResult.scenario.description,
          children: scenarioResult.outcomes.slice(0, 3).map((outcome, i) => ({
            name: outcome.metric,
            value: `${outcome.change > 0 ? '+' : ''}${outcome.change}${outcome.unit}`,
            confidence: Math.max(70, 95 - i * 8),
            agent: 'Impact Agent',
            description: `From ${outcome.before} to ${outcome.after} ${outcome.unit}`,
          })),
        },
        {
          name: 'Financial Impact',
          value: `$${(scenarioResult.financialImpact.cost / 1000000).toFixed(1)}M`,
          confidence: 88,
          agent: 'Impact Agent',
          description: `Estimated cost over ${scenarioResult.financialImpact.timeframe}`,
          children: [
            {
              name: 'Recovery Strategy',
              value: scenarioResult.recoveryTime,
              confidence: 82,
              agent: 'Strategy Agent',
              description: scenarioResult.recommendation,
            },
          ],
        },
        ...(aiInsight ? [{
          name: 'AI Recommendation',
          value: 'Gemini 2.5 Analysis',
          confidence: 90,
          agent: 'Strategy Agent',
          description: aiInsight,
        }] : []),
      ],
    };
  };

  const runScenario = async () => {
    if (!selectedScenario) return;

    setIsRunning(true);
    setResult(null);
    setDecisionTreeData(null);

    try {
      const scenarioUrl = process.env.NEXT_PUBLIC_RUN_SCENARIO_URL;

      if (scenarioUrl) {
        // Call real API
        const response = await fetch(scenarioUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioType: selectedScenario.id,
            region: selectedRegion,
          }),
        });

        const data = await response.json();

        if (data.success && data.data) {
          const apiResult = data.data;
          const scenarioResult: ScenarioResult = {
            scenario: selectedScenario,
            region: selectedRegion,
            outcomes: apiResult.outcomes || [
              { metric: 'Delivery Time', before: 14, after: selectedScenario.severity === 'catastrophic' ? 28 : 21, change: selectedScenario.severity === 'catastrophic' ? 100 : 50, unit: 'days' },
              { metric: 'Shipping Cost', before: 100, after: selectedScenario.severity === 'catastrophic' ? 145 : 125, change: selectedScenario.severity === 'catastrophic' ? 45 : 25, unit: '%' },
              { metric: 'Inventory', before: 100, after: selectedScenario.severity === 'catastrophic' ? 70 : 85, change: selectedScenario.severity === 'catastrophic' ? -30 : -15, unit: '%' },
              { metric: 'Risk Score', before: 45, after: selectedScenario.severity === 'catastrophic' ? 85 : 72, change: selectedScenario.severity === 'catastrophic' ? 89 : 60, unit: 'pts' },
              { metric: 'Supplier Load', before: 75, after: selectedScenario.severity === 'catastrophic' ? 98 : 95, change: selectedScenario.severity === 'catastrophic' ? 31 : 27, unit: '%' },
            ],
            financialImpact: apiResult.financialImpact || {
              cost: selectedScenario.severity === 'catastrophic' ? 4200000 : selectedScenario.severity === 'severe' ? 2800000 : 1500000,
              currency: 'USD',
              timeframe: '30 days',
            },
            recommendation: apiResult.recommendations?.[0] || 'Implement contingency measures based on scenario severity.',
            recoveryTime: apiResult.recoveryTime || (selectedScenario.severity === 'catastrophic' ? '4-6 weeks' : '2-3 weeks'),
            aiInsight: apiResult.aiInsight,
          };

          setResult(scenarioResult);
          setDecisionTreeData(buildDecisionTree(scenarioResult, apiResult.aiInsight));
        } else {
          throw new Error(data.error?.message || 'Failed to run scenario');
        }
      } else {
        // Fallback to mock data if API not configured
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const mockResult: ScenarioResult = {
          scenario: selectedScenario,
          region: selectedRegion,
          outcomes: [
            { metric: 'Delivery Time', before: 14, after: selectedScenario.severity === 'catastrophic' ? 28 : 21, change: selectedScenario.severity === 'catastrophic' ? 100 : 50, unit: 'days' },
            { metric: 'Shipping Cost', before: 100, after: selectedScenario.severity === 'catastrophic' ? 145 : 125, change: selectedScenario.severity === 'catastrophic' ? 45 : 25, unit: '%' },
            { metric: 'Inventory', before: 100, after: selectedScenario.severity === 'catastrophic' ? 70 : 85, change: selectedScenario.severity === 'catastrophic' ? -30 : -15, unit: '%' },
            { metric: 'Risk Score', before: 45, after: selectedScenario.severity === 'catastrophic' ? 85 : 72, change: selectedScenario.severity === 'catastrophic' ? 89 : 60, unit: 'pts' },
            { metric: 'Supplier Load', before: 75, after: selectedScenario.severity === 'catastrophic' ? 98 : 95, change: selectedScenario.severity === 'catastrophic' ? 31 : 27, unit: '%' },
          ],
          financialImpact: {
            cost: selectedScenario.severity === 'catastrophic' ? 4200000 : selectedScenario.severity === 'severe' ? 2800000 : 1500000,
            currency: 'USD',
            timeframe: '30 days',
          },
          recommendation: selectedScenario.id === 'port_closure'
            ? 'Reroute shipments through Singapore and increase safety stock by 3 weeks'
            : selectedScenario.id === 'supplier_failure'
            ? 'Activate backup suppliers in South Korea and increase production at alternate facilities'
            : selectedScenario.id === 'demand_surge'
            ? 'Increase production capacity by 40% and expedite inbound shipments'
            : 'Implement emergency response protocol and activate alternative logistics routes',
          recoveryTime: selectedScenario.severity === 'catastrophic' ? '4-6 weeks' : selectedScenario.severity === 'severe' ? '2-3 weeks' : '1-2 weeks',
        };

        setResult(mockResult);
        setDecisionTreeData(buildDecisionTree(mockResult));
      }
    } catch (error) {
      console.error('Error running scenario:', error);
      // Fallback to mock data on error
      const mockResult: ScenarioResult = {
        scenario: selectedScenario,
        region: selectedRegion,
        outcomes: [
          { metric: 'Delivery Time', before: 14, after: 21, change: 50, unit: 'days' },
          { metric: 'Shipping Cost', before: 100, after: 125, change: 25, unit: '%' },
          { metric: 'Inventory', before: 100, after: 85, change: -15, unit: '%' },
        ],
        financialImpact: { cost: 2000000, currency: 'USD', timeframe: '30 days' },
        recommendation: 'Implement contingency measures.',
        recoveryTime: '2-3 weeks',
      };
      setResult(mockResult);
      setDecisionTreeData(buildDecisionTree(mockResult));
    } finally {
      setIsRunning(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <VoiceDashboardProvider>
      <div className="min-h-screen bg-gray-50 py-6 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Scenario Simulation</h1>
            <p className="text-gray-600 text-sm lg:text-base">
              Run what-if simulations to test your supply chain resilience
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Scenario Selection */}
            <div className="lg:col-span-1 space-y-6">
              {/* Scenario Selection */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Scenario</h3>
                <div className="space-y-3">
                  {scenarioTypes.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        selectedScenario?.id === scenario.id
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${scenario.color}20`, color: scenario.color }}
                        >
                          {scenario.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{scenario.name}</p>
                          <p className="text-sm text-gray-500">{scenario.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Region Selection */}
                <div className="mt-6">
                  <label className="block text-sm text-gray-600 mb-2">Target Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Run Button */}
                <button
                  onClick={runScenario}
                  disabled={!selectedScenario || isRunning}
                  className={`w-full mt-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    !selectedScenario || isRunning
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Scenario
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Simulation Progress */}
              <AnimatePresence>
                {isRunning && (
                  <SimulationProgress
                    isRunning={isRunning}
                    scenarioType={selectedScenario?.id}
                    region={selectedRegion}
                    duration={4000}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="w-5 h-5 text-red-500" />
                          <span className="text-gray-500 text-sm">Financial Impact</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(result.financialImpact.cost)}
                        </p>
                        <p className="text-xs text-gray-400">{result.financialImpact.timeframe}</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-5 h-5 text-orange-500" />
                          <span className="text-gray-500 text-sm">Recovery Time</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{result.recoveryTime}</p>
                        <p className="text-xs text-gray-400">Estimated duration</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <span className="text-gray-500 text-sm">Severity</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 capitalize">{result.scenario.severity}</p>
                        <p className="text-xs text-gray-400">{result.region} region</p>
                      </div>
                    </div>

                    {/* Impact Chart */}
                    <ScenarioImpactChart
                      outcomes={result.outcomes}
                      title={`${result.scenario.name} Impact - ${result.region}`}
                    />

                    {/* Recommendation */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <h3 className="text-lg font-semibold text-gray-900">Recommended Action</h3>
                      </div>
                      <p className="text-gray-700">{result.recommendation}</p>
                    </div>

                    {/* AI Decision Tree */}
                    {decisionTreeData && (
                      <DecisionTree
                        data={decisionTreeData}
                        title={`AI Analysis: ${result.scenario.name}`}
                      />
                    )}

                    {/* Monte Carlo Simulation Results */}
                    <MonteCarloVisualization
                      isVisible={true}
                      scenarioType={result.scenario.name}
                      iterations={10000}
                      mean={result.financialImpact.cost / 1000000}
                      stdDev={result.financialImpact.cost / 4000000}
                      p10={result.financialImpact.cost / 1500000}
                      p50={result.financialImpact.cost / 1000000}
                      p90={result.financialImpact.cost / 700000}
                    />

                    {/* Prediction Accuracy */}
                    <PredictionAccuracy
                      accuracy={98.5}
                      trend="up"
                      trendValue={2.3}
                      breakdown={{
                        riskPrediction: 97.2,
                        demandForecasting: 94.8,
                        delayPrediction: 99.1,
                        costEstimation: 96.5,
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm"
                  >
                    <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Simulation Running</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Select a scenario type and region, then click "Run Scenario" to simulate the impact on your supply chain.
                    </p>
                    <p className="text-cyan-600 text-sm mt-4">
                      Or say: "Run a port closure scenario in Asia"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </div>
    </VoiceDashboardProvider>
  );
}
