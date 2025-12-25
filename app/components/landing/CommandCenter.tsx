'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Activity, AlertTriangle, Shield, Layers, Clock } from 'lucide-react';

interface Metric {
  id: string;
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
  trend: number[];
}

export function CommandCenter() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [riskIntensity, setRiskIntensity] = useState(50);

  const [metrics, setMetrics] = useState<Metric[]>([
    {
      id: 'sensors',
      label: 'Sensors Active',
      value: 15,
      unit: '',
      color: '#0891b2',
      icon: <Activity className="w-5 h-5" />,
      trend: [12, 14, 13, 15, 14],
    },
    {
      id: 'alerts',
      label: 'Critical Alerts',
      value: 2,
      unit: '',
      color: '#dc2626',
      icon: <AlertTriangle className="w-5 h-5" />,
      trend: [3, 2, 4, 2, 2],
    },
    {
      id: 'integrity',
      label: 'Chain Integrity',
      value: 99.2,
      unit: '%',
      color: '#16a34a',
      icon: <Shield className="w-5 h-5" />,
      trend: [98.5, 99.1, 98.8, 99.2, 99.0],
    },
    {
      id: 'scenarios',
      label: 'Scenarios Active',
      value: 28,
      unit: '',
      color: '#059669',
      icon: <Layers className="w-5 h-5" />,
      trend: [25, 27, 26, 28, 27],
    },
    {
      id: 'response',
      label: 'Agent Response',
      value: 47,
      unit: 'ms',
      color: '#2563eb',
      icon: <Clock className="w-5 h-5" />,
      trend: [52, 48, 50, 47, 49],
    },
  ]);

  // Simulate metric changes
  const simulateMetrics = useCallback(() => {
    setMetrics((prev) =>
      prev.map((metric) => {
        const variance = (riskIntensity / 100) * 10;
        let newValue = metric.value;
        const random = (Math.random() - 0.5) * variance;

        switch (metric.id) {
          case 'sensors':
            newValue = Math.max(10, Math.min(20, metric.value + random));
            break;
          case 'alerts':
            newValue = Math.max(0, Math.min(10, Math.round(metric.value + random / 2)));
            break;
          case 'integrity':
            newValue = Math.max(90, Math.min(100, metric.value + random / 5));
            break;
          case 'scenarios':
            newValue = Math.max(20, Math.min(40, Math.round(metric.value + random)));
            break;
          case 'response':
            newValue = Math.max(30, Math.min(80, Math.round(metric.value + random)));
            break;
        }

        const newTrend = [...metric.trend.slice(1), newValue];

        return {
          ...metric,
          value: Number(newValue.toFixed(1)),
          trend: newTrend,
        };
      })
    );
  }, [riskIntensity]);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(simulateMetrics, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, simulateMetrics]);

  // Sparkline component
  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 60;
        const y = 20 - ((value - min) / range) * 16;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width="60" height="24" className="opacity-70">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Live Command Center
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Real-time monitoring of your supply chain with voice-activated controls
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: metric.color }}>{metric.icon}</span>
                <Sparkline data={metric.trend} color={metric.color} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value}
                <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
              </div>
              <div className="text-sm text-gray-500">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <motion.div
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isSimulating
                  ? 'bg-red-50 border-2 border-red-500 text-red-600 shadow-lg shadow-red-500/10'
                  : 'bg-cyan-50 border-2 border-cyan-500 text-cyan-600 shadow-lg shadow-cyan-500/10'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Simulation</span>
                </>
              )}
            </button>

            {/* Risk Intensity Slider */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-600 text-sm">Risk Intensity</label>
                <span className="text-gray-900 font-semibold">{riskIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={riskIntensity}
                onChange={(e) => setRiskIntensity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isSimulating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span className="text-gray-600 text-sm">
                {isSimulating ? 'Live' : 'Paused'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Voice Command Hint */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-500 text-sm">
            Try saying: &quot;Show me the current risk status&quot; or &quot;Run a port closure scenario&quot;
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default CommandCenter;
