'use client';

import { AIInsightsPanel } from '@/components/features/ai-insights-panel';
import { Network3DVisualization } from '@/components/features/network-3d-visualization';
import { SmartScenarioSimulator } from '@/components/features/smart-scenario-simulator';
import { CollaborationHub } from '@/components/features/collaboration-hub';
import { SmartAlertsSystem } from '@/components/features/smart-alerts-system';
import { ModernTabs } from '@/components/ui/modern-tabs';
import { PageHeaderCompact } from '@/components/layout/page-header';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeaderCompact
        title="Advanced Features"
        description="Cutting-edge AI-powered supply chain intelligence and collaboration tools"
      />

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
    </div>
  );
}