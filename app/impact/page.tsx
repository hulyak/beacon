'use client';

import React from 'react';
import ModernImpactDashboard from '@/app/components/modern/ModernImpactDashboard';
import { PageHeaderCompact } from '@/components/layout/page-header';

// Modern Impact Assessment Dashboard Page
// Uses the new Shopify-inspired design system

const ImpactPage: React.FC = () => {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Voice command handling logic would go here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Beacon Branding */}
      <PageHeaderCompact 
        title="Impact Assessment"
        description="Financial and operational impact analysis powered by Beacon intelligence"
      />
      
      <ModernImpactDashboard onVoiceCommand={handleVoiceCommand} />
    </div>
  );
};

export default ImpactPage;