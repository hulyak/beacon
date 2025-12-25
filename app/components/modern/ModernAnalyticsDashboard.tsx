'use client';

// Modern Analytics Dashboard - Shopify-inspired design
import React, { useState, useEffect } from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernMetricCard, MetricGrid, ComparisonMetric } from '@/components/ui/modern-metric-card';
import { DashboardPage, DashboardSection, DashboardGrid } from '@/components/layout/modern-dashboard-layout';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  Eye,
  Zap
} from 'lucide-react';

interface AnalyticsData {
  metrics: {
    deliveryPerformance: number;
    costEfficiency: number;
    riskLevel: number;
    anomalies: number;
  };
  trends: Array<{
    metric: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface ModernAnalyticsDashboardProps {
  className?: string;
  onVoiceCommand?: (command: string) => void;
}

export default function ModernAnalyticsDashboard({ 
  className = '', 
  onVoiceCommand 
}: ModernAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('7d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData({
        metrics: {
          deliveryPerformance: 94.5,
          costEfficiency: 87.2,
          riskLevel: 23.1,
          anomalies: 2
        },
        trends: [
          { metric: 'Delivery Performance', current: 94.5, previous: 92.2, change: 2.3, trend: 'up' },
          { metric: 'Cost Efficiency', current: 87.2, previous: 88.3, change: -1.1, trend: 'down' },
          { metric: 'Risk Level', current: 23.1, previous: 22.6, change: 0.5, trend: 'up' },
          { metric: 'Network Health', current: 91.8, previous: 90.1, change: 1.7, trend: 'up' }
        ],
        alerts: [
          {
            id: 'alert-1',
            type: 'warning',
            message: 'Supplier delay detected in Asia region',
            timestamp: new Date(),
            severity: 'medium'
          },
          {
            id: 'alert-2',
            type: 'error',
            message: 'Critical inventory threshold reached',
            timestamp: new Date(),
            severity: 'high'
          }
        ]
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  if (loading && !data) {
    return (
      <DashboardPage title="Analytics" description="Real-time supply chain intelligence">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="Analytics Dashboard"
      description="Real-time insights into your supply chain performance"
      actions={
        <>
          <ModernButton
            variant="outline"
            size="sm"
            icon={<Filter size={16} />}
          >
            Filter
          </ModernButton>
          <ModernButton
            variant="outline"
            size="sm"
            icon={<Calendar size={16} />}
          >
            {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
          </ModernButton>
          <ModernButton
            variant="outline"
            size="sm"
            icon={<Download size={16} />}
          >
            Export
          </ModernButton>
          <ModernButton
            variant="primary"
            size="sm"
            icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </ModernButton>
        </>
      }
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Analytics' }
      ]}
    >
      {/* Key Metrics */}
      <DashboardSection title="Key Performance Indicators">
        <MetricGrid columns={4}>
          <ModernMetricCard
            title="Delivery Performance"
            value={data?.metrics.deliveryPerformance || 0}
            format="percentage"
            status="positive"
            change={{
              value: 2.3,
              period: 'vs last week',
              trend: 'up'
            }}
            icon={<TrendingUp size={24} />}
            description="Percentage of on-time deliveries"
            onClick={() => onVoiceCommand?.('show delivery performance details')}
          />
          
          <ModernMetricCard
            title="Cost Efficiency"
            value={data?.metrics.costEfficiency || 0}
            format="percentage"
            status="warning"
            change={{
              value: -1.1,
              period: 'vs last week',
              trend: 'down'
            }}
            icon={<BarChart3 size={24} />}
            description="Overall cost optimization score"
            onClick={() => onVoiceCommand?.('analyze cost efficiency')}
          />
          
          <ModernMetricCard
            title="Risk Level"
            value={data?.metrics.riskLevel || 0}
            format="percentage"
            status="negative"
            change={{
              value: 0.5,
              period: 'vs last week',
              trend: 'up'
            }}
            icon={<AlertTriangle size={24} />}
            description="Current supply chain risk exposure"
            onClick={() => onVoiceCommand?.('show risk analysis')}
          />
          
          <ModernMetricCard
            title="Active Anomalies"
            value={data?.metrics.anomalies || 0}
            format="number"
            status="neutral"
            icon={<Activity size={24} />}
            description="Number of detected anomalies requiring attention"
            onClick={() => onVoiceCommand?.('show anomaly details')}
          />
        </MetricGrid>
      </DashboardSection>

      <DashboardGrid columns={2}>
        {/* Trend Analysis */}
        <ModernCard variant="elevated" className="col-span-1">
          <ModernCardHeader>
            <ModernCardTitle>Performance Trends</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent>
            <div className="space-y-4">
              {data?.trends.map((trend, index) => (
                <ComparisonMetric
                  key={index}
                  title={trend.metric}
                  current={{
                    label: 'Current',
                    value: trend.current,
                    format: trend.metric.includes('Performance') || trend.metric.includes('Health') ? 'percentage' : 'number'
                  }}
                  previous={{
                    label: 'Previous',
                    value: trend.previous,
                    format: trend.metric.includes('Performance') || trend.metric.includes('Health') ? 'percentage' : 'number'
                  }}
                />
              ))}
            </div>
          </ModernCardContent>
        </ModernCard>

        {/* Active Alerts */}
        <ModernCard variant="elevated" className="col-span-1">
          <ModernCardHeader>
            <div className="flex items-center justify-between">
              <ModernCardTitle>Active Alerts</ModernCardTitle>
              <ModernButton
                variant="ghost"
                size="sm"
                icon={<Eye size={16} />}
              >
                View All
              </ModernButton>
            </div>
          </ModernCardHeader>
          <ModernCardContent>
            <div className="space-y-3">
              {data?.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onVoiceCommand?.(`explain alert ${alert.id}`)}
                >
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {alert.severity} priority
                      </span>
                      <span className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ModernCardContent>
        </ModernCard>
      </DashboardGrid>

      {/* Quick Actions */}
      <DashboardSection title="Quick Actions">
        <DashboardGrid columns={3}>
          <ModernCard hover onClick={() => onVoiceCommand?.('run impact analysis')}>
            <ModernCardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Impact Analysis</h3>
                  <p className="text-sm text-gray-600">Analyze potential disruption impacts</p>
                </div>
              </div>
            </ModernCardContent>
          </ModernCard>

          <ModernCard hover onClick={() => onVoiceCommand?.('optimize supply chain')}>
            <ModernCardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Zap className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Optimization</h3>
                  <p className="text-sm text-gray-600">Find ROI optimization opportunities</p>
                </div>
              </div>
            </ModernCardContent>
          </ModernCard>

          <ModernCard hover onClick={() => onVoiceCommand?.('check sustainability metrics')}>
            <ModernCardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <Activity className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sustainability</h3>
                  <p className="text-sm text-gray-600">Review environmental impact</p>
                </div>
              </div>
            </ModernCardContent>
          </ModernCard>
        </DashboardGrid>
      </DashboardSection>
    </DashboardPage>
  );
}