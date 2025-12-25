'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Bell,
  Shield,
  Keyboard,
  ChevronDown,
  ExternalLink,
  CreditCard,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileDropdownProps {
  className?: string;
}

// Mock user data - in production this would come from auth context
const currentUser = {
  name: 'Demo User',
  email: 'demo@beaconsupplychain.com',
  role: 'Supply Chain Manager',
  avatar: null,
  initials: 'DU',
  company: 'Beacon Inc.'
};

export function ProfileDropdown({ className }: ProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: <User size={14} />, label: 'Profile Settings', href: '/settings/profile' },
        { icon: <Building2 size={14} />, label: 'Organization', href: '/settings/organization' },
        { icon: <CreditCard size={14} />, label: 'Billing', href: '/settings/billing' },
      ]
    },
    {
      section: 'Preferences',
      items: [
        { icon: <Bell size={14} />, label: 'Notification Settings', href: '/settings/notifications' },
        { icon: <Moon size={14} />, label: 'Appearance', href: '/settings/appearance', badge: 'Coming Soon' },
        { icon: <Keyboard size={14} />, label: 'Keyboard Shortcuts', action: 'shortcuts' },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: <HelpCircle size={14} />, label: 'Help Center', href: '/help', external: true },
        { icon: <Shield size={14} />, label: 'Privacy & Security', href: '/privacy' },
      ]
    }
  ];

  const handleItemClick = (item: { href?: string; action?: string; external?: boolean }) => {
    if (item.action === 'shortcuts') {
      // Show keyboard shortcuts modal (could be implemented)
      alert('Keyboard Shortcuts:\n\n⌘K - Open search\n⌘/ - Toggle voice\nEsc - Close panels');
      setIsOpen(false);
      return;
    }

    if (item.href) {
      if (item.external) {
        window.open(item.href, '_blank');
      } else {
        router.push(item.href);
      }
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    // In production, this would call auth signout
    alert('Logout functionality would be implemented with your auth provider');
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
          {currentUser.initials}
        </div>
        <ChevronDown size={14} className={cn(
          'text-gray-400 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
          >
            {/* User info header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  {currentUser.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-[10px] font-medium rounded-full">
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-gray-400">
                  {currentUser.company}
                </span>
              </div>
            </div>

            {/* Menu sections */}
            <div className="py-2">
              {menuItems.map((section, sectionIndex) => (
                <div key={section.section}>
                  {sectionIndex > 0 && <div className="my-2 border-t border-gray-100" />}
                  <p className="px-4 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    {section.section}
                  </p>
                  {section.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleItemClick(item)}
                      className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                          {item.icon}
                        </span>
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {'badge' in item && item.badge && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                            {item.badge}
                          </span>
                        )}
                        {'external' in item && item.external && (
                          <ExternalLink size={12} className="text-gray-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 py-2">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-red-50 transition-colors group"
              >
                <LogOut size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                <span className="text-sm text-gray-700 group-hover:text-red-600">
                  Sign out
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>Beacon v1.0.0</span>
                <button
                  onClick={() => {
                    window.open('https://github.com', '_blank');
                    setIsOpen(false);
                  }}
                  className="hover:text-cyan-600 transition-colors"
                >
                  Changelog
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
