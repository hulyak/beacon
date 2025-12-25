'use client';

import React from 'react';
import ModernExplainabilityDashboard from '@/app/components/modern/ModernExplainabilityDashboard';

// Modern AI Explainability Dashboard Page
// Uses the new Shopify-inspired design system

const ExplainabilityPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Voice command handling logic would go here
  };

  return (
    <ModernExplainabilityDashboard onVoiceCommand={handleVoiceCommand} />
  );
};

export default ExplainabilityPage;