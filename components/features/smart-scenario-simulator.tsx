'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Truck,
  Factory,
  BarChart3,
  Settings,
  Save,
  Share
} from 'lucide-react';
import { ModernCard } from '../ui/modern-card';
import { ModernButton } from '../ui/modern-button';
import { ModernBadge } from '../ui/modern-badge';

interface ScenarioParameter {
  id: string;
  name: string;
  type: 'slider' | 'toggle' | 'select' | 'input';
  value: any;
  min?: number;
  max?: number;
  options?: string[];
  unit?: string;
  description: string;
}

interface ScenarioResult {
  metric: string;
  current: number;
  projected: number;
  change: number;
  changePercent: number;
  impact: 'positive' | 'negative' | 'neutral';
  unit: string;
  description: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  category: 'disruption' | 'optimization' | 'expansion' | 'risk';
  parameters: ScenarioParameter[];
  results: ScenarioResult[];
  isRunning: boolean;
  progress: number;
  duration: number; // simulation time in seconds
}

const mockScenarios: Scenario[] = [
  {
    id: 'port-closure',
    name: 'Major Port Closure',
    description: 'Simulate the impact of Shanghai port closure for 7 days due to severe weather',
    category: 'disruption',
    parameters: [
      {
        id: 'closure-duration',
        name: 'Closure Duration',
        type: 'slider',
        value: 7,
        min: 1,
        max: 30,
        unit: 'days',
        description: 'How long the port remains closed'
      },
      {
        id: 'alternative-routes',
        name: 'Alternative Routes',
        type: 'toggle',
        value: true,
        description: 'Enable automatic rerouting to alternative ports'
      },
      {
        id: 'priority-cargo',
        name: 'Priority Cargo',
        type: 'select',
        value: 'high-value',
        options: ['all', 'high-value', 'time-sensitive', 'none'],
        description: 'Which cargo gets priority for alternative routing'
      }
    ],
    results: [
      {
        metric: 'Total Cost Impact',
        current: 2500000,
        projected: 3750000,
        change: 1250000,
        changePercent: 50,
        impact: 'negative',
        unit: '$',
        description: 'Additional costs from delays and rerouting'
      },
      {
        metric: 'Delivery Delays',
        current: 2.5,
        projected: 8.2,
        change: 5.7,
        changePercent: 228,
        impact: 'negative',
        unit: 'days',
        description: 'Average delay in delivery times'
      },
      {
        metric: 'Customer Satisfaction',
        current: 87,
        projected: 72,
        change: -15,
        changePercent: -17,
        impact: 'negative',
        unit: '%',
        description: 'Impact on customer satisfaction scores'
      }
    ],
    isRunning: false,
    progress: 0,
    duration: 15
  },
  {
    id: 'route-optimization',
    name: 'AI Route Optimization',
    description: 'Implement AI-driven route optimization across all shipping lanes',
    category: 'optimization',
    parameters: [
      {
        id: 'optimization-level',
        name: 'Optimization Level',
        type: 'slider',
        value: 85,
        min: 50,
        max: 100,
        unit: '%',
        description: 'How aggressive the optimization algorithm should be'
      },
      {
        id: 'cost-priority',
        name: 'Cost Priority',
        type: 'slider',
        value: 60,
        min: 0,
        max: 100,
        unit: '%',
        description: 'Balance between cost reduction and speed'
      },
      {
        id: 'sustainability-focus',
        name: 'Sustainability Focus',
        type: 'toggle',
        value: true,
        description: 'Prioritize environmentally friendly routes'
      }
    ],
    results: [
      {
        metric: 'Cost Savings',
        current: 0,
        projected: 850000,
        change: 850000,
        changePercent: 100,
        impact: 'positive',
        unit: '$',
        description: 'Annual cost savings from optimization'
      },
      {
        metric: 'Carbon Emissions',
        current: 12500,
        projected: 9750,
        change: -2750,
        changePercent: -22,
        impact: 'positive',
        unit: 'tons CO2',
        description: 'Reduction in carbon emissions'
      },
      {
        metric: 'Delivery Time',
        current: 14.2,
        projected: 12.8,
        change: -1.4,
        changePercent: -10,
        impact: 'positive',
        unit: 'days',
        description: 'Average improvement in delivery times'
      }
    ],
    isRunning: false,
    progress: 0,
    duration: 20
  },
  {
    id: 'supplier-expansion',
    name: 'New Supplier Integration',
    description: 'Add 3 new suppliers in Southeast Asia to diversify supply base',
    category: 'expansion',
    parameters: [
      {
        id: 'supplier-count',
        name: 'Number of Suppliers',
        type: 'slider',
        value: 3,
        min: 1,
        max: 10,
        unit: 'suppliers',
        description: 'How many new suppliers to integrate'
      },
      {
        id: 'integration-speed',
        name: 'Integration Speed',
        type: 'select',
        value: 'gradual',
        options: ['immediate', 'gradual', 'phased'],
        description: 'How quickly to integrate new suppliers'
      },
      {
        id: 'quality-standards',
        name: 'Quality Standards',
        type: 'slider',
        value: 90,
        min: 70,
        max: 100,
        unit: '%',
        description: 'Minimum quality standards for new suppliers'
      }
    ],
    results: [
      {
        metric: 'Supply Resilience',
        current: 72,
        projected: 89,
        change: 17,
        changePercent: 24,
        impact: 'positive',
        unit: '%',
        description: 'Improvement in supply chain resilience'
      },
      {
        metric: 'Risk Reduction',
        current: 45,
        projected: 28,
        change: -17,
        changePercent: -38,
        impact: 'positive',
        unit: '%',
        description: 'Reduction in supply risk concentration'
      },
      {
        metric: 'Integration Cost',
        current: 0,
        projected: 450000,
        change: 450000,
        changePercent: 100,
        impact: 'negative',
        unit: '$',
        description: 'One-time cost for supplier integration'
      }
    ],
    isRunning: false,
    progress: 0,
    duration: 25
  }
];

const getCategoryIcon = (category: Scenario['category']) => {
  switch (category) {
    case 'disruption': return <AlertTriangle className="w-5 h-5" />;
    case 'optimization': return <TrendingUp className="w-5 h-5" />;
    case 'expansion': return <Factory className="w-5 h-5" />;
    case 'risk': return <Zap className="w-5 h-5" />;
  }
};

const getCategoryColor = (category: Scenario['category']) => {
  switch (category) {
    case 'disruption': return 'text-red-600 bg-red-50';
    case 'optimization': return 'text-green-600 bg-green-50';
    case 'expansion': return 'text-blue-600 bg-blue-50';
    case 'risk': return 'text-orange-600 bg-orange-50';
  }
};

export function SmartScenarioSimulator() {
  const [scenarios, setScenarios] = useState<Scenario[]>(mockScenarios);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Handle parameter changes
  const updateParameter = (parameterId: string, value: any) => {
    setSelectedScenario(prev => ({
      ...prev,
      parameters: prev.parameters.map(param =>
        param.id === parameterId ? { ...param, value } : param
      )
    }));
  };

  // Run simulation
  const runSimulation = async () => {
    setIsSimulating(true);
    setSelectedScenario(prev => ({ ...prev, isRunning: true, progress: 0 }));

    // Simulate progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, selectedScenario.duration * 10));
      setSelectedScenario(prev => ({ ...prev, progress: i }));
    }

    // Update results based on parameters (simplified simulation)
    const updatedResults = selectedScenario.results.map(result => {
      const randomVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const newProjected = result.projected * (1 + randomVariation);
      const newChange = newProjected - result.current;
      const newChangePercent = (newChange / result.current) * 100;

      return {
        ...result,
        projected: Math.round(newProjected * 100) / 100,
        change: Math.round(newChange * 100) / 100,
        changePercent: Math.round(newChangePercent * 100) / 100
      };
    });

    setSelectedScenario(prev => ({
      ...prev,
      results: updatedResults,
      isRunning: false,
      progress: 100
    }));

    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setSelectedScenario(prev => ({ ...prev, progress: 0 }));
  };

  const renderParameterControl = (param: ScenarioParameter) => {
    switch (param.type) {
      case 'slider':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-700">{param.name}</label>
              <span className="text-sm text-gray-500">
                {param.value} {param.unit}
              </span>
            </div>
            <input
              type="range"
              min={param.min}
              max={param.max}
              value={param.value}
              onChange={(e) => updateParameter(param.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-gray-500">{param.description}</p>
          </div>
        );

      case 'toggle':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{param.name}</label>
              <button
                onClick={() => updateParameter(param.id, !param.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  param.value ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    param.value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500">{param.description}</p>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{param.name}</label>
            <select
              value={param.value}
              onChange={(e) => updateParameter(param.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {param.options?.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">{param.description}</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Scenario Simulator</h2>
            <p className="text-sm text-gray-600">What-if analysis and predictive modeling</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ModernButton variant="outline" size="sm">
            <Save className="w-4 h-4 mr-1" />
            Save
          </ModernButton>
          <ModernButton variant="outline" size="sm">
            <Share className="w-4 h-4 mr-1" />
            Share
          </ModernButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Available Scenarios</h3>
          {scenarios.map((scenario) => (
            <ModernCard
              key={scenario.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedScenario.id === scenario.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedScenario(scenario)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${getCategoryColor(scenario.category)}`}>
                      {getCategoryIcon(scenario.category)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{scenario.name}</h4>
                      <ModernBadge variant="outline" className="text-xs mt-1">
                        {scenario.category}
                      </ModernBadge>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {scenario.description}
                </p>
              </div>
            </ModernCard>
          ))}
        </div>

        {/* Parameters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Parameters</h3>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={resetSimulation}
              disabled={isSimulating}
            >
              <RotateCcw className="w-4 h-4" />
            </ModernButton>
          </div>

          <ModernCard className="p-4">
            <div className="space-y-6">
              {selectedScenario.parameters.map((param) => (
                <div key={param.id}>
                  {renderParameterControl(param)}
                </div>
              ))}

              <div className="pt-4 border-t">
                <ModernButton
                  variant="primary"
                  className="w-full"
                  onClick={runSimulation}
                  disabled={isSimulating}
                >
                  {isSimulating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Simulating... {selectedScenario.progress}%
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Simulation
                    </>
                  )}
                </ModernButton>

                {selectedScenario.progress > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{selectedScenario.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${selectedScenario.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Impact Analysis</h3>
          
          <div className="space-y-3">
            {selectedScenario.results.map((result, index) => (
              <ModernCard key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 text-sm">{result.metric}</h4>
                    <div className={`flex items-center gap-1 ${
                      result.impact === 'positive' ? 'text-green-600' : 
                      result.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {result.impact === 'positive' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : result.impact === 'negative' ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {result.changePercent > 0 ? '+' : ''}{result.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Current</div>
                      <div className="font-medium">
                        {result.unit === '$' ? '$' : ''}{result.current.toLocaleString()}{result.unit !== '$' ? ` ${result.unit}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Projected</div>
                      <div className={`font-medium ${
                        result.impact === 'positive' ? 'text-green-600' : 
                        result.impact === 'negative' ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {result.unit === '$' ? '$' : ''}{result.projected.toLocaleString()}{result.unit !== '$' ? ` ${result.unit}` : ''}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">{result.description}</p>
                </div>
              </ModernCard>
            ))}
          </div>

          {/* Summary */}
          <ModernCard className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm">Simulation Summary</h4>
              <div className="text-xs text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Estimated duration: {selectedScenario.duration} seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  <span>{selectedScenario.parameters.length} parameters configured</span>
                </div>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}