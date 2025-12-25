'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SimulationProgressProps {
  isRunning: boolean;
  scenarioType?: string;
  region?: string;
  onComplete?: () => void;
  duration?: number; // in ms
}

const stages = [
  { name: 'Initializing', icon: '⚡', description: 'Setting up simulation parameters' },
  { name: 'Collecting Data', icon: '📊', description: 'Gathering real-time supply chain data' },
  { name: 'Running Model', icon: '🧠', description: 'Processing with Gemini 2.5 AI' },
  { name: 'Analyzing Impact', icon: '📈', description: 'Calculating disruption effects' },
  { name: 'Generating Strategies', icon: '💡', description: 'Creating mitigation recommendations' },
];

export function SimulationProgress({
  isRunning,
  scenarioType = 'disruption',
  region = 'global',
  onComplete,
  duration = 5000,
}: SimulationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      setProgress(0);
      setCurrentStage(0);
      setIsComplete(false);
      return;
    }

    const stageInterval = duration / stages.length;
    const progressInterval = 50;
    const progressIncrement = 100 / (duration / progressInterval);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev + progressIncrement;
        if (next >= 100) {
          clearInterval(progressTimer);
          setIsComplete(true);
          onComplete?.();
          return 100;
        }
        return next;
      });
    }, progressInterval);

    const stageTimer = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= stages.length - 1) {
          clearInterval(stageTimer);
          return prev;
        }
        return prev + 1;
      });
    }, stageInterval);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stageTimer);
    };
  }, [isRunning, duration, onComplete]);

  if (!isRunning && !isComplete) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isComplete ? 'bg-green-100' : 'bg-emerald-100'}`}>
            {isComplete ? (
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold">
              {isComplete ? 'Simulation Complete' : 'Running Simulation'}
            </h3>
            <p className="text-gray-500 text-sm">
              {scenarioType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} in {region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</div>
          <div className="text-xs text-gray-500">
            {isComplete ? 'Completed' : 'Processing...'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`absolute inset-y-0 left-0 rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
          }`}
        />
        {/* Animated shine effect */}
        {!isComplete && (
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        )}
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isActive = index === currentStage && !isComplete;
          const isDone = index < currentStage || isComplete;

          return (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0.5 }}
              animate={{
                opacity: isDone || isActive ? 1 : 0.5,
                scale: isActive ? 1.02 : 1,
              }}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-emerald-50 border border-emerald-200'
                  : isDone
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-transparent'
              }`}
            >
              {/* Stage Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDone
                  ? 'bg-green-100'
                  : isActive
                  ? 'bg-emerald-100'
                  : 'bg-gray-200'
              }`}>
                {isDone ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={isActive ? 'animate-pulse' : ''}>{stage.icon}</span>
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1">
                <div className={`font-medium ${
                  isDone ? 'text-green-600' : isActive ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {stage.name}
                </div>
                <div className={`text-xs ${
                  isDone ? 'text-green-500' : isActive ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {stage.description}
                </div>
              </div>

              {/* Stage Status */}
              {isActive && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* AI Processing Indicator */}
      {!isComplete && currentStage >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-25" />
              <div className="absolute inset-0 bg-cyan-500 rounded-full" />
            </div>
            <div>
              <span className="text-sm text-cyan-600 font-medium">Gemini 2.5 Flash Processing</span>
              <p className="text-xs text-gray-500">Analyzing supply chain data with AI...</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
