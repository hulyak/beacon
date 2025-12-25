'use client';

// Modern AI Explainability Dashboard - Shopify-inspired design
import React, { useState, useEffect } from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernMetricCard, MetricGrid, ComparisonMetric } from '@/components/ui/modern-metric-card';
import { ModernBadge, ModernStatusBadge } from '@/components/ui/modern-badge';
import { ModernTabs } from '@/components/ui/modern-tabs';
import { DashboardPage, DashboardSection, DashboardGrid } from '@/components/layout/modern-dashboard-layout';
import { 
  Brain, 
  Eye, 
  Target, 
  TrendingUp,
  RefreshCw,
  Download,
  Filter,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface ExplainabilityData {
  confidence: {
    overall: number;
    predictions: number;
    recommendations: number;
    decisions: number;
  };
  explanations: Array<{
    id: string;
    type: 'prediction' | 'recommendation' | 'decision';
    title: string;
    confidence: number;
    explanation: string;
    factors: Array<{
      name: string;
      impact: number;
      direction: 'positive' | 'negative' | 'neutral';
    }>;
    timestamp: Date;
  }>;
  agents: Array<{
    id: string;
    name: string;
    type: string;
    contributions: number;
    accuracy: number;
    status: 'active' | 'inactive' | 'training';
  }>;
  decisionTrees: Array<{
    id: string;
    scenario: string;
    depth: number;
    accuracy: number;
    nodes: number;
  }>;
}

interface ModernExplainabilityDashboardProps {
  className?: string;
  onVoiceCommand?: (command: string) => void;
}

export default function ModernExplainabilityDashboard({ 
  className = '', 
  onVoiceCommand 
}: ModernExplainabilityDashboardProps) {
  const [data, setData] = useState<ExplainabilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchExplainabilityData();
  }, []);

  const fetchExplainabilityData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData({
        confidence: {
          overall: 87.3,
          predictions: 92.1,
          recommendations: 84.7,
          decisions: 89.2
        },
        explanations: [
          {
            id: 'exp-1',
            type: 'prediction',
            title: 'Delivery Delay Prediction - Route A23',
            confidence: 89,
            explanation: 'High probability of delay due to weather conditions and increased traffic volume',
            factors: [
              { name: 'Weather Conditions', impact: 45, direction: 'negative' },
              { name: 'Traffic Volume', impact: 32, direction: 'negative' },
              { name: 'Historical Performance', impact: 23, direction: 'positive' }
            ],
            timestamp: new Date()
          },
          {
            id: 'exp-2',
            type: 'recommendation',
            title: 'Alternative Route Suggestion',
            confidence: 76,
            explanation: 'Route B15 recommended based on current conditions and historical data',
            factors: [
              { name: 'Distance Efficiency', impact: 38, direction: 'positive' },
              { name: 'Traffic Patterns', impact: 35, direction: 'positive' },
              { name: 'Cost Impact', impact: 27, direction: 'neutral' }
            ],
            timestamp: new Date()
          }
        ],
        agents: [
          {
            id: 'agent-1',
            name: 'Predictive Analytics Agent',
            type: 'ML Model',
            contributions: 342,
            accuracy: 94.2,
            status: 'active'
          },
          {
            id: 'agent-2',
            name: 'Route Optimization Agent',
            type: 'Algorithm',
            contributions: 287,
            accuracy: 88.7,
            status: 'active'
          },
          {
            id: 'agent-3',
            name: 'Risk Assessment Agent',
            type: 'Neural Network',
            contributions: 156,
            accuracy: 91.3,
            status: 'training'
          }
        ],
        decisionTrees: [
          {
            id: 'tree-1',
            scenario: 'Supplier Selection',
            depth: 7,
            accuracy: 92.4,
            nodes: 45
          },
          {
            id: 'tree-2',
            scenario: 'Route Planning',
            depth: 5,
            accuracy: 88.9,
            nodes: 32
          },
          {
            id: 'tree-3',
            scenario: 'Risk Mitigation',
            depth: 6,
            accuracy: 90.1,
            nodes: 38
          }
        ]
      });
    } catch (error) {
      console.error('Explainability data fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchExplainabilityData();
  };

  if (loading && !data) {
    return (
      <DashboardPage title="AI Explainability" description="Understand AI decision-making processes">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600">Loading explainability data...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="AI Explainability"
      description="Understand and interpret AI decision-making processes"
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
        { label: 'AI Explainability' }
      ]}
    >
      <ModernTabs defaultValue="overview">
        <ModernTabs.List variant="underline">
          <ModernTabs.Trigger value="overview">Overview</ModernTabs.Trigger>
          <ModernTabs.Trigger value="explanations">Explanations</ModernTabs.Trigger>
          <ModernTabs.Trigger value="agents">AI Agents</ModernTabs.Trigger>
          <ModernTabs.Trigger value="decisions">Decision Trees</ModernTabs.Trigger>
        </ModernTabs.List>

        <ModernTabs.Content value="overview">
          {/* Confidence Metrics */}
          <DashboardSection title="AI Confidence Levels">
            <MetricGrid columns={4}>
              <ModernMetricCard
                title="Overall Confidence"
                value={data?.confidence.overall || 0}
                format="percentage"
                status="positive"
                icon={<Brain size={24} />}
                description="Average confidence across all AI decisions"
                onClick={() => onVoiceCommand?.('explain overall confidence')}
              />
              
              <ModernMetricCard
                title="Predictions"
                value={data?.confidence.predictions || 0}
                format="percentage"
                status="positive"
                icon={<TrendingUp size={24} />}
                description="Confidence in predictive analytics"
                onClick={() => onVoiceCommand?.('show prediction accuracy')}
              />
              
              <ModernMetricCard
                title="Recommendations"
                value={data?.confidence.recommendations || 0}
                format="percentage"
                status="warning"
                icon={<Target size={24} />}
                description="Confidence in AI recommendations"
                onClick={() => onVoiceCommand?.('analyze recommendations')}
              />
              
              <ModernMetricCard
                title="Decisions"
                value={data?.confidence.decisions || 0}
                format="percentage"
                status="positive"
                icon={<CheckCircle size={24} />}
                description="Confidence in automated decisions"
                onClick={() => onVoiceCommand?.('review decision accuracy')}
              />
            </MetricGrid>
          </DashboardSection>

          {/* Recent Explanations */}
          <DashboardSection title="Recent AI Explanations">
            <ModernCard variant="elevated">
              <ModernCardContent>
                <div className="space-y-4">
                  {data?.explanations.slice(0, 3).map((explanation) => (
                    <div
                      key={explanation.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onVoiceCommand?.(`explain ${explanation.title}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{explanation.title}</h3>
                            <ModernBadge
                              variant={
                                explanation.type === 'prediction' ? 'primary' :
                                explanation.type === 'recommendation' ? 'info' : 'success'
                              }
                            >
                              {explanation.type}
                            </ModernBadge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{explanation.explanation}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">{explanation.confidence}%</div>
                          <div className="text-xs text-gray-500">confidence</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Key Factors:</h4>
                        {explanation.factors.slice(0, 2).map((factor, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{factor.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`${
                                factor.direction === 'positive' ? 'text-green-600' :
                                factor.direction === 'negative' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {factor.direction === 'positive' ? '↗' : factor.direction === 'negative' ? '↘' : '→'}
                              </span>
                              <span className="font-medium">{factor.impact}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="explanations">
          <DashboardSection title="Detailed Explanations">
            <div className="space-y-4">
              {data?.explanations.map((explanation) => (
                <ModernCard key={explanation.id} variant="elevated">
                  <ModernCardHeader>
                    <div className="flex items-center justify-between">
                      <ModernCardTitle size="sm">{explanation.title}</ModernCardTitle>
                      <div className="flex items-center gap-2">
                        <ModernBadge
                          variant={
                            explanation.type === 'prediction' ? 'primary' :
                            explanation.type === 'recommendation' ? 'info' : 'success'
                          }
                        >
                          {explanation.type}
                        </ModernBadge>
                        <span className="text-lg font-semibold text-gray-900">{explanation.confidence}%</span>
                      </div>
                    </div>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <p className="text-gray-700 mb-4">{explanation.explanation}</p>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Contributing Factors:</h4>
                      {explanation.factors.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">{factor.name}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className={`${
                                factor.direction === 'positive' ? 'text-green-600' :
                                factor.direction === 'negative' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {factor.direction === 'positive' ? '↗' : factor.direction === 'negative' ? '↘' : '→'}
                              </span>
                              <span className="text-sm text-gray-600">{factor.direction}</span>
                            </div>
                            <span className="font-semibold">{factor.impact}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ModernCardContent>
                </ModernCard>
              ))}
            </div>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="agents">
          <DashboardSection title="AI Agent Performance">
            <DashboardGrid columns={1}>
              <ModernCard variant="elevated">
                <ModernCardContent>
                  <div className="space-y-4">
                    {data?.agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => onVoiceCommand?.(`analyze agent ${agent.name}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                            <ModernStatusBadge
                              status={agent.status === 'active' ? 'success' : agent.status === 'training' ? 'warning' : 'offline'}
                            >
                              {agent.status}
                            </ModernStatusBadge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Type: {agent.type}</span>
                            <span>Contributions: {agent.contributions}</span>
                            <span>Accuracy: {agent.accuracy}%</span>
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
            </DashboardGrid>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="decisions">
          <DashboardSection title="Decision Tree Analysis">
            <DashboardGrid columns={2}>
              {data?.decisionTrees.map((tree) => (
                <ModernCard key={tree.id} variant="elevated">
                  <ModernCardHeader>
                    <ModernCardTitle size="sm">{tree.scenario}</ModernCardTitle>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="space-y-3">
                      <ComparisonMetric
                        title="Accuracy"
                        current={{ label: 'Current', value: tree.accuracy, format: 'percentage' }}
                        previous={{ label: 'Target', value: 95, format: 'percentage' }}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tree Depth</span>
                        <span className="font-medium">{tree.depth} levels</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Decision Nodes</span>
                        <span className="font-medium">{tree.nodes} nodes</span>
                      </div>
                    </div>
                  </ModernCardContent>
                </ModernCard>
              ))}
            </DashboardGrid>
          </DashboardSection>
        </ModernTabs.Content>
      </ModernTabs>
    </DashboardPage>
  );
}