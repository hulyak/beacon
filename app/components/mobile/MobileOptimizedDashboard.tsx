'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Leaf, 
  DollarSign, 
  Menu,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Mobile-Optimized Dashboard Component
// Requirement 9.1: Touch-optimized interfaces for impact, explainability, and sustainability dashboards
// Requirement 9.2: Adaptive chart layouts for tablet and mobile viewing
// Requirement 9.5: Progressive disclosure for complex data on small screens

interface MobileMetric {
  id: string;
  title: string;
  value: string;
  change: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  details?: {
    description: string;
    breakdown: { label: string; value: string }[];
  };
}

interface MobileDashboardProps {
  className?: string;
}

const MobileOptimizedDashboard: React.FC<MobileDashboardProps> = ({
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const metrics: MobileMetric[] = [
    {
      id: 'delivery',
      title: 'Delivery Performance',
      value: '94.5%',
      change: 2.3,
      status: 'good',
      icon: TrendingUp,
      details: {
        description: 'On-time delivery rate across all supply chain operations',
        breakdown: [
          { label: 'Domestic', value: '96.2%' },
          { label: 'International', value: '91.8%' },
          { label: 'Express', value: '98.1%' }
        ]
      }
    },
    {
      id: 'cost',
      title: 'Cost Efficiency',
      value: '87.2%',
      change: -1.8,
      status: 'warning',
      icon: DollarSign,
      details: {
        description: 'Overall cost optimization across supply chain operations',
        breakdown: [
          { label: 'Transportation', value: '89.5%' },
          { label: 'Warehousing', value: '85.1%' },
          { label: 'Procurement', value: '87.0%' }
        ]
      }
    },
    {
      id: 'risk',
      title: 'Risk Level',
      value: '23.1%',
      change: 0.2,
      status: 'good',
      icon: AlertTriangle,
      details: {
        description: 'Aggregated risk assessment across all supply chain nodes',
        breakdown: [
          { label: 'Supplier Risk', value: '18.5%' },
          { label: 'Transport Risk', value: '25.2%' },
          { label: 'Market Risk', value: '26.7%' }
        ]
      }
    },
    {
      id: 'sustainability',
      title: 'Sustainability Score',
      value: '78.9',
      change: 3.1,
      status: 'good',
      icon: Leaf,
      details: {
        description: 'Environmental performance score based on carbon footprint and green practices',
        breakdown: [
          { label: 'Carbon Footprint', value: '1,247 tons CO₂' },
          { label: 'Green Transport', value: '34%' },
          { label: 'Renewable Energy', value: '67%' }
        ]
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const toggleMetricExpansion = (metricId: string) => {
    setExpandedMetric(expandedMetric === metricId ? null : metricId);
  };

  const MetricCard: React.FC<{ metric: MobileMetric }> = ({ metric }) => {
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <span className="font-medium text-sm">{metric.title}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold">{metric.value}</span>
            <span className={`text-sm font-medium ${getChangeColor(metric.change)}`}>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </span>
          </div>

          {isExpanded && metric.details && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <p className="text-sm text-gray-600">{metric.details.description}</p>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 mb-2">Breakdown:</div>
                {metric.details.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const QuickActions = () => (
    <div className="grid grid-cols-2 gap-3">
      <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors">
        <BarChart3 className="h-6 w-6 text-blue-600 mb-2" />
        <div className="text-sm font-medium text-blue-800">View Analytics</div>
        <div className="text-xs text-blue-600">Real-time metrics</div>
      </button>
      
      <button className="p-4 bg-green-50 border border-green-200 rounded-lg text-left hover:bg-green-100 transition-colors">
        <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
        <div className="text-sm font-medium text-green-800">ROI Analysis</div>
        <div className="text-xs text-green-600">Optimization tools</div>
      </button>
      
      <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-left hover:bg-purple-100 transition-colors">
        <Leaf className="h-6 w-6 text-purple-600 mb-2" />
        <div className="text-sm font-medium text-purple-800">Sustainability</div>
        <div className="text-xs text-purple-600">Environmental impact</div>
      </button>
      
      <button className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-left hover:bg-amber-100 transition-colors">
        <AlertTriangle className="h-6 w-6 text-amber-600 mb-2" />
        <div className="text-sm font-medium text-amber-800">Risk Monitor</div>
        <div className="text-xs text-amber-600">Active alerts</div>
      </button>
    </div>
  );

  const RecentAlerts = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <div>
            <div className="text-sm font-medium text-amber-800">Supplier Delay</div>
            <div className="text-xs text-amber-600">Asia Pacific region</div>
          </div>
        </div>
        <div className="text-xs text-amber-600">2h ago</div>
      </div>
      
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <div>
            <div className="text-sm font-medium text-blue-800">Performance Improvement</div>
            <div className="text-xs text-blue-600">Delivery metrics up 2.3%</div>
          </div>
        </div>
        <div className="text-xs text-blue-600">4h ago</div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Supply Chain Dashboard</h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg p-4">
            <div className="space-y-4 mt-16">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
                Dashboard
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
                Analytics
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
                Optimization
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
                Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Tab Navigation - Mobile Optimized */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
                <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 gap-4">
              {metrics.slice(0, isMobile ? 2 : 4).map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentAlerts />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          </TabsContent>

          {!isMobile && (
            <>
              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Available Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuickActions />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">System Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecentAlerts />
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
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentAlerts />
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
                <div className="text-sm font-medium text-blue-800">Voice Control Available</div>
                <div className="text-xs text-blue-600">Tap and hold to speak commands</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileOptimizedDashboard;