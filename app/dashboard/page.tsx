'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RiskMap, AlertsFeed } from '../components/dashboard';
import { SupplyChainNetwork } from '../components/dashboard/SupplyChainNetwork';
import { AgentControls } from '../components/dashboard/AgentControls';
import { AgentResults, AgentResult } from '../components/dashboard/AgentResults';
import { KeyMetricsKPI } from '../components/dashboard/KeyMetricsKPI';
import { VoiceActivationBanner } from '../components/dashboard/VoiceActivationBanner';
import { VoiceDashboardProvider } from '@/lib/voice-dashboard-context';

// Dynamic import for 3D Globe (Three.js doesn't work with SSR)
const Globe3D = dynamic(() => import('../components/dashboard/Globe3D'), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-[470px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading 3D Globe...</p>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAgentTrigger = useCallback(async (agentType: string, params?: Record<string, string>) => {
    setIsLoading(true);

    const newResult: AgentResult = {
      id: Date.now().toString(),
      agentType,
      timestamp: new Date(),
      status: 'pending',
    };

    setAgentResults(prev => [newResult, ...prev]);

    try {
      let url = '';
      let body = {};

      switch (agentType) {
        case 'analyze_risks':
          url = process.env.NEXT_PUBLIC_ANALYZE_RISKS_URL || '';
          body = { region: params?.region || 'asia' };
          break;
        case 'run_scenario':
          url = process.env.NEXT_PUBLIC_RUN_SCENARIO_URL || '';
          body = { scenarioType: params?.scenarioType || 'port_closure', region: params?.region || 'asia' };
          break;
        case 'get_alerts':
          url = process.env.NEXT_PUBLIC_GET_ALERTS_URL || '';
          body = { priority: params?.priority || 'all' };
          break;
        case 'generate_strategy':
          // Use analyze_risks for strategy generation demo
          url = process.env.NEXT_PUBLIC_ANALYZE_RISKS_URL || '';
          body = { region: params?.region || 'asia' };
          break;
      }

      if (!url) {
        const envVarName = agentType === 'analyze_risks' ? 'NEXT_PUBLIC_ANALYZE_RISKS_URL'
          : agentType === 'run_scenario' ? 'NEXT_PUBLIC_RUN_SCENARIO_URL'
          : agentType === 'get_alerts' ? 'NEXT_PUBLIC_GET_ALERTS_URL'
          : 'NEXT_PUBLIC_ANALYZE_RISKS_URL';
        throw new Error(`${envVarName} is not configured. Please check your .env.local file and ensure the Cloud Functions are deployed.`);
      }

      console.log(`[Agent] Calling ${agentType}:`, url, body);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Agent] Response:`, data);

      if (data.success) {
        setAgentResults(prev =>
          prev.map(r =>
            r.id === newResult.id
              ? {
                  ...r,
                  status: 'success',
                  data: {
                    summary: data.data.summary || `${agentType.replace('_', ' ')} completed successfully`,
                    risks: data.data.risks,
                    alerts: data.data.alerts,
                    scenario: data.data.scenario ? {
                      type: data.data.scenario.type,
                      outcomes: data.data.outcomes || [],
                      recommendations: data.data.recommendations || [],
                    } : undefined,
                    aiInsight: data.data.aiInsight || data.data.geminiAnalysis,
                  },
                }
              : r
          )
        );
      } else {
        throw new Error(data.error?.message || 'Request failed');
      }
    } catch (error) {
      console.error(`[Agent] Error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAgentResults(prev =>
        prev.map(r =>
          r.id === newResult.id
            ? {
                ...r,
                status: 'error',
                error: errorMessage.includes('fetch')
                  ? 'Network error - check console for details'
                  : errorMessage,
              }
            : r
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setAgentResults([]);
  }, []);

  return (
    <VoiceDashboardProvider>
      <div className="min-h-screen bg-gray-50 px-4 lg:px-6">
        <div className="max-w-[1800px] mx-auto py-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Voice-Powered
              </span>{' '}
              Supply Chain Dashboard
            </h1>
            <p className="text-gray-600 text-sm lg:text-base">
              Speak naturally to analyze risks, run simulations, and get AI-powered insights
            </p>
          </div>

          {/* Voice Activation Banner - Most Prominent */}
          <div className="mb-6">
            <VoiceActivationBanner />
          </div>

          {/* Top Section: KPIs (Full Width) */}
          <div className="mb-6">
            <KeyMetricsKPI />
          </div>

          {/* Main Content: 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Controls & Results */}
            <div className="lg:col-span-1 space-y-6">
              {/* Agent Controls */}
              <AgentControls
                onAgentTrigger={handleAgentTrigger}
                isLoading={isLoading}
              />

              {/* Agent Results */}
              <AgentResults
                results={agentResults}
                onClear={clearResults}
              />

              {/* Alerts Feed */}
              <AlertsFeed />
            </div>

            {/* Right Column - Visualizations */}
            <div className="lg:col-span-2 space-y-6">
              {/* 3D Globe - Global Supply Chain View */}
              <Globe3D />

              {/* Supply Chain Network */}
              <SupplyChainNetwork />

              {/* Risk Map */}
              <RiskMap />
            </div>
          </div>

        </div>
      </div>
    </VoiceDashboardProvider>
  );
}
