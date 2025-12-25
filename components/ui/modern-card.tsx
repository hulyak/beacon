'use client';

// Modern Card Component - Shopify-inspired design
import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
}

export function ModernCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
}: ModernCardProps) {
  const baseClasses = 'rounded-xl transition-all duration-200 ease-out';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-lg border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-gray-50 border border-gray-200',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  
  const hoverClasses = hover
    ? 'hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer'
    : '';
  
  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface ModernCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernCardHeader({ children, className }: ModernCardHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {children}
    </div>
  );
}

interface ModernCardTitleProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ModernCardTitle({ 
  children, 
  className, 
  size = 'md' 
}: ModernCardTitleProps) {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-semibold',
    xl: 'text-3xl font-bold',
  };
  
  return (
    <h3 className={cn(
      'text-gray-900 leading-tight',
      sizeClasses[size],
      className
    )}>
      {children}
    </h3>
  );
}

interface ModernCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernCardDescription({ children, className }: ModernCardDescriptionProps) {
  return (
    <p className={cn('text-gray-600 text-sm mt-1', className)}>
      {children}
    </p>
  );
}

interface ModernCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernCardContent({ children, className }: ModernCardContentProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

interface ModernCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernCardFooter({ children, className }: ModernCardFooterProps) {
  return (
    <div className={cn('mt-6 pt-4 border-t border-gray-100', className)}>
      {children}
    </div>
  );
}