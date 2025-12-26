'use client';

import React from 'react';
import Image from 'next/image';
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
    icon: 28,
    title: 'text-sm',
    tagline: 'text-[10px]',
    gap: 'gap-2'
  },
  md: {
    container: 'w-9 h-9',
    icon: 36,
    title: 'text-base',
    tagline: 'text-xs',
    gap: 'gap-2.5'
  },
  lg: {
    container: 'w-11 h-11',
    icon: 44,
    title: 'text-lg',
    tagline: 'text-xs',
    gap: 'gap-3'
  },
  xl: {
    container: 'w-14 h-14',
    icon: 56,
    title: 'text-xl',
    tagline: 'text-sm',
    gap: 'gap-3'
  }
};

const variantConfig = {
  default: {
    title: 'text-gray-900',
    tagline: 'text-gray-500'
  },
  white: {
    title: 'text-white',
    tagline: 'text-white/70'
  },
  dark: {
    title: 'text-gray-900',
    tagline: 'text-gray-600'
  }
};

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
      <Image
        src="/logo.svg"
        alt="Beacon - Voice-first AI supply chain intelligence"
        width={sizeStyles.icon}
        height={sizeStyles.icon}
        className="object-contain"
      />

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
      <Image
        src="/logo.svg"
        alt="Beacon logo"
        width={sizeStyles.icon}
        height={sizeStyles.icon}
        className="object-contain"
      />
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