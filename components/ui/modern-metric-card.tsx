'use client';

// Modern Metric Card - Shopify-inspired KPI display
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface ModernMetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'neutral';
  };
  format?: 'number' | 'currency' | 'percentage';
  status?: 'positive' | 'negative' | 'neutral' | 'warning';
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ModernMetricCard({
  title,
  value,
  change,
  format = 'number',
  status = 'neutral',
  description,
  icon,
  className,
  onClick,
}: ModernMetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} />;
      case 'down':
        return <TrendingDown size={14} />;
      default:
        return <Minus size={14} />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive':
        return 'border-l-green-500';
      case 'negative':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 hover:shadow-md border-l-4',
        getStatusColor(status),
        onClick && 'cursor-pointer hover:border-gray-300',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {description && (
              <div className="group relative">
                <Info size={14} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
            </span>
            
            {change && (
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                getTrendColor(change.trend)
              )}>
                {getTrendIcon(change.trend)}
                <span>
                  {change.value > 0 ? '+' : ''}{change.value}% {change.period}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {icon && (
          <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-600">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({ 
  children, 
  columns = 4, 
  className 
}: MetricGridProps) {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      'grid gap-6',
      columnClasses[columns],
      className
    )}>
      {children}
    </div>
  );
}

interface ComparisonMetricProps {
  title: string;
  current: {
    label: string;
    value: number;
    format?: 'number' | 'currency' | 'percentage';
  };
  previous: {
    label: string;
    value: number;
    format?: 'number' | 'currency' | 'percentage';
  };
  className?: string;
}

export function ComparisonMetric({
  title,
  current,
  previous,
  className,
}: ComparisonMetricProps) {
  const formatValue = (val: number, format: string = 'number') => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const changePercent = ((current.value - previous.value) / previous.value) * 100;
  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;

  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 p-6',
      className
    )}>
      <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{current.label}</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatValue(current.value, current.format)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{previous.label}</span>
          <span className="text-lg font-medium text-gray-600">
            {formatValue(previous.value, previous.format)}
          </span>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Change</span>
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isNeutral ? 'text-gray-600' : isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {isNeutral ? (
                <Minus size={14} />
              ) : isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span>
                {isNeutral ? '0' : `${isPositive ? '+' : ''}${changePercent.toFixed(1)}`}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}