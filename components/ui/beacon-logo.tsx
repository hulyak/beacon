'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BeaconLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  variant?: 'default' | 'white' | 'dark';
}

const sizeConfig = {
  sm: {
    icon: 'w-6 h-6',
    title: 'text-sm',
    tagline: 'text-xs'
  },
  md: {
    icon: 'w-8 h-8',
    title: 'text-lg',
    tagline: 'text-xs'
  },
  lg: {
    icon: 'w-10 h-10',
    title: 'text-xl',
    tagline: 'text-sm'
  },
  xl: {
    icon: 'w-12 h-12',
    title: 'text-2xl',
    tagline: 'text-base'
  }
};

const variantConfig = {
  default: {
    icon: 'bg-gradient-to-br from-blue-600 to-blue-700',
    iconText: 'text-white',
    title: 'text-gray-900',
    tagline: 'text-gray-500'
  },
  white: {
    icon: 'bg-gradient-to-br from-white to-gray-100 border border-gray-200',
    iconText: 'text-blue-600',
    title: 'text-white',
    tagline: 'text-white/70'
  },
  dark: {
    icon: 'bg-gradient-to-br from-gray-800 to-gray-900',
    iconText: 'text-white',
    title: 'text-gray-900',
    tagline: 'text-gray-600'
  }
};

export function BeaconLogo({ 
  size = 'md', 
  showTagline = true, 
  className = '',
  variant = 'default'
}: BeaconLogoProps) {
  const sizeStyles = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Icon */}
      <div className={cn(
        'rounded-lg flex items-center justify-center font-bold',
        sizeStyles.icon,
        variantStyles.icon
      )}>
        <span className={cn(
          'font-bold',
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg',
          variantStyles.iconText
        )}>
          B
        </span>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <h1 className={cn(
          'font-semibold leading-tight',
          sizeStyles.title,
          variantStyles.title
        )}>
          Beacon
        </h1>
        {showTagline && (
          <p className={cn(
            'leading-tight',
            sizeStyles.tagline,
            variantStyles.tagline
          )}>
            Supply Chain Intelligence
          </p>
        )}
      </div>
    </div>
  );
}

// Compact version for tight spaces
export function BeaconLogoCompact({ 
  size = 'sm',
  variant = 'default',
  className = ''
}: Omit<BeaconLogoProps, 'showTagline'>) {
  const sizeStyles = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'rounded-lg flex items-center justify-center font-bold',
        sizeStyles.icon,
        variantStyles.icon
      )}>
        <span className={cn(
          'font-bold',
          size === 'sm' ? 'text-xs' : 'text-sm',
          variantStyles.iconText
        )}>
          B
        </span>
      </div>
      <span className={cn(
        'font-semibold',
        sizeStyles.title,
        variantStyles.title
      )}>
        Beacon
      </span>
    </div>
  );
}