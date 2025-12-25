'use client';

// Modern Navigation - Shopify-inspired sidebar and header
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  Leaf,
  Brain,
  Target,
  Settings,
  Menu,
  X,
  ChevronDown,
  Home,
  Cpu,
  PlayCircle,
  Sparkles
} from 'lucide-react';
import { ModernButton } from '../ui/modern-button';
import { BeaconLogo } from '../ui/beacon-logo';
import { SearchCommand } from './search-command';
import { NotificationsDropdown } from './notifications-dropdown';
import { ProfileDropdown } from './profile-dropdown';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home size={20} />,
    href: '/dashboard',
  },
  {
    id: 'digital-twin',
    label: 'Digital Twin',
    icon: <Cpu size={20} />,
    href: '/digital-twin',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    icon: <PlayCircle size={20} />,
    href: '/scenarios',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 size={20} />,
    href: '/analytics',
    badge: '2',
  },
  {
    id: 'impact',
    label: 'Impact Assessment',
    icon: <TrendingUp size={20} />,
    href: '/impact',
  },
  {
    id: 'sustainability',
    label: 'Sustainability',
    icon: <Leaf size={20} />,
    href: '/sustainability',
    badge: 'New',
  },
  {
    id: 'explainability',
    label: 'AI Explainability',
    icon: <Brain size={20} />,
    href: '/explainability',
  },
  {
    id: 'optimization',
    label: 'ROI Optimization',
    icon: <Target size={20} />,
    href: '/optimization',
  },
  {
    id: 'features',
    label: 'Advanced Features',
    icon: <Sparkles size={20} />,
    href: '/features',
    badge: 'New',
  },
];

interface ModernNavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onVoiceToggle?: () => void;
  isVoiceActive?: boolean;
}

export function ModernNavigation({
  currentPath = '/',
  onNavigate,
}: ModernNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavigate = (href: string) => {
    onNavigate?.(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <ModernButton
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            icon={isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          />
          
          <BeaconLogo size="md" className="hidden sm:flex" />
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <SearchCommand />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Menu */}
          <ProfileDropdown className="hidden sm:block" />
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-out lg:translate-x-0 lg:top-16',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="lg:hidden p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <BeaconLogo size="md" />
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                icon={<X size={20} />}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigationItems.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                currentPath={currentPath}
                onNavigate={handleNavigate}
                isExpanded={expandedItems.has(item.id)}
                onToggleExpanded={() => toggleExpanded(item.id)}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <ModernButton
              variant="ghost"
              size="sm"
              fullWidth
              icon={<Settings size={16} />}
              className="justify-start"
            >
              Settings
            </ModernButton>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

interface NavigationItemProps {
  item: NavigationItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  level?: number;
}

function NavigationItem({
  item,
  currentPath,
  onNavigate,
  isExpanded = false,
  onToggleExpanded,
  level = 0,
}: NavigationItemProps) {
  const isActive = currentPath === item.href;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            onToggleExpanded?.();
          } else {
            onNavigate(item.href);
          }
        }}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
          level > 0 && 'ml-4',
          isActive
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn(
            'flex-shrink-0',
            isActive ? 'text-blue-600' : 'text-gray-500'
          )}>
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.badge && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              typeof item.badge === 'string'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            )}>
              {item.badge}
            </span>
          )}
          
          {hasChildren && (
            <ChevronDown
              size={16}
              className={cn(
                'text-gray-400 transition-transform duration-150',
                isExpanded && 'transform rotate-180'
              )}
            />
          )}
        </div>
      </button>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              currentPath={currentPath}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}