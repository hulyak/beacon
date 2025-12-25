'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, TrendingUp, Target, BarChart3 } from 'lucide-react';

interface MonteCarloVisualizationProps {
  isVisible?: boolean;
  scenarioType?: string;
  iterations?: number;
  mean?: number;
  stdDev?: number;
  p10?: number;
  p50?: number;
  p90?: number;
}

// Generate normal distribution data
function generateDistributionData(mean: number, stdDev: number, points: number = 100) {
  const data = [];
  const minX = mean - 4 * stdDev;
  const maxX = mean + 4 * stdDev;
  const step = (maxX - minX) / points;

  for (let x = minX; x <= maxX; x += step) {
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    data.push({
      x: Math.round(x * 100) / 100,
      probability: Math.round(y * 10000) / 100,
      // Add zones for coloring
      lowZone: x < mean - stdDev ? Math.round(y * 10000) / 100 : 0,
      midZone: x >= mean - stdDev && x <= mean + stdDev ? Math.round(y * 10000) / 100 : 0,
      highZone: x > mean + stdDev ? Math.round(y * 10000) / 100 : 0,
    });
  }

  return data;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="text-gray-900 font-medium">Impact: ${label}M</p>
        <p className="text-gray-500 text-sm">Probability: {payload[0].value.toFixed(2)}%</p>
      </div>
    );
  }
  return null;
};

export function MonteCarloVisualization({
  isVisible = true,
  scenarioType = 'Port Closure',
  iterations = 10000,
  mean = 2.5,
  stdDev = 0.8,
  p10 = 1.5,
  p50 = 2.5,
  p90 = 3.8,
}: MonteCarloVisualizationProps) {
  const distributionData = useMemo(() => generateDistributionData(mean, stdDev), [mean, stdDev]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">Monte Carlo Simulation</h3>
            <p className="text-gray-500 text-sm">{iterations.toLocaleString()} iterations completed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['Monte Carlo', 'Risk Analysis', 'Probability'].map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={distributionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProbability" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="x"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(value) => `$${value}M`}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(value) => `${value}%`}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="probability"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorProbability)"
            />
            {/* Reference lines for percentiles */}
            <ReferenceLine x={p10} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'P10', fill: '#f59e0b', fontSize: 10 }} />
            <ReferenceLine x={p50} stroke="#3b82f6" strokeDasharray="5 5" label={{ value: 'P50', fill: '#3b82f6', fontSize: 10 }} />
            <ReferenceLine x={p90} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'P90', fill: '#ef4444', fontSize: 10 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 font-medium">Mean Impact</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${isNaN(mean) ? '0' : mean.toFixed(1)}M</div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700 font-medium">P10 (Best Case)</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">${isNaN(p10) ? '0' : p10.toFixed(1)}M</div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">P50 (Median)</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">${isNaN(p50) ? '0' : p50.toFixed(1)}M</div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-red-600" />
            <span className="text-xs text-red-700 font-medium">P90 (Worst Case)</span>
          </div>
          <div className="text-2xl font-bold text-red-700">${isNaN(p90) ? '0' : p90.toFixed(1)}M</div>
        </div>
      </div>

      {/* Confidence Interval */}
      <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-emerald-700">95% Confidence Interval</span>
            <p className="text-xs text-emerald-600 mt-1">
              Financial impact is expected to fall between ${isNaN(mean - 2 * stdDev) ? '0.0' : (mean - 2 * stdDev).toFixed(1)}M and ${isNaN(mean + 2 * stdDev) ? '0.0' : (mean + 2 * stdDev).toFixed(1)}M
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-700">95%</div>
            <div className="text-xs text-emerald-600">Confidence</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MonteCarloVisualization;
