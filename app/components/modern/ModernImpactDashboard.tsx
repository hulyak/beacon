'use client';

// Modern Impact Assessment Dashboard - Shopify-inspired design
import React, { useState, useEffect } from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernMetricCard, MetricGrid, ComparisonMetric } from '@/components/ui/modern-metric-card';
import { ModernBadge, ModernStatusBadge } from '@/components/ui/modern-badge';
import { ModernTabs } from '@/components/ui/modern-tabs';
import { DashboardPage, DashboardSection, DashboardGrid } from '@/components/layout/modern-dashboard-layout';
import { cn } from '@/lib/utils';
import { 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Clock,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Target,
  Activity
} from 'lucide-react';

interface ImpactData {
  financial: {
    totalImpact: number;
    riskExposure: number;
    potentialSavings: number;
    costAvoidance: number;
  };
  operational: {
    delayedShipments: number;
    affectedRoutes: number;
    cascadeEffects: number;
    recoveryTime: number;
  };
  scenarios: Array<{
    id: string;
    name: string;
    probability: number;
    impact: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'monitoring' | 'resolved';
  }>;
  kpis: Array<{
    metric: string;
    current: number;
    target: number;
    trend: 'up' | 'down' | 'neutral';
    status: 'good' | 'warning' | 'critical';
  }>;
}

interface ModernImpactDashboardProps {
  className?: string;
  onVoiceCommand?: (command: string) => void;
}

export default function ModernImpactDashboard({ 
  className = '', 
  onVoiceCommand 
}: ModernImpactDashboardProps) {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    fetchImpactData();
  }, []);

  const fetchImpactData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData({
        financial: {
          totalImpact: 2450000,
          riskExposure: 15.7,
          potentialSavings: 890000,
          costAvoidance: 1200000
        },
        operational: {
          delayedShipments: 23,
          affectedRoutes: 7,
          cascadeEffects: 3,
          recoveryTime: 4.2
        },
        scenarios: [
          {
            id: 'scenario-1',
            name: 'Supplier Disruption - Asia Pacific',
            probability: 78,
            impact: 85,
            severity: 'high',
            status: 'active'
          },
          {
            id: 'scenario-2',
            name: 'Port Congestion - West Coast',
            probability: 45,
            impact: 62,
            severity: 'medium',
            status: 'monitoring'
          },
          {
            id: 'scenario-3',
            name: 'Weather Impact - Northeast',
            probability: 32,
            impact: 41,
            severity: 'low',
            status: 'resolved'
          }
        ],
        kpis: [
          { metric: 'On-Time Delivery', current: 94.2, target: 96.0, trend: 'down', status: 'warning' },
          { metric: 'Cost Efficiency', current: 87.5, target: 90.0, trend: 'up', status: 'good' },
          { metric: 'Risk Score', current: 23.1, target: 20.0, trend: 'up', status: 'critical' },
          { metric: 'Recovery Time', current: 4.2, target: 3.5, trend: 'down', status: 'good' }
        ]
      });
    } catch (error) {
      console.error('Impact data fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchImpactData();
  };

  if (loading && !data) {
    return (
      <DashboardPage title="Impact Assessment" description="Analyze supply chain disruption impacts">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Loading impact analysis...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="Impact Assessment"
      description="Comprehensive analysis of supply chain disruption impacts"
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
            icon={<Download size={16} />}
          >
            Export Report
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
        { label: 'Impact Assessment' }
      ]}
    >
      <ModernTabs defaultValue="overview" onValueChange={setActiveTab}>
        <ModernTabs.List variant="underline">
          <ModernTabs.Trigger value="overview">Overview</ModernTabs.Trigger>
          <ModernTabs.Trigger value="financial">Financial Impact</ModernTabs.Trigger>
          <ModernTabs.Trigger value="operational">Operational Impact</ModernTabs.Trigger>
          <ModernTabs.Trigger value="scenarios">Risk Scenarios</ModernTabs.Trigger>
        </ModernTabs.List>

        <ModernTabs.Content value="overview">
          {/* Financial Impact Metrics */}
          <DashboardSection title="Financial Impact">
            <MetricGrid columns={4}>
              <ModernMetricCard
                title="Total Impact"
                value={data?.financial.totalImpact || 0}
                format="currency"
                status="negative"
                icon={<DollarSign size={24} />}
                description="Estimated financial impact from disruptions"
                onClick={() => onVoiceCommand?.('explain total financial impact')}
              />
              
              <ModernMetricCard
                title="Risk Exposure"
                value={data?.financial.riskExposure || 0}
                format="percentage"
                status="warning"
                icon={<AlertTriangle size={24} />}
                description="Current risk exposure level"
                onClick={() => onVoiceCommand?.('analyze risk exposure')}
              />
              
              <ModernMetricCard
                title="Potential Savings"
                value={data?.financial.potentialSavings || 0}
                format="currency"
                status="positive"
                icon={<Target size={24} />}
                description="Identified optimization opportunities"
                onClick={() => onVoiceCommand?.('show savings opportunities')}
              />
              
              <ModernMetricCard
                title="Cost Avoidance"
                value={data?.financial.costAvoidance || 0}
                format="currency"
                status="positive"
                icon={<TrendingDown size={24} />}
                description="Costs avoided through proactive measures"
                onClick={() => onVoiceCommand?.('explain cost avoidance')}
              />
            </MetricGrid>
          </DashboardSection>

          {/* Operational Impact Metrics */}
          <DashboardSection title="Operational Impact">
            <MetricGrid columns={4}>
              <ModernMetricCard
                title="Delayed Shipments"
                value={data?.operational.delayedShipments || 0}
                format="number"
                status="negative"
                icon={<Clock size={24} />}
                description="Number of shipments experiencing delays"
                onClick={() => onVoiceCommand?.('show delayed shipments')}
              />
              
              <ModernMetricCard
                title="Affected Routes"
                value={data?.operational.affectedRoutes || 0}
                format="number"
                status="warning"
                icon={<Activity size={24} />}
                description="Supply chain routes currently impacted"
                onClick={() => onVoiceCommand?.('analyze affected routes')}
              />
              
              <ModernMetricCard
                title="Cascade Effects"
                value={data?.operational.cascadeEffects || 0}
                format="number"
                status="negative"
                icon={<AlertTriangle size={24} />}
                description="Secondary impacts detected"
                onClick={() => onVoiceCommand?.('explain cascade effects')}
              />
              
              <ModernMetricCard
                title="Recovery Time"
                value={data?.operational.recoveryTime || 0}
                format="number"
                status="neutral"
                icon={<RefreshCw size={24} />}
                description="Average time to recover from disruptions"
                onClick={() => onVoiceCommand?.('show recovery metrics')}
              />
            </MetricGrid>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="scenarios">
          <DashboardSection title="Active Risk Scenarios">
            <ModernCard variant="elevated">
              <ModernCardContent>
                <div className="space-y-4">
                  {data?.scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onVoiceCommand?.(`analyze scenario ${scenario.name}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                          <ModernStatusBadge
                            status={scenario.status === 'active' ? 'error' : scenario.status === 'monitoring' ? 'warning' : 'success'}
                          >
                            {scenario.status}
                          </ModernStatusBadge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Probability: {scenario.probability}%</span>
                          <span>Impact: {scenario.impact}%</span>
                          <ModernBadge
                            variant={
                              scenario.severity === 'critical' ? 'error' :
                              scenario.severity === 'high' ? 'warning' :
                              scenario.severity === 'medium' ? 'info' : 'default'
                            }
                          >
                            {scenario.severity} severity
                          </ModernBadge>
                        </div>
                      </div>
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={16} />}
                      >
                        Details
                      </ModernButton>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="financial">
          <DashboardGrid columns={2}>
            <ModernCard variant="elevated">
              <ModernCardHeader>
                <ModernCardTitle>Financial Impact Breakdown</ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent>
                <div className="space-y-4">
                  <ComparisonMetric
                    title="Direct Costs"
                    current={{ label: 'Current', value: 1200000, format: 'currency' }}
                    previous={{ label: 'Projected', value: 950000, format: 'currency' }}
                  />
                  <ComparisonMetric
                    title="Indirect Costs"
                    current={{ label: 'Current', value: 850000, format: 'currency' }}
                    previous={{ label: 'Projected', value: 720000, format: 'currency' }}
                  />
                  <ComparisonMetric
                    title="Opportunity Costs"
                    current={{ label: 'Current', value: 400000, format: 'currency' }}
                    previous={{ label: 'Projected', value: 280000, format: 'currency' }}
                  />
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard variant="elevated">
              <ModernCardHeader>
                <ModernCardTitle>Cost Categories</ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent>
                <div className="space-y-3">
                  {[
                    { category: 'Inventory Holding', amount: 680000, percentage: 28 },
                    { category: 'Transportation', amount: 520000, percentage: 21 },
                    { category: 'Labor Overtime', amount: 450000, percentage: 18 },
                    { category: 'Expedited Shipping', amount: 380000, percentage: 16 },
                    { category: 'Storage & Handling', amount: 420000, percentage: 17 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">${(item.amount / 1000).toFixed(0)}K</span>
                        <span className="text-xs text-gray-500">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>
          </DashboardGrid>
        </ModernTabs.Content>

        <ModernTabs.Content value="operational">
          <DashboardSection title="Key Performance Indicators">
            <ModernCard variant="elevated">
              <ModernCardContent>
                <div className="space-y-4">
                  {data?.kpis.map((kpi, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-gray-900">{kpi.metric}</h4>
                          <ModernStatusBadge
                            status={kpi.status === 'good' ? 'success' : kpi.status === 'warning' ? 'warning' : 'error'}
                          >
                            {kpi.status}
                          </ModernStatusBadge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Current: {kpi.current}{kpi.metric.includes('Time') ? 'hrs' : '%'}</span>
                          <span>Target: {kpi.target}{kpi.metric.includes('Time') ? 'hrs' : '%'}</span>
                          <span className={cn(
                            'flex items-center gap-1',
                            kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          )}>
                            {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'} {kpi.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>
          </DashboardSection>
        </ModernTabs.Content>
      </ModernTabs>
    </DashboardPage>
  );
}