'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SyncStatus {
  status: 'synced' | 'syncing' | 'error' | 'offline';
  lastSync: Date;
  dataPoints: number;
  latency: number;
  accuracy: number;
}

export function DigitalTwinStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'synced',
    lastSync: new Date(),
    dataPoints: 15420,
    latency: 45,
    accuracy: 99.7,
  });

  // Simulate sync updates
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: SyncStatus['status'][] = ['synced', 'synced', 'synced', 'syncing'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      setSyncStatus(prev => ({
        status: randomStatus,
        lastSync: randomStatus === 'synced' ? new Date() : prev.lastSync,
        dataPoints: prev.dataPoints + Math.floor(Math.random() * 100),
        latency: Math.max(20, Math.min(100, prev.latency + (Math.random() - 0.5) * 20)),
        accuracy: Math.max(98, Math.min(100, prev.accuracy + (Math.random() - 0.5) * 0.5)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced': return 'text-green-400';
      case 'syncing': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'offline': return 'text-slate-400';
    }
  };

  const getStatusBg = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced': return 'bg-green-500/20';
      case 'syncing': return 'bg-blue-500/20';
      case 'error': return 'bg-red-500/20';
      case 'offline': return 'bg-slate-500/20';
    }
  };

  const formatTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-2 rounded-lg ${getStatusBg(syncStatus.status)}`}>
              <svg className={`w-5 h-5 ${getStatusColor(syncStatus.status)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            {syncStatus.status === 'syncing' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">Digital Twin</h3>
            <p className="text-slate-400 text-sm">Real-time sync status</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getStatusBg(syncStatus.status)}`}>
          <span className={`w-2 h-2 rounded-full ${
            syncStatus.status === 'synced' ? 'bg-green-400' :
            syncStatus.status === 'syncing' ? 'bg-blue-400 animate-pulse' :
            syncStatus.status === 'error' ? 'bg-red-400' : 'bg-slate-400'
          }`} />
          <span className={`text-sm font-medium capitalize ${getStatusColor(syncStatus.status)}`}>
            {syncStatus.status}
          </span>
        </div>
      </div>

      {/* Sync Animation */}
      <div className="relative h-16 mb-4 overflow-hidden rounded-lg bg-slate-800/50">
        {/* Data Flow Visualization */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          {/* Physical World */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏭</span>
            </div>
            <span className="text-xs text-slate-400 mt-1">Physical</span>
          </div>

          {/* Data Flow */}
          <div className="flex-1 mx-4 relative h-2">
            <div className="absolute inset-0 bg-slate-700 rounded-full" />
            {syncStatus.status === 'syncing' && (
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full"
              />
            )}
            {syncStatus.status === 'synced' && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full opacity-50" />
            )}
          </div>

          {/* Digital Twin */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">💻</span>
            </div>
            <span className="text-xs text-slate-400 mt-1">Digital</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-2 bg-slate-800/30 rounded-lg">
          <div className="text-lg font-bold text-white">
            {(syncStatus.dataPoints / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-slate-400">Data Points</div>
        </div>
        <div className="text-center p-2 bg-slate-800/30 rounded-lg">
          <div className="text-lg font-bold text-cyan-400">
            {syncStatus.latency.toFixed(0)}ms
          </div>
          <div className="text-xs text-slate-400">Latency</div>
        </div>
        <div className="text-center p-2 bg-slate-800/30 rounded-lg">
          <div className="text-lg font-bold text-green-400">
            {syncStatus.accuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Accuracy</div>
        </div>
        <div className="text-center p-2 bg-slate-800/30 rounded-lg">
          <div className="text-lg font-bold text-emerald-400">
            {formatTime(syncStatus.lastSync)}
          </div>
          <div className="text-xs text-slate-400">Last Sync</div>
        </div>
      </div>
    </motion.div>
  );
}
