'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Leaf, 
  Zap, 
  Droplets, 
  Recycle, 
  Truck,
  Target,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Lightbulb,
  Factory,
  Plane,
  Ship,
  Train
} from 'lucide-react';
import { SustainabilityResponse, ThresholdAlert, GreenStrategy } from '@/lib/types/enhanced-analytics';

// Mobile-Responsive Sustainability Dashboard
// Requirements: 9.1, 9.2 - Touch-optimized interfaces and adaptive chart layouts

interface SustainabilityMetric {
  id: string;
  title: string;
  value: string;
  unit: string;
  target?: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'declining' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  details?: {
    description: string;
    breakdown: { label: string; value: string; percentage?: number }[];
    recommendations?: string[];
  };
}

interface MobileSustainabilityDashboardProps {
  timeRange?: '7d' | '30d' | '90d';
  className?: string;
  onMetricsUpdate?: (data: SustainabilityResponse) => void;
}

const MobileSustainabilityDashboard: React.FC<MobileSustainabilityDashboardProps> = ({
  timeRange = '30d',
  className = '',
  onMetricsUpdate,
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sustainabilityData, setSustainabilityData] = useState<SustainabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchSustainabilityData();
  }, [timeRange]);

  const fetchSustainabilityData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sustainability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'comprehensive',
          data: { timeRange }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSustainabilityData(result.data);
        onMetricsUpdate?.(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch sustainability data');
      }
    } catch (error) {
      console.error('Failed to fetch sustainability data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [timeRange, onMetricsUpdate]);

  const getSustainabilityMetrics = useCallback((): SustainabilityMetric[] => {
    if (!sustainabilityData) return [];

    return [
      {
        id: 'carbon-footprint',
        title: 'Carbon Footprint',
        value: sustainabilityData.carbonFootprint.total.toLocaleString(),
        unit: 'kg CO₂',
        target: '1,000 kg',
        status: sustainabilityData.carbonFootprint.total > 1200 ? 'critical' : 
                sustainabilityData.carbonFootprint.total > 1000 ? 'warning' : 'good',
        trend: 'improving',
        icon: Leaf,
        details: {
          description: 'Total carbon emissions across all supply chain operations',
          breakdown: [
            { 
              label: 'Air Transport', 
              value: `${sustainabilityData.carbonFootprint.breakdown.air.toFixed(1)} kg`, 
              percentage: Math.round((sustainabilityData.carbonFootprint.breakdown.air / sustainabilityData.carbonFootprint.total) * 100)
            },
            { 
              label: 'Sea Transport', 
              value: `${sustainabilityData.carbonFootprint.breakdown.sea.toFixed(1)} kg`, 
              percentage: Math.round((sustainabilityData.carbonFootprint.breakdown.sea / sustainabilityData.carbonFootprint.total) * 100)
            },
            { 
              label: 'Rail Transport', 
              value: `${sustainabilityData.carbonFootprint.breakdown.rail.toFixed(1)} kg`, 
              percentage: Math.round((sustainabilityData.carbonFootprint.breakdown.rail / sustainabilityData.carbonFootprint.total) * 100)
            },
            { 
              label: 'Road Transport', 
              value: `${sustainabilityData.carbonFootprint.breakdown.road.toFixed(1)} kg`, 
              percentage: Math.round((sustainabilityData.carbonFootprint.breakdown.road / sustainabilityData.carbonFootprint.total) * 100)
            }
          ],
          recommendations: [
            'Switch to rail transport for 30% emission reduction',
            'Implement renewable energy in warehouses',
            'Optimize packaging materials'
          ]
        }
      },
      {
        id: 'sustainability-score',
        title: 'Sustainability Score',
        value: sustainabilityData.sustainabilityScore.overall.toString(),
        unit: '/100',
        target: '85',
        status: sustainabilityData.sustainabilityScore.overall >= 80 ? 'excellent' :
                sustainabilityData.sustainabilityScore.overall >= 70 ? 'good' :
                sustainabilityData.sustainabilityScore.overall >= 60 ? 'warning' : 'critical',
        trend: 'improving',
        icon: Target,
        details: {
          description: 'Overall environmental performance score based on multiple factors',
          breakdown: [
            { 
              label: 'Environmental', 
              value: `${sustainabilityData.sustainabilityScore.environmental}/100`, 
              percentage: sustainabilityData.sustainabilityScore.environmental 
            },
            { 
              label: 'Efficiency', 
              value: `${sustainabilityData.sustainabilityScore.efficiency}/100`, 
              percentage: sustainabilityData.sustainabilityScore.efficiency 
            },
            { 
              label: 'Innovation', 
              value: `${sustainabilityData.sustainabilityScore.innovation}/100`, 
              percentage: sustainabilityData.sustainabilityScore.innovation 
            }
          ]
        }
      },
      {
        id: 'emissions-per-unit',
        title: 'Emissions Per Unit',
        value: sustainabilityData.carbonFootprint.emissionsPerUnit.toFixed(2),
        unit: 'kg CO₂/unit',
        target: '2.0',
        status: sustainabilityData.carbonFootprint.emissionsPerUnit <= 2.0 ? 'good' : 'warning',
        trend: 'improving',
        icon: Zap,
        details: {
          description: 'Carbon emissions per unit of product delivered',
          breakdown: [
            { label: 'Current Performance', value: `${sustainabilityData.carbonFootprint.emissionsPerUnit.toFixed(2)} kg CO₂/unit` },
            { label: 'Industry Average', value: '2.8 kg CO₂/unit' },
            { label: 'Best Practice', value: '1.5 kg CO₂/unit' }
          ]
        }
      },
      {
        id: 'threshold-alerts',
        title: 'Active Alerts',
        value: sustainabilityData.thresholdAlerts.length.toString(),
        unit: 'alerts',
        status: sustainabilityData.thresholdAlerts.length === 0 ? 'excellent' :
                sustainabilityData.thresholdAlerts.length <= 2 ? 'good' :
                sustainabilityData.thresholdAlerts.length <= 4 ? 'warning' : 'critical',
        trend: 'stable',
        icon: AlertTriangle,
        details: {
          description: 'Active sustainability threshold alerts requiring attention',
          breakdown: sustainabilityData.thresholdAlerts.map(alert => ({
            label: alert.type.replace('_', ' ').toUpperCase(),
            value: `${alert.currentValue} (threshold: ${alert.threshold})`
          }))
        }
      }
    ];
  }, [sustainabilityData]);

  const getGreenAlternatives = useCallback((): GreenStrategy[] => {
    if (!sustainabilityData?.greenAlternatives) return [];
    return sustainabilityData.greenAlternatives.slice(0, 3);
  }, [sustainabilityData]);

  const getTransportModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'air': return Plane;
      case 'sea': return Ship;
      case 'rail': return Train;
      case 'road': return Truck;
      default: return Truck;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-700 bg-green-100 border-green-300';
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'declining':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default:
        return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
    }
  };

  const toggleMetricExpansion = (metricId: string) => {
    setExpandedMetric(expandedMetric === metricId ? null : metricId);
  };

  const MetricCard: React.FC<{ metric: SustainabilityMetric }> = ({ metric }) => {
    const Icon = metric.icon;
    const isExpanded = expandedMetric === metric.id;

    return (
      <Card 
        className={`border ${getStatusColor(metric.status)} cursor-pointer transition-all duration-200 ${
          isExpanded ? 'ring-2 ring-green-500' : ''
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
                <div className="flex items-center space-x-2">
                  {getTrendIcon(metric.trend)}
                  <span className="text-xs text-gray-500">{metric.trend}</span>
                </div>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
              <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
            </div>
            {metric.target && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Target</div>
                <div className="text-sm font-medium text-gray-700">{metric.target}</div>
              </div>
            )}
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
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {metric.details.recommendations && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Recommendations:</div>
                  {metric.details.recommendations.map((rec, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                      <ArrowRight className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const GreenAlternativeCard: React.FC<{ alternative: GreenStrategy }> = ({ alternative }) => (
    <Card className="border border-green-200 hover:border-green-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-1">{alternative.name}</h4>
            <div className="text-xs text-green-600 font-medium">
              {alternative.emissionReduction}% CO₂ reduction
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500 mb-1">Implementation</div>
            <div className="font-medium text-gray-700">{alternative.implementationTime} days</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Feasibility</div>
            <div className="font-medium text-blue-600">{alternative.feasibilityScore}%</div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Cost Impact</div>
          <div className={`font-medium text-sm ${alternative.costImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {alternative.costImpact >= 0 ? '+' : ''}${Math.abs(alternative.costImpact).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmissionBreakdown = () => {
    if (!sustainabilityData) return null;

    const breakdown = sustainabilityData.carbonFootprint.breakdown;
    const total = sustainabilityData.carbonFootprint.total;

    const transportModes = [
      { key: 'air', label: 'Air Transport', value: breakdown.air, color: 'blue' },
      { key: 'sea', label: 'Sea Transport', value: breakdown.sea, color: 'green' },
      { key: 'rail', label: 'Rail Transport', value: breakdown.rail, color: 'purple' },
      { key: 'road', label: 'Road Transport', value: breakdown.road, color: 'orange' }
    ];

    return (
      <div className="space-y-4">
        {transportModes.map((mode) => {
          const percentage = Math.round((mode.value / total) * 100);
          const Icon = getTransportModeIcon(mode.key);
          
          return (
            <div key={mode.key} className={`flex items-center justify-between p-3 bg-${mode.color}-50 border border-${mode.color}-200 rounded-lg`}>
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 text-${mode.color}-600`} />
                <div>
                  <div className={`text-sm font-medium text-${mode.color}-800`}>{mode.label}</div>
                  <div className={`text-xs text-${mode.color}-600`}>
                    {mode.value.toFixed(1)} kg CO₂ ({percentage}%)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold text-${mode.color}-800`}>{percentage}%</div>
                <div className={`text-xs text-${mode.color}-600`}>of total</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const AlertsSection = () => {
    if (!sustainabilityData?.thresholdAlerts.length) {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-800">All Clear</div>
                <div className="text-xs text-green-600">No sustainability alerts at this time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {sustainabilityData.thresholdAlerts.map((alert) => (
          <Card key={alert.id} className={`border ${getSeverityColor(alert.severity)}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${getSeverityIconColor(alert.severity)}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-900">{alert.type.replace('_', ' ').toUpperCase()}</div>
                    <Badge variant={getSeverityVariant(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{alert.message}</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Current: {alert.currentValue}</span>
                    <span className="text-gray-500">Threshold: {alert.threshold}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-300 bg-red-50';
      case 'high': return 'border-orange-300 bg-orange-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-blue-300 bg-blue-50';
    }
  };

  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
            <span className="text-gray-600">Loading sustainability metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="p-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-red-800">Error Loading Data</div>
                  <div className="text-xs text-red-600">{error}</div>
                </div>
              </div>
              <Button 
                onClick={fetchSustainabilityData} 
                className="mt-3 w-full"
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!sustainabilityData) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="p-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-gray-500">No sustainability data available</div>
              <Button 
                onClick={fetchSustainabilityData} 
                className="mt-3"
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const sustainabilityMetrics = getSustainabilityMetrics();
  const greenAlternatives = getGreenAlternatives();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Sustainability Dashboard</h1>
            <p className="text-sm text-gray-500">Environmental Impact Overview</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchSustainabilityData}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="p-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant="secondary" className="text-xs">
              Score: {sustainabilityData?.sustainabilityScore.overall || 0}/100
            </Badge>
            <Badge variant="outline" className="text-xs">
              {timeRange}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Tab Navigation */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="emissions" className="text-xs">Emissions</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
            {!isMobile && (
              <TabsTrigger value="alternatives" className="text-xs">Alternatives</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Sustainability Metrics */}
            <div className="grid grid-cols-1 gap-4">
              {sustainabilityMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>

            {/* Environmental Summary */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-800 mb-1">Environmental Impact Summary</div>
                    <div className="text-xs text-green-700">
                      Current carbon footprint of {sustainabilityData?.carbonFootprint.total.toLocaleString()} kg CO₂ 
                      {sustainabilityData?.greenAlternatives && sustainabilityData.greenAlternatives.length > 0 && (
                        <> with {sustainabilityData.greenAlternatives[0].emissionReduction}% reduction potential through green alternatives</>
                      )}. Sustainability score: {sustainabilityData?.sustainabilityScore.overall}/100.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2"
                onClick={() => setSelectedTab('emissions')}
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Breakdown</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2"
                onClick={() => setSelectedTab('alternatives')}
              >
                <Lightbulb className="h-4 w-4" />
                <span>Green Options</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="emissions" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Factory className="h-4 w-4" />
                  <span>Emission Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmissionBreakdown />
              </CardContent>
            </Card>

            {/* Emissions Summary */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-800 mb-1">Emissions Analysis</div>
                    <div className="text-xs text-blue-700">
                      Transportation accounts for the largest share of emissions. 
                      Consider switching to more sustainable transport modes for significant reductions.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-900">Sustainability Alerts</div>
              <Badge variant={sustainabilityData?.thresholdAlerts.length === 0 ? "secondary" : "destructive"}>
                {sustainabilityData?.thresholdAlerts.length || 0} active
              </Badge>
            </div>
            <AlertsSection />
          </TabsContent>

          {!isMobile && (
            <TabsContent value="alternatives" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Green Alternatives</div>
                  <Badge variant="outline">{greenAlternatives.length} options</Badge>
                </div>
                {greenAlternatives.length > 0 ? (
                  greenAlternatives.map((alternative) => (
                    <GreenAlternativeCard key={alternative.id} alternative={alternative} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Recycle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">No green alternatives available</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Mobile-specific sections */}
        {isMobile && greenAlternatives.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Recycle className="h-4 w-4" />
                <span>Green Alternatives</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {greenAlternatives.slice(0, 2).map((alternative) => (
                <GreenAlternativeCard key={alternative.id} alternative={alternative} />
              ))}
              {greenAlternatives.length > 2 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedTab('alternatives')}
                >
                  View All {greenAlternatives.length} Alternatives
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sustainability Targets Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Sustainability Targets</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-700">Carbon Reduction Target</div>
                  <div className="text-sm text-gray-500">20% by 2024</div>
                </div>
                <Progress value={78} className="h-2" />
                <div className="text-xs text-gray-500">78% progress toward target</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-700">Sustainability Score</div>
                  <div className="text-sm text-gray-500">85/100 by 2025</div>
                </div>
                <Progress 
                  value={sustainabilityData ? (sustainabilityData.sustainabilityScore.overall / 85) * 100 : 0} 
                  className="h-2" 
                />
                <div className="text-xs text-gray-500">
                  {sustainabilityData ? Math.round((sustainabilityData.sustainabilityScore.overall / 85) * 100) : 0}% progress toward target
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Control Hint */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🎤</span>
              </div>
              <div>
                <div className="text-sm font-medium text-green-800">Voice Commands</div>
                <div className="text-xs text-green-600">
                  Try: "Show carbon footprint", "Find green alternatives", or "Check sustainability alerts"
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileSustainabilityDashboard;