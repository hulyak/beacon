'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Clock, Activity, RefreshCw } from 'lucide-react';
import { useVoiceDashboard, useIsMetricsHighlighted, DashboardMetrics } from '@/lib/voice-dashboard-context';
import { fetchRealTimeMetrics } from '@/lib/real-time-data';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  isHighlighted?: boolean;
}

function MetricCard({ title, value, unit, change, icon, color, isHighlighted }: MetricCardProps) {
  return (
    <motion.div
      className={`relative bg-slate-800/50 border rounded-xl p-5 transition-all duration-300 ${
        isHighlighted
          ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
          : 'border-slate-700 hover:border-slate-600'
      }`}
      animate={isHighlighted ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* Highlight glow effect */}
      {isHighlighted && (
        <div className="absolute inset-0 bg-cyan-500/5 rounded-xl animate-pulse" />
      )}

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">{title}</span>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{value}</span>
          {unit && <span className="text-slate-400">{unit}</span>}
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}% from last week</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function MetricsGrid() {
  const { metrics: contextMetrics, setMetrics } = useVoiceDashboard();
  const isHighlighted = useIsMetricsHighlighted();
  const [metrics, setLocalMetrics] = useState<DashboardMetrics>(contextMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch real-time metrics on mount and every 30 seconds
  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const realMetrics = await fetchRealTimeMetrics();
        setLocalMetrics(realMetrics);
        setMetrics(realMetrics);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [setMetrics]);

  const refreshMetrics = async () => {
    setIsLoading(true);
    const realMetrics = await fetchRealTimeMetrics();
    setLocalMetrics(realMetrics);
    setMetrics(realMetrics);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getRiskLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div>
      {/* Header with live indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Live Metrics</h2>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live data" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshMetrics}
            disabled={isLoading}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Risk Level"
          value={getRiskLabel(metrics.overallRiskLevel)}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={getRiskColor(metrics.overallRiskLevel)}
          isHighlighted={isHighlighted}
        />

        <MetricCard
          title="Active Alerts"
          value={metrics.activeAlerts}
          change={metrics.criticalAlerts > 1 ? 15 : -8}
          icon={<Activity className="w-5 h-5" />}
          color="#ef4444"
          isHighlighted={isHighlighted}
        />

        <MetricCard
          title="Chain Integrity"
          value={metrics.chainIntegrity.toFixed(1)}
          unit="%"
          change={2.3}
          icon={<Shield className="w-5 h-5" />}
          color="#22c55e"
          isHighlighted={isHighlighted}
        />

        <MetricCard
          title="Response Time"
          value={Math.round(metrics.responseTime)}
          unit="ms"
          change={-12}
          icon={<Clock className="w-5 h-5" />}
          color="#3b82f6"
          isHighlighted={isHighlighted}
        />
      </div>
    </div>
  );
}

export default MetricsGrid;
