'use client';

// Modern Badge Component - Shopify-inspired design
import React from 'react';
import { cn } from '@/lib/utils';

interface ModernBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
}

export function ModernBadge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  className,
}: ModernBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium transition-colors';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border border-gray-200',
    primary: 'bg-blue-100 text-blue-700 border border-blue-200',
    success: 'bg-green-100 text-green-700 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    error: 'bg-red-100 text-red-700 border border-red-200',
    info: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';
  
  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses,
        className
      )}
    >
      {children}
    </span>
  );
}

interface ModernStatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'error' | 'warning' | 'success';
  showDot?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function ModernStatusBadge({
  status,
  showDot = true,
  children,
  className,
}: ModernStatusBadgeProps) {
  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online', variant: 'success' as const },
    offline: { color: 'bg-gray-400', label: 'Offline', variant: 'default' as const },
    busy: { color: 'bg-red-500', label: 'Busy', variant: 'error' as const },
    away: { color: 'bg-yellow-500', label: 'Away', variant: 'warning' as const },
    error: { color: 'bg-red-500', label: 'Error', variant: 'error' as const },
    warning: { color: 'bg-yellow-500', label: 'Warning', variant: 'warning' as const },
    success: { color: 'bg-green-500', label: 'Success', variant: 'success' as const },
  };
  
  const config = statusConfig[status];
  
  return (
    <ModernBadge variant={config.variant} className={className}>
      {showDot && (
        <span className={cn('w-2 h-2 rounded-full mr-1.5', config.color)} />
      )}
      {children || config.label}
    </ModernBadge>
  );
}

interface ModernCountBadgeProps {
  count: number;
  max?: number;
  showZero?: boolean;
  className?: string;
}

export function ModernCountBadge({
  count,
  max = 99,
  showZero = false,
  className,
}: ModernCountBadgeProps) {
  if (count === 0 && !showZero) return null;
  
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <ModernBadge
      variant="error"
      size="sm"
      rounded
      className={cn('min-w-[1.25rem] h-5 justify-center', className)}
    >
      {displayCount}
    </ModernBadge>
  );
}

interface ModernProgressBadgeProps {
  progress: number;
  total?: number;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function ModernProgressBadge({
  progress,
  total = 100,
  showPercentage = true,
  variant = 'primary',
  className,
}: ModernProgressBadgeProps) {
  const percentage = Math.round((progress / total) * 100);
  
  return (
    <ModernBadge variant={variant} className={className}>
      {showPercentage ? `${percentage}%` : `${progress}/${total}`}
    </ModernBadge>
  );
}