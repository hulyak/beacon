'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface PredictionAccuracyProps {
  accuracy?: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  breakdown?: {
    riskPrediction: number;
    demandForecasting: number;
    delayPrediction: number;
    costEstimation: number;
  };
}

function CircularGauge({ value, size = 160 }: { value: number; size?: number }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(eased * value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const getColor = (val: number) => {
    if (val >= 90) return { stroke: '#10b981', bg: '#d1fae5' };
    if (val >= 75) return { stroke: '#3b82f6', bg: '#dbeafe' };
    if (val >= 60) return { stroke: '#f59e0b', bg: '#fef3c7' };
    return { stroke: '#ef4444', bg: '#fee2e2' };
  };

  const colors = getColor(value);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900">{animatedValue.toFixed(1)}%</span>
        <span className="text-sm text-gray-500">Accuracy</span>
      </div>
    </div>
  );
}

export function PredictionAccuracy({
  accuracy = 98.5,
  trend = 'up',
  trendValue = 2.3,
  breakdown = {
    riskPrediction: 97.2,
    demandForecasting: 94.8,
    delayPrediction: 99.1,
    costEstimation: 96.5,
  },
}: PredictionAccuracyProps) {
  const getStatusIcon = (value: number) => {
    if (value >= 95) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (value >= 85) return <TrendingUp className="w-4 h-4 text-blue-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusColor = (value: number) => {
    if (value >= 95) return 'text-green-600 bg-green-50';
    if (value >= 85) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">Prediction Accuracy</h3>
            <p className="text-gray-500 text-sm">AI model performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['AI Analysis', 'Real-time'].map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Gauge */}
        <div className="flex flex-col items-center">
          <CircularGauge value={accuracy} />
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {trendValue}%
            </span>
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Accuracy by Category</h4>
          <div className="space-y-3">
            {[
              { label: 'Risk Prediction', value: breakdown.riskPrediction },
              { label: 'Demand Forecasting', value: breakdown.demandForecasting },
              { label: 'Delay Prediction', value: breakdown.delayPrediction },
              { label: 'Cost Estimation', value: breakdown.costEstimation },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.value)}
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded ${getStatusColor(item.value)}`}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${
                      item.value >= 95 ? 'bg-green-500' : item.value >= 85 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-blue-700">Model Confidence Level</span>
            <p className="text-xs text-blue-600 mt-1">
              Based on {(10000).toLocaleString()} historical predictions and real-world outcomes
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${star <= Math.round(accuracy / 20) ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PredictionAccuracy;
