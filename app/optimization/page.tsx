'use client';

import React from 'react';
import ModernROIDashboard from '@/app/components/modern/ModernROIDashboard';

// Modern ROI Optimization Dashboard Page
// Uses the new Shopify-inspired design system

const OptimizationPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
  };

  return <ModernROIDashboard onVoiceCommand={handleVoiceCommand} />;
};

export default OptimizationPage;