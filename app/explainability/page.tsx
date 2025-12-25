'use client';

import React from 'react';
import ModernExplainabilityDashboard from '@/app/components/modern/ModernExplainabilityDashboard';
import { PageHeaderCompact } from '@/components/layout/page-header';

// Modern AI Explainability Dashboard Page
// Uses the new Shopify-inspired design system

const ExplainabilityPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Voice command handling logic would go here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Beacon Branding */}
      <PageHeaderCompact 
        title="AI Explainability"
        description="Transparent AI decision-making and model insights with Beacon intelligence"
      />
      
      <ModernExplainabilityDashboard onVoiceCommand={handleVoiceCommand} />
    </div>
  );
};

export default ExplainabilityPage;