'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, MessageSquare, X, Minus, Send, Volume2, Loader2 } from 'lucide-react';
import { useVoiceAgent, Message as VoiceMessage, ConnectionStatus } from './VoiceAgent';
import { useVoiceDashboard } from '@/lib/voice-dashboard-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'voice' | 'text';
}

const suggestedPrompts = [
  'Analyze risks in Asia',
  'Show critical alerts',
  'Run port closure scenario',
];

export function BeaconAssistant() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';
  const {
    messages: voiceMessages,
    status,
    error,
    startConversation,
    endConversation,
    clearError,
    isConnected,
  } = useVoiceAgent(agentId);

  const { processVoiceMessage } = useVoiceDashboard();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('voice');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Beacon, your supply chain assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync voice messages to unified messages
  useEffect(() => {
    if (voiceMessages.length > 0) {
      const lastVoiceMsg = voiceMessages[voiceMessages.length - 1];

      // Check if this message is already in our list
      const exists = messages.some(m =>
        m.content === lastVoiceMsg.content &&
        m.source === 'voice' &&
        Math.abs(m.timestamp.getTime() - lastVoiceMsg.timestamp.getTime()) < 1000
      );

      if (!exists) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: lastVoiceMsg.role === 'agent' ? 'assistant' : 'user',
          content: lastVoiceMsg.content,
          timestamp: lastVoiceMsg.timestamp,
          source: 'voice',
        }]);

        // Process through dashboard context
        processVoiceMessage(lastVoiceMsg.content, lastVoiceMsg.role);
      }
    }
  }, [voiceMessages, messages, processVoiceMessage]);

  const handleVoiceToggle = useCallback(async () => {
    if (isConnected) {
      await endConversation();
    } else {
      await startConversation();
    }
  }, [isConnected, startConversation, endConversation]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      source: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    processVoiceMessage(input, 'user');
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL;

      if (!chatUrl) {
        throw new Error('Chat API not configured');
      }

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(),
          source: 'text',
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error?.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        source: 'text',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Ready';
      case 'listening': return 'Listening...';
      case 'speaking': return 'Speaking...';
      default: return 'Voice ready';
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center group"
      >
        <Mic className="w-6 h-6 text-white" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Voice Assistant
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.8 }}
      className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-500 to-blue-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm">🚀</span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Beacon Assistant</h3>
            {mode === 'voice' && isConnected && (
              <p className="text-white/70 text-xs">{getStatusLabel()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
          >
            <Minus className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
          >
            {/* Mode Toggle */}
            <div className="flex p-2 gap-1 bg-gray-50 border-b border-gray-200">
              <button
                onClick={() => setMode('text')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'text'
                    ? 'bg-white text-cyan-600 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Text
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'voice'
                    ? 'bg-white text-cyan-600 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Voice
              </button>
            </div>

            {/* Voice Mode UI */}
            {mode === 'voice' && (
              <div className="p-4 flex flex-col items-center bg-gray-50">
                <motion.button
                  onClick={handleVoiceToggle}
                  disabled={status === 'connecting'}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isConnected
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {status === 'connecting' ? (
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  ) : isConnected ? (
                    status === 'speaking' ? (
                      <Volume2 className="w-7 h-7 text-white" />
                    ) : (
                      <MicOff className="w-7 h-7 text-white" />
                    )
                  ) : (
                    <Mic className="w-7 h-7 text-gray-600" />
                  )}
                </motion.button>

                {/* Voice waveform */}
                {(status === 'listening' || status === 'speaking') && (
                  <div className="flex items-center justify-center gap-1 h-6 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-cyan-400 rounded-full"
                        animate={{ height: ['6px', '18px', '6px'] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2 text-center">
                  {!isConnected && 'Tap to start voice session'}
                  {status === 'connecting' && 'Connecting...'}
                  {status === 'connected' && 'Tap to end session'}
                  {status === 'listening' && 'Listening...'}
                  {status === 'speaking' && 'Speaking...'}
                </p>

                {error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg w-full">
                    <p className="text-red-600 text-xs">{error.message}</p>
                    <button onClick={clearError} className="text-red-400 text-xs underline">
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-3 space-y-3 bg-white">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${
                      message.role === 'user' ? 'text-white/60' : 'text-gray-400'
                    }`}>
                      {message.source === 'voice' && <Mic className="w-2.5 h-2.5" />}
                      <span className="text-[10px]">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            <div className="px-3 pb-2 bg-white">
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your supply chain..."
                  className="flex-1 bg-gray-100 border-0 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BeaconAssistant;
