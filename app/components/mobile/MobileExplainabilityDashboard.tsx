'use client';

// Mobile Explainability Dashboard Component
// Requirements: 9.1, 9.2 - Mobile-responsive interfaces with touch-optimized navigation
// Requirements: 9.3 - Mobile voice functionality compatibility

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Info,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ExplainabilityData {
  reasoning: {
    steps: Array<{
      step: number;
      description: string;
      confidence: number;
      factors: string[];
    }>;
    overallConfidence: number;
  };
  agentContributions: Array<{
    agent: string;
    contribution: number;
    reasoning: string;
    confidence: number;
  }>;
  decisionFactors: Array<{
    factor: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
    score: number;
  }>;
}

interface MobileExplainabilityDashboardProps {
  className?: string;
  onVoiceCommand?: (command: string) => void;
  sessionId?: string;
}

export default function MobileExplainabilityDashboard({ 
  className = '', 
  onVoiceCommand,
  sessionId 
}: MobileExplainabilityDashboardProps) {
  const [data, setData] = useState<ExplainabilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('reasoning');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchExplainabilityData();
  }, []);

  const fetchExplainabilityData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/explainability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comprehensive',
          data: {
            analysisId: 'latest',
            detailLevel: 'summary'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Explainability fetch failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch explainability data');
      }
    } catch (err) {
      console.error('Explainability fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load explainability data');
    } finally {
      setLoading(false);
    }
  };
  const handleVoiceToggle = (): void => {
    setIsVoiceActive(!isVoiceActive);
    if (onVoiceCommand) {
      onVoiceCommand(isVoiceActive ? 'stop_listening' : 'start_listening');
    }
  };

  const toggleStepExpansion = (stepNumber: number): void => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral'): React.ReactElement => {
    switch (impact) {
      case 'positive':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading AI explanations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="text-center space-y-4 p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900">Error Loading Explanations</h3>
          <p className="text-gray-600">{error}</p>
          <Button onClick={fetchExplainabilityData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Explainability</h1>
            <p className="text-sm text-gray-500">Understanding AI decisions</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getConfidenceColor(data?.reasoning.overallConfidence || 0)}>
              {Math.round((data?.reasoning.overallConfidence || 0) * 100)}% Confidence
            </Badge>
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
      </div>

      {/* Mobile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="reasoning" className="text-xs">Reasoning</TabsTrigger>
          <TabsTrigger value="agents" className="text-xs">Agents</TabsTrigger>
          <TabsTrigger value="factors" className="text-xs">Factors</TabsTrigger>
        </TabsList>

        {/* Reasoning Tab */}
        <TabsContent value="reasoning" className="px-4 pb-4">
          <div className="space-y-3">
            {data?.reasoning.steps.map((step) => (
              <Card key={step.step} className="touch-manipulation">
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleStepExpansion(step.step)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">{step.step}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{step.description}</p>
                        <p className={`text-xs ${getConfidenceColor(step.confidence)}`}>
                          {Math.round(step.confidence * 100)}% confidence
                        </p>
                      </div>
                    </div>
                    {expandedSteps.has(step.step) ? 
                      <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    }
                  </div>
                  
                  {expandedSteps.has(step.step) && (
                    <div className="mt-3 pl-9 space-y-2">
                      <p className="text-xs text-gray-600">Key factors:</p>
                      {step.factors.map((factor, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span className="text-xs text-gray-700">{factor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="px-4 pb-4">
          <div className="space-y-3">
            {data?.agentContributions.map((agent, index) => (
              <Card key={index} className="touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">{agent.agent}</h3>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(agent.contribution)}% contribution
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{agent.reasoning}</p>
                  <div className="flex items-center justify-between">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${agent.contribution}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs ${getConfidenceColor(agent.confidence)}`}>
                      {Math.round(agent.confidence * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Factors Tab */}
        <TabsContent value="factors" className="px-4 pb-4">
          <div className="space-y-3">
            {data?.decisionFactors.map((factor, index) => (
              <Card key={index} className="touch-manipulation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getImpactIcon(factor.impact)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{factor.factor}</p>
                        <p className="text-xs text-gray-500">Weight: {Math.round(factor.weight * 100)}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{factor.score}</p>
                      <p className="text-xs text-gray-500 capitalize">{factor.impact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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