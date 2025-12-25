'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  X,
  Settings,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

// Sample notifications - in production these would come from an API
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Critical: Port Delay Detected',
    message: 'Shanghai port experiencing 48-hour delays affecting 12 shipments',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    read: false,
    href: '/dashboard'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Risk Score Increased',
    message: 'Los Angeles warehouse risk score increased to 75%',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    read: false,
    href: '/impact'
  },
  {
    id: '3',
    type: 'success',
    title: 'Scenario Completed',
    message: 'Monte Carlo simulation completed with 1000 iterations',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    read: false,
    href: '/digital-twin'
  },
  {
    id: '4',
    type: 'info',
    title: 'Weekly Report Ready',
    message: 'Your weekly supply chain analytics report is ready to view',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
    href: '/analytics'
  },
  {
    id: '5',
    type: 'success',
    title: 'Sustainability Goal Met',
    message: 'Q4 carbon reduction target achieved - 15% reduction',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    href: '/sustainability'
  }
];

interface NotificationsDropdownProps {
  className?: string;
}

export function NotificationsDropdown({ className }: NotificationsDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.href) {
      router.push(notification.href);
    }
    setIsOpen(false);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'info':
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getBgColor = (type: Notification['type'], read: boolean) => {
    if (read) return 'bg-white';
    switch (type) {
      case 'alert': return 'bg-red-50';
      case 'warning': return 'bg-yellow-50';
      case 'success': return 'bg-green-50';
      case 'info': return 'bg-blue-50';
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={18} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-gray-600" />
                <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-medium rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button className="p-1 hover:bg-gray-200 rounded-md transition-colors">
                  <Settings size={14} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 group',
                        getBgColor(notification.type, notification.read)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm',
                              notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'
                            )}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => removeNotification(notification.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                            >
                              <X size={12} className="text-gray-400" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock size={10} className="text-gray-400" />
                            <span className="text-[10px] text-gray-400">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            {notification.href && (
                              <ExternalLink size={10} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-12 text-center">
                  <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/dashboard');
                  }}
                  className="w-full text-center text-xs text-cyan-600 hover:text-cyan-700 font-medium py-1"
                >
                  View all activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
