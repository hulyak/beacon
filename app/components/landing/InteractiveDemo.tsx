'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, Loader2, Search, GitBranch, Lightbulb, Bell } from 'lucide-react';

type StepStatus = 'pending' | 'active' | 'complete';

interface Step {
  id: string;
  agent: string;
  action: string;
  color: string;
  icon: React.ReactNode;
  status: StepStatus;
  result?: string;
}

const initialSteps: Step[] = [
  {
    id: 'risk',
    agent: 'Risk Analysis',
    action: 'Detecting supply chain anomaly...',
    color: '#0891b2',
    icon: <Search className="w-5 h-5" />,
    status: 'pending',
    result: 'Port congestion detected in Shanghai',
  },
  {
    id: 'scenario',
    agent: 'Scenario Simulation',
    action: 'Running 1000 impact simulations...',
    color: '#059669',
    icon: <GitBranch className="w-5 h-5" />,
    status: 'pending',
    result: 'Expected delay: 2-3 weeks',
  },
  {
    id: 'strategy',
    agent: 'Strategy Planning',
    action: 'Generating mitigation strategies...',
    color: '#ea580c',
    icon: <Lightbulb className="w-5 h-5" />,
    status: 'pending',
    result: 'Reroute via Singapore recommended',
  },
  {
    id: 'alert',
    agent: 'Alert Monitoring',
    action: 'Notifying stakeholders...',
    color: '#16a34a',
    icon: <Bell className="w-5 h-5" />,
    status: 'pending',
    result: 'All teams notified',
  },
];

export function InteractiveDemo() {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const runDemo = () => {
    if (isRunning) return;

    setIsRunning(true);
    setShowResults(false);
    setSteps(initialSteps);

    // Animate through steps
    steps.forEach((_, index) => {
      // Set step to active
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) => ({
            ...step,
            status: i === index ? 'active' : i < index ? 'complete' : 'pending',
          }))
        );
      }, index * 1500);

      // Set step to complete
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) => ({
            ...step,
            status: i <= index ? 'complete' : 'pending',
          }))
        );

        // Show results after last step
        if (index === steps.length - 1) {
          setTimeout(() => {
            setShowResults(true);
            setIsRunning(false);
          }, 500);
        }
      }, (index + 1) * 1500);
    });
  };

  // Reset after showing results
  useEffect(() => {
    if (showResults) {
      const timeout = setTimeout(() => {
        setSteps(initialSteps);
        setShowResults(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [showResults]);

  const getStepIcon = (step: Step) => {
    if (step.status === 'active') {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    if (step.status === 'complete') {
      return <Check className="w-5 h-5" />;
    }
    return step.icon;
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            See Agents{' '}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              in Action
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Watch how our AI agents collaborate to detect and resolve supply chain disruptions in real-time
          </p>
        </motion.div>

        {/* Demo Container */}
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Play Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={runDemo}
              disabled={isRunning}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                isRunning
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Running Simulation...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run Demo</span>
                </>
              )}
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                  step.status === 'active'
                    ? 'border-gray-300 bg-gray-50'
                    : step.status === 'complete'
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-100 bg-gray-50/50'
                }`}
                style={{
                  boxShadow:
                    step.status === 'active'
                      ? `0 0 20px ${step.color}20`
                      : 'none',
                }}
              >
                {/* Step Number & Icon */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step.status === 'complete'
                      ? 'bg-green-100 text-green-600'
                      : step.status === 'active'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={{
                    backgroundColor:
                      step.status === 'active' ? `${step.color}20` : undefined,
                    color: step.status === 'active' ? step.color : undefined,
                  }}
                >
                  {getStepIcon(step)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-semibold"
                      style={{ color: step.status !== 'pending' ? step.color : '#9ca3af' }}
                    >
                      {step.agent}
                    </span>
                    {step.status === 'complete' && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                        Complete
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      step.status === 'complete'
                        ? 'text-gray-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.status === 'complete' ? step.result : step.action}
                  </p>
                </div>

                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-10 w-0.5 h-4 -bottom-4 transition-colors duration-300 ${
                      step.status === 'complete' ? 'bg-cyan-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Results Summary */}
          {showResults && (
            <motion.div
              className="mt-8 p-6 bg-gradient-to-r from-cyan-50 to-green-50 border border-cyan-200 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Resolution Complete
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">Singapore</div>
                  <div className="text-sm text-gray-500">Alt. Route</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">+8%</div>
                  <div className="text-sm text-gray-500">Cost Impact</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">-72%</div>
                  <div className="text-sm text-gray-500">Risk Reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">3 days</div>
                  <div className="text-sm text-gray-500">Time Saved</div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default InteractiveDemo;
