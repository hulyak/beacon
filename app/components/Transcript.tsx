'use client';

import { useEffect, useRef } from 'react';
import type { Message } from './VoiceAgent';

export interface TranscriptProps {
  messages: Message[];
  maxMessages?: number;
  autoScroll?: boolean;
  className?: string;
}

export default function Transcript({
  messages,
  maxMessages = 50,
  autoScroll = true,
  className = '',
}: TranscriptProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Limit messages to maxMessages
  const displayMessages = messages.slice(-maxMessages);

  // Format timestamp
  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format message content for display
  const formatMessageContent = (content: string): string => {
    // Clean up any extra whitespace
    return content.trim();
  };

  // Get message styling based on role
  const getMessageClasses = (role: 'user' | 'agent'): string => {
    const baseClasses = 'flex flex-col space-y-1 p-3 rounded-lg max-w-[80%] break-words';
    
    if (role === 'user') {
      return `${baseClasses} bg-blue-600 text-white ml-auto`;
    } else {
      return `${baseClasses} bg-gray-700 text-gray-100 mr-auto`;
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: 'user' | 'agent'): string => {
    return role === 'user' ? 'You' : 'Beacon';
  };

  // Group consecutive messages from the same role
  const groupMessages = (messages: Message[]): Array<{
    role: 'user' | 'agent';
    messages: Message[];
    timestamp: Date;
  }> => {
    if (messages.length === 0) return [];

    const groups: Array<{
      role: 'user' | 'agent';
      messages: Message[];
      timestamp: Date;
    }> = [];

    let currentGroup = {
      role: messages[0].role,
      messages: [messages[0]],
      timestamp: messages[0].timestamp,
    };

    for (let i = 1; i < messages.length; i++) {
      const message = messages[i];
      
      // If same role and within 30 seconds, group together
      const timeDiff = message.timestamp.getTime() - currentGroup.timestamp.getTime();
      if (message.role === currentGroup.role && timeDiff < 30000) {
        currentGroup.messages.push(message);
      } else {
        groups.push(currentGroup);
        currentGroup = {
          role: message.role,
          messages: [message],
          timestamp: message.timestamp,
        };
      }
    }
    
    groups.push(currentGroup);
    return groups;
  };

  const messageGroups = groupMessages(displayMessages);

  if (messages.length === 0) {
    return (
      <div className={`transcript-container ${className}`}>
        <div className="flex items-center justify-center h-32 text-gray-500 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2 opacity-50"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z" />
              <path d="M12 18.5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z" />
            </svg>
            <p className="text-sm">Start a conversation to see the transcript</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`transcript-container ${className}`}>
      <div 
        ref={scrollRef}
        className="transcript-messages bg-gray-900 rounded-lg border border-gray-700 p-4 h-64 overflow-y-auto space-y-4"
        role="log"
        aria-label="Conversation transcript"
        aria-live="polite"
      >
        {messageGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className={`message-group ${group.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
          >
            <div className={getMessageClasses(group.role)}>
              {/* Role and timestamp header */}
              <div className="flex items-center justify-between text-xs opacity-75 mb-1">
                <span className="font-medium">
                  {getRoleDisplayName(group.role)}
                </span>
                <span>
                  {formatTimestamp(group.timestamp)}
                </span>
              </div>
              
              {/* Messages in this group */}
              <div className="space-y-2">
                {group.messages.map((message, messageIndex) => (
                  <div
                    key={messageIndex}
                    className="message-content text-sm leading-relaxed"
                  >
                    {formatMessageContent(message.content)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {/* Scroll anchor */}
        <div ref={endRef} />
      </div>
      
      {/* Message count indicator */}
      {messages.length > 0 && (
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          {messages.length >= maxMessages && (
            <span className="text-yellow-500">
              Showing last {maxMessages} messages
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Export additional utility components
export function TranscriptMessage({ 
  message, 
  showTimestamp = true 
}: { 
  message: Message; 
  showTimestamp?: boolean; 
}): React.JSX.Element {
  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageClasses = (role: 'user' | 'agent'): string => {
    const baseClasses = 'p-3 rounded-lg max-w-[80%] break-words';
    
    if (role === 'user') {
      return `${baseClasses} bg-blue-600 text-white ml-auto`;
    } else {
      return `${baseClasses} bg-gray-700 text-gray-100 mr-auto`;
    }
  };

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={getMessageClasses(message.role)}>
        {showTimestamp && (
          <div className="text-xs opacity-75 mb-1">
            {message.role === 'user' ? 'You' : 'Beacon'} • {formatTimestamp(message.timestamp)}
          </div>
        )}
        <div className="text-sm leading-relaxed">
          {message.content.trim()}
        </div>
      </div>
    </div>
  );
}

// Typing indicator component
export function TypingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-700 text-gray-100 p-3 rounded-lg max-w-[80%]">
        <div className="flex items-center space-x-1">
          <span className="text-xs opacity-75">Beacon is thinking</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce animation-delay-75"></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce animation-delay-150"></div>
          </div>
        </div>
      </div>
    </div>
  );
}