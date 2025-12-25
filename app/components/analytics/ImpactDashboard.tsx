'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign, Clock, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { ImpactAssessmentResponse } from '@/lib/types/enhanced-analytics';
import { formatCurrency, formatPercentage, generateImpactVoiceDescription } from '@/lib/utils/analytics-utils';
import CostAnalysis from './CostAnalysis';
import DelayTracker from './DelayTracker';
import CascadeVisualization from './CascadeVisualization';

interface ImpactDashboardProps {
  scenarioId?: string;
  onDataUpdate?: (data: ImpactAssessmentResponse) => void;
  onVoiceDescription?: (description: string) => void;
}

export default function ImpactDashboard({ scenarioId, onDataUpdate, onVoiceDescription }: ImpactDashboardProps) {
  const [impactData, setImpactData] = useState<ImpactAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'delays' | 'cascade'>('overview');

  useEffect(() => {
    if (scenarioId) {
      fetchImpactData(scenarioId);
    }
  }, [scenarioId]);

  const fetchImpactData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // This will connect to the impact assessment Cloud Function
      const response = await fetch('/api/impact-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: id })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setImpactData(data);
      onDataUpdate?.(data);
      
      // Generate voice description
      const voiceDescription = generateImpactVoiceDescription(data);
      onVoiceDescription?.(voiceDescription);
      
    } catch (error) {
      console.error('Failed to fetch impact data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch impact data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Analyzing impact assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error loading impact data</span>
            </div>
            <p className="text-red-600 text-sm mt-2">{error}</p>
            <button 
              onClick={() => scenarioId && fetchImpactData(scenarioId)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry Analysis
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!impactData) {
    return (
      <div className="p-6 text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No impact data available</p>
        <p className="text-gray-500 text-sm">Select a scenario to view impact analysis</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'costs', label: 'Cost Analysis', icon: DollarSign },
    { id: 'delays', label: 'Delivery Delays', icon: Clock },
    { id: 'cascade', label: 'Network Impact', icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Financial Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(impactData.financialImpact.totalImpact)}
            </div>
            <p className="text-xs text-muted-foreground">
              Confidence: {formatPercentage(impactData.confidence)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Delay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {impactData.operationalImpact.deliveryDelays.averageDelay} days
            </div>
            <p className="text-xs text-muted-foreground">
              Max: {impactData.operationalImpact.deliveryDelays.maxDelay} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {impactData.operationalImpact.deliveryDelays.affectedOrders.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders experiencing delays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Impact</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(impactData.operationalImpact.cascadeEffects.networkImpactScore)}
            </div>
            <p className="text-xs text-muted-foreground">
              Supply chain disruption
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Impact Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Financial Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Direct Costs:</span>
                        <span className="font-medium">{formatCurrency(impactData.financialImpact.directCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Opportunity Costs:</span>
                        <span className="font-medium">{formatCurrency(impactData.financialImpact.opportunityCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Labor Costs:</span>
                        <span className="font-medium">{formatCurrency(impactData.financialImpact.laborCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Material Costs:</span>
                        <span className="font-medium">{formatCurrency(impactData.financialImpact.materialCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Logistics Costs:</span>
                        <span className="font-medium">{formatCurrency(impactData.financialImpact.logisticsCosts)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Operational Impact</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Delay:</span>
                        <span className="font-medium">{impactData.operationalImpact.deliveryDelays.averageDelay} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Maximum Delay:</span>
                        <span className="font-medium">{impactData.operationalImpact.deliveryDelays.maxDelay} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Affected Orders:</span>
                        <span className="font-medium">{impactData.operationalImpact.deliveryDelays.affectedOrders.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Network Impact:</span>
                        <span className="font-medium">{formatPercentage(impactData.operationalImpact.cascadeEffects.networkImpactScore)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Mitigation Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {impactData.recommendations.map((strategy, index) => (
                    <div key={strategy.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{strategy.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-gray-500">
                              Cost: {formatCurrency(strategy.estimatedCost)}
                            </span>
                            <span className="text-gray-500">
                              ROI: {formatPercentage(strategy.roi)}
                            </span>
                            <span className="text-gray-500">
                              Payback: {strategy.paybackPeriod} months
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm font-medium text-green-600">
                            -{formatPercentage(strategy.riskReduction)} Risk
                          </div>
                          <div className="text-xs text-gray-500">
                            {strategy.timeToImplement} days to implement
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'costs' && (
          <CostAnalysis 
            financialImpact={impactData.financialImpact}
            onCostCategorySelect={(category) => console.log('Selected category:', category)}
          />
        )}

        {activeTab === 'delays' && (
          <DelayTracker
            deliveryDelays={impactData.operationalImpact.deliveryDelays}
            impactMetrics={{
              customerSatisfactionImpact: 25, // Mock data - would come from API
              revenueAtRisk: impactData.financialImpact.opportunityCosts,
              recoveryTimeEstimate: 28
            }}
            onTimeRangeChange={(range) => console.log('Time range changed:', range)}
          />
        )}

        {activeTab === 'cascade' && (
          <CascadeVisualization
            affectedNodes={impactData.operationalImpact.cascadeEffects.affectedNodes}
            propagationPath={impactData.operationalImpact.cascadeEffects.propagationPath}
            networkImpactScore={impactData.operationalImpact.cascadeEffects.networkImpactScore}
            onNodeSelect={(node) => console.log('Selected node:', node)}
          />
        )}
      </div>
    </div>
  );
}