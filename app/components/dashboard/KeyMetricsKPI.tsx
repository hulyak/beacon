'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface KeyMetricsKPIProps {
  isHighlighted?: boolean;
}

interface MetricsData {
  overallRisk: {
    score: number;
    level: string;
    trend: 'up' | 'down';
    change: number;
  };
  costEfficiency: {
    score: number;
    trend: 'up' | 'down';
    change: number;
  };
  sustainability: {
    score: number;
    rating: string;
    carbonFootprint: number;
  };
  chainIntegrity: {
    score: number;
    nodesOnline: number;
    totalNodes: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  responseTime: {
    average: number;
    unit: string;
  };
  timestamp: string;
}

export function KeyMetricsKPI({ isHighlighted = false }: KeyMetricsKPIProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const metricsUrl = process.env.NEXT_PUBLIC_GET_METRICS_URL;
      if (!metricsUrl) {
        throw new Error('Metrics API not configured');
      }

      const response = await fetch(metricsUrl);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh every 15 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-600';
      case 'moderate': return 'bg-yellow-100 text-yellow-600';
      case 'high': return 'bg-orange-100 text-orange-600';
      case 'critical': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white border border-red-300 rounded-xl p-4 shadow-sm">
        <p className="text-red-600 text-sm">{error || 'Failed to load metrics'}</p>
        <button
          onClick={fetchMetrics}
          className="mt-2 text-xs text-gray-500 hover:text-gray-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-xl p-4 shadow-sm transition-all duration-300 ${
        isHighlighted
          ? 'border-cyan-500 ring-2 ring-cyan-500/20'
          : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">Key Performance Indicators</h3>
            <p className="text-gray-500 text-sm">Real-time supply chain metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
          <button
            onClick={fetchMetrics}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Efficiency */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Cost Efficiency</span>
            <span className={`flex items-center text-xs ${
              metrics.costEfficiency.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.costEfficiency.trend === 'up' ? '↑' : '↓'}
              {metrics.costEfficiency.change}%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {metrics.costEfficiency.score.toFixed(1)}%
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.costEfficiency.score}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            />
          </div>
        </div>

        {/* Risk Level with Gauge */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Risk Level</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getRiskBgColor(metrics.overallRisk.level)}`}>
              {metrics.overallRisk.level.charAt(0).toUpperCase() + metrics.overallRisk.level.slice(1)}
            </span>
          </div>
          <div className={`text-3xl font-bold ${getRiskColor(metrics.overallRisk.level)}`}>
            {metrics.overallRisk.score}
          </div>
          {/* Gauge */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
            <div className="absolute inset-0 flex">
              <div className="w-[30%] bg-green-500/30" />
              <div className="w-[30%] bg-yellow-500/30" />
              <div className="w-[20%] bg-orange-500/30" />
              <div className="w-[20%] bg-red-500/30" />
            </div>
            <motion.div
              initial={{ left: 0 }}
              animate={{ left: `${metrics.overallRisk.score}%` }}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full shadow-lg"
              style={{ marginLeft: '-6px' }}
            />
          </div>
        </div>

        {/* Sustainability Score */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Sustainability</span>
            <span className={`text-xs font-medium ${
              metrics.sustainability.rating === 'Excellent' ? 'text-green-600' :
              metrics.sustainability.rating === 'Good' ? 'text-blue-600' :
              metrics.sustainability.rating === 'Fair' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.sustainability.rating}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {metrics.sustainability.score}
            <span className="text-lg text-gray-400">/100</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.sustainability.score}%` }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            />
          </div>
        </div>

        {/* Carbon Footprint */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Carbon Footprint</span>
            <span className="text-xs text-gray-400">kg CO₂</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics.sustainability.carbonFootprint.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-yellow-500"
                style={{ width: `${Math.min(100, (metrics.sustainability.carbonFootprint / 2000) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">/ 2000</span>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
          <div className="text-lg font-bold text-red-600">{metrics.alerts.critical}</div>
          <div className="text-xs text-gray-500 truncate">Critical</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
          <div className="text-lg font-bold text-orange-600">{metrics.alerts.high}</div>
          <div className="text-xs text-gray-500 truncate">High</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
          <div className="text-lg font-bold text-cyan-600">{metrics.responseTime.average}<span className="text-xs">{metrics.responseTime.unit}</span></div>
          <div className="text-xs text-gray-500 truncate">Latency</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
          <div className="text-lg font-bold text-green-600">{metrics.chainIntegrity.nodesOnline}/{metrics.chainIntegrity.totalNodes}</div>
          <div className="text-xs text-gray-500 truncate">Nodes</div>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="mt-3 text-xs text-gray-500 text-right">
          Updated {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </motion.div>
  );
}
