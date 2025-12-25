'use client';

import React from 'react';
import ModernSustainabilityDashboard from '@/app/components/modern/ModernSustainabilityDashboard';
import { PageHeaderCompact } from '@/components/layout/page-header';

// Modern Sustainability Dashboard Page
// Uses the new Shopify-inspired design system

const SustainabilityPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Voice command handling logic would go here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Beacon Branding */}
      <PageHeaderCompact 
        title="Sustainability Dashboard"
        description="Environmental impact tracking and green supply chain optimization with Beacon"
      />
      
      <ModernSustainabilityDashboard onVoiceCommand={handleVoiceCommand} />
    </div>
  );
};

export default SustainabilityPage;