'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BeaconLogo } from '../ui/beacon-logo';

interface PageHeaderProps {
  title: string;
  description?: string;
  showLogo?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  showLogo = false,
  children,
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={cn('bg-white border-b border-gray-200 px-6 py-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {showLogo && (
            <BeaconLogo size="md" showTagline={true} />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for pages with limited space
export function PageHeaderCompact({ 
  title, 
  description,
  children,
  className = '' 
}: Omit<PageHeaderProps, 'showLogo'>) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200', className)}>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
      
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}