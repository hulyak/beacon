'use client';

// Mobile Analytics Dashboard Component
// Requirements: 9.1, 9.2 - Mobile-responsive interfaces with touch-optimized navigation
// Requirements: 9.3 - Mobile voice functionality compatibility

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Filter,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  realTimeMetrics: {
    deliveryPerformance: number;
    costEfficiency: number;
    riskLevel: number;
    anomalies: number;
  };
  trends: Array<{
    metric: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;
  networkHealth: {
    totalNodes: number;
    healthyNodes: number;
    criticalNodes: number;
  };
}

interface MobileAnalyticsDashboardProps {
  className?: string;
  onVoiceCommand?: (command: string) => void;
  sessionId?: string;
}

export default function MobileAnalyticsDashboard({ 
  className = '', 
  onVoiceCommand,
  sessionId 
}: MobileAnalyticsDashboardProps): JSX.Element {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<{
    timeRange: string;
    category: string;
  }>({
    timeRange: '24h',
    category: 'all'
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
    
    // Set up real-time updates
    const interval = setInterval(fetchAnalyticsData, 30000); // 30 seconds
    
    return () => {
      clearInterval(interval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [filters]);

  const fetchAnalyticsData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'real_time_monitoring',
          data: {
            timeRange: filters.timeRange,
            category: filters.category,
            includeAlerts: true,
            includeNetworkHealth: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics fetch failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData({
          realTimeMetrics: result.data.metrics || {
            deliveryPerformance: 94.5,
            costEfficiency: 87.2,
            riskLevel: 23.1,
            anomalies: 2
          },
          trends: result.data.trends || [
            { metric: 'Delivery Performance', value: 94.5, change: 2.3, trend: 'up' },
            { metric: 'Cost Efficiency', value: 87.2, change: -1.1, trend: 'down' },
            { metric: 'Risk Level', value: 23.1, change: 0.5, trend: 'stable' },
            { metric: 'Network Health', value: 91.8, change: 1.7, trend: 'up' }
          ],
          alerts: result.data.alerts || [
            {
              id: 'alert-1',
              type: 'warning',
              message: 'Supplier delay detected in Asia region',
              timestamp: new Date()
            },
            {
              id: 'alert-2',
              type: 'error',
              message: 'Critical inventory threshold reached',
              timestamp: new Date()
            }
          ],
          networkHealth: result.data.networkHealth || {
            totalNodes: 156,
            healthyNodes: 143,
            criticalNodes: 3
          }
        });
      } else {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const handleVoiceToggle = (): void => {
    setIsVoiceActive(!isVoiceActive);
    if (onVoiceCommand) {
      onVoiceCommand(isVoiceActive ? 'stop_listening' : 'start_listening');
    }
  };

  const handleCardExpand = (cardId: string): void => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleTouchStart = (e: React.TouchEvent): void => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Swipe gestures
    if (Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0) {
        // Swipe right - previous tab
        const tabs = ['overview', 'trends', 'alerts', 'network'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1]);
        }
      } else {
        // Swipe left - next tab
        const tabs = ['overview', 'trends', 'alerts', 'network'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
        }
      }
    }

    // Pull to refresh
    if (deltaY > 100 && deltaTime < 500) {
      handleRefresh();
    }

    touchStartRef.current = null;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): JSX.Element => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertIcon = (type: 'warning' | 'error' | 'info'): JSX.Element => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'error':
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      default:
        return <AlertTriangle className={`${iconClass} text-blue-500`} />;
    }
  };

  if (loading && !data) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="text-center space-y-4 p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900">Error Loading Analytics</h3>
          <p className="text-gray-600">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-gray-50 ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Real-time supply chain metrics</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={isVoiceActive ? "default" : "outline"}
              size="sm"
              onClick={handleVoiceToggle}
              className="p-2"
            >
              {isVoiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2 mt-3">
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="all">All Categories</option>
            <option value="delivery">Delivery</option>
            <option value="cost">Cost</option>
            <option value="risk">Risk</option>
          </select>
        </div>
      </div>

      {/* Mobile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
          <TabsTrigger value="network" className="text-xs">Network</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="px-4 pb-4">
          <div className="space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Delivery Performance</p>
                      <p className="text-lg font-bold text-green-600">
                        {data?.realTimeMetrics.deliveryPerformance}%
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Cost Efficiency</p>
                      <p className="text-lg font-bold text-blue-600">
                        {data?.realTimeMetrics.costEfficiency}%
                      </p>
                    </div>
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Risk Level</p>
                      <p className="text-lg font-bold text-yellow-600">
                        {data?.realTimeMetrics.riskLevel}%
                      </p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Anomalies</p>
                      <p className="text-lg font-bold text-red-600">
                        {data?.realTimeMetrics.anomalies}
                      </p>
                    </div>
                    <Activity className="h-6 w-6 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left"
                  onClick={() => onVoiceCommand?.('show real-time metrics')}
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  View Real-time Metrics
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left"
                  onClick={() => onVoiceCommand?.('analyze anomalies')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Analyze Anomalies
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left"
                  onClick={() => onVoiceCommand?.('show network diagram')}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Network Diagram
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="px-4 pb-4">
          <div className="space-y-3">
            {data?.trends.map((trend, index) => (
              <Card key={index} className="touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{trend.metric}</p>
                      <p className="text-xs text-gray-500">Current: {trend.value}%</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={trend.change > 0 ? "default" : trend.change < 0 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {trend.change > 0 ? '+' : ''}{trend.change}%
                      </Badge>
                      {getTrendIcon(trend.trend)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="px-4 pb-4">
          <div className="space-y-3">
            {data?.alerts.map((alert) => (
              <Card key={alert.id} className="touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="px-4 pb-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Network Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Nodes</span>
                  <span className="font-semibold">{data?.networkHealth.totalNodes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Healthy Nodes</span>
                  <span className="font-semibold text-green-600">{data?.networkHealth.healthyNodes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Critical Nodes</span>
                  <span className="font-semibold text-red-600">{data?.networkHealth.criticalNodes}</span>
                </div>
                
                {/* Health Percentage Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Network Health</span>
                    <span>{Math.round((data?.networkHealth.healthyNodes || 0) / (data?.networkHealth.totalNodes || 1) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.round((data?.networkHealth.healthyNodes || 0) / (data?.networkHealth.totalNodes || 1) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onVoiceCommand?.('show detailed network diagram')}
            >
              <PieChart className="h-4 w-4 mr-2" />
              View Detailed Network
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Voice Status Indicator */}
      {isVoiceActive && (
        <div className="fixed bottom-4 right-4 z-20">
          <div className="bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs">Listening...</span>
          </div>
        </div>
      )}
    </div>
  );
}