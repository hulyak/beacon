'use client';

// Modern ROI Optimization Dashboard - Shopify-inspired design
import React, { useState, useEffect } from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernMetricCard, MetricGrid, ComparisonMetric } from '@/components/ui/modern-metric-card';
import { ModernBadge, ModernProgressBadge } from '@/components/ui/modern-badge';
import { ModernTabs } from '@/components/ui/modern-tabs';
import { DashboardPage, DashboardSection, DashboardGrid } from '@/components/layout/modern-dashboard-layout';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Zap,
  RefreshCw,
  Download,
  Filter,
  Play,
  Pause,
  CheckCircle,
  Clock
} from 'lucide-react';

interface ROIData {
  metrics: {
    currentROI: number;
    projectedROI: number;
    costSavings: number;
    efficiency: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    category: 'cost-reduction' | 'efficiency' | 'automation' | 'optimization';
    impact: number;
    investment: number;
    roi: number;
    timeframe: string;
    status: 'identified' | 'in-progress' | 'implemented' | 'rejected';
    priority: 'high' | 'medium' | 'low';
  }>;
  scenarios: Array<{
    id: string;
    name: string;
    description: string;
    investment: number;
    returns: number;
    roi: number;
    paybackPeriod: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  multicriteria: Array<{
    option: string;
    cost: number;
    benefit: number;
    risk: number;
    feasibility: number;
    score: number;
  }>;
}

interface ModernROIDashboardProps {
  className?: string;
  onVoiceCommand?: (command: string) => void;
}

export default function ModernROIDashboard({ 
  className = '', 
  onVoiceCommand 
}: ModernROIDashboardProps) {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchROIData();
  }, []);

  const fetchROIData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData({
        metrics: {
          currentROI: 23.7,
          projectedROI: 31.2,
          costSavings: 1850000,
          efficiency: 78.4
        },
        opportunities: [
          {
            id: 'opp-1',
            title: 'Automated Inventory Management',
            category: 'automation',
            impact: 450000,
            investment: 180000,
            roi: 150,
            timeframe: '6 months',
            status: 'identified',
            priority: 'high'
          },
          {
            id: 'opp-2',
            title: 'Route Optimization Algorithm',
            category: 'optimization',
            impact: 320000,
            investment: 95000,
            roi: 237,
            timeframe: '4 months',
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: 'opp-3',
            title: 'Supplier Consolidation',
            category: 'cost-reduction',
            impact: 280000,
            investment: 45000,
            roi: 522,
            timeframe: '3 months',
            status: 'implemented',
            priority: 'medium'
          },
          {
            id: 'opp-4',
            title: 'Predictive Maintenance',
            category: 'efficiency',
            impact: 380000,
            investment: 150000,
            roi: 153,
            timeframe: '8 months',
            status: 'identified',
            priority: 'medium'
          }
        ],
        scenarios: [
          {
            id: 'scenario-1',
            name: 'Conservative Approach',
            description: 'Low-risk improvements with guaranteed returns',
            investment: 500000,
            returns: 750000,
            roi: 50,
            paybackPeriod: 18,
            riskLevel: 'low'
          },
          {
            id: 'scenario-2',
            name: 'Balanced Strategy',
            description: 'Mix of automation and optimization initiatives',
            investment: 850000,
            returns: 1400000,
            roi: 65,
            paybackPeriod: 14,
            riskLevel: 'medium'
          },
          {
            id: 'scenario-3',
            name: 'Aggressive Transformation',
            description: 'Full digital transformation with AI integration',
            investment: 1200000,
            returns: 2100000,
            roi: 75,
            paybackPeriod: 16,
            riskLevel: 'high'
          }
        ],
        multicriteria: [
          { option: 'AI-Powered Analytics', cost: 8, benefit: 9, risk: 6, feasibility: 7, score: 85 },
          { option: 'Blockchain Integration', cost: 6, benefit: 7, risk: 8, feasibility: 5, score: 65 },
          { option: 'IoT Sensor Network', cost: 7, benefit: 8, risk: 5, feasibility: 8, score: 78 },
          { option: 'Robotic Process Automation', cost: 9, benefit: 9, risk: 4, feasibility: 9, score: 92 }
        ]
      });
    } catch (error) {
      console.error('ROI data fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchROIData();
  };

  if (loading && !data) {
    return (
      <DashboardPage title="ROI Optimization" description="Maximize return on investment opportunities">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600">Loading ROI analysis...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="ROI Optimization"
      description="Identify and maximize return on investment opportunities"
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
            Export Analysis
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
        { label: 'ROI Optimization' }
      ]}
    >
      <ModernTabs defaultValue="overview">
        <ModernTabs.List variant="underline">
          <ModernTabs.Trigger value="overview">Overview</ModernTabs.Trigger>
          <ModernTabs.Trigger value="opportunities">Opportunities</ModernTabs.Trigger>
          <ModernTabs.Trigger value="scenarios">Scenarios</ModernTabs.Trigger>
          <ModernTabs.Trigger value="analysis">Multi-Criteria Analysis</ModernTabs.Trigger>
        </ModernTabs.List>

        <ModernTabs.Content value="overview">
          {/* ROI Metrics */}
          <DashboardSection title="ROI Performance">
            <MetricGrid columns={4}>
              <ModernMetricCard
                title="Current ROI"
                value={data?.metrics.currentROI || 0}
                format="percentage"
                status="positive"
                change={{
                  value: 5.2,
                  period: 'vs last quarter',
                  trend: 'up'
                }}
                icon={<Target size={24} />}
                description="Return on current investments"
                onClick={() => onVoiceCommand?.('explain current ROI')}
              />
              
              <ModernMetricCard
                title="Projected ROI"
                value={data?.metrics.projectedROI || 0}
                format="percentage"
                status="positive"
                change={{
                  value: 7.5,
                  period: 'potential increase',
                  trend: 'up'
                }}
                icon={<TrendingUp size={24} />}
                description="Projected ROI with optimizations"
                onClick={() => onVoiceCommand?.('show ROI projections')}
              />
              
              <ModernMetricCard
                title="Cost Savings"
                value={data?.metrics.costSavings || 0}
                format="currency"
                status="positive"
                icon={<DollarSign size={24} />}
                description="Total identified cost savings"
                onClick={() => onVoiceCommand?.('analyze cost savings')}
              />
              
              <ModernMetricCard
                title="Efficiency Score"
                value={data?.metrics.efficiency || 0}
                format="percentage"
                status="warning"
                change={{
                  value: 12.3,
                  period: 'improvement potential',
                  trend: 'up'
                }}
                icon={<Zap size={24} />}
                description="Current operational efficiency"
                onClick={() => onVoiceCommand?.('show efficiency metrics')}
              />
            </MetricGrid>
          </DashboardSection>

          {/* Top Opportunities */}
          <DashboardSection title="Top ROI Opportunities">
            <ModernCard variant="elevated">
              <ModernCardContent>
                <div className="space-y-4">
                  {data?.opportunities.slice(0, 3).map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onVoiceCommand?.(`analyze opportunity ${opportunity.title}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{opportunity.title}</h3>
                          <ModernBadge
                            variant={
                              opportunity.priority === 'high' ? 'error' :
                              opportunity.priority === 'medium' ? 'warning' : 'info'
                            }
                          >
                            {opportunity.priority} priority
                          </ModernBadge>
                          <ModernBadge
                            variant={
                              opportunity.status === 'implemented' ? 'success' :
                              opportunity.status === 'in-progress' ? 'warning' : 'default'
                            }
                          >
                            {opportunity.status}
                          </ModernBadge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Impact: ${(opportunity.impact / 1000).toFixed(0)}K</span>
                          <span>Investment: ${(opportunity.investment / 1000).toFixed(0)}K</span>
                          <span>ROI: {opportunity.roi}%</span>
                          <span>Timeframe: {opportunity.timeframe}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{opportunity.roi}%</div>
                        <div className="text-xs text-gray-500">ROI</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="opportunities">
          <DashboardSection title="All ROI Opportunities">
            <div className="space-y-4">
              {data?.opportunities.map((opportunity) => (
                <ModernCard key={opportunity.id} variant="elevated">
                  <ModernCardHeader>
                    <div className="flex items-center justify-between">
                      <ModernCardTitle size="sm">{opportunity.title}</ModernCardTitle>
                      <div className="flex items-center gap-2">
                        <ModernBadge
                          variant={
                            opportunity.category === 'automation' ? 'primary' :
                            opportunity.category === 'optimization' ? 'info' :
                            opportunity.category === 'cost-reduction' ? 'success' : 'warning'
                          }
                        >
                          {opportunity.category}
                        </ModernBadge>
                        <ModernBadge
                          variant={
                            opportunity.priority === 'high' ? 'error' :
                            opportunity.priority === 'medium' ? 'warning' : 'info'
                          }
                        >
                          {opportunity.priority}
                        </ModernBadge>
                      </div>
                    </div>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Expected Impact</div>
                        <div className="text-lg font-semibold text-green-600">
                          ${(opportunity.impact / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Investment Required</div>
                        <div className="text-lg font-semibold text-gray-900">
                          ${(opportunity.investment / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">ROI</div>
                        <div className="text-lg font-semibold text-blue-600">{opportunity.roi}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Timeframe</div>
                        <div className="text-lg font-semibold text-gray-900">{opportunity.timeframe}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <ModernProgressBadge
                        progress={
                          opportunity.status === 'implemented' ? 100 :
                          opportunity.status === 'in-progress' ? 60 :
                          opportunity.status === 'identified' ? 20 : 0
                        }
                        variant={
                          opportunity.status === 'implemented' ? 'success' :
                          opportunity.status === 'in-progress' ? 'warning' : 'primary'
                        }
                      />
                      
                      <div className="flex gap-2">
                        {opportunity.status === 'identified' && (
                          <ModernButton
                            variant="primary"
                            size="sm"
                            icon={<Play size={16} />}
                          >
                            Start Implementation
                          </ModernButton>
                        )}
                        {opportunity.status === 'in-progress' && (
                          <ModernButton
                            variant="outline"
                            size="sm"
                            icon={<Pause size={16} />}
                          >
                            Pause
                          </ModernButton>
                        )}
                        <ModernButton
                          variant="ghost"
                          size="sm"
                        >
                          View Details
                        </ModernButton>
                      </div>
                    </div>
                  </ModernCardContent>
                </ModernCard>
              ))}
            </div>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="scenarios">
          <DashboardSection title="Investment Scenarios">
            <DashboardGrid columns={1}>
              {data?.scenarios.map((scenario) => (
                <ModernCard key={scenario.id} variant="elevated">
                  <ModernCardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <ModernCardTitle size="sm">{scenario.name}</ModernCardTitle>
                        <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                      </div>
                      <ModernBadge
                        variant={
                          scenario.riskLevel === 'low' ? 'success' :
                          scenario.riskLevel === 'medium' ? 'warning' : 'error'
                        }
                      >
                        {scenario.riskLevel} risk
                      </ModernBadge>
                    </div>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <ComparisonMetric
                        title="Investment"
                        current={{ label: 'Required', value: scenario.investment, format: 'currency' }}
                        previous={{ label: 'Budget', value: 1500000, format: 'currency' }}
                      />
                      <ComparisonMetric
                        title="Returns"
                        current={{ label: 'Expected', value: scenario.returns, format: 'currency' }}
                        previous={{ label: 'Minimum', value: scenario.investment * 1.2, format: 'currency' }}
                      />
                      <div>
                        <div className="text-sm text-gray-600 mb-1">ROI</div>
                        <div className="text-2xl font-bold text-green-600">{scenario.roi}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Payback Period</div>
                        <div className="text-2xl font-bold text-blue-600">{scenario.paybackPeriod}m</div>
                      </div>
                    </div>
                  </ModernCardContent>
                </ModernCard>
              ))}
            </DashboardGrid>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="analysis">
          <DashboardSection title="Multi-Criteria Decision Analysis">
            <ModernCard variant="elevated">
              <ModernCardContent>
                <div className="space-y-4">
                  {data?.multicriteria.map((option, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{option.option}</h3>
                        <div className="text-2xl font-bold text-blue-600">{option.score}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Cost Efficiency</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${option.cost * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{option.cost}/10</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Benefit Impact</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${option.benefit * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{option.benefit}/10</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Risk Level</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${option.risk * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{option.risk}/10</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Feasibility</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${option.feasibility * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{option.feasibility}/10</span>
                          </div>
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