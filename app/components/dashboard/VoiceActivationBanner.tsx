'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2, X } from 'lucide-react';
import { useVoiceAgent } from '../VoiceAgent';

const exampleCommands = [
  'Analyze risks in Asia',
  'Run port closure scenario',
  'Show critical alerts',
  'Generate mitigation strategy',
];

export function VoiceActivationBanner() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';
  const {
    status,
    error,
    startConversation,
    endConversation,
    clearError,
    isConnected,
  } = useVoiceAgent(agentId);

  const [isDismissed, setIsDismissed] = useState(false);
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);

  // Rotate through example commands
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCommandIndex((prev) => (prev + 1) % exampleCommands.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVoiceToggle = async () => {
    if (isConnected) {
      await endConversation();
    } else {
      await startConversation();
    }
  };

  if (isDismissed && !isConnected) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border transition-all duration-300 ${
        isConnected
          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 shadow-lg shadow-cyan-500/20'
          : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Voice Button */}
          <motion.button
            onClick={handleVoiceToggle}
            disabled={status === 'connecting'}
            className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
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

            {/* Pulse animation when not connected */}
            {!isConnected && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isConnected ? 'text-white' : 'text-gray-900'}`}>
                {isConnected
                  ? status === 'listening'
                    ? 'Listening...'
                    : status === 'speaking'
                    ? 'Speaking...'
                    : 'Voice Active'
                  : 'Voice Control'}
              </span>

              {/* Sound wave when active */}
              {(status === 'listening' || status === 'speaking') && (
                <div className="flex items-center gap-0.5 h-4">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-white rounded-full"
                      animate={{ height: ['4px', '16px', '4px'] }}
                      transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Example command or status */}
            {!isConnected && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">Try:</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentCommandIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-xs text-cyan-600 font-medium truncate"
                  >
                    &quot;{exampleCommands[currentCommandIndex]}&quot;
                  </motion.span>
                </AnimatePresence>
              </div>
            )}

            {isConnected && (
              <p className="text-xs text-white/70 mt-0.5">
                Tap mic to end session
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 px-2 py-1 bg-red-100 rounded-lg">
              <span className="text-red-600 text-xs">{error.message}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Dismiss button */}
          {!isConnected && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default VoiceActivationBanner;
