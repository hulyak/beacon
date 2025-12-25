'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message } from './VoiceAgent';

export interface TextFallbackProps {
  isActive: boolean;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  className?: string;
}

export default function TextFallback({
  isActive,
  messages,
  onSendMessage,
  onClose,
  className = '',
}: TextFallbackProps): React.JSX.Element | null {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when component becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isActive) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      await onSendMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const suggestedQueries = [
    "What are the current risks in Asia?",
    "Run a supplier failure scenario",
    "Show me critical alerts",
    "Analyze risks in Europe",
    "Simulate a port closure in North America",
  ];

  const handleSuggestedQuery = (query: string) => {
    setInputValue(query);
    inputRef.current?.focus();
  };

  return (
    <div className={`text-fallback ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-900 rounded-lg">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Text Mode</h2>
            <p className="text-sm text-gray-400">Type your supply chain queries</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close text mode"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gray-800 rounded-lg inline-block">
              <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
              <p className="text-gray-400 text-sm">
                Start a conversation by typing a question below
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested queries */}
      {messages.length === 0 && (
        <div className="p-4 border-t border-gray-600 bg-gray-800">
          <p className="text-sm text-gray-400 mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuery(query)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-600 bg-gray-800">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your supply chain question..."
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            
            {/* Character count */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className={`text-xs ${
                inputValue.length > 200 ? 'text-red-400' : 'text-gray-500'
              }`}>
                {inputValue.length}/500
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || inputValue.length > 500}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2v4a8 8 0 0 1 8 8h4c0-6.627-5.373-12-12-12z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </p>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span>Secure text mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing text fallback state
export function useTextFallback() {
  const [isTextMode, setIsTextMode] = useState(false);
  const [textMessages, setTextMessages] = useState<Message[]>([]);

  const enableTextMode = () => {
    setIsTextMode(true);
  };

  const disableTextMode = () => {
    setIsTextMode(false);
  };

  const addTextMessage = (content: string, role: 'user' | 'agent') => {
    const message: Message = {
      role,
      content,
      timestamp: new Date(),
    };
    setTextMessages(prev => [...prev, message]);
  };

  const clearTextMessages = () => {
    setTextMessages([]);
  };

  return {
    isTextMode,
    textMessages,
    enableTextMode,
    disableTextMode,
    addTextMessage,
    clearTextMessages,
  };
}