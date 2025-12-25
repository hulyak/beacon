'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Clock, TrendingDown, AlertTriangle, Users } from 'lucide-react';
import { TimelineProjection } from '@/lib/types/enhanced-analytics';
import { formatDuration, formatCurrency } from '@/lib/utils/analytics-utils';

interface DelayTrackerProps {
  deliveryDelays: {
    averageDelay: number;
    maxDelay: number;
    affectedOrders: number;
    timelineProjection: TimelineProjection[];
  };
  impactMetrics: {
    customerSatisfactionImpact: number;
    revenueAtRisk: number;
    recoveryTimeEstimate: number;
  };
  onTimeRangeChange?: (range: string) => void;
}

export default function DelayTracker({ 
  deliveryDelays, 
  impactMetrics, 
  onTimeRangeChange 
}: DelayTrackerProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'delay' | 'orders' | 'impact'>('delay');

  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    onTimeRangeChange?.(range);
  };

  const getFilteredProjection = () => {
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 60;
    return deliveryDelays.timelineProjection.slice(0, days);
  };

  const getDelayStatus = () => {
    const avgDelay = deliveryDelays.averageDelay;
    if (avgDelay <= 3) return { status: 'GOOD', color: 'text-green-600', bg: 'bg-green-50' };
    if (avgDelay <= 7) return { status: 'MODERATE', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (avgDelay <= 14) return { status: 'HIGH', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { status: 'CRITICAL', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getSatisfactionStatus = () => {
    const impact = impactMetrics.customerSatisfactionImpact;
    if (impact <= 10) return { status: 'MINIMAL', color: 'text-green-600' };
    if (impact <= 25) return { status: 'MODERATE', color: 'text-yellow-600' };
    if (impact <= 50) return { status: 'SIGNIFICANT', color: 'text-orange-600' };
    return { status: 'SEVERE', color: 'text-red-600' };
  };

  const delayStatus = getDelayStatus();
  const satisfactionStatus = getSatisfactionStatus();
  const filteredProjection = getFilteredProjection();

  // Prepare chart data
  const chartData = filteredProjection.map((item, index) => ({
    day: index + 1,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    projectedDelay: item.projectedDelay,
    affectedOrders: item.affectedOrders,
    cumulativeImpact: item.cumulativeImpact / 1000, // Convert to thousands for readability
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Delay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(deliveryDelays.averageDelay)}
            </div>
            <p className={`text-xs ${delayStatus.color}`}>
              {delayStatus.status} Impact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveryDelays.affectedOrders.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders experiencing delays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue at Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(impactMetrics.revenueAtRisk)}
            </div>
            <p className="text-xs text-muted-foreground">
              Potential cancellations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Time</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(impactMetrics.recoveryTimeEstimate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated full recovery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Delivery Delay Projection</h3>
        <div className="flex space-x-2">
          {['7d', '30d', '60d'].map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedTimeRange === range
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '60 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex space-x-2">
        {[
          { key: 'delay', label: 'Projected Delay', icon: Clock },
          { key: 'orders', label: 'Affected Orders', icon: Users },
          { key: 'impact', label: 'Cumulative Impact', icon: TrendingDown }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedMetric(key as typeof selectedMetric)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              selectedMetric === key
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedMetric === 'delay' && 'Projected Delivery Delays Over Time'}
            {selectedMetric === 'orders' && 'Affected Orders Over Time'}
            {selectedMetric === 'impact' && 'Cumulative Impact Over Time'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {selectedMetric === 'impact' ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  label={{ 
                    value: 'Impact (Thousands)', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }} 
                />
                <Tooltip 
                  formatter={(value: number | undefined) => [`${value?.toFixed(1)}K`, 'Cumulative Impact']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeImpact"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  label={{ 
                    value: selectedMetric === 'delay' ? 'Days' : 'Orders', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }} 
                />
                <Tooltip 
                  formatter={(value: number | undefined) => [
                    selectedMetric === 'delay' 
                      ? `${value?.toFixed(1)} days` 
                      : `${value?.toLocaleString()} orders`,
                    selectedMetric === 'delay' ? 'Projected Delay' : 'Affected Orders'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey={selectedMetric === 'delay' ? 'projectedDelay' : 'affectedOrders'}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Delay Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${delayStatus.bg}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Status</span>
                  <span className={`font-bold ${delayStatus.color}`}>
                    {delayStatus.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Average delay of {formatDuration(deliveryDelays.averageDelay)} with maximum delays 
                  reaching {formatDuration(deliveryDelays.maxDelay)}.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Peak Delay</p>
                  <p className="text-xl font-semibold">
                    {formatDuration(deliveryDelays.maxDelay)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Improvement Rate</p>
                  <p className="text-xl font-semibold text-green-600">
                    {calculateImprovementRate(filteredProjection)}%/week
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Impact Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Satisfaction Impact</span>
                <span className={`font-bold ${satisfactionStatus.color}`}>
                  -{impactMetrics.customerSatisfactionImpact.toFixed(1)}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    impactMetrics.customerSatisfactionImpact <= 25 
                      ? 'bg-green-500' 
                      : impactMetrics.customerSatisfactionImpact <= 50 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, impactMetrics.customerSatisfactionImpact)}%` }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Revenue at Risk</p>
                  <p className="text-xl font-semibold text-red-600">
                    {formatCurrency(impactMetrics.revenueAtRisk)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Recovery Timeline</p>
                  <p className="text-xl font-semibold">
                    {formatDuration(impactMetrics.recoveryTimeEstimate)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getRecommendations(deliveryDelays.averageDelay, impactMetrics).map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-sm">{recommendation.title}</p>
                  <p className="text-sm text-gray-600">{recommendation.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Priority: {recommendation.priority} | Timeline: {recommendation.timeline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateImprovementRate(projection: TimelineProjection[]): number {
  if (projection.length < 7) return 0;
  
  const firstWeekAvg = projection.slice(0, 7).reduce((sum, p) => sum + p.projectedDelay, 0) / 7;
  const lastWeekAvg = projection.slice(-7).reduce((sum, p) => sum + p.projectedDelay, 0) / 7;
  
  if (firstWeekAvg === 0) return 0;
  
  const improvementRate = ((firstWeekAvg - lastWeekAvg) / firstWeekAvg) * 100;
  return Math.max(0, Math.round(improvementRate * 10) / 10);
}

function getRecommendations(
  averageDelay: number, 
  impactMetrics: { customerSatisfactionImpact: number; revenueAtRisk: number; recoveryTimeEstimate: number }
): Array<{ title: string; description: string; priority: string; timeline: string }> {
  const recommendations = [];

  if (averageDelay > 14) {
    recommendations.push({
      title: "Activate Emergency Protocols",
      description: "Implement crisis communication plan and activate all backup suppliers immediately.",
      priority: "CRITICAL",
      timeline: "Immediate"
    });
  }

  if (impactMetrics.revenueAtRisk > 1000000) {
    recommendations.push({
      title: "Customer Retention Program",
      description: "Launch proactive customer communication and compensation program to prevent cancellations.",
      priority: "HIGH",
      timeline: "24-48 hours"
    });
  }

  if (averageDelay > 7) {
    recommendations.push({
      title: "Expedited Shipping Options",
      description: "Offer expedited shipping at company cost for affected orders to minimize customer impact.",
      priority: "MEDIUM",
      timeline: "2-3 days"
    });
  }

  recommendations.push({
    title: "Process Improvement Review",
    description: "Conduct post-incident analysis to identify process improvements and prevent future delays.",
    priority: "LOW",
    timeline: "1-2 weeks"
  });

  return recommendations.slice(0, 4); // Return top 4 recommendations
}