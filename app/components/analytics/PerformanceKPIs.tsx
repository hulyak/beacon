'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, Clock, DollarSign } from 'lucide-react';
import { formatPercentage, formatCurrency, formatDuration } from '@/lib/utils/analytics-utils';

interface KPIMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'good' | 'warning' | 'critical';
  historicalData: Array<{
    date: string;
    value: number;
  }>;
}

interface PerformanceKPIsProps {
  timeRange?: '7d' | '30d' | '90d';
  onKPISelect?: (kpi: KPIMetric) => void;
  onRefresh?: () => void;
}

export default function PerformanceKPIs({ 
  timeRange = '30d', 
  onKPISelect,
  onRefresh 
}: PerformanceKPIsProps) {
  const [kpiData, setKpiData] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<KPIMetric | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchKPIData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchKPIData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/performance-kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange })
      });
      
      if (response.ok) {
        const data = await response.json();
        setKpiData(data.kpis || generateMockKPIData());
        setLastUpdated(new Date());
      } else {
        // Fallback to mock data if API fails
        setKpiData(generateMockKPIData());
      }
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
      setKpiData(generateMockKPIData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockKPIData = (): KPIMetric[] => {
    const baseDate = new Date();
    const generateHistoricalData = (baseValue: number, volatility: number = 0.1) => {
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - i);
        const variation = (Math.random() - 0.5) * volatility * baseValue;
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.max(0, baseValue + variation)
        });
      }
      return data;
    };

    return [
      {
        id: 'delivery-performance',
        name: 'On-Time Delivery Rate',
        currentValue: 87.5,
        targetValue: 95.0,
        unit: '%',
        trend: 'down',
        trendPercentage: -5.2,
        status: 'warning',
        historicalData: generateHistoricalData(87.5, 0.15)
      },
      {
        id: 'cost-efficiency',
        name: 'Cost per Shipment',
        currentValue: 245,
        targetValue: 200,
        unit: '$',
        trend: 'up',
        trendPercentage: 12.5,
        status: 'critical',
        historicalData: generateHistoricalData(245, 0.2)
      },
      {
        id: 'inventory-turnover',
        name: 'Inventory Turnover',
        currentValue: 8.2,
        targetValue: 10.0,
        unit: 'times/year',
        trend: 'stable',
        trendPercentage: 0.8,
        status: 'warning',
        historicalData: generateHistoricalData(8.2, 0.1)
      },
      {
        id: 'supplier-reliability',
        name: 'Supplier Reliability',
        currentValue: 92.3,
        targetValue: 98.0,
        unit: '%',
        trend: 'up',
        trendPercentage: 3.1,
        status: 'good',
        historicalData: generateHistoricalData(92.3, 0.08)
      },
      {
        id: 'lead-time',
        name: 'Average Lead Time',
        currentValue: 18.5,
        targetValue: 14.0,
        unit: 'days',
        trend: 'down',
        trendPercentage: -8.3,
        status: 'good',
        historicalData: generateHistoricalData(18.5, 0.12)
      },
      {
        id: 'risk-score',
        name: 'Overall Risk Score',
        currentValue: 68,
        targetValue: 40,
        unit: '/100',
        trend: 'up',
        trendPercentage: 15.2,
        status: 'critical',
        historicalData: generateHistoricalData(68, 0.18)
      }
    ];
  };

  const handleKPIClick = (kpi: KPIMetric) => {
    setSelectedKPI(kpi);
    onKPISelect?.(kpi);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'warning': return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'critical': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Last Updated */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance KPIs</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={() => {
              fetchKPIData();
              onRefresh?.();
            }}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <Card 
            key={kpi.id}
            className={`cursor-pointer transition-all hover:shadow-md ${getStatusColor(kpi.status)} ${
              selectedKPI?.id === kpi.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleKPIClick(kpi)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
              {getStatusIcon(kpi.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">
                    {kpi.unit === '$' ? formatCurrency(kpi.currentValue) : 
                     kpi.unit === '%' ? formatPercentage(kpi.currentValue) :
                     kpi.unit === 'days' ? formatDuration(kpi.currentValue) :
                     `${kpi.currentValue.toFixed(1)}${kpi.unit}`}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {kpi.unit === '$' ? formatCurrency(kpi.targetValue) : 
                        kpi.unit === '%' ? formatPercentage(kpi.targetValue) :
                        kpi.unit === 'days' ? formatDuration(kpi.targetValue) :
                        `${kpi.targetValue}${kpi.unit}`}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {getTrendIcon(kpi.trend)}
                  <span className={`text-xs ${
                    kpi.trend === 'up' && kpi.trendPercentage > 0 ? 'text-green-600' :
                    kpi.trend === 'down' && kpi.trendPercentage < 0 ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {Math.abs(kpi.trendPercentage).toFixed(1)}% vs last period
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      kpi.status === 'good' ? 'bg-green-500' :
                      kpi.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.max(0, (kpi.currentValue / kpi.targetValue) * 100))}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected KPI Detail Chart */}
      {selectedKPI && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedKPI.name} - Historical Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedKPI.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tickFormatter={(value) => 
                    selectedKPI.unit === '$' ? `$${value}` :
                    selectedKPI.unit === '%' ? `${value}%` :
                    selectedKPI.unit === 'days' ? `${value}d` :
                    `${value}${selectedKPI.unit}`
                  }
                />
                <Tooltip 
                  formatter={(value: number | undefined) => [
                    selectedKPI.unit === '$' ? formatCurrency(value || 0) :
                    selectedKPI.unit === '%' ? formatPercentage(value || 0) :
                    selectedKPI.unit === 'days' ? formatDuration(value || 0) :
                    `${(value || 0).toFixed(1)}${selectedKPI.unit}`,
                    selectedKPI.name
                  ]}
                  labelFormatter={(date) => `Date: ${new Date(date).toLocaleDateString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
                />
                {/* Target line */}
                <Line
                  type="monotone"
                  dataKey={() => selectedKPI.targetValue}
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* KPI Details */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Current Value</p>
                <p className="text-lg font-semibold">
                  {selectedKPI.unit === '$' ? formatCurrency(selectedKPI.currentValue) :
                   selectedKPI.unit === '%' ? formatPercentage(selectedKPI.currentValue) :
                   selectedKPI.unit === 'days' ? formatDuration(selectedKPI.currentValue) :
                   `${selectedKPI.currentValue.toFixed(1)}${selectedKPI.unit}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Target Value</p>
                <p className="text-lg font-semibold text-green-600">
                  {selectedKPI.unit === '$' ? formatCurrency(selectedKPI.targetValue) :
                   selectedKPI.unit === '%' ? formatPercentage(selectedKPI.targetValue) :
                   selectedKPI.unit === 'days' ? formatDuration(selectedKPI.targetValue) :
                   `${selectedKPI.targetValue.toFixed(1)}${selectedKPI.unit}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Performance Gap</p>
                <p className={`text-lg font-semibold ${
                  selectedKPI.currentValue >= selectedKPI.targetValue ? 'text-green-600' : 'text-red-600'
                }`}>
                  {calculatePerformanceGap(selectedKPI)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Trend</p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(selectedKPI.trend)}
                  <span className={`text-lg font-semibold ${
                    selectedKPI.trend === 'up' ? 'text-green-600' :
                    selectedKPI.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {Math.abs(selectedKPI.trendPercentage).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Summary Chart */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kpiData.map(kpi => ({
              name: kpi.name.replace(' Rate', '').replace(' Score', ''),
              performance: (kpi.currentValue / kpi.targetValue) * 100,
              target: 100,
              status: kpi.status
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis 
                label={{ value: 'Performance (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number | undefined) => [`${(value || 0).toFixed(1)}%`, 'Performance vs Target']}
              />
              <Bar 
                dataKey="performance" 
                fill="#8884d8"
                onClick={(data: any) => {
                  const kpi = kpiData.find(k => k.name.includes(data.name || ''));
                  if (kpi) handleKPIClick(kpi);
                }}
                style={{ cursor: 'pointer' }}
              />
              <Bar 
                dataKey="target" 
                fill="transparent" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getKPIRecommendations(kpiData).map((action, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  action.priority === 'high' ? 'bg-red-500' :
                  action.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Priority: {action.priority.toUpperCase()}</span>
                    <span>Timeline: {action.timeline}</span>
                    <span>Impact: {action.expectedImprovement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculatePerformanceGap(kpi: KPIMetric): string {
  const gap = ((kpi.currentValue - kpi.targetValue) / kpi.targetValue) * 100;
  const absGap = Math.abs(gap);
  
  if (kpi.unit === 'days' || kpi.name.includes('Cost')) {
    // For metrics where lower is better
    return gap <= 0 ? `+${absGap.toFixed(1)}%` : `-${absGap.toFixed(1)}%`;
  } else {
    // For metrics where higher is better
    return gap >= 0 ? `+${absGap.toFixed(1)}%` : `-${absGap.toFixed(1)}%`;
  }
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'up': return <TrendingUp className="h-3 w-3" />;
    case 'down': return <TrendingDown className="h-3 w-3" />;
    default: return <Activity className="h-3 w-3" />;
  }
}

function getKPIRecommendations(kpiData: KPIMetric[]): Array<{
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  expectedImprovement: string;
}> {
  const recommendations = [];

  // Check for critical KPIs
  const criticalKPIs = kpiData.filter(kpi => kpi.status === 'critical');
  if (criticalKPIs.length > 0) {
    recommendations.push({
      title: "Address Critical Performance Issues",
      description: `${criticalKPIs.length} KPIs are in critical status requiring immediate attention.`,
      priority: 'high' as const,
      timeline: 'Immediate',
      expectedImprovement: '15-25% improvement'
    });
  }

  // Check for delivery performance
  const deliveryKPI = kpiData.find(kpi => kpi.id === 'delivery-performance');
  if (deliveryKPI && deliveryKPI.currentValue < deliveryKPI.targetValue) {
    recommendations.push({
      title: "Improve On-Time Delivery Rate",
      description: "Implement supplier performance monitoring and backup logistics providers.",
      priority: 'high' as const,
      timeline: '2-4 weeks',
      expectedImprovement: '8-12% improvement'
    });
  }

  // Check for cost efficiency
  const costKPI = kpiData.find(kpi => kpi.id === 'cost-efficiency');
  if (costKPI && costKPI.currentValue > costKPI.targetValue) {
    recommendations.push({
      title: "Optimize Shipping Costs",
      description: "Consolidate shipments and negotiate better rates with logistics partners.",
      priority: 'medium' as const,
      timeline: '1-2 weeks',
      expectedImprovement: '10-15% cost reduction'
    });
  }

  // General improvement recommendation
  recommendations.push({
    title: "Implement Predictive Analytics",
    description: "Deploy ML models for demand forecasting and proactive risk management.",
    priority: 'low' as const,
    timeline: '4-6 weeks',
    expectedImprovement: '5-10% overall improvement'
  });

  return recommendations.slice(0, 4);
}