'use client';

import { useRouter } from 'next/navigation';
import { AIInsightsPanel } from '@/components/features/ai-insights-panel';
import { Network3DVisualization } from '@/components/features/network-3d-visualization';
import { SmartScenarioSimulator } from '@/components/features/smart-scenario-simulator';
import { CollaborationHub } from '@/components/features/collaboration-hub';
import { SmartAlertsSystem } from '@/components/features/smart-alerts-system';
import { ModernTabs } from '@/components/ui/modern-tabs';
import { BeaconLogo } from '@/components/ui/beacon-logo';
import { ModernButton } from '@/components/ui/modern-button';
import { UnifiedVoiceAssistant } from '@/components/voice/unified-voice-assistant';
import { ArrowLeft, Home } from 'lucide-react';

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-width header with navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Navigation bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                icon={<ArrowLeft size={16} />}
              >
                Back
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                icon={<Home size={16} />}
              >
                Dashboard
              </ModernButton>
            </div>
            <BeaconLogo size="md" showTagline={true} />
          </div>
          
          {/* Page title */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced Features</h1>
            <p className="text-lg text-gray-600">
              Cutting-edge AI-powered supply chain intelligence and collaboration tools
            </p>
          </div>
        </div>
      </div>

      {/* Full-width content */}
      <div className="w-full px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <ModernTabs defaultValue="ai-insights">
            <ModernTabs.List variant="underline" className="mb-8">
              <ModernTabs.Trigger value="ai-insights">AI Insights</ModernTabs.Trigger>
              <ModernTabs.Trigger value="smart-alerts">Smart Alerts</ModernTabs.Trigger>
              <ModernTabs.Trigger value="network-3d">3D Network</ModernTabs.Trigger>
              <ModernTabs.Trigger value="scenarios">Scenario Simulator</ModernTabs.Trigger>
              <ModernTabs.Trigger value="collaboration">Team Hub</ModernTabs.Trigger>
            </ModernTabs.List>

            <ModernTabs.Content value="ai-insights">
              <AIInsightsPanel />
            </ModernTabs.Content>

            <ModernTabs.Content value="smart-alerts">
              <SmartAlertsSystem />
            </ModernTabs.Content>

            <ModernTabs.Content value="network-3d">
              <Network3DVisualization />
            </ModernTabs.Content>

            <ModernTabs.Content value="scenarios">
              <SmartScenarioSimulator />
            </ModernTabs.Content>

            <ModernTabs.Content value="collaboration">
              <CollaborationHub />
            </ModernTabs.Content>
          </ModernTabs>
        </div>
      </div>

      {/* Voice Assistant */}
      <UnifiedVoiceAssistant currentPage="/features" />
    </div>
  );
}