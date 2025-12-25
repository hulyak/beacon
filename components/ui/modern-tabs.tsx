'use client';

// Modern Tabs Component - Shopify-inspired design
import React, { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface ModernTabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function ModernTabs({ 
  defaultValue, 
  children, 
  className,
  onValueChange 
}: ModernTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface ModernTabsListProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function ModernTabsList({ 
  children, 
  className,
  variant = 'default' 
}: ModernTabsListProps) {
  const baseClasses = 'flex';
  
  const variantClasses = {
    default: 'bg-gray-100 p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-gray-200',
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { variant } as any)
          : child
      )}
    </div>
  );
}

interface ModernTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
  disabled?: boolean;
}

export function ModernTabsTrigger({ 
  value, 
  children, 
  className,
  variant = 'default',
  disabled = false 
}: ModernTabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('ModernTabsTrigger must be used within ModernTabs');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  const baseClasses = 'px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  
  const variantClasses = {
    default: cn(
      'rounded-md',
      isActive 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    ),
    pills: cn(
      'rounded-full px-4',
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    ),
    underline: cn(
      'border-b-2 -mb-px',
      isActive 
        ? 'border-blue-600 text-blue-600' 
        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
    ),
  };

  return (
    <button
      type="button"
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

interface ModernTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function ModernTabsContent({ 
  value, 
  children, 
  className 
}: ModernTabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('ModernTabsContent must be used within ModernTabs');
  }

  const { activeTab } = context;

  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={cn('mt-4', className)}>
      {children}
    </div>
  );
}

// Compound component pattern
ModernTabs.List = ModernTabsList;
ModernTabs.Trigger = ModernTabsTrigger;
ModernTabs.Content = ModernTabsContent;