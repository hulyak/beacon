'use client';

import React from 'react';
import ModernAnalyticsDashboard from '@/app/components/modern/ModernAnalyticsDashboard';

// Modern Analytics Dashboard Page
// Uses the new Shopify-inspired design system

const AnalyticsPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
  };

  return <ModernAnalyticsDashboard onVoiceCommand={handleVoiceCommand} />;
};

export default AnalyticsPage;