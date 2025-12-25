'use client';

import React from 'react';
import ModernAnalyticsDashboard from '@/app/components/modern/ModernAnalyticsDashboard';
import { PageHeaderCompact } from '@/components/layout/page-header';

// Modern Analytics Dashboard Page
// Uses the new Shopify-inspired design system

const AnalyticsPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Voice command handling logic would go here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Beacon Branding */}
      <PageHeaderCompact 
        title="Analytics Dashboard"
        description="Real-time supply chain analytics powered by Beacon intelligence"
      />
      
      <ModernAnalyticsDashboard onVoiceCommand={handleVoiceCommand} />
    </div>
  );
};

export default AnalyticsPage;