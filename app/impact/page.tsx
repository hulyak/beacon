'use client';

import React from 'react';
import ModernImpactDashboard from '@/app/components/modern/ModernImpactDashboard';

// Modern Impact Assessment Dashboard Page
// Uses the new Shopify-inspired design system

const ImpactPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Voice command handling logic would go here
  };

  return (
    <ModernImpactDashboard onVoiceCommand={handleVoiceCommand} />
  );
};

export default ImpactPage;