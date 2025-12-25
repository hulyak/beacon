'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, CheckCircle, Clock, Filter, X, RefreshCw } from 'lucide-react';
import { useVoiceDashboard, useIsAlertsHighlighted, Alert } from '@/lib/voice-dashboard-context';
import { fetchRealTimeAlerts } from '@/lib/real-time-data';

function getPriorityStyles(priority: string) {
  switch (priority) {
    case 'critical':
      return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', dot: 'bg-red-500' };
    case 'high':
      return { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', dot: 'bg-orange-500' };
    case 'medium':
      return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', dot: 'bg-yellow-500' };
    case 'low':
      return { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', dot: 'bg-blue-500' };
    default:
      return { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400', dot: 'bg-slate-500' };
  }
}

function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000 / 60);

  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

interface AlertItemProps {
  alert: Alert;
  onDismiss: (id: string) => void;
}

function AlertItem({ alert, onDismiss }: AlertItemProps) {
  const styles = getPriorityStyles(alert.priority);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`relative p-4 rounded-lg border ${
        alert.isRead ? 'bg-gray-50 border-gray-200' : `${styles.bg} ${styles.border}`
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Priority Indicator */}
        <div className={`w-2 h-2 rounded-full mt-2 ${styles.dot} ${!alert.isRead && 'animate-pulse'}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${alert.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
              {alert.title}
            </h4>
            {alert.actionRequired && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                Action Required
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{alert.message}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(alert.timestamp)}
            </span>
            <span>{alert.region}</span>
            <span className={`capitalize ${styles.text}`}>{alert.priority}</span>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => onDismiss(alert.id)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </motion.div>
  );
}

export function AlertsFeed() {
  const isHighlighted = useIsAlertsHighlighted();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch real-time alerts on mount and every 60 seconds
  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      try {
        const realAlerts = await fetchRealTimeAlerts();
        setAlerts(realAlerts);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const refreshAlerts = async () => {
    setIsLoading(true);
    const realAlerts = await fetchRealTimeAlerts();
    setAlerts(realAlerts);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.isRead;
    return alert.priority === filter;
  });

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <motion.div
      className={`bg-white border rounded-xl p-5 transition-all duration-300 ${
        isHighlighted ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-gray-200'
      }`}
      animate={isHighlighted ? { scale: [1, 1.01, 1] } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bell className={`w-5 h-5 ${isHighlighted ? 'text-cyan-400' : 'text-gray-600'}`} />
          <h2 className="text-lg font-semibold text-gray-900">Live Alerts</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live data" />
        </div>

        {/* Filter & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAlerts}
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Last updated indicator */}
      {lastUpdated && (
        <p className="text-xs text-gray-500 mb-3">
          Updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Alerts List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onDismiss={handleDismiss} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600">No alerts matching filter</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice hint */}
      <p className="text-center text-gray-500 text-xs mt-4">
        Say &quot;Show critical alerts&quot; to filter
      </p>
    </motion.div>
  );
}

export default AlertsFeed;
