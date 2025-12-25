'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExplainabilityResponse,
  ReasoningStep,
  AgentContribution,
  DecisionNode,
  UncertaintyFactor
} from '@/lib/types/enhanced-analytics';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Network,
  Target,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface AIExplanationDashboardProps {
  recommendationId?: string;
  analysisType: 'impact' | 'sustainability' | 'optimization';
  explanationType?: 'summary' | 'detailed' | 'decision_tree';
  context?: Record<string, any>;
  onExplanationChange?: (explanation: ExplainabilityResponse) => void;
}

export default function AIExplanationDashboard({
  recommendationId = 'default-recommendation',
  analysisType,
  explanationType = 'summary',
  context = {},
  onExplanationChange
}: AIExplanationDashboardProps) {
  const [explanation, setExplanation] = useState<ExplainabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'reasoning' | 'agents' | 'tree'>('overview');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchExplanation();
  }, [recommendationId, analysisType, explanationType, context]);

  const fetchExplanation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/explainability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendationId,
          analysisType,
          explanationType,
          context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch explanation');
      }

      const data: ExplainabilityResponse = await response.json();
      setExplanation(data);
      onExplanationChange?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleStepExpansion = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 65) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 65) return <AlertTriangle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const renderOverview = () => {
    if (!explanation) return null;

    return (
      <div className="space-y-6">
        {/* Confidence Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Analysis Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getConfidenceIcon(explanation.confidence)}
                <span className="text-2xl font-bold">{explanation.confidence}%</span>
                <Badge className={getConfidenceColor(explanation.confidence)}>
                  {explanation.confidence >= 80 ? 'High Confidence' : 
                   explanation.confidence >= 65 ? 'Medium Confidence' : 'Moderate Confidence'}
                </Badge>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{explanation.explanation}</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{explanation.reasoning.length}</div>
                <div className="text-sm text-blue-600">Analysis Steps</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(explanation.agentContributions).filter(a => a.confidence > 70).length}
                </div>
                <div className="text-sm text-green-600">High-Conf Agents</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{explanation.uncertaintyFactors.length}</div>
                <div className="text-sm text-yellow-600">Risk Factors</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{explanation.decisionTree.length}</div>
                <div className="text-sm text-purple-600">Decision Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uncertainty Factors */}
        {explanation.uncertaintyFactors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Uncertainty Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {explanation.uncertaintyFactors.map((factor, index) => (
                  <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{factor.factor}</h4>
                      <Badge variant={factor.impact === 'high' ? 'destructive' : 
                                   factor.impact === 'medium' ? 'default' : 'secondary'}>
                        {factor.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{factor.description}</p>
                    <p className="text-sm text-blue-600 font-medium">
                      Mitigation: {factor.mitigationSuggestion}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderReasoning = () => {
    if (!explanation) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Step-by-Step Reasoning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {explanation.reasoning.map((step, index) => (
                <div key={step.step} className="border rounded-lg p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleStepExpansion(step.step)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {step.step}
                      </div>
                      <div>
                        <h3 className="font-medium">{step.description}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getConfidenceIcon(step.confidence)}
                          <span className="text-sm text-gray-600">{step.confidence}% confidence</span>
                        </div>
                      </div>
                    </div>
                    {expandedSteps.has(step.step) ? 
                      <ChevronDown className="w-5 h-5" /> : 
                      <ChevronRight className="w-5 h-5" />
                    }
                  </div>
                  
                  {expandedSteps.has(step.step) && (
                    <div className="mt-4 pl-11 space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">Reasoning:</h4>
                        <p className="text-sm text-gray-600">{step.reasoning}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">Data Sources:</h4>
                        <p className="text-sm text-blue-600">{step.dataSource}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAgents = () => {
    if (!explanation) return null;

    const agents = [
      { key: 'infoAgent', name: 'Information Agent', icon: Database, color: 'blue' },
      { key: 'scenarioAgent', name: 'Scenario Agent', icon: Network, color: 'green' },
      { key: 'impactAgent', name: 'Impact Agent', icon: TrendingUp, color: 'orange' },
      { key: 'strategyAgent', name: 'Strategy Agent', icon: Target, color: 'purple' }
    ];

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Agent Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {agents.map(({ key, name, icon: Icon, color }) => {
                const agent = explanation.agentContributions[key as keyof typeof explanation.agentContributions];
                return (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-medium">{name}</h3>
                          <div className="flex items-center gap-2">
                            {getConfidenceIcon(agent.confidence)}
                            <span className="text-sm text-gray-600">{agent.confidence}% confidence</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Weight</div>
                        <div className="font-bold">{Math.round(agent.contributionWeight * 100)}%</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-600">Processing Time</div>
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {(agent.processingTime / 1000).toFixed(1)}s
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Data Quality</div>
                        <div className="font-medium">{agent.dataQuality}%</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Key Insights:</div>
                      <div className="space-y-1">
                        {agent.keyInsights.map((insight, index) => (
                          <div key={index} className="text-sm bg-gray-50 rounded px-2 py-1">
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDecisionTree = () => {
    if (!explanation) return null;

    const renderNode = (node: DecisionNode, level: number = 0) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      
      return (
        <div key={node.id} className={`ml-${level * 4}`}>
          <div 
            className={`border rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-50 ${
              node.type === 'condition' ? 'border-blue-200 bg-blue-50' :
              node.type === 'action' ? 'border-green-200 bg-green-50' :
              'border-purple-200 bg-purple-50'
            }`}
            onClick={() => hasChildren && toggleNodeExpansion(node.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasChildren && (
                  isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-medium">{node.label}</span>
                <Badge variant={
                  node.type === 'condition' ? 'default' :
                  node.type === 'action' ? 'secondary' : 'outline'
                }>
                  {node.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {getConfidenceIcon(node.confidence)}
                <span className="text-sm">{node.confidence}%</span>
              </div>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {node.children.map(childId => {
                const childNode = explanation.decisionTree.find(n => n.id === childId);
                return childNode ? renderNode(childNode, level + 1) : null;
              })}
            </div>
          )}
        </div>
      );
    };

    const rootNode = explanation.decisionTree.find(node => node.id === 'root');

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Decision Tree
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedNodes(new Set(explanation.decisionTree.map(n => n.id)))}
                className="mr-2"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedNodes(new Set())}
              >
                Collapse All
              </Button>
            </div>
            
            <div className="space-y-2">
              {rootNode && renderNode(rootNode)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error Loading Explanation</span>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchExplanation} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: Info },
            { key: 'reasoning', label: 'Reasoning', icon: TrendingUp },
            { key: 'agents', label: 'Agents', icon: Network },
            { key: 'tree', label: 'Decision Tree', icon: Network }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedView(key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'reasoning' && renderReasoning()}
      {selectedView === 'agents' && renderAgents()}
      {selectedView === 'tree' && renderDecisionTree()}
    </div>
  );
}