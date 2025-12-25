'use client';

import React from 'react';
import ModernSustainabilityDashboard from '@/app/components/modern/ModernSustainabilityDashboard';

// Modern Sustainability Dashboard Page
// Uses the new Shopify-inspired design system

const SustainabilityPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Voice command handling logic would go here
  };

  return (
    <ModernSustainabilityDashboard onVoiceCommand={handleVoiceCommand} />
  );
};

export default SustainabilityPage;