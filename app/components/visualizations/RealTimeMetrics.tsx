'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

// Real-time metrics dashboard component
// Requirement 7.1: Provide real-time status updates with current risk levels and trending indicators
// Requirement 8.2: Handle data streams with sub-second latency for critical metrics

interface MetricDataPoint {
  timestamp: string;
  value: number;
  status?: 'normal' | 'warning' | 'critical';
}

interface MetricStream {
  id: string;
  name: string;
  unit: string;
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'normal' | 'warning' | 'critical';
  data: MetricDataPoint[];
  thresholds: {
    warning: number;
    critical: number;
  };
  target?: number;
}

interface RealTimeMetricsProps {
  streams?: MetricStream[];
  updateInterval?: number; // milliseconds
  maxDataPoints?: number;
  showSparklines?: boolean;
  showAlerts?: boolean;
  className?: string;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  streams = [],
  updateInterval = 2000,
  maxDataPoints = 50,
  showSparklines = true,
  showAlerts = true,
  className = '',
}) => {
  const [metricsData, setMetricsData] = useState<MetricStream[]>(streams);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(() => new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions defined first
  const getValueStatus = (value: number, thresholds: { warning: number; critical: number }): 'normal' | 'warning' | 'critical' => {
    if (value <= thresholds.critical) return 'critical';
    if (value <= thresholds.warning) return 'warning';
    return 'normal';
  };

  const generateInitialData = (baseValue: number, count: number): MetricDataPoint[] => {
    const data: MetricDataPoint[] = [];
    const now = Date.now();
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = new Date(now - i * 2000).toISOString();
      const variation = (Math.random() - 0.5) * baseValue * 0.1;
      const value = Math.max(0, baseValue + variation);
      
      data.push({
        timestamp,
        value: Math.round(value * 100) / 100,
        status: getValueStatus(value, { warning: baseValue * 0.9, critical: baseValue * 0.8 }),
      });
    }
    
    return data;
  };

  const generateMockStreams = (): MetricStream[] => {
    return [
      {
        id: 'delivery_performance',
        name: 'Delivery Performance',
        unit: '%',
        currentValue: 94.5,
        trend: 'up',
        trendPercentage: 2.3,
        status: 'normal',
        data: generateInitialData(94.5, 50),
        thresholds: { warning: 90, critical: 85 },
        target: 95,
      },
      {
        id: 'cost_efficiency',
        name: 'Cost Efficiency',
        unit: '%',
        currentValue: 87.2,
        trend: 'down',
        trendPercentage: -1.8,
        status: 'warning',
        data: generateInitialData(87.2, 50),
        thresholds: { warning: 90, critical: 80 },
        target: 92,
      },
      {
        id: 'risk_level',
        name: 'Risk Level',
        unit: '',
        currentValue: 23.1,
        trend: 'stable',
        trendPercentage: 0.2,
        status: 'normal',
        data: generateInitialData(23.1, 50),
        thresholds: { warning: 50, critical: 75 },
      },
      {
        id: 'sustainability_score',
        name: 'Sustainability Score',
        unit: '',
        currentValue: 78.9,
        trend: 'up',
        trendPercentage: 3.1,
        status: 'normal',
        data: generateInitialData(78.9, 50),
        thresholds: { warning: 60, critical: 40 },
        target: 85,
      },
      {
        id: 'order_volume',
        name: 'Order Volume',
        unit: 'orders/hr',
        currentValue: 156,
        trend: 'up',
        trendPercentage: 12.4,
        status: 'normal',
        data: generateInitialData(156, 50),
        thresholds: { warning: 200, critical: 250 },
      },
      {
        id: 'inventory_turnover',
        name: 'Inventory Turnover',
        unit: 'days',
        currentValue: 12.3,
        trend: 'down',
        trendPercentage: -5.2,
        status: 'normal',
        data: generateInitialData(12.3, 50),
        thresholds: { warning: 15, critical: 20 },
        target: 10,
      },
    ];
  };

  // Initialize with mock data if no streams provided
  useEffect(() => {
    if (streams.length === 0) {
      setMetricsData(generateMockStreams());
    } else {
      setMetricsData(streams);
    }
  }, [streams.length]); // Only depend on streams.length to avoid infinite loops

  // Set up real-time data updates
  useEffect(() => {
    setIsConnected(true);
    
    const updateStreamData = (stream: MetricStream, maxPoints: number): MetricStream => {
      const now = new Date().toISOString();
      const lastValue = stream.data[stream.data.length - 1]?.value || stream.currentValue;
      
      // Generate new value with some randomness and trend
      let trendFactor = 0;
      if (stream.trend === 'up') trendFactor = 0.02;
      else if (stream.trend === 'down') trendFactor = -0.02;
      
      const variation = (Math.random() - 0.5) * lastValue * 0.05;
      const trendAdjustment = lastValue * trendFactor;
      const newValue = Math.max(0, lastValue + variation + trendAdjustment);
      
      const newDataPoint: MetricDataPoint = {
        timestamp: now,
        value: Math.round(newValue * 100) / 100,
        status: getValueStatus(newValue, stream.thresholds),
      };

      // Update data array
      const newData = [...stream.data, newDataPoint].slice(-maxPoints);
      
      // Calculate trend
      const recentValues = newData.slice(-10).map(d => d.value);
      const trend = calculateTrend(recentValues);
      const trendPercentage = calculateTrendPercentage(recentValues);

      return {
        ...stream,
        currentValue: newValue,
        trend,
        trendPercentage,
        status: newDataPoint.status || 'normal',
        data: newData,
      };
    };
    
    intervalRef.current = setInterval(() => {
      setMetricsData(prevData => 
        prevData.map(stream => updateStreamData(stream, maxDataPoints))
      );
      setLastUpdate(new Date());
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsConnected(false);
    };
  }, [updateInterval, maxDataPoints]); // Keep these dependencies but move updateStreamData inside

  const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 1) return 'up';
    if (change < -1) return 'down';
    return 'stable';
  };

  const calculateTrendPercentage = (values: number[]): number => {
    if (values.length < 2) return 0;
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    return Math.round(((lastValue - firstValue) / firstValue) * 100 * 100) / 100;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'warning':
        return 'text-amber-500 bg-amber-50 border-amber-200';
      default:
        return 'text-green-500 bg-green-50 border-green-200';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'orders/hr') {
      return `${Math.round(value)} ${unit}`;
    } else if (unit === 'days') {
      return `${value.toFixed(1)} ${unit}`;
    } else {
      return value.toFixed(1);
    }
  };

  const criticalAlerts = metricsData.filter(stream => stream.status === 'critical');
  const warningAlerts = metricsData.filter(stream => stream.status === 'warning');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            Real-Time Metrics Dashboard
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              <Activity className={`h-4 w-4 ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-sm">{isConnected ? 'Live' : 'Disconnected'}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {showAlerts && (criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Active Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.map(stream => (
              <div key={stream.id} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                <span className="text-sm font-medium text-red-700">{stream.name}</span>
                <span className="text-sm text-red-600">
                  Critical: {formatValue(stream.currentValue, stream.unit)}
                </span>
              </div>
            ))}
            {warningAlerts.map(stream => (
              <div key={stream.id} className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded">
                <span className="text-sm font-medium text-amber-700">{stream.name}</span>
                <span className="text-sm text-amber-600">
                  Warning: {formatValue(stream.currentValue, stream.unit)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricsData.map((stream) => (
          <Card key={stream.id} className={`border ${getStatusColor(stream.status)}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stream.name}
              </CardTitle>
              <div className="flex items-center space-x-1">
                {getTrendIcon(stream.trend)}
                <span className={`text-xs ${
                  stream.trend === 'up' ? 'text-green-500' : 
                  stream.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {stream.trendPercentage > 0 ? '+' : ''}{stream.trendPercentage.toFixed(1)}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Current Value */}
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {formatValue(stream.currentValue, stream.unit)}
                  </span>
                  {stream.target && (
                    <span className="text-xs text-muted-foreground">
                      Target: {formatValue(stream.target, stream.unit)}
                    </span>
                  )}
                </div>

                {/* Sparkline */}
                {showSparklines && stream.data.length > 1 && (
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stream.data}>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={stream.status === 'critical' ? '#ef4444' : 
                                 stream.status === 'warning' ? '#f59e0b' : '#10b981'}
                          fill={stream.status === 'critical' ? '#fef2f2' : 
                               stream.status === 'warning' ? '#fffbeb' : '#f0fdf4'}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Thresholds */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Warning: {formatValue(stream.thresholds.warning, stream.unit)}</span>
                  <span>Critical: {formatValue(stream.thresholds.critical, stream.unit)}</span>
                </div>

                {/* Progress Bar */}
                {stream.target && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress to Target</span>
                      <span>{Math.round((stream.currentValue / stream.target) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          stream.currentValue >= stream.target ? 'bg-green-500' :
                          stream.currentValue >= stream.target * 0.8 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (stream.currentValue / stream.target) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Chart */}
      {metricsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Metrics Timeline (Last {maxDataPoints} Updates)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsData[0]?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number | undefined) => [value?.toFixed(2) || '0', 'Value']}
                  />
                  {metricsData.slice(0, 3).map((stream, index) => (
                    <Line
                      key={stream.id}
                      type="monotone"
                      dataKey="value"
                      data={stream.data}
                      stroke={['#3b82f6', '#10b981', '#f59e0b'][index]}
                      strokeWidth={2}
                      dot={false}
                      name={stream.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{metricsData.length}</div>
              <div className="text-muted-foreground">Active Streams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {metricsData.filter(s => s.status === 'normal').length}
              </div>
              <div className="text-muted-foreground">Normal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">
                {warningAlerts.length}
              </div>
              <div className="text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {criticalAlerts.length}
              </div>
              <div className="text-muted-foreground">Critical</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMetrics;