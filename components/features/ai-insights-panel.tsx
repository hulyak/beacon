'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Target,
  Clock,
  ArrowRight,
  Sparkles,
  Eye,
  BarChart3
} from 'lucide-react';
import { ModernCard } from '../ui/modern-card';
import { ModernButton } from '../ui/modern-button';
import { ModernBadge } from '../ui/modern-badge';

interface AIInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'optimization' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  actionable: boolean;
  data: {
    metric?: string;
    currentValue?: number;
    predictedValue?: number;
    trend?: 'up' | 'down' | 'stable';
    affectedNodes?: string[];
  };
}

const mockInsights: AIInsight[] = [
  {
    id: '1',
    type: 'prediction',
    title: 'Port Congestion Predicted',
    description: 'Shanghai port expected to experience 40% congestion increase in next 72 hours due to weather patterns and vessel clustering.',
    confidence: 87,
    impact: 'high',
    timeframe: '72 hours',
    actionable: true,
    data: {
      metric: 'Port Congestion',
      currentValue: 65,
      predictedValue: 91,
      trend: 'up',
      affectedNodes: ['Shanghai Port', 'Ningbo Port', 'Vessel Route A-7']
    }
  },
  {
    id: '2',
    type: 'anomaly',
    title: 'Unusual Supplier Behavior',
    description: 'Supplier TechCorp showing 23% deviation from normal delivery patterns. Potential capacity issues detected.',
    confidence: 92,
    impact: 'medium',
    timeframe: 'Current',
    actionable: true,
    data: {
      metric: 'Delivery Performance',
      currentValue: 77,
      predictedValue: 85,
      trend: 'down',
      affectedNodes: ['TechCorp', 'Manufacturing Hub B', 'Product Line X']
    }
  },
  {
    id: '3',
    type: 'optimization',
    title: 'Route Optimization Opportunity',
    description: 'Alternative shipping route via Rotterdam could reduce costs by 15% and carbon emissions by 22%.',
    confidence: 94,
    impact: 'medium',
    timeframe: 'Next shipment',
    actionable: true,
    data: {
      metric: 'Cost Efficiency',
      currentValue: 100,
      predictedValue: 85,
      trend: 'down',
      affectedNodes: ['Route EU-1', 'Rotterdam Hub', 'Distribution Center C']
    }
  },
  {
    id: '4',
    type: 'risk',
    title: 'Geopolitical Risk Alert',
    description: 'Increased trade tensions may affect 12% of supply routes. Diversification recommended.',
    confidence: 78,
    impact: 'critical',
    timeframe: '2-4 weeks',
    actionable: true,
    data: {
      metric: 'Supply Risk',
      currentValue: 25,
      predictedValue: 45,
      trend: 'up',
      affectedNodes: ['Region Asia-Pacific', 'Trade Route T-3', 'Backup Suppliers']
    }
  }
];

const getInsightIcon = (type: AIInsight['type']) => {
  switch (type) {
    case 'prediction': return <TrendingUp className="w-5 h-5" />;
    case 'anomaly': return <AlertTriangle className="w-5 h-5" />;
    case 'optimization': return <Target className="w-5 h-5" />;
    case 'risk': return <Zap className="w-5 h-5" />;
  }
};

const getImpactColor = (impact: AIInsight['impact']) => {
  switch (impact) {
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
  }
};

const getTypeColor = (type: AIInsight['type']) => {
  switch (type) {
    case 'prediction': return 'text-blue-600 bg-blue-50';
    case 'anomaly': return 'text-red-600 bg-red-50';
    case 'optimization': return 'text-green-600 bg-green-50';
    case 'risk': return 'text-orange-600 bg-orange-50';
  }
};

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>(mockInsights);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setInsights(prev => prev.map(insight => ({
        ...insight,
        confidence: Math.max(70, Math.min(99, insight.confidence + (Math.random() - 0.5) * 4))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleTakeAction = async (insight: AIInsight) => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update insight status
    setInsights(prev => prev.map(i => 
      i.id === insight.id 
        ? { ...i, actionable: false, description: i.description + ' [Action initiated]' }
        : i
    ));
    
    setIsProcessing(false);
    setSelectedInsight(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
            <p className="text-sm text-gray-600">Real-time predictive intelligence</p>
          </div>
        </div>
        <ModernBadge variant="success" className="animate-pulse">
          <Sparkles className="w-3 h-3 mr-1" />
          Live
        </ModernBadge>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <ModernCard 
            key={insight.id}
            className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${getTypeColor(insight.type)}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{insight.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <ModernBadge 
                        variant="default" 
                        className={`text-xs ${getImpactColor(insight.impact)}`}
                      >
                        {insight.impact.toUpperCase()}
                      </ModernBadge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {insight.timeframe}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {Math.round(insight.confidence)}%
                  </div>
                  <div className="text-xs text-gray-500">confidence</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {insight.description}
              </p>

              {/* Data Visualization */}
              {insight.data.metric && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">
                      {insight.data.metric}
                    </span>
                    <div className="flex items-center gap-1">
                      {insight.data.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
                      {insight.data.trend === 'down' && <TrendingUp className="w-3 h-3 text-green-500 rotate-180" />}
                      {insight.data.trend === 'stable' && <BarChart3 className="w-3 h-3 text-gray-500" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      Current: {insight.data.currentValue}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className={`font-medium ${
                      insight.data.trend === 'up' ? 'text-red-600' : 
                      insight.data.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      Predicted: {insight.data.predictedValue}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {insight.actionable && (
                <ModernButton
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInsight(insight);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </ModernButton>
              )}
            </div>
          </ModernCard>
        ))}
      </div>

      {/* Detailed View Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ModernCard className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(selectedInsight.type)}`}>
                    {getInsightIcon(selectedInsight.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedInsight.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <ModernBadge 
                        variant="default" 
                        className={getImpactColor(selectedInsight.impact)}
                      >
                        {selectedInsight.impact.toUpperCase()} IMPACT
                      </ModernBadge>
                      <span className="text-sm text-gray-500">
                        {Math.round(selectedInsight.confidence)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedInsight(null)}
                >
                  ×
                </ModernButton>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Analysis</h4>
                <p className="text-gray-600">{selectedInsight.description}</p>
              </div>

              {/* Affected Nodes */}
              {selectedInsight.data.affectedNodes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Affected Components</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedInsight.data.affectedNodes.map((node, index) => (
                      <ModernBadge key={index} variant="default">
                        {node}
                      </ModernBadge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {selectedInsight.data.metric && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Impact Metrics</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Current Value</div>
                        <div className="text-xl font-semibold text-gray-900">
                          {selectedInsight.data.currentValue}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Predicted Value</div>
                        <div className={`text-xl font-semibold ${
                          selectedInsight.data.trend === 'up' ? 'text-red-600' : 
                          selectedInsight.data.trend === 'down' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {selectedInsight.data.predictedValue}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <ModernButton
                  variant="secondary"
                  onClick={() => setSelectedInsight(null)}
                  className="flex-1"
                >
                  Close
                </ModernButton>
                {selectedInsight.actionable && (
                  <ModernButton
                    variant="primary"
                    onClick={() => handleTakeAction(selectedInsight)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Take Action
                      </>
                    )}
                  </ModernButton>
                )}
              </div>
            </div>
          </ModernCard>
        </div>
      )}
    </div>
  );
}