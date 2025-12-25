'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Clock, Target, AlertTriangle, CheckCircle } from 'lucide-react';

// ROI Optimizer Component
// Requirement 5.1: Calculate ROI percentages with payback periods for each strategy option
// Requirement 5.3: Rank strategies by weighted scoring based on user-defined priorities

interface ROIStrategy {
  id: string;
  name: string;
  description: string;
  financial: {
    totalInvestment: number;
    totalBenefits: number;
    roi: number;
    paybackPeriod: number;
    netPresentValue: number;
  };
  breakdown: {
    directSavings: number;
    avoidedCosts: number;
    revenueImpact: number;
    riskAdjustment: number;
  };
  timeline: {
    month: number;
    cumulativeCashFlow: number;
    monthlyBenefit: number;
  }[];
  confidence: {
    score: number;
    factors: string[];
  };
  recommendation: {
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    nextSteps: string[];
  };
}

interface ROIOptimizerProps {
  strategies?: ROIStrategy[];
  onStrategySelect?: (strategy: ROIStrategy) => void;
  className?: string;
}

const ROIOptimizer: React.FC<ROIOptimizerProps> = ({
  strategies = [],
  onStrategySelect,
  className = '',
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ROIStrategy | null>(null);
  const [sortBy, setSortBy] = useState<'roi' | 'payback' | 'npv'>('roi');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Mock data if no strategies provided
  const mockStrategies: ROIStrategy[] = [
    {
      id: 'strategy-1',
      name: 'Supply Chain Automation',
      description: 'Implement automated inventory management and demand forecasting',
      financial: {
        totalInvestment: 500000,
        totalBenefits: 850000,
        roi: 70.0,
        paybackPeriod: 14.1,
        netPresentValue: 285000
      },
      breakdown: {
        directSavings: 400000,
        avoidedCosts: 300000,
        revenueImpact: 150000,
        riskAdjustment: 50000
      },
      timeline: Array.from({ length: 24 }, (_, i) => ({
        month: i + 1,
        cumulativeCashFlow: -500000 + (i + 1) * 35417,
        monthlyBenefit: 35417
      })),
      confidence: {
        score: 85,
        factors: ['Proven technology', 'Strong vendor support']
      },
      recommendation: {
        priority: 'high',
        reasoning: 'Excellent ROI with manageable risk and proven technology.',
        nextSteps: ['Vendor selection', 'Pilot implementation', 'Change management']
      }
    },
    {
      id: 'strategy-2',
      name: 'Supplier Diversification',
      description: 'Expand supplier base to reduce dependency and improve resilience',
      financial: {
        totalInvestment: 200000,
        totalBenefits: 450000,
        roi: 125.0,
        paybackPeriod: 10.7,
        netPresentValue: 195000
      },
      breakdown: {
        directSavings: 150000,
        avoidedCosts: 250000,
        revenueImpact: 50000,
        riskAdjustment: 25000
      },
      timeline: Array.from({ length: 18 }, (_, i) => ({
        month: i + 1,
        cumulativeCashFlow: -200000 + (i + 1) * 18750,
        monthlyBenefit: 18750
      })),
      confidence: {
        score: 92,
        factors: ['Low implementation risk', 'Immediate benefits']
      },
      recommendation: {
        priority: 'high',
        reasoning: 'Outstanding ROI with quick payback and low risk profile.',
        nextSteps: ['Supplier assessment', 'Contract negotiation', 'Integration planning']
      }
    },
    {
      id: 'strategy-3',
      name: 'Predictive Analytics Platform',
      description: 'Deploy AI-powered predictive analytics for demand and risk forecasting',
      financial: {
        totalInvestment: 750000,
        totalBenefits: 980000,
        roi: 30.7,
        paybackPeriod: 23.0,
        netPresentValue: 145000
      },
      breakdown: {
        directSavings: 300000,
        avoidedCosts: 500000,
        revenueImpact: 200000,
        riskAdjustment: 80000
      },
      timeline: Array.from({ length: 36 }, (_, i) => ({
        month: i + 1,
        cumulativeCashFlow: -750000 + (i + 1) * 27222,
        monthlyBenefit: 27222
      })),
      confidence: {
        score: 72,
        factors: ['Technology complexity', 'Data quality requirements']
      },
      recommendation: {
        priority: 'medium',
        reasoning: 'Good long-term ROI but requires significant investment and expertise.',
        nextSteps: ['Data readiness assessment', 'Technology evaluation', 'Skills development']
      }
    }
  ];

  const displayStrategies = strategies.length > 0 ? strategies : mockStrategies;

  // Filter and sort strategies
  const filteredStrategies = displayStrategies
    .filter(strategy => filterPriority === 'all' || strategy.recommendation.priority === filterPriority)
    .sort((a, b) => {
      switch (sortBy) {
        case 'roi':
          return b.financial.roi - a.financial.roi;
        case 'payback':
          return a.financial.paybackPeriod - b.financial.paybackPeriod;
        case 'npv':
          return b.financial.netPresentValue - a.financial.netPresentValue;
        default:
          return 0;
      }
    });

  useEffect(() => {
    if (filteredStrategies.length > 0 && !selectedStrategy) {
      setSelectedStrategy(filteredStrategies[0]);
    }
  }, [filteredStrategies, selectedStrategy]);

  const handleStrategyClick = (strategy: ROIStrategy) => {
    setSelectedStrategy(strategy);
    onStrategySelect?.(strategy);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <CheckCircle className="h-4 w-4" />;
      case 'medium':
        return <Target className="h-4 w-4" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Prepare chart data
  const comparisonData = filteredStrategies.map(strategy => ({
    name: strategy.name.length > 15 ? strategy.name.substring(0, 15) + '...' : strategy.name,
    roi: strategy.financial.roi,
    payback: strategy.financial.paybackPeriod,
    investment: strategy.financial.totalInvestment / 1000, // in thousands
    npv: strategy.financial.netPresentValue / 1000 // in thousands
  }));

  const pieData = selectedStrategy ? [
    { name: 'Direct Savings', value: selectedStrategy.breakdown.directSavings, color: '#10B981' },
    { name: 'Avoided Costs', value: selectedStrategy.breakdown.avoidedCosts, color: '#3B82F6' },
    { name: 'Revenue Impact', value: selectedStrategy.breakdown.revenueImpact, color: '#8B5CF6' },
    { name: 'Risk Adjustment', value: -selectedStrategy.breakdown.riskAdjustment, color: '#EF4444' }
  ] : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ROI Optimization</h2>
          <p className="text-gray-600">
            Compare and optimize investment strategies for maximum return
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'roi' | 'payback' | 'npv')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="roi">Sort by ROI</option>
            <option value="payback">Sort by Payback Period</option>
            <option value="npv">Sort by NPV</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as 'all' | 'high' | 'medium' | 'low')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Strategy Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Investment Strategies</h3>
          {filteredStrategies.map((strategy) => (
            <Card
              key={strategy.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedStrategy?.id === strategy.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleStrategyClick(strategy)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm">{strategy.name}</h4>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getPriorityColor(strategy.recommendation.priority)}`}>
                    {getPriorityIcon(strategy.recommendation.priority)}
                    <span className="capitalize">{strategy.recommendation.priority}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-3">{strategy.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">ROI:</span>
                    <span className="font-semibold ml-1">{strategy.financial.roi.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Payback:</span>
                    <span className="font-semibold ml-1">{strategy.financial.paybackPeriod.toFixed(1)}m</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Investment:</span>
                    <span className="font-semibold ml-1">${(strategy.financial.totalInvestment / 1000).toFixed(0)}K</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence:</span>
                    <span className="font-semibold ml-1">{strategy.confidence.score}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Analysis */}
        <div className="lg:col-span-2">
          {selectedStrategy && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="comparison">Compare</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>{selectedStrategy.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{selectedStrategy.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedStrategy.financial.roi.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">ROI</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedStrategy.financial.paybackPeriod.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Months Payback</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ${(selectedStrategy.financial.netPresentValue / 1000).toFixed(0)}K
                        </div>
                        <div className="text-sm text-gray-500">NPV</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">
                          {selectedStrategy.confidence.score}%
                        </div>
                        <div className="text-sm text-gray-500">Confidence</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Recommendation</h4>
                        <p className="text-sm text-gray-600">{selectedStrategy.recommendation.reasoning}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Next Steps</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {selectedStrategy.recommendation.nextSteps.map((step, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {selectedStrategy.confidence.factors.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Confidence Factors</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {selectedStrategy.confidence.factors.map((factor, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Financial Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number | undefined) => [`$${((value || 0) / 1000).toFixed(0)}K`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-4">
                        {pieData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span>{item.name}</span>
                            </div>
                            <span className="font-medium">
                              ${(Math.abs(item.value) / 1000).toFixed(0)}K
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Investment Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-gray-600">Total Investment</span>
                          <span className="font-semibold">
                            ${(selectedStrategy.financial.totalInvestment / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-gray-600">Total Benefits</span>
                          <span className="font-semibold text-green-600">
                            ${(selectedStrategy.financial.totalBenefits / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-gray-600">Net Present Value</span>
                          <span className="font-semibold text-blue-600">
                            ${(selectedStrategy.financial.netPresentValue / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Return on Investment</span>
                          <span className="font-semibold text-purple-600">
                            {selectedStrategy.financial.roi.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cash Flow Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedStrategy.timeline}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                          <Tooltip
                            formatter={(value: number | undefined) => [`$${((value || 0) / 1000).toFixed(0)}K`, 'Cumulative Cash Flow']}
                            labelFormatter={(label) => `Month ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="cumulativeCashFlow"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Strategy Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="roi" fill="#10B981" name="ROI %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default ROIOptimizer;