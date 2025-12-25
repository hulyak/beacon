'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Mic,
  MicOff,
  BarChart3,
  TrendingUp,
  Leaf,
  Brain,
  Target,
  Home,
  Cpu,
  PlayCircle,
  Sparkles,
  FileText,
  AlertTriangle,
  Globe,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: 'page' | 'feature' | 'action' | 'report';
}

const searchableItems: SearchResult[] = [
  // Pages
  { id: 'dashboard', title: 'Dashboard', description: 'View supply chain overview and KPIs', icon: <Home size={16} />, href: '/dashboard', category: 'page' },
  { id: 'digital-twin', title: 'Digital Twin', description: 'Interactive supply chain simulation', icon: <Cpu size={16} />, href: '/digital-twin', category: 'page' },
  { id: 'scenarios', title: 'Scenarios', description: 'Run what-if scenario simulations', icon: <PlayCircle size={16} />, href: '/scenarios', category: 'page' },
  { id: 'analytics', title: 'Analytics', description: 'Deep dive into supply chain data', icon: <BarChart3 size={16} />, href: '/analytics', category: 'page' },
  { id: 'impact', title: 'Impact Assessment', description: 'Analyze disruption impacts', icon: <TrendingUp size={16} />, href: '/impact', category: 'page' },
  { id: 'sustainability', title: 'Sustainability', description: 'Environmental metrics and goals', icon: <Leaf size={16} />, href: '/sustainability', category: 'page' },
  { id: 'explainability', title: 'AI Explainability', description: 'Understand AI decisions', icon: <Brain size={16} />, href: '/explainability', category: 'page' },
  { id: 'optimization', title: 'ROI Optimization', description: 'Maximize return on investment', icon: <Target size={16} />, href: '/optimization', category: 'page' },
  { id: 'features', title: 'Advanced Features', description: 'Explore all platform capabilities', icon: <Sparkles size={16} />, href: '/features', category: 'page' },

  // Features
  { id: 'risk-analysis', title: 'Risk Analysis', description: 'Analyze supply chain risks by region', icon: <AlertTriangle size={16} />, href: '/dashboard', category: 'feature' },
  { id: 'global-view', title: 'Global Supply Chain Map', description: '3D visualization of global operations', icon: <Globe size={16} />, href: '/dashboard', category: 'feature' },
  { id: 'monte-carlo', title: 'Monte Carlo Simulation', description: 'Run probabilistic simulations', icon: <Zap size={16} />, href: '/digital-twin', category: 'feature' },

  // Actions
  { id: 'analyze-risks', title: 'Analyze Risks in Asia', description: 'Run AI risk analysis for Asia region', icon: <AlertTriangle size={16} />, href: '/dashboard', category: 'action' },
  { id: 'run-scenario', title: 'Run Port Closure Scenario', description: 'Simulate port closure impact', icon: <PlayCircle size={16} />, href: '/scenarios', category: 'action' },
  { id: 'generate-report', title: 'Generate Report', description: 'Create supply chain report', icon: <FileText size={16} />, href: '/analytics', category: 'action' },
];

interface SearchCommandProps {
  className?: string;
}

export function SearchCommand({ className }: SearchCommandProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Filter results based on query - using useMemo to avoid effect
  const results = React.useMemo(() => {
    if (!query.trim()) {
      return searchableItems.slice(0, 6); // Show top 6 items when empty
    }

    const lowerQuery = query.toLowerCase();
    const filtered = searchableItems.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
    return filtered.slice(0, 8);
  }, [query]);

  // Handle query change with selection reset
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  }, []);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setQuery(transcript);
          setSelectedIndex(0);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsOpen(true);
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setIsOpen(false);
    handleQueryChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'page': return 'Page';
      case 'feature': return 'Feature';
      case 'action': return 'Quick Action';
      case 'report': return 'Report';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'page': return 'bg-blue-100 text-blue-700';
      case 'feature': return 'bg-purple-100 text-purple-700';
      case 'action': return 'bg-green-100 text-green-700';
      case 'report': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            handleQueryChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search or ask a question..."
          className="w-full pl-10 pr-24 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
          ref={inputRef}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Voice button */}
          <button
            onClick={toggleVoice}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              isListening
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
            )}
            title={isListening ? 'Stop listening' : 'Voice search'}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          {/* Keyboard shortcut hint */}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Results panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
            >
              {isListening && (
                <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-red-700">Listening... speak now</span>
                </div>
              )}

              {results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full px-4 py-3 flex items-start gap-3 transition-colors text-left',
                        index === selectedIndex ? 'bg-cyan-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg',
                        index === selectedIndex ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500'
                      )}>
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">{result.title}</span>
                          <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded', getCategoryColor(result.category))}>
                            {getCategoryLabel(result.category)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{result.description}</p>
                      </div>
                      {index === selectedIndex && (
                        <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded self-center">
                          Enter
                        </kbd>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No results found for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-gray-400 mt-1">Try searching for pages, features, or actions</p>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white rounded border">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white rounded border">Enter</kbd> Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white rounded border">Esc</kbd> Close
                  </span>
                </div>
                <button
                  onClick={toggleVoice}
                  className="flex items-center gap-1 hover:text-cyan-600 transition-colors"
                >
                  <Mic size={12} /> Voice search
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
