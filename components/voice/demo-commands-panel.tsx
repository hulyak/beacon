'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Play,
  HelpCircle
} from 'lucide-react';
import { DEMO_COMMANDS } from '@/lib/hooks/use-proactive-voice';

interface DemoCommandsPanelProps {
  onCommandClick?: (command: string) => void;
  className?: string;
}

export function DemoCommandsPanel({ onCommandClick, className = '' }: DemoCommandsPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Risk Analysis');
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded by default

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Risk Analysis':
        return '⚠️';
      case 'Scenario Planning':
        return '🎯';
      case 'Sustainability':
        return '🌱';
      case 'Financial Impact':
        return '💰';
      case 'Navigation':
        return '🧭';
      default:
        return '📊';
    }
  };

  const handleCommandClick = (command: string) => {
    // Dispatch custom event to trigger voice assistant
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beacon-voice-command', {
        detail: { command, action: 'speak' }
      }));
    }
    onCommandClick?.(command);
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-100 hover:from-cyan-100 hover:to-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 text-sm">Voice Commands</h3>
            <p className="text-xs text-gray-500">Try these with Beacon</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
              {/* Quick tip */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <strong>Tip:</strong> Click the mic button and speak naturally.
                  Beacon understands context and follow-up questions!
                </p>
              </div>

              {/* Command categories */}
              {DEMO_COMMANDS.map((category) => (
                <div key={category.category} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.category ? null : category.category
                    )}
                    className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{getCategoryIcon(category.category)}</span>
                      <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedCategory === category.category ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedCategory === category.category && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 py-2 space-y-1.5 bg-white">
                          {category.commands.map((cmd, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCommandClick(cmd.voice)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-50 border border-transparent hover:border-cyan-200 transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <Mic className="w-3.5 h-3.5 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-sm text-gray-800 font-medium">
                                  &ldquo;{cmd.voice}&rdquo;
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 ml-5">
                                {cmd.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Demo mode button */}
              <div className="pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleCommandClick('Give me a tour of the dashboard and show me key features')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  Start Voice Tour
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Opens voice assistant and starts the tour
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview */}
      {!isExpanded && (
        <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
          {['Analyze risks in Asia', 'Run scenario', 'Show carbon footprint'].map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleCommandClick(cmd)}
              className="flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-cyan-100 text-gray-700 hover:text-cyan-700 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Mic className="w-3 h-3" />
              {cmd}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Floating Demo Badge for hackathon video
export function DemoBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Voice-First AI Demo</span>
        <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
      </div>
    </motion.div>
  );
}
