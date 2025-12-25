'use client';

// Modern Sustainability Dashboard - Shopify-inspired design
import React, { useState, useEffect } from 'react';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernMetricCard, MetricGrid, ComparisonMetric } from '@/components/ui/modern-metric-card';
import { ModernBadge } from '@/components/ui/modern-badge';
import { ModernTabs } from '@/components/ui/modern-tabs';
import { DashboardPage, DashboardSection, DashboardGrid } from '@/components/layout/modern-dashboard-layout';
import { 
  Leaf, 
  Zap, 
  Truck, 
  Recycle,
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';

interface SustainabilityData {
  carbonFootprint: {
    total: number;
    transport: number;
    manufacturing: number;
    packaging: number;
    reduction: number;
  };
  sustainability: {
    score: number;
    grade: string;
    ranking: number;
    improvement: number;
  };
  greenAlternatives: Array<{
    id: string;
    category: string;
    current: string;
    alternative: string;
    carbonReduction: number;
    costImpact: number;
    feasibility: 'high' | 'medium' | 'low';
  }>;
  certifications: Array<{
    name: string;
    status: 'achieved' | 'in-progress' | 'planned';
    progress: number;
    deadline?: string;
  }>;
}

interface ModernSustainabilityDashboardProps {
  className?: string;
  onVoiceCommand?: (command: string) => void;
}

export default function ModernSustainabilityDashboard({ 
  className = '', 
  onVoiceCommand 
}: ModernSustainabilityDashboardProps) {
  const [data, setData] = useState<SustainabilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchSustainabilityData();
  }, []);

  const fetchSustainabilityData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData({
        carbonFootprint: {
          total: 12450,
          transport: 5200,
          manufacturing: 4800,
          packaging: 2450,
          reduction: 18.5
        },
        sustainability: {
          score: 78.5,
          grade: 'B+',
          ranking: 23,
          improvement: 12.3
        },
        greenAlternatives: [
          {
            id: 'alt-1',
            category: 'Transportation',
            current: 'Diesel Trucks',
            alternative: 'Electric Fleet',
            carbonReduction: 35,
            costImpact: 15,
            feasibility: 'high'
          },
          {
            id: 'alt-2',
            category: 'Packaging',
            current: 'Plastic Packaging',
            alternative: 'Biodegradable Materials',
            carbonReduction: 28,
            costImpact: 8,
            feasibility: 'medium'
          },
          {
            id: 'alt-3',
            category: 'Energy',
            current: 'Grid Power',
            alternative: 'Solar + Battery',
            carbonReduction: 42,
            costImpact: 22,
            feasibility: 'high'
          }
        ],
        certifications: [
          { name: 'ISO 14001', status: 'achieved', progress: 100 },
          { name: 'Carbon Neutral', status: 'in-progress', progress: 67, deadline: '2024-12-31' },
          { name: 'B Corp Certification', status: 'planned', progress: 25, deadline: '2025-06-30' },
          { name: 'LEED Gold', status: 'in-progress', progress: 45, deadline: '2024-09-15' }
        ]
      });
    } catch (error) {
      console.error('Sustainability data fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (): void => {
    setRefreshing(true);
    fetchSustainabilityData();
  };

  if (loading && !data) {
    return (
      <DashboardPage title="Sustainability" description="Environmental impact and green initiatives">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600">Loading sustainability metrics...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="Sustainability Dashboard"
      description="Track environmental impact and sustainability initiatives"
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
        { label: 'Sustainability' }
      ]}
    >
      <ModernTabs defaultValue="overview">
        <ModernTabs.List variant="underline">
          <ModernTabs.Trigger value="overview">Overview</ModernTabs.Trigger>
          <ModernTabs.Trigger value="carbon">Carbon Footprint</ModernTabs.Trigger>
          <ModernTabs.Trigger value="alternatives">Green Alternatives</ModernTabs.Trigger>
          <ModernTabs.Trigger value="certifications">Certifications</ModernTabs.Trigger>
        </ModernTabs.List>

        <ModernTabs.Content value="overview">
          {/* Key Sustainability Metrics */}
          <DashboardSection title="Sustainability Overview">
            <MetricGrid columns={4}>
              <ModernMetricCard
                title="Sustainability Score"
                value={data?.sustainability.score || 0}
                format="decimal"
                suffix="/100"
                status="positive"
                change={{
                  value: data?.sustainability.improvement || 0,
                  period: 'vs last quarter',
                  trend: 'up'
                }}
                icon={<Leaf size={24} />}
                description={`Grade: ${data?.sustainability.grade || 'N/A'}`}
                onClick={() => onVoiceCommand?.('explain sustainability score')}
              />
              
              <ModernMetricCard
                title="Carbon Footprint"
                value={data?.carbonFootprint.total || 0}
                format="number"
                suffix="tCO₂e"
                status="warning"
                change={{
                  value: -data?.carbonFootprint.reduction || 0,
                  period: 'vs last year',
                  trend: 'down'
                }}
                icon={<Zap size={24} />}
                description="Total carbon emissions"
                onClick={() => onVoiceCommand?.('analyze carbon footprint')}
              />
              
              <ModernMetricCard
                title="Industry Ranking"
                value={data?.sustainability.ranking || 0}
                format="number"
                suffix="/100"
                status="positive"
                icon={<Award size={24} />}
                description="Sustainability ranking in industry"
                onClick={() => onVoiceCommand?.('show industry comparison')}
              />
              
              <ModernMetricCard
                title="Green Initiatives"
                value={data?.greenAlternatives.length || 0}
                format="number"
                suffix=" active"
                status="positive"
                icon={<Target size={24} />}
                description="Active sustainability projects"
                onClick={() => onVoiceCommand?.('list green initiatives')}
              />
            </MetricGrid>
          </DashboardSection>

          {/* Carbon Footprint Breakdown */}
          <DashboardSection title="Carbon Footprint Breakdown">
            <DashboardGrid columns={2}>
              <ModernCard variant="elevated">
                <ModernCardHeader>
                  <ModernCardTitle>Emissions by Category</ModernCardTitle>
                </ModernCardHeader>
                <ModernCardContent>
                  <div className="space-y-4">
                    {[
                      { category: 'Transportation', value: data?.carbonFootprint.transport || 0, color: 'bg-blue-500' },
                      { category: 'Manufacturing', value: data?.carbonFootprint.manufacturing || 0, color: 'bg-orange-500' },
                      { category: 'Packaging', value: data?.carbonFootprint.packaging || 0, color: 'bg-green-500' }
                    ].map((item, index) => {
                      const percentage = ((item.value / (data?.carbonFootprint.total || 1)) * 100).toFixed(1);
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                            <span className="text-sm text-gray-600">{item.value} tCO₂e ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ModernCardContent>
              </ModernCard>

              <ModernCard variant="elevated">
                <ModernCardHeader>
                  <ModernCardTitle>Reduction Targets</ModernCardTitle>
                </ModernCardHeader>
                <ModernCardContent>
                  <div className="space-y-4">
                    <ComparisonMetric
                      title="2024 Target"
                      current={{ label: 'Current', value: 12450, format: 'number', suffix: ' tCO₂e' }}
                      previous={{ label: 'Target', value: 11000, format: 'number', suffix: ' tCO₂e' }}
                    />
                    <ComparisonMetric
                      title="2025 Target"
                      current={{ label: 'Projected', value: 10200, format: 'number', suffix: ' tCO₂e' }}
                      previous={{ label: 'Target', value: 9500, format: 'number', suffix: ' tCO₂e' }}
                    />
                    <ComparisonMetric
                      title="Net Zero Goal"
                      current={{ label: '2030 Target', value: 0, format: 'number', suffix: ' tCO₂e' }}
                      previous={{ label: 'Current Path', value: 2400, format: 'number', suffix: ' tCO₂e' }}
                    />
                  </div>
                </ModernCardContent>
              </ModernCard>
            </DashboardGrid>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="alternatives">
          <DashboardSection title="Green Alternative Recommendations">
            <ModernCard variant="elevated">
              <ModernCardContent>
                <div className="space-y-4">
                  {data?.greenAlternatives.map((alternative) => (
                    <div
                      key={alternative.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onVoiceCommand?.(`analyze alternative ${alternative.alternative}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{alternative.category}</h3>
                          <ModernBadge
                            variant={
                              alternative.feasibility === 'high' ? 'success' :
                              alternative.feasibility === 'medium' ? 'warning' : 'error'
                            }
                          >
                            {alternative.feasibility} feasibility
                          </ModernBadge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Current:</span> {alternative.current} → 
                          <span className="font-medium"> Alternative:</span> {alternative.alternative}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-600">
                            <TrendingUp size={14} className="inline mr-1" />
                            {alternative.carbonReduction}% carbon reduction
                          </span>
                          <span className="text-blue-600">
                            {alternative.costImpact > 0 ? '+' : ''}{alternative.costImpact}% cost impact
                          </span>
                        </div>
                      </div>
                      <ModernButton
                        variant="outline"
                        size="sm"
                      >
                        Implement
                      </ModernButton>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="certifications">
          <DashboardSection title="Sustainability Certifications">
            <DashboardGrid columns={2}>
              {data?.certifications.map((cert, index) => (
                <ModernCard key={index} variant="elevated">
                  <ModernCardHeader>
                    <div className="flex items-center justify-between">
                      <ModernCardTitle size="sm">{cert.name}</ModernCardTitle>
                      <ModernBadge
                        variant={
                          cert.status === 'achieved' ? 'success' :
                          cert.status === 'in-progress' ? 'warning' : 'info'
                        }
                      >
                        {cert.status}
                      </ModernBadge>
                    </div>
                  </ModernCardHeader>
                  <ModernCardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{cert.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              cert.status === 'achieved' ? 'bg-green-500' :
                              cert.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${cert.progress}%` }}
                          />
                        </div>
                      </div>
                      {cert.deadline && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Deadline:</span> {new Date(cert.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </ModernCardContent>
                </ModernCard>
              ))}
            </DashboardGrid>
          </DashboardSection>
        </ModernTabs.Content>

        <ModernTabs.Content value="carbon">
          <DashboardSection title="Detailed Carbon Analysis">
            <DashboardGrid columns={1}>
              <ModernCard variant="elevated">
                <ModernCardHeader>
                  <ModernCardTitle>Monthly Carbon Emissions Trend</ModernCardTitle>
                </ModernCardHeader>
                <ModernCardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Leaf size={48} className="mx-auto mb-4 text-green-500" />
                      <p>Carbon emissions chart would be displayed here</p>
                      <p className="text-sm mt-2">Integration with charting library needed</p>
                    </div>
                  </div>
                </ModernCardContent>
              </ModernCard>
            </DashboardGrid>
          </DashboardSection>
        </ModernTabs.Content>
      </ModernTabs>
    </DashboardPage>
  );
}