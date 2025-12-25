'use client';

import React from 'react';
import ModernROIDashboard from '@/app/components/modern/ModernROIDashboard';
import { PageHeaderCompact } from '@/components/layout/page-header';

// Modern ROI Optimization Dashboard Page
// Uses the new Shopify-inspired design system

const OptimizationPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Voice command handling logic would go here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Beacon Branding */}
      <PageHeaderCompact 
        title="ROI Optimization"
        description="Supply chain ROI analysis and optimization recommendations with Beacon"
      />
      
      <ModernROIDashboard onVoiceCommand={handleVoiceCommand} />
    </div>
  );
};

export default OptimizationPage;