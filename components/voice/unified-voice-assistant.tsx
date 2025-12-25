'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Loader2,
  MessageCircle,
  X,
  Minimize2,
  Volume2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ModernButton } from '../ui/modern-button';
import { BeaconLogo, BeaconLogoCompact } from '../ui/beacon-logo';
import { useVoiceAgent } from '@/app/hooks/useVoiceAgent';

interface UnifiedVoiceAssistantProps {
  currentPage?: string;
  className?: string;
}

// Page-specific voice commands
const PAGE_COMMANDS: Record<string, string[]> = {
  '/dashboard': [
    'Analyze risks in Asia',
    'Run port closure scenario',
    'Show critical alerts',
    'Generate mitigation strategy'
  ],
  '/digital-twin': [
    'Scan for anomalies',
    'Run port closure scenario',
    'Show network status',
    'Add new supplier'
  ],
  '/analytics': [
    'Show trend analysis',
    'Compare last quarter',
    'Generate report',
    'Highlight anomalies'
  ],
  '/scenarios': [
    'Run disruption scenario',
    'Test supplier failure',
    'Simulate demand surge',
    'Check resilience score'
  ],
  '/sustainability': [
    'Show carbon footprint',
    'Find green alternatives',
    'Check sustainability alerts',
    'Calculate emissions'
  ],
  '/impact': [
    'Analyze financial impact',
    'Show cascade effects',
    'Calculate delay costs',
    'Generate impact report'
  ],
  '/features': [
    'Show AI insights',
    'Analyze supply chain',
    'Run scenario simulation',
    'Check alerts'
  ]
};

export function UnifiedVoiceAssistant({
  currentPage = '/dashboard',
  className = ''
}: UnifiedVoiceAssistantProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-show welcome on dashboard first visit
  useEffect(() => {
    if (currentPage === '/dashboard' && !hasShownWelcome) {
      const welcomed = typeof window !== 'undefined' && localStorage.getItem('beacon_voice_welcomed');
      if (!welcomed) {
        // Open panel after short delay to let page render
        const timer = setTimeout(() => {
          setIsPanelOpen(true);
          setHasShownWelcome(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('beacon_voice_welcomed', 'true');
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPage, hasShownWelcome]);

  // Use the ElevenLabs voice agent
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const {
    messages,
    status,
    error,
    startConversation,
    endConversation,
    clearError,
    isConnected,
    isActive
  } = useVoiceAgent(agentId);

  const currentCommands = PAGE_COMMANDS[currentPage] || PAGE_COMMANDS['/dashboard'];

  // Listen for voice command events from DemoCommandsPanel
  useEffect(() => {
    const handleVoiceCommand = async (event: CustomEvent<{ command: string; action: string }>) => {
      const { command } = event.detail;
      setPendingCommand(command);
      setIsPanelOpen(true);
      setIsMinimized(false);

      // Start the conversation if not already connected
      if (!isConnected) {
        await startConversation();
      }
    };

    window.addEventListener('beacon-voice-command', handleVoiceCommand as EventListener);
    return () => {
      window.removeEventListener('beacon-voice-command', handleVoiceCommand as EventListener);
    };
  }, [isConnected, startConversation]);

  // Clear pending command when user starts speaking
  useEffect(() => {
    if (messages.length > 0) {
      setPendingCommand(null);
    }
  }, [messages.length]);

  // Rotate through example commands
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCommandIndex((prev) => (prev + 1) % currentCommands.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentCommands.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceToggle = async () => {
    if (isConnected) {
      await endConversation();
    } else {
      await startConversation();
    }
  };

  const openPanel = () => {
    setIsPanelOpen(true);
    setIsMinimized(false);
  };

  const closePanel = () => {
    if (isConnected) {
      endConversation();
    }
    setIsPanelOpen(false);
  };

  const minimizeToButton = () => {
    setIsPanelOpen(false);
    setIsMinimized(true);
  };

  // Minimized state - just a floating button
  if (isMinimized && !isPanelOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <motion.button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 flex items-center justify-center transition-all duration-300 hover:shadow-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BeaconLogoCompact size="sm" variant="white" showText={false} />
        </motion.button>
      </div>
    );
  }

  return (
    <>
      {/* Floating trigger button */}
      {!isPanelOpen && (
        <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
          <div className="flex flex-col items-end gap-3">
            {/* Status indicator when active */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {status === 'speaking' ? (
                    <Volume2 className="w-4 h-4 text-green-600 animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <span className="text-sm text-gray-700">
                    {status === 'speaking' ? 'Speaking...' : 'Listening...'}
                  </span>
                  <div className="flex items-center gap-0.5 h-4">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-cyan-500 rounded-full"
                        animate={{ height: ['4px', '16px', '4px'] }}
                        transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">{error.message}</span>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Main floating button */}
            <motion.div
              className={`rounded-2xl shadow-lg border p-4 cursor-pointer transition-all duration-300 ${
                isConnected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400'
                  : 'bg-white border-gray-200 hover:border-cyan-300 hover:shadow-xl'
              }`}
              whileHover={{ scale: 1.02 }}
              onClick={openPanel}
            >
              <div className="flex items-center gap-3">
                <BeaconLogo size="sm" variant={isConnected ? 'white' : 'default'} />

                {!isConnected && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Try:</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentCommandIndex}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-xs text-cyan-600 font-medium truncate"
                        >
                          &quot;{currentCommands[currentCommandIndex]}&quot;
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {isConnected && (
                  <span className="text-xs text-white/80">Voice Active</span>
                )}

                <div className="flex items-center gap-1">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoiceToggle();
                    }}
                    disabled={status === 'connecting'}
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isConnected
                        ? 'bg-white shadow-md'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30 hover:shadow-lg'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {status === 'connecting' ? (
                      <Loader2 className={`w-5 h-5 animate-spin ${isConnected ? 'text-cyan-600' : 'text-white'}`} />
                    ) : status === 'speaking' ? (
                      <Volume2 className={`w-5 h-5 ${isConnected ? 'text-cyan-600' : 'text-white'}`} />
                    ) : isConnected ? (
                      <MicOff className="w-5 h-5 text-cyan-600" />
                    ) : (
                      <Mic className="w-5 h-5 text-white" />
                    )}

                    {!isConnected && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.button>

                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      minimizeToButton();
                    }}
                    icon={<Minimize2 className="w-4 h-4" />}
                    className={isConnected ? 'text-white hover:bg-white/10' : ''}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Side Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-[9998]"
              onClick={closePanel}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col"
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors ${
                isConnected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <BeaconLogo size="md" variant={isConnected ? 'white' : 'default'} />
                </div>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs text-white font-medium">
                        {status === 'speaking' ? 'Speaking' : 'Listening'}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={closePanel}
                    aria-label="Close panel"
                    className={`p-2 rounded-lg transition-colors ${
                      isConnected
                        ? 'text-white/80 hover:bg-white/10'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Conversation Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {/* Pending command indicator */}
                {pendingCommand && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-cyan-600 font-medium mb-1">Voice Tour Started</p>
                        <p className="text-sm text-gray-700">
                          &quot;{pendingCommand}&quot;
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Click the microphone to speak with Beacon about this topic
                    </p>
                  </motion.div>
                )}

                {/* Welcome message when no conversation */}
                {messages.length === 0 && !pendingCommand && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Beacon Voice Assistant
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Start a conversation to analyze your supply chain, run scenarios, and get AI-powered insights.
                    </p>

                    {/* Suggested commands */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Try saying
                      </p>
                      {currentCommands.map((command, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-cyan-300 transition-colors"
                        >
                          &quot;{command}&quot;
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {message.role === 'agent' && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-gray-500">Beacon</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-white/60' : 'text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Error display */}
              {error && (
                <div className="px-6 py-3 bg-red-50 border-t border-red-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600">{error.message}</span>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-red-400 hover:text-red-600"
                      aria-label="Dismiss error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Voice Controls Footer */}
              <div className="p-6 bg-white border-t border-gray-200">
                {/* Sound wave visualization when active */}
                {isActive && (
                  <div className="flex items-center justify-center gap-1 h-8 mb-4">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-1 rounded-full ${
                          status === 'speaking' ? 'bg-green-500' : 'bg-cyan-500'
                        }`}
                        animate={{ height: ['8px', '32px', '8px'] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                )}

                <motion.button
                  onClick={handleVoiceToggle}
                  disabled={status === 'connecting'}
                  className={`w-full py-4 px-6 rounded-2xl font-medium flex items-center justify-center gap-3 transition-all duration-300 ${
                    isConnected
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {status === 'connecting' ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : isConnected ? (
                    <>
                      <MicOff className="w-6 h-6" />
                      <span>End Conversation</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6" />
                      <span>Start Voice Conversation</span>
                    </>
                  )}
                </motion.button>

                {!isConnected && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    Click or tap to start talking to Beacon
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
