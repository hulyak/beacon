'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Map, Target, BarChart3, Lightbulb, ChevronRight } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  icon: React.ReactNode;
  color: string;
  gradient: string;
  link: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Digital Twin Mapping',
    subtitle: 'Build interactive supply chain networks',
    description: 'Create comprehensive digital representations of your supply chain network with real-time visibility and risk monitoring capabilities.',
    tags: ['Real-time Monitoring', 'Network Visualization', 'Risk Detection', 'Interactive Dashboard'],
    icon: <Map className="w-6 h-6" />,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    link: '/dashboard',
  },
  {
    id: 2,
    title: 'Disruption Simulation',
    subtitle: 'AI-powered scenario modeling',
    description: 'Run advanced Monte Carlo simulations for natural disasters, supplier failures, and market disruptions with predictive analytics and risk assessment.',
    tags: ['Monte Carlo Analysis', 'Risk Scenarios', 'Impact Prediction', 'Failure Modeling'],
    icon: <Target className="w-6 h-6" />,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    link: '/scenarios',
  },
  {
    id: 3,
    title: 'Impact Assessment',
    subtitle: 'Real-time analytics and insights',
    description: 'Visualize cost implications, delivery delays, and cascading effects across your entire network with dynamic analytics and performance tracking.',
    tags: ['Cost Analysis', 'Delay Tracking', 'Performance KPIs', 'Cascading Effects'],
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-500',
    link: '/scenarios',
  },
  {
    id: 4,
    title: 'Smart Strategies',
    subtitle: 'AI-generated recommendations',
    description: 'Receive AI-generated recommendations for cost-effective mitigation strategies, alternative routing, and ROI-optimized planning solutions.',
    tags: ['AI Recommendations', 'ROI Optimization', 'Alternative Routes', 'Risk Mitigation'],
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    link: '/dashboard',
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; tagBg: string; tagText: string }> = {
  cyan: {
    bg: 'bg-cyan-500',
    text: 'text-cyan-600',
    border: 'border-cyan-500',
    tagBg: 'bg-cyan-50',
    tagText: 'text-cyan-700',
  },
  emerald: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-500',
    tagBg: 'bg-emerald-50',
    tagText: 'text-emerald-700',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-500',
    tagBg: 'bg-blue-50',
    tagText: 'text-blue-700',
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-500',
    tagBg: 'bg-orange-50',
    tagText: 'text-orange-700',
  },
};

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(1);

  const currentStep = steps.find((s) => s.id === activeStep) || steps[0];
  const colors = colorClasses[currentStep.color];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-gray-600 text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered
            </span>{' '}
            Supply Chain Intelligence
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform disruptions into opportunities with our comprehensive four-step process that combines AI intelligence with real-world supply chain expertise.
          </p>
        </motion.div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    activeStep === step.id
                      ? `bg-gradient-to-r ${step.gradient} text-white shadow-lg`
                      : activeStep > step.id
                      ? `${colorClasses[step.color].bg} text-white`
                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }`}
                >
                  {step.id}
                  {activeStep === step.id && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -inset-1 rounded-full border-2 border-current opacity-30"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="w-16 md:w-24 h-1 mx-2">
                    <div
                      className={`h-full rounded transition-colors duration-300 ${
                        activeStep > step.id ? colorClasses[step.color].bg : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Card */}
              <div className={`bg-white border-2 ${colors.border} rounded-2xl p-8 shadow-xl`}>
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${currentStep.gradient}`}>
                    <span className="text-white">{currentStep.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-sm font-medium ${colors.text}`}>Step {currentStep.id}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{currentStep.title}</h3>
                    <p className={`${colors.text} font-medium`}>{currentStep.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentStep.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1.5 ${colors.tagBg} ${colors.tagText} rounded-full text-sm font-medium border border-current/20`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action */}
                <Link
                  href={currentStep.link}
                  className={`inline-flex items-center gap-2 ${colors.text} font-semibold hover:gap-3 transition-all duration-300`}
                >
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                  disabled={activeStep === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeStep === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {steps.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeStep === step.id
                          ? `w-8 ${colorClasses[step.color].bg}`
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setActiveStep(Math.min(4, activeStep + 1))}
                  disabled={activeStep === 4}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeStep === 4
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
