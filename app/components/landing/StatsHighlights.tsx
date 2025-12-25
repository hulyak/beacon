'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Activity, Brain, TrendingUp } from 'lucide-react';

interface StatItem {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
}

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  stats: StatItem[];
  gradient: string;
  delay: number;
}

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  isVisible
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  isVisible: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;

      setDisplayValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, decimals, isVisible]);

  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

function StatCard({ title, icon, stats, gradient, delay }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative group"
    >
      {/* Glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`} />

      <div className="relative bg-white border border-gray-200 rounded-2xl p-6 h-full hover:border-gray-300 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient}`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Stats Grid */}
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-gray-900">
                <AnimatedNumber
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  isVisible={isVisible}
                />
              </span>
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function StatsHighlights() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full text-cyan-700 text-sm font-medium mb-4">
            <Activity className="w-4 h-4" />
            See It In Action
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Advanced Analytics
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Powerful analytics and visualization tools to help you make data-driven decisions.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            title="Real-Time Data Collection"
            icon={<Activity className="w-6 h-6 text-white" />}
            gradient="from-cyan-500 to-blue-500"
            delay={0}
            stats={[
              { value: 500, suffix: '+', label: 'Sensors' },
              { value: 24, suffix: '/7', label: 'Monitoring' },
              { value: 1, prefix: '<', suffix: 'ms', label: 'Latency' },
            ]}
          />

          <StatCard
            title="Intelligent Analysis"
            icon={<Brain className="w-6 h-6 text-white" />}
            gradient="from-emerald-500 to-teal-500"
            delay={0.1}
            stats={[
              { value: 98.5, suffix: '%', label: 'Prediction Accuracy', decimals: 1 },
              { value: 94.2, suffix: '%', label: 'Continuous Optimization', decimals: 1 },
            ]}
          />

          <StatCard
            title="Proven Results"
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            gradient="from-orange-500 to-red-500"
            delay={0.2}
            stats={[
              { value: 32, suffix: '%', label: 'Cost Reduction' },
              { value: 45, suffix: '%', label: 'Faster Delivery' },
            ]}
          />
        </div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Ready to Transform Your Supply Chain?</h3>
              <p className="text-cyan-100">
                Experience the power of AI-driven supply chain resilience.
              </p>
            </div>

            <div className="flex items-center gap-8">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-8 pr-8 border-r border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-xs text-cyan-100">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-xs text-cyan-100">Support</div>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-3 bg-white text-cyan-600 font-semibold rounded-xl hover:bg-cyan-50 transition-colors"
              >
                Explore Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default StatsHighlights;
