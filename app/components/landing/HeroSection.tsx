'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowDown, Zap } from 'lucide-react';
import Link from 'next/link';

interface AgentNode {
  id: number;
  x: number;
  y: number;
  type: 'risk' | 'scenario' | 'strategy' | 'alert';
  color: string;
  active: boolean;
}

interface HeroSectionProps {
  onTryDemo?: () => void;
}

export function HeroSection({ onTryDemo }: HeroSectionProps) {
  const [nodes, setNodes] = useState<AgentNode[]>([
    { id: 1, x: 20, y: 30, type: 'risk', color: '#0891b2', active: false },
    { id: 2, x: 40, y: 60, type: 'scenario', color: '#059669', active: false },
    { id: 3, x: 60, y: 40, type: 'strategy', color: '#2563eb', active: false },
    { id: 4, x: 80, y: 70, type: 'alert', color: '#16a34a', active: false },
  ]);

  // Animate agent connections pulsing
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          active: Math.random() > 0.5,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-cyan-50">
      {/* Animated Neural Network Background */}
      <div className="absolute inset-0 opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Agent Connection Lines */}
          {nodes.map((node, i) => {
            const nextNode = nodes[(i + 1) % nodes.length];
            return (
              <line
                key={`line-${i}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${nextNode.x}%`}
                y2={`${nextNode.y}%`}
                stroke={node.active ? node.color : '#d1d5db'}
                strokeWidth="2"
                className="transition-all duration-1000"
                style={{
                  filter: node.active ? `drop-shadow(0 0 8px ${node.color})` : 'none',
                }}
              />
            );
          })}
          {/* Cross connections */}
          <line
            x1={`${nodes[0].x}%`}
            y1={`${nodes[0].y}%`}
            x2={`${nodes[2].x}%`}
            y2={`${nodes[2].y}%`}
            stroke={nodes[0].active ? '#0891b2' : '#d1d5db'}
            strokeWidth="1"
            className="transition-all duration-1000"
            style={{
              filter: nodes[0].active ? 'drop-shadow(0 0 4px #0891b2)' : 'none',
            }}
          />
          <line
            x1={`${nodes[1].x}%`}
            y1={`${nodes[1].y}%`}
            x2={`${nodes[3].x}%`}
            y2={`${nodes[3].y}%`}
            stroke={nodes[1].active ? '#059669' : '#d1d5db'}
            strokeWidth="1"
            className="transition-all duration-1000"
            style={{
              filter: nodes[1].active ? 'drop-shadow(0 0 4px #059669)' : 'none',
            }}
          />
          {/* Agent Nodes */}
          {nodes.map((node) => (
            <circle
              key={`node-${node.id}`}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r="10"
              fill={node.active ? node.color : '#9ca3af'}
              className="transition-all duration-1000"
              style={{
                filter: node.active ? `drop-shadow(0 0 12px ${node.color})` : 'none',
              }}
            />
          ))}
        </svg>
      </div>

      {/* Floating Voice Indicator */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Mic className="w-8 h-8 text-cyan-600" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Logo / Brand */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-bold text-gray-900">Beacon</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full text-cyan-700 text-sm">
            <Zap className="w-4 h-4" />
            <span>Powered by ElevenLabs + Google Cloud AI</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Talk to Your
          </span>
          <br />
          <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Supply Chain
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Voice-powered intelligence. Real-time risk analysis. Hands-free operations.
        </motion.p>

        {/* Voice Command Demo */}
        <motion.div
          className="mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-white/80 backdrop-blur-sm border border-cyan-200 rounded-2xl p-4 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Try saying:</p>
                <p className="text-lg font-medium text-gray-900">&quot;Analyze risks in my supply chain&quot;</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Run scenario simulation', 'Show carbon footprint', 'Check critical alerts'].map((cmd) => (
                <span key={cmd} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {cmd}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link
            href="/dashboard"
            className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-cyan-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Mic className="w-5 h-5" />
              Start Voice Dashboard
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <button
            onClick={onTryDemo}
            className="px-8 py-4 bg-white text-cyan-600 text-lg font-bold rounded-xl border-2 border-cyan-300 hover:bg-cyan-50 hover:border-cyan-400 transition-all duration-300 flex items-center gap-2 shadow-md"
          >
            <span>Watch Demo</span>
            <ArrowDown className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Tech Badges */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {['ElevenLabs', 'Gemini 2.5', 'Google Cloud', 'Next.js 15'].map((tech) => (
            <span
              key={tech}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 text-sm shadow-sm"
            >
              {tech}
            </span>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="mt-16"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="w-6 h-6 mx-auto text-cyan-500" />
        </motion.div>
      </div>
    </div>
  );
}

export default HeroSection;
