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
    container: 'w-7 h-7',
    icon: 'w-4 h-4',
    title: 'text-sm',
    tagline: 'text-[10px]',
    gap: 'gap-2'
  },
  md: {
    container: 'w-9 h-9',
    icon: 'w-5 h-5',
    title: 'text-base',
    tagline: 'text-xs',
    gap: 'gap-2.5'
  },
  lg: {
    container: 'w-11 h-11',
    icon: 'w-6 h-6',
    title: 'text-lg',
    tagline: 'text-xs',
    gap: 'gap-3'
  },
  xl: {
    container: 'w-14 h-14',
    icon: 'w-8 h-8',
    title: 'text-xl',
    tagline: 'text-sm',
    gap: 'gap-3'
  }
};

const variantConfig = {
  default: {
    iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    iconColor: 'text-white',
    title: 'text-gray-900',
    tagline: 'text-gray-500'
  },
  white: {
    iconBg: 'bg-white/10 backdrop-blur-sm border border-white/20',
    iconColor: 'text-white',
    title: 'text-white',
    tagline: 'text-white/70'
  },
  dark: {
    iconBg: 'bg-gradient-to-br from-gray-800 to-gray-900',
    iconColor: 'text-cyan-400',
    title: 'text-gray-900',
    tagline: 'text-gray-600'
  }
};

// Beacon icon - stylized signal/lighthouse
function BeaconIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Signal waves */}
      <path
        d="M12 2C12 2 8 6 8 10C8 12.21 9.79 14 12 14C14.21 14 16 12.21 16 10C16 6 12 2 12 2Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Beacon base */}
      <path
        d="M9 14L7 22H17L15 14"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Signal arc left */}
      <path
        d="M4.5 8C4.5 5.5 6 3 8 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Signal arc right */}
      <path
        d="M19.5 8C19.5 5.5 18 3 16 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function BeaconLogo({
  size = 'md',
  showTagline = false,
  className = '',
  variant = 'default'
}: BeaconLogoProps) {
  const sizeStyles = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  return (
    <div className={cn('flex items-center', sizeStyles.gap, className)}>
      {/* Logo Icon */}
      <div className={cn(
        'rounded-xl flex items-center justify-center shadow-sm',
        sizeStyles.container,
        variantStyles.iconBg
      )}>
        <BeaconIcon className={cn(sizeStyles.icon, variantStyles.iconColor)} />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className={cn(
          'font-semibold tracking-tight leading-none',
          sizeStyles.title,
          variantStyles.title
        )}>
          Beacon
        </span>
        {showTagline && (
          <span className={cn(
            'leading-tight mt-0.5',
            sizeStyles.tagline,
            variantStyles.tagline
          )}>
            Supply Chain Intelligence
          </span>
        )}
      </div>
    </div>
  );
}

// Compact version for tight spaces - icon only or icon + text
export function BeaconLogoCompact({
  size = 'sm',
  variant = 'default',
  className = '',
  showText = true
}: Omit<BeaconLogoProps, 'showTagline'> & { showText?: boolean }) {
  const sizeStyles = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  return (
    <div className={cn('flex items-center', sizeStyles.gap, className)}>
      <div className={cn(
        'rounded-xl flex items-center justify-center shadow-sm',
        sizeStyles.container,
        variantStyles.iconBg
      )}>
        <BeaconIcon className={cn(sizeStyles.icon, variantStyles.iconColor)} />
      </div>
      {showText && (
        <span className={cn(
          'font-semibold tracking-tight',
          sizeStyles.title,
          variantStyles.title
        )}>
          Beacon
        </span>
      )}
    </div>
  );
}