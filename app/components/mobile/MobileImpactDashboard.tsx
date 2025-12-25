'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  Users,
  Package,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BarChart3
} from 'lucide-react';

// Mobile-Responsive Impact Assessment Dashboard
// Requirements: 9.1, 9.2 - Touch-optimized interfaces and adaptive chart layouts

interface ImpactMetric {
  id: string;
  title: string;
  value: string;
  subValue?: string;
  change?: number;
  status: 'critical' | 'warning' | 'info';
  icon: React.ComponentType<{ className?: string }>;
  details?: {
    description: string;
    breakdown: { label: string; value: string; percentage?: number }[];
  };
}

interface MobileImpactDashboardProps {
  impactData?: any;
  className?: string;
}

const MobileImpactDashboard: React.FC<MobileImpactDashboardProps> = ({
  impactData,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mock data - in production this would come from props
  const impactMetrics: ImpactMetric[] = [
    {
      id: 'total-cost',
      title: 'Total Financial Impact',
      value: '$2.3M',
      subValue: 'Direct + Indirect Costs',
      status: 'critical',
      icon: DollarSign,
      details: {
        description: 'Comprehensive financial impact including direct costs, opportunity costs, and indirect effects',
        breakdown: [
          { label: 'Lost Revenue', value: '$1.2M', percentage: 52 },
          { label: 'Expediting Costs', value: '$450K', percentage: 20 },
          { label: 'Alternative Suppliers', value: '$380K', percentage: 17 },
          { label: 'Labor Costs', value: '$270K', percentage: 11 }
        ]
      }
    },
    {
      id: 'affected-orders',
      title: 'Affected Orders',
      value: '450',
      subValue: 'Across 15 partners',
      status: 'warning',
      icon: Package,
      details: {
        description: 'Orders impacted by supply chain disruption across partner network',
        breakdown: [
          { label: 'Critical Orders', value: '125', percentage: 28 },
          { label: 'Standard Orders', value: '225', percentage: 50 },
          { label: 'Low Priority', value: '100', percentage: 22 }
        ]
      }
    },
    {
      id: 'delivery-delays',
      title: 'Delivery Delays',
      value: '8-12 days',
      subValue: 'Average impact',
      status: 'warning',
      icon: Clock,
      details: {
        description: 'Expected delivery delays across different shipping categories',
        breakdown: [
          { label: '1-3 days', value: '180 orders', percentage: 40 },
          { label: '4-7 days', value: '135 orders', percentage: 30 },
          { label: '8-14 days', value: '90 orders', percentage: 20 },
          { label: '15+ days', value: '45 orders', percentage: 10 }
        ]
      }
    },
    {
      id: 'cascade-effects',
      title: 'Cascade Effects',
      value: '15',
      subValue: 'Downstream partners',
      status: 'critical',
      icon: Users,
      details: {
        description: 'Network propagation effects across supply chain partners',
        breakdown: [
          { label: 'Tier 1 Partners', value: '5', percentage: 33 },
          { label: 'Tier 2 Partners', value: '7', percentage: 47 },
          { label: 'Tier 3 Partners', value: '3', percentage: 20 }
        ]
      }
    }
  ];

  const mitigationStrategies = [
    {
      id: 'supplier-diversification',
      name: 'Supplier Diversification',
      effectiveness: '85%',
      cost: '$450K',
      timeframe: '90 days',
      riskReduction: '60%'
    },
    {
      id: 'inventory-buffer',
      name: 'Strategic Inventory Buffer',
      effectiveness: '70%',
      cost: '$280K',
      timeframe: '30 days',
      riskReduction: '45%'
    },
    {
      id: 'alternative-transport',
      name: 'Alternative Transportation',
      effectiveness: '75%',
      cost: '$320K',
      timeframe: '45 days',
      riskReduction: '50%'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const toggleMetricExpansion = (metricId: string) => {
    setExpandedMetric(expandedMetric === metricId ? null : metricId);
  };

  const MetricCard: React.FC<{ metric: ImpactMetric }> = ({ metric }) => {
    const Icon = metric.icon;
    const isExpanded = expandedMetric === metric.id;

    return (
      <Card 
        className={`border ${getStatusColor(metric.status)} cursor-pointer transition-all duration-200 ${
          isExpanded ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => toggleMetricExpansion(metric.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getStatusColor(metric.status)}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">{metric.title}</div>
                {metric.subValue && (
                  <div className="text-xs text-gray-500">{metric.subValue}</div>
                )}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
          </div>

          {isExpanded && metric.details && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <p className="text-sm text-gray-600">{metric.details.description}</p>
              
              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-700 mb-2">Breakdown:</div>
                {metric.details.breakdown.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    {item.percentage && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const MitigationCard: React.FC<{ strategy: any }> = ({ strategy }) => (
    <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-1">{strategy.name}</h4>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Cost: {strategy.cost}</span>
              <span>Time: {strategy.timeframe}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500 mb-1">Effectiveness</div>
            <div className="font-medium text-green-600">{strategy.effectiveness}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Risk Reduction</div>
            <div className="font-medium text-blue-600">{strategy.riskReduction}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TimelineView = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div>
          <div className="text-sm font-medium text-red-800">Day 0 - Disruption Detected</div>
          <div className="text-xs text-red-600">Initial supplier failure identified</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
        <div>
          <div className="text-sm font-medium text-amber-800">Day 1-3 - Immediate Impact</div>
          <div className="text-xs text-amber-600">Production delays begin, 180 orders affected</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <div>
          <div className="text-sm font-medium text-blue-800">Day 4-7 - Cascade Effects</div>
          <div className="text-xs text-blue-600">Downstream partners impacted, 135 additional orders</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <div>
          <div className="text-sm font-medium text-gray-800">Day 8+ - Recovery Phase</div>
          <div className="text-xs text-gray-600">Mitigation strategies implementation</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Impact Assessment</h1>
            <p className="text-sm text-gray-500">Supplier Failure - Asia Pacific</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
              Critical
            </div>
            <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              87% Confidence
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Tab Navigation */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger value="mitigation" className="text-xs">Mitigation</TabsTrigger>
                <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Impact Metrics */}
            <div className="grid grid-cols-1 gap-4">
              {impactMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>

            {/* Quick Summary */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-red-800 mb-1">Critical Impact Summary</div>
                    <div className="text-xs text-red-700">
                      Supplier failure in Asia Pacific region affecting 450 orders with $2.3M total impact. 
                      Immediate action required to minimize cascade effects across 15 downstream partners.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Impact Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineView />
              </CardContent>
            </Card>
          </TabsContent>

          {!isMobile && (
            <>
              <TabsContent value="mitigation" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-900 mb-3">Recommended Mitigation Strategies</div>
                  {mitigationStrategies.map((strategy) => (
                    <MitigationCard key={strategy.id} strategy={strategy} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detailed Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Comprehensive impact analysis including financial modeling, operational disruption assessment, 
                      and network cascade effect evaluation.
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900 mb-1">Analysis Depth</div>
                        <div className="text-gray-600">Comprehensive</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 mb-1">Confidence Level</div>
                        <div className="text-gray-600">87%</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 mb-1">Scenario Type</div>
                        <div className="text-gray-600">Supplier Failure</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 mb-1">Affected Region</div>
                        <div className="text-gray-600">Asia Pacific</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Mobile-specific sections */}
        {isMobile && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mitigation Strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mitigationStrategies.slice(0, 2).map((strategy) => (
                  <MitigationCard key={strategy.id} strategy={strategy} />
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* Voice Control Hint */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🎤</span>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-800">Ask for Details</div>
                <div className="text-xs text-blue-600">"Explain the cascade effects" or "Show mitigation options"</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileImpactDashboard;